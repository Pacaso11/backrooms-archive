import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';
import { ItemCategory } from '../types/wikidot';

interface NoclipTextProps {
  content: string;
  fontSize?: number;
  lineHeight?: number;
  textColor?: string;
  onNavigate?: (path: string, category: ItemCategory) => void;
}

interface TextSegment {
  text: string;
  isLink?: boolean;
  path?: string;
  category?: ItemCategory;
}

// Named entity mapping for known lore creatures
const SPECIAL_ENTITIES: Record<string, string> = {
  smiler: 'entity-3',
  smilers: 'entity-3',
  sonrientes: 'entity-3',
  hound: 'entity-8',
  hounds: 'entity-8',
  sabueso: 'entity-8',
  sabuesos: 'entity-8',
  'skin-stealer': 'entity-10',
  'skin-stealers': 'entity-10',
  'ladrones de piel': 'entity-10',
  'roba pieles': 'entity-10',
  deathmoth: 'entity-4',
  deathmoths: 'entity-4',
  faceling: 'entity-9',
  facelings: 'entity-9',
  infaciales: 'entity-9',
};

function getCategoryColor(category?: ItemCategory): string {
  switch (category) {
    case 'level':
      return THEME.colors.accentAmber;
    case 'entity':
      return '#EF4444';
    case 'object':
      return '#00E5FF';
    case 'phenomenon':
      return '#A855F7';
    case 'group':
      return '#3B82F6';
    case 'tale':
      return '#10B981';
    case 'canon':
    default:
      return '#F59E0B';
  }
}

export function NoclipText({
  content,
  fontSize = 15,
  lineHeight = 24,
  textColor = THEME.colors.textPrimary,
  onNavigate,
}: NoclipTextProps) {
  if (!onNavigate) {
    return <Text style={{ fontSize, lineHeight, color: textColor }}>{content}</Text>;
  }

  // Regex to match:
  // 1 & 2: Markdown links [Title](path)
  // 3: Levels
  // 4: Entities
  // 5: Objects
  // 6: Phenomena
  // 7: Special named creatures
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|(?:Nivel|Level)\s+(\d+(?:\.\d+)?)|(?:Entidad|Entity)\s+(\d+)|(?:Objeto|Object)\s+(\d+)|(?:Fen[oó]meno|Phenomenon)\s+(\d+)|(\b(?:smilers?|sonrientes|hounds?|sabuesos?|skin-stealers?|ladrones de piel|roba pieles|deathmoths?|facelings?|infaciales)\b)/gi;

  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    // Normal text before match
    if (match.index > lastIndex) {
      segments.push({ text: content.substring(lastIndex, match.index) });
    }

    const matchedText = match[0];
    const mdTitle = match[1];
    const mdPath = match[2];
    const levelNum = match[3];
    const entityNum = match[4];
    const objectNum = match[5];
    const phenomNum = match[6];
    const namedMonster = match[7];

    if (mdTitle && mdPath) {
      const cleanPath = mdPath.trim().startsWith('/') ? mdPath.trim() : `/${mdPath.trim()}`;
      let cat: ItemCategory = 'canon';
      if (cleanPath.startsWith('/level-') || cleanPath.startsWith('/nivel-')) cat = 'level';
      else if (cleanPath.startsWith('/entity-') || cleanPath.startsWith('/entidad-')) cat = 'entity';
      else if (cleanPath.startsWith('/object-') || cleanPath.startsWith('/objeto-')) cat = 'object';
      else if (cleanPath.startsWith('/phenomenon-') || cleanPath.startsWith('/fenomeno-')) cat = 'phenomenon';
      else if (cleanPath.includes('tale') || cleanPath.includes('relato')) cat = 'tale';
      else if (cleanPath.includes('group') || cleanPath.includes('grupo')) cat = 'group';

      segments.push({
        text: mdTitle.trim(),
        isLink: true,
        path: cleanPath,
        category: cat,
      });
    } else if (levelNum) {
      const cleanNum = levelNum.replace('.', '-');
      segments.push({
        text: matchedText,
        isLink: true,
        path: `/level-${cleanNum}`,
        category: 'level',
      });
    } else if (entityNum) {
      segments.push({
        text: matchedText,
        isLink: true,
        path: `/entity-${entityNum}`,
        category: 'entity',
      });
    } else if (objectNum) {
      segments.push({
        text: matchedText,
        isLink: true,
        path: `/object-${objectNum}`,
        category: 'object',
      });
    } else if (phenomNum) {
      segments.push({
        text: matchedText,
        isLink: true,
        path: `/phenomenon-${phenomNum}`,
        category: 'phenomenon',
      });
    } else if (namedMonster) {
      const targetSlug = SPECIAL_ENTITIES[namedMonster.toLowerCase()];
      if (targetSlug) {
        segments.push({
          text: matchedText,
          isLink: true,
          path: `/${targetSlug}`,
          category: 'entity',
        });
      } else {
        segments.push({ text: matchedText });
      }
    } else {
      segments.push({ text: matchedText });
    }

    lastIndex = pattern.lastIndex;
  }

  // Trailing text
  if (lastIndex < content.length) {
    segments.push({ text: content.substring(lastIndex) });
  }

  return (
    <Text style={{ fontSize, lineHeight, color: textColor }}>
      {segments.map((seg, idx) => {
        if (seg.isLink && seg.path && seg.category) {
          const linkColor = getCategoryColor(seg.category);
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
              onPress={() => onNavigate(seg.path!, seg.category!)}
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
