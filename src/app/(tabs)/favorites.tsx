import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { StorageService } from '../../services/storageService';
import { DossierView } from '../../components/DossierView';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { THEME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { WikiListItem } from '../../types/wikidot';
import { CANON_SPANISH_TITLES, LIBRARY_CATEGORIES, inferItemCategory } from '../../services/wikidotService';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState } from '../../components/ScreenStates';
import { SearchBar } from '../../components/SearchBar';
import { SyncModal } from '../../components/SyncModal';

type TabView = 'saved' | 'history';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isSplitView, masterWidth } = useResponsiveLayout();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<TabView>('saved');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [itemMap, setItemMap] = useState<Map<string, WikiListItem>>(new Map());
  const [search, setSearch] = useState('');
  const [cacheStats, setCacheStats] = useState<{ cachedArticlesCount: number; approxBytes: number } | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const libraryPromises = LIBRARY_CATEGORIES.map(cat => StorageService.getCachedIndex(cat.key, language));
      const [favs, reads, stats, levels, entities, ...libraryLists] = await Promise.all([
        StorageService.getFavorites(),
        StorageService.getHistoryIds(),
        StorageService.getCacheStats(),
        StorageService.getCachedIndex('levels', language),
        StorageService.getCachedIndex('entities', language),
        ...libraryPromises,
      ]);

      setFavorites(favs);
      setHistoryIds(reads);
      setCacheStats(stats);

      const map = new Map<string, WikiListItem>();
      if (levels) levels.forEach(l => map.set(l.id, l));
      if (entities) entities.forEach(e => map.set(e.id, e));
      libraryLists.forEach(list => {
        if (list) {
          list.forEach(item => map.set(item.id, item));
        }
      });
      setItemMap(map);

      const list = activeTab === 'saved' ? favs : reads;
      if (list.length > 0) {
        setSelectedId(prev => prev || list[0]);
      }
    } catch (err) {
      console.warn('Error loading favorites and history:', err);
    }
  }, [activeTab, language]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleOpenItem = (id: string) => {
    setSelectedId(id);
    if (!isSplitView) {
      const itemInfo = itemMap.get(id);
      const inferredCat = inferItemCategory(id, itemInfo?.path, itemInfo?.category);
      router.push(`/dossier/${id}?category=${inferredCat}`);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      language === 'es' ? '¿Purgar historial de lecturas?' : 'Clear reading history?',
      language === 'es'
        ? 'Se eliminarán todos los registros de expedientes leídos. Tus favoritos guardados se conservarán intactos.'
        : 'All recent reading history entries will be removed. Your saved favorites will remain intact.',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Purgar' : 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearHistory();
            await loadData();
          },
        },
      ]
    );
  };

  const handlePurgeCache = () => {
    Alert.alert(
      language === 'es' ? '¿Liberar caché de lectura?' : 'Purge reading cache?',
      language === 'es'
        ? 'Se liberará el espacio de almacenamiento de expedientes visitados conservando tus favoritos offline.'
        : 'Storage used by visited dossiers will be freed, keeping your saved favorites intact.',
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Liberar' : 'Purge',
          onPress: async () => {
            await StorageService.clearArticleCache(true);
            await loadData();
          },
        },
      ]
    );
  };

  const displayedList = activeTab === 'saved' ? favorites : historyIds;

  const filteredList = useMemo(() => {
    if (!search.trim()) return displayedList;
    const q = search.toLowerCase().trim();
    return displayedList.filter(id => {
      const info = itemMap.get(id);
      const title = info?.title?.toLowerCase() || '';
      const subTitle = info?.subTitle?.toLowerCase() || '';
      return id.toLowerCase().includes(q) || title.includes(q) || subTitle.includes(q);
    });
  }, [displayedList, search, itemMap]);

  return (
    <View style={styles.container}>
      <View style={[styles.masterCol, isSplitView && { width: masterWidth, borderRightWidth: 1 }]}>
        {/* Tab Toggle: Saved vs Reading History */}
        <View style={styles.tabToggleRow}>
          <Pressable
            style={[styles.toggleBtn, activeTab === 'saved' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons
              name="bookmark"
              size={14}
              color={activeTab === 'saved' ? THEME.colors.accentAmber : THEME.colors.textMuted}
            />
            <Text style={[styles.toggleBtnText, activeTab === 'saved' && styles.toggleBtnTextActive]}>
              {language === 'es' ? `GUARDADOS (${favorites.length})` : `SAVED (${favorites.length})`}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggleBtn, activeTab === 'history' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('history')}
          >
            <Ionicons
              name="time"
              size={14}
              color={activeTab === 'history' ? THEME.colors.accentGreen : THEME.colors.textMuted}
            />
            <Text style={[styles.toggleBtnText, activeTab === 'history' && styles.toggleBtnTextActive]}>
              {language === 'es' ? `HISTORIAL (${historyIds.length})` : `HISTORY (${historyIds.length})`}
            </Text>
          </Pressable>
        </View>

        {/* Search Bar for Favorites and History */}
        <View style={styles.searchRow}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={
              activeTab === 'saved'
                ? (language === 'es' ? 'Buscar en guardados...' : 'Search saved...')
                : (language === 'es' ? 'Buscar en historial...' : 'Search history...')
            }
          />
        </View>

        <View style={styles.statusBar}>
          <Text style={styles.countText}>
            {activeTab === 'saved'
              ? (language === 'es' ? `${filteredList.length} GUARDADOS` : `${filteredList.length} SAVED`)
              : (language === 'es' ? `${filteredList.length} EN HISTORIAL` : `${filteredList.length} IN HISTORY`)}
          </Text>

          <View style={styles.statusBarActions}>
            {/* Clear History Button */}
            {activeTab === 'history' && historyIds.length > 0 && (
              <Pressable
                onPress={handleClearHistory}
                style={styles.actionPillBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Purgar historial"
              >
                <Ionicons name="trash-outline" size={13} color="#ef4444" />
                <Text style={styles.actionPillTextDanger}>
                  {language === 'es' ? 'PURGAR' : 'CLEAR'}
                </Text>
              </Pressable>
            )}

            {/* Cache Storage Clean Button */}
            {cacheStats && cacheStats.cachedArticlesCount > 0 && (
              <Pressable
                onPress={handlePurgeCache}
                style={styles.actionPillBtn}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Liberar espacio de caché"
              >
                <Ionicons name="hardware-chip-outline" size={13} color={THEME.colors.accentAmber} />
                <Text style={styles.actionPillTextAmber}>
                  {`~${(cacheStats.approxBytes / (1024 * 1024)).toFixed(1)} MB`}
                </Text>
              </Pressable>
            )}

            {/* Offline Sync Trigger Button */}
            <Pressable
              onPress={() => setShowSyncModal(true)}
              style={[styles.actionPillBtn, styles.actionPillBtnPrimary]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Descarga offline táctica"
            >
              <Ionicons name="cloud-download-outline" size={13} color="#000" />
              <Text style={styles.actionPillTextPrimary}>
                {language === 'es' ? 'OFFLINE SYNC' : 'OFFLINE SYNC'}
              </Text>
            </Pressable>

            <Pressable onPress={loadData} style={styles.syncBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="refresh" size={14} color={THEME.colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {filteredList.length === 0 ? (
          <EmptyState
            icon={search ? 'search-outline' : (activeTab === 'saved' ? 'bookmark-outline' : 'time-outline')}
            title={
              search
                ? (language === 'es' ? 'No se encontraron expedientes' : 'No matching dossiers')
                : (activeTab === 'saved'
                  ? (language === 'es' ? 'Aún no guardaste expedientes' : 'No saved dossiers yet')
                  : (language === 'es' ? 'Tu historial está vacío' : 'Your history is empty'))
            }
            description={
              search
                ? (language === 'es' ? 'Prueba buscando por otro término, número o código.' : 'Try searching by another title or code.')
                : (activeTab === 'saved'
                  ? (language === 'es'
                    ? 'Guarda expedientes con la estrella para tenerlos a mano sin conexión.'
                    : 'Star dossiers to keep them handy for offline reading.')
                  : (language === 'es'
                    ? 'Los expedientes que abras aparecerán aquí, con la visita más reciente primero.'
                    : 'Dossiers you open appear here, with the most recent visit first.'))
            }
            tint={activeTab === 'saved' ? THEME.colors.accentAmber : THEME.colors.accentGreen}
          />
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const info = itemMap.get(item);
              const inferredCat = inferItemCategory(item, info?.path, info?.category);
              let title = info ? info.title : undefined;
              if (!title) {
                if (inferredCat === 'entity') {
                  const number = item.match(/^(?:entity|entidad)-?(\d+)$/i)?.[1];
                  title = number ? `Entidad ${number}` : (language === 'es' ? 'Entidad archivada' : item);
                } else if (inferredCat === 'level') {
                  const number = item.match(/^(?:level|nivel)-?(\d+)$/i)?.[1];
                  title = number ? `Nivel ${number}` : (language === 'es' ? 'Nivel archivado' : item);
                } else if (inferredCat === 'object') {
                  title = language === 'es' ? 'Objeto archivado' : item;
                } else if (inferredCat === 'phenomenon') {
                  title = language === 'es' ? 'Fenómeno archivado' : item;
                } else if (inferredCat === 'tale') {
                  title = language === 'es' ? 'Relato archivado' : item;
                } else if (inferredCat === 'group') {
                  title = language === 'es' ? 'Grupo archivado' : item;
                } else if (inferredCat === 'poi') {
                  title = language === 'es' ? 'Punto de interés archivado' : item;
                } else if (inferredCat === 'canon') {
                  title = CANON_SPANISH_TITLES[`/${item}`] || 'Canon archivado';
                } else {
                  title = language === 'es' ? 'Expediente archivado' : item.replace(/-/g, ' ');
                }
              }

              const rawSub = info?.subTitle ? info.subTitle.replace(/^["'«»“”„\s\-–—]+|["'«»“”„\s\-–—]+$/g, '').trim() : '';

              let badgePrefix = 'EXP';
              if (inferredCat === 'entity') badgePrefix = 'ENT';
              else if (inferredCat === 'level') badgePrefix = 'LVL';
              else if (inferredCat === 'object') badgePrefix = 'OBJ';
              else if (inferredCat === 'phenomenon') badgePrefix = 'FEN';
              else if (inferredCat === 'tale') badgePrefix = 'REL';
              else if (inferredCat === 'group') badgePrefix = 'GRP';
              else if (inferredCat === 'poi') badgePrefix = 'PDI';
              else if (inferredCat === 'canon') badgePrefix = 'CANON';
              else if (inferredCat === 'joke') badgePrefix = 'BROMA';
              else if (inferredCat === 'subcluster') badgePrefix = 'SERIE';

              const rawNum = info?.numberStr || item.replace(/^(?:level|nivel|entity|entidad|object|objeto|phenomenon|fenomeno)-/i, '');
              const badgeCode = `${badgePrefix}-${rawNum}`;

              return (
                <Pressable
                  style={[
                    styles.favCard,
                    isSplitView && selectedId === item && styles.favCardSelected,
                  ]}
                  onPress={() => handleOpenItem(item)}
                >
                  <View
                    style={[
                      styles.favStripe,
                      { backgroundColor: activeTab === 'saved' ? THEME.colors.accentAmber : THEME.colors.accentGreen },
                    ]}
                  />

                  <View style={styles.favCardContent}>
                    <View style={styles.favHeaderRow}>
                      <View style={styles.favBadge}>
                        <Text style={styles.favBadgeText}>{badgeCode}</Text>
                      </View>
                      <Text
                        style={[
                          styles.favStatusText,
                          { color: activeTab === 'saved' ? THEME.colors.accentAmber : THEME.colors.accentGreen },
                        ]}
                      >
                        {activeTab === 'saved'
                          ? (language === 'es' ? 'GUARDADO EN CACHÉ' : 'CACHED ON DEVICE')
                          : (language === 'es' ? 'EXPEDIENTE LEÍDO' : 'DOSSIER READ')}
                      </Text>
                    </View>

                    <Text style={styles.favTitle} numberOfLines={1}>
                      {title}
                    </Text>

                    {rawSub ? (
                      <Text style={styles.favSub} numberOfLines={1}>
                        "{rawSub}"
                      </Text>
                    ) : null}
                  </View>

                  <Ionicons name="chevron-forward" size={16} color={THEME.colors.textMuted} />
                </Pressable>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {isSplitView && (
        <View style={styles.detailCol}>
          {selectedId ? (
            <DossierView
              path={`/${selectedId}`}
              category={selectedId ? inferItemCategory(selectedId, itemMap.get(selectedId)?.path, itemMap.get(selectedId)?.category) : 'level'}
            />
          ) : (
            <View style={styles.selectPrompt}>
              <Text style={styles.selectPromptText}>
                {language === 'es' ? 'SELECCIONA UN EXPEDIENTE PARA ABRIR' : 'SELECT A DOSSIER TO OPEN'}
              </Text>
            </View>
          )}
        </View>
      )}

      <SyncModal
        visible={showSyncModal}
        onClose={() => {
          setShowSyncModal(false);
          loadData();
        }}
        lang={language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: THEME.colors.background,
  },
  masterCol: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    borderRightColor: THEME.colors.surfaceBorder,
  },
  detailCol: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  tabToggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: THEME.touch.min,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    gap: 6,
  },
  toggleBtnActive: {
    borderColor: THEME.colors.accentAmber,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  toggleBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  toggleBtnTextActive: {
    color: THEME.colors.textPrimary,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    marginTop: 6,
  },
  searchRow: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  statusBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  actionPillTextDanger: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ef4444',
    letterSpacing: 0.5,
  },
  actionPillTextAmber: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    fontWeight: '800',
    color: THEME.colors.accentAmber,
    letterSpacing: 0.5,
  },
  actionPillBtnPrimary: {
    backgroundColor: THEME.colors.accentAmber,
    borderColor: THEME.colors.accentAmber,
  },
  actionPillTextPrimary: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.5,
  },
  countText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.accentGreen,
    letterSpacing: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  syncBtn: {
    padding: 2,
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  favCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingLeft: 16,
    marginVertical: 4,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  favStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  favCardSelected: {
    borderColor: THEME.colors.accentAmber,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  favCardContent: {
    flex: 1,
    paddingRight: 8,
  },
  favHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  favBadge: {
    backgroundColor: '#0c0f17',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  favBadgeText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  favStatusText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  favTitle: {
    fontFamily: THEME.fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  favSub: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontStyle: 'italic',
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    marginTop: 14,
    letterSpacing: 1,
  },
  emptySub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  selectPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPromptText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
});
