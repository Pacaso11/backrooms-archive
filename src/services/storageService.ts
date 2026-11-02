import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackroomsItem, LastReadSession, ReaderSettings, WikiListItem } from '../types/wikidot';

export const KEYS = {
  FAVORITES: '@backrooms_favorites_v1',
  CACHED_ITEMS: '@backrooms_cached_items_v5',
  HISTORY: '@backrooms_history_v1',
  LEVEL_INDEX: '@backrooms_level_index_v3',
  ENTITY_INDEX: '@backrooms_entity_index_v3',
  LANGUAGE: '@backrooms_language_v1',
  LAST_READ: '@backrooms_last_read_v1',
  READ_ITEMS: '@backrooms_read_items_v1',
  READER_SETTINGS: '@backrooms_reader_settings_v1',
};

const DEFAULT_READER_SETTINGS: ReaderSettings = {
  theme: 'meg',
  fontSize: 'normal',
};

export class StorageService {
  static readonly KEYS = KEYS;
  private static readonly mutationQueues = new Map<string, Promise<void>>();

  private static async serializeMutation<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.mutationQueues.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => { release = resolve; });
    const tail = previous.catch(() => {}).then(() => current);
    this.mutationQueues.set(key, tail);
    try {
      await previous;
    } catch {
      // previous mutation error should not block current operation
    }
    try {
      return await operation();
    } finally {
      release();
      if (this.mutationQueues.get(key) === tail) this.mutationQueues.delete(key);
    }
  }

  private static sanitizeId(id: string): string {
    if (!id) return '';
    return id
      .replace(/^[\/\\]+/, '')
      .replace(/[-_](?:es|en)?[-_]?v5_canonical.*$/i, '')
      .replace(/[\/\\]+$/, '');
  }

  private static sanitizePath(path?: string, fallbackId?: string): string {
    const raw = path || (fallbackId ? `/${fallbackId}` : '');
    if (!raw) return '';
    const cleaned = raw
      .replace(/[-_](?:es|en)?[-_]?v5_canonical.*$/i, '')
      .replace(/[\/\\]+$/, '');
    return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
  }
  // --- Language ---
  static async getLanguage(): Promise<'es' | 'en'> {
    try {
      const lang = await AsyncStorage.getItem(KEYS.LANGUAGE);
      return (lang === 'en' || lang === 'es') ? lang : 'es';
    } catch {
      return 'es';
    }
  }

  static async setLanguage(lang: 'es' | 'en'): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LANGUAGE, lang);
    } catch (err) {
      console.warn('Could not save language:', err);
    }
  }

  // --- Last Read Session (Resume Reading & Scroll Memory) ---
  static async getLastReadSession(): Promise<LastReadSession | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LAST_READ);
      if (!data) return null;
      const session: LastReadSession = JSON.parse(data);
      const cleanId = this.sanitizeId(session.id);
      const cleanPath = this.sanitizePath(session.path, cleanId);

      if (session.id !== cleanId || session.path !== cleanPath) {
        session.id = cleanId;
        session.path = cleanPath;
        await AsyncStorage.setItem(KEYS.LAST_READ, JSON.stringify(session));
      }
      return session;
    } catch {
      return null;
    }
  }

  static async saveLastReadSession(session: LastReadSession): Promise<void> {
    try {
      const cleanId = this.sanitizeId(session.id);
      const cleanPath = this.sanitizePath(session.path, cleanId);
      const sanitizedSession: LastReadSession = {
        ...session,
        id: cleanId,
        path: cleanPath,
      };
      await AsyncStorage.setItem(KEYS.LAST_READ, JSON.stringify(sanitizedSession));
    } catch (err) {
      console.warn('Could not save last read session:', err);
    }
  }

  // --- Reading History & Read Status ---
  static async getReadIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.READ_ITEMS);
      if (!data) return [];
      const reads: string[] = JSON.parse(data);
      let mutated = false;
      const sanitized = Array.from(
        new Set(
          reads
            .map(r => {
              const clean = this.sanitizeId(r);
              if (clean !== r) mutated = true;
              return clean;
            })
            .filter(Boolean)
        )
      );
      if (mutated) {
        await AsyncStorage.setItem(KEYS.READ_ITEMS, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch {
      return [];
    }
  }

  static async getHistoryIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.HISTORY);
      if (!data) return [];
      const history: string[] = JSON.parse(data);
      return Array.from(new Set(history.map(id => this.sanitizeId(id)).filter(Boolean)));
    } catch {
      return [];
    }
  }

  static async recordHistory(id: string): Promise<void> {
    return this.serializeMutation(KEYS.HISTORY, async () => {
      try {
        const cleanId = this.sanitizeId(id);
        if (!cleanId) return;
        const history = await this.getHistoryIds();
        const updated = [cleanId, ...history.filter(entry => entry !== cleanId)].slice(0, 200);
        await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not record reading history:', err);
      }
    });
  }

  static async clearHistory(): Promise<void> {
    return this.serializeMutation(KEYS.HISTORY, async () => {
      try {
        await AsyncStorage.removeItem(KEYS.HISTORY);
      } catch (err) {
        console.warn('Could not clear reading history:', err);
      }
    });
  }

  static async isRead(id: string): Promise<boolean> {
    try {
      const cleanId = this.sanitizeId(id);
      const reads = await this.getReadIds();
      return reads.includes(cleanId);
    } catch {
      return false;
    }
  }

  static async markAsRead(id: string): Promise<void> {
    return this.serializeMutation(KEYS.READ_ITEMS, async () => {
      try {
        const cleanId = this.sanitizeId(id);
        const reads = await this.getReadIds();
        if (!reads.includes(cleanId)) {
          reads.push(cleanId);
          await AsyncStorage.setItem(KEYS.READ_ITEMS, JSON.stringify(reads));
        }
      } catch (err) {
        console.warn('Could not mark as read:', err);
      }
    });
  }

  static async unmarkAsRead(id: string): Promise<void> {
    return this.serializeMutation(KEYS.READ_ITEMS, async () => {
      try {
        const cleanId = this.sanitizeId(id);
        let reads = await this.getReadIds();
        reads = reads.filter(r => r !== cleanId);
        await AsyncStorage.setItem(KEYS.READ_ITEMS, JSON.stringify(reads));
      } catch (err) {
        console.warn('Could not unmark as read:', err);
      }
    });
  }

  static async toggleRead(id: string): Promise<boolean> {
    return this.serializeMutation(KEYS.READ_ITEMS, async () => {
      try {
        const cleanId = this.sanitizeId(id);
        const reads = await this.getReadIds();
        const exists = reads.includes(cleanId);
        const updated = exists ? reads.filter(r => r !== cleanId) : [...reads, cleanId];
        await AsyncStorage.setItem(KEYS.READ_ITEMS, JSON.stringify(updated));
        return !exists;
      } catch (err) {
        console.warn('Could not toggle read status:', err);
        return false;
      }
    });
  }

  // --- Reader Settings (Kindle customization) ---
  static async getReaderSettings(): Promise<ReaderSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.READER_SETTINGS);
      return data ? { ...DEFAULT_READER_SETTINGS, ...JSON.parse(data) } : DEFAULT_READER_SETTINGS;
    } catch {
      return DEFAULT_READER_SETTINGS;
    }
  }

  static async saveReaderSettings(settings: ReaderSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.READER_SETTINGS, JSON.stringify(settings));
    } catch (err) {
      console.warn('Could not save reader settings:', err);
    }
  }

  // --- Favorites ---
  static async getFavorites(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FAVORITES);
      if (!data) return [];
      const favs: string[] = JSON.parse(data);
      let mutated = false;
      const sanitized = Array.from(
        new Set(
          favs
            .map(f => {
              const clean = this.sanitizeId(f);
              if (clean !== f) mutated = true;
              return clean;
            })
            .filter(Boolean)
        )
      );
      if (mutated) {
        await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch {
      return [];
    }
  }

  static async isFavorite(id: string): Promise<boolean> {
    const cleanId = this.sanitizeId(id);
    const favs = await this.getFavorites();
    return favs.includes(cleanId);
  }

  static async toggleFavorite(id: string): Promise<boolean> {
    return this.serializeMutation(KEYS.FAVORITES, async () => {
      try {
      const cleanId = this.sanitizeId(id);
      const favs = await this.getFavorites();
      let updated: string[];
      let isNowFav = false;

      if (favs.includes(cleanId)) {
        updated = favs.filter(f => f !== cleanId);
      } else {
        updated = [...favs, cleanId];
        isNowFav = true;
      }

      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
      return isNowFav;
      } catch {
        return false;
      }
    });
  }

  // --- Item Dossier Cache (Full offline storage with decoupled cache keys) ---
  static buildItemCacheKey(cleanId: string, lang: 'es' | 'en' = 'es'): string {
    const sanitizedId = this.sanitizeId(cleanId);
    return `${KEYS.CACHED_ITEMS}_${sanitizedId}_${lang}`;
  }

  static async getCachedItem(id: string, lang: 'es' | 'en' = 'es'): Promise<BackroomsItem | null> {
    try {
      const cleanId = this.sanitizeId(id);
      const primaryKey = this.buildItemCacheKey(cleanId, lang);
      let data = await AsyncStorage.getItem(primaryKey);

      if (!data) {
        // Fallback to legacy keys if present
        const legacyCandidates = [
          `${KEYS.CACHED_ITEMS}_${cleanId}_${lang}_v5_canonical`,
          `${KEYS.CACHED_ITEMS}_${cleanId}_v5_canonical`,
          `${KEYS.CACHED_ITEMS}_${id}`,
          `${KEYS.CACHED_ITEMS}_${cleanId}`,
        ];
        for (const candidate of legacyCandidates) {
          data = await AsyncStorage.getItem(candidate);
          if (data) break;
        }
        if (data) {
          // Auto-heal legacy cache entry into the decoupled primary key
          try {
            const parsed = JSON.parse(data);
            const healedItem: BackroomsItem = {
              ...parsed,
              id: cleanId,
              path: this.sanitizePath(parsed.path, cleanId),
              lang: lang || parsed.lang || 'es',
            };
            await AsyncStorage.setItem(primaryKey, JSON.stringify(healedItem));
          } catch {
            // Ignore parse/heal error
          }
        }
      }

      if (!data) return null;
      const item: BackroomsItem = JSON.parse(data);
      item.id = cleanId;
      item.path = `/${cleanId}`;
      return item;
    } catch {
      return null;
    }
  }

  static async saveItemToCache(item: BackroomsItem, lang: 'es' | 'en' = 'es'): Promise<void> {
    try {
      const cleanId = this.sanitizeId(item.id);
      const cleanPath = this.sanitizePath(item.path, cleanId);
      const targetLang = lang || (item.lang === 'en' ? 'en' : 'es');
      const key = this.buildItemCacheKey(cleanId, targetLang);
      const sanitizedItem: BackroomsItem = {
        ...item,
        id: cleanId,
        path: cleanPath,
        lang: targetLang,
        cachedAt: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(sanitizedItem));
    } catch (err) {
      console.warn('Could not cache item:', err);
    }
  }

  static async getCacheStats(): Promise<{ cachedArticlesCount: number; approxBytes: number }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const articleKeys = allKeys.filter(k => k.startsWith(KEYS.CACHED_ITEMS));
      let approxBytes = 0;
      if (articleKeys.length > 0) {
        const pairs = await AsyncStorage.multiGet(articleKeys);
        for (const [, val] of pairs) {
          if (val) approxBytes += val.length * 2;
        }
      }
      return { cachedArticlesCount: articleKeys.length, approxBytes };
    } catch {
      return { cachedArticlesCount: 0, approxBytes: 0 };
    }
  }

  static async clearArticleCache(preserveFavorites = true): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const articleKeys = allKeys.filter(k => k.startsWith(KEYS.CACHED_ITEMS));
      if (articleKeys.length === 0) return 0;

      let keysToRemove = articleKeys;
      if (preserveFavorites) {
        const favorites = await this.getFavorites();
        const favSet = new Set(favorites.map(f => this.sanitizeId(f)));
        keysToRemove = articleKeys.filter(k => {
          for (const fav of favSet) {
            if (k.includes(`_${fav}_`) || k.endsWith(`_${fav}`)) return false;
          }
          return true;
        });
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      return keysToRemove.length;
    } catch (err) {
      console.warn('Could not clear article cache:', err);
      return 0;
    }
  }

  // --- Index Cache (Levels, Entities & Library categories) ---
  static async getCachedIndex(type: string, lang: 'es' | 'en' = 'es'): Promise<WikiListItem[] | null> {
    try {
      let key: string;
      if (type === 'levels') {
        key = `${KEYS.LEVEL_INDEX}_${lang}`;
      } else if (type === 'entities') {
        key = `${KEYS.ENTITY_INDEX}_${lang}`;
      } else {
        key = `@backrooms_library_${type}_v5_${lang}`;
      }
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;

      const parsed: WikiListItem[] = JSON.parse(data);
      // Defensive filter: remove any navigational or rewrite-policy junk links that may have been cached previously
      return parsed.filter(item => {
        if (!item || !item.id?.trim() || !item.path?.trim() || !item.title?.trim()) return false;
        const p = item.path ? item.path.toLowerCase() : '';
        const t = item.title ? item.title.toLowerCase().trim() : '';
        if (
          p.includes('members-only') ||
          p.includes('rewrite-policy') ||
          p.includes('random:') ||
          p.includes(':random-') ||
          p.includes('trimmed:') ||
          p.includes('archived:') ||
          t === 'here' ||
          t === 'aquí' ||
          t === 'click here' ||
          t.includes('random') ||
          t.includes('aleatorio')
        ) {
          return false;
        }
        return true;
      });
    } catch {
      return null;
    }
  }

  static async saveIndexToCache(type: string, list: WikiListItem[], lang: 'es' | 'en' = 'es'): Promise<void> {
    try {
      let key: string;
      if (type === 'levels') {
        key = `${KEYS.LEVEL_INDEX}_${lang}`;
      } else if (type === 'entities') {
        key = `${KEYS.ENTITY_INDEX}_${lang}`;
      } else {
        key = `@backrooms_library_${type}_v5_${lang}`;
      }
      const usableList = list.filter(item => item.id?.trim() && item.path?.trim() && item.title?.trim());
      await AsyncStorage.setItem(key, JSON.stringify(usableList));
    } catch (err) {
      console.warn('Could not cache index:', err);
    }
  }
}
