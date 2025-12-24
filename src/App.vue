<script setup>
import { ref, computed, onMounted } from 'vue';
import { items as initialItems } from './data/items.js';
import SidebarNav from './components/SidebarNav.vue';
import FilterBar from './components/FilterBar.vue';
import SwimlaneHeaders from './components/SwimlaneHeaders.vue';
import TopicCard from './components/TopicCard.vue';
import EditModal from './components/EditModal.vue';
import DetailModal from './components/DetailModal.vue';
import ReportView from './components/ReportView.vue';
import AgendaView from './components/AgendaView.vue';
import DateManager from './components/DateManager.vue';

// --- STATE ---
const items = ref([]);
const showAmbtelijk = ref(false); // NIEUW: Toggle voor ambtelijke voorbereiding
const activeView = ref('grid'); // 'grid', 'table', 'agenda', 'admin'
const isAdmin = ref(false); // Simpele admin toggle (zou normaal via login gaan)

// Filters
const selectedYear = ref(0);
const selectedPH = ref('');
const activeFilterType = ref('fase'); // 'fase' of 'label'
const activeFilterValue = ref('all');

// Modals
const showEditModal = ref(false);
const showDetailModal = ref(false);
const selectedItem = ref(null);

// --- INITIALISATIE ---
onMounted(() => {
  // Check of er items in localStorage staan, anders laad default
  const saved = localStorage.getItem('agenda-items');
  if (saved) {
    items.value = JSON.parse(saved);
  } else {
    items.value = initialItems.map(i => ({ ...i })); // Deep copy-ish
  }
});

// --- COMPUTED PROPERTIES ---

// 1. Bepaal de kolommen op basis van de toggle
const phases = computed(() => {
  const base = ['PFO', 'DBBesluit', 'DBInformeel', 'Delta', 'ABBesluit'];
  if (showAmbtelijk.value) {
      return ['PO', 'DT', ...base];
  }
  return base;
});

// 2. Unieke jaren en PH's voor de filters
const availableYears = computed(() => {
  const years = new Set();
  items.value.forEach(item => {
    // Check alle datums in schedule
    if (item.schedule) {
      Object.values(item.schedule).forEach(dateStr => {
        if (dateStr) {
          const year = parseInt(dateStr.split('-')[2]);
          if (year) years.add(year);
        }
      });
    }
  });
  return Array.from(years).sort().reverse();
});

const availablePHs = computed(() => {
    const phs = new Set();
    items.value.forEach(item => {
        if(item.ph) phs.add(item.ph);
    });
    return Array.from(phs).sort();
});

// 3. Filter de items
const filteredItems = computed(() => {
  return items.value.filter(item => {
    // A. Jaar filter (kijk of item actief is in dit jaar)
    if (selectedYear.value !== 0) {
      const hasDateInYear = item.schedule && Object.values(item.schedule).some(dateStr => {
        return dateStr && dateStr.endsWith(String(selectedYear.value));
      });
      if (!hasDateInYear) return false;
    }

    // B. PH Filter
    if (selectedPH.value && item.ph !== selectedPH.value) {
        return false;
    }

    // C. Hoofd knoppen balk (Fase of Label)
    if (activeFilterValue.value !== 'all') {
      if (activeFilterType.value === 'fase') {
        // Specifiek fase filter (bijv. toon alles wat PFO heeft)
        if (!item.schedule || !item.schedule[activeFilterValue.value]) return false;
      } else if (activeFilterType.value === 'label') {
        // Strategisch label
        if (item.strategicLabel !== activeFilterValue.value) return false;
      }
    }

    return true;
  });
});

// 4. Grid stijl aanpassen (5 vs 7 kolommen)
const gridStyle = computed(() => {
    return {
        gridTemplateColumns: showAmbtelijk.value ? 'repeat(7, 1fr)' : 'repeat(5, 1fr)'
    };
});

// --- ACTIES ---

function handleItemClick(item) {
  selectedItem.value = item;
  showDetailModal.value = true;
}

function handleEdit(item) {
  selectedItem.value = item; // Edit werkt op referentie, dus live update
  showDetailModal.value = false;
  showEditModal.value = true;
}

function saveItem(updatedItem) {
  // Als het een nieuw item is (ID is negatief of 0 of ontbreekt in array)
  const index = items.value.findIndex(i => i.id === updatedItem.id);
  if (index !== -1) {
    items.value[index] = updatedItem;
  } else {
    // Nieuw item
    updatedItem.id = Date.now();
    items.value.push(updatedItem);
  }
  saveToStorage();
  showEditModal.value = false;
}

function deleteItem(id) {
  if (confirm('Weet u zeker dat u dit item wilt verwijderen?')) {
    items.value = items.value.filter(i => i.id !== id);
    saveToStorage();
    showDetailModal.value = false;
    showEditModal.value = false;
  }
}

function saveToStorage() {
  localStorage.setItem('agenda-items', JSON.stringify(items.value));
}

// Filter events
function onFilterChange({ type, value }) {
  activeFilterType.value = type;
  activeFilterValue.value = value;
}

// Navigatie
function switchView(viewName) {
    activeView.value = viewName;
}

function toggleAdmin() {
    isAdmin.value = !isAdmin.value;
}

