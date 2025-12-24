<script setup>
import { computed } from 'vue';

const props = defineProps({
  event: Object,      // Het agenda-item (met datum, titel, etc.)
  isAdmin: Boolean,   // Is de gebruiker ingelogd?
  isFocused: Boolean, // Heeft dit onderwerp focus?
  isCompact: Boolean  // Moeten we de "Stippen" weergave tonen?
});

const emit = defineEmits(['edit', 'delete', 'toggle-focus', 'open-details']);

// Kleuren per fase (Gremium)
const colors = { 
  'PFO':'var(--c-pfo)', 
  'DBBesluit':'var(--c-db-besluit)', 
  'DBInformeel': 'var(--c-db-informeel)',
  'Delta':'var(--c-delta)',
  'ABBesluit':'var(--c-ab-besluit)'
};

// Labels voor weergave fases
const labels = { 
  'PFO':'PFO', 
  'DBBesluit':'DB Besluit', 
  'DBInformeel': 'Informeel DB', 
  'Delta':'Delta',
  'ABBesluit':'AB Besluit'
};

// Kleuren voor de Status badges
const statusColors = {
    'Concept': '#95a5a6',     // Grijs
    'Ingediend': '#f39c12',   // Oranje
    'Geagendeerd': '#3498db', // Blauw
    'Afgerond': '#27ae60'     // Groen
};

// Kleur bepalen voor rand
const borderColor = computed(() => colors[props.event.type] || '#ccc');
const phaseLabel = computed(() => labels[props.event.type] || props.event.type);

// Status per fase ophalen
const currentStatus = computed(() => {
    const item = props.event.originalItem;
    if (item.scheduleStatus && item.scheduleStatus[props.event.type]) {
        return item.scheduleStatus[props.event.type];
    }
    return 'Concept'; 
});

// Tooltip tekst
const tooltipText = computed(() => `${props.event.title} (${props.event.dateDisplay}) - ${currentStatus.value}`);
</script>

<template>
  <div 
    class="card-wrapper" 
    :class="[
        'col-' + event.type, 
        { 'is-focused': isFocused },
        { 'view-dots': isCompact } 
    ]"
    :id="'card-' + event.topicId + '-' + event.type"
    :style="isCompact ? { background: borderColor, boxShadow: '0 0 5px ' + borderColor } : { borderTopColor: borderColor }"
    @click="$emit('toggle-focus', event.topicId)"
    :data-tooltip="tooltipText"
  >
    <div class="content">
        <template v-if="!isCompact">
            <div class="header-row">
                <span class="date-badge">📅 {{ event.dateDisplay }}</span>
                
                <div class="actions" v-if="isAdmin">
                    <button class="btn-icon edit" @click.stop="$emit('edit', event.originalItem)">✏️</button>
                    <button class="btn-icon delete" @click.stop="$emit('delete', event.originalItem)">🗑️</button>
                </div>
            </div>
            
            <div class="badge-row">
                <span class="strat-badge" v-if="event.strategicLabel">{{ event.strategicLabel }}</span>
                
                <span 
                    class="status-badge" 
                    :style="{ backgroundColor: statusColors[currentStatus] || '#999' }"
                >
                    {{ currentStatus }}
                </span>
            </div>
            
            <h3>{{ phaseLabel }}</h3>
            <h4>{{ event.title }}</h4>
            
            <div class="role-grid">
                <div class="role-item"><strong>PH:</strong> {{ event.ph }}</div>
                
                <div class="role-item" v-if="event.dir"><strong>Dir:</strong> {{ event.dir }}</div>

                <div v-if="event.originalItem.administrativeContact" class="role-item highlight-contact">
                    <strong>🗣️:</strong> {{ event.originalItem.administrativeContact }}
                </div>
            </div>

            <div v-if="event.comments && isAdmin" class="comments-box">
                🔒 {{ event.comments }}
            </div>

            <div class="card-footer">
                <div class="card-action-btn" @click.stop="$emit('open-details', event.originalItem)">
                    👁 Details
                </div>
            </div>

        </template>
    </div>
  </div>
