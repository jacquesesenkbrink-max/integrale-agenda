<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  show: Boolean,
  item: Object,
  availableDates: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'save'])

// --- STANDAARD LIJSTEN ---
const listPH = ['D.S. Schoonman', 'H.J. Pereboom', 'N. Koks', 'J.C.G. Wijnen', 'M. Wesselink', 'F. Stienstra'];
const listDir = ['M. Werges', 'I. Geveke', 'M. Boersen'];
const listHead = []; // Nog geen afdelingshoofden, dus leeg + 'Anders' optie
const listLabels = ['Beleid', 'Uitvoering', 'Kaders', 'Organisatiegesteldheid', 'Externe ontwikkelingen', 'Evaluatie', 'P&C'];

const defaultForm = {
  id: null,
  title: '',
  ph: '',           // Portefeuillehouder
  colleaguePH: '',  // Collega PH
  dir: '',          // Directeur
  headOfDept: '',   // Afdelingshoofd
  on: '',           // Steller (gemapt op 'on' voor compatibiliteit data)
  
  strategicLabel: '',
  toelichting: '',  // Was 'comments' in data
  comments: '',     // Voor de zekerheid beide behouden
  
  schedule: {
    PFO: '',
    DBBesluit: '',
    DBInformeel: '',
    Delta: '',
    ABBesluit: ''
  },
  scheduleStatus: {
    PFO: 'Concept',
    DBBesluit: 'Concept',
    DBInformeel: 'Concept',
    Delta: 'Concept',
    ABBesluit: 'Concept'
  }
}

const formData = ref({ ...defaultForm })

// --- UI STATUSSEN VOOR DROPDOWNS (Selectie vs Eigen Invoer) ---
const uiState = ref({
  selPH: '',
  selColleaguePH: '',
  selDir: '',
  selHead: '',
  selLabel: ''
});

// Statussen voor de planning blokjes
const statusOptions = ['Concept', 'Ingediend', 'Geagendeerd', 'Afgerond'];

// Helper om te bepalen of een waarde in de standaardlijst zit
function setUiState(field, value, list) {
    if (!value) {
        uiState.value[field] = '';
    } else if (list.includes(value)) {
        uiState.value[field] = value;
    } else {
        uiState.value[field] = 'Anders';
    }
}

// Watcher: Als modal opent of item wijzigt
watch(() => props.item, (newItem) => {
  if (newItem) {
    const copy = JSON.parse(JSON.stringify(newItem))
    
    // Fallbacks voor lege objecten
    if (!copy.schedule) copy.schedule = { ...defaultForm.schedule }
    if (!copy.scheduleStatus) copy.scheduleStatus = { ...defaultForm.scheduleStatus }
    
    // Sync oude veldnamen indien nodig
    if (copy.portefeuillehouder && !copy.ph) copy.ph = copy.portefeuillehouder;

    formData.value = copy;

    // UI state goedzetten
    setUiState('selPH', copy.ph, listPH);
    setUiState('selColleaguePH', copy.colleaguePH, listPH);
    setUiState('selDir', copy.dir, listDir);
    setUiState('selHead', copy.headOfDept, listHead);
    setUiState('selLabel', copy.strategicLabel, listLabels);

  } else {
    // Reset naar leeg
    formData.value = JSON.parse(JSON.stringify(defaultForm))
    formData.value.id = Date.now()
    
    // UI state reset
    uiState.value = { selPH: '', selColleaguePH: '', selDir: '', selHead: '', selLabel: '' };
  }
}, { immediate: true })

// Helper: update data als dropdown wijzigt
function handleSelectChange(uiField, dataField, value) {
    if (value !== 'Anders') {
        formData.value[dataField] = value;
    } else {
        if (listPH.includes(formData.value[dataField]) || listDir.includes(formData.value[dataField]) || listLabels.includes(formData.value[dataField])) {
            formData.value[dataField] = ''; 
        }
    }
}

const save = () => {
  if(formData.value.toelichting) formData.value.comments = formData.value.toelichting;
  emit('save', formData.value)
}

