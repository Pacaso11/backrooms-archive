import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 720;
  const isLandscape = width > height;
  // Always use mobile-style single-pane layout across all devices (phones & tablets)
  // Tablets render the full-width index/library lists and open full-screen dossiers on item tap
  const isSplitView = false;

  const masterWidth = width;
  const detailWidth = width;

  return {
    width,
    height,
    isTablet,
    isLandscape,
    isSplitView,
    masterWidth,
    detailWidth,
  };
}
