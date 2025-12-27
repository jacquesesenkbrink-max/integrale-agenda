<script setup>
import { useDataStore } from '../composables/useDataStore.js';

const store = useDataStore();

const headers = [
  { key: 'PFO', label: 'Portefeuille overleg', color: 'var(--c-pfo)' },
  { key: 'DBBesluit', label: 'Formeel DB', color: 'var(--c-db-besluit)' },
  { key: 'DBInformeel', label: 'Informeel DB', color: 'var(--c-db-informeel)' },
  { key: 'Delta', label: 'Deltabijeenkomst', color: 'var(--c-delta)' },
  { key: 'ABBesluit', label: 'Formeel AB', color: 'var(--c-ab-besluit)' }
];
</script>

<template>
  <div class="headers-wrapper">
    <div class="headers-content">
      <div class="headers-grid">
        <div 
          v-for="header in headers" 
          :key="header.key" 
          class="header-item"
          :style="{ borderBottomColor: header.color }"
        >
          <span class="label-text">{{ header.label }}</span>
          
          <button 
            class="toggle-mode-btn" 
            @click="store.toggleLaneMode(header.key)"
            :title="store.laneSettings.value[header.key] === 'dots' ? 'Toon als kaarten' : 'Toon als stippen'"
          >
            {{ store.laneSettings.value[header.key] === 'dots' ? '🟣' : '📄' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.headers-wrapper {
  background: white;
  position: sticky; top: 0; z-index: 80; 
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); width: 100%;
}
.headers-content { max-width: 1400px; margin: 0 auto; padding: 0 20px; }
.headers-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; }

.header-item {
  padding: 8px 10px;
  font-weight: 800;
  color: #4b5563;
  background: white;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom-width: 5px; border-bottom-style: solid;
  border-right: 1px solid #f3f4f6;
  
  display: flex; align-items: center; justify-content: space-between;
}
.header-item:last-child { border-right: none; }

.toggle-mode-btn {
    background: transparent; border: none; cursor: pointer;
    font-size: 1.1rem; padding: 2px 6px; border-radius: 4px;
    transition: background 0.2s; opacity: 0.6;
}
.toggle-mode-btn:hover { background: #f3f4f6; opacity: 1; }
@media (max-width: 1100px) { .headers-wrapper { display: none; } }
</style>