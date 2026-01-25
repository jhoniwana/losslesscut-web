// Neobrutalismo - Paleta de colores inspirada en Iguanads
export const neoBrutalism = {
  // Colores primarios - Bold y vibrantes
  colors: {
    background: '#FAFAF9',      // Casi blanco, ligeramente cálido
    surface: '#FFFFFF',         // Blanco puro
    primary: '#FF6B35',         // Naranja vibrante
    secondary: '#FFD23F',       // Amarillo brillante
    accent: '#00D9FF',          // Cyan eléctrico
    success: '#00FF85',         // Verde neón
    error: '#FF006B',           // Rosa fuerte
    warning: '#FFB800',         // Amarillo advertencia

    // Tonos de texto
    text: {
      primary: '#000000',       // Negro puro
      secondary: '#1A1A1A',     // Negro suave
      muted: '#666666',         // Gris medio
      inverse: '#FFFFFF',       // Blanco
    },

    // Bordes
    border: '#000000',          // Siempre negro y grueso
    borderLight: '#333333',     // Gris oscuro para divisores
  },

  // Sombras - Hard shadows características del neobrutalismo
  shadows: {
    small: '4px 4px 0px #000000',
    medium: '6px 6px 0px #000000',
    large: '8px 8px 0px #000000',
    xl: '12px 12px 0px #000000',

    // Sombras de color para elementos destacados
    primarySmall: '4px 4px 0px #FF6B35',
    primaryMedium: '6px 6px 0px #FF6B35',
    accentSmall: '4px 4px 0px #00D9FF',
    accentMedium: '6px 6px 0px #00D9FF',
  },

  // Bordes gruesos
  borders: {
    thin: '2px solid #000000',
    medium: '3px solid #000000',
    thick: '4px solid #000000',
    extraThick: '6px solid #000000',
  },

  // Radios - Mínimos o ninguno
  radius: {
    none: '0px',
    small: '4px',    // Solo para algunos casos
    medium: '8px',   // Raramente usado
  },

  // Espaciado - Generous y consistente
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },

  // Tipografía - Bold, sans-serif, alta legibilidad
  typography: {
    fontFamily: {
      base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", Monaco, "Cascadia Code", "Courier New", monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      '4xl': '40px',
      '5xl': '48px',
    },
    fontWeight: {
      normal: 500,
      medium: 600,
      bold: 700,
      black: 900,
    },
    lineHeight: {
      tight: 1.2,
      base: 1.5,
      relaxed: 1.75,
    },
  },

  // Z-index
  zIndex: {
    base: 1,
    dropdown: 10,
    modal: 100,
    tooltip: 1000,
    notification: 10000,
  },

  // Transiciones - Rápidas y directas
  transitions: {
    fast: '0.1s ease-in-out',
    base: '0.15s ease-in-out',
    slow: '0.2s ease-in-out',
  },
} as const;

// Helper para crear botones neobrutalistas
export const neoButton = (variant: 'primary' | 'secondary' | 'accent' | 'success' | 'error' = 'primary') => {
  const colorMap = {
    primary: neoBrutalism.colors.primary,
    secondary: neoBrutalism.colors.secondary,
    accent: neoBrutalism.colors.accent,
    success: neoBrutalism.colors.success,
    error: neoBrutalism.colors.error,
  };

  return {
    backgroundColor: colorMap[variant],
    color: neoBrutalism.colors.text.primary,
    border: neoBrutalism.borders.thick,
    borderRadius: neoBrutalism.radius.none,
    padding: `${neoBrutalism.spacing.md} ${neoBrutalism.spacing.xl}`,
    fontWeight: neoBrutalism.typography.fontWeight.bold,
    fontSize: neoBrutalism.typography.fontSize.base,
    cursor: 'pointer',
    boxShadow: neoBrutalism.shadows.medium,
    transition: neoBrutalism.transitions.fast,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontFamily: neoBrutalism.typography.fontFamily.base,

    // Hover state
    ':hover': {
      transform: 'translate(2px, 2px)',
      boxShadow: neoBrutalism.shadows.small,
    },

    // Active state
    ':active': {
      transform: 'translate(6px, 6px)',
      boxShadow: 'none',
    },
  };
};

// Helper para crear cards neobrutalistas
export const neoCard = (backgroundColor = neoBrutalism.colors.surface) => ({
  backgroundColor,
  border: neoBrutalism.borders.thick,
  borderRadius: neoBrutalism.radius.none,
  boxShadow: neoBrutalism.shadows.large,
  padding: neoBrutalism.spacing.xl,
});

// Helper para inputs neobrutalistas
export const neoInput = () => ({
  backgroundColor: neoBrutalism.colors.surface,
  border: neoBrutalism.borders.medium,
  borderRadius: neoBrutalism.radius.none,
  padding: `${neoBrutalism.spacing.md} ${neoBrutalism.spacing.lg}`,
  fontSize: neoBrutalism.typography.fontSize.base,
  fontWeight: neoBrutalism.typography.fontWeight.medium,
  color: neoBrutalism.colors.text.primary,
  fontFamily: neoBrutalism.typography.fontFamily.base,

  ':focus': {
    outline: 'none',
    borderColor: neoBrutalism.colors.primary,
    boxShadow: `0 0 0 3px ${neoBrutalism.colors.primary}33`,
  },
});

export default neoBrutalism;
