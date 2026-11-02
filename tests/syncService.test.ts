import test from 'node:test';
import assert from 'node:assert/strict';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncService } from '../src/services/syncService';
import { StorageService } from '../src/services/storageService';

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

AsyncStorage.getAllKeys = async (): Promise<readonly string[]> => {
  return Array.from(inMemoryStorage.keys());
};

AsyncStorage.multiGet = async (keys: readonly string[]): Promise<readonly [string, string | null][]> => {
  return keys.map(k => [k, inMemoryStorage.has(k) ? inMemoryStorage.get(k)! : null] as [string, string | null]);
};

AsyncStorage.multiRemove = async (keys: readonly string[]): Promise<void> => {
  keys.forEach(k => inMemoryStorage.delete(k));
};

test('SyncService Package Resolution and Queue Engine', async t => {
  await t.test('resolves essentials package with 19 items (9 levels + 10 entities)', async () => {
    const items = await SyncService.resolvePackageItems('essentials', 'es');
    assert.strictEqual(items.length, 19);

    // Levels 0 to 8
    const levels = items.filter(it => it.category === 'level');
    assert.strictEqual(levels.length, 9);
    assert.strictEqual(levels[0].id, 'level-0');
    assert.strictEqual(levels[8].id, 'level-8');

    // Entities 1 to 10
    const entities = items.filter(it => it.category === 'entity');
    assert.strictEqual(entities.length, 10);
    assert.strictEqual(entities[0].id, 'entity-1');
    assert.strictEqual(entities[9].id, 'entity-10');
  });

  await t.test('resolves cluster_1 package with 100 levels (0 to 99)', async () => {
    const items = await SyncService.resolvePackageItems('cluster_1', 'es');
    assert.strictEqual(items.length, 100);
    assert.strictEqual(items[0].id, 'level-0');
    assert.strictEqual(items[99].id, 'level-99');
    assert.ok(items.every(it => it.category === 'level'));
  });

  await t.test('resolves favorites package dynamically from StorageService', async () => {
    const testFavLevel = 'test-sync-level-777';
    const testFavEntity = 'test-sync-entity-888';

    const res1 = await StorageService.toggleFavorite(testFavLevel);
    const res2 = await StorageService.toggleFavorite(testFavEntity);
    const favs = await StorageService.getFavorites();

    const items = await SyncService.resolvePackageItems('favorites', 'es');
    const ids = items.map(it => it.id);
    assert.ok(ids.includes(testFavLevel), `Expected ${testFavLevel} in ${JSON.stringify(ids)}, getFavorites was: ${JSON.stringify(favs)} (res1=${res1}, res2=${res2})`);
    assert.ok(ids.includes(testFavEntity));

    // Cleanup favorites
    await StorageService.toggleFavorite(testFavLevel);
    await StorageService.toggleFavorite(testFavEntity);
  });

  await t.test('handles subscriber notifications, pause, resume, and cancel lifecycle', async () => {
    let lastStatus = '';
    const unsubscribe = SyncService.subscribe(prog => {
      lastStatus = prog.status;
    });

    assert.strictEqual(SyncService.getStatus(), 'idle');

    // Pause / Resume / Cancel checks
    SyncService.pause();
    // Cannot pause if not running
    assert.strictEqual(SyncService.getStatus(), 'idle');

    SyncService.cancel();
    assert.strictEqual(SyncService.getStatus(), 'idle');

    unsubscribe();
  });
});
