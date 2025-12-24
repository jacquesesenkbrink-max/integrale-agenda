<script setup>
defineProps({
  activeView: String,
  isAdmin: Boolean
});

defineEmits(['navigate', 'toggle-admin', 'new-item']);
</script>

<template>
  <aside class="sidebar-nav">
    <div class="brand">
        <h2>Agenda</h2>
    </div>

    <div class="nav-links">
        <button 
            class="nav-btn" 
            :class="{ active: activeView === 'grid' }"
            @click="$emit('navigate', 'grid')"
        >
            📅 Overzicht (Grid)
        </button>
        
        <button 
            class="nav-btn" 
            :class="{ active: activeView === 'table' }"
            @click="$emit('navigate', 'table')"
        >
            📄 Rapportage
        </button>
        
        <button 
            class="nav-btn" 
            :class="{ active: activeView === 'agenda' }"
            @click="$emit('navigate', 'agenda')"
        >
            ⏱️ Agenda Lijst
        </button>
    </div>

    <div class="admin-section">
        <button class="toggle-btn" @click="$emit('toggle-admin')">
            {{ isAdmin ? '🔓 Admin Actief' : '🔒 Gast Modus' }}
        </button>
        
        <button 
            v-if="isAdmin"
            class="nav-btn secondary"
            :class="{ active: activeView === 'admin' }"
            @click="$emit('navigate', 'admin')"
        >
            ⚙️ Beheer Datums
        </button>
    </div>

    <div class="action-section">
        <button class="new-item-btn" @click="$emit('new-item')">
            + Nieuw Punt
        </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar-nav {
    width: 250px;
    background: #2c3e50;
    color: white;
    height: 100vh;
    position: fixed;
    left: 0; top: 0;
    display: flex;
    flex-direction: column;
    padding: 20px;
    z-index: 100;
}

.brand h2 {
    color: white;
    margin-top: 0;
    padding-bottom: 20px;
    border-bottom: 1px solid #34495e;
}

.nav-links {
    margin-top: 20px;
    display: flex; flex-direction: column; gap: 10px;
}

.nav-btn {
    background: transparent;
    border: none;
    color: #ecf0f1;
    text-align: left;
    padding: 12px 15px;
    cursor: pointer;
    border-radius: 6px;
    font-size: 1rem;
    transition: background 0.2s;
}
.nav-btn:hover { background: #34495e; }
.nav-btn.active { background: #3498db; color: white; font-weight: bold; }
.nav-btn.secondary { font-size: 0.9rem; color: #bdc3c7; }

.admin-section {
    margin-top: auto;
    padding-top: 20px;
    border-top: 1px solid #34495e;
    display: flex; flex-direction: column; gap: 10px;
}

.toggle-btn {
    background: #2c3e50; border: 1px solid #7f8c8d; color: #bdc3c7;
    padding: 8px; border-radius: 4px; cursor: pointer; font-size: 0.85rem;
}
.toggle-btn:hover { background: #34495e; color: white; }

.action-section { margin-top: 20px; }

.new-item-btn {
    width: 100%;
    background: #27ae60;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
    font-size: 1rem;
}
.new-item-btn:hover { background: #219150; }

@media (max-width: 1100px) {
    .sidebar-nav { width: 80px; padding: 10px; }
    .brand h2 { font-size: 0.8rem; }
    .nav-btn { font-size: 0.8rem; padding: 10px 5px; text-align: center; }
    .new-item-btn { font-size: 1.5rem; padding: 5px; }
}
</style>