import type { BackroomsItem, DossierSection, DossierTab, ItemCategory, LibraryCategoryDef, SurvivalClassification, WikiImage, WikiListItem } from '../types/wikidot';
import { SURVIVAL_CLASSES_META } from '../constants/theme';

const BASE_EN = 'https://backrooms-wiki.wikidot.com';
const BASE_ES = 'https://es-backrooms-wiki.wikidot.com';

export const LIBRARY_CATEGORIES: LibraryCategoryDef[] = [
  {
    key: 'objects',
    title: 'Objects',
    titleEs: 'Objetos',
    icon: 'cube-outline',
    color: '#00E5FF',
    badge: 'OBJ',
    pathEn: '/objects',
    pathEs: '/objects',
    description: 'Anomalous tools, supplies, and relics found across the levels.',
    descriptionEs: 'Herramientas anómalas, suministros y reliquias halladas en los niveles.',
  },
  {
    key: 'phenomena',
    title: 'Phenomena',
    titleEs: 'Fenómenos',
    icon: 'planet-outline',
    color: '#A855F7',
    badge: 'FEN',
    pathEn: '/phenomena',
    pathEs: '/phenomena',
    description: 'Bizarre reality distortions, spatial anomalies, and recurring events.',
    descriptionEs: 'Distorsiones de la realidad, anomalías espaciales y sucesos recurrentes.',
  },
  {
    key: 'groups',
    title: 'Groups',
    titleEs: 'Grupos',
    icon: 'people-outline',
    color: '#3B82F6',
    badge: 'GRP',
    pathEn: '/groups-list',
    pathEs: '/groups-list',
    description: 'Factions, research syndicates, colonies, and hostile organizations.',
    descriptionEs: 'Facciones, sindicatos de investigación, colonias y organizaciones.',
  },
  {
    key: 'tales',
    title: 'Tales',
    titleEs: 'Relatos',
    icon: 'document-text-outline',
    color: '#10B981',
    badge: 'RELATO',
    pathEn: '/tales',
    pathEs: '/tales',
    description: 'Logs, diaries, and stories from wanderers and field operatives.',
    descriptionEs: 'Bitácoras, diarios e historias de errantes y operativos de campo.',
  },
  {
    key: 'poi',
    title: 'Persons of Interest',
    titleEs: 'Personas de Interés',
    icon: 'person-outline',
    color: '#EF4444',
    badge: 'PDI',
    pathEn: '/poi-s',
    pathEs: '/poi-s',
    description: 'Notable survivors, legendary wanderers, renegades, and researchers.',
    descriptionEs: 'Supervivientes notables, errantes legendarios, desertores e investigadores.',
  },
  {
    key: 'canons',
    title: 'Canons',
    titleEs: 'Cánones',
    icon: 'git-branch-outline',
    color: '#F59E0B',
    badge: 'CANON',
    pathEn: '/canons',
    pathEs: '/canons',
    description: 'Alternative storylines, timelines, and connected universe arcs.',
    descriptionEs: 'Líneas temporales alternativas y arcos conectados del universo.',
  },
  {
    key: 'subclusters',
    title: 'Series & Subclusters',
    titleEs: 'Series y Subclústeres',
    icon: 'grid-outline',
    color: '#EC4899',
    badge: 'SERIE',
    pathEn: '/series-and-subclusters-hub',
    pathEs: '/series-and-subclusters-hub',
    description: 'Thematic clusters of interconnected levels and exploration hubs.',
    descriptionEs: 'Clústeres temáticos de niveles interconectados y centros de exploración.',
  },
  {
    key: 'jokes',
    title: 'Joke Entries',
    titleEs: 'Entradas de Broma',
    icon: 'happy-outline',
    color: '#F97316',
    badge: 'BROMA',
    pathEn: '/joke-entries',
    pathEs: '/joke-entries',
    description: 'Parodies, satirical dossiers, and humorous classified files.',
    descriptionEs: 'Parodias, expedientes satíricos y archivos clasificados humorísticos.',
  },
  {
    key: 'enigmatic_levels',
    title: 'Enigmatic Levels',
    titleEs: 'Niveles Enigmáticos',
    icon: 'help-circle-outline',
    color: '#8B5CF6',
    badge: 'ENIG-LVL',
    pathEn: '/unnumbered-levels',
    pathEs: '/niveles-enigmaticos',
    description: 'Unnumbered levels defying standard dimensional indexing.',
    descriptionEs: 'Niveles no numerados que desafían la indexación dimensional estándar.',
  },
  {
    key: 'enigmatic_entities',
    title: 'Enigmatic Entities',
    titleEs: 'Entidades Enigmáticas',
    icon: 'eye-outline',
    color: '#D946EF',
    badge: 'ENIG-ENT',
    pathEn: '/unnumbered-entities',
    pathEs: '/enigmatic-entities',
    description: 'Unique, unclassified, and legendary entities of the threshold.',
    descriptionEs: 'Entidades únicas, inclasificables y legendarias del umbral.',
  },
  {
    key: 'art_gallery',
    title: 'Art Gallery',
    titleEs: 'Galería de Arte',
    icon: 'image-outline',
    color: '#06B6D4',
    badge: 'ARTE',
    pathEn: '/art-gallery',
    pathEs: '/art-gallery',
    description: 'Visual representations, blueprints, and survivor sketches.',
    descriptionEs: 'Representaciones visuales, esquemas y bocetos de supervivientes.',
  },
];

/**
 * Centralized Category Inference Engine
 * Deterministically infers the ItemCategory for a Backrooms dossier.
 * Maps: 'level' | 'entity' | 'object' | 'phenomenon' | 'tale' | 'group' | 'poi' | 'joke' | 'subcluster' | 'canon' | 'archive'
 * Under no circumstances does this function default to 'canon'.
 */
export function inferItemCategory(id: string, path?: string, explicitCat?: string): ItemCategory {
  const rawTarget = (path || id || '').toLowerCase().trim();
  const cleanTarget = rawTarget.replace(/^\/+/, '');

  // 1. If explicit category is provided, validate it.
  // CRITICAL: Reject accidental 'canon' or 'level' defaults if the target is clearly a different category!
  if (explicitCat) {
    const normExplicit = explicitCat.toLowerCase().trim() as ItemCategory;

    const isObviousOther =
      cleanTarget.startsWith('entity-') ||
      cleanTarget.startsWith('entity_') ||
      cleanTarget.startsWith('entidad-') ||
      cleanTarget.startsWith('entidad_') ||
      cleanTarget.startsWith('object-') ||
      cleanTarget.startsWith('object_') ||
      cleanTarget.startsWith('objeto-') ||
      cleanTarget.startsWith('objeto_') ||
      cleanTarget.startsWith('phenomenon-') ||
      cleanTarget.startsWith('phenomenon_') ||
      cleanTarget.startsWith('fenomeno-') ||
      cleanTarget.startsWith('fenomeno_') ||
      cleanTarget.startsWith('tale-') ||
      cleanTarget.startsWith('relato-') ||
      cleanTarget.startsWith('group-') ||
      cleanTarget.startsWith('grupo-') ||
      cleanTarget.startsWith('poi-') ||
      cleanTarget.startsWith('pdi-') ||
      cleanTarget.startsWith('joke-') ||
      cleanTarget.startsWith('broma-') ||
      cleanTarget.startsWith('series-') ||
      cleanTarget.startsWith('subcluster-');

    if (normExplicit === 'canon') {
      const isActualCanon =
        cleanTarget.endsWith('-canon') ||
        cleanTarget.endsWith('-canon-hub') ||
        cleanTarget.includes('canon-hub') ||
        cleanTarget === 'canons' ||
        cleanTarget === 'black-knights' ||
        cleanTarget === 'decay-canon-hub' ||
        cleanTarget === 'desolation-canon-hub' ||
        cleanTarget === 'industrialization-canon-hub' ||
        cleanTarget === 'broken-city' ||
        cleanTarget === 'the-council' ||
        cleanTarget === 'pantheon-hub' ||
        cleanTarget === 'terror-hotel' ||
        cleanTarget === 'canonicon2024' ||
        cleanTarget === 'dianic-saga' ||
        cleanTarget === 'hub-de-los-caballeros-negros';
      if (isActualCanon) {
        return 'canon';
      }
      // Otherwise ignore the bogus 'canon' explicitCat and infer from target
    } else if (normExplicit === 'level') {
      if (!isObviousOther) {
        return 'level';
      }
      // Otherwise ignore accidental 'level' default and infer from target
    } else {
      const validCategories: ItemCategory[] = [
        'entity', 'object', 'phenomenon', 'tale', 'group',
        'poi', 'joke', 'subcluster', 'enigmatic', 'art', 'tech', 'archive'
      ];
      if (validCategories.includes(normExplicit)) {
        return normExplicit;
      }
    }
  }

  // 2. Pattern Matching by Category

  // Entities
  if (
    cleanTarget.startsWith('entity-') ||
    cleanTarget.startsWith('entity_') ||
    cleanTarget.startsWith('entidad-') ||
    cleanTarget.startsWith('entidad_') ||
    cleanTarget.startsWith('entities') ||
    cleanTarget.startsWith('entidades') ||
    cleanTarget.includes('unnumbered-entities') ||
    cleanTarget.includes('enigmatic-entities')
  ) {
    return 'entity';
  }

  // Objects
  if (
    cleanTarget.startsWith('object-') ||
    cleanTarget.startsWith('object_') ||
    cleanTarget.startsWith('objeto-') ||
    cleanTarget.startsWith('objeto_') ||
    cleanTarget.startsWith('objects') ||
    cleanTarget.startsWith('objetos')
  ) {
    return 'object';
  }

  // Phenomena
  if (
    cleanTarget.startsWith('phenomenon-') ||
    cleanTarget.startsWith('phenomenon_') ||
    cleanTarget.startsWith('fenomeno-') ||
    cleanTarget.startsWith('fenomeno_') ||
    cleanTarget.startsWith('phenomena') ||
    cleanTarget.startsWith('fenomenos')
  ) {
    return 'phenomenon';
  }

  // Tales
  if (
    cleanTarget.startsWith('tale-') ||
    cleanTarget.startsWith('tale_') ||
    cleanTarget.startsWith('relato-') ||
    cleanTarget.startsWith('relato_') ||
    cleanTarget.includes('tales') ||
    cleanTarget.includes('relatos')
  ) {
    return 'tale';
  }

  // Groups
  if (
    cleanTarget.startsWith('group-') ||
    cleanTarget.startsWith('group_') ||
    cleanTarget.startsWith('grupo-') ||
    cleanTarget.startsWith('grupo_') ||
    cleanTarget.startsWith('groups-list') ||
    cleanTarget.startsWith('lista-de-grupos') ||
    cleanTarget.includes('groups') ||
    cleanTarget.includes('grupos')
  ) {
    return 'group';
  }

  // Persons of Interest (POI)
  if (
    cleanTarget.startsWith('poi-') ||
    cleanTarget.startsWith('poi_') ||
    cleanTarget.startsWith('pdi-') ||
    cleanTarget.startsWith('pdi_') ||
    cleanTarget.startsWith('poi-s') ||
    cleanTarget.includes('person-of-interest') ||
    cleanTarget.includes('persona-de-interes')
  ) {
    return 'poi';
  }

  // Joke entries
  if (
    cleanTarget.startsWith('joke-') ||
    cleanTarget.startsWith('joke_') ||
    cleanTarget.startsWith('broma-') ||
    cleanTarget.startsWith('broma_') ||
    cleanTarget.includes('joke-entries') ||
    cleanTarget.includes('entradas-de-broma')
  ) {
    return 'joke';
  }

  // Series and Subclusters
  if (
    cleanTarget.startsWith('series-') ||
    cleanTarget.startsWith('series/') ||
    cleanTarget.startsWith('subcluster-') ||
    cleanTarget.startsWith('subcluster/') ||
    cleanTarget.startsWith('subclúster-') ||
    cleanTarget.startsWith('subclúster/') ||
    cleanTarget.includes('subcluster') ||
    cleanTarget.includes('subclúster') ||
    cleanTarget.includes('series-and-subclusters')
  ) {
    return 'subcluster';
  }

  // Canons (genuine canons only)
  if (
    cleanTarget.endsWith('-canon') ||
    cleanTarget.endsWith('-canon-hub') ||
    cleanTarget.includes('canon-hub') ||
    cleanTarget === 'canons' ||
    cleanTarget === 'black-knights' ||
    cleanTarget === 'decay-canon-hub' ||
    cleanTarget === 'desolation-canon-hub' ||
    cleanTarget === 'industrialization-canon-hub' ||
    cleanTarget === 'broken-city' ||
    cleanTarget === 'the-council' ||
    cleanTarget === 'pantheon-hub' ||
    cleanTarget === 'terror-hotel' ||
    cleanTarget === 'canonicon2024' ||
    cleanTarget === 'dianic-saga' ||
    cleanTarget === 'hub-de-los-caballeros-negros'
  ) {
    return 'canon';
  }

  // Levels (Numbered and Unnumbered/Enigmatic)
  const isNumberedLevel =
    cleanTarget.startsWith('level-') ||
    cleanTarget.startsWith('level_') ||
    cleanTarget.startsWith('nivel-') ||
    cleanTarget.startsWith('nivel_') ||
    cleanTarget.startsWith('normal-levels') ||
    cleanTarget === 'levels' ||
    cleanTarget === 'niveles' ||
    /^(?:level|nivel)?\d+/i.test(cleanTarget);

  const isKnownUnnumberedLevel =
    cleanTarget.includes('unnumbered-levels') ||
    cleanTarget.includes('niveles-enigmaticos') ||
    cleanTarget === 'the-hub' ||
    cleanTarget === 'the-end' ||
    cleanTarget === 'snackrooms' ||
    cleanTarget === 'run-for-your-life' ||
    cleanTarget === 'level-fun' ||
    cleanTarget === 'blue-channel' ||
    cleanTarget === 'the-whiteout' ||
    cleanTarget === 'the-blackout' ||
    cleanTarget === 'the-hive' ||
    cleanTarget === 'the-metro' ||
    cleanTarget === 'the-frontrooms' ||
    cleanTarget === 'the-grave' ||
    cleanTarget === 'the-infinite-subway' ||
    cleanTarget === 'the-void' ||
    cleanTarget === 'empty-rooms' ||
    cleanTarget === 'isometric-rooms' ||
    cleanTarget === 'radiance' ||
    cleanTarget === 'infrared';

  if (isNumberedLevel || isKnownUnnumberedLevel) {
    return 'level';
  }

  // 3. Fallback: Default to 'archive' (or 'level' if numeric), NEVER 'canon'
  if (/^\d+/.test(cleanTarget)) {
    return 'level';
  }

  return 'archive';
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8212;/g, '—')
    .replace(/&#8211;/g, '–')
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&#171;/g, '«')
    .replace(/&#187;/g, '»')
    .replace(/&#160;/g, ' ')
    .replace(/&#32;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    // Decode any numeric unicode entities with fromCodePoint to support emojis and supplementary planes
    .replace(/&#([0-9]+);/g, (_, code) => {
      try {
        return String.fromCodePoint(parseInt(code, 10));
      } catch {
        return '';
      }
    })
    // Decode any hex unicode entities like &#x2014;
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
      try {
        return String.fromCodePoint(parseInt(code, 16));
      } catch {
        return '';
      }
    })
    .trim();
}

