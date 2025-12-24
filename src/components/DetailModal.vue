<script setup>
const props = defineProps({
  show: Boolean,
  item: Object
});

const emit = defineEmits(['close']);

function sluit() {
  emit('close');
}

// Lijst opgeschoond: DBSchrift en ABBrief verwijderd voor weergave in flow
const fases = [
  { key: 'PFO', label: 'PFO', color: 'var(--c-pfo)' },
  { key: 'DBBesluit', label: 'DB Besluit', color: 'var(--c-db-besluit)' },
  { key: 'DBInformeel', label: 'Informeel DB', color: 'var(--c-db-informeel)' },
  { key: 'Delta', label: 'Delta', color: 'var(--c-delta)' },
  { key: 'ABBesluit', label: 'AB Besluit', color: 'var(--c-ab-besluit)' }
];
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="sluit">
    
    <div class="modal-content" @click.stop>
      <span class="close-btn" @click="sluit">&times;</span>
      
      <div v-if="item">
        <h2>{{ item.title }}</h2>
        
        <div class="meta-grid">
            <div class="meta-item">
                <span class="label">PH:</span>
                <span class="value">{{ item.ph }}</span>
            </div>
            
            <div class="meta-item" v-if="item.colleaguePH">
                <span class="label">Mede-PH:</span>
                <span class="value">{{ item.colleaguePH }}</span>
            </div>

            <div class="meta-item">
                <span class="label">Directeur:</span>
                <span class="value">{{ item.dir }}</span>
            </div>

            <div class="meta-item" v-if="item.headOfDept">
                <span class="label">Afd. Hoofd:</span>
                <span class="value">{{ item.headOfDept }}</span>
            </div>

            <div class="meta-item" v-if="item.on">
                <span class="label">Ondersteuning:</span>
                <span class="value">{{ item.on }}</span>
            </div>
            
            <div class="meta-item" v-else-if="item.administrativeContact">
                <span class="label">Aanspreekpunt:</span>
                <span class="value">{{ item.administrativeContact }}</span>
            </div>

            <div class="meta-item" v-if="item.strategicLabel">
                <span class="label">Label:</span>
                <span class="value strategic-tag">{{ item.strategicLabel }}</span>
            </div>
        </div>

        <div v-if="item.toelichting" class="description-block">
            <strong>Toelichting:</strong>
            <p>{{ item.toelichting }}</p>
        </div>
        
        <hr>
        
        <h3>Planning Verloop</h3>
        <div class="flow-list">
            <div v-for="fase in fases" :key="fase.key" class="flow-row">
                <div class="flow-label">
                    <span class="dot" :style="{ background: fase.color }"></span>
                    {{ fase.label }}
                </div>
                <div class="flow-date" :class="{ 'has-date': item.schedule[fase.key] }">
                    {{ item.schedule[fase.key] || '-' }}
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 95%;
  max-width: 600px; /* Iets breder voor meer info */
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 10px; right: 15px;
  font-size: 28px;
  cursor: pointer;
  font-weight: bold;
  color: #aaa;
}
.close-btn:hover { color: #000; }

h2 { margin-top: 0; color: #2c3e50; font-size: 1.4rem; margin-bottom: 1rem; line-height: 1.3; }
h3 { font-size: 1rem; margin-top: 20px; color: #666; text-transform: uppercase; }

/* Nieuwe Grid Stijl */
.meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    background: #f4f7f6;
    padding: 15px;
    border-radius: 6px;
    margin-bottom: 15px;
    font-size: 0.9rem;
}

.meta-item {
    display: flex;
    flex-direction: column;
}

.meta-item .label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    font-weight: bold;
    margin-bottom: 2px;
}

.meta-item .value {
    color: #2c3e50;
    font-weight: 500;
}

.strategic-tag {
    display: inline-block;
    background: #e2e8f0;
    color: #475569;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
}

.description-block {
    background: #fff;
    border-left: 4px solid #3498db;
    padding: 10px;
    color: #555;
    font-size: 0.95rem;
    margin-bottom: 15px;
}
.description-block strong { display: block; margin-bottom: 4px; color: #333; }
.description-block p { margin: 0; line-height: 1.5; font-style: italic; }

.flow-list {
    background: #f9f9f9;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #eee;
}

.flow-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
}
.flow-row:last-child { border-bottom: none; }

.flow-label { display: flex; align-items: center; font-weight: 600; color: #555; }
.dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; display: inline-block; }

.flow-date { font-family: monospace; color: #ccc; }
.flow-date.has-date { color: #2c3e50; font-weight: bold; }

@media (max-width: 500px) {
    .meta-grid { grid-template-columns: 1fr; }
}
</style>