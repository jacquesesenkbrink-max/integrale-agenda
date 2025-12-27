<script setup>
  import { ref, watch, onMounted, nextTick } from 'vue';
  
  // COMPOSABLES
  import { useDataStore } from './composables/useDataStore.js';
  import { useConnections } from './composables/useConnections.js';

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
  
  // CONFIG
  import { PHASES } from './config/appSettings.js';

  // --- SETUP STORES ---
  const store = useDataStore();
  
  // Connections logic
  const { connectionsPath, strokeColor, timelineRef, drawConnections } = useConnections(
      store.activeFocusId, 
      store.viewMode, 
      store.laneSettings
  );

  // --- LOCAL UI STATE ---
  const viewMode = ref('grid'); 
  const isHeaderOpen = ref(true);
  const isFiltersOpen = ref(true);
  
  // Admin & Login
  const isAdmin = ref(false);
  const isLoginOpen = ref(false);
  const wachtwoordInput = ref('');
  const fileInput = ref(null);

  // Modals
  const isDetailOpen = ref(false);
  const isEditOpen = ref(false);
  const isDateManagerOpen = ref(false);
  
  const geselecteerdItem = ref(null);
  const editItem = ref(null);

  // Toast
  const toast = ref({ visible: false, message: '', type: 'success' });
  let toastTimeout = null;

  // --- INITIALISATIE ---
  onMounted(() => {
    store.loadData();
    if (sessionStorage.getItem('is-admin') === 'true') {
        isAdmin.value = true;
    }
    setTimeout(() => drawConnections(), 500);
  });

  // --- WATCHERS ---
  watch(() => store.agendaPunten, () => {
      if(store.activeFocusId.value) nextTick(drawConnections);
  }, { deep: true });

  watch([viewMode, store.showOnlyFocus, store.filterPH, store.laneSettings], () => {
      nextTick(() => { 
          if (store.activeFocusId.value) drawConnections(); 
      });
  }, { deep: true });


  // --- UI ACTIES ---
  function toggleHeader() {
    isHeaderOpen.value = !isHeaderOpen.value;
    if (isHeaderOpen.value) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAdminClick() {
    if (isAdmin.value) {
        isAdmin.value = false;
        sessionStorage.removeItem('is-admin');
        showToast("Uitgelogd", "success");
    } else {
        wachtwoordInput.value = ''; isLoginOpen.value = true;
    }
  }

  function checkLogin() {
    if (wachtwoordInput.value === "wdo" || wachtwoordInput.value === "admin") {
        isAdmin.value = true; sessionStorage.setItem('is-admin', 'true'); isLoginOpen.value = false; 
        showToast("Ingelogd als beheerder");
    } else { alert("Onjuist wachtwoord"); }
  }

  function showToast(message, type = 'success') {
    toast.value = { visible: true, message, type };
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toast.value.visible = false; }, 3000);
  }

  // --- NAVIGATIE & FOCUS ---
  function toggleFocus(topicId) {
    if (store.activeFocusId.value === topicId) clearFocus();
    else { 
        store.activeFocusId.value = topicId; 
        store.showOnlyFocus.value = false; 
        nextTick(drawConnections); 
    }
  }

  function navigateToTopic(topicId) {
      viewMode.value = 'grid';
      store.activeFocusId.value = topicId;
      store.showOnlyFocus.value = false;

      nextTick(() => {
          let targetEl = null;
          for (const type of PHASES) {
              const id = `card-${topicId}-${type}`;
              const el = document.getElementById(id);
              if (el) { targetEl = el; break; }
          }
          if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              drawConnections();
          }
      });
  }

  function clearFocus() { 
      store.activeFocusId.value = null; 
      connectionsPath.value = ''; 
      store.showOnlyFocus.value = false;
  }

  // --- FILTER WRAPPERS ---
  function updateHoofdFilter(p) { 
      store.filterType.value = p.type; 
      store.filterWaarde.value = p.value; 
      if (p.value !== 'PFO') store.filterPH.value = '';
      clearFocus(); 
  }

  function updateJaar(j) { store.startJaar.value = j; clearFocus(); }
  function updatePH(ph) { store.filterPH.value = ph; clearFocus(); }

  // --- MODAL HANDLERS ---
  function openDetails(item) { geselecteerdItem.value = item; isDetailOpen.value = true; }
  function openNieuw() { editItem.value = null; isEditOpen.value = true; }
  function openEdit(item) { editItem.value = item; isEditOpen.value = true; }
  
  function handleSave(updatedItem) {
      store.saveChanges(updatedItem);
      isEditOpen.value = false;
      showToast("Wijzigingen opgeslagen!");
  }

  function handleDelete(item) {
      if(confirm(`Verwijderen: "${item.title}"?`)) {
          store.deleteItem(item);
          showToast("Item verwijderd", "error");
      }
  }
  
  function handleSaveDates() {
      store.saveDates();
      showToast("Datums opgeslagen!");
  }
  
  function handleReset() {
      if(confirm("Alles resetten naar standaard data?")) {
          store.resetToDefaults();
          showToast("Data gereset");
      }
  }

