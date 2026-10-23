import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { StorageService } from '../../services/storageService';
import { DossierView } from '../../components/DossierView';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { THEME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { WikiListItem } from '../../types/wikidot';

type TabView = 'saved' | 'history';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isSplitView, masterWidth } = useResponsiveLayout();

  const [activeTab, setActiveTab] = useState<TabView>('saved');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [historyIds, setHistoryIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [itemMap, setItemMap] = useState<Map<string, WikiListItem>>(new Map());

  const loadData = async () => {
    const [favs, reads, levels, entities] = await Promise.all([
      StorageService.getFavorites(),
      StorageService.getReadIds(),
      StorageService.getCachedIndex('levels'),
      StorageService.getCachedIndex('entities'),
    ]);

    setFavorites(favs);
    setHistoryIds([...reads].reverse()); // prevent mutating original array

    const map = new Map<string, WikiListItem>();
    if (levels) levels.forEach(l => map.set(l.id, l));
    if (entities) entities.forEach(e => map.set(e.id, e));
    setItemMap(map);

    const list = activeTab === 'saved' ? favs : reads;
    if (list.length > 0 && !selectedId) {
      setSelectedId(list[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleOpenItem = (id: string) => {
    setSelectedId(id);
    if (!isSplitView) {
      const isEntity = id.startsWith('entity');
      router.push(`/dossier/${id}${isEntity ? '?category=entity' : ''}`);
    }
  };

  const displayedList = activeTab === 'saved' ? favorites : historyIds;

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
              GUARDADOS ({favorites.length})
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
              HISTORIAL ({historyIds.length})
            </Text>
          </Pressable>
        </View>

        <View style={styles.statusBar}>
          <Text style={styles.countText}>
            {activeTab === 'saved'
              ? `${favorites.length} EXPEDIENTES OFFLINE`
              : `${historyIds.length} EXPEDIENTES LEÍDOS`}
          </Text>
          <Pressable onPress={loadData} style={styles.syncBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="refresh" size={14} color={THEME.colors.textMuted} />
          </Pressable>
        </View>

        {displayedList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'saved' ? 'bookmark-outline' : 'book-outline'}
              size={48}
              color={THEME.colors.surfaceBorder}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'saved' ? 'SIN EXPEDIENTES GUARDADOS' : 'HISTORIAL VACÍO'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'saved'
                ? 'Toca la estrella en cualquier nivel o entidad para descargarlo y leerlo sin conexión.'
                : 'Los niveles y entidades que vayas leyendo aparecerán registrados automáticamente aquí.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedList}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const info = itemMap.get(item);
              const isEntity = item.startsWith('entity');
              const title = info ? info.title : (isEntity ? item.replace('entity-', 'Entidad ') : item.replace('level-', 'Nivel '));
              const rawSub = info?.subTitle ? info.subTitle.replace(/^["'«»“”„\s\-–—]+|["'«»“”„\s\-–—]+$/g, '').trim() : '';
              const badgeCode = isEntity
                ? `ENT-${info?.numberStr || item.replace('entity-', '')}`
                : `LVL-${info?.numberStr || item.replace('level-', '')}`;

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
                        {activeTab === 'saved' ? 'GUARDADO OFFLINE' : 'EXPEDIENTE LEÍDO'}
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
              category={selectedId.startsWith('entity') ? 'entity' : 'level'}
            />
          ) : (
            <View style={styles.selectPrompt}>
              <Text style={styles.selectPromptText}>SELECCIONA UN EXPEDIENTE PARA ABRIR</Text>
            </View>
          )}
        </View>
      )}
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
    fontFamily: THEME.fonts.mono,
    fontSize: 13.5,
    fontWeight: '800',
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