/**
 * Pre-processes text before neural translation to preserve Backrooms-specific terminology
 * and avoid machine translation pitfalls.
 */
function preprocessForTranslation(text: string): string {
  return text
    .replace(/\bto canon cross\b/gi, 'to create canon crossovers with')
    .replace(/\bcanon cross\b/gi, 'canon crossover with')
    .replace(/\bcanon-cross\b/gi, 'canon crossover with')
    .replace(/\bcanon crossing\b/gi, 'crossover stories')
    .replace(/\bheadspace\b/gi, 'mental space')
    .replace(/\bthinktank\b/gi, 'research center')
    .replace(/\bthink tank\b/gi, 'research center');
}

/**
 * Post-processes Spanish translations and Wikidot content to ensure natural phrasing,
 * correct grammatical agreement, and official community Backrooms lore glossary.
 */
export function polishSpanishTranslation(text: string): string {
  if (!text) return text;
  return text
    // 1. Core Backrooms & Frontrooms nomenclature
    .replace(/\b(?:las|la)\s+trastiendas?\b/gi, 'los Backrooms')
    .replace(/\ben\s+la\s+trastienda\b/gi, 'en los Backrooms')
    .replace(/\ba\s+la\s+trastienda\b/gi, 'a los Backrooms')
    .replace(/\bde\s+la\s+trastienda\b/gi, 'de los Backrooms')
    .replace(/\btrastiendas?\b/gi, 'Backrooms')
    .replace(/\b(?:las\s+)?salas?\s+delanteras?\b/gi, 'los Frontrooms')
    .replace(/\bcuartos?\s+delanteros?\b/gi, 'los Frontrooms')
    .replace(/\bhabitaciones?\s+delanteras?\b/gi, 'los Frontrooms')

    // 2. Noclip mechanics
    .replace(/\b(?:sin\s+clip|no\s+clip|no\s+hacer\s+clip)\b/gi, 'noclip')
    .replace(/\bno\s+haces\s+clip\b/gi, 'haces noclip')
    .replace(/\bhaces\s+no\s+clip\b/gi, 'haces noclip')
    .replace(/\b(haces|hacer|haciendo|hizo)\s+clip\b/gi, '$1 noclip')
    .replace(/\bnoclips\b/gi, 'haces noclip')

    // 3. Canon & Collaborative writing idioms
    .replace(/\bcañ[oó]n\b/gi, 'canon')
    .replace(/\bcánones\b/gi, 'cánones')
    .replace(/\b(?:historias\s+cruzadas|cruce)\s+y\s+decadencia(?:\s+del\s+canon)?\b/gi, 'Cruce de Cánones y Decadencia')
    .replace(/\bcruce\s+del\s+canon\b/gi, 'Cruce de Cánones')
    .replace(/\bcruce\s+de\s+canon\b/gi, 'Cruce de Cánones')
    .replace(/\bcruce\s+y\s+decadencia\s+del\s+canon\b/gi, 'Cruce de Cánones y Decadencia')
    .replace(
      /está totalmente bien (?:canon cruzar|hacer un cruce de canon con|crear cruces de canon con|hacer un cruce canónico|cruzar canónicamente|crear cruces entre)\s+otros cánones\s+y\s+(?:Decay|DK|decadencia|el canon decay)/gi,
      'está totalmente permitido realizar cruces narrativos entre otros cánones y el Canon de Decadencia'
    )
    .replace(/\bestá\s+totalmente\s+bien\s+(?:canon\s+cruzar|crear\s+cruces\s+de\s+canon\s+con)\b/gi, 'está totalmente permitido realizar cruces narrativos con')
    .replace(/\botros\s+cánones\s+y\s+(?:DK|Decay)\b/gi, 'otros cánones y el Canon de Decadencia')
    .replace(/\bcanon\s+cruzar\b/gi, 'realizar cruces narrativos con')
    .replace(/\bel\s+canon\s+Decay\b/gi, 'el Canon de Decadencia')
    .replace(/\bDecay\s+Canon\b/gi, 'Canon de Decadencia')
    .replace(/\bThe\s+Decay\b/gi, 'la Decadencia')
    .replace(/\bescritura\s+de\s+Decay\b/gi, 'narrativa de Decadencia')
    .replace(/\ben\s+el\s+contexto\s+de\s+Decay\b/gi, 'en el contexto de Decadencia')
    .replace(/\bes\s+Decay\s+en\s+s[ií]\b/gi, 'es la propia Decadencia')
    .replace(/\bDK\b(?=.*(?:canon|decadencia|backrooms))/gi, 'Decadencia')

    // 4. Backrooms Lore Entities, Items, and Groups
    .replace(/\bvagabundo\b/gi, 'explorador')
    .replace(/\bvagabundos\b/gi, 'exploradores')
    .replace(/\bladr[oó]n\s+de\s+pieles?\b/gi, 'Ladrón de Piel')
    .replace(/\bladrones\s+de\s+pieles?\b/gi, 'Ladrones de Piel')
    .replace(/\bpolillas?\s+de\s+la\s+muerte\b/gi, 'Polillas de la Muerte')
    .replace(/\bsabuesos?\b/gi, 'Sabuesos')
    .replace(/\bsonrientes?\b/gi, 'Sonrientes')
    .replace(/\bagua\s+de\s+almendra\b/gi, 'Agua de Almendras')
    .replace(/\bespacio\s+(?:de\s+cabeza|mental\s+\(headspace\))\b/gi, 'espacio mental (Headspace)')
    .replace(/\btanque\s+de\s+pensamiento\b/gi, 'centro de investigación')
    .replace(/\binstituto\s+de\s+investigaci[oó]n\b/gi, 'centro de investigación')
    .replace(/\bpuntaje\s+heimwehmut\b/gi, 'puntuación Heimwehmut')
    .replace(/\bestados?\s+post-?empleales?\b/gi, 'estados de finalización de servicio')
    .replace(/\bsujetos?\s+de\s+prueba\s+sueños?\b/gi, 'sujetos de prueba en fase de sueño')
    .replace(/\bse\s+ha\s+quedado\s+m[aá]s\b/gi, 'ha permanecido activo')

    // 5. Spanish grammatical contractions and typography cleanups
    .replace(/\bde\s+el\b/gi, 'del')
    .replace(/\ba\s+el\b/gi, 'al')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.:;?!])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/¿\s+/g, '¿')
    .replace(/¡\s+/g, '¡');
}

