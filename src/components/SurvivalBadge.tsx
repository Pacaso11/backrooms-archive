import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SurvivalClassification } from '../types/wikidot';
import { THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import {
  TRAIT_TRANSLATIONS,
  DEFAULT_TRAITS_BY_CLASS,
  translateTrait,
  getSurvivalDifficultyFallback,
} from '../services/wikidotService';

interface SurvivalBadgeProps {
  classification?: SurvivalClassification;
  lang?: 'es' | 'en';
}

export {
  TRAIT_TRANSLATIONS,
  DEFAULT_TRAITS_BY_CLASS,
  translateTrait,
  getSurvivalDifficultyFallback,
};

const isPlaceholder = (t?: string) => !t || /^\{?\$[a-zA-Z0-9_-]+\}?$/.test(t.trim());

export function SurvivalBadge({ classification, lang = 'es' }: SurvivalBadgeProps) {
  if (!classification) return null;

  const color = classification.color || '#94a3b8';
  let label = classification.badgeText || (classification.classLevel ? `CLASS ${classification.classLevel.toUpperCase()}` : (lang === 'es' ? 'CLASE INDETERMINADA' : 'UNDETERMINED CLASS'));
  if (lang === 'es') {
    label = label
      .replace(/\bCLASS\b/i, 'CLASE')
      .replace(/\bHABITABLE\b/i, 'HABITABLE')
      .replace(/\bDEADZONE\b/i, 'ZONA MUERTA')
      .replace(/\bPENDING\b/i, 'PENDIENTE');
  }

  const fallback = getSurvivalDifficultyFallback(classification.classLevel, lang);

  const safety = !isPlaceholder(classification.safety) ? classification.safety : fallback.safety;
  const security = !isPlaceholder(classification.security) ? classification.security : fallback.security;
  const entityCount = !isPlaceholder(classification.entityCount) ? classification.entityCount : fallback.entityCount;

  return (
    <View style={[styles.container, { borderColor: color }]}>
      {/* Top Banner */}
      <View style={[styles.topBanner, { backgroundColor: color }]}>
        <View style={styles.diamondWrapper}>
          <View style={styles.diamond}>
            <Ionicons name="warning" size={14} color="#000" />
          </View>
        </View>
        <View style={styles.bannerTextCol}>
          <Text style={styles.bannerSub}>
            {lang === 'es' ? 'DIFICULTAD DE SUPERVIVENCIA:' : 'SURVIVAL DIFFICULTY:'}
          </Text>
          <Text style={styles.bannerTitle}>{label}</Text>
        </View>
      </View>

      {/* Attributes List */}
      <View style={styles.traitsContainer}>
        {safety ? (
          <View style={styles.traitRow}>
            <View style={[styles.traitDot, { backgroundColor: color }]} />
            <Text style={styles.traitText}>{translateTrait(safety, lang)}</Text>
          </View>
        ) : null}

        {security ? (
          <View style={styles.traitRow}>
            <View style={[styles.traitDot, { backgroundColor: color }]} />
            <Text style={styles.traitText}>{translateTrait(security, lang)}</Text>
          </View>
        ) : null}

        {entityCount ? (
          <View style={styles.traitRow}>
            <View style={[styles.traitDot, { backgroundColor: color }]} />
            <Text style={styles.traitText}>{translateTrait(entityCount, lang)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    borderWidth: 1.5,
    backgroundColor: THEME.colors.surface,
    overflow: 'hidden',
  },
  topBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  diamondWrapper: {
    marginRight: 10,
  },
  diamond: {
    width: 26,
    height: 26,
    backgroundColor: '#ffffff',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerSub: {
    fontFamily: THEME.fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 1.5,
  },
  bannerTitle: {
    fontFamily: THEME.fonts.mono,
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
  traitsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: THEME.colors.backgroundSecondary,
  },
  traitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  traitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  traitText: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
