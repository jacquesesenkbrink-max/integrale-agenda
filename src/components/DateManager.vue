<script setup>
import { ref } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  initialDates: Object
})

const emit = defineEmits(['close', 'save-dates'])

// Lokale kopie van de datums
const dates = ref({})
const activeTab = ref('PFO') // Standaard actieve tab
const newDateInput = ref('')

// Tabs definitie (DBSchrift en ABBrief verwijderd)
const tabs = [
  { id: 'PFO', label: 'PFO' },
  { id: 'DBBesluit', label: 'DB Besluit' },
  { id: 'DBInformeel', label: 'Informeel DB' },
  { id: 'Delta', label: 'Delta' },
  { id: 'ABBesluit', label: 'AB Besluit' }
]

// Initialiseer bij openen
// src/components/DateManager.vue

const init = () => {
  // Veiligheidscheck: als initialDates er niet is, stop dan (voorkomt wit scherm crash)
  if (!props.initialDates) {
      dates.value = {};
      return;
  }

  // Deep copy van props
  try {
      dates.value = JSON.parse(JSON.stringify(props.initialDates));
  } catch (e) {
      console.error("Fout bij laden datums:", e);
      dates.value = {};
  }
  
  // Zorg dat elke tab een array heeft
  tabs.forEach(tab => {
    if (!dates.value[tab.id]) {
      dates.value[tab.id] = []
    }
  })
}

// Wordt aangeroepen door parent via v-if logic of watch, 
// maar voor eenvoud doen we het hier direct bij setup als prop er is
init()

const addDate = () => {
  if (!newDateInput.value) return
  
  // Simpele validatie dd-mm-yyyy (regex)
  const datePattern = /^\d{2}-\d{2}-\d{4}$/
  if (!datePattern.test(newDateInput.value)) {
    alert("Gebruik formaat DD-MM-JJJJ")
    return
  }

  // Toevoegen en sorteren
  dates.value[activeTab.value].push(newDateInput.value)
  dates.value[activeTab.value].sort((a, b) => {
    const [d1, m1, y1] = a.split('-')
    const [d2, m2, y2] = b.split('-')
    return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`)
  })

  newDateInput.value = ''
}

const removeDate = (dateStr) => {
  if (confirm(`Datum ${dateStr} verwijderen?`)) {
    dates.value[activeTab.value] = dates.value[activeTab.value].filter(d => d !== dateStr)
  }
}

const save = () => {
  emit('save-dates', dates.value)
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Beheer Datums</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal-body">
        <div class="tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
          <h3>Datums voor: {{ tabs.find(t => t.id === activeTab)?.label }}</h3>
          
          <div class="add-box">
            <input 
              v-model="newDateInput" 
              placeholder="DD-MM-JJJJ" 
              @keyup.enter="addDate"
            />
            <button class="btn-add" @click="addDate">Toevoegen</button>
          </div>

          <ul class="date-list">
            <li v-for="date in dates[activeTab]" :key="date">
              {{ date }}
              <span class="remove-icon" @click="removeDate(date)">&times;</span>
            </li>
            <li v-if="!dates[activeTab] || dates[activeTab].length === 0" class="empty">
              Nog geen datums
            </li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Annuleren</button>
        <button class="btn-save" @click="save">Opslaan & Sluiten</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dezelfde styling als EditModal, plus tabs */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); display: flex;
  justify-content: center; align-items: center; z-index: 1000;
}
.modal-content {
  background: white; width: 600px; max-width: 95%; height: 80vh;
  border-radius: 8px; display: flex; flex-direction: column;
}
.modal-header {
  padding: 16px; border-bottom: 1px solid #eee;
  display: flex; justify-content: space-between; align-items: center;
}
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.modal-body { padding: 0; flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* Tabs Styling */
.tabs {
  display: flex; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;
  overflow-x: auto; /* scrollen als het niet past */
}
.tab-btn {
  padding: 12px 16px; border: none; background: transparent;
  cursor: pointer; border-bottom: 3px solid transparent;
  font-weight: 500; color: #64748b; white-space: nowrap;
}
.tab-btn.active {
  color: #2563eb; border-bottom-color: #2563eb; background: white;
}

.tab-content { padding: 20px; flex: 1; overflow-y: auto; }
.add-box { display: flex; gap: 10px; margin-bottom: 20px; }
.add-box input { padding: 8px; border: 1px solid #ccc; border-radius: 4px; flex: 1; }
.btn-add { padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; }

.date-list { list-style: none; padding: 0; margin: 0; border: 1px solid #eee; border-radius: 4px; }
.date-list li {
  padding: 10px; border-bottom: 1px solid #eee;
  display: flex; justify-content: space-between;
}
.date-list li:last-child { border-bottom: none; }
.remove-icon { color: red; cursor: pointer; font-weight: bold; padding: 0 5px; }
.empty { color: #999; font-style: italic; }

.modal-footer {
  padding: 16px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 10px;
}
.btn-cancel { padding: 8px 16px; background: white; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; }
.btn-save { padding: 8px 16px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>