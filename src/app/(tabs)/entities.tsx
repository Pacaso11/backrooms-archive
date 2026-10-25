import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { WikiListItem } from '../../types/wikidot';
import { WikidotService } from '../../services/wikidotService';
import { StorageService } from '../../services/storageService';
import { EntityCard } from '../../components/EntityCard';
import { SearchBar } from '../../components/SearchBar';
import { DossierView } from '../../components/DossierView';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { THEME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function EntitiesScreen() {
  const router = useRouter();
  const { isSplitView, masterWidth } = useResponsiveLayout();
  const { language: lang, setLanguage } = useLanguage();

  const [entities, setEntities] = useState<WikiListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>('/entity-1');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  const togglePanel = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsPanelExpanded(prev => !prev);
  }, []);

  const loadEntities = useCallback(async (targetLang?: 'es' | 'en', forceRefresh = false) => {
    try {
      const currentLang = targetLang || lang;

      if (!forceRefresh) {
        const cached = await StorageService.getCachedIndex('entities');
        if (cached && cached.length > 0) {
          setEntities(cached);
          setLoading(false);
        }
      }

      const fetched = await WikidotService.fetchEntities(currentLang);
      setEntities(fetched);
      await StorageService.saveIndexToCache('entities', fetched);
    } catch (err) {
      console.warn('Could not fetch entities:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lang]);

  const loadReadState = async () => {
    const ids = await StorageService.getReadIds();
    setReadIds(new Set(ids));
  };

  useFocusEffect(
    useCallback(() => {
      loadReadState();
    }, [])
  );

  useEffect(() => {
    loadEntities(lang);
  }, [lang, loadEntities]);

  const handleLanguageChange = async (newLang: 'es' | 'en') => {
    setLoading(true);
    await setLanguage(newLang);
    await loadEntities(newLang, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEntities(lang, true);
  };

  const handleToggleReadItem = useCallback(async (itemId: string) => {
    const isNowRead = await StorageService.toggleRead(itemId);
    setReadIds(prev => {
      const next = new Set(prev);
      if (isNowRead) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  }, []);

  const handleRandomEntity = useCallback(() => {
    if (entities.length === 0) return;
    const randomIndex = Math.floor(Math.random() * entities.length);
    const chosen = entities[randomIndex];
    setSelectedPath(chosen.path);
    if (!isSplitView) {
      router.push(`/dossier/${chosen.id}?category=entity`);
    }
  }, [entities, isSplitView, router]);

  // Stats calculation
  const totalCount = entities.length;
  const readCount = useMemo(() => {
    let count = 0;
    for (const ent of entities) {
      if (readIds.has(ent.id)) count++;
    }
    return count;
  }, [entities, readIds]);
  const unreadCount = totalCount - readCount;

  const filteredEntities = useMemo(() => {
    return entities.filter(e => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          e.displayName.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          (e.subTitle && e.subTitle.toLowerCase().includes(q)) ||
          e.numberStr.toLowerCase().includes(q) ||
          e.path.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Read / Unread Status Filter
      if (readFilter === 'unread' && readIds.has(e.id)) return false;
      if (readFilter === 'read' && !readIds.has(e.id)) return false;

      return true;
    });
  }, [entities, search, readFilter, readIds]);

  const handleSelectEntity = useCallback((item: WikiListItem) => {
    setSelectedPath(item.path);
    if (!isSplitView) {
      if (isPanelExpanded) {
        if (Platform.OS === 'android') {
          UIManager.setLayoutAnimationEnabledExperimental?.(true);
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsPanelExpanded(false);
      }
      router.push(`/dossier/${item.id}?category=entity`);
    }
  }, [isSplitView, router, isPanelExpanded]);

  const renderEntityItem = useCallback(({ item }: { item: WikiListItem }) => (
    <EntityCard
      item={item}
      isSelected={isSplitView && selectedPath === item.path}
      isRead={readIds.has(item.id)}
      onPress={() => handleSelectEntity(item)}
      onToggleRead={() => handleToggleReadItem(item.id)}
    />
  ), [isSplitView, selectedPath, readIds, handleSelectEntity, handleToggleReadItem]);

  const keyExtractor = useCallback((item: WikiListItem) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={[styles.masterCol, isSplitView && { width: masterWidth, borderRightWidth: 1 }]}>
        <View style={styles.topControlRow}>
          <View style={styles.searchWrapper}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={lang === 'es' ? 'Buscar entidad (ej: Sonrientes, Sabueso, 3)...' : 'Search entities (e.g. Smiler, Hound, 3)...'}
            />
          </View>

          {/* Toggle Panel Button */}
          <Pressable
            style={[
              styles.controlIconBtn,
              isPanelExpanded && styles.controlIconBtnActive,
            ]}
            onPress={togglePanel}
            accessibilityLabel="Panel de métricas de entidades"
          >
            <Ionicons
              name={isPanelExpanded ? 'options' : 'options-outline'}
              size={18}
              color={isPanelExpanded ? THEME.colors.accentRed : THEME.colors.textMuted}
            />
          </Pressable>

          {/* Random Entity Dice Button */}
          <Pressable
            style={styles.controlIconBtn}
            onPress={handleRandomEntity}
            accessibilityLabel="Entidad Aleatoria"
          >
            <Ionicons name="dice-outline" size={18} color={THEME.colors.accentRed} />
          </Pressable>

          <LanguageToggle currentLang={lang} onToggle={handleLanguageChange} />
        </View>

        {/* Robust Full-Width Segmented Control */}
        <View style={styles.segmentedFilter}>
          <Pressable
            style={[styles.segmentTab, readFilter === 'all' && styles.segmentTabActive]}
            onPress={() => setReadFilter('all')}
          >
            <Text style={[styles.segmentTabText, readFilter === 'all' && styles.segmentTabTextActive]} numberOfLines={1}>
              {lang === 'es' ? `TODAS (${totalCount})` : `ALL (${totalCount})`}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentTab, readFilter === 'unread' && styles.segmentTabActive]}
            onPress={() => setReadFilter('unread')}
          >
            <Text style={[styles.segmentTabText, readFilter === 'unread' && styles.segmentTabTextActive]} numberOfLines={1}>
              {lang === 'es' ? `NO LEÍDAS (${unreadCount})` : `UNREAD (${unreadCount})`}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentTab, readFilter === 'read' && styles.segmentTabActive]}
            onPress={() => setReadFilter('read')}
          >
            <Text style={[styles.segmentTabText, readFilter === 'read' && styles.segmentTabTextActive]} numberOfLines={1}>
              {lang === 'es' ? `LEÍDAS (${readCount})` : `READ (${readCount})`}
            </Text>
          </Pressable>
        </View>

        {/* Collapsible Panel */}
        {isPanelExpanded && (
          <View style={styles.expandedPanel}>
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{totalCount}</Text>
                <Text style={styles.statLbl}>{lang === 'es' ? 'ENTIDADES' : 'ENTITIES'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: THEME.colors.accentGreen }]}>{readCount}</Text>
                <Text style={styles.statLbl}>{lang === 'es' ? 'LEÍDAS' : 'READ'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: '#f87171' }]}>{unreadCount}</Text>
                <Text style={styles.statLbl}>{lang === 'es' ? 'POR LEER' : 'UNREAD'}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.statusBar}>
          <Text style={styles.countText}>
            {filteredEntities.length} {lang === 'es' ? 'REGISTROS EN LISTA' : 'RECORDS LISTED'}
          </Text>

          <View style={styles.statusRightGroup}>
            <Pressable
              style={[styles.panelToggleBtn, isPanelExpanded && styles.panelToggleBtnActive]}
              onPress={togglePanel}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={isPanelExpanded ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={isPanelExpanded ? THEME.colors.accentRed : THEME.colors.textMuted}
              />
              <Text style={[styles.panelToggleBtnText, isPanelExpanded && { color: THEME.colors.accentRed }]}>
                {isPanelExpanded
                  ? (lang === 'es' ? 'MENOS' : 'LESS')
                  : (lang === 'es' ? 'MÁS' : 'MORE')}
              </Text>
            </Pressable>

            <Pressable onPress={onRefresh} style={styles.syncBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="sync" size={13} color={THEME.colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {loading && entities.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={THEME.colors.accentRed} />
            <Text style={styles.loadingText}>
              {lang === 'es' ? 'Sincronizando Bestiario de Entidades...' : 'Syncing Wikidot Bestiary...'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEntities}
            keyExtractor={keyExtractor}
            renderItem={renderEntityItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={THEME.colors.accentRed}
              />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={Platform.OS === 'android'}
          />
        )}
      </View>

      {isSplitView && (
        <View style={styles.detailCol}>
          <DossierView
            path={selectedPath}
            category="entity"
            onNavigateNoclip={(navPath, navCat) => setSelectedPath(navPath)}
          />
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
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  searchWrapper: {
    flex: 1,
  },
  controlIconBtn: {
    width: 38,
    height: 38,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIconBtnActive: {
    borderColor: THEME.colors.accentRed,
    backgroundColor: '#ef444418',
  },
  segmentedFilter: {
    flexDirection: 'row',
    backgroundColor: '#0c0f17',
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 6,
    borderRadius: THEME.radius.sm,
    padding: 2.5,
    borderWidth: 1,
    borderColor: '#1e293b',
    height: 34,
  },
  segmentTab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  segmentTabActive: {
    backgroundColor: '#1e293b',
  },
  segmentTabText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  segmentTabTextActive: {
    color: '#f8fafc',
    fontWeight: '800',
  },
  expandedPanel: {
    backgroundColor: '#0c0f17',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: THEME.radius.md,
    marginHorizontal: 12,
    marginBottom: 6,
    paddingVertical: 8,
    gap: 6,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#111622',
    marginHorizontal: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statItem: {
    alignItems: 'center',
  },
  statVal: {
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statLbl: {
    fontFamily: THEME.fonts.mono,
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#1e293b',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
  },
  countText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.accentRed,
    letterSpacing: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111622',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  panelToggleBtnActive: {
    borderColor: THEME.colors.accentRed,
    backgroundColor: '#ef444414',
  },
  panelToggleBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  syncBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 80,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    color: THEME.colors.textMuted,
    marginTop: 8,
  },
});
