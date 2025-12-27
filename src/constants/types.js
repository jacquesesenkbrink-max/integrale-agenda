// src/constants/types.js

// 1. Definieer de unieke keys voor de fases
export const TYPES = {
    PFO: 'PFO',
    DB_BESLUIT: 'DBBesluit',
    DB_INFORMEEL: 'DBInformeel',
    DELTA: 'Delta',
    AB_BESLUIT: 'ABBesluit',
  };
  
  // 2. Bepaal de vaste volgorde (handig voor loops in je componenten)
  export const PHASE_ORDER = [
    TYPES.PFO, 
    TYPES.DB_BESLUIT, 
    TYPES.DB_INFORMEEL, 
    TYPES.DELTA, 
    TYPES.AB_BESLUIT
  ];
  
  // 3. Configuratie per fase (Label, Korte naam, Kleur CSS var)
  export const PHASE_CONFIG = {
    [TYPES.PFO]: { 
        label: 'Portefeuille Overleg', 
        short: 'PFO',          
        color: 'var(--c-pfo)' 
    },
    [TYPES.DB_BESLUIT]: { 
        label: 'Formeel DB',           
        short: 'DB Besluit',   
        color: 'var(--c-db-besluit)' 
    },
    [TYPES.DB_INFORMEEL]: { 
        label: 'Informeel DB',         
        short: 'Inf. DB',      
        color: 'var(--c-db-informeel)' 
    },
    [TYPES.DELTA]: { 
        label: 'Deltabijeenkomst',     
        short: 'Delta',        
        color: 'var(--c-delta)' 
    },
    [TYPES.AB_BESLUIT]: { 
        label: 'Formeel AB',           
        short: 'AB Besluit',   
        color: 'var(--c-ab-besluit)' 
    },
  };
  
  // 4. Strategische labels (ook handig om centraal te hebben)
  export const STRATEGIC_LABELS = [
    'Beleid',
    'Uitvoering',
    'Kaders',
    'Evaluatie',
    'Organisatiegesteldheid',
    'Externe ontwikkelingen',
    'P&C'
  ];