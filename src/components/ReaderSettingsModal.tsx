import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { ReaderFontSize, ReaderSettings, ReaderThemeMode } from '../types/wikidot';
import { READER_FONT_SIZES, READER_THEMES, THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ReaderSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdateSettings: (settings: ReaderSettings) => void;
}

export function ReaderSettingsModal({
  visible,
  onClose,
  settings,
  onUpdateSettings,
}: ReaderSettingsModalProps) {
  const fontSizes: ReaderFontSize[] = ['compact', 'normal', 'large', 'huge'];
  const themes: ReaderThemeMode[] = ['meg', 'sepia', 'midnight'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.contentBox} onPress={e => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="text-outline" size={20} color={THEME.colors.accentAmber} />
              <Text style={styles.headerTitle}>AJUSTES DE LECTURA</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={THEME.colors.textMuted} />
            </Pressable>
          </View>

          {/* Font Size Selector */}
          <Text style={styles.sectionLabel}>TAMAÑO DE FUENTE</Text>
          <View style={styles.optionsRow}>
            {fontSizes.map(size => {
              const meta = READER_FONT_SIZES[size];
              const isSelected = settings.fontSize === size;
              return (
                <Pressable
                  key={size}
                  style={[styles.sizePill, isSelected && styles.sizePillActive]}
                  onPress={() => onUpdateSettings({ ...settings, fontSize: size })}
                >
                  <Text style={[styles.sizePillText, isSelected && styles.sizePillTextActive]}>
                    {meta.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Theme Selector */}
          <Text style={styles.sectionLabel}>TEMA VISUAL</Text>
          <View style={styles.themesRow}>
            {themes.map(t => {
              const themeMeta = READER_THEMES[t];
              const isSelected = settings.theme === t;
              return (
                <Pressable
                  key={t}
                  style={[
                    styles.themeCard,
                    { backgroundColor: themeMeta.background, borderColor: isSelected ? themeMeta.accent : themeMeta.surfaceBorder },
                    isSelected && styles.themeCardActive,
                  ]}
                  onPress={() => onUpdateSettings({ ...settings, theme: t })}
                >
                  <View style={[styles.themeColorDot, { backgroundColor: themeMeta.accent }]} />
                  <Text style={[styles.themeCardText, { color: themeMeta.textPrimary }]}>
                    {themeMeta.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Live Preview */}
          <View
            style={[
              styles.previewBox,
              { backgroundColor: READER_THEMES[settings.theme].surface, borderColor: READER_THEMES[settings.theme].surfaceBorder },
            ]}
          >
            <Text
              style={{
                fontSize: READER_FONT_SIZES[settings.fontSize].body,
                lineHeight: READER_FONT_SIZES[settings.fontSize].lineHeight,
                color: READER_THEMES[settings.theme].textPrimary,
              }}
            >
              "Los Backrooms son una extensión infinita de habitaciones vacías con olor a moqueta húmeda y zumbido constante de luces fluorescentes..."
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  contentBox: {
    backgroundColor: THEME.colors.backgroundSecondary,
    borderTopLeftRadius: THEME.radius.lg,
    borderTopRightRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    padding: 20,
    paddingBottom: 36,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: 1.2,
  },
  closeBtn: {
    padding: 4,
  },
  sectionLabel: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  sizePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizePillActive: {
    borderColor: THEME.colors.accentAmber,
    backgroundColor: '#f59e0b22',
  },
  sizePillText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  sizePillTextActive: {
    color: THEME.colors.accentAmber,
  },
  themesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  themeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.sm,
    borderWidth: 1.5,
    gap: 6,
  },
  themeCardActive: {
    transform: [{ scale: 1.02 }],
  },
  themeColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeCardText: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewBox: {
    marginTop: 6,
    padding: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
  },
});
