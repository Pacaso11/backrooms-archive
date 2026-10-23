import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { THEME } from '../constants/theme';

export type HazardFilter = 'all' | '0-1' | '2-3' | '4-5' | 'special';

interface HazardFilterBarProps {
  currentFilter: HazardFilter;
  onSelectFilter: (filter: HazardFilter) => void;
  lang?: 'es' | 'en';
}

export function HazardFilterBar({ currentFilter, onSelectFilter, lang = 'es' }: HazardFilterBarProps) {
  const filters: { key: HazardFilter; label: string; dotColor?: string }[] = [
    { key: 'all', label: lang === 'es' ? 'TODOS' : 'ALL' },
    { key: '0-1', label: lang === 'es' ? 'CLASE 0-1 (SEGURO)' : 'CLASS 0-1 (SAFE)', dotColor: '#22c55e' },
    { key: '2-3', label: lang === 'es' ? 'CLASE 2-3 (INSEGURO)' : 'CLASS 2-3 (UNSAFE)', dotColor: '#f97316' },
    { key: '4-5', label: lang === 'es' ? 'CLASE 4-5 (PELIGRO)' : 'CLASS 4-5 (DANGER)', dotColor: '#ef4444' },
    { key: 'special', label: lang === 'es' ? 'ENIGMÁTICOS / DEADZONE' : 'ENIGMATIC / DEADZONE', dotColor: '#c084fc' },
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
    borderColor: THEME.colors.accentAmber,
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
    color: THEME.colors.accentAmber,
  },
});
