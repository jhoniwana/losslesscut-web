import { CSSProperties, ReactNode } from 'react';
import neoBrutalism from '../styles/neobrutalism';

interface NeoButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: CSSProperties;
  title?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success';
}

export default function NeoButton({
  children,
  onClick,
  variant = 'filled',
  size = 'medium',
  disabled = false,
  style = {},
  title,
  icon,
  fullWidth = false,
  color = 'primary',
}: NeoButtonProps) {
  // Material 3 Button Color Mappings
  const colorMap = {
    filled: {
      primary: {
        bg: neoBrutalism.colors.primary,
        text: neoBrutalism.colors.onPrimary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      secondary: {
        bg: neoBrutalism.colors.secondary,
        text: neoBrutalism.colors.onSecondary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      tertiary: {
        bg: neoBrutalism.colors.tertiary,
        text: neoBrutalism.colors.onTertiary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      error: {
        bg: neoBrutalism.colors.error,
        text: neoBrutalism.colors.onError,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      success: {
        bg: neoBrutalism.colors.success,
        text: neoBrutalism.colors.onSuccess,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
    },
    elevated: {
      primary: {
        bg: neoBrutalism.colors.surfaceContainerLow,
        text: neoBrutalism.colors.primary,
        elevation: neoBrutalism.elevation.level1,
        hoverElevation: neoBrutalism.elevation.level2,
      },
      secondary: {
        bg: neoBrutalism.colors.surfaceContainerLow,
        text: neoBrutalism.colors.secondary,
        elevation: neoBrutalism.elevation.level1,
        hoverElevation: neoBrutalism.elevation.level2,
      },
      tertiary: {
        bg: neoBrutalism.colors.surfaceContainerLow,
        text: neoBrutalism.colors.tertiary,
        elevation: neoBrutalism.elevation.level1,
        hoverElevation: neoBrutalism.elevation.level2,
      },
      error: {
        bg: neoBrutalism.colors.surfaceContainerLow,
        text: neoBrutalism.colors.error,
        elevation: neoBrutalism.elevation.level1,
        hoverElevation: neoBrutalism.elevation.level2,
      },
      success: {
        bg: neoBrutalism.colors.surfaceContainerLow,
        text: neoBrutalism.colors.success,
        elevation: neoBrutalism.elevation.level1,
        hoverElevation: neoBrutalism.elevation.level2,
      },
    },
    tonal: {
      primary: {
        bg: neoBrutalism.colors.secondaryContainer,
        text: neoBrutalism.colors.onSecondaryContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      secondary: {
        bg: neoBrutalism.colors.secondaryContainer,
        text: neoBrutalism.colors.onSecondaryContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      tertiary: {
        bg: neoBrutalism.colors.tertiaryContainer,
        text: neoBrutalism.colors.onTertiaryContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      error: {
        bg: neoBrutalism.colors.errorContainer,
        text: neoBrutalism.colors.onErrorContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      success: {
        bg: neoBrutalism.colors.successContainer,
        text: neoBrutalism.colors.onSuccessContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
    },
    outlined: {
      primary: {
        bg: 'transparent',
        text: neoBrutalism.colors.primary,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      secondary: {
        bg: 'transparent',
        text: neoBrutalism.colors.secondary,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      tertiary: {
        bg: 'transparent',
        text: neoBrutalism.colors.tertiary,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      error: {
        bg: 'transparent',
        text: neoBrutalism.colors.error,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      success: {
        bg: 'transparent',
        text: neoBrutalism.colors.success,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
    },
    text: {
      primary: {
        bg: 'transparent',
        text: neoBrutalism.colors.primary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      secondary: {
        bg: 'transparent',
        text: neoBrutalism.colors.secondary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      tertiary: {
        bg: 'transparent',
        text: neoBrutalism.colors.tertiary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      error: {
        bg: 'transparent',
        text: neoBrutalism.colors.error,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      success: {
        bg: 'transparent',
        text: neoBrutalism.colors.success,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
    },
  };

  const sizeMap = {
    small: {
      padding: '6px 16px',
      height: '32px',
      minWidth: '48px',
      fontSize: neoBrutalism.typography.labelMedium.fontSize,
      fontWeight: neoBrutalism.typography.labelMedium.fontWeight,
      letterSpacing: neoBrutalism.typography.labelMedium.letterSpacing,
    },
    medium: {
      padding: '10px 24px',
      height: '40px',
      minWidth: '64px',
      fontSize: neoBrutalism.typography.labelLarge.fontSize,
      fontWeight: neoBrutalism.typography.labelLarge.fontWeight,
      letterSpacing: neoBrutalism.typography.labelLarge.letterSpacing,
    },
    large: {
      padding: '14px 32px',
      height: '48px',
      minWidth: '80px',
      fontSize: neoBrutalism.typography.labelLarge.fontSize,
      fontWeight: neoBrutalism.typography.labelLarge.fontWeight,
      letterSpacing: neoBrutalism.typography.labelLarge.letterSpacing,
    },
  };

  const colors = colorMap[variant][color];
  const sizes = sizeMap[size];

  const buttonStyle: CSSProperties = {
    backgroundColor: colors.bg,
    color: colors.text,
    border: colors.border || 'none',
    borderRadius: neoBrutalism.shape.full,
    ...sizes,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : colors.elevation.shadow,
    transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.standard}`,
    fontFamily: neoBrutalism.typography.fontFamily.brand,
    opacity: disabled ? 0.38 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon ? neoBrutalism.spacing.sm : 0,
    width: fullWidth ? '100%' : 'auto',
    textTransform: 'none',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  // Material 3 State Layer (hover overlay)
  const getStateLayerColor = () => {
    if (variant === 'filled') {
      return colors.text;
    }
    return colors.text;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      // MD3 hover state: elevation + state layer
      e.currentTarget.style.boxShadow = colors.hoverElevation.shadow;

      // Add state layer overlay
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = String(neoBrutalism.states.hover);
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.boxShadow = colors.elevation.shadow;

      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = '0';
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      // MD3 pressed state
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = String(neoBrutalism.states.pressed);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = String(neoBrutalism.states.hover);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (!disabled) {
      // MD3 focus state
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = String(neoBrutalism.states.focus);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = '0';
      }
    }
  };

  return (
    <button
      onClick={onClick}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      title={title}
    >
      {/* MD3 State Layer Overlay */}
      <span
        className="state-layer"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: getStateLayerColor(),
          opacity: 0,
          transition: `opacity ${neoBrutalism.motion.duration.short1}`,
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />

      {/* Button Content */}
      <span style={{ display: 'flex', alignItems: 'center', gap: icon ? neoBrutalism.spacing.sm : 0, position: 'relative', zIndex: 1 }}>
        {icon && <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.2em' }}>{icon}</span>}
        {children}
      </span>
    </button>
  );
}

// Icon-only button variant - Material 3 Standard Icon Button
export function NeoIconButton({
  children,
  onClick,
  variant = 'standard',
  disabled = false,
  style = {},
  title,
  color = 'primary',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'standard' | 'filled' | 'tonal' | 'outlined';
  disabled?: boolean;
  style?: CSSProperties;
  title?: string;
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success';
}) {
  // Material 3 Icon Button variants
  const variantMap = {
    standard: {
      primary: {
        bg: 'transparent',
        text: neoBrutalism.colors.primary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      secondary: {
        bg: 'transparent',
        text: neoBrutalism.colors.secondary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      tertiary: {
        bg: 'transparent',
        text: neoBrutalism.colors.tertiary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      error: {
        bg: 'transparent',
        text: neoBrutalism.colors.error,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      success: {
        bg: 'transparent',
        text: neoBrutalism.colors.success,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
    },
    filled: {
      primary: {
        bg: neoBrutalism.colors.primary,
        text: neoBrutalism.colors.onPrimary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      secondary: {
        bg: neoBrutalism.colors.secondary,
        text: neoBrutalism.colors.onSecondary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      tertiary: {
        bg: neoBrutalism.colors.tertiary,
        text: neoBrutalism.colors.onTertiary,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      error: {
        bg: neoBrutalism.colors.error,
        text: neoBrutalism.colors.onError,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      success: {
        bg: neoBrutalism.colors.success,
        text: neoBrutalism.colors.onSuccess,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
    },
    tonal: {
      primary: {
        bg: neoBrutalism.colors.secondaryContainer,
        text: neoBrutalism.colors.onSecondaryContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      secondary: {
        bg: neoBrutalism.colors.secondaryContainer,
        text: neoBrutalism.colors.onSecondaryContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      tertiary: {
        bg: neoBrutalism.colors.tertiaryContainer,
        text: neoBrutalism.colors.onTertiaryContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      error: {
        bg: neoBrutalism.colors.errorContainer,
        text: neoBrutalism.colors.onErrorContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
      success: {
        bg: neoBrutalism.colors.successContainer,
        text: neoBrutalism.colors.onSuccessContainer,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level1,
      },
    },
    outlined: {
      primary: {
        bg: 'transparent',
        text: neoBrutalism.colors.primary,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      secondary: {
        bg: 'transparent',
        text: neoBrutalism.colors.secondary,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      tertiary: {
        bg: 'transparent',
        text: neoBrutalism.colors.tertiary,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      error: {
        bg: 'transparent',
        text: neoBrutalism.colors.error,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
      success: {
        bg: 'transparent',
        text: neoBrutalism.colors.success,
        border: `1px solid ${neoBrutalism.colors.outline}`,
        elevation: neoBrutalism.elevation.level0,
        hoverElevation: neoBrutalism.elevation.level0,
      },
    },
  };

  const colors = variantMap[variant][color];

  const buttonStyle: CSSProperties = {
    backgroundColor: colors.bg,
    color: colors.text,
    border: colors.border || 'none',
    borderRadius: neoBrutalism.shape.full,
    padding: neoBrutalism.spacing.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : colors.elevation.shadow,
    transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.standard}`,
    opacity: disabled ? 0.38 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    minHeight: '40px',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.boxShadow = colors.hoverElevation.shadow;
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = String(neoBrutalism.states.hover);
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.boxShadow = colors.elevation.shadow;
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = '0';
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = String(neoBrutalism.states.pressed);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = String(neoBrutalism.states.hover);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = String(neoBrutalism.states.focus);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (!disabled) {
      const overlay = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (overlay) {
        overlay.style.opacity = '0';
      }
    }
  };

  return (
    <button
      onClick={onClick}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      title={title}
    >
      {/* MD3 State Layer */}
      <span
        className="state-layer"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: colors.text,
          opacity: 0,
          transition: `opacity ${neoBrutalism.motion.duration.short1}`,
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />

      {/* Icon Content */}
      <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center' }}>
        {children}
      </span>
    </button>
  );
}
