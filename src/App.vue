<script setup>
  import { ref, computed, watch, onMounted, nextTick } from 'vue';
  
  // DATA IMPORTS
  import { items as defaultItems } from './data/items.js';
  import { meetingDates as defaultDates } from './data/meetingDates.js'; 
  import { parseDate, getMonthName } from './utils/dateHelpers.js';
  
  // COMPONENT IMPORTS
  import TopicCard from './components/TopicCard.vue';
  import FilterBar from './components/FilterBar.vue';
  import SidebarNav from './components/SidebarNav.vue';
  import SwimlaneHeaders from './components/SwimlaneHeaders.vue';
  import DetailModal from './components/DetailModal.vue';
  import EditModal from './components/EditModal.vue';
  import ReportView from './components/ReportView.vue';
  import AgendaView from './components/AgendaView.vue';
  import DateManager from './components/DateManager.vue';

  // --- CONFIGURATIE ---
  // We gebruiken 'v2' om te forceren dat de nieuwe items.js wordt geladen
  // en de oude cache (zonder P&C items) wordt genegeerd.
  const STORAGE_KEY_DATA = 'mijn-agenda-data-v2';
  const STORAGE_KEY_DATES = 'mijn-agenda-dates-v2';

  // --- DATA & STATE ---
  const agendaPunten = ref([]); 
  const viewMode = ref('grid'); 
  const filterType = ref('fase');
  const filterWaarde = ref('all');
  const filterPH = ref(''); // State voor gekozen PH
  const startJaar = ref(0);
  
  const activeFocusId = ref(null); 
  const showOnlyFocus = ref(false); 

  const isAdmin = ref(false); 
  const fileInput = ref(null);

  // UI States
  const isHeaderOpen = ref(true);
  const isFiltersOpen = ref(true);
  const isLoginOpen = ref(false);
  const wachtwoordInput = ref('');
  const isDateManagerOpen = ref(false);
  const activeDates = ref({});

  // Modals
  const isDetailOpen = ref(false);
  const isEditOpen = ref(false);
  const geselecteerdItem = ref(null);
  const editItem = ref(null);

  // Undo/Redo Stacks
  const historyStack = ref([]);
  const futureStack = ref([]);

  // SVG Refs
  const connectionsPath = ref('');
  const strokeColor = ref('#2c3e50');
  const timelineRef = ref(null);

  // --- INITIALISATIE ---
  onMounted(() => {
    loadData();

    if (sessionStorage.getItem('is-admin') === 'true') {
        isAdmin.value = true;
    }
    window.addEventListener('resize', drawConnections);
  });

  function loadData() {
    // Probeer data uit local storage te halen (v2)
    const opgeslagen = localStorage.getItem(STORAGE_KEY_DATA);
    if (opgeslagen) {
      agendaPunten.value = JSON.parse(opgeslagen);
    } else {
      // Als er niets staat (of we zitten op een nieuwe versie), laad de import
      console.log("Geen opgeslagen data gevonden, loading defaults...");
      agendaPunten.value = JSON.parse(JSON.stringify(defaultItems));
    }

    const opgeslagenDatums = localStorage.getItem(STORAGE_KEY_DATES);
    if (opgeslagenDatums) {
        activeDates.value = JSON.parse(opgeslagenDatums);
    } else {
        activeDates.value = JSON.parse(JSON.stringify(defaultDates));
    }
  }

  // Functie om handmatig data te resetten naar items.js (nuttig tijdens testen)
  function resetToDefaults() {
    if(confirm("Weet je zeker dat je alle data wilt resetten naar de standaard items.js? Je kwijt gemaakte wijzigingen in de browser.")) {
        agendaPunten.value = JSON.parse(JSON.stringify(defaultItems));
        activeDates.value = JSON.parse(JSON.stringify(defaultDates));
        alert("Data is gereset. De nieuwe P&C items zouden nu zichtbaar moeten zijn.");
    }
  }

  watch(agendaPunten, (nieuweLijst) => {
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(nieuweLijst));
    if(activeFocusId.value) nextTick(() => drawConnections());
  }, { deep: true });

  watch(viewMode, () => {
    if(activeFocusId.value) nextTick(() => drawConnections());
  });

  watch(showOnlyFocus, () => {
      if(activeFocusId.value) nextTick(() => drawConnections());
  });

  // Watcher: Als de gefilterde lijst verandert (bv door PH keuze), herteken lijnen
  watch(filterPH, () => {
      nextTick(() => {
          if (activeFocusId.value) drawConnections();
      });
  });

  function saveDates() {
    localStorage.setItem(STORAGE_KEY_DATES, JSON.stringify(activeDates.value));
  }

  // --- LOGICA & TRANSFORMATIE ---
  
  const alleEvents = computed(() => {
    const events = [];
    agendaPunten.value.forEach(item => {
        if (!item.schedule) return;
        Object.keys(item.schedule).forEach(type => {
            const dateStr = item.schedule[type];
            if (!dateStr) return;
            events.push({
                uniqueId: `${item.id}-${type}`,
                topicId: item.id,
                title: item.title,
                ph: item.ph,
                dir: item.dir,
                strategicLabel: item.strategicLabel,
                comments: item.comments,
                type: type,
                dateDisplay: dateStr,
                dateObj: parseDate(dateStr),
                originalItem: item 
            });
        });
    });
    return events.sort((a, b) => a.dateObj - b.dateObj);
  });

  const uniekePortefeuillehouders = computed(() => {
    const phSet = new Set();
    agendaPunten.value.forEach(item => {
        if (item.ph) {
            const parts = item.ph.split('/');
            parts.forEach(p => phSet.add(p.trim()));
        }
    });
    return Array.from(phSet).sort();
  });

  const gefilterdeEvents = computed(() => {
    let list = alleEvents.value;

    if (activeFocusId.value && showOnlyFocus.value) {
        return list.filter(e => e.topicId === activeFocusId.value);
    }

    if (startJaar.value > 0) list = list.filter(e => e.dateObj.getFullYear() >= startJaar.value);
    
    if (filterWaarde.value !== 'all') {
        if (filterType.value === 'fase') {
            
            // LOGICA: Als PFO actief is EN er is een PH gekozen
            if (filterWaarde.value === 'PFO' && filterPH.value) {
                // Toon alle fases van items die bij deze PH horen
                list = list.filter(e => {
                    const item = e.originalItem;
                    const phList = item.ph ? item.ph.split('/').map(n => n.trim()) : [];
                    const matchesPH = phList.includes(filterPH.value);
                    const hasPFO = !!item.schedule.PFO; 
                    return matchesPH && hasPFO;
                });
            } 
            else {
                // Normaal gedrag: Alleen de specifieke kolom tonen
                list = list.filter(e => e.type === filterWaarde.value);
            }
        }
        else {
            // Label filter (Hier wordt P&C gefilterd)
            // We zorgen dat we ook items pakken die P&C heten
            list = list.filter(e => e.strategicLabel === filterWaarde.value);
        }
    }
    return list;
  });

  const gegroepeerdeLijst = computed(() => {
    const groepen = {};
    gefilterdeEvents.value.forEach(ev => {
        const d = ev.dateObj;
        let sortKey, titel;
        if (d.getFullYear() === 9999) { sortKey = '9999-99'; titel = 'Datum onbekend'; } 
        else { sortKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; titel = getMonthName(d); }
        
        if (!groepen[sortKey]) groepen[sortKey] = { titel, sortKey, items: [] };
        groepen[sortKey].items.push(ev);
    });
    return Object.values(groepen).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  });

  const uniekeJaren = computed(() => {
    const jaren = new Set(alleEvents.value.map(e => e.dateObj.getFullYear()).filter(y => y < 9000));
    return Array.from(jaren).sort();
  });

  // --- ACTIES ---

  function toggleHeader() {
    isHeaderOpen.value = !isHeaderOpen.value;
    if (isHeaderOpen.value) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAdminClick() {
    if (isAdmin.value) {
        isAdmin.value = false;
        sessionStorage.removeItem('is-admin');
    } else {
        wachtwoordInput.value = ''; isLoginOpen.value = true;
    }
  }

  function checkLogin() {
    if (wachtwoordInput.value === "wdo" || wachtwoordInput.value === "admin") {
        isAdmin.value = true; sessionStorage.setItem('is-admin', 'true'); isLoginOpen.value = false; 
    } else { alert("Onjuist wachtwoord"); }
  }

  function toggleFocus(topicId) {
    if (activeFocusId.value === topicId) clearFocus();
    else { 
        activeFocusId.value = topicId; 
        showOnlyFocus.value = false; 
        nextTick(() => drawConnections()); 
    }
  }

  // Navigeer vanuit tabel naar grid kaartje
  function navigateToTopic(topicId) {
      viewMode.value = 'grid';
      activeFocusId.value = topicId;
      showOnlyFocus.value = false;

      nextTick(() => {
          const preferredOrder = ['PFO', 'DBBesluit', 'DBInformeel', 'Delta', 'ABBesluit'];
          let targetEl = null;

          for (const type of preferredOrder) {
              const id = `card-${topicId}-${type}`;
              const el = document.getElementById(id);
              if (el) {
                  targetEl = el;
                  break; 
              }
          }

          if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              drawConnections();
          }
      });
  }

  function clearFocus() { 
      activeFocusId.value = null; 
      connectionsPath.value = ''; 
      showOnlyFocus.value = false;
  }

  function openDetails(item) { geselecteerdItem.value = item; isDetailOpen.value = true; }
  function openNieuw() { editItem.value = null; isEditOpen.value = true; }
  function openEdit(item) { editItem.value = item; isEditOpen.value = true; }
  
  function updateHoofdFilter(p) { 
      filterType.value = p.type; 
      filterWaarde.value = p.value; 
      if (p.value !== 'PFO') filterPH.value = '';
      clearFocus(); 
  }

  function updateJaar(j) { startJaar.value = j; clearFocus(); }
  
  function updatePH(ph) {
      filterPH.value = ph;
      clearFocus();
  }

  function saveChanges(updatedItem) {
      addToHistory();
      const index = agendaPunten.value.findIndex(i => i.id === updatedItem.id);
      if (index !== -1) agendaPunten.value[index] = updatedItem;
      else { if(!updatedItem.id) updatedItem.id = Date.now(); agendaPunten.value.push(updatedItem); }
      isEditOpen.value = false;
  }
  function deleteItem(item) {
      if(confirm(`Verwijderen: "${item.title}"?`)) { addToHistory(); agendaPunten.value = agendaPunten.value.filter(i => i.id !== item.id); }
  }

  function addToHistory() { historyStack.value.push(JSON.parse(JSON.stringify(agendaPunten.value))); futureStack.value = []; }
  function undo() { if (historyStack.value.length) { futureStack.value.push(JSON.parse(JSON.stringify(agendaPunten.value))); agendaPunten.value = historyStack.value.pop(); } }
  function redo() { if (futureStack.value.length) { historyStack.value.push(JSON.parse(JSON.stringify(agendaPunten.value))); agendaPunten.value = futureStack.value.pop(); } }
  function handleFileUpload(e) { /* ...bestaande code... */ }

  function drawConnections() {
    if (!activeFocusId.value || !timelineRef.value) return;
    const topicId = activeFocusId.value;
    const cards = Array.from(timelineRef.value.querySelectorAll(`[id^='card-${topicId}-']`));
    
    cards.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

    if (cards.length < 2) { connectionsPath.value = ''; return; }

    const style = window.getComputedStyle(cards[0]);
    strokeColor.value = viewMode.value === 'dots' ? style.backgroundColor : style.borderTopColor;
    if (!strokeColor.value || strokeColor.value === 'rgba(0, 0, 0, 0)') strokeColor.value = '#2c3e50';

    const containerRect = timelineRef.value.getBoundingClientRect();
    let pathD = '';
    
    for (let i = 0; i < cards.length - 1; i++) {
        const rectA = cards[i].getBoundingClientRect();
        const rectB = cards[i+1].getBoundingClientRect();
        
        const x1 = rectA.left + (rectA.width / 2) - containerRect.left;
        const y1 = rectA.top + (rectA.height / 2) - containerRect.top;
        const x2 = rectB.left + (rectB.width / 2) - containerRect.left;
        const y2 = rectB.top + (rectB.height / 2) - containerRect.top;
        
        const deltaY = y2 - y1;
        pathD += `M ${x1} ${y1} C ${x1} ${y1 + deltaY * 0.5}, ${x2} ${y2 - deltaY * 0.5}, ${x2} ${y2} `;
    }
    connectionsPath.value = pathD;
  }
