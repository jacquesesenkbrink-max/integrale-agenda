<script setup>
import { ref, computed, nextTick } from 'vue';

const props = defineProps({
  items: Array,
  isAdmin: Boolean
});

// Event om naar de parent te sturen voor navigatie
const emit = defineEmits(['navigate-to-topic']);

// --- STATE ---
const isCompact = ref(false); 

// --- COMPUTED: STATISTIEKEN ---
const monthNames = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", "Juli", "Augustus", "September", "Oktober", "November", "December"];

// Helper om van een Date object een "YYYY-MM" key te maken
function getMonthKey(dateObj) {
    if (!dateObj || dateObj.getFullYear() === 9999) return '9999-99';
    const year = dateObj.getFullYear();
    const monthIndex = dateObj.getMonth();
    return `${year}-${String(monthIndex+1).padStart(2, '0')}`;
}

const monthStats = computed(() => {
    const stats = {};
    props.items.forEach(ev => {
        if (!ev.dateObj) return;
        const key = getMonthKey(ev.dateObj);
        
        if (!stats[key]) {
            const year = ev.dateObj.getFullYear();
            const monthIndex = ev.dateObj.getMonth();
            const label = year === 9999 ? 'Datum onbekend' : `${monthNames[monthIndex]} ${year}`;
            stats[key] = { name: label, count: 0, sortKey: key };
        }
        stats[key].count++;
    });
    return Object.values(stats).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
});

const busyMonths = computed(() => monthStats.value.filter(m => m.count > 7).map(m => m.name));

// --- COMPUTED: COMPACTE LIJST (UNIEKE ONDERWERPEN) ---
const compactItems = computed(() => {
    const uniqueMap = new Map();
    props.items.forEach(ev => {
        const item = ev.originalItem;
        if (!item || uniqueMap.has(item.id)) return;
        uniqueMap.set(item.id, item);
    });
    return Array.from(uniqueMap.values());
});

// --- NAVIGATION & SCROLL ---

// Check of de huidige rij een nieuwe maand start t.o.v. de vorige rij
function isNewMonth(index) {
    if (index === 0) return true;
    const currentKey = getMonthKey(props.items[index].dateObj);
    const prevKey = getMonthKey(props.items[index - 1].dateObj);
    return currentKey !== prevKey;
}

