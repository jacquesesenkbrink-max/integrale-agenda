// src/composables/useDataStore.js
import { ref, computed, watch } from 'vue';
import { items as defaultItems } from '../data/items.js';
import { meetingDates as defaultDates } from '../data/meetingDates.js';
import { parseDate, getMonthName } from '../utils/dateHelpers.js';
import { PHASE_ORDER, PHASE_CONFIG } from '../constants/types.js';

const STORAGE_KEY_DATA = 'mijn-agenda-data-v2';
const STORAGE_KEY_DATES = 'mijn-agenda-dates-v2';
const STORAGE_KEY_LANES = 'mijn-agenda-lanes-v1';

// --- GLOBAL STATE (Staat nu BUITEN de functie!) ---
// Hierdoor delen alle componenten dezelfde data
const agendaPunten = ref([]);
const activeDates = ref({});
const historyStack = ref([]);
const futureStack = ref([]);

// Filters & Focus
const filterType = ref('fase');
const filterWaarde = ref('all');
const filterPH = ref('');
const startJaar = ref(0);
const activeFocusId = ref(null);
const showOnlyFocus = ref(false);
const searchQuery = ref('');

// Lane Settings
const laneSettings = ref({});

export function useDataStore() {
    
    // --- INITIALISATIE (Blijft binnen de functie, maar checkt of data al geladen is) ---
    function loadData() {
        // Alleen laden als we nog geen data hebben, of om een refresh te forceren
        if (agendaPunten.value.length > 0) return; 

        const opgeslagen = localStorage.getItem(STORAGE_KEY_DATA);
        if (opgeslagen) {
            agendaPunten.value = JSON.parse(opgeslagen);
        } else {
            agendaPunten.value = JSON.parse(JSON.stringify(defaultItems));
        }

        const opgeslagenDatums = localStorage.getItem(STORAGE_KEY_DATES);
        if (opgeslagenDatums) {
            activeDates.value = JSON.parse(opgeslagenDatums);
        } else {
            activeDates.value = JSON.parse(JSON.stringify(defaultDates));
        }

        const opgeslagenLanes = localStorage.getItem(STORAGE_KEY_LANES);
        if (opgeslagenLanes) {
            laneSettings.value = JSON.parse(opgeslagenLanes);
        } else {
            PHASE_ORDER.forEach(phaseKey => {
                laneSettings.value[phaseKey] = 'grid'; 
            });
        }
    }

    // --- WATCHERS ---
    // Let op: Watchers in een composable kunnen soms dubbel draaien als je niet oppast.
    // In dit simpele geval is het vaak prima, maar idealiter zet je deze ook globaal 
    // of in App.vue. Voor nu laten we ze hier staan zodat het werkt.
    watch(agendaPunten, (nieuweLijst) => {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(nieuweLijst));
    }, { deep: true });

    watch(laneSettings, (nieuweSettings) => {
        localStorage.setItem(STORAGE_KEY_LANES, JSON.stringify(nieuweSettings));
    }, { deep: true });

    function saveDates() {
        localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(activeDates.value));
    }

    // --- COMPUTED (Deze moeten wel IN de functie blijven of globaal gemaakt worden) ---
    // Omdat computed afhankelijk is van de refs die nu globaal zijn, 
    // werkt dit prima binnen de functie.
    const alleEvents = computed(() => {
        const events = [];
        agendaPunten.value.forEach(item => {
            if (!item.schedule) return;
            Object.keys(item.schedule).forEach(type => {
                const dateStr = item.schedule[type];
                if (!dateStr) return;
                
                const config = PHASE_CONFIG[type] || { color: '#ccc' };

                events.push({
                    uniqueId: `${item.id}-${type}`,
                    topicId: item.id,
                    title: item.title,
                    ph: item.ph,
                    dir: item.dir,
                    strategicLabel: item.strategicLabel,
                    comments: item.comments,
                    type: type,
                    color: config.color,
                    dateDisplay: dateStr,
                    dateObj: parseDate(dateStr),
                    originalItem: item 
                });
            });
        });
        return events.sort((a, b) => a.dateObj - b.dateObj);
    });

    const gefilterdeEvents = computed(() => {
        let list = alleEvents.value;

        if (activeFocusId.value && showOnlyFocus.value) {
            return list.filter(e => e.topicId === activeFocusId.value);
        }

        if (startJaar.value > 0) {
            list = list.filter(e => e.dateObj.getFullYear() >= startJaar.value);
        }
        
        if (searchQuery.value && searchQuery.value.trim() !== '') {
            const q = searchQuery.value.toLowerCase().trim();
            list = list.filter(e => 
                e.title.toLowerCase().includes(q) || 
                (e.comments && e.comments.toLowerCase().includes(q)) ||
                (e.ph && e.ph.toLowerCase().includes(q))
            );
        }

        if (filterWaarde.value !== 'all') {
            if (filterType.value === 'fase') {
                list = list.filter(e => e.type === filterWaarde.value);
            } else {
                list = list.filter(e => e.strategicLabel === filterWaarde.value);
            }
        }

        if (filterPH.value && filterPH.value !== '') {
            list = list.filter(e => {
                if (!e.ph) return false;
                const phList = e.ph.split('/').map(n => n.trim());
                return phList.includes(filterPH.value);
            });
        }

        return list;
    });

    const gegroepeerdeLijst = computed(() => {
        const groepen = {};
        gefilterdeEvents.value.forEach(ev => {
            const d = ev.dateObj;
            let sortKey, titel;
            if (d.getFullYear() === 9999) { 
                sortKey = '9999-99'; 
                titel = 'Datum onbekend'; 
            } else { 
                sortKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; 
                titel = getMonthName(d); 
            }
            
            if (!groepen[sortKey]) groepen[sortKey] = { titel, sortKey, items: [] };
            groepen[sortKey].items.push(ev);
        });
        return Object.values(groepen).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    });

    const uniekePortefeuillehouders = computed(() => {
        const phSet = new Set();
        agendaPunten.value.forEach(item => {
            if (item.ph) item.ph.split('/').forEach(p => phSet.add(p.trim()));
        });
        return Array.from(phSet).sort();
    });

    const uniekeDirecteuren = computed(() => {
        const dirSet = new Set();
        agendaPunten.value.forEach(item => { if (item.dir) dirSet.add(item.dir.trim()); });
        return Array.from(dirSet).sort();
    });

    const uniekeJaren = computed(() => {
        const jaren = new Set(alleEvents.value.map(e => e.dateObj.getFullYear()).filter(y => y < 9000));
        return Array.from(jaren).sort();
    });

    // --- ACTIES ---
    function addToHistory() {
        historyStack.value.push(JSON.parse(JSON.stringify(agendaPunten.value)));
        futureStack.value = [];
    }

    function undo() {
        if (historyStack.value.length) {
            futureStack.value.push(JSON.parse(JSON.stringify(agendaPunten.value)));
            agendaPunten.value = historyStack.value.pop();
            return true;
        }
        return false;
    }

    function redo() {
        if (futureStack.value.length) {
            historyStack.value.push(JSON.parse(JSON.stringify(agendaPunten.value)));
            agendaPunten.value = futureStack.value.pop();
            return true;
        }
        return false;
    }

    function saveChanges(updatedItem) {
        addToHistory();
        const index = agendaPunten.value.findIndex(i => i.id === updatedItem.id);
        if (index !== -1) agendaPunten.value[index] = updatedItem;
        else {
            if (!updatedItem.id) updatedItem.id = Date.now();
            agendaPunten.value.push(updatedItem);
        }
    }

    function deleteItem(item) {
        addToHistory();
        agendaPunten.value = agendaPunten.value.filter(i => i.id !== item.id);
    }

    function resetToDefaults() {
        agendaPunten.value = JSON.parse(JSON.stringify(defaultItems));
        activeDates.value = JSON.parse(JSON.stringify(defaultDates));
    }

    function toggleLaneMode(phaseName) {
        const current = laneSettings.value[phaseName] || 'grid';
        laneSettings.value[phaseName] = current === 'grid' ? 'dots' : 'grid';
    }

    return {
        agendaPunten, activeDates, historyStack, futureStack, laneSettings,
        filterType, filterWaarde, filterPH, startJaar, activeFocusId, showOnlyFocus, searchQuery,
        alleEvents, gefilterdeEvents, gegroepeerdeLijst, 
        uniekePortefeuillehouders, uniekeDirecteuren, uniekeJaren,
        loadData, saveDates, saveChanges, deleteItem, undo, redo, resetToDefaults, addToHistory, toggleLaneMode
    };
}