function handleFileUpload() {  console.log("Upload nog niet geïmplementeerd in refactor");}

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
            <p class="subtitle">Versie v12.1 (Refactored)</p>
        </div>
    </div>
    
    <div class="header-actions">
      <div class="view-toggle">
        <button :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">📄 Tabel</button>
        <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">🃏 Bord</button>
        <button :class="{ active: viewMode === 'agenda' }" @click="viewMode = 'agenda'">🗓️ Agenda</button>
      </div>

      <transition name="fade">
        <div v-if="isAdmin" class="admin-toolbar">
            <div class="admin-group">
                <span class="label">Acties:</span>
                <button class="action-btn new" @click="openNieuw">+ Nieuw</button>
                <button class="action-btn" @click="handleReset" style="background: #e67e22;">🔄 Reset</button>
            </div>
            <div class="admin-group">
                <span class="label">Data:</span>
                <button class="action-btn" @click="isDateManagerOpen = true">📅 Datums</button> 
                </div>
            <div class="admin-group">
                <span class="label">Historie:</span>
                <button class="action-btn" @click="store.undo" :disabled="store.historyStack.value.length === 0">↩️</button>
                <button class="action-btn" @click="store.redo" :disabled="store.futureStack.value.length === 0">↪️</button>
            </div>
        </div>
      </transition>
    </div>
  </header>

  <main :class="{ 'has-focus': store.activeFocusId.value !== null }">
    
    <transition name="fade">
        <div v-if="toast.visible" class="toast-notification" :class="toast.type">
            {{ toast.message }}
        </div>
    </transition>

    <DetailModal :show="isDetailOpen" :item="geselecteerdItem" @close="isDetailOpen = false" />
    
    <EditModal 
        :show="isEditOpen" 
        :item="editItem" 
        :availableDates="store.activeDates.value" 
        :portefeuillehouders="store.uniekePortefeuillehouders.value"
        :directeuren="store.uniekeDirecteuren.value"
        @save="handleSave" 
        @close="isEditOpen = false" 
    />
    
    <DateManager 
        :isOpen="isDateManagerOpen" 
        :initialDates="store.activeDates.value" 
        @save-dates="handleSaveDates" 
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
            :jaren="store.uniekeJaren.value" 
            :portefeuillehouders="store.uniekePortefeuillehouders.value"
            @change-filter="updateHoofdFilter" 
            @change-jaar="updateJaar" 
            @change-ph="updatePH"
        />
    </div>

    <div v-if="viewMode === 'grid'">
        <SidebarNav :groepen="store.gegroepeerdeLijst.value" />
        
        <SwimlaneHeaders />

        <div class="container" ref="timelineRef">
          
          <svg id="connections-layer">
            <path v-if="connectionsPath" :d="connectionsPath" class="connection-line" :style="{ stroke: strokeColor }" />
          </svg>

          <div v-if="store.gegroepeerdeLijst.value.length === 0" class="empty-state">
             Geen punten gevonden. Probeer een ander filter of ander jaar.
          </div>
          
          <div v-for="groep in store.gegroepeerdeLijst.value" :key="groep.sortKey" :id="'maand-' + groep.sortKey" class="month-block">
            <div class="month-header"><span class="month-badge">{{ groep.titel }}</span></div>
            <div class="grid-layout">
              <TopicCard 
                v-for="ev in groep.items" :key="ev.uniqueId" 
                :event="ev" 
                :isAdmin="isAdmin" 
                :isFocused="store.activeFocusId.value === ev.topicId" 
                :isCompact="store.laneSettings.value[ev.type] === 'dots'"
                @toggle-focus="toggleFocus" @open-details="openDetails" @edit="openEdit" @delete="handleDelete"
              />
            </div>
          </div>
        </div>
    </div>

    <div v-else-if="viewMode === 'table'" class="container">
        <ReportView 
          :items="store.gefilterdeEvents.value" 
          :isAdmin="isAdmin"
          @navigate-to-topic="navigateToTopic" 
        />
    </div>

    <div v-else-if="viewMode === 'agenda'" class="container">
        <AgendaView 
        :items="store.gefilterdeEvents.value" 
        :activeFilter="store.filterWaarde.value"
        :activeFocusId="store.activeFocusId.value" 
        :isAdmin="isAdmin"
        @toggle-focus="toggleFocus"
        @item-click="openDetails" 
        />
    </div>

    <div v-if="store.activeFocusId.value" class="floating-controls">
        <button 
            class="control-btn toggle-btn" 
            :class="{ active: store.showOnlyFocus.value }" 
            @click="store.showOnlyFocus.value = !store.showOnlyFocus.value"
        >
            {{ store.showOnlyFocus.value ? '👐 Toon Alles' : '🔍 Focus Isoleren' }}
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

.controls-bar { text-align: center; padding: 10px; background: #f4f7f6; border-bottom: 1px solid #ddd; }
.toggle-filters-btn { background: white; border: 1px solid #ccc; padding: 6px 15px; border-radius: 20px; color: #555; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; font-weight: 600; }
.toggle-filters-btn:hover { background: #eef2f5; color: #075895; border-color: #075895; }

#connections-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; } 
.connection-line { fill: none; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 10; animation: dash 30s linear infinite; opacity: 0.8; }
@keyframes dash { to { stroke-dashoffset: -1000; } }

.month-block { margin-bottom: 40px; scroll-margin-top: 140px; position: relative; z-index: 2; }
.month-header { text-align: center; margin-bottom: 20px; position: relative; }
.month-header::before { content: ''; position: absolute