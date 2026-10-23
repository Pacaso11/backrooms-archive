import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DossierView } from '../../components/DossierView';
import { THEME } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DossierScreen() {
  const router = useRouter();
  const { id, category } = useLocalSearchParams<{ id: string; category?: string }>();

  if (!id) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <DossierView
          path={`/${id}`}
          category={(category as any) || (id.startsWith('entity') ? 'entity' : id.startsWith('object') ? 'object' : id.startsWith('phenomenon') ? 'phenomenon' : 'canon')}
          showBackButton
          onBack={() => router.back()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
