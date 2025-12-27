// src/composables/useConnections.js
import { ref, onMounted, onUnmounted } from 'vue';
import { DEFAULT_COLOR } from '../config/appSettings.js';

export function useConnections(activeFocusId, viewMode, laneSettings) {
    const connectionsPath = ref('');
    const strokeColor = ref(DEFAULT_COLOR);
    const timelineRef = ref(null);
    let resizeTimeout = null;

    function drawConnections() {
        // Alleen tekenen als er een focus is en de container bestaat
        if (!activeFocusId.value || !timelineRef.value) return;
        
        const topicId = activeFocusId.value;
        // Zoek alle kaartjes die bij dit topic horen
        const cards = Array.from(timelineRef.value.querySelectorAll(`[id^='card-${topicId}-']`));
        
        // Sorteer ze visueel van boven naar beneden (belangrijk voor de lijn)
        cards.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

        if (cards.length < 2) { 
            connectionsPath.value = ''; 
            return; 
        }

        // Bepaal de kleur op basis van het eerste kaartje
        const style = window.getComputedStyle(cards[0]);
        // Let op: afhankelijk van of het een stip of kaart is, pakken we background of border
        // Dit is een simpele check, kan geavanceerder als dat nodig is
        strokeColor.value = style.borderTopColor !== 'rgba(0, 0, 0, 0)' && style.borderTopColor 
            ? style.borderTopColor 
            : style.backgroundColor;

        if (!strokeColor.value || strokeColor.value === 'rgba(0, 0, 0, 0)') strokeColor.value = DEFAULT_COLOR;

        const containerRect = timelineRef.value.getBoundingClientRect();
        let pathD = '';
        
        // Teken curves tussen de punten
        for (let i = 0; i < cards.length - 1; i++) {
            const rectA = cards[i].getBoundingClientRect();
            const rectB = cards[i+1].getBoundingClientRect();
            
            const x1 = rectA.left + (rectA.width / 2) - containerRect.left;
            const y1 = rectA.top + (rectA.height / 2) - containerRect.top;
            const x2 = rectB.left + (rectB.width / 2) - containerRect.left;
            const y2 = rectB.top + (rectB.height / 2) - containerRect.top;
            
            const deltaY = y2 - y1;
            pathD += `M ${x1} ${y1} C ${x1} ${y1 + deltaY * 0.5}, ${x2} ${y2 - deltaY * 0.5}, ${x2} ${y2} `;
        }
        connectionsPath.value = pathD;
    }

    // Debounce resize handler
    function handleResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            drawConnections();
        }, 200);
    }

    onMounted(() => {
        window.addEventListener('resize', handleResize);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
    });

    return {
        connectionsPath,
        strokeColor,
        timelineRef,
        drawConnections
    };
}