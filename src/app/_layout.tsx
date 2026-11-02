import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';
import { LanguageProvider } from '../context/LanguageContext';
import { formatErrorMessage } from '../utils/errorFormatting';

export { formatErrorMessage };

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const errorMessage = formatErrorMessage(error);
  const stackText = (error as { stack?: unknown })?.stack;

  return (
    <SafeAreaView style={styles.errorSafeArea}>
      <StatusBar style="light" />
      <View style={styles.errorContainer}>
        <View style={styles.terminalHeader}>
          <Ionicons name="warning" size={20} color={THEME.colors.accentRed} />
          <Text style={styles.terminalHeaderTitle}>M.E.G. OS // EXCEPCIÓN DEL SISTEMA</Text>
        </View>

        <View style={styles.diagnosticCard}>
          <View style={styles.badgeRow}>
            <View style={styles.hazardBadge}>
              <Text style={styles.hazardBadgeText}>ANOMALÍA DETECTADA</Text>
            </View>
            <Text style={styles.protocolText}>PROTOCOLO-404/ERR</Text>
          </View>

          <Text style={styles.errorNotice}>
            Se ha interrumpido el flujo de renderizado del archivo. El subsistema M.E.G. ha aislado la falla para proteger la integridad de los datos.
          </Text>

          <ScrollView style={styles.detailsBox} contentContainerStyle={styles.detailsContent}>
            <Text testID="router_error_message" style={styles.errorDetailsText} selectable>
              {errorMessage}
            </Text>
            {typeof stackText === 'string' && stackText.trim().length > 0 ? (
              <Text style={styles.stackText} selectable>
                {'\n'}{stackText}
              </Text>
            ) : null}
          </ScrollView>
        </View>

        <Pressable
          testID="router_error_retry"
          onPress={() => {
            if (typeof retry === 'function') {
              void retry();
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Reintentar ejecución del sistema"
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
        >
          <Ionicons name="refresh" size={18} color={THEME.colors.background} />
          <Text style={styles.retryButtonText}>REINTENTAR SUBSISTEMA</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
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
          name="dossier/[...slug]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  errorSafeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  errorContainer: {
    flex: 1,
    padding: THEME.spacing.lg,
    justifyContent: 'center',
    gap: THEME.spacing.lg,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: THEME.spacing.xs,
  },
  terminalHeaderTitle: {
    color: THEME.colors.accentRed,
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  diagnosticCard: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hazardBadge: {
    backgroundColor: `${THEME.colors.accentRed}22`,
    borderColor: THEME.colors.accentRed,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
  },
  hazardBadgeText: {
    color: THEME.colors.accentRed,
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  protocolText: {
    color: THEME.colors.textMuted,
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
  },
  errorNotice: {
    color: THEME.colors.textSecondary,
    fontSize: THEME.type.body,
    lineHeight: 22,
  },
  detailsBox: {
    maxHeight: 180,
    backgroundColor: THEME.colors.backgroundSecondary,
    borderColor: THEME.colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: THEME.radius.sm,
  },
  detailsContent: {
    padding: THEME.spacing.sm,
  },
  errorDetailsText: {
    color: THEME.colors.accentAmber,
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
    lineHeight: 18,
  },
  stackText: {
    color: THEME.colors.textMuted,
    fontFamily: THEME.fonts.mono,
    fontSize: 10,
    lineHeight: 14,
  },
  retryButton: {
    minHeight: THEME.touch.min,
    backgroundColor: THEME.colors.accentAmber,
    borderRadius: THEME.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: THEME.spacing.xl,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    color: THEME.colors.background,
    fontFamily: THEME.fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
