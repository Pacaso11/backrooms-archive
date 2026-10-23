import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { WikiListItem, LibraryCategoryDef } from '../../types/wikidot';
import { WikidotService, LIBRARY_CATEGORIES } from '../../services/wikidotService';
import { StorageService } from '../../services/storageService';
import { LibraryItemCard } from '../../components/LibraryItemCard';
import { SearchBar } from '../../components/SearchBar';
import { DossierView } from '../../components/DossierView';
import { LanguageToggle } from '../../components/LanguageToggle';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { THEME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSplitView, masterWidth } = useResponsiveLayout();

  const [activeCategory, setActiveCategory] = useState<LibraryCategoryDef>(LIBRARY_CATEGORIES[0]);
  const [items, setItems] = useState<WikiListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Load read status on focus
  useFocusEffect(
    useCallback(() => {
      StorageService.getReadIds().then(ids => {
        setReadIds(new Set(ids));
      });
    }, [])
  );

  const loadCategoryItems = useCallback(async (cat: LibraryCategoryDef, targetLang?: 'es' | 'en', forceRefresh = false) => {
    try {
      const currentLang = targetLang || (await StorageService.getLanguage());
      setLang(currentLang);

      if (!forceRefresh) {
        const cached = await StorageService.getCachedIndex(cat.key);
        if (cached && cached.length > 0) {
          setItems(cached);
          if (cached[0] && !selectedPath) {
            setSelectedPath(cached[0].path);
          }
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      const data = await WikidotService.fetchLibraryCategory(cat.key, currentLang);
      setItems(data);
      if (data[0] && !selectedPath) {
        setSelectedPath(data[0].path);
      }
      await StorageService.saveIndexToCache(cat.key, data);
    } catch (err) {
      console.error(`Error loading library category ${cat.key}:`, err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPath]);

  useEffect(() => {
    loadCategoryItems(activeCategory);
  }, [activeCategory, loadCategoryItems]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCategoryItems(activeCategory, lang, true);
  }, [activeCategory, lang, loadCategoryItems]);

  const handleLanguageChange = useCallback((newLang: 'es' | 'en') => {
    setLang(newLang);
    loadCategoryItems(activeCategory, newLang, true);
  }, [activeCategory, loadCategoryItems]);

  const handleCategorySelect = useCallback((cat: LibraryCategoryDef) => {
    if (cat.key === activeCategory.key) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(cat);
    setSearch('');
    setSelectedPath('');
  }, [activeCategory]);

  const toggleReadStatus = useCallback(async (id: string) => {
    const isNowRead = await StorageService.toggleRead(id);
    setReadIds(prev => {
      const next = new Set(prev);
      if (isNowRead) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const subMatch = item.subTitle ? item.subTitle.toLowerCase().includes(q) : false;
        const idMatch = item.id.toLowerCase().includes(q);
        const snippetMatch = item.snippet ? item.snippet.toLowerCase().includes(q) : false;
        return titleMatch || subMatch || idMatch || snippetMatch;
      });
    }

    // Read status filter
    if (readFilter === 'unread') {
      result = result.filter(item => !readIds.has(item.id));
    } else if (readFilter === 'read') {
      result = result.filter(item => readIds.has(item.id));
    }

    return result;
  }, [items, search, readFilter, readIds]);

  const stats = useMemo(() => {
    const total = items.length;
    let readCount = 0;
    for (const item of items) {
      if (readIds.has(item.id)) readCount++;
    }
    return {
      total,
      read: readCount,
      unread: total - readCount,
    };
  }, [items, readIds]);

  const handleItemPress = useCallback((item: WikiListItem) => {
    setSelectedPath(item.path);
    const catParam = activeCategory.key === 'objects' ? 'object' : activeCategory.key === 'phenomena' ? 'phenomenon' : 'canon';
    router.push(`/dossier/${item.id}?category=${catParam}`);
  }, [activeCategory, router]);

  const renderItem = useCallback(({ item }: { item: WikiListItem }) => {
    return (
      <LibraryItemCard
        item={item}
        categoryColor={activeCategory.color}
        categoryBadge={activeCategory.badge}
        isSelected={isSplitView && selectedPath === item.path}
        isRead={readIds.has(item.id)}
        onPress={() => handleItemPress(item)}
        onToggleRead={() => toggleReadStatus(item.id)}
      />
    );
  }, [activeCategory, isSplitView, selectedPath, readIds, handleItemPress, toggleReadStatus]);

  const bottomListPadding = Math.max(insets.bottom, 12) + 80;

  return (
    <View style={styles.container}>
      {/* Master List (or Full Screen on phone) */}
      <View style={[styles.masterPane, isSplitView && { width: masterWidth }]}>
        {/* Top Header: Search + Language Selector */}
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <SearchBar
                value={search}
                onChangeText={setSearch}
                placeholder={lang === 'es' ? `Buscar en ${activeCategory.titleEs}...` : `Search in ${activeCategory.title}...`}
              />
            </View>
            <View style={styles.langToggleWrapper}>
              <LanguageToggle
                currentLang={lang}
                onToggle={handleLanguageChange}
              />
            </View>
          </View>
        </View>

        {/* Categories Carousel */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {LIBRARY_CATEGORIES.map(cat => {
              const isActive = cat.key === activeCategory.key;
              return (
                <Pressable
                  key={cat.key}
                  style={[
                    styles.catChip,
                    isActive && {
                      borderColor: cat.color,
                      backgroundColor: `${cat.color}22`,
                    },
                  ]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={isActive ? cat.color : THEME.colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.catChipText,
                      isActive && { color: cat.color, fontWeight: '800' },
                    ]}
                  >
                    {lang === 'es' ? cat.titleEs : cat.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Read / Unread Filter Segmented Bar */}
        <View style={styles.filterBar}>
          <View style={styles.readFilterControl}>
            <Pressable
              style={[
                styles.readFilterButton,
                readFilter === 'all' && styles.readFilterButtonActive,
              ]}
              onPress={() => setReadFilter('all')}
            >
              <Text
                style={[
                  styles.readFilterButtonText,
                  readFilter === 'all' && styles.readFilterButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {lang === 'es' ? 'TODOS' : 'ALL'} ({stats.total})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.readFilterButton,
                readFilter === 'unread' && styles.readFilterButtonActive,
              ]}
              onPress={() => setReadFilter('unread')}
            >
              <Text
                style={[
                  styles.readFilterButtonText,
                  readFilter === 'unread' && styles.readFilterButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {lang === 'es' ? 'NO LEÍDOS' : 'UNREAD'} ({stats.unread})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.readFilterButton,
                readFilter === 'read' && styles.readFilterButtonActive,
              ]}
              onPress={() => setReadFilter('read')}
            >
              <Text
                style={[
                  styles.readFilterButtonText,
                  readFilter === 'read' && styles.readFilterButtonTextActive,
                ]}
                numberOfLines={1}
              >
                {lang === 'es' ? 'LEÍDOS' : 'READ'} ({stats.read})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Items List */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={activeCategory.color} />
            <Text style={styles.loadingText}>
              {lang === 'es'
                ? `ACCEDIENDO A ARCHIVO // ${activeCategory.titleEs.toUpperCase()}...`
                : `ACCESSING ARCHIVE // ${activeCategory.title.toUpperCase()}...`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: bottomListPadding, paddingTop: 4 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={activeCategory.color}
                colors={[activeCategory.color]}
              />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={12}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Ionicons name="folder-open-outline" size={44} color={THEME.colors.textMuted} />
                <Text style={styles.emptyTitle}>
                  {lang === 'es' ? 'SIN EXPEDIENTES ENCONTRADOS' : 'NO DOSSIERS FOUND'}
                </Text>
                <Text style={styles.emptySub}>
                  {search
                    ? lang === 'es'
                      ? 'No hay registros que coincidan con la búsqueda.'
                      : 'No records match the current search.'
                    : lang === 'es'
                    ? 'No se encontraron expedientes en este módulo de la biblioteca.'
                    : 'No dossiers located in this library archive module.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Split View Detail Pane (for Tablets / Wide screens) */}
      {isSplitView && (
        <View style={styles.detailPane}>
          {selectedPath ? (
            <DossierView
              path={selectedPath}
              category={activeCategory.key === 'objects' ? 'object' : activeCategory.key === 'phenomena' ? 'phenomenon' : 'archive'}
            />
          ) : (
            <View style={styles.centerContainer}>
              <Ionicons name="library-outline" size={64} color={THEME.colors.surfaceBorder} />
              <Text style={styles.placeholderText}>
                {lang === 'es'
                  ? 'SELECCIONA UN EXPEDIENTE DE LA BIBLIOTECA'
                  : 'SELECT A DOSSIER FROM THE LIBRARY'}
              </Text>
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
  masterPane: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  detailPane: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
  },
  langToggleWrapper: {
    justifyContent: 'center',
  },
  categoriesSection: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceBorder,
    backgroundColor: THEME.colors.surface,
  },
  categoriesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    backgroundColor: '#070B10',
  },
  catChipText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.3,
  },
  filterBar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: THEME.colors.background,
  },
  readFilterControl: {
    flexDirection: 'row',
    backgroundColor: '#070D12',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 2,
    height: 34,
  },
  readFilterButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  readFilterButtonActive: {
    backgroundColor: THEME.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
  },
  readFilterButtonText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  readFilterButtonTextActive: {
    color: THEME.colors.accentAmber,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  emptyTitle: {
    marginTop: 12,
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    letterSpacing: 1,
  },
  emptySub: {
    marginTop: 4,
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
  placeholderText: {
    marginTop: 16,
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
