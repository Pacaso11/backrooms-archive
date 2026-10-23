import React from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { THEME } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search by name, number...', onClear }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={THEME.colors.textMuted} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={THEME.colors.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <Pressable
          onPress={onClear || (() => onChangeText(''))}
          style={({ pressed }) => [styles.clearBtn, pressed && styles.clearBtnPressed]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Borrar búsqueda"
        >
          <Ionicons name="close-circle" size={19} color={THEME.colors.accentAmber} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceBorder,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnPressed: {
    opacity: 0.6,
  },
});
