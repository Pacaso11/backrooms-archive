import { SyncPackageType, SyncProgress, SyncStatus, WikiListItem, ItemCategory } from '../types/wikidot';
import { StorageService } from './storageService';
import { WikidotService, LIBRARY_CATEGORIES } from './wikidotService';

export type SyncListener = (progress: SyncProgress) => void;

interface SyncQueueItem {
  id: string;
  path: string;
  category: ItemCategory;
  title: string;
}

export class SyncService {
  private static status: SyncStatus = 'idle';
  private static currentPackage: SyncPackageType = 'essentials';
  private static total = 0;
  private static current = 0;
  private static currentTitle = '';
  private static errorsCount = 0;
  private static approxBytes = 0;
  private static abortController: AbortController | null = null;
  private static listeners = new Set<SyncListener>();
  private static isPaused = false;
  private static resumeResolve: (() => void) | null = null;

  static subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getProgress());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(message?: string): void {
    const progress = this.getProgress(message);
    for (const listener of this.listeners) {
      try {
        listener(progress);
      } catch (err) {
        console.warn('SyncListener error:', err);
      }
    }
  }

  static getProgress(message?: string): SyncProgress {
    return {
      packageType: this.currentPackage,
      status: this.status,
      total: this.total,
      current: this.current,
      currentTitle: this.currentTitle,
      errorsCount: this.errorsCount,
      approxBytes: this.approxBytes,
      message,
    };
  }

  static getStatus(): SyncStatus {
    return this.status;
  }

  static pause(): void {
    if (this.status === 'running') {
      this.isPaused = true;
      this.status = 'paused';
      this.notify('Sincronización pausada por el operador.');
    }
  }

  static resume(): void {
    if (this.status === 'paused' && this.isPaused) {
      this.isPaused = false;
      this.status = 'running';
      if (this.resumeResolve) {
        this.resumeResolve();
        this.resumeResolve = null;
      }
      this.notify('Reanudando transcripción de datos...');
    }
  }

  static cancel(): void {
    if (this.status === 'running' || this.status === 'paused') {
      this.status = 'cancelled';
      this.isPaused = false;
      if (this.resumeResolve) {
        this.resumeResolve();
        this.resumeResolve = null;
      }
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
      this.notify('Operación de sincronización cancelada.');
    }
  }

  private static async checkPauseGate(): Promise<void> {
    while (this.isPaused) {
      await new Promise<void>(resolve => {
        this.resumeResolve = resolve;
      });
    }
  }

  private static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generates the list of items to sync according to selected package
   */
  static async resolvePackageItems(packageType: SyncPackageType, lang: 'es' | 'en' = 'es'): Promise<SyncQueueItem[]> {
    const items: SyncQueueItem[] = [];

    if (packageType === 'essentials') {
      // Main 9 Levels: 0 to 8
      for (let i = 0; i <= 8; i++) {
        items.push({
          id: `level-${i}`,
          path: `/level-${i}`,
          category: 'level',
          title: `Nivel ${i}`,
        });
      }
      // Top 10 iconic entities
      for (let i = 1; i <= 10; i++) {
        items.push({
          id: `entity-${i}`,
          path: `/entity-${i}`,
          category: 'entity',
          title: `Entidad ${i}`,
        });
      }
      return items;
    }

    if (packageType === 'cluster_1') {
      // Levels 0 to 99
      for (let i = 0; i <= 99; i++) {
        items.push({
          id: `level-${i}`,
          path: `/level-${i}`,
          category: 'level',
          title: `Nivel ${i}`,
        });
      }
      return items;
    }

    if (packageType === 'favorites') {
      const favIds = await StorageService.getFavorites();
      for (const id of favIds) {
        const path = `/${id}`;
        const category = WikidotService.inferItemCategory(id, path);
        items.push({
          id,
          path,
          category,
          title: id.replace(/[-_]/g, ' ').toUpperCase(),
        });
      }
      return items;
    }

    if (packageType === 'full') {
      // 1. Fetch Levels index
      let levelList: WikiListItem[] = [];
      try {
        levelList = await WikidotService.fetchLevels(lang);
      } catch {
        const cachedLevels = await StorageService.getCachedIndex('levels', lang);
        if (cachedLevels) levelList = cachedLevels;
      }

      for (const item of levelList) {
        items.push({
          id: item.id,
          path: item.path,
          category: 'level',
          title: item.title || item.displayName,
        });
      }

      // 2. Fetch Entities index
      let entityList: WikiListItem[] = [];
      try {
        entityList = await WikidotService.fetchEntities(lang);
      } catch {
        const cachedEntities = await StorageService.getCachedIndex('entities', lang);
        if (cachedEntities) entityList = cachedEntities;
      }

      for (const item of entityList) {
        items.push({
          id: item.id,
          path: item.path,
          category: 'entity',
          title: item.title || item.displayName,
        });
      }

      // 3. Top entries from Library Categories (Objects, Tales, Canons, etc.)
      for (const cat of LIBRARY_CATEGORIES) {
        try {
          const catList = await WikidotService.fetchLibraryCategory(cat.key, lang);
          for (const item of catList.slice(0, 30)) { // 30 most prominent per category
            items.push({
              id: item.id,
              path: item.path,
              category: item.category || 'archive',
              title: item.title || item.displayName,
            });
          }
        } catch {
          // Continue if single category fails
        }
      }

      return items;
    }

    return items;
  }

  /**
   * Starts downloading the selected package with rate-limiting and incremental cache skipping
   */
  static async startSync(
    packageType: SyncPackageType,
    lang: 'es' | 'en' = 'es',
    forceRefresh = false
  ): Promise<boolean> {
    if (this.status === 'running') {
      return false;
    }

    this.currentPackage = packageType;
    this.status = 'running';
    this.isPaused = false;
    this.errorsCount = 0;
    this.current = 0;
    this.total = 0;
    this.currentTitle = 'Calculando manifiesto de descarga...';
    this.abortController = new AbortController();

    this.notify('Preparando lista de expedientes...');

    let targetItems: SyncQueueItem[] = [];
    try {
      targetItems = await this.resolvePackageItems(packageType, lang);
    } catch (err) {
      console.warn('Could not resolve package items:', err);
      this.status = 'error';
      this.notify('Error al preparar los expedientes para descarga.');
      return false;
    }

    if (targetItems.length === 0) {
      this.status = 'completed';
      this.notify('No hay expedientes que descargar para este paquete.');
      return true;
    }

    this.total = targetItems.length;
    this.notify(`Iniciando transcripción de ${this.total} expedientes...`);

    // Worker queue with concurrency = 2 and polite 250ms gap
    const concurrency = 2;
    let itemIndex = 0;

    const worker = async (): Promise<void> => {
      while (itemIndex < targetItems.length) {
        if (this.abortController?.signal.aborted || (this.status as SyncStatus) === 'cancelled') {
          return;
        }

        await this.checkPauseGate();

        const currentIndex = itemIndex++;
        const target = targetItems[currentIndex];
        if (!target) return;

        this.currentTitle = target.title;
        this.notify();

        // Incremental check: if already cached and not forceRefresh, skip download
        if (!forceRefresh) {
          const cached = await StorageService.getCachedItem(target.id, lang);
          if (cached && cached.description) {
            this.current++;
            this.notify(`[Caché] ${target.title}`);
            continue;
          }
        }

        // Polite rate limit sleep
        await this.sleep(250);

        try {
          const fetched = await WikidotService.fetchItemDetails(
            target.path,
            target.category,
            lang,
            this.abortController?.signal
          );

          if (fetched) {
            await StorageService.saveItemToCache(fetched, lang);
            this.approxBytes += JSON.stringify(fetched).length * 2;
          }
        } catch (fetchErr: any) {
          if (this.abortController?.signal.aborted) return;
          console.warn(`Sync failed for ${target.id}:`, fetchErr?.message || fetchErr);
          this.errorsCount++;
        } finally {
          this.current++;
          this.notify();
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    if ((this.status as SyncStatus) === 'cancelled') {
      return false;
    }

    this.status = 'completed';
    this.currentTitle = 'Descarga completada con éxito.';
    this.notify('Todos los expedientes seleccionados están disponibles offline.');
    return true;
  }
}
