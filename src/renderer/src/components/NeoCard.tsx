import { CSSProperties, ReactNode } from 'react';
import neoBrutalism from '../styles/neobrutalism';

interface NeoCardProps {
  children: ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
}

/**
 * Material Design 3 Card Component
 *
 * Variants:
 * - elevated: Default card with shadow (most common)
 * - filled: Card with surface tint color
 * - outlined: Card with border, no shadow
 *
 * Elevations: 0-5 (higher = more shadow)
 */
export default function NeoCard({
  children,
  variant = 'elevated',
  elevation = 1,
  style = {},
  onClick,
  className,
}: NeoCardProps) {
  const getCardStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      borderRadius: neoBrutalism.shape.medium,
      padding: neoBrutalism.spacing.lg,
      transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.standard}`,
      position: 'relative',
      overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: neoBrutalism.colors.surfaceContainerLow,
          boxShadow: neoBrutalism.elevation[`level${elevation}`].shadow,
          border: 'none',
        };

      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: neoBrutalism.colors.surfaceContainerHighest,
          boxShadow: 'none',
          border: 'none',
        };

      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: neoBrutalism.colors.surface,
          boxShadow: 'none',
          border: `1px solid ${neoBrutalism.colors.outlineVariant}`,
        };

      default:
        return baseStyle;
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick && variant === 'elevated') {
      e.currentTarget.style.boxShadow = neoBrutalism.elevation[`level${Math.min(elevation + 1, 5)}`].shadow;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick && variant === 'elevated') {
      e.currentTarget.style.boxShadow = neoBrutalism.elevation[`level${elevation}`].shadow;
    }
  };

  return (
    <div
      style={{ ...getCardStyle(), ...style }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {/* State layer for interactive cards */}
      {onClick && (
        <span
          className="state-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: neoBrutalism.colors.onSurface,
            opacity: 0,
            transition: `opacity ${neoBrutalism.motion.duration.short1}`,
            pointerEvents: 'none',
            borderRadius: 'inherit',
          }}
        />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