/**
 * Free Neural Translation service for articles missing Spanish Wikidot translation
 */
async function translateChunk(text: string, targetLang = 'es', sourceLang = 'en'): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    return data[0].map((item: any) => item[0]).join('');
  } catch {
    return text;
  }
}

export async function translateText(text: string, targetLang = 'es', sourceLang = 'en'): Promise<string> {
  if (!text || text.trim().length === 0) return text;

  // Pre-process text before translation if translating en -> es to guide grammar and preserve lore idioms
  const preparedText = (sourceLang === 'en' && targetLang === 'es')
    ? preprocessForTranslation(text)
    : text;

  // Mask markdown URLs so the translation engine does not translate URL slugs like (/the-black-knights) to Spanish
  const urlMap: string[] = [];
  const maskedText = preparedText.replace(/\]\(([^)]+)\)/g, (_, url) => {
    const idx = urlMap.length;
    urlMap.push(url);
    return `](__URL_${idx}__)`;
  });

  // Split into chunks under 1200 characters to stay well below URL limits
  const paragraphs = maskedText.split('\n\n');
  const batches: string[] = [];
  let currentBatch = '';

  for (const p of paragraphs) {
    if ((currentBatch + '\n\n' + p).length < 1100) {
      currentBatch = currentBatch ? `${currentBatch}\n\n${p}` : p;
    } else {
      if (currentBatch) batches.push(currentBatch);
      currentBatch = p;
    }
  }
  if (currentBatch) batches.push(currentBatch);

  const translatedBatches = await Promise.all(
    batches.map(b => translateChunk(b, targetLang, sourceLang))
  );

  let result = translatedBatches.join('\n\n');

  // Unmask URLs preserving original Wikidot paths
  result = result.replace(/\]\(\s*__URL_(\d+)__\s*\)/gi, (_, idxStr) => {
    const idx = parseInt(idxStr, 10);
    return `](${urlMap[idx] || ''})`;
  });

  // Post-process with polishSpanishTranslation if target is Spanish
  return targetLang === 'es' ? polishSpanishTranslation(result) : result;
}

/**
 * Converts internal Wikidot links to markdown links [Text](path) so navigation is preserved
 */
function convertHtmlLinksToMarkdown(html: string): string {
  // Normalize full Wikidot URLs to clean root-relative paths
  let processed = html.replace(/https?:\/\/(?:es-)?backrooms-wiki\.wikidot\.com(\/[a-zA-Z0-9_\-\.]+)/gi, '$1');

  // Convert valid internal links <a href="/slug">Text</a> to [Text](/slug)
  processed = processed.replace(/<a\s+[^>]*href="(\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, innerText) => {
    if (
      href.startsWith('/system:') ||
      href.startsWith('/search:') ||
      href.startsWith('/forum') ||
      href.startsWith('/user:') ||
      href.startsWith('/theme:') ||
      href.startsWith('/component:') ||
      href.startsWith('/local--files') ||
      href.startsWith('/how-to-write-') ||
      href.startsWith('/guide-hub') ||
      href.startsWith('/licensing-') ||
      href.includes('javascript:') ||
      href.startsWith('/#') ||
      href.startsWith('/tag:')
    ) {
      return innerText.replace(/<[^>]+>/g, '');
    }
    const cleanText = decodeHtmlEntities(innerText.replace(/<[^>]+>/g, '')).trim();
    if (!cleanText || cleanText.length < 1) return '';
    return ` [${cleanText}](${href}) `;
  });

  return processed;
}

function stripHtml(html: string): string {
  const withMarkdownLinks = convertHtmlLinksToMarkdown(html);
  return decodeHtmlEntities(
    withMarkdownLinks
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<td[^>]*>/gi, '  ')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<[^>]+>/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
  ).trim();
}

/**
 * Accurately finds the index right after the closing </div> matching an opening <div>, respecting nested tags
 */
function findClosingDiv(html: string, startIdx: number): number {
  let depth = 0;
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = startIdx;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    if (match[0].startsWith('</')) {
      depth--;
      if (depth === 0) {
        return match.index + match[0].length;
      }
    } else {
      depth++;
    }
  }
  return -1;
}

/**
 * Transforms featureboxes (Sagas and prominent hubs) into structured subsections using depth-aware div tracking
 */
function unwrapFeatureboxes(html: string): string {
  let result = '';
  let cursor = 0;
  const target = '<div class="featurebox">';

  while (true) {
    const startIdx = html.indexOf(target, cursor);
    if (startIdx === -1) {
      result += html.substring(cursor);
      break;
    }

    result += html.substring(cursor, startIdx);
    const endIdx = findClosingDiv(html, startIdx);
    if (endIdx === -1) {
      result += html.substring(startIdx);
      break;
    }

    const inner = html.substring(startIdx + target.length, endIdx - 6);
    const hMatch = inner.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const title = hMatch ? decodeHtmlEntities(hMatch[1].replace(/<[^>]+>/g, '')).trim() : 'SAGA';
    const bodyWithoutH = inner.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/i, '');

    result += `\n<h3>⚔ SAGA: ${title}</h3>\n${bodyWithoutH}\n`;
    cursor = endIdx;
  }

  return result;
}

/**
 * Unwraps lore collapsible blocks into readable subsections while discarding license/citation info
 */
function unwrapCollapsibles(html: string): string {
  return html.replace(/<div[^>]*class="[^"]*collapsible-block[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi, (_, inner) => {
    // Only strip if it's tiny pure metadata without substantive story content
    const isPureMetadata = inner.length < 1200 && /licencia|license|citation|créditos|creditos|código del tema|theme code/i.test(inner);
    if (isPureMetadata) {
      return '';
    }

    // Extract title if available
    const titleMatch = inner.match(/<a[^>]*class="[^"]*collapsible-block-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]) : 'Registro Desplegable';

    // Extract content
    const contentMatch = inner.match(/<div[^>]*class="[^"]*collapsible-block-content[^"]*"[^>]*>([\s\S]*)/i);
    const content = contentMatch ? contentMatch[1] : inner;

    return `\n\n### 📂 REGISTRO DESPLEGABLE: ${title}\n${content}\n\n`;
  });
}

/**
 * Extracts YUI Tabviews into structured first-class DossierTabs
 */
function extractYuiTabs(html: string): { tabs: DossierTab[]; remainingHtml: string } {
  const tabs: DossierTab[] = [];
  let currentHtml = html;
  let tabSetIndex = 0;

  while (true) {
    const navsetStart = currentHtml.indexOf('class="yui-navset');
    if (navsetStart === -1) break;

    const navStart = currentHtml.indexOf('<ul class="yui-nav">', navsetStart);
    if (navStart === -1) break;
    const navEnd = currentHtml.indexOf('</ul>', navStart);
    if (navEnd === -1) break;
    const navHtml = currentHtml.substring(navStart, navEnd);
    const titles = [...navHtml.matchAll(/<li[^>]*>[\s\S]*?<a[^>]*><em>([\s\S]*?)<\/em><\/a>[\s\S]*?<\/li>/gi)].map(m =>
      decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '')).trim()
    );

    const contentStart = currentHtml.indexOf('<div class="yui-content">', navEnd);
    if (contentStart === -1) break;

    const wholeNavsetDivStart = currentHtml.lastIndexOf('<div', navsetStart);
    const navsetEnd = findClosingDiv(currentHtml, wholeNavsetDivStart !== -1 ? wholeNavsetDivStart : navsetStart);
    if (navsetEnd === -1 || navsetEnd <= (wholeNavsetDivStart !== -1 ? wholeNavsetDivStart : navsetStart)) break;

    const contentEnd = findClosingDiv(currentHtml, contentStart);
    const contentHtml = contentEnd !== -1 ? currentHtml.substring(contentStart + 25, contentEnd - 6) : currentHtml.substring(contentStart + 25);

    const tabBlocks = contentHtml.split(/<div id="wiki-tab-\d+-\d+"[^>]*>/i).slice(1);
    for (let i = 0; i < tabBlocks.length && i < titles.length; i++) {
      tabs.push({
        id: `tab-${tabSetIndex}-${i}`,
        title: titles[i] || `Pestaña ${tabs.length + 1}`,
        content: stripHtml(tabBlocks[i]),
      });
    }

    // Preserve all content prior to and after the tabs
    const before = wholeNavsetDivStart !== -1 ? currentHtml.substring(0, wholeNavsetDivStart) : '';
    const after = currentHtml.substring(navsetEnd);
    currentHtml = `${before}\n${after}`;
    tabSetIndex++;
  }

  return { tabs, remainingHtml: currentHtml };
}

