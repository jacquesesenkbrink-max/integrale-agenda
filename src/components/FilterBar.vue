<script setup>
import { useDataStore } from '../composables/useDataStore.js';
import { PHASE_ORDER, PHASE_CONFIG, STRATEGIC_LABELS } from '../constants/types.js';

const store = useDataStore();

// Acties voor buttons
function setFilter(type, value) {
  // Als je op dezelfde knop klikt die al actief is, resetten we naar 'alles'
  if (store.filterWaarde === value && store.filterType === type) {
    store.filterWaarde = 'all';
  } else {
    store.filterType = type;
    store.filterWaarde = value;
    
    // Reset PH als we wegklikken van PFO (het is logisch dat PH filter vooral bij PFO hoort)
    if (value !== 'PFO' && type === 'fase') {
        store.filterPH = '';
    }
  }
}

function resetFilters() {
    store.filterWaarde = 'all';
    store.filterPH = '';
    store.searchQuery = '';
    store.startJaar = 0;
}
</script>

<template>
  <div class="filter-container">
    
    <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input 
            type="text" 
            v-model="store.searchQuery" 
            placeholder="Zoek op titel, opmerking of bestuurder..." 
            class="search-input"
        />
        <button v-if="store.searchQuery" @click="store.searchQuery = ''" class="clear-search">✕</button>
    </div>

    <div class="filters">
      <button class="filter-btn" 
        :class="{ selected: store.filterWaarde === 'all' }" 
        @click="resetFilters">
        Alles tonen
      </button>
      
      <button 
        v-for="phaseKey in PHASE_ORDER" 
        :key="phaseKey"
        class="filter-btn"
        :class="{ selected: store.filterWaarde === phaseKey }"
        :style="store.filterWaarde === phaseKey ? { backgroundColor: PHASE_CONFIG[phaseKey].color, borderColor: PHASE_CONFIG[phaseKey].color, color: 'white' } : {}"
        @click="setFilter('fase', phaseKey)"
      >
        {{ PHASE_CONFIG[phaseKey].label }}
      </button>
    </div>

    <transition name="fade">
        <div v-if="store.filterWaarde === 'PFO'" class="ph-filter-wrapper">
            <span class="ph-label">👤 Filter op Portefeuillehouder:</span>
            <select v-model="store.filterPH" class="ph-select">
                <option value="">-- Alle Bestuurders --</option>
                <option v-for="ph in store.uniekePortefeuillehouders" :key="ph" :value="ph">
                    {{ ph }}
                </option>
            </select>
        </div>
    </transition>

    <div class="filter-divider"><span>Filter op Strategische Duiding</span></div>

    <div class="filters secondary">
      <button 
        v-for="label in STRATEGIC_LABELS" 
        :key="label"
        class="filter-btn btn-strat"
        :class="{ selected: store.filterWaarde === label }"
        @click="setFilter('label', label)"
      >
        {{ label }}
      </button>
    </div>

    <div class="filter-divider"><span>Periode</span></div>

    <div class="filters">
      <select v-model="store.startJaar" class="filter-btn year-select">
        <option :value="0">📅 Historie (Alles)</option>
        <option v-for="jaar in store.uniekeJaren" :key="jaar" :value="jaar">
          Vanaf {{ jaar }}
        </option>
      </select>
    </div>

  </div>
</template>

<style scoped>
/* Container styling */
.filter-container {
  padding: 20px; 
  background: white; 
  margin-bottom: 25px; 
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 4px 6px -1px rgba(7, 88, 149, 0.05);
}

/* SEARCH STYLING (Nieuw) */
.search-wrapper {
    max-width: 600px;
    margin: 0 auto 20px auto;
    position: relative;
    display: flex;
    align-items: center;
}
.search-input {
    width: 100%;
    padding: 10px 40px 10px 40px; /* Ruimte voor icoontje links en kruisje rechts */
    border: 2px solid #e5e7eb;
    border-radius: 25px;
    font-size: 1rem;
    outline: none;
    transition: border-color 0.2s;
}
.search-input:focus {
    border-color: #075895;
}
.search-icon {
    position: absolute;
    left: 15px;
    opacity: 0.5;
}
.clear-search {
    position: absolute;
    right: 15px;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: bold;
    color: #999;
    font-size: 1rem;
}
.clear-search:hover { color: #d32f2f; }

/* Filter groups */
.filters {
  display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;
}

.filter-divider {
  width: 100%; height: 1px; background: rgba(7, 88, 149, 0.1); margin: 20px 0;
  display: flex; align-items: center; justify-content: center;
}
.filter-divider span {
  background: white; padding: 2px 15px; font-size: 0.7rem; text-transform: uppercase; 
  color: #075895; font-weight: bold; letter-spacing: 0.5px;
}

/* Standaard knop stijl */
.filter-btn {
  background: white; 
  border: 1px solid #cce4f2; 
  padding: 8px 16px; 
  border-radius: 4px; 
  cursor: pointer; 
  font-size: 0.9rem; 
  transition: all 0.2s; 
  color: #075895; 
}
.filter-btn:hover { 
  background: #f0f8fc; 
  border-color: #00b0ea; 
}

/* Geselecteerde staat (algemeen) */
.filter-btn.selected { 
  background: #075895; 
  color: white; 
  border-color: #075895; 
  font-weight: 600; 
  box-shadow: 0 2px 4px rgba(7, 88, 149, 0.3);
}

/* Voor labels (altijd blauw als selected) */
.btn-strat.selected {
    background: #075895 !important;
    border-color: #075895 !important;
}

/* Jaar selectie */
.year-select { 
  padding-right: 35px; 
  font-weight: bold; 
  color: #075895; 
  border: 2px solid #075895;
}

/* PH Filter block */
.ph-filter-wrapper {
    background: #f8fafc;
    border: 1px solid var(--c-pfo);
    border-radius: 6px;
    padding: 10px;
    margin: 15px auto;
    max-width: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}
.ph-label {
    color: var(--c-pfo);
    font-weight: bold;
    font-size: 0.9rem;
}
.ph-select {
    padding: 6px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #333;
}

/* Animaties */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>