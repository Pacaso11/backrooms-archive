import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { THEME } from '../constants/theme';

interface LanguageToggleProps {
  currentLang: 'es' | 'en';
  onToggle: (lang: 'es' | 'en') => void;
}

export function LanguageToggle({ currentLang, onToggle }: LanguageToggleProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.pill, currentLang === 'es' && styles.pillActive]}
        onPress={() => onToggle('es')}
      >
        <Text style={[styles.pillText, currentLang === 'es' && styles.pillTextActive]}>
          🇪🇸 ES
        </Text>
      </Pressable>

      <Pressable
        style={[styles.pill, currentLang === 'en' && styles.pillActive]}
        onPress={() => onToggle('en')}
      >
        <Text style={[styles.pillText, currentLang === 'en' && styles.pillTextActive]}>
          🇬🇧 EN
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.full,
    padding: 2,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    flexShrink: 0,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: THEME.colors.accentAmber,
  },
  pillText: {
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.textMuted,
  },
  pillTextActive: {
    color: '#000000',
  },
});
