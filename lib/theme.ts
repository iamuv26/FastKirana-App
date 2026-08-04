export const THEME = {
  COLORS: {
    // Brand Colors
    brand: {
      primary: '#e20a22',       // Brand Red
      primaryLight: '#fff1f2',  // Light pink/rose tint
      primaryDark: '#9f1239',   // Dark crimson
      accent: '#ea580c',        // Cafe Orange
      accentLight: '#fff7ed',   // Light orange tint
      accentDark: '#c2410c',    // Dark orange
      success: '#10b981',       // Green
      successLight: '#ecfdf5',  // Light green tint
      successDark: '#047857',   // Dark green
      warning: '#f59e0b',       // Amber/Yellow
      warningLight: '#fffbeb',  // Light amber tint
      warningDark: '#b45309',   // Dark amber
    },
    // Gradients
    gradients: {
      primary: ['#e20a22', '#ff4d64'],
      accent: ['#ea580c', '#f97316'],
      success: ['#10b981', '#059669'],
      dark: ['#18181b', '#09090b'],
    },
    // Neutrals - Light Mode
    light: {
      background: '#f8fafc',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
    },
    // Neutrals - Dark Mode
    dark: {
      background: '#09090b',
      surface: '#18181b',
      surfaceElevated: '#27272a',
      border: '#27272a',
      borderLight: 'rgba(255,255,255,0.06)',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
    }
  },

  // Typography Scale (Min size is 10px, mostly 11px+)
  TYPOGRAPHY: {
    sizes: {
      micro: 10,       // Absolute minimum for tiny badges/labels
      caption: 11.5,   // For unit sizes, tiny tags
      bodySm: 13,      // Small body/labels
      body: 14.5,      // Standard body text
      titleSm: 16,     // Small section headings
      title: 18.5,     // Main section titles
      heroSm: 22,      // Small hero headers
      hero: 28,        // Large hero titles
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '850',    // Extra weight for premium titles if supported
    }
  },

  // Spacing Scale
  SPACING: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Border Radius Scale
  RADIUS: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 24,
    pill: 9999,
  },

  // Premium Shadows - Consistent opacities and elevation
  SHADOWS: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 24,
      elevation: 8,
    },
    // Colored brand glows
    primaryGlow: {
      shadowColor: '#e20a22',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    },
    accentGlow: {
      shadowColor: '#ea580c',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 4,
    }
  }
};