</script>

<template>
  <button class="header-toggle-btn" @click="toggleHeader" title="Menu openen/sluiten">
    {{ isHeaderOpen ? '▼ Verberg' : '☰ Menu' }}
  </button>

  <header :class="{ collapsed: !isHeaderOpen }">
    <div class="top-bar">
        <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" accept=".json">
        <div class="header-content">
            <h1>Bestuurlijke Planning WDODelta</h1>
            <p class="subtitle">Versie v11.6</p>
        </div>
    </div>
    
    <div class="header-actions">
      <div class="view-toggle">
        <button :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">📄 Tabel</button>
        <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">🃏 Kaart</button>
        <button :class="{ active: viewMode === 'dots' }" @click="viewMode = 'dots'">🟣 Stippen</button>
        <button :class="{ active: viewMode === 'agenda' }" @click="viewMode = 'agenda'">🗓️ Agenda</button>
      </div>

      <transition name="fade">
        <div v-if="isAdmin" class="admin-toolbar">
            <div class="admin-group">
                <span class="label">Acties:</span>
                <button class="action-btn new" @click="openNieuw">+ Nieuw</button>
                <button class="action-btn" @click="resetToDefaults" style="background: #e67e22;">🔄 Data Resetten</button>
            </div>
            <div class="admin-group">
                <span class="label">Data:</span>
                <button class="action-btn" @click="isDateManagerOpen = true">📅 Beheer Datums</button> 
                </div>
            <div class="admin-group">
                <span class="label">Historie:</span>
                <button class="action-btn" @click="undo" :disabled="historyStack.length === 0">↩️</button>
                <button class="action-btn" @click="redo" :disabled="futureStack.length === 0">↪️</button>
            </div>
        </div>
      </transition>
    </div>
  </header>

  <main :class="{ 'has-focus': activeFocusId !== null }">
    
    <DetailModal :show="isDetailOpen" :item="geselecteerdItem" @close="isDetailOpen = false" />
    <EditModal :show="isEditOpen" :item="editItem" :availableDates="activeDates" @save="saveChanges" @close="isEditOpen = false" />
    
    <DateManager 
        :isOpen="isDateManagerOpen" 
        :initialDates="activeDates" 
        @save-dates="saveDates" 
        @close="isDateManagerOpen = false" 
    />

    <div v-if="isLoginOpen" class="login-overlay" @click.self="isLoginOpen = false">
        <div class="login-modal">
            <h3>Beheerder Inloggen</h3>
            <input type="password" v-model="wachtwoordInput" class="login-input" @keyup.enter="checkLogin" autofocus>
            <button class="login-confirm-btn" @click="checkLogin">Inloggen</button>
        </div>
    </div>

    <div class="controls-bar no-print">
        <button class="toggle-filters-btn" @click="isFiltersOpen = !isFiltersOpen">
            {{ isFiltersOpen ? '🔼 Filters Verbergen' : '🔽 Filters & Zoeken Tonen' }}
        </button>
    </div>

    <div v-show="isFiltersOpen">
        <FilterBar 
            :jaren="uniekeJaren" 
            :portefeuillehouders="uniekePortefeuillehouders"
            @change-filter="updateHoofdFilter" 
            @change-jaar="updateJaar" 
            @change-ph="updatePH"
        />
    </div>

    <div v-if="viewMode === 'grid' || viewMode === 'dots'">
        <SidebarNav :groepen="gegroepeerdeLijst" />
        
        <SwimlaneHeaders v-if="viewMode === 'grid' || viewMode === 'dots'" />

        <div class="container" ref="timelineRef" :class="{ 'view-dots': viewMode === 'dots' }">
          
          <svg id="connections-layer">
            <path v-if="connectionsPath" :d="connectionsPath" class="connection-line" :style="{ stroke: strokeColor }" />
          </svg>

          <div v-if="gegroepeerdeLijst.length === 0" class="empty-state">
             Geen punten gevonden. Probeer een ander filter of ander jaar.
          </div>
          
          <div v-for="groep in gegroepeerdeLijst" :key="groep.sortKey" :id="'maand-' + groep.sortKey" class="month-block">
            <div class="month-header"><span class="month-badge">{{ groep.titel }}</span></div>
            <div class="grid-layout">
              <TopicCard 
                v-for="ev in groep.items" :key="ev.uniqueId" 
                :event="ev" :isAdmin="isAdmin" :isFocused="activeFocusId === ev.topicId" :isCompact="viewMode === 'dots'"
                @toggle-focus="toggleFocus" @open-details="openDetails" @edit="openEdit" @delete="deleteItem"
              />
            </div>
          </div>
        </div>
    </div>

    <div v-else-if="viewMode === 'table'" class="container">
        <ReportView 
          :items="gefilterdeEvents" 
          :isAdmin="isAdmin"
          @navigate-to-topic="navigateToTopic" 
        />
    </div>

    <div v-else-if="viewMode === 'agenda'" class="container">
        <AgendaView 
        :items="gefilterdeEvents" 
        :activeFilter="filterWaarde"
        :activeFocusId="activeFocusId" 
        :isAdmin="isAdmin"
        @toggle-focus="toggleFocus"
        @item-click="openDetails" 
        />
    </div>

    <div v-if="activeFocusId" class="floating-controls">
        <button 
            class="control-btn toggle-btn" 
            :class="{ active: showOnlyFocus }" 
            @click="showOnlyFocus = !showOnlyFocus"
        >
            {{ showOnlyFocus ? '👐 Toon Alles' : '🔍 Focus Isoleren' }}
        </button>
        
        <button class="control-btn reset-btn" @click="clearFocus">
            ❌ Sluiten
        </button>
    </div>

  </main>

  <button 
    class="admin-floating-btn" 
    @click="handleAdminClick" 
    :class="{ active: isAdmin }" 
    :title="isAdmin ? 'Klik om uit te loggen' : 'Klik om in te loggen'"
  >
    {{ isAdmin ? '🔓 Uitloggen' : '🔒 Admin Login' }}
  </button>

