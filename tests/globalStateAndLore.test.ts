/// <reference types="node" />
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService, KEYS } from '../src/services/storageService';
import {
  getSurvivalDifficultyFallback,
  translateTrait,
  getLevelTags,
  getEntityTags,
  parseNoclipSegments,
} from '../src/services/wikidotService';

// In-memory AsyncStorage mock implementation for deterministic unit testing
const inMemoryStorage = new Map<string, string>();

AsyncStorage.getItem = async (key: string): Promise<string | null> => {
  return inMemoryStorage.has(key) ? inMemoryStorage.get(key)! : null;
};

AsyncStorage.setItem = async (key: string, value: string): Promise<void> => {
  inMemoryStorage.set(key, value);
};

AsyncStorage.removeItem = async (key: string): Promise<void> => {
  inMemoryStorage.delete(key);
};

AsyncStorage.clear = async (): Promise<void> => {
  inMemoryStorage.clear();
};

describe('Requirement R4: Global Language Sync, Lore-Accurate Danger Classification, and Noclip Links', () => {
  beforeEach(async () => {
    inMemoryStorage.clear();
  });

  describe('1. Centralized Global Language State & Storage Sync', () => {
    test('StorageService.getLanguage defaults to "es" when uninitialized', async () => {
      const lang = await StorageService.getLanguage();
      assert.strictEqual(lang, 'es');
    });

    test('StorageService.setLanguage persists and syncs reactive language setting', async () => {
      await StorageService.setLanguage('en');
      let currentLang = await StorageService.getLanguage();
      assert.strictEqual(currentLang, 'en');

      // Verify underlying storage key
      const storedRaw = inMemoryStorage.get(KEYS.LANGUAGE);
      assert.strictEqual(storedRaw, 'en');

      // Toggle back to Spanish
      await StorageService.setLanguage('es');
      currentLang = await StorageService.getLanguage();
      assert.strictEqual(currentLang, 'es');
      assert.strictEqual(inMemoryStorage.get(KEYS.LANGUAGE), 'es');
    });

    test('ignores invalid language values and safely defaults to "es"', async () => {
      inMemoryStorage.set(KEYS.LANGUAGE, 'fr');
      const lang = await StorageService.getLanguage();
      assert.strictEqual(lang, 'es');
    });
  });

  describe('2. Lore-Accurate Danger Classification (SurvivalBadge)', () => {
    test('under no circumstances defaults to "Safe" for undefined classLevel', () => {
      const fallbackEs = getSurvivalDifficultyFallback(undefined, 'es');
      assert.strictEqual(fallbackEs.safety, 'Indeterminado');
      assert.strictEqual(fallbackEs.security, 'Indeterminado');
      assert.strictEqual(fallbackEs.entityCount, 'Sin Confirmar');

      assert.notStrictEqual(fallbackEs.safety.toLowerCase(), 'safe');
      assert.notStrictEqual(fallbackEs.safety.toLowerCase(), 'seguro');
    });

    test('under no circumstances defaults to "Safe" for unknown or pending class in English', () => {
      const fallbackEn = getSurvivalDifficultyFallback('unknown', 'en');
      assert.strictEqual(fallbackEn.safety, 'Undetermined');
      assert.strictEqual(fallbackEn.security, 'Undetermined');
      assert.strictEqual(fallbackEn.entityCount, 'Unconfirmed');

      assert.notStrictEqual(fallbackEn.safety.toLowerCase(), 'safe');
    });

    test('under no circumstances defaults to "Safe" for non-standard class (e.g. pending, variable)', () => {
      const pendingEs = getSurvivalDifficultyFallback('pending', 'es');
      assert.strictEqual(pendingEs.safety, 'Indeterminado');
      assert.strictEqual(pendingEs.security, 'Indeterminado');
      assert.strictEqual(pendingEs.entityCount, 'Sin Confirmar');

      const variableEn = getSurvivalDifficultyFallback('variable', 'en');
      assert.strictEqual(variableEn.safety, 'Undetermined');
      assert.strictEqual(variableEn.security, 'Undetermined');
      assert.strictEqual(variableEn.entityCount, 'Unconfirmed');
    });

    test('translateTrait translates undetermined and unconfirmed attributes correctly', () => {
      assert.strictEqual(translateTrait('undetermined', 'es'), 'Indeterminado');
      assert.strictEqual(translateTrait('indeterminado', 'es'), 'Indeterminado');
      assert.strictEqual(translateTrait('unconfirmed', 'es'), 'Sin Confirmar');
      assert.strictEqual(translateTrait('sin confirmar', 'es'), 'Sin Confirmar');
      assert.strictEqual(translateTrait('undetermined', 'en'), 'undetermined');
    });

    test('preserves genuine traits for officially recognized standard classes (0-5, habitable, deadzone)', () => {
      const class0Es = getSurvivalDifficultyFallback('0', 'es');
      assert.strictEqual(class0Es.safety, 'Seguro');
      assert.strictEqual(class0Es.security, 'Asegurado');
      assert.strictEqual(class0Es.entityCount, 'Desprovisto de Entidades');

      const class5En = getSurvivalDifficultyFallback('5', 'en');
      assert.strictEqual(class5En.safety, 'Unsafe');
      assert.strictEqual(class5En.security, 'Unsecure');
      assert.strictEqual(class5En.entityCount, 'Entity Infestation');
    });
  });

  describe('3. Absence of Fabricated Danger Classes in Tags', () => {
    test('getLevelTags does not fabricate "Clase 0 / 1" or "Seguro" based on numberStr', () => {
      const tags0 = getLevelTags('0', undefined, 'es');
      assert.ok(!tags0.includes('Clase 0 / 1'));
      assert.ok(!tags0.includes('Seguro'));
      assert.ok(tags0.includes('Nivel Principal'));
      assert.ok(tags0.includes('M.E.G.'));

      const tags1 = getLevelTags('1', undefined, 'en');
      assert.ok(!tags1.includes('Class 0 / 1'));
      assert.ok(!tags1.includes('Safe'));
      assert.ok(tags1.includes('Main Level'));
      assert.ok(tags1.includes('M.E.G.'));
    });

    test('getLevelTags does not fabricate "Peligro Crítico" or "Critical Hazard" for Level 4 or higher', () => {
      // Level 4 in Backrooms canon is Class 0 / Habitable, so fabricating "Peligro Crítico" solely from number 4 was erroneous
      const tags4Es = getLevelTags('4', undefined, 'es');
      assert.ok(!tags4Es.includes('Peligro Crítico'));
      assert.ok(!tags4Es.includes('Inseguro'));

      const tags100En = getLevelTags('100', undefined, 'en');
      assert.ok(!tags100En.includes('Critical Hazard'));
    });

    test('getLevelTags tags sub-levels and enigmatic levels factually without artificial danger classes', () => {
      const subTags = getLevelTags('0.2', undefined, 'es');
      assert.ok(subTags.includes('Subnivel'));
      assert.ok(!subTags.some(t => t.toLowerCase().includes('clase')));

      const enigmaTags = getLevelTags('run-for-your-life', undefined, 'es');
      assert.ok(enigmaTags.includes('Enigmático'));
      assert.ok(!enigmaTags.some(t => t.toLowerCase().includes('clase')));
    });

    test('getEntityTags does not fabricate danger or behavior tags based on entity numbers', () => {
      const ent1Tags = getEntityTags('1', undefined, 'es');
      assert.ok(!ent1Tags.includes('Biología Anómala'));
      assert.deepStrictEqual(ent1Tags, ['Entidad', 'M.E.G. Log']);

      const ent3Tags = getEntityTags('3', undefined, 'es');
      assert.ok(!ent3Tags.includes('Hostil'));
      assert.deepStrictEqual(ent3Tags, ['Entidad', 'M.E.G. Log']);

      const ent4Tags = getEntityTags('4', undefined, 'es');
      assert.ok(!ent4Tags.includes('Neutral / Pasivo'));
      assert.deepStrictEqual(ent4Tags, ['Entidad', 'M.E.G. Log']);

      const ent10Tags = getEntityTags('10', undefined, 'es');
      assert.ok(!ent10Tags.includes('Fauna Anómala'));
      assert.deepStrictEqual(ent10Tags, ['Entidad', 'M.E.G. Log']);
    });
  });

  describe('4. Multi-Segment Noclip & External Link Parsing', () => {
    test('detects external http/https/mailto URLs and flags isExternal: true', () => {
      const content = 'Consulta la wiki oficial en [Wikidot](https://backrooms-wiki.wikidot.com) o escribe a [Contacto](mailto:meg@meg.org).';
      const segments = parseNoclipSegments(content);

      const httpsSeg = segments.find(s => s.text === 'Wikidot');
      assert.ok(httpsSeg, 'Wikidot segment should exist');
      assert.strictEqual(httpsSeg.isLink, true);
      assert.strictEqual(httpsSeg.isExternal, true);
      assert.strictEqual(httpsSeg.path, 'https://backrooms-wiki.wikidot.com');

      const mailtoSeg = segments.find(s => s.text === 'Contacto');
      assert.ok(mailtoSeg, 'Mailto segment should exist');
      assert.strictEqual(mailtoSeg.isLink, true);
      assert.strictEqual(mailtoSeg.isExternal, true);
      assert.strictEqual(mailtoSeg.path, 'mailto:meg@meg.org');
    });

    test('preserves multi-segment internal paths without truncating or removing slashes', () => {
      const content = 'Explora el [Subcluster Especial](/subcluster/level-2/sector-7) y la historia [El Origen](/hub/tales/chapter-1).';
      const segments = parseNoclipSegments(content);

      const subSeg = segments.find(s => s.text === 'Subcluster Especial');
      assert.ok(subSeg, 'Subcluster segment should exist');
      assert.strictEqual(subSeg.isLink, true);
      assert.strictEqual(subSeg.isExternal, false);
      assert.strictEqual(subSeg.path, '/subcluster/level-2/sector-7');
      assert.strictEqual(subSeg.category, 'subcluster');

      const taleSeg = segments.find(s => s.text === 'El Origen');
      assert.ok(taleSeg, 'Tale segment should exist');
      assert.strictEqual(taleSeg.isLink, true);
      assert.strictEqual(taleSeg.isExternal, false);
      assert.strictEqual(taleSeg.path, '/hub/tales/chapter-1');
      assert.strictEqual(taleSeg.category, 'tale');
    });

    test('parses inline entity names and level mentions accurately as internal links', () => {
      const content = 'Un Smiler fue visto cerca de Level 0 y la Entidad 5.';
      const segments = parseNoclipSegments(content);

      const smilerSeg = segments.find(s => s.text.toLowerCase().includes('smiler'));
      assert.ok(smilerSeg);
      assert.strictEqual(smilerSeg.isLink, true);
      assert.strictEqual(smilerSeg.isExternal, false);
      assert.strictEqual(smilerSeg.path, '/entity-3');
      assert.strictEqual(smilerSeg.category, 'entity');

      const levelSeg = segments.find(s => s.text.includes('Level 0'));
      assert.ok(levelSeg);
      assert.strictEqual(levelSeg.isLink, true);
      assert.strictEqual(levelSeg.isExternal, false);
      assert.strictEqual(levelSeg.path, '/level-0');
      assert.strictEqual(levelSeg.category, 'level');

      const entitySeg = segments.find(s => s.text.includes('Entidad 5'));
      assert.ok(entitySeg);
      assert.strictEqual(entitySeg.isLink, true);
      assert.strictEqual(entitySeg.isExternal, false);
      assert.strictEqual(entitySeg.path, '/entity-5');
      assert.strictEqual(entitySeg.category, 'entity');
    });

    test('handles empty and plain content gracefully', () => {
      assert.deepStrictEqual(parseNoclipSegments(''), []);
      assert.deepStrictEqual(parseNoclipSegments(undefined), []);

      const plain = parseNoclipSegments('Solo texto plano sin enlaces.');
      assert.strictEqual(plain.length, 1);
      assert.strictEqual(plain[0].text, 'Solo texto plano sin enlaces.');
      assert.strictEqual(plain[0].isLink, undefined);
    });
  });
});
