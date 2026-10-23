import { ReaderFontSize, ReaderThemeMode } from '../types/wikidot';

export const THEME = {
  colors: {
    background: '#090c10',
    backgroundSecondary: '#0f141d',
    surface: '#151b26',
    surfaceHighlight: '#1e2638',
    surfaceBorder: '#273248',
    surfaceBorderActive: '#f59e0b',
    
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    
    // M.E.G. Terminal accents
    accentAmber: '#f59e0b',
    accentGreen: '#10b981',
    accentCyan: '#06b6d4',
    accentRed: '#ef4444',
    
    // Classified stamps
    classifiedRed: '#dc2626',
    stampBorder: '#ef444466',
  },
  
  fonts: {
    mono: 'monospace',
    sans: 'System',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    full: 9999,
  }
};

export const READER_THEMES: Record<ReaderThemeMode, {
  name: string;
  background: string;
  surface: string;
  surfaceHighlight: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}> = {
  meg: {
    name: 'M.E.G. OLED',
    background: '#090c10',
    surface: '#151b26',
    surfaceHighlight: '#1e2638',
    surfaceBorder: '#273248',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    accent: '#f59e0b',
  },
  sepia: {
    name: 'Archivo Sepia',
    background: '#181410',
    surface: '#241e18',
    surfaceHighlight: '#2f2720',
    surfaceBorder: '#3d332a',
    textPrimary: '#e6ded4',
    textSecondary: '#b8a999',
    accent: '#d97706',
  },
  midnight: {
    name: 'Midnight Blue',
    background: '#0b1120',
    surface: '#131d35',
    surfaceHighlight: '#1a2747',
    surfaceBorder: '#23355d',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    accent: '#38bdf8',
  },
};

export const READER_FONT_SIZES: Record<ReaderFontSize, {
  body: number;
  lineHeight: number;
  title: number;
  subtitle: number;
  section: number;
  label: string;
}> = {
  compact: {
    body: 13.5,
    lineHeight: 21,
    title: 22,
    subtitle: 15,
    section: 13,
    label: 'Compacto',
  },
  normal: {
    body: 15,
    lineHeight: 24,
    title: 25,
    subtitle: 17,
    section: 14,
    label: 'Normal',
  },
  large: {
    body: 17.5,
    lineHeight: 28,
    title: 28,
    subtitle: 19,
    section: 16,
    label: 'Grande',
  },
  huge: {
    body: 20.5,
    lineHeight: 33,
    title: 32,
    subtitle: 22,
    section: 18,
    label: 'Muy Grande',
  },
};

export const SURVIVAL_CLASSES_META: Record<string, {
  color: string;
  badgeBg: string;
  badgeBorder: string;
  label: string;
  defaultSafety: string;
  defaultSecurity: string;
  defaultEntities: string;
}> = {
  '0': {
    color: '#22c55e',
    badgeBg: '#14532d33',
    badgeBorder: '#22c55e',
    label: 'CLASS 0',
    defaultSafety: 'Safe',
    defaultSecurity: 'Secure',
    defaultEntities: 'Devoid of Entities',
  },
  '1': {
    color: '#84cc16',
    badgeBg: '#36531433',
    badgeBorder: '#84cc16',
    label: 'CLASS 1',
    defaultSafety: 'Safe',
    defaultSecurity: 'Secure',
    defaultEntities: 'Minimal Entity Count',
  },
  '2': {
    color: '#eab308',
    badgeBg: '#713f1233',
    badgeBorder: '#eab308',
    label: 'CLASS 2',
    defaultSafety: 'Unsafe',
    defaultSecurity: 'Secure',
    defaultEntities: 'Low Entity Count',
  },
  '3': {
    color: '#f97316',
    badgeBg: '#7c2d1233',
    badgeBorder: '#f97316',
    label: 'CLASS 3',
    defaultSafety: 'Unsafe',
    defaultSecurity: 'Unsecure',
    defaultEntities: 'Low to Medium Entity Count',
  },
  '4': {
    color: '#ef4444',
    badgeBg: '#7f1d1d33',
    badgeBorder: '#ef4444',
    label: 'CLASS 4',
    defaultSafety: 'Unsafe',
    defaultSecurity: 'Unsecure',
    defaultEntities: 'Medium Entity Count',
  },
  '5': {
    color: '#c084fc',
    badgeBg: '#581c8744',
    badgeBorder: '#c084fc',
    label: 'CLASS 5',
    defaultSafety: 'Extremely Unsafe',
    defaultSecurity: 'Unsecure',
    defaultEntities: 'Entity Infestation',
  },
  'deadzone': {
    color: '#f43f5e',
    badgeBg: '#4c051944',
    badgeBorder: '#f43f5e',
    label: 'DEADZONE',
    defaultSafety: 'Environmental Hazard',
    defaultSecurity: 'Uninhabitable',
    defaultEntities: 'Devoid of Life',
  },
  'habitable': {
    color: '#06b6d4',
    badgeBg: '#164e6344',
    badgeBorder: '#06b6d4',
    label: 'HABITABLE',
    defaultSafety: 'Safe',
    defaultSecurity: 'Sustained Community',
    defaultEntities: 'Devoid of Hostile Entities',
  },
  'variable': {
    color: '#a855f7',
    badgeBg: '#3b076444',
    badgeBorder: '#a855f7',
    label: 'VARIABLE',
    defaultSafety: 'Variable',
    defaultSecurity: 'Variable',
    defaultEntities: 'Variable Entities',
  },
  'unknown': {
    color: '#94a3b8',
    badgeBg: '#1e293b44',
    badgeBorder: '#94a3b8',
    label: 'UNDETERMINED',
    defaultSafety: 'Unconfirmed',
    defaultSecurity: 'Unconfirmed',
    defaultEntities: 'Unconfirmed Entities',
  },
};
