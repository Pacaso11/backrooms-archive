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
import { LastReadSession, WikiListItem } from '../../types/wikidot';
import { WikidotService } from '../../services/wikidotService';
import { StorageService } from '../../services/storageService';
import { LevelCard } from '../../components/LevelCard';
import { SearchBar } from '../../components/SearchBar';
import { DossierView } from '../../components/DossierView';
import { LanguageToggle } from '../../components/LanguageToggle';
import { ResumeReadingBanner } from '../../components/ResumeReadingBanner';
import { HazardFilterBar, HazardFilter } from '../../components/HazardFilterBar';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { THEME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LevelsScreen() {
  const router = useRouter();
  const { isSplitView, masterWidth } = useResponsiveLayout();

  const [levels, setLevels] = useState<WikiListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>('/level-0');
  const [lang, setLang] = useState<'es' | 'en'>('es');

  // Reading session & history
  const [lastRead, setLastRead] = useState<LastReadSession | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Hazard Filter
  const [hazardFilter, setHazardFilter] = useState<HazardFilter>('all');
  // Read Filter (OnlySCP style: all / unread / read)
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Collapsible panel state (compact by default to maximize screen for list)
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isResumeDismissed, setIsResumeDismissed] = useState(false);

  const togglePanel = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsPanelExpanded(prev => !prev);
  }, []);

  const loadLevels = async (targetLang?: 'es' | 'en', forceRefresh = false) => {
    try {
      const currentLang = targetLang || (await StorageService.getLanguage());
      setLang(currentLang);

      if (!forceRefresh) {
        const cached = await StorageService.getCachedIndex('levels');
        if (cached && cached.length > 0) {
          setLevels(cached);
          setLoading(false);
        }
      }

      const fetched = await WikidotService.fetchLevels(currentLang);
      setLevels(fetched);
      await StorageService.saveIndexToCache('levels', fetched);
    } catch (err) {
      console.warn('Could not fetch levels:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadReadingState = async () => {
    const session = await StorageService.getLastReadSession();
    setLastRead(session);

    const ids = await StorageService.getReadIds();
    setReadIds(new Set(ids));
  };

  useFocusEffect(
    useCallback(() => {
      loadReadingState();
    }, [])
  );

  useEffect(() => {
    loadLevels();
  }, []);

  const handleLanguageChange = async (newLang: 'es' | 'en') => {
    setLang(newLang);
    await StorageService.setLanguage(newLang);
    setLoading(true);
    loadLevels(newLang, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLevels(lang, true);
  };

  // Toggle read/unread directly from card (Memoized)
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

  // Random Level Picker
  const handleRandomLevel = useCallback(() => {
    if (levels.length === 0) return;
    const randomIndex = Math.floor(Math.random() * levels.length);
    const chosen = levels[randomIndex];
    setSelectedPath(chosen.path);
    if (!isSplitView) {
      router.push(`/dossier/${chosen.id}`);
    }
  }, [levels, isSplitView, router]);

  // Stats calculation
  const totalCount = levels.length;
  const readCount = useMemo(() => {
    let count = 0;
    for (const lvl of levels) {
      if (readIds.has(lvl.id)) count++;
    }
    return count;
  }, [levels, readIds]);
  const unreadCount = totalCount - readCount;

  const filteredLevels = useMemo(() => {
    return levels.filter(l => {
      // 1. Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSearch =
          l.displayName.toLowerCase().includes(q) ||
          l.title.toLowerCase().includes(q) ||
          (l.subTitle && l.subTitle.toLowerCase().includes(q)) ||
          l.numberStr.toLowerCase().includes(q) ||
          l.path.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // 2. Hazard Filter
      if (hazardFilter !== 'all') {
        const num = parseFloat(l.numberStr);
        if (hazardFilter === '0-1') {
          if (!(num === 0 || num === 1 || l.numberStr.startsWith('0.') || l.numberStr.startsWith('1.'))) return false;
        } else if (hazardFilter === '2-3') {
          if (!(num === 2 || num === 3 || l.numberStr.startsWith('2.') || l.numberStr.startsWith('3.'))) return false;
        } else if (hazardFilter === '4-5') {
          if (!(num === 4 || num === 5 || l.numberStr.startsWith('4.') || l.numberStr.startsWith('5.') || l.path.includes('run'))) return false;
        } else if (hazardFilter === 'special') {
          if (!(isNaN(num) || num < 0 || l.path.includes('fun') || l.path.includes('end'))) return false;
        }
      }

      // 3. Read/Unread Status Filter
      if (readFilter === 'unread' && readIds.has(l.id)) return false;
      if (readFilter === 'read' && !readIds.has(l.id)) return false;

      return true;
    });
  }, [levels, search, hazardFilter, readFilter, readIds]);

  const handleSelectLevel = useCallback((item: WikiListItem) => {
    setSelectedPath(item.path);
    if (!isSplitView) {
      if (isPanelExpanded) {
        if (Platform.OS === 'android') {
          UIManager.setLayoutAnimationEnabledExperimental?.(true);
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsPanelExpanded(false);
      }
      router.push(`/dossier/${item.id}`);
    }
  }, [isSplitView, router, isPanelExpanded]);

  const handleResumeLastRead = useCallback(() => {
    if (!lastRead) return;
    setSelectedPath(lastRead.path);
    if (!isSplitView) {
      router.push(`/dossier/${lastRead.id}?category=${lastRead.category}`);
    }
  }, [lastRead, isSplitView, router]);

  const renderLevelItem = useCallback(({ item }: { item: WikiListItem }) => (
    <LevelCard
      item={item}
      isSelected={isSplitView && selectedPath === item.path}
      isRead={readIds.has(item.id)}
      onPress={() => handleSelectLevel(item)}
      onToggleRead={() => handleToggleReadItem(item.id)}
    />
  ), [isSplitView, selectedPath, readIds, handleSelectLevel, handleToggleReadItem]);

  const keyExtractor = useCallback((item: WikiListItem) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Master (List) column */}
      <View style={[styles.masterCol, isSplitView && { width: masterWidth, borderRightWidth: 1 }]}>
        {/* Top Control Bar with Search, Filter Panel Toggle, Random Dice, and Language Toggle */}
        <View style={styles.topControlRow}>
          <View style={styles.searchWrapper}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder={lang === 'es' ? 'Buscar nivel (ej: 0, 100, Umbral)...' : 'Search levels (e.g. 0, 100, Threshold)...'}
            />
          </View>

          {/* Toggle Collapsible Panel Button with Active Filter Indicator */}
          <Pressable
            style={[
              styles.controlIconBtn,
              (isPanelExpanded || hazardFilter !== 'all') && styles.controlIconBtnActive,
            ]}
            onPress={togglePanel}
            accessibilityLabel="Panel de filtros tácticos y estadísticas"
          >
            <Ionicons
              name={isPanelExpanded ? 'options' : 'options-outline'}
              size={18}
              color={(isPanelExpanded || hazardFilter !== 'all') ? THEME.colors.accentAmber : THEME.colors.textMuted}
            />
            {hazardFilter !== 'all' && <View style={styles.filterActiveDot} />}
          </Pressable>

          {/* Random Level Dice Button */}
          <Pressable
            style={styles.controlIconBtn}
            onPress={handleRandomLevel}
            accessibilityLabel="Nivel Aleatorio"
          >
            <Ionicons name="dice-outline" size={18} color={THEME.colors.accentAmber} />
          </Pressable>

          <LanguageToggle currentLang={lang} onToggle={handleLanguageChange} />
        </View>

        {/* Robust, Full-Width Perfectly Aligned Segmented Filter */}
        <View style={styles.segmentedFilter}>
          <Pressable
            style={[styles.segmentTab, readFilter === 'all' && styles.segmentTabActive]}
            onPress={() => setReadFilter('all')}
          >
            <Text style={[styles.segmentTabText, readFilter === 'all' && styles.segmentTabTextActive]} numberOfLines={1}>
              {lang === 'es' ? `TODOS (${totalCount})` : `ALL (${totalCount})`}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentTab, readFilter === 'unread' && styles.segmentTabActive]}
            onPress={() => setReadFilter('unread')}
          >
            <Text style={[styles.segmentTabText, readFilter === 'unread' && styles.segmentTabTextActive]} numberOfLines={1}>
              {lang === 'es' ? `NO LEÍDOS (${unreadCount})` : `UNREAD (${unreadCount})`}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentTab, readFilter === 'read' && styles.segmentTabActive]}
            onPress={() => setReadFilter('read')}
          >
            <Text style={[styles.segmentTabText, readFilter === 'read' && styles.segmentTabTextActive]} numberOfLines={1}>
              {lang === 'es' ? `LEÍDOS (${readCount})` : `READ (${readCount})`}
            </Text>
          </Pressable>
        </View>

        {/* Mini Active Hazard Filter Badge (Shown when collapsed so user has immediate context) */}
        {!isPanelExpanded && hazardFilter !== 'all' && (
          <View style={styles.activeFilterPillRow}>
            <Pressable style={styles.activeFilterPill} onPress={() => setHazardFilter('all')}>
              <Text style={styles.activeFilterPillText}>
                {lang === 'es' ? `Filtro Clase: ${hazardFilter.toUpperCase()}` : `Class: ${hazardFilter.toUpperCase()}`}
              </Text>
              <Ionicons name="close-circle" size={13} color={THEME.colors.accentAmber} />
            </Pressable>
          </View>
        )}

        {/* Mini 1-line Resume Banner (Discreet when collapsed) */}
        {!isPanelExpanded && lastRead && !isResumeDismissed && (
          <Pressable style={styles.miniResumeBar} onPress={handleResumeLastRead}>
            <Ionicons name="bookmark" size={12} color={THEME.colors.accentAmber} />
            <Text style={styles.miniResumeText} numberOfLines={1}>
              {lang === 'es' ? 'Continuar:' : 'Resume:'}{' '}
              <Text style={{ color: '#f8fafc', fontWeight: '700' }}>
                {lastRead.displayName || lastRead.title}
              </Text>{' '}
              ({Math.round(lastRead.scrollPercent || 0)}%)
            </Text>
            <Pressable
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={(e) => {
                e.stopPropagation();
                setIsResumeDismissed(true);
              }}
              style={styles.miniResumeClose}
            >
              <Ionicons name="close" size={13} color={THEME.colors.textMuted} />
            </Pressable>
          </Pressable>
        )}

        {/* Collapsible Tactical Panel (Expanded Drawer) */}
        {isPanelExpanded && (
          <View style={styles.expandedPanel}>
            {/* Stats Header Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{totalCount}</Text>
                <Text style={styles.statLbl}>{lang === 'es' ? 'NIVELES' : 'LEVELS'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: THEME.colors.accentGreen }]}>{readCount}</Text>
                <Text style={styles.statLbl}>{lang === 'es' ? 'LEÍDOS' : 'READ'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statVal, { color: '#60a5fa' }]}>{unreadCount}</Text>
                <Text style={styles.statLbl}>{lang === 'es' ? 'POR LEER' : 'UNREAD'}</Text>
              </View>
            </View>

            {/* Hazard Filter Chips */}
            <View style={styles.hazardSection}>
              <Text style={styles.panelSectionTitle}>
                {lang === 'es' ? 'CLASE DE DIFICULTAD DE SUPERVIVENCIA:' : 'SURVIVAL DIFFICULTY CLASS:'}
              </Text>
              <HazardFilterBar
                currentFilter={hazardFilter}
                onSelectFilter={(newFilter) => {
                  setHazardFilter(newFilter);
                  if (newFilter !== 'all') {
                    if (Platform.OS === 'android') {
                      UIManager.setLayoutAnimationEnabledExperimental?.(true);
                    }
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsPanelExpanded(false);
                  }
                }}
                lang={lang}
              />
            </View>

            {/* Full Resume Reading Banner */}
            {lastRead && !isResumeDismissed && (
              <ResumeReadingBanner
                session={lastRead}
                onPress={handleResumeLastRead}
                onDismiss={() => setIsResumeDismissed(true)}
              />
            )}
          </View>
        )}

        <View style={styles.statusBar}>
          <Text style={styles.countText}>
            {filteredLevels.length} {lang === 'es' ? 'REGISTROS EN LISTA' : 'RECORDS LISTED'}
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
                color={isPanelExpanded ? THEME.colors.accentAmber : THEME.colors.textMuted}
              />
              <Text style={[styles.panelToggleBtnText, isPanelExpanded && { color: THEME.colors.accentAmber }]}>
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

        {loading && levels.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={THEME.colors.accentAmber} />
            <Text style={styles.loadingText}>
              {lang === 'es' ? 'Sincronizando Archivo de Niveles...' : 'Syncing Wikidot Level Index...'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredLevels}
            keyExtractor={keyExtractor}
            renderItem={renderLevelItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={THEME.colors.accentAmber}
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

      {/* Detail column (Tablet Split-Screen only) */}
      {isSplitView && (
        <View style={styles.detailCol}>
          <DossierView
            path={selectedPath}
            category="level"
            onNavigateNoclip={(navPath) => setSelectedPath(navPath)}
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
    paddingBottom: 4,
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
    position: 'relative',
  },
  controlIconBtnActive: {
    borderColor: THEME.colors.accentAmber,
    backgroundColor: '#f59e0b18',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.accentAmber,
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
  activeFilterPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  activeFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f59e0b18',
    borderColor: '#f59e0b55',
    borderWidth: 1,
    borderRadius: THEME.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeFilterPillText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.accentAmber,
  },
  miniResumeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181e2b',
    borderWidth: 1,
    borderColor: '#f59e0b44',
    borderRadius: THEME.radius.sm,
    marginHorizontal: 12,
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  miniResumeText: {
    flex: 1,
    fontFamily: THEME.fonts.mono,
    fontSize: 10.5,
    color: '#94a3b8',
  },
  miniResumeClose: {
    padding: 2,
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
  hazardSection: {
    paddingHorizontal: 4,
  },
  panelSectionTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    marginBottom: 4,
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
    color: THEME.colors.textMuted,
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
    borderColor: THEME.colors.accentAmber,
    backgroundColor: '#f59e0b14',
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
