import { CSSProperties, ReactNode } from 'react';
import neoBrutalism from '../styles/neobrutalism';

interface NeoButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'dark';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: CSSProperties;
  title?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function NeoButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style = {},
  title,
  icon,
  fullWidth = false,
}: NeoButtonProps) {
  const colorMap = {
    primary: neoBrutalism.colors.primary,
    secondary: neoBrutalism.colors.secondary,
    accent: neoBrutalism.colors.accent,
    success: neoBrutalism.colors.success,
    error: neoBrutalism.colors.error,
    dark: neoBrutalism.colors.text.primary,
  };

  const sizeMap = {
    small: {
      padding: `${neoBrutalism.spacing.sm} ${neoBrutalism.spacing.md}`,
      fontSize: neoBrutalism.typography.fontSize.sm,
    },
    medium: {
      padding: `${neoBrutalism.spacing.md} ${neoBrutalism.spacing.xl}`,
      fontSize: neoBrutalism.typography.fontSize.base,
    },
    large: {
      padding: `${neoBrutalism.spacing.lg} ${neoBrutalism.spacing.xxl}`,
      fontSize: neoBrutalism.typography.fontSize.lg,
    },
  };

  const backgroundColor = colorMap[variant];
  const textColor = variant === 'dark' ? neoBrutalism.colors.text.inverse : neoBrutalism.colors.text.primary;

  const buttonStyle: CSSProperties = {
    backgroundColor,
    color: textColor,
    border: neoBrutalism.borders.thick,
    borderRadius: neoBrutalism.radius.none,
    ...sizeMap[size],
    fontWeight: neoBrutalism.typography.fontWeight.bold,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : neoBrutalism.shadows.medium,
    transition: neoBrutalism.transitions.fast,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: neoBrutalism.typography.fontFamily.base,
    opacity: disabled ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: icon ? neoBrutalism.spacing.sm : 0,
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translate(2px, 2px)';
      e.currentTarget.style.boxShadow = neoBrutalism.shadows.small;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translate(0, 0)';
      e.currentTarget.style.boxShadow = neoBrutalism.shadows.medium;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translate(6px, 6px)';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translate(2px, 2px)';
      e.currentTarget.style.boxShadow = neoBrutalism.shadows.small;
    }
  };

  return (
    <button
      onClick={handleClick}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disabled}
      title={title}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}

// Icon-only button variant
export function NeoIconButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  style = {},
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'dark';
  disabled?: boolean;
  style?: CSSProperties;
  title?: string;
}) {
  const colorMap = {
    primary: neoBrutalism.colors.primary,
    secondary: neoBrutalism.colors.secondary,
    accent: neoBrutalism.colors.accent,
    success: neoBrutalism.colors.success,
    error: neoBrutalism.colors.error,
    dark: neoBrutalism.colors.text.primary,
  };

  const backgroundColor = colorMap[variant];
  const textColor = variant === 'dark' ? neoBrutalism.colors.text.inverse : neoBrutalism.colors.text.primary;

  const buttonStyle: CSSProperties = {
    backgroundColor,
    color: textColor,
    border: neoBrutalism.borders.thick,
    borderRadius: neoBrutalism.radius.none,
    padding: neoBrutalism.spacing.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : neoBrutalism.shadows.small,
    transition: neoBrutalism.transitions.fast,
    opacity: disabled ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    ...style,
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translate(1px, 1px)';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translate(0, 0)';
      e.currentTarget.style.boxShadow = neoBrutalism.shadows.small;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translate(4px, 4px)';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      e.currentTarget.style.transform = 'translate(1px, 1px)';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  return (
    <button
      onClick={handleClick}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
