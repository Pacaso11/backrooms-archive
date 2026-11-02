import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function LoadingState({ message, tint = THEME.colors.accentAmber }: { message: string; tint?: string }) {
  return (
    <View style={styles.loadingContainer} accessibilityRole="progressbar" accessibilityLabel={message}>
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" color={tint} />
        <Text style={styles.loadingMessage}>{message}</Text>
      </View>
      {[0, 1, 2].map(index => (
        <View key={index} style={styles.skeletonCard}>
          <View style={[styles.skeletonLine, styles.skeletonCode]} />
          <View style={[styles.skeletonLine, styles.skeletonTitle]} />
          <View style={[styles.skeletonLine, styles.skeletonSubtitle]} />
        </View>
      ))}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  tint = THEME.colors.accentAmber,
}: {
  icon: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  tint?: string;
}) {
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { borderColor: `${tint}55`, backgroundColor: `${tint}14` }]}>
        <Ionicons name={icon} size={25} color={tint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={16} color={THEME.colors.background} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
    gap: THEME.spacing.sm,
  },
  loadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  loadingMessage: {
    flex: 1,
    color: THEME.colors.textSecondary,
    fontSize: THEME.type.label,
    fontWeight: '600',
  },
  skeletonCard: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    gap: 9,
  },
  skeletonLine: {
    height: 10,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surfaceHighlight,
  },
  skeletonCode: { width: '24%', height: 8 },
  skeletonTitle: { width: '68%', height: 14 },
  skeletonSubtitle: { width: '46%', height: 9 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.xxl,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderWidth: 1,
    borderRadius: THEME.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
  },
  emptyTitle: {
    color: THEME.colors.textPrimary,
    fontSize: THEME.type.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    color: THEME.colors.textSecondary,
    fontSize: THEME.type.body,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: THEME.spacing.xs,
    maxWidth: 360,
  },
  actionButton: {
    minHeight: THEME.touch.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.accentAmber,
  },
  actionText: {
    color: THEME.colors.background,
    fontSize: THEME.type.label,
    fontWeight: '800',
  },
  pressed: { opacity: 0.78 },
});
