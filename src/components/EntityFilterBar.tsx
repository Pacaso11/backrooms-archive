import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { THEME } from '../constants/theme';

export type EntityFilter = 'all' | 'passive' | 'hostile' | 'anomalous' | 'special';

interface EntityFilterBarProps {
  currentFilter: EntityFilter;
  onSelectFilter: (filter: EntityFilter) => void;
  lang?: 'es' | 'en';
}

export function EntityFilterBar({ currentFilter, onSelectFilter, lang = 'es' }: EntityFilterBarProps) {
  const filters: { key: EntityFilter; label: string; dotColor?: string }[] = [
    { key: 'all', label: lang === 'es' ? 'TODAS' : 'ALL' },
    { key: 'passive', label: lang === 'es' ? 'DÓCIL / SEGURA' : 'DOCILE / SAFE', dotColor: '#10b981' },
    { key: 'hostile', label: lang === 'es' ? 'HOSTIL / PELIGRO' : 'HOSTILE / DANGER', dotColor: '#ef4444' },
    { key: 'anomalous', label: lang === 'es' ? 'ANÓMALA / VARIABLE' : 'ANOMALOUS / VARIABLE', dotColor: '#f59e0b' },
    { key: 'special', label: lang === 'es' ? 'ENIGMÁTICA' : 'ENIGMATIC', dotColor: '#c084fc' },
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
        {filters.map(f => {
          const isSelected = currentFilter === f.key;
          return (
            <Pressable
              key={f.key}
              style={[
                styles.chip,
                isSelected && styles.chipActive,
                f.dotColor && isSelected ? { borderColor: f.dotColor } : undefined,
              ]}
              onPress={() => onSelectFilter(f.key)}
            >
              {f.dotColor ? (
                <View style={[styles.dot, { backgroundColor: f.dotColor }]} />
              ) : null}
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextActive,
                  f.dotColor && isSelected ? { color: f.dotColor } : undefined,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 4,
  },
  container: {
    paddingHorizontal: 12,
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    gap: 6,
  },
  chipActive: {
    backgroundColor: THEME.colors.surfaceHighlight,
    borderColor: THEME.colors.accentRed,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.textMuted,
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: THEME.colors.accentRed,
  },
});
