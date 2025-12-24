// src/constants/types.js

// De interne codes die we in de database/JSON gebruiken
export const TYPES = {
  PFO: 'PFO',
  DB_BESLUIT: 'DBBesluit',
  DB_INFORMEEL: 'DBInformeel',
  DELTA: 'Delta',
  AB_BESLUIT: 'ABBesluit',
  AB_BRIEF: 'ABBrief' // Kwam ik ook tegen in je data
};

// De kleuren per fase (verwijst naar je CSS variabelen of hex)
export const PHASE_COLORS = {
  [TYPES.PFO]: 'var(--c-pfo)',
  [TYPES.DB_BESLUIT]: 'var(--c-db-besluit)',
  [TYPES.DB_INFORMEEL]: 'var(--c-db-informeel)',
  [TYPES.DELTA]: 'var(--c-delta)',
  [TYPES.AB_BESLUIT]: 'var(--c-ab-besluit)',
  // Fallback kleur
  default: '#ccc'
};

// De leesbare labels voor in de interface
export const PHASE_LABELS = {
  [TYPES.PFO]: 'PFO',
  [TYPES.DB_BESLUIT]: 'DB Besluit',
  [TYPES.DB_INFORMEEL]: 'Informeel DB',
  [TYPES.DELTA]: 'Delta',
  [TYPES.AB_BESLUIT]: 'AB Besluit',
  [TYPES.AB_BRIEF]: 'Brief aan AB'
};

// Status kleuren (Concept, Ingediend, etc.)
export const STATUS_COLORS = {
  Concept: '#95a5a6',     // Grijs
  Ingediend: '#f39c12',   // Oranje
  Geagendeerd: '#3498db', // Blauw
  Afgerond: '#27ae60'     // Groen
};