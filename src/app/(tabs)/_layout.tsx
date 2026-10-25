import React from 'react';
import { Tabs } from 'expo-router';
import { THEME } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isEs } = useLanguage();
  // Dynamically calculate bottom padding to elevate above Android 3-button navigation bar / gesture bar
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 2 : 8;
  const tabHeight = 54 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: THEME.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: THEME.colors.surfaceBorder,
        },
        headerTitleStyle: {
          fontFamily: THEME.fonts.mono,
          fontWeight: '800',
          fontSize: 16,
          color: THEME.colors.textPrimary,
          letterSpacing: 1,
        },
        tabBarStyle: {
          backgroundColor: THEME.colors.backgroundSecondary,
          borderTopColor: THEME.colors.surfaceBorder,
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarActiveTintColor: THEME.colors.accentAmber,
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: THEME.fonts.mono,
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isEs ? 'NIVELES' : 'LEVELS',
          headerTitle: isEs ? 'M.E.G. // BASE DE DATOS DE NIVELES' : 'M.E.G. // LEVEL DATABASE',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="layers-outline"
              size={size}
              color={typeof color === 'string' ? color : THEME.colors.accentAmber}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="entities"
        options={{
          title: isEs ? 'ENTIDADES' : 'ENTITIES',
          headerTitle: isEs ? 'M.E.G. // BESTIARIO DE ENTIDADES' : 'M.E.G. // ENTITY BESTIARY',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="skull-outline"
              size={size}
              color={typeof color === 'string' ? color : THEME.colors.accentRed}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: isEs ? 'BIBLIOTECA' : 'LIBRARY',
          headerTitle: isEs ? 'M.E.G. // ARCHIVO & BIBLIOTECA' : 'M.E.G. // ARCHIVE & LIBRARY',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="library-outline"
              size={size}
              color={typeof color === 'string' ? color : THEME.colors.accentCyan}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: isEs ? 'GUARDADOS' : 'SAVED',
          headerTitle: isEs ? 'M.E.G. // EXPEDIENTES OFFLINE' : 'M.E.G. // OFFLINE DOSSIERS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="bookmark-outline"
              size={size}
              color={typeof color === 'string' ? color : THEME.colors.accentGreen}
            />
          ),
        }}
      />
    </Tabs>
  );
}
