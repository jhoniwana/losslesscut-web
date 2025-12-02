import { memo, forwardRef, ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { motion } from 'framer-motion';
import styles from './Button.module.css';

export interface ButtonProps extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  darkMode?: boolean;
}

const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>(({
  className = '',
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  iconPosition = 'left',
  darkMode = false,
  children,
  disabled,
  ...props
}, ref) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    loading && styles.loading,
    icon && iconPosition && styles.withIcon,
    darkMode && styles.dark,
    className
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={buttonClasses}
      disabled={disabled || loading}
      ref={ref}
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading && (
        <motion.div
          className={styles.spinner}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      
      {icon && iconPosition === 'left' && (
        <span className={styles.iconLeft}>{icon}</span>
      )}
      
      {children && (
        <span className={styles.text}>{children}</span>
      )}
      
      {icon && iconPosition === 'right' && (
        <span className={styles.iconRight}>{icon}</span>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;