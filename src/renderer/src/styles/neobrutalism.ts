// Material Design 3 - Expressive Theme
// https://m3.material.io/styles/color/roles

export const neoBrutalism = {
  // Material 3 Color System - Vibrant Purple Expressive Theme
  colors: {
    // Primary - Vivid Purple (Creative, Modern)
    primary: '#7B3FF2',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#2A0080',

    // Secondary - Deep Violet (Rich accent)
    secondary: '#9D4EDD',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E0AAFF',
    onSecondaryContainer: '#3C0066',

    // Tertiary - Magenta Pink (Vibrant complement)
    tertiary: '#C77DFF',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F3E5FF',
    onTertiaryContainer: '#4A0080',

    // Error colors - Vibrant Red
    error: '#FF3B30',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#660000',

    // Surface colors - Dark theme optimized
    background: '#0A0A0F',
    onBackground: '#E8E8F0',

    surface: '#121218',
    onSurface: '#E8E8F0',
    surfaceVariant: '#1E1E28',
    onSurfaceVariant: '#C4C4D0',

    surfaceTint: '#7B3FF2',

    // Surface container levels (MD3 Elevation with dark theme)
    surfaceContainerLowest: '#0A0A0F',
    surfaceContainerLow: '#16161D',
    surfaceContainer: '#1A1A22',
    surfaceContainerHigh: '#1E1E28',
    surfaceContainerHighest: '#24242F',

    // Inverse colors
    inverseSurface: '#E8E8F0',
    inverseOnSurface: '#1A1A22',
    inversePrimary: '#5E2BB8',

    // Outline - Higher contrast
    outline: '#787885',
    outlineVariant: '#444450',

    // Scrim and shadow
    scrim: '#000000',
    shadow: '#000000',

    // Additional semantic colors - Vibrant palette
    success: '#00E676',
    onSuccess: '#003820',
    successContainer: '#C8FFD4',
    onSuccessContainer: '#00210F',

    warning: '#FFB300',
    onWarning: '#3D2E00',
    warningContainer: '#FFE9B3',
    onWarningContainer: '#2A1F00',

    info: '#00B8D4',
    onInfo: '#003D47',
    infoContainer: '#B3F0FF',
    onInfoContainer: '#001F26',

    // Text hierarchy (MD3) - Dark optimized
    text: {
      primary: '#FFFFFF',
      secondary: '#B8B8C0',
      tertiary: '#8C8C98',
      disabled: '#5C5C68',
      inverse: '#1A1A22',
      muted: '#8C8C98', // Alias for tertiary
    },

    // Backward compatibility aliases
    accent: '#C77DFF', // Maps to tertiary (magenta pink)
    bg: '#0A0A0F', // Maps to background
  },

  // Material 3 Elevation System
  elevation: {
    level0: {
      shadow: 'none',
      tint: 0,
    },
    level1: {
      shadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
      tint: 0.05,
    },
    level2: {
      shadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
      tint: 0.08,
    },
    level3: {
      shadow: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
      tint: 0.11,
    },
    level4: {
      shadow: '0px 2px 3px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
      tint: 0.12,
    },
    level5: {
      shadow: '0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
      tint: 0.14,
    },
  },

  // Material 3 Shape System (Expressive uses more rounded corners)
  shape: {
    none: '0px',
    extraSmall: '4px',
    small: '8px',
    medium: '12px',
    large: '16px',
    extraLarge: '28px',
    full: '9999px',
  },

  // Material 3 Typography Scale
  typography: {
    fontFamily: {
      brand: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "SF Pro", system-ui, sans-serif',
      plain: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "SF Pro", system-ui, sans-serif',
      base: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "SF Pro", system-ui, sans-serif', // Alias
    },

    // Font weights
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },

    // Font sizes (backward compatibility)
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '24px',
      '3xl': '28px',
    },

    // Line heights (backward compatibility)
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },

    // Display styles
    displayLarge: {
      fontSize: '57px',
      lineHeight: '64px',
      fontWeight: 400,
      letterSpacing: '-0.25px',
    },
    displayMedium: {
      fontSize: '45px',
      lineHeight: '52px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    displaySmall: {
      fontSize: '36px',
      lineHeight: '44px',
      fontWeight: 400,
      letterSpacing: '0px',
    },

    // Headline styles
    headlineLarge: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    headlineMedium: {
      fontSize: '28px',
      lineHeight: '36px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    headlineSmall: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 400,
      letterSpacing: '0px',
    },

    // Title styles
    titleLarge: {
      fontSize: '22px',
      lineHeight: '28px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    titleMedium: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 500,
      letterSpacing: '0.15px',
    },
    titleSmall: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
      letterSpacing: '0.1px',
    },

    // Body styles
    bodyLarge: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
      letterSpacing: '0.5px',
    },
    bodyMedium: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
      letterSpacing: '0.25px',
    },
    bodySmall: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
      letterSpacing: '0.4px',
    },

    // Label styles
    labelLarge: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
      letterSpacing: '0.1px',
    },
    labelMedium: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
    labelSmall: {
      fontSize: '11px',
      lineHeight: '16px',
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
  },

  // Material 3 Motion System
  motion: {
    duration: {
      short1: '50ms',
      short2: '100ms',
      short3: '150ms',
      short4: '200ms',
      medium1: '250ms',
      medium2: '300ms',
      medium3: '350ms',
      medium4: '400ms',
      long1: '450ms',
      long2: '500ms',
      long3: '550ms',
      long4: '600ms',
      extraLong1: '700ms',
      extraLong2: '800ms',
      extraLong3: '900ms',
      extraLong4: '1000ms',
    },
    easing: {
      standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
      standardAccelerate: 'cubic-bezier(0.3, 0.0, 1, 1)',
      standardDecelerate: 'cubic-bezier(0, 0.0, 0, 1)',
      emphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
      emphasizedAccelerate: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
      emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
    },
  },

  // Material 3 State Layers (interaction states)
  states: {
    hover: 0.08,
    focus: 0.12,
    pressed: 0.12,
    dragged: 0.16,
  },

  // Spacing system (8dp grid)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },

  // Backward compatibility aliases for old neobrutalism properties
  shadows: {
    xs: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    sm: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    small: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    md: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
    medium: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
    lg: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
    large: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
  },

  // Material Design 3 Borders (subtle, not brutal)
  borders: {
    thin: `1px solid #787885`, // Using outline color
    medium: `1px solid #787885`, // Changed from 2px to 1px
    thick: `1px solid #787885`, // Changed from 3px to 1px
    extraThick: `1px solid #787885`, // Changed from 4px to 1px
  },

  radius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  transitions: {
    fast: 'all 150ms cubic-bezier(0.2, 0.0, 0, 1.0)',
    base: 'all 200ms cubic-bezier(0.2, 0.0, 0, 1.0)',
    slow: 'all 300ms cubic-bezier(0.2, 0.0, 0, 1.0)',
  },
} as const;

