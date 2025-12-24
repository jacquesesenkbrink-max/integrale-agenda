<script setup>
// We definiëren de headers hier zodat we ze een kleur kunnen geven
const headers = [
  { label: 'Portefeuille overleg', color: 'var(--c-pfo)' },
  { label: 'Formeel DB', color: 'var(--c-db-besluit)' },
  { label: 'Informeel DB', color: 'var(--c-db-informeel)' },
  { label: 'Deltabijeenkomst', color: 'var(--c-delta)' },
  { label: 'Formeel AB', color: 'var(--c-ab-besluit)' }
];
</script>

<template>
  <div class="headers-wrapper">
    <div class="headers-content">
      <div class="headers-grid">
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
  background: white;
  position: sticky;
  top: 0;
  z-index: 80; /* Zorg dat hij onder de main header blijft maar boven content */
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  width: 100%;
}

.headers-content {
  /* Zelfde regels als .container in App.vue voor perfecte uitlijning */
  max-width: 1400px; 
  margin: 0 auto; 
  padding: 0 20px;
}

.headers-grid {
  display: grid;
  /* 5 kolommen, even breed + de gap die ook in App.vue wordt gebruikt */
  grid-template-columns: repeat(5, 1fr); 
  gap: 15px; 
}

.header-item {
  padding: 12px 5px;
  font-weight: 800;
  color: #4b5563;
  text-align: center;
  background: white;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  /* De gekleurde balk onderaan */
  border-bottom-width: 5px; 
  border-bottom-style: solid;
  
  /* Streepje rechts tussen de kolommen */
  border-right: 1px solid #f3f4f6;
  
  /* Zorgt dat de tekst mooi in het midden staat */
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-item:last-child {
  border-right: none;
}

/* Zorg dat headers verbergen op kleine schermen waar de grid layout ook verandert */
@media (max-width: 1100px) {
    .headers-wrapper { display: none; }
}
</style>