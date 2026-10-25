import React from 'react';
import { Text, StyleSheet, Linking } from 'react-native';
import { THEME } from '../constants/theme';
import { ItemCategory } from '../types/wikidot';
import {
  TextSegment,
  SPECIAL_ENTITIES,
  parseNoclipSegments,
} from '../services/wikidotService';

export interface NoclipTextProps {
  content?: string;
  fontSize?: number;
  lineHeight?: number;
  textColor?: string;
  onNavigate?: (path: string, category: ItemCategory) => void;
}

export {
  TextSegment,
  SPECIAL_ENTITIES,
  parseNoclipSegments,
};

function getCategoryColor(category?: ItemCategory): string {
  switch (category) {
    case 'entity':
      return THEME.colors.accentRed;
    case 'object':
      return THEME.colors.accentCyan;
    case 'phenomenon':
      return '#A855F7';
    case 'canon':
      return '#F59E0B';
    case 'tale':
      return '#10B981';
    case 'group':
      return '#3B82F6';
    case 'level':
    default:
      return THEME.colors.accentAmber;
  }
}

export function NoclipText({
  content = '',
  fontSize = 15,
  lineHeight = 24,
  textColor = THEME.colors.textPrimary,
  onNavigate,
}: NoclipTextProps) {
  if (!content) return null;

  const segments = parseNoclipSegments(content);

  const handlePress = async (seg: TextSegment) => {
    if (seg.isExternal && seg.path) {
      try {
        await Linking.openURL(seg.path);
      } catch (err) {
        console.warn('Could not open external URL:', seg.path, err);
      }
    } else if (seg.path && onNavigate) {
      onNavigate(seg.path, seg.category || 'level');
    }
  };

  return (
    <Text style={{ fontSize, lineHeight, color: textColor }}>
      {segments.map((seg, idx) => {
        if (seg.isLink && seg.path) {
          const isExt = !!seg.isExternal;
          const linkColor = isExt ? THEME.colors.accentCyan : getCategoryColor(seg.category);
          return (
            <Text
              key={idx}
              style={[
                styles.noclipLink,
                {
                  color: linkColor,
                  backgroundColor: `${linkColor}18`,
                  borderColor: `${linkColor}44`,
                },
              ]}
              onPress={() => handlePress(seg)}
            >
              {` ${seg.text} ↗ `}
            </Text>
          );
        }
        return <Text key={idx}>{seg.text}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  noclipLink: {
    fontFamily: THEME.fonts.mono,
    fontWeight: '800',
    textDecorationLine: 'underline',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
});
