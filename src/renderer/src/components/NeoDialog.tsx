import { CSSProperties, ReactNode, useEffect } from 'react';
import neoBrutalism from '../styles/neobrutalism';
import { NeoIconButton } from './NeoButton';
import { IoMdClose } from 'react-icons/io';

interface NeoDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fullScreen?: boolean;
  style?: CSSProperties;
}

/**
 * Material Design 3 Dialog Component
 *
 * Full-screen dialogs for mobile or complex forms
 * Modal dialogs for confirmations and simple inputs
 *
 * Follows MD3 specs:
 * - Surface container highest background
 * - Level 3 elevation
 * - 28px border radius (extraLarge shape)
 */
export default function NeoDialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'md',
  fullScreen = false,
  style = {},
}: NeoDialogProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthMap = {
    sm: '400px',
    md: '560px',
    lg: '800px',
    xl: '1200px',
    full: '95vw',
  };

  const scrimStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: neoBrutalism.colors.scrim,
    opacity: 0.32,
    zIndex: 1000,
    animation: 'fadeIn 200ms ease-out',
  };

  const dialogContainerStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: fullScreen ? 0 : neoBrutalism.spacing.lg,
    zIndex: 1001,
    animation: `slideUp ${neoBrutalism.motion.duration.medium2} ${neoBrutalism.motion.easing.emphasizedDecelerate}`,
  };

  const dialogStyle: CSSProperties = {
    backgroundColor: neoBrutalism.colors.surfaceContainerHigh,
    borderRadius: fullScreen ? 0 : neoBrutalism.shape.extraLarge,
    boxShadow: neoBrutalism.elevation.level3.shadow,
    maxWidth: fullScreen ? '100%' : maxWidthMap[maxWidth],
    width: '100%',
    maxHeight: fullScreen ? '100%' : '90vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    ...style,
  };

  const headerStyle: CSSProperties = {
    padding: neoBrutalism.spacing.xl,
    paddingBottom: neoBrutalism.spacing.md,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: title ? `1px solid ${neoBrutalism.colors.outlineVariant}` : 'none',
  };

  const titleStyle: CSSProperties = {
    ...neoBrutalism.typography.headlineSmall,
    color: neoBrutalism.colors.onSurface,
    fontFamily: neoBrutalism.typography.fontFamily.brand,
    margin: 0,
  };

  const contentStyle: CSSProperties = {
    padding: neoBrutalism.spacing.xl,
    flex: 1,
    overflowY: 'auto',
    color: neoBrutalism.colors.onSurface,
  };

  const actionsStyle: CSSProperties = {
    padding: neoBrutalism.spacing.xl,
    paddingTop: neoBrutalism.spacing.md,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: neoBrutalism.spacing.sm,
    borderTop: actions ? `1px solid ${neoBrutalism.colors.outlineVariant}` : 'none',
  };

  return (
    <>
      {/* Scrim (backdrop) */}
      <div style={scrimStyle} onClick={onClose} />

      {/* Dialog */}
      <div style={dialogContainerStyle} onClick={onClose}>
        <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          {title && (
            <div style={headerStyle}>
              <h2 style={titleStyle}>{title}</h2>
              <NeoIconButton
                onClick={onClose}
                variant="standard"
                title="Cerrar"
              >
                <IoMdClose size={24} />
              </NeoIconButton>
            </div>
          )}

          {/* Content */}
          <div style={contentStyle}>
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div style={actionsStyle}>
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 0.32; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
