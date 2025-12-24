<script setup>
import { computed } from 'vue';

const props = defineProps({
    showAmbtelijk: Boolean
});

// We voegen PO en DT toe als de prop true is
const headers = computed(() => {
    const base = [
        { label: 'Portefeuille overleg', color: 'var(--c-pfo)' },
        { label: 'Formeel DB', color: 'var(--c-db-besluit)' },
        { label: 'Informeel DB', color: 'var(--c-db-informeel)' },
        { label: 'Deltabijeenkomst', color: 'var(--c-delta)' },
        { label: 'Formeel AB', color: 'var(--c-ab-besluit)' }
    ];

    if (props.showAmbtelijk) {
        return [
            { label: 'Programma Overleg', color: '#94a3b8' }, // Grijs-blauw
            { label: 'Directie Team', color: '#64748b' },     // Donkerder grijs
            ...base
        ];
    }
    return base;
});
</script>

<template>
  <div class="headers-wrapper">
    <div class="headers-content">
      <div class="headers-grid" :class="{ 'ambtelijk-active': showAmbtelijk }">
        <div 
          v-for="header in headers" 
          :key="header.label" 
          class="header-item"
          :style="{ borderBottomColor: header.color }"
        >
          {{ header.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.headers-wrapper {
  background: white; position: sticky; top: 0; z-index: 80;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); width: 100%;
}

.headers-content { max-width: 1400px; margin: 0 auto; padding: 0 20px; }

.headers-grid {
  display: grid;
  /* Standaard 5 kolommen */
  grid-template-columns: repeat(5, 1fr); 
  gap: 15px; 
  transition: all 0.3s ease;
}

/* Als ambtelijk actief is: 7 kolommen */
.headers-grid.ambtelijk-active {
  grid-template-columns: repeat(7, 1fr);
}

.header-item {
  padding: 12px 5px; font-weight: 800; color: #4b5563; text-align: center;
  background: white; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom-width: 5px; border-bottom-style: solid; border-right: 1px solid #f3f4f6;
  display: flex; align-items: center; justify-content: center;
}

.header-item:last-child { border-right: none; }

@media (max-width: 1100px) {
    .headers-wrapper { display: none; }
}
</style>