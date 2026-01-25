import { IoMdHelpCircle, IoMdClose } from 'react-icons/io';
import neoBrutalism from '../styles/neobrutalism';

interface NeoHeaderProps {
  title: string;
  subtitle?: string;
  onHelp?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function NeoHeader({ title, subtitle, onHelp, onClose, isMobile = false }: NeoHeaderProps) {
  const buttonStyle = {
    backgroundColor: neoBrutalism.colors.surface,
    border: neoBrutalism.borders.thick,
    borderRadius: neoBrutalism.radius.none,
    padding: neoBrutalism.spacing.md,
    cursor: 'pointer',
    boxShadow: neoBrutalism.shadows.small,
    transition: neoBrutalism.transitions.fast,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: neoBrutalism.colors.text.primary,
    fontWeight: neoBrutalism.typography.fontWeight.bold,
  };

  return (
    <div style={{
      backgroundColor: neoBrutalism.colors.primary,
      borderBottom: neoBrutalism.borders.extraThick,
      padding: `${neoBrutalism.spacing.lg} ${neoBrutalism.spacing.xl}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: neoBrutalism.shadows.medium,
    }}>
      {/* Title Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: neoBrutalism.spacing.xs,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: isMobile ? neoBrutalism.typography.fontSize['2xl'] : neoBrutalism.typography.fontSize['3xl'],
          fontWeight: neoBrutalism.typography.fontWeight.black,
          color: neoBrutalism.colors.text.primary,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontFamily: neoBrutalism.typography.fontFamily.base,
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            margin: 0,
            fontSize: neoBrutalism.typography.fontSize.sm,
            fontWeight: neoBrutalism.typography.fontWeight.bold,
            color: neoBrutalism.colors.text.primary,
            maxWidth: isMobile ? '200px' : '400px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: 0.8,
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: neoBrutalism.spacing.md,
      }}>
        {onHelp && (
          <button
            onClick={onHelp}
            style={buttonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = neoBrutalism.shadows.small;
            }}
            title="Ayuda"
          >
            <IoMdHelpCircle size={isMobile ? 20 : 24} />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            style={{
              ...buttonStyle,
              backgroundColor: neoBrutalism.colors.error,
              color: neoBrutalism.colors.text.inverse,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = neoBrutalism.shadows.small;
            }}
            title="Cerrar"
          >
            <IoMdClose size={isMobile ? 20 : 24} />
          </button>
        )}
      </div>
    </div>
  );
}