// Scroll naar de specifieke maand in de tabel
function scrollToMonth(sortKey) {
    // Forceer gedetailleerde weergave, anders zijn de rijen er niet
    isCompact.value = false;

    // Wacht tot Vue de DOM heeft geüpdatet
    nextTick(() => {
        const element = document.getElementById(`anchor-${sortKey}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Kleine highlight effect
            element.classList.add('highlight-flash');
            setTimeout(() => element.classList.remove('highlight-flash'), 1500);
        }
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- HELPERS ---
function getStatusClass(count) {
    if (count > 7) return 'high'; 
    if (count >= 3) return 'med'; 
    return 'low';
}

function getStatusText(count) {
    if (count > 7) return 'Druk';
    if (count >= 3) return 'Normaal';
    return 'Rustig';
}

function handleRowClick(topicId) {
    emit('navigate-to-topic', topicId);
}

// Kleurcodes en labels
const typeColors = { 
  'PFO':'var(--c-pfo)', 
  'DBBesluit':'var(--c-db-besluit)', 
  'DBInformeel': 'var(--c-db-informeel)',
  'ABBesluit':'var(--c-ab-besluit)', 
  'Delta':'var(--c-delta)' 
};

const typeLabels = { 
  'PFO':'PFO', 
  'DBBesluit':'DB Besluit', 
  'DBInformeel': 'Informeel DB', 
  'ABBesluit':'AB Besluit', 
  'Delta':'Delta' 
};
</script>

<template>
  <div class="report-container">
    <div class="report-header">
        <div class="header-title">
            <h2>Bestuurlijke Rapportage</h2>
            <p class="subtitle">Gegenereerd op: {{ new Date().toLocaleDateString('nl-NL') }}</p>
        </div>
        
        <div class="view-switcher">
            <button 
                class="switch-btn" 
                :class="{ active: !isCompact }" 
                @click="isCompact = false"
            >
                📄 Gedetailleerd
            </button>
            <button 
                class="switch-btn" 
                :class="{ active: isCompact }" 
                @click="isCompact = true"
            >
                📑 Compact
            </button>
        </div>
    </div>

    <div v-if="busyMonths.length > 0 && !isCompact" class="report-summary-text">
        <strong>⚠️ Analyse Bestuurlijke Drukte:</strong> 
        Er zijn piekmomenten (meer dan 7 agendapunten) in: <em>{{ busyMonths.join(', ') }}</em>.
    </div>

    <div v-if="!isCompact" class="report-dashboard">
        <div 
            v-for="stat in monthStats" :key="stat.sortKey" 
            class="dashboard-card clickable-card" 
            :class="'border-' + getStatusClass(stat.count)"
            @click="scrollToMonth(stat.sortKey)"
            title="Klik om naar deze maand te springen"
        >
            <h5>{{ stat.name }}</h5>
            <div class="count">{{ stat.count }}</div>
            <div class="status" :class="getStatusClass(stat.count)">{{ getStatusText(stat.count) }}</div>
            <div class="hover-hint">Ga naar ↓</div>
        </div>
    </div>

    <div class="list-header">
        <h3>{{ isCompact ? 'Compact Overzicht (Chronologisch)' : 'Gedetailleerd Tijdlijn Overzicht' }}</h3>
        <p class="hint-text">💡 Klik op een rij om naar het kaartje te springen.</p>
    </div>
    
    <table v-if="!isCompact" class="report-table">
        <thead>
            <tr>
                <th style="width:100px">Datum</th>
                <th style="width:140px">Fase</th>
                <th>Onderwerp</th>
                <th style="width:150px">Rollen</th>
                <th style="width:120px">Label</th>
            </tr>
        </thead>
        <tbody>
            <template v-for="(ev, index) in items" :key="ev.uniqueId">
                
                <tr 
                    v-if="isNewMonth(index)" 
                    :id="'anchor-' + getMonthKey(ev.dateObj)"
                    class="month-divider-row"
                >
                    <td colspan="5">
                        <div class="month-divider-content">
                            <span>📅 {{ monthNames[ev.dateObj.getMonth()] }} {{ ev.dateObj.getFullYear() }}</span>
                            <button class="back-to-top-btn" @click.stop="scrollToTop" title="Terug naar overzicht">
                                ⬆ Overzicht
                            </button>
                        </div>
                    </td>
                </tr>

                <tr 
                    @click="handleRowClick(ev.topicId)"
                    class="clickable-row"
                >
                    <td>{{ ev.dateDisplay }}</td>
                    <td>
                        <span class="status-dot" :style="{ background: typeColors[ev.type] || '#ccc' }"></span>
                        {{ typeLabels[ev.type] || ev.type }}
                    </td>
                    <td>
                        <strong>{{ ev.title }}</strong>
                        <div v-if="isAdmin && ev.comments" class="table-note">Opmerking: {{ ev.comments }}</div>
                    </td>
                    <td>
                        <small>PH: {{ ev.ph || '-' }}<br>
                        <span v-if="ev.originalItem.administrativeContact">
                            <strong>🗣️: {{ ev.originalItem.administrativeContact }}</strong><br>
                        </span>
                        Dir: {{ ev.dir || '-' }}</small>
                    </td>
                    <td><small>{{ ev.strategicLabel || '-' }}</small></td>
                </tr>
            </template>
        </tbody>
    </table>

    <table v-else class="report-table compact-table">
        <thead>
            <tr>
                <th>Onderwerp</th>
                <th style="width:100px">PH</th>
                
                <th class="col-date col-pfo">PFO</th>
                <th class="col-date col-inf">Inf. DB</th>
                <th class="col-date col-db">DB Besluit</th>
                <th class="col-date col-delta">Delta</th>
                <th class="col-date col-ab">AB Besluit</th>
            </tr>
        </thead>
        <tbody>
            <tr 
                v-for="item in compactItems" 
                :key="item.id" 
                @click="handleRowClick(item.id)"
                class="clickable-row"
            >
                <td>
                    <strong>{{ item.title }}</strong>
                    <div v-if="isAdmin && item.comments" class="table-note">{{ item.comments }}</div>
                </td>
                <td>
                    {{ item.ph }}
                    <div v-if="item.administrativeContact" style="font-size: 0.75rem; color: #666;">
                        🗣️ {{ item.administrativeContact }}
                    </div>
                </td>
                
                <td class="center-text">{{ item.schedule?.PFO || '-' }}</td>
                <td class="center-text">{{ item.schedule?.DBInformeel || '-' }}</td>
                <td class="center-text">{{ item.schedule?.DBBesluit || '-' }}</td>
                <td class="center-text">{{ item.schedule?.Delta || '-' }}</td>
                <td class="center-text">{{ item.schedule?.ABBesluit || '-' }}</td>
            </tr>
        </tbody>
    </table>

  </div>
</template>

<style scoped>
.report-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }

/* Header & Toggle */
.report-header { 
    display: flex; justify-content: space-between; align-items: flex-start; 
    margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; flex-wrap: wrap; gap: 15px;
}
.header-title h2 { margin: 0; color: #2c3e50; }
.subtitle { margin: 5px 0 0 0; color: #7f8c8d; font-size: 0.9rem; }

.view-switcher { background: #f0f2f5; padding: 4px; border-radius: 8px; display: flex; gap: 5px; }
.switch-btn { 
    border: none; background: transparent; padding: 6px 15px; border-radius: 6px; 
    cursor: pointer; color: #666; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; 
}
.switch-btn.active { background: white; color: #2c3e50; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

/* SUMMARY (Blauwe blok) */
.report-summary-text {
    background: #eaf2f8; padding: 15px; border-left: 5px solid #3498db;
    margin-bottom: 25px; border-radius: 4px; color: #2c3e50;
}

.list-header { margin-top: 20px; margin-bottom: 10px; }
.hint-text { color: #666; font-style: italic; font-size: 0.9rem; margin-top: 5px; }

/* DASHBOARD GRID */
.report-dashboard {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 15px; margin-bottom: 30px;
}
.dashboard-card {
    background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 15px 10px;
    text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border-top-width: 4px; border-top-style: solid;
    position: relative; transition: transform 0.2s, box-shadow 0.2s;
}
.clickable-card { cursor: pointer; }
.clickable-card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
.clickable-card:active { transform: translateY(0); }

.hover-hint { 
    display: none; font-size: 0.7rem; color: #3498db; margin-top: 5px; font-weight: bold; 
}
.clickable-card:hover .hover-hint { display: block; }

.dashboard-card.border-low { border-top-color: #27ae60; }
.dashboard-card.border-med { border-top-color: #e67e22; }
.dashboard-card.border-high { border-top-color: #c0392b; }

.dashboard-card h5 { margin: 0 0 5px 0; font-size: 0.9rem; color: #666; }
.dashboard-card .count { font-size: 1.8rem; font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
.dashboard-card .status { font-size: 0.7rem; text-transform: uppercase; font-weight: bold; padding: 2px 8px; border-radius: 10px; color: white; display: inline-block;}

.status.low { background-color: #27ae60; }
.status.med { background-color: #e67e22; }
.status.high { background-color: #c0392b; }

/* TABLE STYLING */
.report-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 10px; }
.report-table th, .report-table td { border: 1px solid #ddd; padding: 10px 10px; text-align: left; vertical-align: top; }
.report-table th { background-color: #2c3e50; color: white; position: sticky; top: 0; font-weight: 600; z-index: 10; }
.report-table tr:nth-child(even) { background-color: #f9f9f9; }

.clickable-row { cursor: pointer; transition: background-color 0.15s; }
.clickable-row:hover { background-color: #e3f2fd !important; }

/* MONTH DIVIDER ROW */
.month-divider-row { background-color: #eaf2f8 !important; border-top: 2px solid #3498db; scroll-margin-top: 60px; }
.month-divider-row td { padding: 8px 15px; }
.month-divider-content { display: flex; justify-content: space-between; align-items: center; font-weight: bold; color: #2c3e50; font-size: 1rem; }

.back-to-top-btn {
    background: transparent; border: 1px solid #3498db; color: #3498db; 
    border-radius: 4px; padding: 2px 8px; font-size: 0.75rem; cursor: pointer;
}
.back-to-top-btn:hover { background: #3498db; color: white; }

/* Flash effect for anchor jump */
@keyframes flashHighlight {
    0% { background-color: #ffeaa7; }
    100% { background-color: #eaf2f8; }
}
.highlight-flash { animation: flashHighlight 1.5s ease-out; }

.status-dot { height: 10px; width: 10px; border-radius: 50%; display: inline-block; margin-right: 6px; }
.table-note { color: #c0392b; font-style: italic; font-size: 0.75rem; margin-top: 4px; }

/* Compact Table specifics */
.compact-table th.col-date { 
    width: 90px; 
    text-align: center; 
    font-size: 0.8rem;
    border-top-width: 3px;
    border-top-style: solid;
}
.compact-table th.col-pfo   { border-top-color: var(--c-pfo); }
.compact-table th.col-inf   { border-top-color: var(--c-db-informeel); }
.compact-table th.col-db    { border-top-color: var(--c-db-besluit); }
.compact-table th.col-delta { border-top-color: var(--c-delta); }
.compact-table th.col-ab    { border-top-color: var(--c-ab-besluit); }

.compact-table td.center-text { 
    text-align: center; 
    white-space: nowrap; 
    font-variant-numeric: tabular-nums; 
}
.compact-table th { white-space: nowrap; }
</style>