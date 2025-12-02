import { memo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
  darkMode?: boolean;
}

const Loading = memo(({ size = 'medium', text, overlay = false, darkMode = false }: LoadingProps) => {
  const sizeClass = `loading-${size}`;
  
  if (overlay) {
    return (
      <div className={`${styles.loadingOverlay} ${darkMode ? styles.dark : styles.light}`}>
        <div className={styles.loadingBackdrop}>
          <motion.div
            className={`${styles.spinner} ${sizeClass}`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          {text && <p className={styles.loadingText}>{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.loadingContainer} ${sizeClass} ${darkMode ? styles.dark : styles.light}`}>
      <motion.div
        className={styles.spinner}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <p className={styles.loadingText}>{text}</p>}
    </div>
  );
});

Loading.displayName = 'Loading';

export default Loading;