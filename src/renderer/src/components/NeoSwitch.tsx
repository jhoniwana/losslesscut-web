import { CSSProperties } from 'react';
import neoBrutalism from '../styles/neobrutalism';

interface NeoSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: CSSProperties;
}

/**
 * Material Design 3 Switch Component
 *
 * Toggle switch with Material Design 3 specs:
 * - 52x32px track
 * - 24x24px handle (16x16px when unchecked)
 * - State layers for interactions
 * - Icon support (optional)
 */
export default function NeoSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  style = {},
}: NeoSwitchProps) {
  const containerStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: neoBrutalism.spacing.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.38 : 1,
    userSelect: 'none',
    ...style,
  };

  const trackStyle: CSSProperties = {
    position: 'relative',
    width: '52px',
    height: '32px',
    borderRadius: neoBrutalism.shape.full,
    backgroundColor: checked
      ? neoBrutalism.colors.primary
      : neoBrutalism.colors.surfaceContainerHighest,
    border: checked
      ? 'none'
      : `2px solid ${neoBrutalism.colors.outline}`,
    transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.standard}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  const handleStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: checked ? 'calc(100% - 28px)' : '4px',
    transform: 'translateY(-50%)',
    width: checked ? '24px' : '16px',
    height: checked ? '24px' : '16px',
    borderRadius: neoBrutalism.shape.full,
    backgroundColor: checked
      ? neoBrutalism.colors.onPrimary
      : neoBrutalism.colors.outline,
    transition: `all ${neoBrutalism.motion.duration.short4} ${neoBrutalism.motion.easing.emphasizedDecelerate}`,
    boxShadow: neoBrutalism.elevation.level1.shadow,
  };

  const stateLayerStyle: CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: checked ? 'calc(100% - 28px)' : '4px',
    transform: 'translate(-50%, -50%)',
    width: '40px',
    height: '40px',
    borderRadius: neoBrutalism.shape.full,
    backgroundColor: checked
      ? neoBrutalism.colors.primary
      : neoBrutalism.colors.onSurface,
    opacity: 0,
    transition: `opacity ${neoBrutalism.motion.duration.short1}`,
    pointerEvents: 'none',
  };

  const labelStyle: CSSProperties = {
    ...neoBrutalism.typography.bodyLarge,
    fontFamily: neoBrutalism.typography.fontFamily.plain,
    color: neoBrutalism.colors.onSurface,
  };

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!disabled) {
      const stateLayer = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (stateLayer) {
        stateLayer.style.opacity = String(neoBrutalism.states.hover);
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (!disabled) {
      const stateLayer = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (stateLayer) {
        stateLayer.style.opacity = '0';
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!disabled) {
      const stateLayer = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (stateLayer) {
        stateLayer.style.opacity = String(neoBrutalism.states.pressed);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!disabled) {
      const stateLayer = e.currentTarget.querySelector('.state-layer') as HTMLElement;
      if (stateLayer) {
        stateLayer.style.opacity = String(neoBrutalism.states.hover);
      }
    }
  };

  return (
    <label style={containerStyle} onClick={handleClick}>
      <div
        style={trackStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {/* State Layer */}
        <span className="state-layer" style={stateLayerStyle} />

        {/* Handle */}
        <span style={handleStyle} />
      </div>

      {label && <span style={labelStyle}>{label}</span>}
    </label>
  );
}
