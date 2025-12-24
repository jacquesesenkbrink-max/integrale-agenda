<script setup>
import { ref, computed, onMounted, watch } from 'vue';

const props = defineProps({
  items: Array,
  activeFilter: String,
  isAdmin: Boolean
});

// Opslag voor vergaderdetails (tijd/locatie/soort stuk) én volgorde/tijdsduur
const meetingMeta = ref({});

// Filters
const selectedDate = ref('');

onMounted(() => {
  const saved = localStorage.getItem('meeting-meta-data');
  if (saved) meetingMeta.value = JSON.parse(saved);
});

watch(meetingMeta, (newVal) => {
  localStorage.setItem('meeting-meta-data', JSON.stringify(newVal));
}, { deep: true });

// --- HELPER FUNCTIE VOOR VOLGORDE ---
function getMeetingOrder(meetingKey) {
    return meetingMeta.value[meetingKey + '_sortOrder'] || [];
}

// --- 1. DATA TRANSFORMATIE ---
const agendaMeetings = computed(() => {
    const meetingsMap = {};

    props.items.forEach(ev => {
        const dateStr = ev.dateDisplay;
        const type = ev.type;

        // Skip items zonder datum of met 'Q' notatie
        if (!dateStr || dateStr.toLowerCase().includes('q')) return;

        let meetingKey = '';
        let meetingTitle = '';
        let groupPh = ''; 

        if (type === 'PFO') {
            // PFO splitsen we per PH
            groupPh = ev.ph ? ev.ph.split('/')[0].trim() : 'Onbekend';
            meetingKey = `${dateStr}_${type}_${groupPh}`;
            meetingTitle = `PFO ${groupPh}`;
        } else {
            // DB en AB zijn "Algemeen"
            groupPh = 'Algemeen'; 
            meetingKey = `${dateStr}_${type}`;
            meetingTitle = mapTypeToTitle(type);
        }

        if (!meetingsMap[meetingKey]) {
            meetingsMap[meetingKey] = {
                key: meetingKey,
                dateDisplay: dateStr,
                dateObj: ev.dateObj,
                title: meetingTitle,
                type: type,
                ph: groupPh,
                items: []
            };
        }

        meetingsMap[meetingKey].items.push(ev);
    });

    // NU SORTEREN PER MEETING OP BASIS VAN OPGESLAGEN VOLGORDE
    Object.values(meetingsMap).forEach(meeting => {
        const orderArr = getMeetingOrder(meeting.key);
        if (orderArr.length > 0) {
            meeting.items.sort((a, b) => {
                const idxA = orderArr.indexOf(a.uniqueId);
                const idxB = orderArr.indexOf(b.uniqueId);
                
                // Als beide items een opgeslagen positie hebben
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                
                // Als alleen A in de lijst staat, komt die eerst
                if (idxA !== -1) return -1;
                
                // Als alleen B in de lijst staat, komt die eerst
                if (idxB !== -1) return 1;
                
                // Anders behoud originele volgorde (of sorteer op ID als fallback)
                return 0;
            });
        }
    });

    // Sorteer meetings zelf op datum
    return Object.values(meetingsMap).sort((a, b) => a.dateObj - b.dateObj);
});

// --- 2. FILTER LOGICA ---

// Lijst met unieke datums voor de dropdown
const uniqueDates = computed(() => {
    const dates = new Set(agendaMeetings.value.map(m => m.dateDisplay));
    return Array.from(dates).sort((a, b) => {
        // Simpele sorteer hack voor dd-mm-yyyy (anders alfabetisch)
        const [d1, m1, y1] = a.split('-');
        const [d2, m2, y2] = b.split('-');
        return new Date(y1, m1-1, d1) - new Date(y2, m2-1, d2);
    });
});

// De gefilterde lijst die we tonen
const filteredMeetings = computed(() => {
    return agendaMeetings.value.filter(meeting => {
        // Datum filter
        if (selectedDate.value && meeting.dateDisplay !== selectedDate.value) {
            return false;
        }
        return true;
    });
});