</template>

<style scoped>
/* Basis Styles */
.login-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:1000; display:flex; justify-content:center; align-items:center; }
.login-modal { background:white; padding:25px; border-radius:8px; width:90%; max-width:400px; box-shadow:0 5px 20px rgba(0,0,0,0.3); }
.login-input { width:100%; padding:12px; margin:15px 0; border:1px solid #ccc; border-radius:4px; font-size:1rem; }
.login-confirm-btn { width:100%; padding:12px; background:#27ae60; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer; }
.header-toggle-btn { position:fixed; top:15px; left:15px; z-index:200; background:#2c3e50; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.3); }

header { background: linear-gradient(135deg, #2c3e50, #4ca1af); color: white; padding: 1rem; position: relative; z-index: 100; box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: all 0.4s; max-height: 500px; overflow: hidden; }
header.collapsed { max-height: 0; padding: 0; opacity: 0; pointer-events: none; }
.top-bar { display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto; }
.header-content { text-align: center; flex: 1; }
.header-actions { display: flex; flex-direction: column; align-items: center; gap: 15px; margin-top: 15px; }
.view-toggle { background: rgba(0,0,0,0.2); border-radius: 20px; padding: 3px; display: flex; }
.view-toggle button { background: transparent; border: none; color: white; padding: 5px 15px; border-radius: 15px; cursor: pointer; transition: background 0.2s; }
.view-toggle button.active { background: white; color: #2c3e50; font-weight: bold; }
.admin-toolbar { background: rgba(0,0,0,0.3); padding: 8px 15px; border-radius: 8px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap; margin-top: 5px; }
.admin-group { display: flex; gap: 8px; align-items: center; border-right: 1px solid rgba(255,255,255,0.2); padding-right: 15px; }
.admin-group:last-child { border-right: none; }
.action-btn { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
.action-btn.new { background: #27ae60; font-weight: bold; }

.container { max-width: 1400px; margin: 0 auto; padding: 20px; position: relative; min-height: 80vh; }

.controls-bar {
    text-align: center;
    padding: 10px;
    background: #f4f7f6;
    border-bottom: 1px solid #ddd;
}
.toggle-filters-btn {
    background: white;
    border: 1px solid #ccc;
    padding: 6px 15px;
    border-radius: 20px;
    color: #555;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 600;
}
.toggle-filters-btn:hover {
    background: #eef2f5;
    color: #075895;
    border-color: #075895;
}

#connections-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; } 
.connection-line { fill: none; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 10; animation: dash 30s linear infinite; opacity: 0.8; }
@keyframes dash { to { stroke-dashoffset: -1000; } }

.month-block { margin-bottom: 40px; scroll-margin-top: 140px; position: relative; z-index: 2; }
.month-header { text-align: center; margin-bottom: 20px; position: relative; }
.month-header::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #ccc; z-index: -1; }
.month-badge { background-color: #fff; color: #2c3e50; border: 2px solid #2c3e50; padding: 5px 20px; border-radius: 30px; font-weight: bold; }
.grid-layout { display: grid; gap: 15px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
@media (min-width: 1100px) { 
    .grid-layout { 
        grid-template-columns: repeat(5, 1fr); 
        align-items: start; 
    } 
}

main.has-focus .month-block { z-index: 10; } 
main.has-focus .card-wrapper { opacity: 0.2; filter: grayscale(100%); transition: opacity 0.3s; }

.floating-controls {
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 15px; z-index: 200; animation: popIn 0.3s;
    background: white; padding: 5px; border-radius: 40px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2); border: 1px solid #ddd;
}
.control-btn { padding: 10px 20px; border-radius: 30px; font-weight: bold; border: none; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; white-space: nowrap; }
.reset-btn { background: #e74c3c; color: white; }
.reset-btn:hover { background: #c0392b; }
.toggle-btn { background: #f1c40f; color: #34495e; }
.toggle-btn:hover { background: #f39c12; color: white; }
.toggle-btn.active { background: #27ae60; color: white; }

@keyframes popIn { from { transform: translate(-50%, 50px); } to { transform: translate(-50%, 0); } }

.admin-floating-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    background: #2c3e50;
    color: white;
    border: 2px solid white;
    padding: 10px 20px;
    border-radius: 30px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s;
    display: flex;
    align-items: center;
    gap: 8px;
}
.admin-floating-btn:hover {
    transform: scale(1.05) translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.4);
    background: #34495e;
}
.admin-floating-btn.active {
    background: #e74c3c; 
    border-color: #c0392b;
}
</style>