const cancel = () => {
  emit('close')
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="cancel">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ item ? 'Agendapunt Bewerken' : 'Nieuw Agendapunt' }}</h2>
        <button class="close-btn" @click="cancel">&times;</button>
      </div>

      <div class="modal-body">
        
        <div class="form-group">
          <label>Onderwerp Titel</label>
          <input type="text" v-model="formData.title" placeholder="Bijv. Jaarstukken 2024" autofocus>
        </div>

        <div class="grid-2">
            <div class="form-group">
                <label>Portefeuillehouder (PH)</label>
                <select v-model="uiState.selPH" @change="handleSelectChange('selPH', 'ph', uiState.selPH)">
                    <option value="">-- Selecteer --</option>
                    <option v-for="opt in listPH" :key="opt" :value="opt">{{ opt }}</option>
                    <option value="Anders">Anders, nl...</option>
                </select>
                <input 
                    v-if="uiState.selPH === 'Anders'" 
                    type="text" 
                    v-model="formData.ph" 
                    placeholder="Vul naam PH in..." 
                    class="custom-input"
                >
            </div>

            <div class="form-group">
                <label>Collega Portefeuillehouder</label>
                <select v-model="uiState.selColleaguePH" @change="handleSelectChange('selColleaguePH', 'colleaguePH', uiState.selColleaguePH)">
                    <option value="">-- Geen --</option>
                    <option v-for="opt in listPH" :key="opt" :value="opt">{{ opt }}</option>
                    <option value="Anders">Anders, nl...</option>
                </select>
                <input 
                    v-if="uiState.selColleaguePH === 'Anders'" 
                    type="text" 
                    v-model="formData.colleaguePH" 
                    placeholder="Vul naam collega in..." 
                    class="custom-input"
                >
            </div>
        </div>

        <div class="grid-2">
            <div class="form-group">
                <label>Directielid</label>
                <select v-model="uiState.selDir" @change="handleSelectChange('selDir', 'dir', uiState.selDir)">
                    <option value="">-- Selecteer --</option>
                    <option v-for="opt in listDir" :key="opt" :value="opt">{{ opt }}</option>
                    <option value="Anders">Anders, nl...</option>
                </select>
                <input 
                    v-if="uiState.selDir === 'Anders'" 
                    type="text" 
                    v-model="formData.dir" 
                    placeholder="Vul naam directeur in..." 
                    class="custom-input"
                >
            </div>

            <div class="form-group">
                <label>Afdelingshoofd</label>
                <select v-model="uiState.selHead" @change="handleSelectChange('selHead', 'headOfDept', uiState.selHead)">
                    <option value="">-- Selecteer --</option>
                    <option v-for="opt in listHead" :key="opt" :value="opt">{{ opt }}</option>
                    <option value="Anders">Anders, nl...</option>
                </select>
                <input 
                    v-if="uiState.selHead === 'Anders'" 
                    type="text" 
                    v-model="formData.headOfDept" 
                    placeholder="Vul naam afdelingshoofd in..." 
                    class="custom-input"
                >
            </div>
        </div>

        <div class="grid-2">
            <div class="form-group">
                <label>Steller(s) (max 2 namen)</label>
                <input type="text" v-model="formData.on" placeholder="Naam 1, Naam 2" class="input-steller">
            </div>

            <div class="form-group">
                <label>Strategisch Label</label>
                <select v-model="uiState.selLabel" @change="handleSelectChange('selLabel', 'strategicLabel', uiState.selLabel)">
                    <option value="">-- Kies Label --</option>
                    <option v-for="opt in listLabels" :key="opt" :value="opt">{{ opt }}</option>
                    <option value="Anders">Anders, nl...</option>
                </select>
                <input 
                    v-if="uiState.selLabel === 'Anders'" 
                    type="text" 
                    v-model="formData.strategicLabel" 
                    placeholder="Vul label in..." 
                    class="custom-input"
                >
            </div>
        </div>

        <div class="form-group">
          <label>Toelichting en/of opmerkingen</label>
          <textarea v-model="formData.comments" rows="3" placeholder="Interne notities..."></textarea>
        </div>

        <hr class="divider">

        <h3>Planning & Status</h3>
        <p class="hint-text">Selecteer per fase de datum én de status.</p>
        
        <div class="date-grid">
            <div class="form-group schedule-block">
                <label>PFO</label>
                <div class="input-row">
                    <select v-model="formData.schedule.PFO" class="date-select">
                        <option value="">-- Datum --</option>
                        <option v-for="date in (availableDates.PFO || [])" :key="date" :value="date">{{ date }}</option>
                    </select>
                    <select v-model="formData.scheduleStatus.PFO" class="status-select" :class="formData.scheduleStatus.PFO">
                        <option v-for="s in statusOptions" :key="s">{{ s }}</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group schedule-block">
                <label>DB Besluit</label>
                <div class="input-row">
                    <select v-model="formData.schedule.DBBesluit" class="date-select">
                        <option value="">-- Datum --</option>
                        <option v-for="date in (availableDates.DBBesluit || [])" :key="date" :value="date">{{ date }}</option>
                    </select>
                    <select v-model="formData.scheduleStatus.DBBesluit" class="status-select" :class="formData.scheduleStatus.DBBesluit">
                        <option v-for="s in statusOptions" :key="s">{{ s }}</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group schedule-block">
                <label>Informeel DB</label>
                <div class="input-row">
                    <select v-model="formData.schedule.DBInformeel" class="date-select">
                        <option value="">-- Datum --</option>
                        <option v-for="date in (availableDates.DBInformeel || [])" :key="date" :value="date">{{ date }}</option>
                    </select>
                    <select v-model="formData.scheduleStatus.DBInformeel" class="status-select" :class="formData.scheduleStatus.DBInformeel">
                        <option v-for="s in statusOptions" :key="s">{{ s }}</option>
                    </select>
                </div>
            </div>

            <div class="form-group schedule-block">
                <label>Delta</label>
                <div class="input-row">
                    <select v-model="formData.schedule.Delta" class="date-select">
                        <option value="">-- Datum --</option>
                        <option v-for="date in (availableDates.Delta || [])" :key="date" :value="date">{{ date }}</option>
                    </select>
                    <select v-model="formData.scheduleStatus.Delta" class="status-select" :class="formData.scheduleStatus.Delta">
                        <option v-for="s in statusOptions" :key="s">{{ s }}</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group schedule-block">
                <label>AB Besluit</label>
                <div class="input-row">
                    <select v-model="formData.schedule.ABBesluit" class="date-select">
                        <option value="">-- Datum --</option>
                        <option v-for="date in (availableDates.ABBesluit || [])" :key="date" :value="date">{{ date }}</option>
                    </select>
                    <select v-model="formData.scheduleStatus.ABBesluit" class="status-select" :class="formData.scheduleStatus.ABBesluit">
                        <option v-for="s in statusOptions" :key="s">{{ s }}</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="cancel">Annuleren</button>
        <button class="btn-save" @click="save">Opslaan</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;
}
.modal-content {
  background: white; width: 800px; max-width: 95%; max-height: 90vh;
  overflow-y: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  display: flex; flex-direction: column;
}
.modal-header { padding: 16px 24px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; }
.modal-header h2 { margin: 0; font-size: 1.25rem; color: #2c3e50; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
.modal-body { padding: 24px; flex: 1; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 10px; }

.date-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
  gap: 16px; background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb;
}

.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.9rem; color: #34495e; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.95rem; font-family: inherit;
}

/* NIEUW: Specifieke styling voor het steller veld om breedte te beperken */
.input-steller {
    max-width: 80%; /* Pas dit percentage aan naar wens, bijv. 70% of 300px */
}

/* Speciaal input veld voor 'Anders, nl...' */
.custom-input {
    margin-top: 8px;
    background-color: #fffcf0;
    border-color: #f1c40f;
}

.input-row { display: flex; gap: 8px; }
.date-select { flex: 2; }
.status-select { flex: 1; font-weight: bold; }

.status-select.Afgerond { color: #27ae60; border-color: #27ae60; }
.status-select.Geagendeerd { color: #3498db; }

.divider { border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 12px; background: #f9fafb; }
.btn-cancel { padding: 10px 20px; background: white; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; font-weight: bold; color: #555; }
.btn-save { padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-save:hover { background: #219150; }

@media (max-width: 650px) { .grid-2 { grid-template-columns: 1fr; } }
</style>