import { CSSProperties, forwardRef, InputHTMLAttributes } from 'react';
import neoBrutalism from '../styles/neobrutalism';

interface NeoInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: boolean;
  helperText?: string;
  variant?: 'filled' | 'outlined';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Material Design 3 Text Field Component
 *
 * Variants:
 * - filled: Default filled text field with bottom border
 * - outlined: Outlined text field with border all around
 *
 * Supports:
 * - Labels (floating)
 * - Prefix/suffix icons or text
 * - Error states
 * - Helper text
 */
const NeoInput = forwardRef<HTMLInputElement, NeoInputProps>(
  (
    {
      label,
      error = false,
      helperText,
      variant = 'filled',
      prefix,
      suffix,
      fullWidth = false,
      style,
      ...props
    },
    ref
  ) => {
    const containerStyle: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      gap: neoBrutalism.spacing.xs,
      width: fullWidth ? '100%' : 'auto',
      ...style,
    };

    const inputWrapperStyle: CSSProperties = {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    };

    const getInputStyle = (): CSSProperties => {
      const baseStyle: CSSProperties = {
        ...neoBrutalism.typography.bodyLarge,
        fontFamily: neoBrutalism.typography.fontFamily.plain,
        color: neoBrutalism.colors.onSurface,
        padding: prefix
          ? `24px 16px 8px 48px`
          : suffix
          ? `24px 48px 8px 16px`
          : `24px 16px 8px 16px`,
        width: '100%',
        transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.standard}`,
        outline: 'none',
      };

      if (variant === 'filled') {
        return {
          ...baseStyle,
          backgroundColor: error
            ? neoBrutalism.colors.errorContainer
            : neoBrutalism.colors.surfaceContainerHighest,
          border: 'none',
          borderBottom: error
            ? `2px solid ${neoBrutalism.colors.error}`
            : `1px solid ${neoBrutalism.colors.onSurfaceVariant}`,
          borderRadius: `${neoBrutalism.shape.extraSmall} ${neoBrutalism.shape.extraSmall} 0 0`,
        };
      }

      // outlined
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        border: error
          ? `2px solid ${neoBrutalism.colors.error}`
          : `1px solid ${neoBrutalism.colors.outline}`,
        borderRadius: neoBrutalism.shape.extraSmall,
      };
    };

    const labelStyle: CSSProperties = {
      position: 'absolute',
      left: prefix ? '48px' : '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      ...neoBrutalism.typography.bodyLarge,
      fontFamily: neoBrutalism.typography.fontFamily.plain,
      color: error
        ? neoBrutalism.colors.error
        : neoBrutalism.colors.onSurfaceVariant,
      pointerEvents: 'none',
      transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.standard}`,
    };

    const prefixSuffixStyle: CSSProperties = {
      position: 'absolute',
      color: error
        ? neoBrutalism.colors.error
        : neoBrutalism.colors.onSurfaceVariant,
      display: 'flex',
      alignItems: 'center',
      ...neoBrutalism.typography.bodyLarge,
    };

    const helperTextStyle: CSSProperties = {
      ...neoBrutalism.typography.bodySmall,
      fontFamily: neoBrutalism.typography.fontFamily.plain,
      color: error
        ? neoBrutalism.colors.error
        : neoBrutalism.colors.onSurfaceVariant,
      paddingLeft: neoBrutalism.spacing.lg,
      margin: 0,
    };

    return (
      <div style={containerStyle}>
        <div style={inputWrapperStyle}>
          {/* Label */}
          {label && (
            <label style={labelStyle}>
              {label}
            </label>
          )}

          {/* Prefix */}
          {prefix && (
            <span style={{ ...prefixSuffixStyle, left: '16px' }}>
              {prefix}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            style={getInputStyle()}
            {...props}
            onFocus={(e) => {
              // Float label on focus
              const label = e.currentTarget.previousElementSibling as HTMLLabelElement;
              if (label && label.tagName === 'LABEL') {
                label.style.top = '8px';
                label.style.transform = 'none';
                label.style.fontSize = neoBrutalism.typography.bodySmall.fontSize;
              }

              // Change border color
              if (variant === 'filled') {
                e.currentTarget.style.borderBottomWidth = '2px';
                e.currentTarget.style.borderBottomColor = error
                  ? neoBrutalism.colors.error
                  : neoBrutalism.colors.primary;
                e.currentTarget.style.paddingBottom = '7px';
              } else {
                e.currentTarget.style.borderWidth = '2px';
                e.currentTarget.style.borderColor = error
                  ? neoBrutalism.colors.error
                  : neoBrutalism.colors.primary;
              }

              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              // Reset label if no value
              const label = e.currentTarget.previousElementSibling as HTMLLabelElement;
              if (label && label.tagName === 'LABEL' && !e.currentTarget.value) {
                label.style.top = '50%';
                label.style.transform = 'translateY(-50%)';
                label.style.fontSize = neoBrutalism.typography.bodyLarge.fontSize;
              }

              // Reset border
              if (variant === 'filled') {
                e.currentTarget.style.borderBottomWidth = '1px';
                e.currentTarget.style.borderBottomColor = error
                  ? neoBrutalism.colors.error
                  : neoBrutalism.colors.onSurfaceVariant;
                e.currentTarget.style.paddingBottom = '8px';
              } else {
                e.currentTarget.style.borderWidth = '1px';
                e.currentTarget.style.borderColor = error
                  ? neoBrutalism.colors.error
                  : neoBrutalism.colors.outline;
              }

              props.onBlur?.(e);
            }}
          />

          {/* Suffix */}
          {suffix && (
            <span style={{ ...prefixSuffixStyle, right: '16px' }}>
              {suffix}
            </span>
          )}
        </div>

        {/* Helper text */}
        {helperText && <p style={helperTextStyle}>{helperText}</p>}
      </div>
    );
  }
);

NeoInput.displayName = 'NeoInput';

export default NeoInput;
