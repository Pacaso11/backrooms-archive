export type ItemCategory =
  | 'level'
  | 'entity'
  | 'object'
  | 'phenomenon'
  | 'tale'
  | 'group'
  | 'poi'
  | 'canon'
  | 'subcluster'
  | 'joke'
  | 'enigmatic'
  | 'art'
  | 'tech'
  | 'archive';

export interface LibraryCategoryDef {
  key: string;
  title: string;
  titleEs: string;
  icon: string;
  color: string;
  badge: string;
  pathEn: string;
  pathEs: string;
  description: string;
  descriptionEs: string;
}

export interface SurvivalClassification {
  classLevel: string; // '0', '1', '2', '3', '4', '5', 'Deadzone', 'Habitable', 'Pending', 'Variable', 'Unknown'
  safety: string; // 'Safe', 'Unsafe', 'Unknown'
  security: string; // 'Secure', 'Unsecure', 'Unknown'
  entityCount: string; // 'Devoid of Entities', 'Low Entity Count', 'Entity Infestation', etc.
  color: string;
  badgeText: string;
}

export interface WikiImage {
  url: string;
  caption?: string;
}

export interface DossierSection {
  title: string;
  content: string;
}

export interface DossierTab {
  id: string;
  title: string;
  content: string;
}

export interface BackroomsItem {
  id: string; // e.g. 'level-0', 'entity-3'
  path: string; // e.g. '/level-0'
  category: ItemCategory;
  numberStr: string; // '0', '0.1', '1', 'Fun'
  title: string; // 'Level 0'
  subTitle?: string; // '"Threshold"' or '"The Yellow Hell"'
  classification?: SurvivalClassification;
  images: WikiImage[];
  prologue?: string;
  description: string;
  sections: DossierSection[];
  tabs?: DossierTab[];
  epilogue?: string;
  entrances: string[];
  exits: string[];
  url: string;
  lang?: 'es' | 'en';
  isFallback?: boolean;
  isAutoTranslated?: boolean;
  isFavorite?: boolean;
  cachedAt?: number;
}

export interface WikiListItem {
  id: string;
  path: string;
  title: string;
  subTitle?: string;
  displayName: string;
  category: ItemCategory;
  numberStr: string;
  lang?: 'es' | 'en';
  previewClass?: string;
  snippet?: string;
  tags?: string[];
}

export interface LastReadSession {
  id: string;
  path: string;
  title: string;
  subTitle?: string;
  displayName: string;
  category: ItemCategory;
  scrollY: number;
  scrollPercent: number; // 0 to 100
  lang: 'es' | 'en';
  timestamp: number;
}

export type ReaderThemeMode = 'meg' | 'sepia' | 'midnight';
export type ReaderFontSize = 'compact' | 'normal' | 'large' | 'huge';

export interface ReaderSettings {
  theme: ReaderThemeMode;
  fontSize: ReaderFontSize;
}