// --- ACTIES VOOR ADMIN (VOLGORDE) ---
function moveItem(meeting, index, direction) {
    const items = [...meeting.items]; // Kopieer huidige gesorteerde items
    const targetIndex = index + direction;
    
    // Check grenzen
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    // Wissel items in de array
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    
    // Sla de NIEUWE volgorde van ID's op in meetingMeta
    const newOrder = items.map(i => i.uniqueId);
    meetingMeta.value[meeting.key + '_sortOrder'] = newOrder;
}


// --- HELPERS ---
function mapTypeToTitle(type) {
    const labels = { 
        'DBBesluit': 'DB Besluitvormend', 
        'DBInformeel': 'DB Informeel', 
        'ABBesluit': 'AB Vergadering', 
        'Delta': 'Deltabijeenkomst'
    };
    return labels[type] || type;
}

function getDayName(dateObj) {
    if(!dateObj) return '';
    return dateObj.toLocaleDateString('nl-NL', { weekday: 'long' });
}

// Bepaal de opties voor 'Soort Stuk' op basis van vergadering type
function getDocOptions(type) {
    if (type.startsWith('DB')) {
        return ['Bespreekstuk', 'Hamerstuk', 'Schriftelijke mededeling', 'Nader te bepalen'];
    }
    if (type.startsWith('AB')) {
        return ['Bespreekstuk', 'Hamerstuk', 'Brief van DB aan AB', 'Nader te bepalen'];
    }
    return [];
}

const typeColors = { 
  'PFO':'var(--c-pfo)', 
  'DBBesluit':'var(--c-db-besluit)', 
  'DBInformeel': 'var(--c-db-informeel)',
  'ABBesluit':'var(--c-ab-besluit)', 
  'Delta':'var(--c-delta)' 
};

function printAgenda() {
    window.print();
}

function resetFilters() {
    selectedDate.value = '';
}
</script>

