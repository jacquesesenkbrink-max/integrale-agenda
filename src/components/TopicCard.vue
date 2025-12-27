<script setup>
import { computed } from 'vue';

const props = defineProps({
  event: Object,
  isAdmin: Boolean,
  isFocused: Boolean
  // isCompact is hier weggehaald, we tonen altijd de kaart
});

const emit = defineEmits(['toggle-focus', 'open-details', 'edit', 'delete']);

// Bepaal de kleur op basis van de status
const statusColor = computed(() => {
  const map = {
    'Concept': '#f1c40f',    // Geel
    'Ingediend': '#e67e22',  // Oranje
    'Geagendeerd': '#3498db',// Blauw
    'Afgerond': '#27ae60'    // Groen
  };
  return map[props.event.originalItem?.scheduleStatus?.[props.event.type]] || '#95a5a6';
});

const cardClasses = computed(() => ({
  'is-focused': props.isFocused,
  'is-admin': props.isAdmin
}));
</script>

<template>
  <div class="card-wrapper" :class="cardClasses" :id="'card-' + event.uniqueId">
    <div class="topic-card" :style="{ borderTopColor: statusColor }">
      
      <div class="card-header">
        <span class="date-badge">{{ event.dateDisplay }}</span>
        
        <div class="card-actions">
           <button 
             class="icon-btn focus-btn" 
             @click.stop="emit('toggle-focus', event.topicId)"
             :title="isFocused ? 'Verwijder focus' : 'Focus op dit dossier'"
           >
             {{ isFocused ? '◉' : '◎' }}
           </button>

           <template v-if="isAdmin">
             <button class="icon-btn edit-btn" @click.stop="emit('edit', event.originalItem)">✏️</button>
             <button class="icon-btn delete-btn" @click.stop="emit('delete', event.originalItem)">🗑️</button>
           </template>
        </div>
      </div>

      <div class="card-body" @click="emit('open-details', event.originalItem)">
        <h4 class="topic-title">{{ event.title }}</h4>
        
        <div class="meta-info">
            <span v-if="event.ph" class="pill ph-pill" title="Portefeuillehouder">👤 {{ event.ph }}</span>
            <span v-if="event.strategicLabel" class="pill label-pill">🏷️ {{ event.strategicLabel }}</span>
        </div>
        
        <div class="status-row">
            <span class="status-dot" :style="{ backgroundColor: statusColor }"></span>
            <span class="status-text">{{ event.originalItem?.scheduleStatus?.[event.type] || 'Concept' }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.card-wrapper {
  position: relative;
  height: 100%; /* Zorg dat hij de grid-cel vult */
  transition: all 0.3s ease;
}

.topic-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-top: 4px solid #ccc; /* Wordt overschreven door inline style */
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 140px; /* Minimale hoogte voor consistentie */
  transition: transform 0.2s, box-shadow 0.2s;
}

.topic-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.date-badge {
  font-size: 0.75rem;
  font-weight: bold;
  color: #7f8c8d;
  background: #ecf0f1;
  padding: 2px 6px;
  border-radius: 4px;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 2px;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.icon-btn:hover { opacity: 1; transform: scale(1.1); }
.delete-btn:hover { color: #c0392b; }
.edit-btn:hover { color: #2980b9; }
.focus-btn { font-size: 1.2rem; line-height: 1; }

.card-body {
  padding: 12px;
  flex: 1;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.topic-title {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.3;
  color: #2c3e50;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto; /* Duw naar beneden */
}

.pill {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ph-pill { background: #e8f6f3; color: #16a085; }
.label-pill { background: #fef9e7; color: #f1c40f; }

.status-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #666;
    margin-top: 6px;
}
.status-dot {
    width: 8px; height: 8px; border-radius: 50%;
}

/* Focus styles wrapper */
.card-wrapper.is-focused .topic-card {
    box-shadow: 0 0 0 3px #f1c40f, 0 5px 15px rgba(0,0,0,0.2);
    border-color: #f1c40f !important;
}
</style>