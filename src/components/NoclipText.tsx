import React from 'react';
import { Text, StyleSheet, Linking, View } from 'react-native';
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
  lang?: 'es' | 'en';
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
  lang = 'es',
  onNavigate,
}: NoclipTextProps) {
  if (!content) return null;

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

  const renderInline = (text: string, keyPrefix: string, style?: object) => {
    const segments = parseNoclipSegments(text);
    return (
      <Text style={[{ fontSize, lineHeight, color: textColor }, style]}>
        {segments.map((seg, idx) => {
          if (!seg.text.trim()) return null;
          if (!seg.isLink || !seg.path) return <Text key={`${keyPrefix}-${idx}`}>{seg.text}</Text>;
          const linkColor = seg.isExternal ? THEME.colors.accentCyan : getCategoryColor(seg.category);
          return (
            <Text
              key={`${keyPrefix}-${idx}`}
              accessibilityRole="link"
              accessibilityLabel={seg.isExternal ? `Open external link: ${seg.text}` : `Open dossier: ${seg.text}`}
              style={[styles.noclipLink, { color: linkColor, backgroundColor: `${linkColor}18`, borderColor: `${linkColor}44` }]}
              onPress={() => handlePress(seg)}
            >
              {` ${seg.text} ↗ `}
            </Text>
          );
        })}
      </Text>
    );
  };

  const blocks: { kind: 'paragraph' | 'heading' | 'file' | 'query' | 'response' | 'field' | 'bullet' | 'numbered' | 'tableRow' | 'quote' | 'entry'; text: string; label?: string; depth?: number; cells?: string[] }[] = [];
  let paragraph: string[] = [];
  let pendingDialogue: { kind: 'query' | 'response'; label?: string } | null = null;
  let pendingField: string | null = null;
  const flushParagraph = () => {
    const text = paragraph.join('\n').trim();
    if (text) {
      const sentences = text.length > 420
        ? text.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ“"'(])/)
        : [text];
      let chunk = '';
      for (const sentence of sentences) {
        if (chunk && chunk.length + sentence.length > 360) {
          blocks.push({ kind: 'paragraph', text: chunk });
          chunk = sentence;
        } else {
          chunk = chunk ? `${chunk} ${sentence}` : sentence;
        }
      }
      if (chunk) blocks.push({ kind: 'paragraph', text: chunk });
    }
    paragraph = [];
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }
    if (/^(?:[•●▪◦‣*-]|↳{1,3}|\d+[.)])$/.test(line)) {
      flushParagraph();
      continue;
    }

    const file = line.match(/^(?:(?:PERSONNEL|DEL\s+PERSONAL)\s+)?(?:FILE|ARCHIVO|EXPEDIENTE)\s*:\s*(.*)$/i);
    const query = line.match(/^(?:QUERY|CONSULTA|PREGUNTA)\s*:\s*(.*)$/i);
    const response = line.match(/^(?:RESPONSE|COUNTERQUERY|RESPUESTA|CONTRACONSULTA|CONTRAPREGUNTA)\s*:\s*(.*)$/i);
    const strongHeading = line.match(/^\*\*(.+?)\*\*$/);
    const markdownHeading = line.match(/^#{1,6}\s+(.+)$/);
    const field = line.match(/^([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ0-9 ./()_-]{1,34}:)\s*(.*)$/i);
    const tableRow = line.includes(' | ') ? line.split(' | ').map(cell => cell.trim()).filter(Boolean) : null;
    const bullet = line.match(/^([•●▪◦‣*-])\s+(.+)$/);
    const numbered = line.match(/^(↳{0,3}\s*)?(\d+)[.)]\s+(.+)$/);
    const quote = line.match(/^>\s?(.*)$/);
    const rosterEntry = line.length <= 36 && /^[A-ZÁÉÍÓÚÜÑ0-9][A-ZÁÉÍÓÚÜÑ0-9 ,.'’()-]+$/.test(line) && /[A-ZÁÉÍÓÚÜÑ]/.test(line);

    if (pendingField) {
      const nextFieldStartsHere = file || query || response || strongHeading || markdownHeading || field;
      if (!nextFieldStartsHere) {
        flushParagraph();
        blocks.push({ kind: 'field', label: pendingField, text: line });
        pendingField = null;
        continue;
      }
      pendingField = null;
    }

    if (pendingDialogue) {
      const nextBlockStartsHere = file || query || response || strongHeading || markdownHeading || field;
      if (!nextBlockStartsHere) {
        flushParagraph();
        blocks.push({ ...pendingDialogue, text: line });
        pendingDialogue = null;
        continue;
      }
      pendingDialogue = null;
    }

    if (file || query || response || strongHeading || markdownHeading || field || tableRow || bullet || numbered || quote || rosterEntry) flushParagraph();
    if (file) {
      if (file[1].trim()) blocks.push({
        kind: 'file',
        label: /PERSONNEL|DEL\s+PERSONAL/i.test(file[0])
          ? (lang === 'es' ? 'EXPEDIENTE DE PERSONAL' : 'PERSONNEL FILE')
          : (lang === 'es' ? 'ARCHIVO' : 'FILE'),
        text: file[1],
      });
    }
    else if (query) {
      if (query[1].trim()) blocks.push({ kind: 'query', text: query[1] });
      else pendingDialogue = { kind: 'query' };
    }
    else if (response) {
      const label = /COUNTERQUERY|CONTRACONSULTA|CONTRAPREGUNTA/i.test(response[0])
        ? (lang === 'es' ? 'CONTRACONSULTA' : 'COUNTERQUERY')
        : (lang === 'es' ? 'RESPUESTA' : 'RESPONSE');
      if (response[1].trim()) blocks.push({ kind: 'response', label, text: response[1] });
      else pendingDialogue = { kind: 'response', label };
    }
    else if (strongHeading || markdownHeading) blocks.push({ kind: 'heading', text: (strongHeading || markdownHeading)![1] });
    else if (tableRow && tableRow.length > 1) blocks.push({ kind: 'tableRow', text: '', cells: tableRow });
    else if (field && /^(?:BODY|CUERPO)$/i.test(field[1].slice(0, -1))) {
      if (field[2].trim()) blocks.push({ kind: 'paragraph', text: field[2].trim() });
    }
    else if (field) {
      if (field[2].trim()) blocks.push({ kind: 'field', label: field[1].slice(0, -1), text: field[2] });
      else pendingField = field[1].slice(0, -1);
    }
    else if (bullet) blocks.push({ kind: 'bullet', text: bullet[2], depth: Math.max(0, ['•', '◦', '▪', '‣'].indexOf(bullet[1])) });
    else if (numbered) blocks.push({ kind: 'numbered', text: numbered[3], label: `${numbered[2]}.`, depth: (numbered[1].match(/↳/g) || []).length });
    else if (quote) blocks.push({ kind: 'quote', text: quote[1] });
    else if (rosterEntry) blocks.push({ kind: 'entry', text: line });
    else paragraph.push(line);
  }
  flushParagraph();
  if (blocks.length === 0) return null;

  return (
    <View style={styles.contentBlocks}>
      {blocks.map((block, idx) => {
        if (block.kind === 'file' || block.kind === 'heading') {
          return (
            <View key={idx} style={[styles.archiveHeading, { borderColor: `${THEME.colors.accentAmber}55` }]}>
              <Text style={[styles.archiveEyebrow, { color: THEME.colors.accentAmber }]}>{block.label}</Text>
              {renderInline(block.text, `block-${idx}`, { fontWeight: '800', fontSize: fontSize + 1 })}
            </View>
          );
        }
        if (block.kind === 'field') {
          return (
            <View key={idx} style={[styles.fieldRow, { borderBottomColor: `${THEME.colors.textMuted}33` }]}>
              <Text style={[styles.fieldLabel, { fontSize: Math.max(11, fontSize - 2), color: THEME.colors.accentAmber }]}>{block.label}</Text>
              <View style={styles.fieldValue}>{renderInline(block.text, `field-${idx}`, { fontSize: Math.max(12, fontSize - 1) })}</View>
            </View>
          );
        }
        if (block.kind === 'tableRow') {
          return (
            <View key={idx} style={[styles.tableCard, { borderColor: `${THEME.colors.accentAmber}33`, backgroundColor: `${THEME.colors.accentAmber}0A` }]}>
              <Text style={[styles.archiveEyebrow, { color: THEME.colors.accentAmber }]}>{renderInline(block.cells![0], `table-label-${idx}`, { fontSize: Math.max(10, fontSize - 3) })}</Text>
              {block.cells!.slice(1).map((cell, cellIndex) => <View key={cellIndex}>{renderInline(cell, `table-cell-${idx}-${cellIndex}`)}</View>)}
            </View>
          );
        }
        if (block.kind === 'query' || block.kind === 'response') {
          const isQuery = block.kind === 'query';
          const accent = isQuery ? THEME.colors.accentCyan : THEME.colors.accentGreen;
          return (
            <View key={idx} style={[styles.dialogueBlock, { borderLeftColor: accent, backgroundColor: `${accent}0D` }]}>
              <Text style={[styles.archiveEyebrow, { color: accent }]}>{isQuery ? (lang === 'es' ? 'CONSULTA' : 'QUERY') : block.label}</Text>
              {renderInline(block.text, `dialogue-${idx}`)}
            </View>
          );
        }
        if (block.kind === 'bullet') {
          return (
            <View key={idx} style={[styles.bulletRow, { marginLeft: (block.depth || 0) * 12 }]}>
              <Text style={[styles.bulletMark, { color: THEME.colors.accentAmber }]}>•</Text>
              <View style={styles.bulletText}>{renderInline(block.text, `bullet-${idx}`)}</View>
            </View>
          );
        }
        if (block.kind === 'numbered') {
          return (
            <View key={idx} style={[styles.bulletRow, { marginLeft: (block.depth || 0) * 12 }]}>
              <Text style={[styles.numberMark, { color: THEME.colors.accentAmber }]}>{block.label}</Text>
              <View style={styles.bulletText}>{renderInline(block.text, `numbered-${idx}`)}</View>
            </View>
          );
        }
        if (block.kind === 'quote') {
          return (
            <View key={idx} style={[styles.quoteBlock, { borderLeftColor: THEME.colors.accentAmber }]}>
              {renderInline(block.text, `quote-${idx}`, { fontStyle: 'italic', color: textColor })}
            </View>
          );
        }
        if (block.kind === 'entry') {
          return (
            <View key={idx} style={[styles.entryRow, { borderColor: `${THEME.colors.accentAmber}33`, backgroundColor: `${THEME.colors.accentAmber}0A` }]}>
              <View style={[styles.entryMark, { backgroundColor: THEME.colors.accentAmber }]} />
              {renderInline(block.text, `entry-${idx}`, { fontFamily: THEME.fonts.mono, fontSize: Math.max(11, fontSize - 2), fontWeight: '700' })}
            </View>
          );
        }
        return <View key={idx} style={styles.paragraph}>{renderInline(block.text, `paragraph-${idx}`)}</View>;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contentBlocks: { gap: 10 },
  paragraph: { marginBottom: 2 },
  archiveHeading: { borderLeftWidth: 2, paddingLeft: 11, paddingVertical: 6, marginTop: 5 },
  archiveEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 4 },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  fieldLabel: { width: 94, fontFamily: THEME.fonts.mono, fontWeight: '800', letterSpacing: 0.4 },
  fieldValue: { flex: 1 },
  tableCard: { borderWidth: 1, borderRadius: 6, padding: 10, gap: 5 },
  dialogueBlock: { borderLeftWidth: 3, borderRadius: 6, padding: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 4 },
  bulletMark: { fontSize: 16, lineHeight: 22, fontWeight: '900' },
  numberMark: { minWidth: 24, fontSize: 12, lineHeight: 22, fontFamily: THEME.fonts.mono, fontWeight: '800' },
  bulletText: { flex: 1 },
  quoteBlock: { borderLeftWidth: 2, paddingLeft: 11, paddingVertical: 3 },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 5, paddingHorizontal: 9, paddingVertical: 6 },
  entryMark: { width: 5, height: 5, borderRadius: 3 },
  noclipLink: {
    fontFamily: THEME.fonts.sans,
    fontWeight: '700',
    textDecorationLine: 'underline',
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
});
