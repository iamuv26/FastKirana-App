import { useWindowDimensions, Platform, ViewStyle } from 'react-native';

// ─────────────────────────────────────────────
//  BREAKPOINTS  (single source of truth)
// ─────────────────────────────────────────────

export const BREAKPOINTS = {
  // Phones (portrait)
  xs: 360,   // small phones (iPhone SE 1st gen, Galaxy A series)
  sm: 390,   // standard phones (iPhone 13/14/15)
  md: 480,   // large phones (Foldables closed, Galaxy S Ultra)
  // Tablets & web
  lg: 768,   // iPad portrait, small tablets
  xl: 1024,  // iPad landscape, small desktop
  xxl: 1280, // desktop
  xxxl: 1600, // ultrawide desktop
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// ─────────────────────────────────────────────
//  DESIGN TOKENS  (responsive spacing, sizes)
// ─────────────────────────────────────────────

export interface ResponsiveSpacing {
  page: number;       // page horizontal padding
  card: number;       // card internal padding
  section: number;    // vertical spacing between sections
  heroHeight: number; // hero banner height
  cardImageHeight: number;
  horizontalTabsHeight: number;
  tabBarHeight: number;
}

export interface ResponsiveTypography {
  hero: number;
  h1: number;
  h2: number;
  h3: number;
  body: number;
  caption: number;
  micro: number;
}

function getSpacing(width: number): ResponsiveSpacing {
  if (width >= BREAKPOINTS.xxl) {
    return {
      page: 48, card: 20, section: 32, heroHeight: 460,
      cardImageHeight: 220, horizontalTabsHeight: 56, tabBarHeight: 80,
    };
  }
  if (width >= BREAKPOINTS.xl) {
    return {
      page: 40, card: 18, section: 28, heroHeight: 380,
      cardImageHeight: 200, horizontalTabsHeight: 54, tabBarHeight: 76,
    };
  }
  if (width >= BREAKPOINTS.lg) {
    return {
      page: 32, card: 16, section: 24, heroHeight: 320,
      cardImageHeight: 180, horizontalTabsHeight: 52, tabBarHeight: 72,
    };
  }
  if (width >= BREAKPOINTS.md) {
    return {
      page: 24, card: 14, section: 20, heroHeight: 280,
      cardImageHeight: 160, horizontalTabsHeight: 48, tabBarHeight: 70,
    };
  }
  if (width >= BREAKPOINTS.sm) {
    return {
      page: 16, card: 12, section: 16, heroHeight: 240,
      cardImageHeight: 140, horizontalTabsHeight: 46, tabBarHeight: 64,
    };
  }
  // xs (small phones)
  return {
    page: 12, card: 10, section: 14, heroHeight: 200,
    cardImageHeight: 120, horizontalTabsHeight: 44, tabBarHeight: 60,
  };
}

function getTypography(width: number): ResponsiveTypography {
  if (width >= BREAKPOINTS.xxl) {
    return { hero: 56, h1: 40, h2: 28, h3: 22, body: 17, caption: 14, micro: 12 };
  }
  if (width >= BREAKPOINTS.xl) {
    return { hero: 44, h1: 32, h2: 24, h3: 19, body: 16, caption: 13, micro: 11 };
  }
  if (width >= BREAKPOINTS.lg) {
    return { hero: 36, h1: 28, h2: 20, h3: 17, body: 15, caption: 13, micro: 11 };
  }
  if (width >= BREAKPOINTS.md) {
    return { hero: 30, h1: 24, h2: 18, h3: 16, body: 14, caption: 12, micro: 10 };
  }
  if (width >= BREAKPOINTS.sm) {
    return { hero: 26, h1: 22, h2: 17, h3: 15, body: 14, caption: 12, micro: 10 };
  }
  return { hero: 22, h1: 19, h2: 16, h3: 14, body: 13, caption: 11, micro: 9 };
}

// ─────────────────────────────────────────────
//  HOOK: useResponsive — central responsive state
// ─────────────────────────────────────────────

export interface ResponsiveMetrics {
  // raw screen
  width: number;
  height: number;
  // breakpoints
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  isXxl: boolean;
  isXxxl: boolean;
  // device shape helpers
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallPhone: boolean;
  isLargeScreen: boolean; // tablet OR desktop
  orientation: 'portrait' | 'landscape';
  // platform
  isWeb: boolean;
  isNative: boolean;
  // tokens
  spacing: ResponsiveSpacing;
  typography: ResponsiveTypography;
  // grids
  gridColumns: number;
  cardWidth: number;
  // recommended max content width (centered on huge screens)
  contentMaxWidth: number;
}

export function useResponsive(): ResponsiveMetrics {
  const { width, height } = useWindowDimensions();
  const validWidth = width > 0 ? width : 390;
  const validHeight = height > 0 ? height : 844;
  const isLandscape = validWidth > validHeight;

  const isXs = validWidth < BREAKPOINTS.sm;
  const isSm = validWidth >= BREAKPOINTS.sm && validWidth < BREAKPOINTS.md;
  const isMd = validWidth >= BREAKPOINTS.md && validWidth < BREAKPOINTS.lg;
  const isLg = validWidth >= BREAKPOINTS.lg && validWidth < BREAKPOINTS.xl;
  const isXl = validWidth >= BREAKPOINTS.xl && validWidth < BREAKPOINTS.xxl;
  const isXxl = validWidth >= BREAKPOINTS.xxl && validWidth < BREAKPOINTS.xxxl;
  const isXxxl = validWidth >= BREAKPOINTS.xxxl;

  const isPhone = validWidth < BREAKPOINTS.lg;
  const isTablet = validWidth >= BREAKPOINTS.lg && validWidth < BREAKPOINTS.xl;
  const isDesktop = validWidth >= BREAKPOINTS.xl;
  const isSmallPhone = validWidth < BREAKPOINTS.sm;
  const isLargeScreen = isTablet || isDesktop;

  // grid columns — phone portrait (2), phone landscape (4), tablet portrait (3-4), tablet landscape (4-5), desktop (5-6)
  let gridColumns = 2;
  if (validWidth >= 1600) gridColumns = 6;
  else if (validWidth >= 1280) gridColumns = 5;
  else if (validWidth >= 1024) gridColumns = 4;
  else if (validWidth >= 768) gridColumns = 3;
  else if (validWidth >= 480) gridColumns = 3;
  // landscape phones: more columns
  if (isLandscape && validWidth >= 700 && !isDesktop) gridColumns = Math.max(gridColumns, 4);

  const spacing = getSpacing(validWidth);
  const typography = getTypography(validWidth);

  // card width with proper margins
  const safeWidth = validWidth - (spacing.page * 2);
  const gap = spacing.card;
  const cardWidth = Math.floor((safeWidth - (gap * (gridColumns - 1))) / gridColumns);

  // contentMaxWidth — center the content on huge screens
  const contentMaxWidth = Math.min(validWidth, 1400);

  const isWeb = Platform.OS === 'web';
  const isNative = !isWeb;

  return {
    width: validWidth,
    height: validHeight,
    isXs, isSm, isMd, isLg, isXl, isXxl, isXxxl,
    isPhone, isTablet, isDesktop,
    isSmallPhone,
    isLargeScreen,
    orientation: isLandscape ? 'landscape' : 'portrait',
    isWeb, isNative,
    spacing,
    typography,
    gridColumns,
    cardWidth,
    contentMaxWidth,
  };
}

// ─────────────────────────────────────────────
//  LEGACY HELPERS  (kept for backward compatibility)
// ─────────────────────────────────────────────

/**
 * Helper: compute card width for arbitrary container width.
 * Still useful for nested layouts.
 */
export function getResponsiveCardWidth(
  containerWidth: number,
  targetColumns = 2,
  gap = 12
): number {
  const safeWidth = Math.max(280, containerWidth);
  let cols = targetColumns;
  if (safeWidth >= 1600) cols = 6;
  else if (safeWidth >= 1280) cols = 5;
  else if (safeWidth >= 1024) cols = 4;
  else if (safeWidth >= 768) cols = 3;
  else if (safeWidth >= 480) cols = 3;

  const available = safeWidth - (gap * (cols - 1));
  return Math.floor(available / cols);
}

/**
 * Scale a numeric size based on a baseline of 375px.
 * Use sparingly — prefer the typography/spacing tokens.
 */
export function scaleFont(fontSize: number, screenWidth: number): number {
  if (screenWidth < BREAKPOINTS.sm) {
    return Math.max(10, Math.round(fontSize * 0.9));
  }
  if (screenWidth >= BREAKPOINTS.lg) {
    return Math.min(Math.round(fontSize * 1.15), fontSize * 1.25);
  }
  return fontSize;
}

// ─────────────────────────────────────────────
//  STYLE HELPERS
// ─────────────────────────────────────────────

/**
 * Returns a centered, max-width container style.
 * Useful for any screen that should not stretch on huge monitors.
 */
export function getCenteredContainerStyle(metrics: ResponsiveMetrics): ViewStyle {
  return {
    width: '100%',
    maxWidth: metrics.contentMaxWidth,
    alignSelf: 'center',
  };
}

/**
 * Horizontal scrolling width: returns width that allows
 * a 7-item row on any size screen.
 */
export function getHorizontalScrollPadding(metrics: ResponsiveMetrics) {
  const page = metrics.spacing.page;
  return {
    paddingHorizontal: page,
    columnGap: metrics.spacing.card,
  };
}
