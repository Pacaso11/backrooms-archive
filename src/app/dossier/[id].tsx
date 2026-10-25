import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DossierView } from '../../components/DossierView';
import { THEME } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { inferItemCategory } from '../../services/wikidotService';

export default function DossierScreen() {
  const router = useRouter();
  const { id, category } = useLocalSearchParams<{ id: string; category?: string }>();

  if (!id) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <DossierView
          path={`/${id}`}
          category={inferItemCategory(id, undefined, category)}
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
