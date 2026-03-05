// Political relevance keywords for Corrientes Province
// Used by the keyword pre-filter (Layer 1) to skip clearly irrelevant articles

export const POLITICAL_ACTORS = [
  // Governor & Vice Governor
  'Juan Pablo Valdés',
  'Braillard Poccard',
  'Néstor Braillard',
  // Former Governor / Senator
  'Gustavo Valdés',
  // Key political figures
  'Claudio Polich',
  'Martín Ascúa',
  'Ricardo Colombi',
  'Lisandro Almirón',
  // Cabinet Ministers
  'López Desimoni',
  'Juan José López Desimoni',
  'Fabián Ríos',
  'Eduardo Vischi',
  'Jorge Vara',
  'Mercedes Sánchez',
  'Horacio Ortega',
  // National figures with local relevance
  'Milei',
  'Francos',
  'Petri',
  'Bullrich',
  'Caputo',
];

export const PARTY_COALITION_NAMES = [
  'UCR',
  'Unión Cívica Radical',
  'PJ',
  'Partido Justicialista',
  'Vamos Corrientes',
  'La Libertad Avanza',
  'Encuentro por Corrientes',
  'PRO',
  'peronismo',
  'radicalismo',
  'libertarios',
];

export const INSTITUTIONAL_TERMS = [
  'gobernador',
  'vicegobernador',
  'legislatura',
  'ministerio',
  'ministro',
  'ministra',
  'secretaría',
  'secretario',
  'secretaria',
  'municipio',
  'municipalidad',
  'intendente',
  'concejo deliberante',
  'decreto',
  'resolución',
  'licitación',
  'presupuesto',
  'audiencia pública',
  'poder judicial',
  'tribunal',
  'fiscalía',
  'defensoría',
  'gabinete',
  'diputado',
  'diputada',
  'senador',
  'senadora',
  'cámara de diputados',
  'cámara de senadores',
  'gobierno provincial',
  'gobierno de corrientes',
  'casa de gobierno',
];

export const POLICY_DOMAIN_TERMS = [
  'seguridad',
  'educación',
  'salud pública',
  'obra pública',
  'infraestructura',
  'producción',
  'justicia',
  'derechos humanos',
  'política pública',
  'gestión provincial',
  'presupuesto provincial',
  'coparticipación',
  'plan social',
  'vivienda social',
  'emergencia',
];

// All keywords combined — used for matching
export const ALL_KEYWORDS = [
  ...POLITICAL_ACTORS,
  ...PARTY_COALITION_NAMES,
  ...INSTITUTIONAL_TERMS,
  ...POLICY_DOMAIN_TERMS,
];
