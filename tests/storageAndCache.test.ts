/// <reference types="node" />
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService, KEYS } from '../src/services/storageService';
import { BackroomsItem, LastReadSession } from '../src/types/wikidot';

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

const createSampleItem = (overrides: Partial<BackroomsItem> = {}): BackroomsItem => ({
  id: 'level-0',
  path: '/level-0',
  title: 'Nivel 0: "Zona Tutorial"',
  subTitle: 'Zona Tutorial',
  category: 'level',
  numberStr: '0',
  url: 'https://es-backrooms-wiki.wikidot.com/level-0',
  isAutoTranslated: false,
  isFallback: false,
  description: 'El Nivel 0 es el primer nivel de los Backrooms...',
  images: [{ url: 'https://example.com/level0.jpg', caption: 'Nivel 0' }],
  sections: [{ title: 'Supervivencia', content: 'Nivel seguro.' }],
  entrances: [],
  exits: [],
  ...overrides,
});

describe('Requirement R3: Cache Isolation & Persistence without Identifier Mutation', () => {
  beforeEach(async () => {
    inMemoryStorage.clear();
  });

  describe('Decoupled Cache Storage Keys (buildItemCacheKey)', () => {
    test('builds isolated cache keys partitioned by clean ID and language', () => {
      const keyEs = StorageService.buildItemCacheKey('level-0', 'es');
      const keyEn = StorageService.buildItemCacheKey('level-0', 'en');

      assert.strictEqual(keyEs, `${KEYS.CACHED_ITEMS}_level-0_es`);
      assert.strictEqual(keyEn, `${KEYS.CACHED_ITEMS}_level-0_en`);
      assert.notStrictEqual(keyEs, keyEn);
    });

    test('strips leading slashes when building cache key', () => {
      const key = StorageService.buildItemCacheKey('/level-1', 'es');
      assert.strictEqual(key, `${KEYS.CACHED_ITEMS}_level-1_es`);
    });

    test('sanitizes legacy _v5_canonical and language suffixes in cache key generation', () => {
      const key1 = StorageService.buildItemCacheKey('level-0_es_v5_canonical', 'es');
      const key2 = StorageService.buildItemCacheKey('/level-0_en_v5_canonical', 'en');
      const key3 = StorageService.buildItemCacheKey('level-0_v5_canonical', 'es');
      const key4 = StorageService.buildItemCacheKey('entity-1-v5_canonical', 'es');

      assert.strictEqual(key1, `${KEYS.CACHED_ITEMS}_level-0_es`);
      assert.strictEqual(key2, `${KEYS.CACHED_ITEMS}_level-0_en`);
      assert.strictEqual(key3, `${KEYS.CACHED_ITEMS}_level-0_es`);
      assert.strictEqual(key4, `${KEYS.CACHED_ITEMS}_entity-1_es`);
    });
  });

  describe('Immutable saveItemToCache', () => {
    test('stores under decoupled storage key without mutating input item.id or item.path', async () => {
      const original = createSampleItem({
        id: 'level-0',
        path: '/level-0',
      });

      // Freeze original object to guarantee no mutation occurs
      const frozen = Object.freeze({ ...original });

      await StorageService.saveItemToCache(frozen, 'es');

      // Assert input object identity & properties were NOT modified
      assert.strictEqual(frozen.id, 'level-0');
      assert.strictEqual(frozen.path, '/level-0');

      // Assert stored key exists
      const expectedKey = `${KEYS.CACHED_ITEMS}_level-0_es`;
      assert.strictEqual(inMemoryStorage.has(expectedKey), true);

      // Assert stored data contains clean attributes
      const rawStored = inMemoryStorage.get(expectedKey);
      assert.ok(rawStored);
      const parsed: BackroomsItem = JSON.parse(rawStored!);
      assert.strictEqual(parsed.id, 'level-0');
      assert.strictEqual(parsed.path, '/level-0');
      assert.strictEqual(parsed.lang, 'es');
      assert.ok(typeof parsed.cachedAt === 'number');
    });

    test('sanitizes contaminated identifiers when saving without polluting source object', async () => {
      const contaminated = {
        ...createSampleItem(),
        id: 'level-0_es_v5_canonical',
        path: '/level-0_es_v5_canonical',
      };

      await StorageService.saveItemToCache(contaminated, 'es');

      // Source object preserves its own reference
      assert.strictEqual(contaminated.id, 'level-0_es_v5_canonical');

      // Saved entry has clean ID and path under decoupled key
      const expectedKey = `${KEYS.CACHED_ITEMS}_level-0_es`;
      assert.strictEqual(inMemoryStorage.has(expectedKey), true);

      const parsed: BackroomsItem = JSON.parse(inMemoryStorage.get(expectedKey)!);
      assert.strictEqual(parsed.id, 'level-0');
      assert.strictEqual(parsed.path, '/level-0');
    });
  });

  describe('getCachedItem with Sanitization & Legacy Fallback', () => {
    test('retrieves item using clean ID and ensures immutable clean item.id and item.path', async () => {
      const item = createSampleItem();
      await StorageService.saveItemToCache(item, 'es');

      const retrieved = await StorageService.getCachedItem('level-0', 'es');
      assert.ok(retrieved);
      assert.strictEqual(retrieved!.id, 'level-0');
      assert.strictEqual(retrieved!.path, '/level-0');
      assert.strictEqual(retrieved!.title, item.title);
    });

    test('retrieves item even when queried with contaminated or slash-prefixed IDs', async () => {
      const item = createSampleItem();
      await StorageService.saveItemToCache(item, 'es');

      const byLegacySuffix = await StorageService.getCachedItem('level-0_es_v5_canonical', 'es');
      assert.ok(byLegacySuffix);
      assert.strictEqual(byLegacySuffix!.id, 'level-0');
      assert.strictEqual(byLegacySuffix!.path, '/level-0');

      const bySlashPrefix = await StorageService.getCachedItem('/level-0', 'es');
      assert.ok(bySlashPrefix);
      assert.strictEqual(bySlashPrefix!.id, 'level-0');
      assert.strictEqual(bySlashPrefix!.path, '/level-0');
    });

    test('auto-heals and migrates legacy cache entries stored under old monolithic keys', async () => {
      // Simulate legacy cache entry stored prior to remediation
      const legacyKey = `${KEYS.CACHED_ITEMS}_level-2_es_v5_canonical`;
      const legacyItem: BackroomsItem = {
        ...createSampleItem({
          id: 'level-2_es_v5_canonical',
          path: '/level-2_es_v5_canonical',
          title: 'Nivel 2',
        }),
      };
      inMemoryStorage.set(legacyKey, JSON.stringify(legacyItem));

      // Querying via clean ID triggers legacy fallback lookup
      const retrieved = await StorageService.getCachedItem('level-2', 'es');
      assert.ok(retrieved);
      assert.strictEqual(retrieved!.id, 'level-2');
      assert.strictEqual(retrieved!.path, '/level-2');

      // Verifies auto-migration to the decoupled primary key
      const decoupledKey = `${KEYS.CACHED_ITEMS}_level-2_es`;
      assert.strictEqual(inMemoryStorage.has(decoupledKey), true);
      const migrated = JSON.parse(inMemoryStorage.get(decoupledKey)!);
      assert.strictEqual(migrated.id, 'level-2');
      assert.strictEqual(migrated.path, '/level-2');
    });

    test('returns null for non-existent cache keys', async () => {
      const nonExistent = await StorageService.getCachedItem('level-99999');
      assert.strictEqual(nonExistent, null);
    });
  });

  describe('Last Read Session Sanitization & Auto-Healing', () => {
    test('saveLastReadSession sanitizes contaminated ID and path before persisting', async () => {
      const session: LastReadSession = {
        id: 'level-0_es_v5_canonical',
        path: '/level-0_es_v5_canonical',
        title: 'Nivel 0',
        displayName: 'Nivel 0',
        category: 'level',
        scrollY: 320,
        scrollPercent: 25,
        lang: 'es',
        timestamp: Date.now(),
      };

      await StorageService.saveLastReadSession(session);

      const raw = inMemoryStorage.get(KEYS.LAST_READ);
      assert.ok(raw);
      const stored: LastReadSession = JSON.parse(raw!);
      assert.strictEqual(stored.id, 'level-0');
      assert.strictEqual(stored.path, '/level-0');
    });

    test('getLastReadSession auto-heals contaminated sessions stored in AsyncStorage to eliminate 404s', async () => {
      // Simulate pre-existing contaminated session from earlier app run
      const contaminatedSession: LastReadSession = {
        id: 'level-0_es_v5_canonical',
        path: '/level-0_es_v5_canonical',
        title: 'Nivel 0 - "Zona Tutorial"',
        displayName: 'Nivel 0 - "Zona Tutorial"',
        category: 'level',
        scrollY: 1040,
        scrollPercent: 65,
        lang: 'es',
        timestamp: 1670000000000,
      };
      inMemoryStorage.set(KEYS.LAST_READ, JSON.stringify(contaminatedSession));

      // Reading session must auto-heal and rewrite AsyncStorage
      const healed = await StorageService.getLastReadSession();
      assert.ok(healed);
      assert.strictEqual(healed!.id, 'level-0');
      assert.strictEqual(healed!.path, '/level-0');
      assert.strictEqual(healed!.scrollY, 1040);

      // Verify that AsyncStorage was permanently healed
      const updatedRaw = inMemoryStorage.get(KEYS.LAST_READ);
      assert.ok(updatedRaw);
      const updatedSession: LastReadSession = JSON.parse(updatedRaw!);
      assert.strictEqual(updatedSession.id, 'level-0');
      assert.strictEqual(updatedSession.path, '/level-0');
    });

    test('getLastReadSession returns clean session as-is when already valid', async () => {
      const cleanSession: LastReadSession = {
        id: 'level-1',
        path: '/level-1',
        title: 'Nivel 1',
        displayName: 'Nivel 1',
        category: 'level',
        scrollY: 0,
        scrollPercent: 0,
        lang: 'es',
        timestamp: Date.now(),
      };
      await StorageService.saveLastReadSession(cleanSession);

      const result = await StorageService.getLastReadSession();
      assert.ok(result);
      assert.strictEqual(result!.id, 'level-1');
      assert.strictEqual(result!.path, '/level-1');
    });
  });

  describe('Favorites & Reading History Sanitization', () => {
    test('getFavorites auto-heals contaminated arrays and deduplicates', async () => {
      const contaminatedList = [
        'level-0_es_v5_canonical',
        '/level-0',
        'entity-1_en_v5_canonical',
        '/entity-2',
      ];
      inMemoryStorage.set(KEYS.FAVORITES, JSON.stringify(contaminatedList));

      const cleaned = await StorageService.getFavorites();
      assert.deepStrictEqual(cleaned, ['level-0', 'entity-1', 'entity-2']);

      // Verifies storage was rewritten
      const stored = JSON.parse(inMemoryStorage.get(KEYS.FAVORITES)!);
      assert.deepStrictEqual(stored, ['level-0', 'entity-1', 'entity-2']);
    });

    test('isFavorite checks cleanly regardless of identifier format', async () => {
      await StorageService.toggleFavorite('level-0');

      assert.strictEqual(await StorageService.isFavorite('level-0'), true);
      assert.strictEqual(await StorageService.isFavorite('/level-0'), true);
      assert.strictEqual(await StorageService.isFavorite('level-0_es_v5_canonical'), true);
      assert.strictEqual(await StorageService.isFavorite('level-1'), false);
    });

    test('toggleFavorite toggles clean identifiers without polluting with suffixes', async () => {
      const isFav1 = await StorageService.toggleFavorite('level-0_es_v5_canonical');
      assert.strictEqual(isFav1, true);

      const favs = await StorageService.getFavorites();
      assert.deepStrictEqual(favs, ['level-0']);

      const isFav2 = await StorageService.toggleFavorite('/level-0');
      assert.strictEqual(isFav2, false);

      const favsAfter = await StorageService.getFavorites();
      assert.deepStrictEqual(favsAfter, []);
    });

    test('getReadIds auto-heals contaminated entries and markAsRead cleanses input', async () => {
      const contaminatedReads = ['level-0_es_v5_canonical', '/entity-1'];
      inMemoryStorage.set(KEYS.READ_ITEMS, JSON.stringify(contaminatedReads));

      const reads = await StorageService.getReadIds();
      assert.deepStrictEqual(reads, ['level-0', 'entity-1']);

      await StorageService.markAsRead('level-2_es_v5_canonical');
      assert.strictEqual(await StorageService.isRead('level-2'), true);
      assert.strictEqual(await StorageService.isRead('level-2_es_v5_canonical'), true);

      await StorageService.unmarkAsRead('/level-2');
      assert.strictEqual(await StorageService.isRead('level-2'), false);
    });
  });
});
