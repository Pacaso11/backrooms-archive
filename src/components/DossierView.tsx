import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  Share,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BackroomsItem, ItemCategory, ReaderSettings } from '../types/wikidot';
import { WikidotService } from '../services/wikidotService';
import { StorageService } from '../services/storageService';
import { SurvivalBadge } from './SurvivalBadge';
import { LanguageToggle } from './LanguageToggle';
import { ReaderSettingsModal } from './ReaderSettingsModal';
import { NoclipText } from './NoclipText';
import { READER_FONT_SIZES, READER_THEMES, THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

interface DossierViewProps {
  path: string;
  category?: ItemCategory;
  onBack?: () => void;
  showBackButton?: boolean;
  onNavigateNoclip?: (path: string, category: ItemCategory) => void;
}

export function DossierView({
  path,
  category = 'level',
  onBack,
  showBackButton = false,
  onNavigateNoclip,
}: DossierViewProps) {
  const router = useRouter();
  const { language: appLanguage, setLanguage: setAppLanguage } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [item, setItem] = useState<BackroomsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>(appLanguage);

  // Reader Customization Settings
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>({
    theme: 'meg',
    fontSize: 'normal',
  });
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Interactive Reader Additions (Pillar 1)
  const [readingProgress, setReadingProgress] = useState(0);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(null);
  const [tocModalVisible, setTocModalVisible] = useState(false);
  const sectionCoordinates = useRef<Record<string, number>>({});

  // Scroll memory
  const initialScrollRestored = useRef(false);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScrollRestore = useRef<number | null>(null);
  const latestScrollSession = useRef<Parameters<typeof StorageService.saveLastReadSession>[0] | null>(null);

  // Cleanup pending network request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (scrollSaveTimer.current) {
        clearTimeout(scrollSaveTimer.current);
        if (latestScrollSession.current) StorageService.saveLastReadSession(latestScrollSession.current);
      }
    };
  }, []);

  const loadData = useCallback(
    async (targetLang?: 'es' | 'en', forceRefresh = false) => {
      // 1. Abort prior in-flight request and create new controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 2. On navigation / path change: immediately reset state & scroll
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setItem(null);
        setLoading(true);
        setError(null);
        setSelectedTabIndex(0);
        setExpandedAccordions({});
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }
      setError(null);
      initialScrollRestored.current = false;

      let hasLocalData = false;

      try {
        const currentLang = targetLang || (await StorageService.getLanguage());
        if (abortController.signal.aborted) return;
        setLang(currentLang);

        // Load reader settings
        const settings = await StorageService.getReaderSettings();
        if (abortController.signal.aborted) return;
        setReaderSettings(settings);

        const cleanId = path.replace(/^\/+|\/+$/g, '');
        await StorageService.recordHistory(cleanId);
        if (abortController.signal.aborted) return;

        // 1. Check local offline cache first (if not forcing fresh download)
        if (!forceRefresh) {
          const cached = await StorageService.getCachedItem(cleanId, currentLang);
          if (abortController.signal.aborted) return;
          if (cached) {
            hasLocalData = true;
            setItem(cached);
            setLoading(false);
          }
        }

        // 2. Check favorite and read status
        const fav = await StorageService.isFavorite(cleanId);
        if (abortController.signal.aborted) return;
        setIsFavorite(fav);

        const readState = await StorageService.isRead(cleanId);
        if (abortController.signal.aborted) return;
        if (!readState) {
          await StorageService.markAsRead(cleanId);
          setIsRead(true);
        } else {
          setIsRead(true);
        }

        // 3. Fetch latest from Wikidot with abort signal
        const fetched = await WikidotService.fetchItemDetails(
          path,
          category,
          currentLang,
          abortController.signal
        );
        if (abortController.signal.aborted) return;
        setItem(fetched);

        // Keep the resume banner in the selected language after refreshing a dossier.
        void StorageService.getLastReadSession().then(session => {
          if (!session || session.id !== fetched.id || abortController.signal.aborted) return;
          const cleanSub = fetched.subTitle
            ? fetched.subTitle.replace(/^['"«»“”„\s\-–—]+|['"«»“”„\s\-–—]+$/g, '').trim()
            : '';
          const localizedSession = {
            ...session,
            title: fetched.title,
            subTitle: cleanSub || undefined,
            displayName: cleanSub ? `${fetched.title} - "${cleanSub}"` : fetched.title,
            lang: currentLang,
          };
          latestScrollSession.current = localizedSession;
          return StorageService.saveLastReadSession(localizedSession);
        }).catch(() => {});

        // Save to cache for offline reading (never mutate fetched.id)
        await StorageService.saveItemToCache(fetched, currentLang);
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message?.includes('aborted') || abortController.signal.aborted) {
          // Silently catch and ignore AbortError
          return;
        }
        console.warn('Dossier loading error:', err);
        if (!hasLocalData) {
          setError(err?.message || 'Error connecting to Wikidot');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [path, category]
  );

  const handleToggleRead = async () => {
    if (!item) return;
    const cleanId = path.replace(/^\/+|\/+$/g, '');
    const nextStatus = await StorageService.toggleRead(cleanId);
    setIsRead(nextStatus);
  };

  useEffect(() => {
    loadData(appLanguage);
  }, [loadData, appLanguage]);

  // Restore scroll position when item finishes loading
  useEffect(() => {
    if (item && !initialScrollRestored.current) {
      initialScrollRestored.current = true;
      let cancelled = false;
      StorageService.getLastReadSession().then(session => {
        if (!cancelled && session && session.path === path && session.scrollY > 50) {
          pendingScrollRestore.current = session.scrollY;
          requestAnimationFrame(() => {
            if (!cancelled && pendingScrollRestore.current !== null) {
              scrollViewRef.current?.scrollTo({ y: pendingScrollRestore.current, animated: false });
              pendingScrollRestore.current = null;
            }
          });
        }
      });
      return () => { cancelled = true; };
    }
  }, [item, path]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!item) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollY = contentOffset.y;
    const maxScroll = Math.max(1, contentSize.height - layoutMeasurement.height);
    const scrollPercent = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
    setReadingProgress(scrollPercent);

    const cleanSub = item.subTitle
      ? item.subTitle.replace(/^["'«»“”„\s\-–—]+|["'«»“”„\s\-–—]+$/g, '').trim()
      : '';

    // Persist last read session
    const session: Parameters<typeof StorageService.saveLastReadSession>[0] = {
      id: item.id,
      path: item.path,
      title: item.title,
      subTitle: cleanSub || undefined,
      displayName: cleanSub ? `${item.title} - "${cleanSub}"` : item.title,
      category: item.category,
      scrollY,
      scrollPercent,
      lang,
      timestamp: Date.now(),
    };
    latestScrollSession.current = session;
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = setTimeout(() => {
      StorageService.saveLastReadSession(session);
      scrollSaveTimer.current = null;
    }, 500);
  };

  const tocSections = useMemo(() => {
    if (!item) return [];
    const list: { id: string; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [];
    if (item.prologue) {
      list.push({ id: 'prologue', title: lang === 'es' ? 'Registro Inicial' : 'Prologue', icon: 'journal-outline' });
    }
    if (item.description) {
      list.push({ id: 'description', title: lang === 'es' ? 'Descripción' : 'Description', icon: 'reader-outline' });
    }
    if (item.tabs && item.tabs.length > 0) {
      list.push({ id: 'tabs', title: lang === 'es' ? 'Registros de Archivo' : 'Archive Tabs', icon: 'layers-outline' });
    }
    if (item.sections && item.sections.length > 0) {
      item.sections.forEach((sec, idx) => {
        const isBodyMarker = /^(?:registro de datos|body|cuerpo)$/i.test(sec.title.trim());
        if (sec.title.trim() && !isBodyMarker) {
          const cleanTitle = sec.title.replace(/^###\s*⚔\s*(?:SAGA:)?\s*|^###\s*📂\s*(?:REGISTRO DESPLEGABLE:)?\s*/i, '').trim();
          list.push({ id: `section-${idx}`, title: cleanTitle, icon: 'document-text-outline' });
        }
      });
    }
    if (item.entrances && item.entrances.length > 0) {
      list.push({ id: 'entrances', title: lang === 'es' ? 'Entradas' : 'Entrances', icon: 'log-in-outline' });
    }
    if (item.exits && item.exits.length > 0) {
      list.push({ id: 'exits', title: lang === 'es' ? 'Salidas' : 'Exits', icon: 'log-out-outline' });
    }
    if (item.epilogue) {
      list.push({ id: 'epilogue', title: lang === 'es' ? 'Epílogo' : 'Epilogue', icon: 'bookmark-outline' });
    }
    return list;
  }, [item, lang]);

  const scrollToSection = (id: string) => {
    setTocModalVisible(false);
    const targetY = sectionCoordinates.current[id];
    if (typeof targetY === 'number') {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, targetY - 12), animated: true });
    }
  };

  const handleShare = async () => {
    if (!item) return;
    try {
      const shareUrl = item.url || `https://es-backrooms-wiki.wikidot.com${item.path}`;
      const snippet = item.description ? item.description.slice(0, 140) + '...' : '';
      await Share.share({
        title: item.title,
        message: `${item.title}${item.subTitle ? ` - "${item.subTitle}"` : ''}\n\n${snippet}\n\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const restoreScrollAfterLayout = () => {
    if (pendingScrollRestore.current !== null) {
      scrollViewRef.current?.scrollTo({ y: pendingScrollRestore.current, animated: false });
      pendingScrollRestore.current = null;
    }
  };

  const handleSwitchLanguage = async (newLang: 'es' | 'en') => {
    if (newLang === lang) return;
    setLang(newLang);
    await setAppLanguage(newLang);
  };

  const handleUpdateReaderSettings = async (newSettings: ReaderSettings) => {
    setReaderSettings(newSettings);
    await StorageService.saveReaderSettings(newSettings);
  };

  const handleToggleFavorite = async () => {
    if (!item) return;
    const cleanId = path.replace(/\//g, '');
    const isNowFav = await StorageService.toggleFavorite(cleanId);
    setIsFavorite(isNowFav);
  };

  const handleOpenWikidot = () => {
    if (item?.url) {
      Linking.openURL(item.url);
    }
  };

  const handleNavigateNoclip = (targetPath: string, targetCategory: ItemCategory) => {
    if (onNavigateNoclip) {
      onNavigateNoclip(targetPath, targetCategory);
    } else {
      const dossierPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
      router.push(`/dossier${dossierPath}?category=${targetCategory}`);
    }
  };

  // Active theme & typography
  const activeTheme = READER_THEMES[readerSettings.theme];
  const activeFont = READER_FONT_SIZES[readerSettings.fontSize];

  if (loading && !item) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: activeTheme.background }]}>
        <ActivityIndicator size="large" color={activeTheme.accent} />
        <Text style={[styles.loadingText, { color: activeTheme.accent }]}>
          {lang === 'es' ? 'ACCEDIENDO A LOS ARCHIVOS DEL M.E.G....' : 'ACCESSING M.E.G. ARCHIVES...'}
        </Text>
        <Text style={[styles.loadingSub, { color: activeTheme.textSecondary }]}>
          {lang === 'es' ? `Descifrando ${path} de Wikidot ES` : `Decrypting ${path} from Wikidot EN`}
        </Text>
      </View>
    );
  }

  if (error && !item) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: activeTheme.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={THEME.colors.accentRed} />
        <Text style={styles.errorTitle}>
          {lang === 'es' ? 'ERROR DE CONEXIÓN CON EL ARCHIVO' : 'ARCHIVE ACCESS FAILED'}
        </Text>
        <Text style={styles.errorSub}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => loadData()}>
          <Ionicons name="refresh" size={16} color="#000" />
          <Text style={styles.retryBtnText}>
            {lang === 'es' ? 'REINTENTAR CONEXIÓN' : 'RETRY CONNECTION'}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!item) return null;

  return (
    <View style={[styles.outerWrapper, { backgroundColor: activeTheme.background }]}>
      {/* Top Reading Progress Bar (Amber / Retro) */}
      <View style={[styles.progressBarTrack, { backgroundColor: `${activeTheme.surfaceBorder}44` }]}>
        <View style={[styles.progressBarFill, { width: `${readingProgress}%`, backgroundColor: activeTheme.accent }]} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        onContentSizeChange={restoreScrollAfterLayout}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(undefined, true)}
            tintColor={activeTheme.accent}
          />
        }
      >
        {/* Top Bar with Back, Reader Settings, Language Toggle, and Actions */}
        <View style={styles.topActionsBar}>
          {showBackButton && onBack ? (
              <Pressable style={[styles.backBtn, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]} onPress={onBack} accessibilityRole="button" accessibilityLabel={lang === 'es' ? 'Volver al índice' : 'Back to index'}>
              <Ionicons name="arrow-back" size={18} color={activeTheme.textPrimary} />
              <Text style={[styles.backBtnText, { color: activeTheme.textPrimary }]}>{lang === 'es' ? 'ÍNDICE' : 'INDEX'}</Text>
            </Pressable>
          ) : (
            <View style={styles.classifiedStamp}>
              <Text style={styles.classifiedStampText}>
                {lang === 'es' ? 'M.E.G. ARCHIVO CONFIDENCIAL' : 'M.E.G. SECURE DOSSIER'}
              </Text>
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rightIconsScrollView}
            contentContainerStyle={styles.rightIcons}
          >
            {/* Mark / Unmark as Read Button */}
            <Pressable
              style={[
                styles.actionIconBtn,
                { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder },
                isRead && styles.actionIconBtnActive,
              ]}
              onPress={handleToggleRead}
              accessibilityRole="button"
              accessibilityLabel={isRead ? 'Desmarcar como leído' : 'Marcar como leído'}
            >
              <Ionicons
                name={isRead ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={18}
                color={isRead ? THEME.colors.accentGreen : activeTheme.textSecondary}
              />
            </Pressable>

            {/* Kindle Aa Reader Settings Button */}
            <Pressable
              style={[styles.actionIconBtn, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]}
              onPress={() => setSettingsModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={lang === 'es' ? 'Ajustes de lectura: tema y tamaño de texto' : 'Reading settings: theme and text size'}
            >
              <Ionicons name="text-outline" size={18} color={activeTheme.textSecondary} />
            </Pressable>

            <LanguageToggle currentLang={lang} onToggle={handleSwitchLanguage} />

            <Pressable
              style={[
                styles.actionIconBtn,
                { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder },
                isFavorite && styles.actionIconBtnActive,
              ]}
              onPress={handleToggleFavorite}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? (lang === 'es' ? 'Quitar de guardados' : 'Remove from saved') : (lang === 'es' ? 'Guardar expediente' : 'Save dossier')}
            >
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={18}
                color={isFavorite ? activeTheme.accent : activeTheme.textSecondary}
              />
            </Pressable>

            <Pressable
              style={[styles.actionIconBtn, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]}
              onPress={() => loadData(undefined, true)}
              accessibilityRole="button"
              accessibilityLabel={lang === 'es' ? 'Actualizar expediente' : 'Refresh dossier'}
            >
              <Ionicons name="refresh" size={18} color={activeTheme.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.actionIconBtn, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel={lang === 'es' ? 'Compartir expediente' : 'Share dossier'}
            >
              <Ionicons name="share-social-outline" size={18} color={activeTheme.textSecondary} />
            </Pressable>

            <Pressable
              style={[styles.actionIconBtn, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]}
              onPress={handleOpenWikidot}
              accessibilityRole="button"
              accessibilityLabel={lang === 'es' ? 'Abrir expediente en Wikidot' : 'Open dossier on Wikidot'}
            >
              <Ionicons name="open-outline" size={18} color={activeTheme.textSecondary} />
            </Pressable>
          </ScrollView>
        </View>

        {/* Notice if Auto-Translated or Pending Translation */}
        {item.isAutoTranslated && lang === 'es' && (
          <View style={[styles.fallbackNotice, { borderColor: activeTheme.accent }]}>
            <Ionicons name="language" size={16} color={activeTheme.accent} />
            <Text style={[styles.fallbackNoticeText, { color: activeTheme.accent }]}>
              Traducción M.E.G. activa. Este expediente no cuenta con traducción oficial en Wikidot ES y ha sido traducido para lectura en español.
            </Text>
          </View>
        )}
        {item.isFallback && !item.isAutoTranslated && lang === 'es' && (
          <View style={styles.fallbackNotice}>
            <Ionicons name="information-circle" size={16} color={activeTheme.accent} />
            <Text style={styles.fallbackNoticeText}>
              Traducción en Wikidot ES aún en desarrollo por la comunidad. Mostrando expediente original en inglés.
            </Text>
          </View>
        )}

        {/* Header Info */}
        <View style={styles.headerBlock}>
          <View style={styles.metaRow}>
            <Text style={[styles.metaCode, { color: activeTheme.accent }]}>REGISTRO ID: #{item.id.toUpperCase()}</Text>

            <View style={styles.metaRightPills}>
              {/* Interactive Read/Unmark Pill */}
              <Pressable
                onPress={handleToggleRead}
                style={[
                  styles.readTogglePill,
                  {
                    backgroundColor: isRead ? '#10b98118' : `${activeTheme.surfaceBorder}44`,
                    borderColor: isRead ? '#10b98166' : activeTheme.surfaceBorder,
                  },
                ]}
              >
                <Ionicons
                  name={isRead ? 'checkmark-circle' : 'radio-button-off'}
                  size={12}
                  color={isRead ? THEME.colors.accentGreen : activeTheme.textSecondary}
                />
                <Text
                  style={[
                    styles.readTogglePillText,
                    { color: isRead ? THEME.colors.accentGreen : activeTheme.textSecondary },
                  ]}
                >
                  {isRead
                    ? (lang === 'es' ? 'LEÍDO' : 'READ')
                    : (lang === 'es' ? 'NO LEÍDO' : 'UNREAD')}
                </Text>
              </Pressable>

              {isFavorite && (
                <View style={styles.offlinePill}>
                  <Ionicons name="checkmark-circle" size={12} color={THEME.colors.accentGreen} />
                  <Text style={styles.offlinePillText}>
                    {lang === 'es' ? 'OFFLINE' : 'OFFLINE'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.title, { fontSize: activeFont.title, color: activeTheme.textPrimary }]}>
            {item.title}
          </Text>
          {item.subTitle ? (
            <Text style={[styles.subTitle, { fontSize: activeFont.subtitle, color: activeTheme.textSecondary }]}>
              "{item.subTitle.replace(/^["'«»“”„\s\-–—]+|["'«»“”„\s\-–—]+$/g, '').trim()}"
            </Text>
          ) : null}
        </View>

        {/* Survival Difficulty Badge */}
        {item.classification && <SurvivalBadge classification={item.classification} lang={lang} />}

        {/* Primary Image Gallery & Lightbox Trigger */}
        {item.images.length > 0 && (
          <View style={[styles.galleryContainer, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]}>
            <Pressable
              onPress={() => setLightboxImageIndex(0)}
              style={styles.mainImageTouchArea}
              accessibilityRole="button"
              accessibilityLabel={lang === 'es' ? 'Tocar para ver imagen en pantalla completa con zoom' : 'Tap to view full screen image with zoom'}
            >
              <Image
                source={{ uri: item.images[0].url }}
                style={styles.mainImage}
                resizeMode="cover"
              />
              <View style={styles.imageZoomBadge}>
                <Ionicons name="expand-outline" size={13} color="#FFF" />
                <Text style={styles.imageZoomBadgeText}>
                  {lang === 'es' ? 'ZOOM' : 'ZOOM'}
                </Text>
              </View>
            </Pressable>
            <View style={[styles.imageCaptionBar, { backgroundColor: activeTheme.surfaceHighlight }]}>
              <Ionicons name="camera-outline" size={14} color={activeTheme.textSecondary} />
              <Text style={[styles.imageCaptionText, { color: activeTheme.textSecondary }]}>
                {item.images[0].caption || (lang === 'es' ? 'Evidencia fotográfica oficial (Wikidot)' : 'Official Photographic Evidence (Wikidot)')}
              </Text>
            </View>
          </View>
        )}

        {/* Additional Images Strip if multiple photos exist */}
        {item.images.length > 1 && (
          <View style={[styles.additionalGallery, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]}>
            <View style={styles.additionalGalleryHeader}>
              <Ionicons name="images-outline" size={14} color={activeTheme.accent} />
              <Text style={[styles.additionalGalleryTitle, { color: activeTheme.accent }]}>
                {lang === 'es' ? `EVIDENCIA FOTOGRÁFICA ADICIONAL (${item.images.length})` : `ADDITIONAL PHOTOGRAPHIC EVIDENCE (${item.images.length})`}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryThumbnailsRow}>
              {item.images.map((img, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    styles.thumbnailCard,
                    {
                      borderColor: lightboxImageIndex === idx ? activeTheme.accent : activeTheme.surfaceBorder,
                      backgroundColor: activeTheme.surfaceHighlight,
                    },
                  ]}
                  onPress={() => setLightboxImageIndex(idx)}
                >
                  <Image source={{ uri: img.url }} style={styles.thumbnailImage} resizeMode="cover" />
                  <View style={styles.thumbnailCaptionRow}>
                    <Text numberOfLines={1} style={[styles.thumbnailCaption, { color: activeTheme.textSecondary }]}>
                      {img.caption || `${lang === 'es' ? 'Foto' : 'Photo'} ${idx + 1}`}
                    </Text>
                    <Ionicons name="expand-outline" size={11} color={activeTheme.accent} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Atmospheric Prologue / Narrative Intro (Rendered at top as on Wikidot) */}
        {item.prologue ? (
          <View
            style={[styles.narrativeBlock, { backgroundColor: activeTheme.surface, borderColor: activeTheme.accent }]}
            onLayout={(e) => {
              sectionCoordinates.current['prologue'] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.narrativeHeaderRow}>
              <Ionicons name="journal-outline" size={16} color={activeTheme.accent} />
              <Text style={[styles.narrativeHeaderTitle, { color: activeTheme.accent }]}>
                {lang === 'es' ? 'REGISTRO PRELIMINAR / RELATO INICIAL' : 'PRELIMINARY ARCHIVE / INTRODUCTORY LOG'}
              </Text>
            </View>
            <NoclipText
              content={item.prologue}
              fontSize={activeFont.body}
              lineHeight={activeFont.lineHeight}
              lang={lang}
              textColor={activeTheme.textPrimary}
              onNavigate={handleNavigateNoclip}
            />
          </View>
        ) : null}

        {/* Description Body with Noclip Cross-Links */}
        {item.description ? (
          <View
            style={styles.sectionBlock}
            onLayout={(e) => {
              sectionCoordinates.current['description'] = e.nativeEvent.layout.y;
            }}
          >
            <View style={[styles.sectionHeaderRow, { borderBottomColor: activeTheme.surfaceBorder }]}>
              <Text style={[styles.sectionTitle, { fontSize: activeFont.section, color: activeTheme.accent }]}>
                {lang === 'es' ? 'DESCRIPCIÓN' : 'DESCRIPTION'}
              </Text>
            </View>
            <NoclipText
              content={item.description}
              fontSize={activeFont.body}
              lineHeight={activeFont.lineHeight}
              lang={lang}
              textColor={activeTheme.textPrimary}
              onNavigate={handleNavigateNoclip}
            />
          </View>
        ) : null}

        {/* Structured Tabs (YUI Tabviews / Multi-Archive Hubs) */}
        {item.tabs && item.tabs.length > 0 && (
          <View
            style={styles.tabsContainer}
            onLayout={(e) => {
              sectionCoordinates.current['tabs'] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.tabsHeader}>
              <Ionicons name="layers-outline" size={14} color={activeTheme.accent} />
              <Text style={[styles.tabsHeaderTitle, { color: activeTheme.accent }]}>
                {lang === 'es' ? 'REGISTROS Y SECCIONES DE ARCHIVO' : 'ARCHIVE TABS & SECTIONS'}
              </Text>
            </View>

            {/* Horizontal Tabs Switcher */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScrollContent}
            >
              {item.tabs.map((tab, tIdx) => {
                const isTabActive = selectedTabIndex === tIdx;
                return (
                  <Pressable
                    key={tab.id}
                    style={[
                      styles.tabButton,
                      {
                        backgroundColor: isTabActive ? `${activeTheme.accent}22` : activeTheme.surface,
                        borderColor: isTabActive ? activeTheme.accent : activeTheme.surfaceBorder,
                      },
                    ]}
                    onPress={() => setSelectedTabIndex(tIdx)}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={12}
                      color={isTabActive ? activeTheme.accent : activeTheme.textSecondary}
                    />
                    <Text
                      style={[
                        styles.tabButtonText,
                        {
                          color: isTabActive ? activeTheme.accent : activeTheme.textSecondary,
                          fontWeight: isTabActive ? '800' : '600',
                        },
                      ]}
                    >
                      {tab.title}
                    </Text>
                  </Pressable>
                );
              })}

              {/* View All Option */}
              <Pressable
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: selectedTabIndex === item.tabs.length ? `${activeTheme.accent}22` : activeTheme.surface,
                    borderColor: selectedTabIndex === item.tabs.length ? activeTheme.accent : activeTheme.surfaceBorder,
                  },
                ]}
                onPress={() => setSelectedTabIndex(item.tabs!.length)}
              >
                <Ionicons
                  name="albums-outline"
                  size={12}
                  color={selectedTabIndex === item.tabs.length ? activeTheme.accent : activeTheme.textSecondary}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: selectedTabIndex === item.tabs.length ? activeTheme.accent : activeTheme.textSecondary,
                      fontWeight: selectedTabIndex === item.tabs.length ? '800' : '600',
                    },
                  ]}
                >
                  {lang === 'es' ? 'VER TODO' : 'VIEW ALL'}
                </Text>
              </Pressable>
            </ScrollView>

            {/* Tab Body */}
            {selectedTabIndex < item.tabs.length ? (
              <View style={[styles.tabContentCard, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]}>
                <View style={[styles.tabContentHeader, { borderBottomColor: `${activeTheme.surfaceBorder}66` }]}>
                  <Ionicons name="document-text" size={15} color={activeTheme.accent} />
                  <Text style={[styles.tabContentTitle, { color: activeTheme.accent, fontSize: activeFont.section - 1 }]}>
                    {item.tabs[selectedTabIndex].title}
                  </Text>
                </View>
                <NoclipText
                  content={item.tabs[selectedTabIndex].content}
                  fontSize={activeFont.body}
                  lineHeight={activeFont.lineHeight}
                  lang={lang}
                  textColor={activeTheme.textPrimary}
                  onNavigate={handleNavigateNoclip}
                />
              </View>
            ) : (
              item.tabs.map((tab) => (
                <View key={tab.id} style={[styles.tabContentCard, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder, marginTop: 12 }]}>
                  <View style={[styles.tabContentHeader, { borderBottomColor: `${activeTheme.surfaceBorder}66` }]}>
                    <Ionicons name="document-text" size={15} color={activeTheme.accent} />
                    <Text style={[styles.tabContentTitle, { color: activeTheme.accent, fontSize: activeFont.section - 1 }]}>
                      {tab.title}
                    </Text>
                  </View>
                  <NoclipText
                    content={tab.content}
                    fontSize={activeFont.body}
                    lineHeight={activeFont.lineHeight}
                    lang={lang}
                    textColor={activeTheme.textPrimary}
                    onNavigate={handleNavigateNoclip}
                  />
                </View>
              ))
            )}
          </View>
        )}

        {/* Other Sections (Sagas, Aberrations, Entities, Outposts, Entrances, Exits, etc.) */}
        {item.sections.map((sec, idx) => {
          const isBodyMarker = /^(?:registro de datos|body|cuerpo)$/i.test(sec.title.trim());
          if (!sec.title.trim() || isBodyMarker) {
            return (
              <View key={idx} style={styles.sectionBlock}>
                <NoclipText
                  content={sec.content}
                  fontSize={activeFont.body}
                  lineHeight={activeFont.lineHeight}
                  lang={lang}
                  textColor={activeTheme.textPrimary}
                  onNavigate={handleNavigateNoclip}
                />
              </View>
            );
          }

          const isSaga = sec.title.includes('⚔') || sec.title.toLowerCase().includes('saga');
          const isCollapsible = sec.title.includes('📂') || sec.title.toLowerCase().includes('desplegable');
          const isExpanded = !!expandedAccordions[sec.title];

          if (isSaga) {
            return (
              <View
                key={idx}
                style={[
                  styles.sagaCard,
                  {
                    backgroundColor: activeTheme.surface,
                    borderColor: '#F59E0B66',
                  },
                ]}
              >
                <View style={styles.sagaHeaderRow}>
                  <View style={styles.sagaBadge}>
                    <Ionicons name="shield-outline" size={12} color="#F59E0B" />
                    <Text style={styles.sagaBadgeText}>
                      {lang === 'es' ? 'CRONOLOGÍA / SAGA' : 'TIMELINE / SAGA'}
                    </Text>
                  </View>
                  <Text style={[styles.sagaTitle, { color: '#F59E0B', fontSize: activeFont.section }]}>
                    {sec.title.replace(/^###\s*⚔\s*(?:SAGA:)?\s*/i, '').trim()}
                  </Text>
                </View>

                <View style={styles.sagaContent}>
                  <NoclipText
                    content={sec.content}
                    fontSize={activeFont.body}
                    lineHeight={activeFont.lineHeight}
                    lang={lang}
                    textColor={activeTheme.textPrimary}
                    onNavigate={handleNavigateNoclip}
                  />
                </View>
              </View>
            );
          }

          if (isCollapsible) {
            const cleanCollapsibleTitle = sec.title.replace(/^###\s*📂\s*(?:REGISTRO DESPLEGABLE:)?\s*/i, '').trim();
            return (
              <View
                key={idx}
                style={[
                  styles.accordionCard,
                  {
                    backgroundColor: activeTheme.surface,
                    borderColor: activeTheme.surfaceBorder,
                  },
                ]}
              >
                <Pressable
                  style={styles.accordionHeader}
                  onPress={() =>
                    setExpandedAccordions((prev) => ({
                      ...prev,
                      [sec.title]: !prev[sec.title],
                    }))
                  }
                >
                  <View style={styles.accordionTitleRow}>
                    <Ionicons
                      name={isExpanded ? 'folder-open-outline' : 'folder-outline'}
                      size={15}
                      color={activeTheme.accent}
                    />
                    <Text style={[styles.accordionTitleText, { color: activeTheme.accent, fontSize: activeFont.body }]}>
                      {cleanCollapsibleTitle}
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={16}
                    color={activeTheme.textSecondary}
                  />
                </Pressable>

                {isExpanded && (
                  <View style={[styles.accordionBody, { borderTopColor: activeTheme.surfaceBorder }]}>
                    <NoclipText
                      content={sec.content}
                      fontSize={activeFont.body - 1}
                      lineHeight={activeFont.lineHeight - 2}
                      lang={lang}
                      textColor={activeTheme.textPrimary}
                      onNavigate={handleNavigateNoclip}
                    />
                  </View>
                )}
              </View>
            );
          }

          const subItems = sec.content.split('### ◆ ');

          return (
            <View key={idx} style={styles.sectionBlock}>
              <View style={[styles.sectionHeaderRow, { borderBottomColor: activeTheme.surfaceBorder }]}>
                <Text style={[styles.sectionTitle, { fontSize: activeFont.section, color: activeTheme.accent }]}>
                  {sec.title.toUpperCase()}
                </Text>
              </View>

              {subItems.length > 1 ? (
                <View style={styles.subItemsWrapper}>
                  {subItems[0].trim().length > 0 && (
                    <NoclipText
                      content={subItems[0].trim()}
                      fontSize={activeFont.body}
                      lineHeight={activeFont.lineHeight}
                      lang={lang}
                      textColor={activeTheme.textPrimary}
                      onNavigate={handleNavigateNoclip}
                    />
                  )}
                  {subItems.slice(1).map((subChunk, sIdx) => {
                    const firstLineEnd = subChunk.indexOf('\n');
                    const subTitle = firstLineEnd !== -1 ? subChunk.substring(0, firstLineEnd).trim() : 'Variación';
                    const subBody = firstLineEnd !== -1 ? subChunk.substring(firstLineEnd).trim() : subChunk.trim();

                    return (
                      <View key={sIdx} style={[styles.subCard, { backgroundColor: activeTheme.surfaceHighlight, borderColor: activeTheme.surfaceBorder }]}>
                        <View style={styles.subCardHeader}>
                          <View style={[styles.subCardDot, { backgroundColor: activeTheme.accent }]} />
                          <Text style={[styles.subCardTitle, { color: activeTheme.accent }]}>{subTitle}</Text>
                        </View>
                        <NoclipText
                          content={subBody}
                          fontSize={activeFont.body - 1}
                          lineHeight={activeFont.lineHeight - 2}
                          lang={lang}
                          textColor={activeTheme.textPrimary}
                          onNavigate={handleNavigateNoclip}
                        />
                      </View>
                    );
                  })}
                </View>
              ) : (
                <NoclipText
                  content={sec.content}
                  fontSize={activeFont.body}
                  lineHeight={activeFont.lineHeight}
                  lang={lang}
                  textColor={activeTheme.textPrimary}
                  onNavigate={handleNavigateNoclip}
                />
              )}
            </View>
          );
        })}

        {/* Entrances and Exits Quick Cards */}
        {((item.entrances && item.entrances.length > 0) || (item.exits && item.exits.length > 0)) && (
          <View
            style={styles.quickGrid}
            onLayout={(e) => {
              if (item.entrances && item.entrances.length > 0) {
                sectionCoordinates.current['entrances'] = e.nativeEvent.layout.y;
              }
              if (item.exits && item.exits.length > 0) {
                sectionCoordinates.current['exits'] = e.nativeEvent.layout.y;
              }
            }}
          >
            {item.entrances && item.entrances.length > 0 && (
              <View style={[styles.quickCard, styles.entranceCard, { backgroundColor: activeTheme.surface }]}>
                <View style={styles.quickCardHeader}>
                  <Ionicons name="log-in" size={14} color="#10b981" />
                  <Text style={[styles.quickCardTitle, { color: '#10b981' }]}>
                    {lang === 'es' ? 'ENTRADAS CONOCIDAS' : 'KNOWN ENTRANCES'}
                  </Text>
                </View>
                {item.entrances.map((ent, eIdx) => (
                  <Text key={eIdx} style={[styles.quickCardItem, { color: activeTheme.textPrimary }]}>
                    • {ent}
                  </Text>
                ))}
              </View>
            )}

            {item.exits && item.exits.length > 0 && (
              <View style={[styles.quickCard, styles.exitCard, { backgroundColor: activeTheme.surface }]}>
                <View style={styles.quickCardHeader}>
                  <Ionicons name="log-out" size={14} color="#ef4444" />
                  <Text style={[styles.quickCardTitle, { color: '#ef4444' }]}>
                    {lang === 'es' ? 'SALIDAS CONOCIDAS' : 'KNOWN EXITS'}
                  </Text>
                </View>
                {item.exits.map((ex, exIdx) => (
                  <Text key={exIdx} style={[styles.quickCardItem, { color: activeTheme.textPrimary }]}>
                    • {ex}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Epilogue / Final Narrative Log (Rendered at end as on Wikidot) */}
        {item.epilogue ? (
          <View
            style={[styles.narrativeBlock, styles.epilogueBlock, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]}
            onLayout={(e) => {
              sectionCoordinates.current['epilogue'] = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.narrativeHeaderRow}>
              <Ionicons name="bookmark-outline" size={16} color={activeTheme.accent} />
              <Text style={[styles.narrativeHeaderTitle, { color: activeTheme.textSecondary }]}>
                {lang === 'es' ? 'REGISTRO FINAL / EPÍLOGO' : 'FINAL LOG / EPILOGUE'}
              </Text>
            </View>
            <NoclipText
              content={item.epilogue}
              fontSize={activeFont.body}
              lineHeight={activeFont.lineHeight}
              lang={lang}
              textColor={activeTheme.textPrimary}
              onNavigate={handleNavigateNoclip}
            />
          </View>
        ) : null}

        {/* Bottom Canon Footer */}
        <View style={[styles.footerNotice, { borderTopColor: activeTheme.surfaceBorder }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={activeTheme.textSecondary} />
          <Text style={[styles.footerNoticeText, { color: activeTheme.textSecondary }]}>
            {lang === 'es'
              ? 'Contenido extraído directamente de la Wiki Canónica de los Backrooms (Wikidot).'
              : 'Content sourced directly from the official Wikidot Backrooms Canon.'}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Table of Contents Button (Quick Jump) */}
      {tocSections.length > 1 && (
        <Pressable
          style={[styles.floatingTocBtn, { backgroundColor: activeTheme.surface, borderColor: activeTheme.accent }]}
          onPress={() => setTocModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={lang === 'es' ? 'Abrir índice de secciones' : 'Open table of contents'}
        >
          <Ionicons name="list" size={16} color={activeTheme.accent} />
          <Text style={[styles.floatingTocBtnText, { color: activeTheme.accent }]}>
            {lang === 'es' ? 'ÍNDICE' : 'TOC'}
          </Text>
        </Pressable>
      )}

      {/* Table of Contents Modal */}
      <Modal
        visible={tocModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTocModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setTocModalVisible(false)}>
          <Pressable
            style={[styles.tocModalSheet, { backgroundColor: activeTheme.surface, borderColor: activeTheme.surfaceBorder }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.tocModalHeader, { borderBottomColor: activeTheme.surfaceBorder }]}>
              <View style={styles.tocModalHeaderTitleRow}>
                <Ionicons name="list-outline" size={18} color={activeTheme.accent} />
                <Text style={[styles.tocModalHeaderTitle, { color: activeTheme.accent }]}>
                  {lang === 'es' ? 'ÍNDICE DE SECCIONES M.E.G.' : 'M.E.G. DOSSIER SECTIONS'}
                </Text>
              </View>
              <Pressable
                onPress={() => setTocModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={activeTheme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={styles.tocSectionsList} contentContainerStyle={styles.tocSectionsListContent}>
              {tocSections.map((sec: { id: string; title: string; icon: keyof typeof Ionicons.glyphMap }) => (
                <Pressable
                  key={sec.id}
                  style={[
                    styles.tocItemRow,
                    { borderBottomColor: `${activeTheme.surfaceBorder}44` },
                  ]}
                  onPress={() => scrollToSection(sec.id)}
                >
                  <View style={styles.tocItemLeft}>
                    <Ionicons name={sec.icon} size={16} color={activeTheme.accent} />
                    <Text numberOfLines={1} style={[styles.tocItemText, { color: activeTheme.textPrimary }]}>
                      {sec.title}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={activeTheme.textSecondary} />
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Fullscreen Lightbox Modal with Pinch-To-Zoom */}
      {lightboxImageIndex !== null && item.images.length > 0 && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setLightboxImageIndex(null)}
        >
          <View style={styles.lightboxOverlay}>
            <View style={styles.lightboxHeader}>
              <View style={styles.lightboxCounterBadge}>
                <Text style={styles.lightboxCounterText}>
                  {`EVIDENCIA ${lightboxImageIndex + 1} / ${item.images.length}`}
                </Text>
              </View>
              <Pressable
                style={styles.lightboxCloseBtn}
                onPress={() => setLightboxImageIndex(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Cerrar visor de imagen"
              >
                <Ionicons name="close" size={26} color="#FFF" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.lightboxScrollView}
              contentContainerStyle={styles.lightboxScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent={true}
            >
              <Image
                source={{ uri: item.images[lightboxImageIndex].url }}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
            </ScrollView>

            <View style={styles.lightboxFooter}>
              {item.images[lightboxImageIndex].caption ? (
                <Text style={styles.lightboxCaptionText}>
                  {item.images[lightboxImageIndex].caption}
                </Text>
              ) : null}

              {item.images.length > 1 && (
                <View style={styles.lightboxNavRow}>
                  <Pressable
                    style={[
                      styles.lightboxNavBtn,
                      lightboxImageIndex === 0 && styles.lightboxNavBtnDisabled,
                    ]}
                    disabled={lightboxImageIndex === 0}
                    onPress={() => setLightboxImageIndex(prev => (prev !== null && prev > 0 ? prev - 1 : prev))}
                  >
                    <Ionicons name="chevron-back" size={22} color={lightboxImageIndex === 0 ? '#555' : '#FFF'} />
                    <Text style={[styles.lightboxNavBtnText, { color: lightboxImageIndex === 0 ? '#555' : '#FFF' }]}>
                      {lang === 'es' ? 'ANTERIOR' : 'PREV'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.lightboxNavBtn,
                      lightboxImageIndex === item.images.length - 1 && styles.lightboxNavBtnDisabled,
                    ]}
                    disabled={lightboxImageIndex === item.images.length - 1}
                    onPress={() => setLightboxImageIndex(prev => (prev !== null && prev < item.images.length - 1 ? prev + 1 : prev))}
                  >
                    <Text style={[styles.lightboxNavBtnText, { color: lightboxImageIndex === item.images.length - 1 ? '#555' : '#FFF' }]}>
                      {lang === 'es' ? 'SIGUIENTE' : 'NEXT'}
                    </Text>
                    <Ionicons name="chevron-forward" size={22} color={lightboxImageIndex === item.images.length - 1 ? '#555' : '#FFF'} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Reader Settings Modal */}
      <ReaderSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        settings={readerSettings}
        onUpdateSettings={handleUpdateReaderSettings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
    paddingBottom: 48,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: THEME.spacing.xl,
  },
  loadingText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 16,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  loadingSub: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    marginTop: 6,
  },
  errorTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.accentRed,
    marginTop: 14,
    letterSpacing: 1,
  },
  errorSub: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentAmber,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.radius.sm,
    gap: 8,
  },
  retryBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
  },
  topActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.md,
    flexWrap: 'nowrap',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    gap: 4,
    flexShrink: 0,
  },
  backBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '700',
  },
  classifiedStamp: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    backgroundColor: '#dc262622',
    borderWidth: 1,
    borderColor: THEME.colors.stampBorder,
    flexShrink: 0,
  },
  classifiedStampText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.classifiedRed,
    letterSpacing: 1.2,
  },
  rightIconsScrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    paddingRight: 2,
  },
  actionIconBtn: {
    width: THEME.touch.min,
    height: THEME.touch.min,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionIconBtnActive: {
    borderColor: THEME.colors.accentAmber,
    backgroundColor: '#f59e0b18',
  },
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b15',
    borderWidth: 1,
    borderColor: '#f59e0b44',
    padding: 10,
    borderRadius: THEME.radius.md,
    marginBottom: 12,
    gap: 8,
  },
  fallbackNoticeText: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  headerBlock: {
    marginBottom: THEME.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaCode: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  metaRightPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  readTogglePillText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  offlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10b98122',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.full,
  },
  offlinePillText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.accentGreen,
  },
  title: {
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  subTitle: {
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 2,
  },
  galleryContainer: {
    marginVertical: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  mainImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#1e2638',
  },
  imageCaptionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  imageCaptionText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  quickGrid: {
    gap: 10,
    marginVertical: THEME.spacing.md,
  },
  quickCard: {
    padding: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
  },
  entranceCard: {
    borderColor: '#10b98144',
  },
  exitCard: {
    borderColor: '#ef444444',
  },
  quickCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  quickCardTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  quickCardItem: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 2,
  },
  sectionBlock: {
    marginVertical: THEME.spacing.md,
  },
  sectionHeaderRow: {
    borderBottomWidth: 1,
    paddingBottom: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: THEME.fonts.mono,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  narrativeBlock: {
    marginVertical: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  narrativeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  narrativeHeaderTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  epilogueBlock: {
    marginTop: THEME.spacing.lg,
    borderLeftColor: THEME.colors.accentAmber,
  },
  subItemsWrapper: {
    gap: 10,
  },
  subCard: {
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    padding: 12,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  subCardDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  subCardTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tabsContainer: {
    marginVertical: THEME.spacing.md,
  },
  tabsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tabsHeaderTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  tabButtonText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tabContentCard: {
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
  },
  tabContentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  tabContentTitle: {
    fontFamily: THEME.fonts.mono,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sagaCard: {
    marginVertical: THEME.spacing.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
  },
  sagaHeaderRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(245, 158, 11, 0.25)',
  },
  sagaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B1A',
    borderColor: '#F59E0B44',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  sagaBadgeText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 1,
  },
  sagaTitle: {
    fontFamily: THEME.fonts.mono,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sagaContent: {
    marginTop: 4,
  },
  accordionCard: {
    marginVertical: 6,
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  accordionTitleText: {
    fontFamily: THEME.fonts.mono,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  accordionBody: {
    padding: 14,
    borderTopWidth: 1,
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerNoticeText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  // --- Progress Bar ---
  progressBarTrack: {
    width: '100%',
    height: 3,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  progressBarFill: {
    height: '100%',
  },
  // --- Gallery & Lightbox ---
  mainImageTouchArea: {
    position: 'relative',
    width: '100%',
  },
  imageZoomBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#000000B0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: '#FFFFFF44',
  },
  imageZoomBadgeText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.8,
  },
  additionalGallery: {
    marginVertical: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    padding: 12,
  },
  additionalGalleryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  additionalGalleryTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  galleryThumbnailsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbnailCard: {
    width: 140,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: 88,
    backgroundColor: '#1b2234',
  },
  thumbnailCaptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 5,
    gap: 4,
  },
  thumbnailCaption: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    flex: 1,
  },
  // --- Floating TOC Button & Modal ---
  floatingTocBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: THEME.radius.full,
    borderWidth: 1.5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    zIndex: 90,
  },
  floatingTocBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  tocModalSheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: 28,
  },
  tocModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tocModalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tocModalHeaderTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tocSectionsList: {
    paddingHorizontal: 16,
  },
  tocSectionsListContent: {
    paddingVertical: 6,
  },
  tocItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tocItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  tocItemText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // --- Fullscreen Lightbox Modal ---
  lightboxOverlay: {
    flex: 1,
    backgroundColor: '#000000FA',
    justifyContent: 'space-between',
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    zIndex: 10,
  },
  lightboxCounterBadge: {
    backgroundColor: '#FFFFFF22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lightboxCounterText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  lightboxCloseBtn: {
    padding: 6,
  },
  lightboxScrollView: {
    flex: 1,
  },
  lightboxScrollContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxFooter: {
    paddingHorizontal: 18,
    paddingBottom: 36,
    paddingTop: 14,
    backgroundColor: '#0a0d14F0',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF1A',
  },
  lightboxCaptionText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  lightboxNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightboxNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF18',
    borderRadius: 6,
  },
  lightboxNavBtnDisabled: {
    opacity: 0.3,
  },
  lightboxNavBtnText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
