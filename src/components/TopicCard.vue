<script setup>
import { computed } from 'vue';

const props = defineProps({
  event: Object,
  isAdmin: Boolean,
  isFocused: Boolean,
  isCompact: Boolean
});

const emit = defineEmits(['toggle-focus', 'open-details', 'edit', 'delete']);

const statusColor = computed(() => {
  const map = { 'Concept': '#f1c40f', 'Ingediend': '#e67e22', 'Geagendeerd': '#3498db', 'Afgerond': '#27ae60' };
  return map[props.event.originalItem?.scheduleStatus?.[props.event.type]] || '#95a5a6';
});

const cardClasses = computed(() => ({
  'is-focused': props.isFocused,
  'is-compact': props.isCompact
}));
</script>

<template>
  <div class="card-wrapper" :class="cardClasses" :id="'card-' + event.uniqueId">
    
    <div 
      v-if="isCompact" 
      class="compact-dot"
      :style="{ backgroundColor: statusColor }"
      @click="emit('open-details', event.originalItem)"
      :title="event.title"
    >
      <div v-if="isFocused" class="focus-indicator"></div>
    </div>

    <div v-else class="topic-card" :style="{ borderTopColor: statusColor }">
      <div class="card-header">
        <span class="date-badge">{{ event.dateDisplay }}</span>
        <div class="card-actions">
           <button class="icon-btn focus-btn" @click.stop="emit('toggle-focus', event.topicId)">
             {{ isFocused ? '◉' : '◎' }}
           </button>
           <template v-if="isAdmin">
             <button class="icon-btn" @click.stop="emit('edit', event.originalItem)">✏️</button>
             <button class="icon-btn delete-btn" @click.stop="emit('delete', event.originalItem)">🗑️</button>
           </template>
        </div>
      </div>

      <div class="card-body" @click="emit('open-details', event.originalItem)">
        <h4 class="topic-title">{{ event.title }}</h4>
        <div class="meta-info">
            <span v-if="event.ph" class="pill ph-pill">👤 {{ event.ph }}</span>
        </div>
        <div class="status-row">
            <span class="status-dot" :style="{ backgroundColor: statusColor }"></span>
            <span class="status-text">{{ event.originalItem?.scheduleStatus?.[event.type] || 'Concept' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* FIX: Zorg dat de wrapper de grid-cel volledig vult */
.card-wrapper {
  width: 100%;
  height: 100%; /* Vul de hoogte van de grid row */
  min-height: 0; /* Voorkom grid overflow issues */
  display: flex;
  flex-direction: column;
}

/* Stip styles */
.compact-dot {
  width: 28px; height: 28px; border-radius: 50%;
  margin: 0 auto; /* Horizontaal centreren in de kolom */
  cursor: pointer; position: relative;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.compact-dot:hover { transform: scale(1.2); }
.focus-indicator {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 10px; height: 10px; background: white; border-radius: 50%;
}

/* Kaart styles */
.topic-card {
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  border-top: 4px solid #ccc;
  display: flex; flex-direction: column;
  flex: 1; /* Rek uit om wrapper te vullen */
  transition: transform 0.2s, box-shadow 0.2s;
}
.topic-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }

.card-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 10px; background: #f8f9fa; border-bottom: 1px solid #eee;
}
.date-badge { font-size: 0.75rem; color: #666; background: #eee; padding: 2px 6px; border-radius: 4px; }

.card-actions { display: flex; gap: 5px; }
.icon-btn { background: none; border: none; cursor: pointer; opacity: 0.5; font-size: 1rem; padding: 0; }
.icon-btn:hover { opacity: 1; }
.delete-btn:hover { color: #e74c3c; }

.card-body { padding: 10px; cursor: pointer; display: flex; flex-direction: column; gap: 5px; flex: 1; }
.topic-title { margin: 0; font-size: 0.9rem; color: #2c3e50; line-height: 1.3; }

.meta-info { margin-top: auto; display: flex; gap: 5px; flex-wrap: wrap; }
.pill { font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; background: #e8f6f3; color: #16a085; }

.status-row { display: flex; align-items: center; gap: 5px; font-size: 0.75rem; color: #888; margin-top: 5px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }

.card-wrapper.is-focused .topic-card { box-shadow: 0 0 0 2px #f1c40f; }
</style>