// Drag & Drop (Simpel: alleen visueel verplaatsen in data is lastig zonder datum wijziging logic)
// Voor nu laten we D&D even rusten en focussen op datum invoer in EditModal.

// Helper om items per fase te krijgen voor de grid
function getItemsForPhase(phase) {
    return filteredItems.value.filter(item => {
        // Een item verschijnt in een kolom als het een datum heeft voor die fase
        // EN als de status niet 'Afgerond' is (optioneel, voor nu tonen we alles met datum)
        return item.schedule && item.schedule[phase];
    });
}
</script>

<template>
  <div class="app-container">
    
    <SidebarNav 
        :active-view="activeView" 
        :is-admin="isAdmin"
        @navigate="switchView" 
        @toggle-admin="toggleAdmin"
        @new-item="() => { selectedItem = {}; showEditModal = true; }"
    />

    <main class="main-content">
        
        <header class="top-bar">
            <h1>Integrale Bestuurlijke Agenda</h1>
            <div class="user-info">
                <span v-if="isAdmin" class="admin-badge">Admin Modus</span>
                <span>WDODelta</span>
            </div>
        </header>

        <FilterBar 
            :jaren="availableYears"
            :portefeuillehouders="availablePHs"
            :show-ambtelijk="showAmbtelijk"
            @change-filter="onFilterChange"
            @change-jaar="y => selectedYear = y"
            @change-ph="ph => selectedPH = ph"
            @toggle-ambtelijk="val => showAmbtelijk = val"
        />

        <div v-if="activeView === 'grid'" class="view-container">
            <SwimlaneHeaders :show-ambtelijk="showAmbtelijk" />
            
            <div class="swimlanes-grid" :style="gridStyle">
                <div 
                    v-for="phase in phases" 
                    :key="phase" 
                    class="swimlane"
                    :class="phase"
                >
                    <div class="swimlane-content">
                        <TopicCard 
                            v-for="item in getItemsForPhase(phase)" 
                            :key="item.id" 
                            :item="item"
                            :phase="phase"
                            @click="handleItemClick(item)"
                        />
                        
                        <div v-if="getItemsForPhase(phase).length === 0" class="empty-lane-msg">
                            -
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-else-if="activeView === 'table'" class="view-container">
            <ReportView :items="filteredItems" />
        </div>

        <div v-else-if="activeView === 'agenda'" class="view-container">
            <AgendaView 
                :items="filteredItems" 
                :active-filter="activeFilterValue"
                :is-admin="isAdmin" 
            />
        </div>

        <div v-else-if="activeView === 'admin' && isAdmin" class="view-container">
            <DateManager />
        </div>

    </main>

    <DetailModal 
        v-if="showDetailModal" 
        :item="selectedItem" 
        :is-admin="isAdmin"
        @close="showDetailModal = false" 
        @edit="handleEdit"
    />

    <EditModal 
        v-if="showEditModal" 
        :item="selectedItem" 
        :show-ambtelijk="showAmbtelijk"
        @close="showEditModal = false" 
        @save="saveItem"
        @delete="deleteItem"
    />

  </div>
</template>

<style>
/* GLOBALE LAYOUT */
.app-container {
    display: flex;
    min-height: 100vh;
    background-color: #f3f4f6;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    /* Zorg dat content niet onder sidebar verdwijnt */
    margin-left: 250px; /* Breedte van SidebarNav */
    width: calc(100% - 250px);
}

.top-bar {
    background: white;
    padding: 15px 30px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.top-bar h1 { margin: 0; font-size: 1.5rem; color: #111827; }
.user-info { color: #6b7280; display: flex; align-items: center; gap: 10px; }
.admin-badge { background: #fee2e2; color: #b91c1c; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }

.view-container {
    flex: 1;
    overflow-y: auto; /* Scrollen binnen de view */
    padding-bottom: 50px;
}

/* GRID LAYOUT */
.swimlanes-grid {
    display: grid;
    /* Grid kolommen worden nu via inline-style geregeld in de template (gridStyle) */
    gap: 15px;
    padding: 20px;
    max-width: 1400px; /* Zelfde max-width als header container */
    margin: 0 auto;
    align-items: start; /* Zorgt dat kolommen niet onnodig uitrekken */
}

.swimlane {
    background: #f9fafb; /* Iets donkerder dan wit voor contrast met kaartjes */
    min-height: 500px;
    border-radius: 8px;
    padding: 10px;
    border: 1px dashed #e5e7eb;
}

/* Visuele scheiding per kolom type (optioneel) */
.swimlane.PO, .swimlane.DT { background: #f1f5f9; border-color: #cbd5e1; } /* Ambtelijk grijs/blauw */

.swimlane-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.empty-lane-msg {
    text-align: center; color: #ccc; margin-top: 20px; font-weight: bold;
}

/* PRINT AANPASSINGEN */
@media print {
    .app-container { display: block; background: white; }
    .main-content { margin: 0; width: 100%; }
    .no-print, .sidebar, .filter-container, .top-bar { display: none !important; }
}

@media (max-width: 1100px) {
    .swimlanes-grid {
        display: flex;
        flex-direction: column;
    }
    .main-content { margin-left: 80px; width: calc(100% - 80px); }
}
</style>