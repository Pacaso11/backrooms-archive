import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { WikiListItem } from '../types/wikidot';
import { THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface LibraryItemCardProps {
  item: WikiListItem;
  categoryColor?: string;
  categoryBadge?: string;
  isSelected?: boolean;
  isRead?: boolean;
  onPress: () => void;
  onToggleRead?: () => void;
}

function LibraryItemCardComponent({
  item,
  categoryColor = '#00E5FF',
  categoryBadge = 'ARCH',
  isSelected,
  isRead,
  onPress,
  onToggleRead,
}: LibraryItemCardProps) {
  const cleanSub = item.subTitle
    ? item.subTitle.replace(/^["'«»“”„\s\-–—]+|["'«»“”„\s\-–—]+$/g, '').trim()
    : '';

  const tags = item.tags || [
    `#${categoryBadge}`,
    '#M.E.G.',
    '#Archivo',
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        isRead && styles.cardRead,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {/* Left Accent Stripe */}
      <View style={[styles.accentStripe, { backgroundColor: categoryColor }]} />

      <View style={styles.cardContent}>
        {/* Header: Tactical Badge + Language + Read Toggle */}
        <View style={styles.headerRow}>
          <View style={styles.badgesGroup}>
            <View style={[styles.codeBadge, { borderColor: `${categoryColor}55`, backgroundColor: `${categoryColor}15` }]}>
              <Text style={[styles.codeBadgeText, { color: categoryColor }]}>{categoryBadge}</Text>
            </View>
            {item.lang === 'es' && (
              <View style={styles.langBadge}>
                <Text style={styles.langBadgeText}>ES</Text>
              </View>
            )}
          </View>

          {/* Read Toggle */}
          {onToggleRead && (
            <Pressable
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={(e) => {
                e.stopPropagation();
                onToggleRead();
              }}
              style={styles.readToggleBtn}
              accessibilityLabel={isRead ? 'Desmarcar como leído' : 'Marcar como leído'}
            >
              <Ionicons
                name={isRead ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={20}
                color={isRead ? THEME.colors.accentGreen : THEME.colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.itemTitle,
              isRead && styles.itemTitleRead,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {cleanSub ? (
            <Text
              style={[
                styles.itemSubTitle,
                isRead && styles.itemSubTitleRead,
              ]}
              numberOfLines={2}
            >
              "{cleanSub}"
            </Text>
          ) : null}
        </View>

        {/* Snippet / Description Preview */}
        {item.snippet ? (
          <Text
            style={[
              styles.snippetText,
              isRead && styles.snippetTextRead,
            ]}
            numberOfLines={2}
          >
            {item.snippet}
          </Text>
        ) : null}

        {/* Footer: Tags & Action prompt */}
        <View style={styles.footerRow}>
          <View style={styles.tagsContainer}>
            {tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          <View style={styles.readAction}>
            <Text style={styles.readActionText}>ABRIR</Text>
            <Ionicons name="chevron-forward" size={13} color={categoryColor} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const LibraryItemCard = React.memo(LibraryItemCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.subTitle === nextProps.item.subTitle &&
    prevProps.item.lang === nextProps.item.lang &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isRead === nextProps.isRead &&
    prevProps.categoryColor === nextProps.categoryColor &&
    prevProps.categoryBadge === nextProps.categoryBadge
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: THEME.colors.accentCyan,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  cardRead: {
    opacity: 0.85,
    backgroundColor: '#070C10',
    borderColor: '#17232B',
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  accentStripe: {
    width: 4,
    height: '100%',
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  codeBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeBadgeText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  langBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  langBadgeText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
  },
  readToggleBtn: {
    padding: 2,
  },
  titleContainer: {
    marginBottom: 5,
  },
  itemTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 15,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    lineHeight: 20,
  },
  itemTitleRead: {
    color: THEME.colors.textSecondary,
  },
  itemSubTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    color: THEME.colors.accentCyan,
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemSubTitleRead: {
    color: '#4B6B7C',
  },
  snippetText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  snippetTextRead: {
    color: THEME.colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
    flex: 1,
  },
  tagChip: {
    backgroundColor: '#0F1722',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tagText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    color: THEME.colors.textMuted,
  },
  readAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 6,
  },
  readActionText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
});
