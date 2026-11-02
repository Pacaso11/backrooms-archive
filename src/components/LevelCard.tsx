import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { WikiListItem } from '../types/wikidot';
import { THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface LevelCardProps {
  item: WikiListItem;
  isSelected?: boolean;
  isRead?: boolean;
  onPress: () => void;
  onToggleRead?: () => void;
}

function LevelCardComponent({
  item,
  isSelected,
  isRead,
  onPress,
  onToggleRead,
}: LevelCardProps) {
  // Only display genuine classification if present (no fabricated Math.floor(num) classes)
  const genuineClass = item.previewClass?.trim();
  let stripeColor = THEME.colors.accentAmber;

  if (genuineClass) {
    const lower = genuineClass.toLowerCase();
    if (lower.includes('0') || lower.includes('habitable') || lower.includes('seguro') || lower.includes('safe')) {
      stripeColor = THEME.colors.accentGreen;
    } else if (lower.includes('1')) {
      stripeColor = THEME.colors.accentCyan;
    } else if (lower.includes('2') || lower.includes('3')) {
      stripeColor = THEME.colors.accentAmber;
    } else if (lower.includes('4') || lower.includes('5') || lower.includes('deadzone') || lower.includes('peligro') || lower.includes('hazard')) {
      stripeColor = THEME.colors.accentRed;
    } else {
      stripeColor = '#a855f7';
    }
  }

  const tags = item.tags || [
    item.numberStr.includes('.') ? 'Subnivel' : 'Nivel',
    'M.E.G.',
  ];

  const cleanSub = item.subTitle
    ? item.subTitle.replace(/^["'«»“”„\s\-–—]+|["'«»“”„\s\-–—]+$/g, '').trim()
    : '';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        isRead && styles.cardRead,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.displayName}${genuineClass ? `, ${genuineClass}` : ''}${isRead ? ', leído' : ''}`}
    >
      {/* Left Hazard Accent Stripe (OnlySCP aesthetic) */}
      <View style={[styles.hazardStripe, { backgroundColor: stripeColor }]} />

      <View style={styles.cardContent}>
        {/* Top Header: Tactical ID + Danger Class + Interactive Read Status Toggle */}
        <View style={styles.headerRow}>
          <View style={styles.badgesGroup}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>LVL-{item.numberStr}</Text>
            </View>
            {genuineClass ? (
              <View style={[styles.classBadge, { borderColor: `${stripeColor}55`, backgroundColor: `${stripeColor}15` }]}>
                <Text style={[styles.classBadgeText, { color: stripeColor }]}>{genuineClass}</Text>
              </View>
            ) : null}
            {item.lang === 'es' && (
              <View style={styles.langBadge}>
                <Text style={styles.langBadgeText}>ES</Text>
              </View>
            )}
          </View>

          {/* Interactive Checkmark / Unmark Button */}
          {onToggleRead && (
            <Pressable
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={(e) => {
                e.stopPropagation();
                onToggleRead();
              }}
              style={styles.readToggleBtn}
              accessibilityLabel={isRead ? 'Desmarcar como leído' : 'Marcar como leído'}
              accessibilityRole="button"
              accessibilityState={{ selected: !!isRead }}
            >
              <Ionicons
                name={isRead ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={20}
                color={isRead ? THEME.colors.accentGreen : THEME.colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* Title and Subtitle with optional Thumbnail */}
        <View style={styles.titleAndThumbRow}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, isRead && styles.titleRead]} numberOfLines={1}>
              {item.title}
            </Text>
            {cleanSub ? (
              <Text style={styles.subTitle} numberOfLines={1}>
                "{cleanSub}"
              </Text>
            ) : null}
          </View>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.cardThumbnail}
              resizeMode="cover"
            />
          ) : null}
        </View>

        {/* Dossier Preview Snippet */}
        {item.snippet && (
          <Text style={styles.snippetText} numberOfLines={2}>
            {item.snippet}
          </Text>
        )}

        {/* Tags Row */}
        <View style={styles.tagsRow}>
          {tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tagChip}>
              <Text style={styles.tagChipText}>#{tag}</Text>
            </View>
          ))}
          <View style={styles.arrowPlaceholder}>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={isSelected ? THEME.colors.accentAmber : THEME.colors.textMuted}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const LevelCard = React.memo(LevelCardComponent, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.isSelected === next.isSelected &&
    prev.isRead === next.isRead &&
    prev.item.title === next.item.title &&
    prev.item.subTitle === next.item.subTitle &&
    prev.item.lang === next.item.lang
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surface,
    marginVertical: 5,
    marginHorizontal: 1,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: THEME.colors.accentAmber,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  cardRead: {
    backgroundColor: '#111720',
  },
  cardPressed: {
    opacity: 0.75,
  },
  hazardStripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    minHeight: 22,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  codeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBadgeText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  classBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classBadgeText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  langBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    backgroundColor: '#3b82f622',
    borderWidth: 0.5,
    borderColor: '#3b82f655',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langBadgeText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    fontWeight: '700',
    color: '#60a5fa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  readToggleBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleAndThumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  titleSection: {
    flex: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: THEME.fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.2,
  },
  titleRead: {
    color: '#cbd5e1',
  },
  subTitle: {
    fontFamily: THEME.fonts.sans,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#94a3b8',
    marginTop: 1,
  },
  snippetText: {
    fontFamily: THEME.fonts.sans,
    fontSize: THEME.type.label,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: '#182030',
    borderWidth: 0.5,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagChipText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9.5,
    color: '#94a3b8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  arrowPlaceholder: {
    marginLeft: 'auto',
    paddingLeft: 4,
  },
});