// Material 3 Filled Button
export const neoButton = (variant: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal' = 'filled') => {
  const variants = {
    filled: {
      background: neoBrutalism.colors.primary,
      color: neoBrutalism.colors.onPrimary,
      elevation: neoBrutalism.elevation.level0,
      hoverElevation: neoBrutalism.elevation.level1,
    },
    elevated: {
      background: neoBrutalism.colors.surfaceContainerLow,
      color: neoBrutalism.colors.primary,
      elevation: neoBrutalism.elevation.level1,
      hoverElevation: neoBrutalism.elevation.level2,
    },
    tonal: {
      background: neoBrutalism.colors.secondaryContainer,
      color: neoBrutalism.colors.onSecondaryContainer,
      elevation: neoBrutalism.elevation.level0,
      hoverElevation: neoBrutalism.elevation.level1,
    },
    outlined: {
      background: 'transparent',
      color: neoBrutalism.colors.primary,
      border: `1px solid ${neoBrutalism.colors.outline}`,
      elevation: neoBrutalism.elevation.level0,
      hoverElevation: neoBrutalism.elevation.level0,
    },
    text: {
      background: 'transparent',
      color: neoBrutalism.colors.primary,
      elevation: neoBrutalism.elevation.level0,
      hoverElevation: neoBrutalism.elevation.level0,
    },
  };

  const style = variants[variant];

  return {
    backgroundColor: style.background,
    color: style.color,
    border: style.border || 'none',
    borderRadius: neoBrutalism.shape.full,
    padding: '10px 24px',
    height: '40px',
    minWidth: '64px',
    fontSize: neoBrutalism.typography.labelLarge.fontSize,
    fontWeight: neoBrutalism.typography.labelLarge.fontWeight,
    letterSpacing: neoBrutalism.typography.labelLarge.letterSpacing,
    fontFamily: neoBrutalism.typography.fontFamily.brand,
    cursor: 'pointer',
    boxShadow: style.elevation.shadow,
    transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.standard}`,
    textTransform: 'none' as const,
    userSelect: 'none' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: neoBrutalism.spacing.sm,
    position: 'relative' as const,
    overflow: 'hidden',

    ':hover': {
      boxShadow: style.hoverElevation.shadow,
    },

    ':focus': {
      outline: `3px solid ${neoBrutalism.colors.primary}40`,
      outlineOffset: '2px',
    },
  };
};

// Material 3 Card
export const neoCard = (elevated = false) => ({
  backgroundColor: elevated ? neoBrutalism.colors.surfaceContainerLow : neoBrutalism.colors.surfaceContainer,
  borderRadius: neoBrutalism.shape.medium,
  boxShadow: elevated ? neoBrutalism.elevation.level1.shadow : neoBrutalism.elevation.level0.shadow,
  padding: neoBrutalism.spacing.lg,
  transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.standard}`,
  border: `1px solid ${neoBrutalism.colors.outlineVariant}`,
});

// Material 3 Text Field
export const neoInput = () => ({
  backgroundColor: neoBrutalism.colors.surfaceContainerHighest,
  border: 'none',
  borderBottom: `1px solid ${neoBrutalism.colors.onSurfaceVariant}`,
  borderRadius: `${neoBrutalism.shape.extraSmall} ${neoBrutalism.shape.extraSmall} 0 0`,
  padding: `16px 16px 8px 16px`,
  fontSize: neoBrutalism.typography.bodyLarge.fontSize,
  fontWeight: neoBrutalism.typography.bodyLarge.fontWeight,
  color: neoBrutalism.colors.onSurface,
  fontFamily: neoBrutalism.typography.fontFamily.plain,
  transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.standard}`,

  ':focus': {
    outline: 'none',
    borderBottomWidth: '2px',
    borderBottomColor: neoBrutalism.colors.primary,
    paddingBottom: '7px',
  },

  '::placeholder': {
    color: neoBrutalism.colors.onSurfaceVariant,
    opacity: 0.6,
  },
});

export default neoBrutalism;
