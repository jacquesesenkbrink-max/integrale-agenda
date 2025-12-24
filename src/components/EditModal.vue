<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: Boolean,
  item: Object,
  availableDates: {
    type: Object,
    default: () => ({})
  },
  showAmbtelijk: Boolean // Toegevoegd voor volledigheid
})

const emit = defineEmits(['close', 'save'])

// --- STANDAARD LIJSTEN ---
const listPH = ['D.S. Schoonman', 'H.J. Pereboom', 'N. Koks', 'J.C.G. Wijnen', 'M. Wesselink', 'F. Stienstra'];
const listDir = ['M. Werges', 'I. Geveke', 'M. Boersen'];
const listHead = []; 
const listLabels = ['Beleid', 'Uitvoering', 'Kaders', 'Organisatiegesteldheid', 'Externe ontwikkelingen', 'Evaluatie', 'P&C'];
const statusOptions = ['Concept', 'Ingediend', 'Geagendeerd', 'Afgerond'];

const defaultForm = {
  id: null,
  title: '',
  ph: '', colleaguePH: '', dir: '', headOfDept: '', on: '',
  strategicLabel: '', toelichting: '', comments: '',
  schedule: { PFO: '', DBBesluit: '', DBInformeel: '', Delta: '', ABBesluit: '' },
  scheduleStatus: { PFO: 'Concept', DBBesluit: 'Concept', DBInformeel: 'Concept', Delta: 'Concept', ABBesluit: 'Concept' }
}

const formData = ref({ ...defaultForm })
const uiState = ref({ selPH: '', selColleaguePH: '', selDir: '', selHead: '', selLabel: '' });

function setUiState(field, value, list) {
    if (!value) uiState.value[field] = '';
    else if (list.includes(value)) uiState.value[field] = value;
    else uiState.value[field] = 'Anders';
}

watch(() => props.item, (newItem) => {
  if (newItem) {
    const copy = JSON.parse(JSON.stringify(newItem))
    if (!copy.schedule) copy.schedule = { ...defaultForm.schedule }
    if (!copy.scheduleStatus) copy.scheduleStatus = { ...defaultForm.scheduleStatus }
    if (copy.portefeuillehouder && !copy.ph) copy.ph = copy.portefeuillehouder;

    formData.value = copy;
    setUiState('selPH', copy.ph, listPH);
    setUiState('selColleaguePH', copy.colleaguePH, listPH);
    setUiState('selDir', copy.dir, listDir);
    setUiState('selHead', copy.headOfDept, listHead);
    setUiState('selLabel', copy.strategicLabel, listLabels);
  } else {
    formData.value = JSON.parse(JSON.stringify(defaultForm))
    formData.value.id = Date.now()
    uiState.value = { selPH: '', selColleaguePH: '', selDir: '', selHead: '', selLabel: '' };
  }
}, { immediate: true })

function handleSelectChange(uiField, dataField, value) {
    if (value !== 'Anders') formData.value[dataField] = value;
    else if ([listPH, listDir, listLabels].some(l => l.includes(formData.value[dataField]))) formData.value[dataField] = '';
}

const save = () => {
  if(formData.value.toelichting) formData.value.comments = formData.value.toelichting;
  emit('save', formData.value)
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ item ? 'Agendapunt Bewerken' : 'Nieuw Agendapunt' }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
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
                <input v-if="uiState.selPH === 'Anders'" type="text" v-model="formData.ph" class="custom-input">
            </div>
            <div class="form-group">
                <label>Collega PH</label>
                <select v-model="uiState.selColleaguePH" @change="handleSelectChange('selColleaguePH', 'colleaguePH', uiState.selColleaguePH)">
                    <option value="">-- Geen --</option>
                    <option v-for="opt in listPH" :key="opt" :value="opt">{{ opt }}</option>
                    <option value="Anders">Anders, nl...</option>
                </select>
                <input v-if="uiState.selColleaguePH === 'Anders'" type="text" v-model="formData.colleaguePH" class="custom-input">
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
                <input v-if="uiState.selDir === 'Anders'" type="text" v-model="formData.dir" class="custom-input">
            </div>
            <div class="form-group">
                <label>Strategisch Label</label>
                <select v-model="uiState.selLabel" @change="handleSelectChange('selLabel', 'strategicLabel', uiState.selLabel)">
                    <option value="">-- Kies Label --</option>
                    <option v-for="opt in listLabels" :key="opt" :value="opt">{{ opt }}</option>
                    <option value="Anders">Anders, nl...</option>
                </select>
                <input v-if="uiState.selLabel === 'Anders'" type="text" v-model="formData.strategicLabel" class="custom-input">
            </div>
        </div>

        <div class="form-group">
            <label>Steller(s)</label>
            <input type="text" v-model="formData.on" placeholder="Naam 1, Naam 2" class="input-steller">
        </div>

        <div class="form-group">
          <label>Toelichting</label>
          <textarea v-model="formData.comments" rows="3"></textarea>
        </div>

        <hr class="divider">

        <h3>Planning & Status</h3>
        <div class="date-grid">
            <div v-for="(key) in ['PFO', 'DBBesluit', 'DBInformeel', 'Delta', 'ABBesluit']" :key="key" class="form-group schedule-block">
                <label>{{ key }}</label>
                <div class="input-row">
                    <select v-model="formData.schedule[key]" class="date-select">
                        <option value="">-- Datum --</option>
                        <option v-for="date in (availableDates[key] || [])" :key="date" :value="date">{{ date }}</option>
                    </select>
                    <select v-model="formData.scheduleStatus[key]" class="status-select" :class="formData.scheduleStatus[key]">
                        <option v-for="s in statusOptions" :key="s">{{ s }}</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">Annuleren</button>
        <button class="btn-save" @click="save">Opslaan</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; width: 800px; max-width: 95%; max-height: 90vh; overflow-y: auto; border-radius: 8px; display: flex; flex-direction: column; }
.modal-header { padding: 16px 24px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; }
.modal-body { padding: 24px; flex: 1; }
.modal-footer { padding: 16px 24px; border-top: 1px solid #eee; display: flex; justify-content: flex-end; gap: 12px; background: #f9fafb; }
.close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.date-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; background: #f9fafb; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 600; font-size: 0.9rem; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.custom-input { margin-top: 5px; background: #fffbe6; border-color: #f1c40f; }
.input-row { display: flex; gap: 8px; }
.date-select { flex: 2; }
.status-select { flex: 1; font-weight: bold; }
.status-select.Afgerond { color: green; } .status-select.Geagendeerd { color: #2980b9; }
.btn-save { background: #27ae60; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
.btn-cancel { background: white; border: 1px solid #ccc; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
</style>