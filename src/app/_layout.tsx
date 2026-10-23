import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { THEME } from '../constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: THEME.colors.background,
          },
          headerTintColor: THEME.colors.textPrimary,
          headerTitleStyle: {
            fontFamily: THEME.fonts.mono,
            fontWeight: '800',
            fontSize: 16,
          },
          contentStyle: {
            backgroundColor: THEME.colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="dossier/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}