</template>

<style scoped>
/* --- BASIS STIJL --- */
.card-wrapper {
    background: white; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    border-top: 4px solid #ccc; padding: 1rem; margin-bottom: 1rem; 
    transition: all 0.3s ease; position: relative; cursor: pointer;
    min-height: 140px; 
    opacity: 1; filter: grayscale(0%);
    display: flex; flex-direction: column; /* Zorgt dat content rekt */
}
.card-wrapper:hover { transform: translateY(-3px); box-shadow: 0 8px 15px rgba(0,0,0,0.15); }

/* --- STIPPEN MODUS --- */
.card-wrapper.view-dots {
    width: 40px; height: 40px; 
    border-radius: 50%; 
    padding: 0; 
    border-top: none !important; 
    margin: 0 auto 5px auto;
    min-height: 0;
    display: flex; align-items: center; justify-content: center;
    overflow: visible; 
}

/* Tooltip */
.card-wrapper.view-dots::after {
    content: attr(data-tooltip);
    position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%);
    background: #333; color: #fff; padding: 5px 10px; border-radius: 4px;
    font-size: 0.75rem; white-space: nowrap; opacity: 0; pointer-events: none;
    transition: opacity 0.2s; z-index: 1000; box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}
.card-wrapper.view-dots:hover::after { opacity: 1; }

.card-wrapper.view-dots::before {
    content: ''; position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
    border-width: 5px; border-style: solid; border-color: #333 transparent transparent transparent;
    opacity: 0; transition: opacity 0.2s; pointer-events: none; z-index: 1000;
}
.card-wrapper.view-dots:hover::before { opacity: 1; }

/* --- FOCUS MODUS --- */
.is-focused { z-index: 20; transform: scale(1.05); opacity: 1 !important; filter: grayscale(0%) !important; }
.card-wrapper.view-dots.is-focused { border: 3px solid white; box-shadow: 0 0 0 3px #333; transform: scale(1.3); }

/* --- INTERNE ELEMENTEN --- */
.content { flex: 1; display: flex; flex-direction: column; }

.header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
.date-badge { font-family: monospace; font-size: 0.75rem; color: #666; font-weight: bold; }

.badge-row { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 5px; }

.strat-badge { 
    background: #e2e8f0; padding: 2px 6px; border-radius: 4px; 
    font-weight: bold; color: #475569; font-size: 0.7rem; 
}

.status-badge {
    padding: 2px 6px; border-radius: 4px;
    font-weight: bold; color: white; font-size: 0.7rem;
    text-transform: uppercase;
}

h3 { margin: 0; font-size: 0.75rem; text-transform: uppercase; color: #999; }
h4 { margin: 0 0 10px 0; color: #2c3e50; font-size: 0.9rem; line-height: 1.3; }

.role-grid { font-size: 0.75rem; color: #666; margin-bottom: 10px; }
.role-item { margin-bottom: 2px; }

.comments-box { background: #fff3cd; color: #856404; padding: 5px; border-radius: 4px; font-size: 0.75rem; margin-bottom: 5px; }

.highlight-contact {
    color: #2c3e50;
    margin-top: 4px;
    font-weight: 500;
    background: rgba(0,0,0,0.03);
    padding: 2px 4px;
    border-radius: 3px;
    display: inline-block;
}

.actions { display: flex; gap: 5px; }
.btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0.5; transition: 0.2s; }
.btn-icon:hover { opacity: 1; transform: scale(1.2); }

.card-footer { border-top: 1px solid #eee; padding-top: 5px; text-align: right; margin-top: auto; }
.card-action-btn { font-size: 0.75rem; font-weight: bold; color: #3498db; text-transform: uppercase; cursor: pointer; display: inline-block; }
.card-action-btn:hover { text-decoration: underline; }

@media (min-width: 1100px) {
    .col-PFO { grid-column: 1; }
    .col-DBBesluit { grid-column: 2; }
    .col-DBInformeel { grid-column: 3; }
    .col-Delta { grid-column: 4; }
    .col-ABBesluit { grid-column: 5; }
}
</style>