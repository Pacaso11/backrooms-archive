import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackroomsItem, LastReadSession, ReaderSettings, WikiListItem } from '../types/wikidot';

const KEYS = {
  FAVORITES: '@backrooms_favorites_v1',
  CACHED_ITEMS: '@backrooms_cached_items_v5',
  HISTORY: '@backrooms_history_v1',
  LEVEL_INDEX: '@backrooms_level_index_v1',
  ENTITY_INDEX: '@backrooms_entity_index_v1',
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
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async saveLastReadSession(session: LastReadSession): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_READ, JSON.stringify(session));
    } catch (err) {
      console.warn('Could not save last read session:', err);
    }
  }

  // --- Reading History & Read Status ---
  static async getReadIds(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.READ_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async isRead(id: string): Promise<boolean> {
    try {
      const reads = await this.getReadIds();
      return reads.includes(id);
    } catch {
      return false;
    }
  }

  static async markAsRead(id: string): Promise<void> {
    try {
      const reads = await this.getReadIds();
      if (!reads.includes(id)) {
        reads.push(id);
        await AsyncStorage.setItem(KEYS.READ_ITEMS, JSON.stringify(reads));
      }
    } catch (err) {
      console.warn('Could not mark as read:', err);
    }
  }

  static async unmarkAsRead(id: string): Promise<void> {
    try {
      let reads = await this.getReadIds();
      reads = reads.filter(r => r !== id);
      await AsyncStorage.setItem(KEYS.READ_ITEMS, JSON.stringify(reads));
    } catch (err) {
      console.warn('Could not unmark as read:', err);
    }
  }

  static async toggleRead(id: string): Promise<boolean> {
    try {
      const reads = await this.getReadIds();
      const exists = reads.includes(id);
      let updated: string[];
      if (exists) {
        updated = reads.filter(r => r !== id);
      } else {
        updated = [...reads, id];
      }
      await AsyncStorage.setItem(KEYS.READ_ITEMS, JSON.stringify(updated));
      return !exists;
    } catch (err) {
      console.warn('Could not toggle read status:', err);
      return false;
    }
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
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async isFavorite(id: string): Promise<boolean> {
    const favs = await this.getFavorites();
    return favs.includes(id);
  }

  static async toggleFavorite(id: string): Promise<boolean> {
    try {
      const favs = await this.getFavorites();
      let updated: string[];
      let isNowFav = false;

      if (favs.includes(id)) {
        updated = favs.filter(f => f !== id);
      } else {
        updated = [...favs, id];
        isNowFav = true;
      }

      await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
      return isNowFav;
    } catch {
      return false;
    }
  }

  // --- Item Dossier Cache (Full offline storage) ---
  static async getCachedItem(id: string): Promise<BackroomsItem | null> {
    try {
      const key = `${KEYS.CACHED_ITEMS}_${id}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async saveItemToCache(item: BackroomsItem): Promise<void> {
    try {
      const key = `${KEYS.CACHED_ITEMS}_${item.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(item));
    } catch (err) {
      console.warn('Could not cache item:', err);
    }
  }

  // --- Index Cache (Levels, Entities & Library categories) ---
  static async getCachedIndex(type: string): Promise<WikiListItem[] | null> {
    try {
      let key: string;
      if (type === 'levels') {
        key = KEYS.LEVEL_INDEX;
      } else if (type === 'entities') {
        key = KEYS.ENTITY_INDEX;
      } else {
        key = `@backrooms_library_${type}_v2`;
      }
      const data = await AsyncStorage.getItem(key);
      if (!data) return null;

      const parsed: WikiListItem[] = JSON.parse(data);
      // Defensive filter: remove any navigational or rewrite-policy junk links that may have been cached previously
      return parsed.filter(item => {
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

  static async saveIndexToCache(type: string, list: WikiListItem[]): Promise<void> {
    try {
      let key: string;
      if (type === 'levels') {
        key = KEYS.LEVEL_INDEX;
      } else if (type === 'entities') {
        key = KEYS.ENTITY_INDEX;
      } else {
        key = `@backrooms_library_${type}_v2`;
      }
      await AsyncStorage.setItem(key, JSON.stringify(list));
    } catch (err) {
      console.warn('Could not cache index:', err);
    }
  }
}
