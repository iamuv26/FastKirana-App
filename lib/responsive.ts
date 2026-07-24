import { useWindowDimensions } from 'react-native';

export interface ResponsiveMetrics {
  width: number;
  height: number;
  isSmallPhone: boolean;   // < 360px (e.g. iPhone SE 1st gen, small Androids)
  isStandardPhone: boolean;// 360px - 480px (e.g. iPhone 13/14/15, Galaxy S23/S24)
  isLargePhone: boolean;   // 480px - 600px (e.g. Foldables unfolded, large phablets)
  isTablet: boolean;       // > 600px (Tablets, iPad, Web desktop)
  gridColumns: number;     // Recommended grid columns for product grids
  cardWidth: number;       // Recommended product card width for current screen
}

export function useResponsive(): ResponsiveMetrics {
  const { width, height } = useWindowDimensions();
  const validWidth = width > 0 ? width : 390;

  const isSmallPhone = validWidth < 360;
  const isStandardPhone = validWidth >= 360 && validWidth < 480;
  const isLargePhone = validWidth >= 480 && validWidth < 600;
  const isTablet = validWidth >= 600;

  let gridColumns = 2;
  if (validWidth >= 1100) {
    gridColumns = 5;
  } else if (validWidth >= 800) {
    gridColumns = 4;
  } else if (validWidth >= 550) {
    gridColumns = 3;
  } else {
    gridColumns = 2;
  }

  // Calculate container horizontal padding
  const padding = isSmallPhone ? 12 : (isTablet ? 24 : 16);
  const gap = isSmallPhone ? 8 : 12;
  const availableWidth = validWidth - (padding * 2);
  const cardWidth = Math.floor((availableWidth - (gap * (gridColumns - 1))) / gridColumns);

  return {
    width: validWidth,
    height: height > 0 ? height : 844,
    isSmallPhone,
    isStandardPhone,
    isLargePhone,
    isTablet,
    gridColumns,
    cardWidth,
  };
}

/**
 * Helper to calculate responsive card width given any container or window width
 */
export function getResponsiveCardWidth(containerWidth: number, targetColumns = 2, gap = 12): number {
  const safeWidth = Math.max(280, containerWidth);
  let cols = targetColumns;
  if (safeWidth >= 1100) cols = 5;
  else if (safeWidth >= 800) cols = 4;
  else if (safeWidth >= 550) cols = 3;
  
  const available = safeWidth - (gap * (cols - 1));
  return Math.floor(available / cols);
}

/**
 * Scale font size based on screen width baseline (375px)
 */
export function scaleFont(fontSize: number, screenWidth: number): number {
  if (screenWidth < 360) {
    return Math.max(10, Math.round(fontSize * 0.9));
  }
  if (screenWidth >= 600) {
    return Math.min(fontSize * 1.25, Math.round(fontSize * 1.15));
  }
  return fontSize;
}