function cleanDisclaimersAndJunk(html: string): string {
  // 1. Transform featureboxes (Sagas and prominent hubs) into structured subsections
  let cleaned = unwrapFeatureboxes(html);

  // 2. Unwrap lore collapsibles
  cleaned = unwrapCollapsibles(cleaned);

  // 3. Strip widget boxes cleanly using depth-aware findClosingDiv
  const boxClasses = ['translations', 'list-pages-box', 'creditRate', 'infobox'];
  for (const cls of boxClasses) {
    const reg = new RegExp(`<div[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'gi');
    let m;
    while ((m = reg.exec(cleaned)) !== null) {
      const start = m.index;
      const end = findClosingDiv(cleaned, start);
      if (end !== -1 && end > start) {
        cleaned = cleaned.substring(0, start) + cleaned.substring(end);
        reg.lastIndex = start;
      } else {
        break;
      }
    }
  }

  return cleaned
    // Remove scripts and styles
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Remove u-infobox
    .replace(/<div[^>]*id="u-infobox"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi, '')
    // Remove rating and credits widgets
    .replace(/<div[^>]*class="[^"]*rateBox[^"]*"[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*page-rate-widget-box[^"]*"[\s\S]*?<\/div>/gi, '')
    // Remove wikiwalk nav and page tags
    .replace(/<div[^>]*class="[^"]*footer-wikiwalk-nav[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*page-tags[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi, '')
    // Remove CSS modules & raw CSS variables
    .replace(/\[\[module\s+CSS\]\][\s\S]*?\[\[\/module\]\]/gi, '')
    .replace(/\/\*\s*===.*?===\s*\*\/[\s\S]*?--theme-[^;]+;/gi, '')
    // Remove unrendered Wikidot template variables like {$white}, {$color}, {$one}, {$two}, {$three}, {$image}
    .replace(/\{\$[a-zA-Z0-9_\-]+\}/g, '')
    // Remove rating score text artifacts
    .replace(/Puntuaci[oó]n:\s*[\+\-]?[0-9]+/gi, '')
    // Remove ads containers if any
    .replace(/<div[^>]*id="wad-[^"]*"[\s\S]*?<\/div>/gi, '');
}

export function getLevelTags(numberStr: string, subTitle?: string, lang: 'es' | 'en' = 'es'): string[] {
  const tags: string[] = [];
  const isSub = numberStr.includes('.');
  if (isSub) {
    tags.push(lang === 'es' ? 'Subnivel' : 'Sublevel');
  } else {
    tags.push(lang === 'es' ? 'Nivel Principal' : 'Main Level');
  }

  const num = parseFloat(numberStr);
  if (isNaN(num)) {
    tags.push(lang === 'es' ? 'Enigmático' : 'Enigmatic');
  }

  tags.push('M.E.G.');
  return tags;
}

export function cleanQuotes(str?: string): string {
  if (!str) return '';
  return str.replace(/^["'«»“”„\s\-–—]+|["'«»“”„\s\-–—]+$/g, '').trim();
}

function getLevelSnippet(title: string, subTitle?: string, numberStr?: string, lang: 'es' | 'en' = 'es'): string {
  const cleanSub = cleanQuotes(subTitle);
  if (lang === 'es') {
    if (cleanSub) {
      return `Expediente clasificado del M.E.G. para ${title} ("${cleanSub}"). Evaluación de entorno, entidades hostiles y vías de escape.`;
    }
    return `Expediente clasificado del M.E.G. para ${title}. Guía de navegación, seguridad y supervivencia.`;
  } else {
    if (cleanSub) {
      return `M.E.G. classified dossier for ${title} ("${cleanSub}"). Environmental survey, entity hazards, and navigational routes.`;
    }
    return `M.E.G. classified dossier for ${title}. Survival index, safety parameters, and escape routes.`;
  }
}

export function getEntityTags(numberStr: string, subTitle?: string, lang: 'es' | 'en' = 'es'): string[] {
  const tags: string[] = [lang === 'es' ? 'Entidad' : 'Entity'];
  const num = parseInt(numberStr, 10);
  if (isNaN(num)) {
    tags.push(lang === 'es' ? 'Desconocido' : 'Unknown');
  }
  tags.push('M.E.G. Log');
  return tags;
}

function getEntitySnippet(title: string, subTitle?: string, lang: 'es' | 'en' = 'es'): string {
  const cleanSub = cleanQuotes(subTitle);
  if (lang === 'es') {
    if (cleanSub) {
      return `Registro de fauna anómala: ${title} conocido como "${cleanSub}". Pautas de comportamiento y medidas de contención.`;
    }
    return `Registro de fauna anómala del M.E.G. Descripción biológica, conductas observadas y protocolos de encuentro.`;
  } else {
    if (cleanSub) {
      return `Anomalous fauna record: ${title} designated as "${cleanSub}". Behavioral analysis and evasion directives.`;
    }
    return `M.E.G. entity log. Biological analysis, behavioral patterns, and survival protocol.`;
  }
}

const CANON_SPANISH_TITLES: Record<string, string> = {
  '/black-knights': 'Caballeros Negros',
  '/decay-canon-hub': 'Canon de Decadencia',
  '/desolation-canon-hub': 'Canon de la Desolación',
  '/industrialization-canon-hub': 'Canon de Industrialización',
  '/the-council': 'Canon del Consejo de Morgana',
  '/multiverse-canon': 'Canon del Multiverso',
  '/pantheon-hub': 'Canon del Panteón',
  '/simulation-canon': 'Canon de Simulación',
  '/terror-hotel': 'Hotel del Terror Canon',
  '/un-masked-canon-hub': 'Canon Desenmascarado',
  '/cov-canon-hub': 'Niños del Vacío',
  '/frontrooms-canon': 'Canon Frontrooms',
  '/origins': 'Orígenes',
  '/canonicon2024': 'Canonicon 2024',
};

const CANON_HEADING_TRANSLATIONS: Record<string, string> = {
  'main timeline': 'Cronología Principal',
  'dianic saga': 'Saga Diánica',
  'branches': 'Sucursales',
  'white knights': 'Caballeros Blancos',
  'miscellaneous': 'Varios',
  'related articles': 'Artículos Relacionados',
  'the broken city': 'La Ciudad Rota',
  'canon crossing': 'Cruce del Canon',
  'important assets': 'Recursos Importantes',
  'contributions': 'Contribuciones',
  'about': 'Acerca del Canon',
  'faq and rules of the canon': 'Preguntas Frecuentes y Reglas',
};

export class WikidotService {
  static inferItemCategory = inferItemCategory;

  /**
   * Fetches levels with full canonical titles and names in ES or EN
   */
  static async fetchLevels(lang: 'es' | 'en' = 'es'): Promise<WikiListItem[]> {
    try {
      // 1. Fetch main English list (+600 levels)
      const enRes = await fetch(`${BASE_EN}/normal-levels-i`);
      if (!enRes.ok) throw new Error(`HTTP error ${enRes.status}`);
      const enHtml = await enRes.text();

      const regex = /<a href="(\/level-[^"]+)">([^<]+)<\/a>\s*(?:-|–|—)?\s*([^\n\r<]*)/gi;
      const list: WikiListItem[] = [];
      const seen = new Set<string>();

      let match;
      while ((match = regex.exec(enHtml)) !== null) {
        const path = match[1];
        if (seen.has(path)) continue;
        seen.add(path);

        const code = decodeHtmlEntities(match[2].trim());
        const rawSub = match[3]
          ? cleanQuotes(decodeHtmlEntities(match[3].replace(/<[^>]+>/g, '')))
          : '';

        const numMatch = code.match(/Level\s+([^\s\-:]+)/i) || path.match(/\/level-([^\/]+)/);
        const numberStr = numMatch ? numMatch[1].replace(/-/g, '.') : '0';

        const displayName = rawSub ? `${code} - "${rawSub}"` : code;

        list.push({
          id: path.replace('/', ''),
          path,
          title: code,
          subTitle: rawSub || undefined,
          displayName,
          category: 'level',
          numberStr,
          lang: 'en',
        });
      }

      // 2. If Spanish is requested, fetch and overlay the official Spanish titles
      if (lang === 'es') {
        try {
          const esRes = await fetch(`${BASE_ES}/normal-levels-i`);
          if (esRes.ok) {
            const esHtml = await esRes.text();
            const esMatches = [...esHtml.matchAll(regex)];
            const esMap = new Map<string, { code: string; sub: string; displayName: string }>();

            for (const em of esMatches) {
              const p = em[1];
              const c = decodeHtmlEntities(em[2].trim());
              const rawS = em[3]
                ? cleanQuotes(decodeHtmlEntities(em[3].replace(/<[^>]+>/g, '')))
                : '';
              const s = rawS;
              const d = s ? `${c} - "${s}"` : c;
              esMap.set(p, { code: c, sub: s, displayName: d });
            }

            // Overlay onto the list
            for (const item of list) {
              const esData = esMap.get(item.path);
              if (esData) {
                item.title = esData.code;
                item.subTitle = esData.sub || undefined;
                item.displayName = esData.displayName;
                item.lang = 'es';
              }
            }
          }
        } catch (e) {
          console.warn('Could not fetch Spanish levels list overlay:', e);
        }
      }

      for (const item of list) {
        item.tags = getLevelTags(item.numberStr, item.subTitle, lang);
        item.snippet = getLevelSnippet(item.title, item.subTitle, item.numberStr, lang);
      }

      return list.sort((a, b) => {
        const nA = parseFloat(a.numberStr);
        const nB = parseFloat(b.numberStr);
        const numA = Number.isFinite(nA) ? nA : 999999;
        const numB = Number.isFinite(nB) ? nB : 999999;
        if (numA !== numB) return numA - numB;
        return a.title.localeCompare(b.title);
      });
    } catch (err) {
      console.error('Error in fetchLevels:', err);
      throw err;
    }
  }

  /**
   * Fetches entities with official names and nicknames in ES or EN
   */
  static async fetchEntities(lang: 'es' | 'en' = 'es'): Promise<WikiListItem[]> {
    try {
      const enRes = await fetch(`${BASE_EN}/entities`);
      if (!enRes.ok) throw new Error(`HTTP error ${enRes.status}`);
      const enHtml = await enRes.text();

      const regex = /<a href="(\/entity-[^"]+)">([^<]+)<\/a>\s*(?:-|–|—)?\s*([^\n\r<]*)/gi;
      const list: WikiListItem[] = [];
      const seen = new Set<string>();

      let match;
      while ((match = regex.exec(enHtml)) !== null) {
        const path = match[1];
        if (seen.has(path)) continue;
        seen.add(path);

        const code = decodeHtmlEntities(match[2].trim());
        const rawSub = match[3]
          ? cleanQuotes(decodeHtmlEntities(match[3].replace(/<[^>]+>/g, '')))
          : '';

        const numMatch = code.match(/Entity\s+([^\s\-:]+)/i) || path.match(/\/entity-([^\/]+)/);
        const numberStr = numMatch ? numMatch[1] : '?';

        const displayName = rawSub ? `${code} - "${rawSub}"` : code;

        list.push({
          id: path.replace('/', ''),
          path,
          title: code,
          subTitle: rawSub || undefined,
          displayName,
          category: 'entity',
          numberStr,
          lang: 'en',
        });
      }

      // If Spanish, overlay Spanish translations
      if (lang === 'es') {
        try {
          const esRes = await fetch(`${BASE_ES}/entities`);
          if (esRes.ok) {
            const esHtml = await esRes.text();
            const esMatches = [...esHtml.matchAll(regex)];
            const esMap = new Map<string, { code: string; sub: string; displayName: string }>();

            for (const em of esMatches) {
              const p = em[1];
              const c = decodeHtmlEntities(em[2].trim());
              const rawS = em[3]
                ? cleanQuotes(decodeHtmlEntities(em[3].replace(/<[^>]+>/g, '')))
                : '';
              const s = rawS;
              const d = s ? `${c} - "${s}"` : c;
              esMap.set(p, { code: c, sub: s, displayName: d });
            }

            for (const item of list) {
              const esData = esMap.get(item.path);
              if (esData) {
                item.title = esData.code;
                item.subTitle = esData.sub || undefined;
                item.displayName = esData.displayName;
                item.lang = 'es';
              }
            }
          }
        } catch (e) {
          console.warn('Could not fetch Spanish entities list overlay:', e);
        }
      }

      for (const item of list) {
        item.tags = getEntityTags(item.numberStr, item.subTitle, lang);
        item.snippet = getEntitySnippet(item.title, item.subTitle, lang);
      }

      return list.sort((a, b) => {
        const nA = parseFloat(a.numberStr);
        const nB = parseFloat(b.numberStr);
        const numA = Number.isFinite(nA) ? nA : 999999;
        const numB = Number.isFinite(nB) ? nB : 999999;
        if (numA !== numB) return numA - numB;
        return a.title.localeCompare(b.title);
      });
    } catch (err) {
      console.error('Error in fetchEntities:', err);
      throw err;
    }
  }

  /**
   * Fetches dossiers from any official Wikidot Library category
   */
  static async fetchLibraryCategory(categoryKey: string, lang: 'es' | 'en' = 'es'): Promise<WikiListItem[]> {
    const cat = LIBRARY_CATEGORIES.find(c => c.key === categoryKey) || LIBRARY_CATEGORIES[0];
    const enUrl = `${BASE_EN}${cat.pathEn}`;

    try {
      const enRes = await fetch(enUrl);
      if (!enRes.ok) throw new Error(`HTTP error ${enRes.status} for ${enUrl}`);
      const enHtml = await enRes.text();

      const start = enHtml.indexOf('id="page-content"');
      const end = enHtml.indexOf('id="page-info-break"');
      const content = enHtml.substring(start, end > 0 ? end : enHtml.length);

      // Match links inside page content
      const regex = /<a href="(\/[^"]+)">([^<]+)<\/a>(?:\s*(?:-|–|—|:)?\s*([^\n\r<]*))?/g;
      const list: WikiListItem[] = [];
      const seen = new Set<string>();

      // Specifically prioritize primary canons at top if in Canons category
      if (categoryKey === 'canons') {
        const PRIMARY_CANONS = [
          {
            id: 'black-knights',
            path: '/black-knights',
            titleEn: 'BLACK!KNIGHTS',
            titleEs: 'Caballeros Negros',
            subTitleEn: 'Dianic Saga & Heimwehmut Operations',
            subTitleEs: 'Saga Diánica y Operaciones Heimwehmut',
            tags: ['#CaballerosNegros', '#DianicSaga', '#Canon'],
          },
          {
            id: 'decay-canon-hub',
            path: '/decay-canon-hub',
            titleEn: 'Decay Canon',
            titleEs: 'Canon de Decadencia',
            subTitleEn: 'The Broken City and the wither of threshold realities',
            subTitleEs: 'La Ciudad Rota y el marchitamiento del umbral',
            tags: ['#Decadencia', '#BrokenCity', '#Canon'],
          },
          {
            id: 'desolation-canon-hub',
            path: '/desolation-canon-hub',
            titleEn: 'Desolation Canon',
            titleEs: 'Canon de la Desolación',
            subTitleEn: 'Homeward Bound and post-apocalyptic levels',
            subTitleEs: 'Regreso a Casa y niveles post-apocalípticos',
            tags: ['#Desolación', '#HomewardBound', '#Canon'],
          },
          {
            id: 'industrialization-canon-hub',
            path: '/industrialization-canon-hub',
            titleEn: 'Industrialization Canon',
            titleEs: 'Canon de Industrialización',
            subTitleEn: 'Machinery, Neith Division, and automated expanses',
            subTitleEs: 'Maquinaria pesada, División Neith y expansión técnica',
            tags: ['#Industrialización', '#Neith', '#Canon'],
          },
          {
            id: 'the-council',
            path: '/the-council',
            titleEn: 'Morgana Council Canon',
            titleEs: 'Canon del Consejo de Morgana',
            subTitleEn: 'The hidden council directing threshold factions',
            subTitleEs: 'El consejo encubierto que dirige las facciones',
            tags: ['#ConsejoMorgana', '#XavierCooper', '#Canon'],
          },
          {
            id: 'multiverse-canon',
            path: '/multiverse-canon',
            titleEn: 'Multiverse Canon',
            titleEs: 'Canon del Multiverso',
            subTitleEn: 'Fun War aftermath and parallel threshold realities',
            subTitleEs: 'Secuelas de la Guerra Divertida y realidades paralelas',
            tags: ['#Multiverso', '#FunWar', '#Canon'],
          },
          {
            id: 'pantheon-hub',
            path: '/pantheon-hub',
            titleEn: 'The Pantheon Canon',
            titleEs: 'Canon del Panteón',
            subTitleEn: 'Gods, divine entities, and mythic wanderers',
            subTitleEs: 'Dioses, entidades divinas y errantes míticos',
            tags: ['#Panteón', '#EntidadesDivinas', '#Canon'],
          },
          {
            id: 'simulation-canon',
            path: '/simulation-canon',
            titleEn: 'Simulation Canon',
            titleEs: 'Canon de Simulación',
            subTitleEn: 'Computational thresholds, Glitches, and Primary Source',
            subTitleEs: 'Umbrales computacionales, glitches y la Fuente Primaria',
            tags: ['#Simulación', '#FuentePrimaria', '#Canon'],
          },
          {
            id: 'terror-hotel',
            path: '/terror-hotel',
            titleEn: 'Terror Hotel Canon',
            titleEs: 'Hotel del Terror Canon',
            subTitleEn: 'The bizarre inhabitants of the eternal Grand Hotel',
            subTitleEs: 'Los extravagantes habitantes del Gran Hotel eterno',
            tags: ['#HotelTerror', '#Nivel5', '#Canon'],
          },
          {
            id: 'un-masked-canon-hub',
            path: '/un-masked-canon-hub',
            titleEn: 'UnMasked Canon',
            titleEs: 'Canon Desenmascarado',
            subTitleEn: 'Through Our Eyes saga and uncovered truths',
            subTitleEs: 'Saga A Través de Nuestros Ojos y verdades al descubierto',
            tags: ['#Desenmascarado', '#ThroughOurEyes', '#Canon'],
          },
          {
            id: 'cov-canon-hub',
            path: '/cov-canon-hub',
            titleEn: 'Children of the Void',
            titleEs: 'Niños del Vacío',
            subTitleEn: 'The shadowy denizens beyond regular rooms',
            subTitleEs: 'Habitantes de las sombras más allá de los niveles conocidos',
            tags: ['#NiñosDelVacío', '#Canon'],
          },
          {
            id: 'frontrooms-canon',
            path: '/frontrooms-canon',
            titleEn: 'Frontrooms Canon',
            titleEs: 'Canon Frontrooms',
            subTitleEn: 'Echoes and links back to baseline reality',
            subTitleEs: 'Ecos y vínculos con la realidad base',
            tags: ['#Frontrooms', '#RealidadBase', '#Canon'],
          },
          {
            id: 'canonicon2024',
            path: '/canonicon2024',
            titleEn: 'Canon Contest 2024',
            titleEs: 'Concurso de Cánones 2024',
            subTitleEn: 'Winning sagas and official canon contest entries',
            subTitleEs: 'Sagas ganadoras y entradas oficiales del concurso',
            tags: ['#Canonicon2024', '#Oficial', '#Canon'],
          },
          {
            id: 'origins',
            path: '/origins',
            titleEn: 'Origins',
            titleEs: 'Orígenes',
            subTitleEn: 'The inception of wanderer colonies and threshold history',
            subTitleEs: 'El nacimiento de las colonias y la historia del umbral',
            tags: ['#Orígenes', '#Historia', '#Canon'],
          },
        ];

        for (const p of PRIMARY_CANONS) {
          seen.add(p.path);
          const title = lang === 'es' ? p.titleEs : p.titleEn;
          const subTitle = lang === 'es' ? p.subTitleEs : p.subTitleEn;
          list.push({
            id: p.id,
            path: p.path,
            title,
            subTitle,
            displayName: `${title} - "${subTitle}"`,
            category: 'canon',
            numberStr: p.id,
            lang,
            tags: p.tags,
            snippet: `${subTitle} — Archivo canónico oficial del M.E.G.`,
          });
        }
      }

      let match;
      while ((match = regex.exec(content)) !== null) {
        const path = match[1];
        const lowerPath = path.toLowerCase();
        if (
          lowerPath.startsWith('/system:') ||
          lowerPath.startsWith('/search:') ||
          lowerPath.startsWith('/forum') ||
          lowerPath.startsWith('/local--files') ||
          lowerPath.startsWith('/how-to-write-') ||
          lowerPath.startsWith('/guide-hub') ||
          lowerPath.startsWith('/guide-') ||
          lowerPath.startsWith('/greenlight-policy') ||
          lowerPath.startsWith('/licensing-') ||
          lowerPath.startsWith('/theme:') ||
          lowerPath.startsWith('/component:') ||
          lowerPath.includes('javascript:') ||
          lowerPath.startsWith('/#') ||
          lowerPath.startsWith('/tag:') ||
          lowerPath.startsWith('/random:') ||
          lowerPath.includes(':random-') ||
          lowerPath.startsWith('/members-only:') ||
          lowerPath.includes('rewrite-policy') ||
          lowerPath.includes('greenlight') ||
          lowerPath.startsWith('/trimmed:') ||
          lowerPath.startsWith('/archived:') ||
          lowerPath.startsWith('/top-rated') ||
          lowerPath.startsWith('/most-recently') ||
          lowerPath.startsWith('/lowest-rated') ||
          /\/p\/\d+$/.test(lowerPath) ||
          path === '/' ||
          path === cat.pathEn ||
          seen.has(path)
        ) {
          continue;
        }

        const rawName = decodeHtmlEntities(match[2].trim());
        const rawNameLower = rawName.toLowerCase();
        if (
          rawName.length < 2 ||
          rawNameLower === 'here' ||
          rawNameLower === 'aquí' ||
          rawNameLower === 'click here' ||
          rawNameLower === 'haz clic aquí' ||
          rawNameLower.includes('random') ||
          rawNameLower.includes('aleatorio') ||
          rawNameLower.startsWith('skip to') ||
          rawNameLower.startsWith('(trimmed)') ||
          rawNameLower.startsWith('trimmed') ||
          rawNameLower.includes('policy') ||
          rawNameLower.includes('política') ||
          rawNameLower.includes('guide') ||
          rawNameLower.includes('guía') ||
          rawNameLower === 'edit' ||
          rawNameLower === 'history' ||
          rawNameLower === 'source' ||
          rawNameLower === 'files' ||
          rawNameLower === 'print' ||
          rawNameLower.startsWith('next') ||
          /^\d+$/.test(rawName) ||
          /^[.\-–—\s]+$/.test(rawName)
        ) {
          continue;
        }

        seen.add(path);

        let rawSub = match[3]
          ? cleanQuotes(decodeHtmlEntities(match[3].replace(/<[^>]+>/g, '')))
          : '';
        if (/^[.\-–—\s]+$/.test(rawSub)) {
          rawSub = '';
        }

        const code = rawName;
        const displayName = rawSub ? `${code} - "${rawSub}"` : code;
        const id = path.replace(/^\//, '');

        let itemCategory: ItemCategory = 'archive';
        if (cat.key === 'objects') itemCategory = 'object';
        else if (cat.key === 'phenomena') itemCategory = 'phenomenon';
        else if (cat.key === 'tales') itemCategory = 'tale';
        else if (cat.key === 'groups') itemCategory = 'group';
        else if (cat.key === 'poi') itemCategory = 'poi';
        else if (cat.key === 'canons') itemCategory = 'canon';
        else if (cat.key === 'jokes') itemCategory = 'joke';
        else if (cat.key === 'subclusters') itemCategory = 'subcluster';
        else if (cat.key === 'enigmatic_levels') itemCategory = 'level';
        else if (cat.key === 'enigmatic_entities') itemCategory = 'entity';
        else if (cat.key === 'art_gallery') itemCategory = 'art';

        list.push({
          id,
          path,
          title: code,
          subTitle: rawSub || undefined,
          displayName,
          category: itemCategory,
          numberStr: id,
          lang: 'en',
          tags: [`#${cat.badge}`, `#M.E.G.`, `#Archivo`],
          snippet: rawSub
            ? `"${rawSub}" — Archivo clasificado M.E.G. (${cat.titleEs})`
            : `Expediente oficial indexado en la Biblioteca M.E.G. (${cat.titleEs}).`,
        });
      }

      // If Spanish, overlay Spanish translations if available
      if (lang === 'es' && cat.pathEs) {
        try {
          const esRes = await fetch(`${BASE_ES}${cat.pathEs}`);
          if (esRes.ok) {
            const esHtml = await esRes.text();
            const esStart = esHtml.indexOf('id="page-content"');
            const esEnd = esHtml.indexOf('id="page-info-break"');
            const esContent = esHtml.substring(esStart, esEnd > 0 ? esEnd : esHtml.length);

            const esMatches = [...esContent.matchAll(regex)];
            const esMap = new Map<string, { code: string; sub: string; displayName: string }>();

            for (const em of esMatches) {
              const p = em[1];
              const c = decodeHtmlEntities(em[2].trim());
              const rawS = em[3]
                ? cleanQuotes(decodeHtmlEntities(em[3].replace(/<[^>]+>/g, '')))
                : '';
              const s = rawS;
              const d = s ? `${c} - "${s}"` : c;
              esMap.set(p, { code: c, sub: s, displayName: d });
            }

            for (const item of list) {
              const esData = esMap.get(item.path);
              if (esData) {
                item.title = esData.code;
                item.subTitle = esData.sub || undefined;
                item.displayName = esData.displayName;
                item.lang = 'es';
              }
            }
          }
        } catch (e) {
          if (cat.key !== 'subclusters') {
            console.warn('Could not fetch Spanish library category overlay:', e);
          }
        }
      }

      // Support overlay for Hispanic community objects (/objeto-es-*)
      if (lang === 'es' && cat.key === 'objects') {
        try {
          const hispRes = await fetch(`${BASE_ES}/objetos`);
          if (hispRes.ok) {
            const hispHtml = await hispRes.text();
            const hStart = hispHtml.indexOf('id="page-content"');
            const hEnd = hispHtml.indexOf('id="page-info-break"');
            const hContent = hispHtml.substring(hStart, hEnd > 0 ? hEnd : hispHtml.length);

            const hispMatches = [...hContent.matchAll(regex)];
            for (const hm of hispMatches) {
              const p = hm[1];
              if (seen.has(p) || !p.includes('objeto-es-')) continue;
              seen.add(p);
              const c = decodeHtmlEntities(hm[2].trim());
              const rawS = hm[3]
                ? cleanQuotes(decodeHtmlEntities(hm[3].replace(/<[^>]+>/g, '')))
                : '';
              const d = rawS ? `${c} - "${rawS}"` : c;
              const id = p.replace(/^\//, '');

              list.push({
                id,
                path: p,
                title: c,
                subTitle: rawS || undefined,
                displayName: d,
                category: 'object',
                numberStr: id,
                lang: 'es',
                tags: [`#OBJ`, `#Hispano`, `#M.E.G.`],
                snippet: rawS
                  ? `"${rawS}" — Objeto original de la rama hispanohablante.`
                  : 'Objeto original de la rama hispanohablante.',
              });
            }
          }
        } catch (e) {
          console.warn('Could not fetch Hispanic objects overlay:', e);
        }
      }

      return list;
    } catch (err) {
      console.error(`Error in fetchLibraryCategory (${categoryKey}):`, err);
      throw err;
    }
  }

  /**
   * Fetches and parses a full dossier from Wikidot with language support and advanced sanitization
   */
  static async fetchItemDetails(
    path: string,
    category?: ItemCategory,
    lang: 'es' | 'en' = 'es',
    signal?: AbortSignal
  ): Promise<BackroomsItem> {
    let cleanPath = path.startsWith('/') ? path : '/' + path;

    // Slug reconciliation:
    // /objeto-X (without -es-) -> /object-X
    // /fenomeno-X (without -es-) -> /phenomenon-X
    // /nivel-X -> /level-X
    // /entidad-X -> /entity-X
    // Preserve /objeto-es-X as-is
    if (/^\/objeto-(?!es-)/i.test(cleanPath)) {
      cleanPath = cleanPath.replace(/^\/objeto-/i, '/object-');
    } else if (/^\/fenomeno-(?!es-)/i.test(cleanPath)) {
      cleanPath = cleanPath.replace(/^\/fenomeno-/i, '/phenomenon-');
    } else if (/^\/nivel-/i.test(cleanPath)) {
      cleanPath = cleanPath.replace(/^\/nivel-/i, '/level-');
    } else if (/^\/entidad-/i.test(cleanPath)) {
      cleanPath = cleanPath.replace(/^\/entidad-/i, '/entity-');
    }

    const cleanId = cleanPath.replace(/^\//, '');
    const resolvedCategory = inferItemCategory(cleanId, cleanPath, category);

    // For canons, always fetch English as master source because Wikidot ES only has partial/outdated 2021 stubs
    // lacking Sagas, The Broken City, Dianic Saga, etc.
    let url = `${lang === 'es' && resolvedCategory !== 'canon' ? BASE_ES : BASE_EN}${cleanPath}`;
    let isFallback = false;

    let res = await fetch(url, { signal });
    if (!res.ok && lang === 'es') {
      // If not yet translated in Spanish branch, fallback to English
      url = `${BASE_EN}${cleanPath}`;
      res = await fetch(url, { signal });
      isFallback = true;
    }

    if (resolvedCategory === 'canon' && lang === 'es') {
      isFallback = true;
    }

    if (!res.ok) throw new Error(`Failed to fetch ${url} (status: ${res.status})`);
    let html = await res.text();

    // 1. Title and Subtitle extraction
    const pageTitleMatch = html.match(/<div id="page-title"[^>]*>([\s\S]*?)<\/div>/i);
    let fullTitle = pageTitleMatch ? decodeHtmlEntities(pageTitleMatch[1].trim()) : cleanPath;
    
    let title = fullTitle;
    let subTitle: string | undefined = undefined;

    const splitIndex = fullTitle.indexOf(' - ');
    if (splitIndex !== -1) {
      title = fullTitle.substring(0, splitIndex).trim();
      subTitle = cleanQuotes(fullTitle.substring(splitIndex + 3));
    }

    const numMatch = title.match(/(?:Level|Nivel|Entity|Entidad|Object|Objeto|Phenomenon|Fenómeno)\s+([^\s\-:]+)/i);
    const numberStr = numMatch ? numMatch[1] : '0';

    // 2. Isolate #page-content and sanitize junk
    const contentStart = html.indexOf('<div id="page-content">');
    const contentEnd = html.indexOf('<div id="page-info-break">');
    let rawContent = (contentStart !== -1 && contentEnd !== -1)
      ? html.substring(contentStart, contentEnd)
      : (contentStart !== -1 ? html.substring(contentStart) : html);

    // Extract YUI tabs first so they retain their structured separation
    let { tabs, remainingHtml } = extractYuiTabs(rawContent);

    // Clean junk, disclaimers, featureboxes from remaining body (or from rawContent if no tabs)
    const contentToParse = tabs.length > 0 ? remainingHtml : rawContent;
    let cleanContent = cleanDisclaimersAndJunk(contentToParse);

    // 3. Survival Difficulty Classification
    const classification = this.parseClassification(rawContent);

    // 4. Clean images
    const images = this.extractImages(rawContent, lang === 'es' && !isFallback ? BASE_ES : BASE_EN);

    // 5. Structure sections: Prologue, Description, Sections, Epilogue, Entrances & Exits
    let { prologue, description, sections, epilogue, entrances, exits } = this.parseSections(cleanContent);

    // 6. Handle Fallback Auto-Translation when Spanish is requested but not yet officially published on Wikidot ES
    let isAutoTranslated = false;
    if (isFallback && lang === 'es') {
      try {
        isAutoTranslated = true;
        // Translate title and subtitle
        if (category === 'canon' && CANON_SPANISH_TITLES[cleanPath]) {
          title = CANON_SPANISH_TITLES[cleanPath];
        } else if (title.startsWith('Level ')) {
          title = title.replace('Level ', 'Nivel ');
        } else if (title.startsWith('Entity ')) {
          title = title.replace('Entity ', 'Entidad ');
        }
        if (subTitle) {
          subTitle = await translateText(subTitle, 'es', 'en');
        }

        // Translate prologue
        if (prologue) {
          prologue = await translateText(prologue, 'es', 'en');
        }

        // Translate description
        if (description) {
          description = await translateText(description, 'es', 'en');
        }

        const translateHeading = (t: string) => {
          const lower = t.toLowerCase().replace(/⚔\s*saga:\s*/i, '').trim();
          if (CANON_HEADING_TRANSLATIONS[lower]) {
            return t.includes('⚔ SAGA:') ? `⚔ SAGA: ${CANON_HEADING_TRANSLATIONS[lower]}` : CANON_HEADING_TRANSLATIONS[lower];
          }
          return null;
        };

        // Translate sections
        sections = await Promise.all(
          sections.map(async (sec) => {
            const mappedTitle = translateHeading(sec.title);
            return {
              title: mappedTitle || (await translateText(sec.title, 'es', 'en')),
              content: await translateText(sec.content, 'es', 'en'),
            };
          })
        );

        // Translate tabs if any
        if (tabs.length > 0) {
          tabs = await Promise.all(
            tabs.map(async (t) => {
              const mappedTab = translateHeading(t.title);
              return {
                id: t.id,
                title: mappedTab || (await translateText(t.title, 'es', 'en')),
                content: await translateText(t.content, 'es', 'en'),
              };
            })
          );
        }

        // Translate epilogue
        if (epilogue) {
          epilogue = await translateText(epilogue, 'es', 'en');
        }

        // Translate entrances & exits
        if (entrances.length > 0) {
          entrances = await Promise.all(entrances.map(e => translateText(e, 'es', 'en')));
        }
        if (exits.length > 0) {
          exits = await Promise.all(exits.map(e => translateText(e, 'es', 'en')));
        }
      } catch (transErr) {
        console.warn('Auto-translation failed, keeping English text:', transErr);
      }
    }

    // Only apply linguistic polish engine to auto-translated fallback content in Spanish.
    // Official Spanish Wikidot content must remain unmutated.
    if (isAutoTranslated && isFallback && lang === 'es') {
      if (title) title = polishSpanishTranslation(title);
      if (subTitle) subTitle = polishSpanishTranslation(subTitle);
      if (prologue) prologue = polishSpanishTranslation(prologue);
      if (description) description = polishSpanishTranslation(description);
      if (sections && sections.length > 0) {
        sections = sections.map(sec => ({
          title: polishSpanishTranslation(sec.title),
          content: polishSpanishTranslation(sec.content),
        }));
      }
      if (tabs && tabs.length > 0) {
        tabs = tabs.map(tab => ({
          ...tab,
          title: polishSpanishTranslation(tab.title),
          content: polishSpanishTranslation(tab.content),
        }));
      }
      if (epilogue) epilogue = polishSpanishTranslation(epilogue);
      if (entrances && entrances.length > 0) {
        entrances = entrances.map(e => polishSpanishTranslation(e));
      }
      if (exits && exits.length > 0) {
        exits = exits.map(e => polishSpanishTranslation(e));
      }
    }

    return {
      id: cleanId,
      path: cleanPath,
      category: resolvedCategory,
      numberStr,
      title,
      subTitle,
      classification,
      images,
      prologue,
      description,
      sections,
      tabs: tabs.length > 0 ? tabs : undefined,
      epilogue,
      entrances,
      exits,
      url,
      lang: isFallback ? 'en' : lang,
      isFallback,
      isAutoTranslated,
      cachedAt: Date.now(),
    };
  }

  private static parseClassification(content: string): SurvivalClassification | undefined {
    const sdStart = content.indexOf('class="sd-container"');
    if (sdStart === -1) {
      const altMatch = content.match(/class="[^"]*\bclass-([0-5]|deadzone|habitable|variable|unknown)\b[^"]*"/i);
      if (altMatch) {
        const cls = altMatch[1].toLowerCase();
        const meta = SURVIVAL_CLASSES_META[cls] || SURVIVAL_CLASSES_META.unknown;
        return {
          classLevel: cls,
          safety: meta.defaultSafety,
          security: meta.defaultSecurity,
          entityCount: meta.defaultEntities,
          color: meta.color,
          badgeText: meta.label,
        };
      }
      return undefined;
    }

    const sdChunk = content.substring(sdStart, sdStart + 1500);

    let classLevel = 'unknown';
    const classBoxMatch = sdChunk.match(/class-([0-5]|deadzone|habitable|variable|pending|unknown)/i)
      || sdChunk.match(/<div class="bottom-text">\s*([0-5]|deadzone|habitable|variable|pending|unknown)\s*<\/div>/i);
    
    if (classBoxMatch) {
      classLevel = classBoxMatch[1].toLowerCase();
    }

    const traits: string[] = [];
    const listMatches = [...sdChunk.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    for (const m of listMatches) {
      const cleanTrait = stripHtml(m[1]).replace(/\.$/, '').trim();
      // Ignore unpopulated template placeholders like "{$one}" or "{$two}"
      if (cleanTrait && !/^\{?\$[a-zA-Z0-9_-]+\}?$/.test(cleanTrait)) {
        traits.push(cleanTrait);
      }
    }

    const meta = SURVIVAL_CLASSES_META[classLevel] || SURVIVAL_CLASSES_META.unknown;

    return {
      classLevel,
      safety: traits[0] || meta.defaultSafety,
      security: traits[1] || meta.defaultSecurity,
      entityCount: traits[2] || meta.defaultEntities,
      color: meta.color,
      badgeText: meta.label,
    };
  }

  private static extractImages(content: string, baseOrigin: string): WikiImage[] {
    let cleanForImages = content;

    // Strip translation blocks, list-pages, and credit widgets using findClosingDiv
    const boxPatterns = [
      /<div[^>]*class="[^"]*\btranslations\b[^"]*"[^>]*>/gi,
      /<div[^>]*class="[^"]*\blist-pages-box\b[^"]*"[^>]*>/gi,
      /<div[^>]*class="[^"]*\bcreditRate\b[^"]*"[^>]*>/gi,
      /<div[^>]*class="[^"]*\brateBox\b[^"]*"[^>]*>/gi,
      /<div[^>]*class="[^"]*\bpage-rate-widget-box\b[^"]*"[^>]*>/gi,
    ];
    for (const pat of boxPatterns) {
      let m;
      while ((m = pat.exec(cleanForImages)) !== null) {
        const start = m.index;
        const end = findClosingDiv(cleanForImages, start);
        if (end !== -1 && end > start) {
          cleanForImages = cleanForImages.substring(0, start) + cleanForImages.substring(end);
          pat.lastIndex = start;
        } else {
          break;
        }
      }
    }

    const images: WikiImage[] = [];
    const seen = new Set<string>();

    const imgMatches = [...cleanForImages.matchAll(/<img[^>]+src="([^">]+)"[^>]*>/gi)];

    for (const match of imgMatches) {
      let src = match[1].trim();
      if (!src) continue;

      const lowerSrc = src.toLowerCase();
      const rawTag = match[0].toLowerCase();

      if (
        lowerSrc.includes('iconfinder.com') ||
        lowerSrc.includes('zenzick') ||
        lowerSrc.includes('avatar') ||
        lowerSrc.includes('component:translations') ||
        lowerSrc.includes('translations') ||
        lowerSrc.includes('nav:side') ||
        lowerSrc.includes('wikidot.com/common') ||
        lowerSrc.includes('flag') || // matches flag, flags, JP-flag.png, flag-germany2x.png
        lowerSrc.includes('scpsandbox') ||
        lowerSrc.includes('.gif') ||
        lowerSrc.includes('badge') ||
        lowerSrc.includes('iosicon') ||
        lowerSrc.includes('button') ||
        lowerSrc.includes('pixel') ||
        rawTag.includes('flag') ||
        rawTag.includes('translat')
      ) {
        continue;
      }

      if (src.startsWith('/')) {
        src = `${baseOrigin}${src}`;
      } else if (!src.startsWith('http')) {
        src = `${baseOrigin}/${src}`;
      }

      if (src.startsWith('http://')) {
        src = src.replace('http://', 'https://');
      }

      if (!seen.has(src)) {
        seen.add(src);
        images.push({ url: src });
      }
    }

    return images;
  }

  private static parseSections(content: string): {
    prologue?: string;
    description: string;
    sections: DossierSection[];
    epilogue?: string;
    entrances: string[];
    exits: string[];
  } {
    // 1. Strip SD container from body using depth-balance loop
    let cleanBody = content;
    const sdRegex = /<div[^>]*class="[^"]*\bsd-container\b[^"]*"[^>]*>/gi;
    let sdMatch;
    while ((sdMatch = sdRegex.exec(cleanBody)) !== null) {
      const startIdx = sdMatch.index;
      const endIdx = findClosingDiv(cleanBody, startIdx);
      if (endIdx !== -1 && endIdx > startIdx) {
        cleanBody = cleanBody.substring(0, startIdx) + cleanBody.substring(endIdx);
        sdRegex.lastIndex = startIdx;
      } else {
        break;
      }
    }

    // 2. Control section fragmentation:
    // Restrict top section splits to h1-h2 (fallback to h3 if no h1-h2 exist).
    // Convert lower hierarchy headers into inline markdown bold subheadings.
    const topHeaderRegex = /<(h[1-2])[^>]*>([\s\S]*?)<\/\1>/gi;
    const hasTopHeaders = topHeaderRegex.test(cleanBody);

    if (hasTopHeaders) {
      cleanBody = cleanBody.replace(/<(h[3-6])[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, text) => {
        const t = stripHtml(text).replace(/^#+\s*/, '').replace(/^[*_~]+|[*_~]+$/g, '').replace(/:$/, '').trim();
        return t ? `\n\n**${t}**\n\n` : '';
      });
    } else {
      const h3Regex = /<(h3)[^>]*>([\s\S]*?)<\/\1>/gi;
      const hasH3 = h3Regex.test(cleanBody);
      if (hasH3) {
        cleanBody = cleanBody.replace(/<(h[4-6])[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, text) => {
          const t = stripHtml(text).replace(/^#+\s*/, '').replace(/^[*_~]+|[*_~]+$/g, '').replace(/:$/, '').trim();
          return t ? `\n\n**${t}**\n\n` : '';
        });
      }
    }

    const headerRegex = hasTopHeaders ? /<(h[1-2])[^>]*>([\s\S]*?)<\/\1>/gi : /<(h3)[^>]*>([\s\S]*?)<\/\1>/gi;
    const matches = [...cleanBody.matchAll(headerRegex)];

    // 3. Text before the very first header = Prologue / Introductory lore
    let rawPrologue = '';
    if (matches.length > 0) {
      const firstHeaderPos = matches[0].index ?? cleanBody.indexOf(matches[0][0]);
      rawPrologue = stripHtml(cleanBody.substring(0, firstHeaderPos));
    } else {
      rawPrologue = stripHtml(cleanBody);
    }

    // Clean any author credit, rating text, or residual SD text if it slipped into prologue
    const prologue = rawPrologue
      .replace(/^Info\s*Concepto original[\s\S]*?\n\n/i, '')
      .replace(/^Puntuación:[^\n]*\n+/i, '')
      .replace(/DIFICULTAD DE SUPERVIVENCIA:[\s\S]*?(?=\n\n|$)/gi, '')
      .trim();

    const sections: DossierSection[] = [];
    const entrances: string[] = [];
    const exits: string[] = [];
    let epilogue: string | undefined = undefined;

    for (let i = 0; i < matches.length; i++) {
      let headerTitle = stripHtml(matches[i][2])
        .replace(/^#+\s*/, '')
        .replace(/^[*_~]+|[*_~]+$/g, '')
        .replace(/:$/, '')
        .trim();
      if (!headerTitle) continue;

      if (headerTitle.toUpperCase() === 'BODY:' || headerTitle.toUpperCase() === 'BODY') {
        headerTitle = 'Registro de Datos';
      }

      const headerIndex = matches[i].index ?? cleanBody.indexOf(matches[i][0]);
      const nextHeaderIndex = i + 1 < matches.length
        ? (matches[i + 1].index ?? cleanBody.indexOf(matches[i + 1][0], headerIndex + matches[i][0].length))
        : cleanBody.length;
      
      let sectionHtml = cleanBody.substring(headerIndex + matches[i][0].length, nextHeaderIndex);

      // Check if the final section has an epilogue after spacing breaks or <hr>
      if (i === matches.length - 1) {
        const breakMatch = sectionHtml.match(/(?:<br\s*[\/]?>[\s\n\r]*){3,}/i);
        const hrIdx = sectionHtml.indexOf('<hr');
        let splitIdx = -1;
        if (breakMatch && breakMatch.index !== undefined) {
          splitIdx = breakMatch.index;
        } else if (hrIdx !== -1) {
          splitIdx = hrIdx;
        }

        if (splitIdx !== -1) {
          const epilogueHtml = sectionHtml.substring(splitIdx);
          sectionHtml = sectionHtml.substring(0, splitIdx);
          const epText = stripHtml(epilogueHtml).replace(/^[•\s\-_]+/, '').trim();
          if (epText.length > 30 && !epText.includes('destacado')) {
            epilogue = epText;
          }
        }
      }

      const sectionText = stripHtml(sectionHtml);
      if (!sectionText) continue;

      const lowerTitle = headerTitle.toLowerCase();

      if (
        (lowerTitle.includes('entrance') || lowerTitle.includes('entradas')) &&
        !lowerTitle.includes('exit') && !lowerTitle.includes('salidas')
      ) {
        entrances.push(...sectionText.split('\n').map(s => s.replace(/^•\s*/, '').trim()).filter(s => s.length > 3));
        sections.push({ title: headerTitle, content: sectionText });
      } else if (
        (lowerTitle.includes('exit') || lowerTitle.includes('salidas')) &&
        !lowerTitle.includes('entrance') && !lowerTitle.includes('entradas')
      ) {
        exits.push(...sectionText.split('\n').map(s => s.replace(/^•\s*/, '').trim()).filter(s => s.length > 3));
        sections.push({ title: headerTitle, content: sectionText });
      } else if (
        lowerTitle.includes('entrances and exits') ||
        lowerTitle.includes('entradas y salidas') ||
        lowerTitle.includes('entrances & exits')
      ) {
        const lines = sectionText.split('\n').map(s => s.replace(/^•\s*/, '').trim()).filter(Boolean);
        let currentTarget: 'entrance' | 'exit' | null = null;
        for (const line of lines) {
          const l = line.toLowerCase();
          if (l.includes('entrance') || l.includes('entrada')) {
            currentTarget = 'entrance';
            const stripped = line.replace(/^(?:•\s*)?(?:entradas?|entrances?)\s*[:\-–—]\s*/i, '').trim();
            if (stripped.length > 3) {
              entrances.push(stripped);
            }
          } else if (l.includes('exit') || l.includes('salida')) {
            currentTarget = 'exit';
            const stripped = line.replace(/^(?:•\s*)?(?:salidas?|exits?)\s*[:\-–—]\s*/i, '').trim();
            if (stripped.length > 3) {
              exits.push(stripped);
            }
          } else if (currentTarget === 'entrance') {
            entrances.push(line);
          } else if (currentTarget === 'exit') {
            exits.push(line);
          }
        }
        sections.push({ title: headerTitle, content: sectionText });
      } else {
        sections.push({ title: headerTitle, content: sectionText });
      }
    }

    // 4. Determine official Description
    let description = '';
    const descIndex = sections.findIndex(
      s => s.title.toLowerCase().includes('description') ||
           s.title.toLowerCase().includes('descripción') ||
           s.title.toLowerCase().includes('generalidades') ||
           s.title.toLowerCase().includes('overview')
    );

    if (descIndex !== -1) {
      description = sections[descIndex].content;
      sections.splice(descIndex, 1);
    } else if (sections.length > 0) {
      description = sections[0].content;
      sections.shift();
    }

    return {
      prologue: prologue.length > 20 ? prologue : undefined,
      description,
      sections,
      epilogue,
      entrances,
      exits,
    };
  }
}

export const TRAIT_TRANSLATIONS: Record<string, string> = {
  'safe': 'Seguro',
  'secure': 'Asegurado',
  'unsafe': 'Inseguro',
  'unsecure': 'Desasegurado',
  'devoid of entities': 'Desprovisto de Entidades',
  'minimal entity count': 'Presencia Mínima de Entidades',
  'low entity count': 'Baja Presencia de Entidades',
  'medium entity count': 'Presencia Moderada de Entidades',
  'high entity count': 'Alta Presencia de Entidades',
  'infested with entities': 'Infestado de Entidades',
  'entity infestation': 'Infestación de Entidades',
  'undetermined': 'Indeterminado',
  'indeterminado': 'Indeterminado',
  'unconfirmed': 'Sin Confirmar',
  'sin confirmar': 'Sin Confirmar',
  'environmental hazards': 'Peligros Ambientales',
  'psychological hazards': 'Peligros Psicológicos',
  'biological hazards': 'Peligros Biológicos',
  'anomalous properties': 'Propiedades Anómalas',
};

export const DEFAULT_TRAITS_BY_CLASS: Record<string, { safety: string; security: string; entityCount: string }> = {
  '0': { safety: 'Safe', security: 'Secure', entityCount: 'Devoid of Entities' },
  '1': { safety: 'Safe', security: 'Secure', entityCount: 'Minimal Entity Count' },
  '2': { safety: 'Unsafe', security: 'Secure', entityCount: 'Low Entity Count' },
  '3': { safety: 'Unsafe', security: 'Unsecure', entityCount: 'Medium Entity Count' },
  '4': { safety: 'Unsafe', security: 'Unsecure', entityCount: 'High Entity Count' },
  '5': { safety: 'Unsafe', security: 'Unsecure', entityCount: 'Entity Infestation' },
  'habitable': { safety: 'Safe', security: 'Secure', entityCount: 'Devoid of Entities' },
  'deadzone': { safety: 'Unsafe', security: 'Unsecure', entityCount: 'Entity Infestation' },
};

export function translateTrait(trait: string, lang: 'es' | 'en' = 'es'): string {
  if (lang !== 'es' || !trait) return trait;
  const lower = trait.trim().toLowerCase();
  if (TRAIT_TRANSLATIONS[lower]) return TRAIT_TRANSLATIONS[lower];
  return trait;
}

export function getSurvivalDifficultyFallback(classLevel?: string, lang: 'es' | 'en' = 'es') {
  const classKey = (classLevel || '').toLowerCase().trim();
  if (classKey && DEFAULT_TRAITS_BY_CLASS[classKey]) {
    const d = DEFAULT_TRAITS_BY_CLASS[classKey];
    return {
      safety: translateTrait(d.safety, lang),
      security: translateTrait(d.security, lang),
      entityCount: translateTrait(d.entityCount, lang),
    };
  }
  return {
    safety: lang === 'es' ? 'Indeterminado' : 'Undetermined',
    security: lang === 'es' ? 'Indeterminado' : 'Undetermined',
    entityCount: lang === 'es' ? 'Sin Confirmar' : 'Unconfirmed',
  };
}

export interface TextSegment {
  text: string;
  isLink?: boolean;
  isExternal?: boolean;
  path?: string;
  category?: ItemCategory;
}

export const SPECIAL_ENTITIES: Record<string, string> = {
  smiler: 'entity-3',
  smilers: 'entity-3',
  sonrientes: 'entity-3',
  hound: 'entity-8',
  hounds: 'entity-8',
  sabueso: 'entity-8',
  sabuesos: 'entity-8',
  'skin-stealer': 'entity-10',
  'skin-stealers': 'entity-10',
  'ladrones de piel': 'entity-10',
  'roba pieles': 'entity-10',
  deathmoth: 'entity-4',
  deathmoths: 'entity-4',
  faceling: 'entity-9',
  facelings: 'entity-9',
  infaciales: 'entity-9',
};

export function parseNoclipSegments(content?: string): TextSegment[] {
  if (!content) return [];

  const pattern = /\[([^\]]+)\]\(([^)]+)\)|(?:Nivel|Level)\s+(\d+(?:\.\d+)?)|(?:Entidad|Entity)\s+(\d+)|(?:Objeto|Object)\s+(\d+)|(?:Fen[oó]meno|Phenomenon)\s+(\d+)|(\b(?:smilers?|sonrientes|hounds?|sabuesos?|skin-stealers?|ladrones de piel|roba pieles|deathmoths?|facelings?|infaciales)\b)/gi;

  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: content.substring(lastIndex, match.index) });
    }

    const matchedText = match[0];
    const mdTitle = match[1];
    const mdPath = match[2];
    const levelNum = match[3];
    const entityNum = match[4];
    const objectNum = match[5];
    const phenomNum = match[6];
    const namedMonster = match[7];

    if (mdTitle && mdPath) {
      const rawPath = mdPath.trim();
      const isExternal = /^(?:https?:\/\/|mailto:)/i.test(rawPath);

      if (isExternal) {
        segments.push({
          text: mdTitle.trim(),
          isLink: true,
          isExternal: true,
          path: rawPath,
        });
      } else {
        const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        const cleanId = cleanPath.replace(/^\//, '');
        const cat = inferItemCategory(cleanId, cleanPath);

        segments.push({
          text: mdTitle.trim(),
          isLink: true,
          isExternal: false,
          path: cleanPath,
          category: cat,
        });
      }
    } else if (levelNum) {
      const cleanNum = levelNum.replace('.', '-');
      segments.push({
        text: matchedText,
        isLink: true,
        isExternal: false,
        path: `/level-${cleanNum}`,
        category: 'level',
      });
    } else if (entityNum) {
      segments.push({
        text: matchedText,
        isLink: true,
        isExternal: false,
        path: `/entity-${entityNum}`,
        category: 'entity',
      });
    } else if (objectNum) {
      segments.push({
        text: matchedText,
        isLink: true,
        isExternal: false,
        path: `/object-${objectNum}`,
        category: 'object',
      });
    } else if (phenomNum) {
      segments.push({
        text: matchedText,
        isLink: true,
        isExternal: false,
        path: `/phenomenon-${phenomNum}`,
        category: 'phenomenon',
      });
    } else if (namedMonster) {
      const targetSlug = SPECIAL_ENTITIES[namedMonster.toLowerCase()];
      if (targetSlug) {
        segments.push({
          text: matchedText,
          isLink: true,
          isExternal: false,
          path: `/${targetSlug}`,
          category: 'entity',
        });
      } else {
        segments.push({ text: matchedText });
      }
    } else {
      segments.push({ text: matchedText });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ text: content.substring(lastIndex) });
  }

  return segments;
}
