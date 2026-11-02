import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DossierView } from '../../components/DossierView';
import { THEME } from '../../constants/theme';
import { inferItemCategory } from '../../services/wikidotService';

export default function NestedDossierScreen() {
  const router = useRouter();
  const { slug, category } = useLocalSearchParams<{ slug?: string | string[]; category?: string }>();
  const rawPath = Array.isArray(slug) ? slug.join('/') : (slug || '');
  if (!rawPath) return null;

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const cleanId = rawPath.replace(/^\/+/, '');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <DossierView
          path={normalizedPath}
          category={inferItemCategory(cleanId, normalizedPath, category)}
          showBackButton
          onBack={() => router.back()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.colors.background },
  container: { flex: 1, backgroundColor: THEME.colors.background },
});