<template>
  <div class="agenda-view-container">
    
    <div class="no-print header-block">
        <div class="header-top">
            <h2>🗓️ Agenda Samenstelling</h2>
            <button @click="printAgenda" class="print-btn">🖨️ Print Lijst</button>
        </div>
        
        <p class="intro-text">
            Beheer tijden/locaties en filter de lijst voor export.
            <span v-if="isAdmin"><strong>(Admin modus actief: U kunt volgorde, tijdsduur en soort stuk aanpassen)</strong></span>
        </p>

        <div class="filters-bar">
            <div class="filter-group">
                <label>📅 Filter op Datum:</label>
                <select v-model="selectedDate">
                    <option value="">-- Alle Datums --</option>
                    <option v-for="d in uniqueDates" :key="d" :value="d">{{ d }}</option>
                </select>
            </div>

            <button v-if="selectedDate" class="reset-link" @click="resetFilters">
                Datumfilter wissen
            </button>
        </div>
    </div>

    <div v-if="filteredMeetings.length === 0" class="empty-state">
        Geen vergaderingen gevonden met deze filters.
    </div>

    <div class="timeline-stream">
        <div v-for="meeting in filteredMeetings" :key="meeting.key" class="meeting-card">
            
            <div class="meeting-header" :style="{ borderLeftColor: typeColors[meeting.type] || '#ccc' }">
                <div class="meeting-date">
                    <span class="day">{{ getDayName(meeting.dateObj) }}</span>
                    <span class="date">{{ meeting.dateDisplay }}</span>
                </div>
                <div class="meeting-title">
                    <h3>{{ meeting.title }}</h3>
                    <span class="item-count">{{ meeting.items.length }} agendapunten</span>
                </div>
            </div>

            <div class="meeting-meta no-print">
                <div class="input-group">
                    <label>🕐 Tijdstip:</label>
                    <input v-if="isAdmin" v-model="meetingMeta[meeting.key + '_time']" placeholder="bijv. 09:00 - 10:30" />
                    <span v-else>{{ meetingMeta[meeting.key + '_time'] || '-' }}</span>
                </div>
                <div class="input-group">
                    <label>📍 Bespreekruimte:</label>
                    <input v-if="isAdmin" v-model="meetingMeta[meeting.key + '_room']" placeholder="bijv. Kamer 3.02" />
                    <span v-else>{{ meetingMeta[meeting.key + '_room'] || '-' }}</span>
                </div>
            </div>

            <div class="print-only meta-display" v-if="meetingMeta[meeting.key + '_time'] || meetingMeta[meeting.key + '_room']">
                <span v-if="meetingMeta[meeting.key + '_time']"><strong>Tijd:</strong> {{ meetingMeta[meeting.key + '_time'] }}</span>
                <span v-if="meetingMeta[meeting.key + '_room']" style="margin-left: 15px;"><strong>Locatie:</strong> {{ meetingMeta[meeting.key + '_room'] }}</span>
            </div>

            <table class="agenda-table">
                <thead>
                    <tr>
                        <th v-if="isAdmin" style="width: 40px" class="no-print">Volgorde</th>
                        
                        <th style="width: 30px">#</th>
                        
                        <th style="width: 80px">Tijd</th>
                        
                        <th>Onderwerp</th>
                        <th v-if="getDocOptions(meeting.type).length > 0" style="width: 160px">Soort Stuk</th>
                        <th style="width: 150px">Betrokkenen</th>
                        <th style="width: 100px">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(item, index) in meeting.items" :key="item.uniqueId">
                        
                        <td v-if="isAdmin" class="no-print sort-col">
                            <button class="sort-btn" @click="moveItem(meeting, index, -1)" :disabled="index === 0">▲</button>
                            <button class="sort-btn" @click="moveItem(meeting, index, 1)" :disabled="index === meeting.items.length - 1">▼</button>
                        </td>

                        <td class="index-col">{{ index + 1 }}.</td>

                        <td>
                            <div v-if="isAdmin" class="no-print">
                                <input 
                                    type="number" 
                                    class="duration-input" 
                                    v-model="meetingMeta[item.uniqueId + '_duration']" 
                                    placeholder="min"
                                >
                            </div>
                            <div v-if="!isAdmin || meetingMeta[item.uniqueId + '_duration']" class="duration-text">
                                <span v-if="meetingMeta[item.uniqueId + '_duration']">
                                    {{ meetingMeta[item.uniqueId + '_duration'] }} min
                                </span>
                                <span v-else style="color:#ccc">-</span>
                            </div>
                        </td>

                        <td>
                            <div class="topic-title">{{ item.title }}</div>
                        </td>
                        
                        <td v-if="getDocOptions(meeting.type).length > 0">
                            <select 
                                v-if="isAdmin"
                                class="no-print doc-type-select" 
                                v-model="meetingMeta[item.uniqueId + '_docType']"
                            >
                                <option value="">- Kies -</option>
                                <option v-for="opt in getDocOptions(meeting.type)" :key="opt" :value="opt">
                                    {{ opt }}
                                </option>
                            </select>

                            <div :class="{ 'print-only': isAdmin, 'doc-type-text': !isAdmin }">
                                {{ meetingMeta[item.uniqueId + '_docType'] || '-' }}
                            </div>
                        </td>

                        <td>
                            <div class="role-text" v-if="meeting.type !== 'PFO'">PH: {{ item.ph }}</div>
                            
                            <div class="role-text highlight" v-if="item.originalItem && item.originalItem.administrativeContact">
                                🗣️ {{ item.originalItem.administrativeContact }}
                            </div>

                            <div class="role-text">Dir: {{ item.dir }}</div>
                        </td>
                        <td>
                            <span class="badge">{{ item.strategicLabel || '-' }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>

        </div>
    </div>
  </div>
</template>

<style scoped>
.agenda-view-container { max-width: 1000px; margin: 0 auto; padding-bottom: 50px; }

/* HEADER & FILTERS */
.header-block { 
    background: white; padding: 20px; border-radius: 8px; 
    box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 30px; border: 1px solid #eee;
}
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.header-top h2 { margin: 0; color: #2c3e50; }
.intro-text { color: #666; margin-top: 0; font-size: 0.95rem; }

.filters-bar { 
    display: flex; gap: 15px; align-items: flex-end; margin-top: 15px; 
    padding-top: 15px; border-top: 1px solid #f0f0f0; flex-wrap: wrap;
}
.filter-group { display: flex; flex-direction: column; gap: 5px; }
.filter-group label { font-size: 0.85rem; font-weight: bold; color: #555; }
.filter-group select { 
    padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.95rem; min-width: 180px;
}

.print-btn { background: #2c3e50; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.print-btn:hover { background: #34495e; }

.reset-link { 
    background: none; border: none; color: #c0392b; text-decoration: underline; 
    cursor: pointer; font-size: 0.9rem; padding-bottom: 8px;
}

/* EMPTY STATE */
.empty-state { text-align: center; padding: 50px; color: #95a5a6; font-size: 1.1rem; border: 2px dashed #eee; border-radius: 8px; margin-top: 20px; }

/* MEETING CARD */
.meeting-card { 
    background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
    margin-bottom: 30px; overflow: hidden; page-break-inside: avoid;
    border: 1px solid #eee;
}

.meeting-header {
    display: flex; align-items: center; padding: 15px 20px;
    background: #f8f9fa; border-bottom: 1px solid #eee;
    border-left: 6px solid #ccc; 
}

.meeting-date { 
    display: flex; flex-direction: column; align-items: center; 
    margin-right: 20px; min-width: 80px; padding-right: 20px; border-right: 1px solid #ddd; 
}
.meeting-date .day { font-size: 0.8rem; text-transform: uppercase; color: #666; }
.meeting-date .date { font-size: 1.2rem; font-weight: bold; color: #2c3e50; }

.meeting-title h3 { margin: 0; font-size: 1.3rem; color: #2c3e50; }
.item-count { font-size: 0.85rem; color: #7f8c8d; }

/* META INPUTS */
.meeting-meta { display: flex; gap: 20px; padding: 15px 20px; background: #fffbe6; border-bottom: 1px solid #eee; }
.input-group { display: flex; align-items: center; gap: 10px; flex: 1; }
.input-group label { font-weight: bold; font-size: 0.9rem; color: #555; }
.input-group input { flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 4px; }
.meta-display { padding: 10px 20px; background: #f4f7f6; border-bottom: 1px solid #eee; font-size: 0.9rem; }

/* TABLE */
.agenda-table { width: 100%; border-collapse: collapse; }
.agenda-table th { text-align: left; padding: 10px 15px; background: #fff; border-bottom: 2px solid #eee; font-size: 0.8rem; text-transform: uppercase; color: #999; }
.agenda-table td { padding: 12px 15px; border-bottom: 1px solid #f0f0f0; vertical-align: top; font-size: 0.95rem; }
.agenda-table tr:last-child td { border-bottom: none; }

.index-col { color: #999; font-weight: bold; }
.topic-title { font-weight: 600; color: #2c3e50; margin-bottom: 4px; }

.role-text { font-size: 0.8rem; color: #666; margin-bottom: 2px; }
.role-text.highlight { font-weight: bold; color: #2c3e50; }
.badge { background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; color: #555; }

/* Doc type select */
.doc-type-select {
    width: 100%; padding: 6px; border: 1px solid #ddd;
    border-radius: 4px; font-size: 0.9rem; background-color: #f9f9f9;
}
.doc-type-text { font-size: 0.9rem; color: #2c3e50; }

/* Sort Buttons */
.sort-col { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.sort-btn {
    background: #f0f0f0; border: 1px solid #ccc; cursor: pointer;
    font-size: 0.6rem; padding: 2px 6px; border-radius: 3px; color: #555;
}
.sort-btn:hover:not(:disabled) { background: #e0e0e0; color: #000; }
.sort-btn:disabled { opacity: 0.3; cursor: default; }

/* Duration Input */
.duration-input {
    width: 60px; padding: 4px; border: 1px solid #ddd; 
    border-radius: 4px; text-align: center; font-size: 0.9rem;
}
.duration-text { font-weight: bold; color: #2980b9; font-size: 0.9rem; }

/* PRINT STYLES */
@media print {
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    .meeting-card { box-shadow: none; border: 1px solid #000; break-inside: avoid; }
    .meeting-header { background: #eee !important; -webkit-print-color-adjust: exact; }
    body { background: white; }
    .agenda-view-container { width: 100%; max-width: none; }
    /* Zorg dat input velden verborgen zijn en text zichtbaar */
    .duration-input { display: none; }
    .duration-text { display: block; }
}
</style>