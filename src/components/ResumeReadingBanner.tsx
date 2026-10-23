import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LastReadSession } from '../types/wikidot';
import { THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ResumeReadingBannerProps {
  session: LastReadSession;
  onPress: () => void;
  onDismiss?: () => void;
}

export function ResumeReadingBanner({ session, onPress, onDismiss }: ResumeReadingBannerProps) {
  const percent = Math.round(session.scrollPercent || 0);

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.iconBox}>
        <Ionicons name="book-outline" size={20} color={THEME.colors.accentAmber} />
      </View>

      <View style={styles.infoCol}>
        <View style={styles.topRow}>
          <Text style={styles.tagText}>CONTINUAR LECTURA</Text>
          <Text style={styles.percentText}>{percent > 0 ? `${percent}%` : 'Inicio'}</Text>
        </View>
        <Text style={styles.titleText} numberOfLines={1}>
          {session.displayName || session.title}
        </Text>
      </View>

      <View style={styles.actionCol}>
        <Ionicons name="play-circle" size={26} color={THEME.colors.accentAmber} />
        {onDismiss && (
          <Pressable
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            style={styles.dismissBtn}
            accessibilityLabel="Descartar aviso de lectura"
          >
            <Ionicons name="close" size={16} color={THEME.colors.textMuted} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b16',
    borderWidth: 1.5,
    borderColor: '#f59e0b55',
    borderRadius: THEME.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.sm,
    backgroundColor: '#f59e0b22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tagText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: THEME.colors.accentAmber,
    letterSpacing: 1,
  },
  percentText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  actionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  dismissBtn: {
    padding: 4,
    borderRadius: THEME.radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
