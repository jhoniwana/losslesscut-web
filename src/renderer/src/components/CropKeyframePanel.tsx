import { useState, useEffect, useCallback } from 'react';
import neoBrutalism from '../styles/neobrutalism';
import { FiCrop, FiMove, FiX, FiZoomIn, FiSmartphone, FiYoutube, FiInstagram, FiImage, FiSquare, FiFilm, FiMonitor, FiTool, FiCheck, FiCopy } from 'react-icons/fi';
import { IoMdCheckmarkCircle } from 'react-icons/io';
import { Segment } from '../api/client';
import { CropConfig } from './CropSelector';

const colors = {
  bg: neoBrutalism.colors.background,
  surface: neoBrutalism.colors.surface,
  card: neoBrutalism.colors.surfaceContainerHigh,
  border: neoBrutalism.colors.outline,
  primary: neoBrutalism.colors.primary,
  secondary: neoBrutalism.colors.secondary,
  accent: neoBrutalism.colors.tertiary,
  danger: neoBrutalism.colors.error,
  text: neoBrutalism.colors.onSurface,
  textSecondary: neoBrutalism.colors.onSurfaceVariant,
  textMuted: neoBrutalism.colors.onSurfaceVariant,
  gradient: `linear-gradient(135deg, ${neoBrutalism.colors.primary} 0%, ${neoBrutalism.colors.secondary} 100%)`,
};

interface CropPreset {
  id: 'tiktok' | 'ytshorts' | 'igfeed' | 'instagram' | 'youtube' | 'cinema' | 'portrait43' | 'free';
  name: string;
  aspectRatio: number | null;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
}

const PRESETS: CropPreset[] = [
  { id: 'tiktok', name: '9:16', aspectRatio: 9 / 16, description: 'TikTok, Reels', icon: FiSmartphone, color: neoBrutalism.colors.error },
  { id: 'ytshorts', name: '9:16', aspectRatio: 9 / 16, description: 'YouTube Shorts', icon: FiYoutube, color: '#FF0000' },
  { id: 'igfeed', name: '4:5', aspectRatio: 4 / 5, description: 'Instagram Feed', icon: FiInstagram, color: '#E1306C' },
  { id: 'portrait43', name: '3:4', aspectRatio: 3 / 4, description: 'Retrato vertical', icon: FiImage, color: '#AA66FF' },
  { id: 'instagram', name: '1:1', aspectRatio: 1, description: 'Instagram cuadrado', icon: FiSquare, color: neoBrutalism.colors.primary },
  { id: 'youtube', name: '16:9', aspectRatio: 16 / 9, description: 'YouTube, TV', icon: FiFilm, color: '#FF4466' },
  { id: 'cinema', name: '21:9', aspectRatio: 21 / 9, description: 'Cinematográfico', icon: FiMonitor, color: neoBrutalism.colors.tertiary },
  { id: 'free', name: 'Libre', aspectRatio: null, description: 'Tamaño personalizado', icon: FiTool, color: neoBrutalism.colors.onSurfaceVariant },
];

interface Props {
  segments: Segment[];
  videoWidth: number;
  videoHeight: number;
  globalCropConfig: CropConfig;
  onGlobalCropChange: (config: CropConfig) => void;
  onSegmentCropChange: (segmentId: string, cropConfig: CropConfig | null) => void;
  onClose: () => void;
  currentTime: number;
  onSeekTo: (time: number) => void;
  initialSegmentId?: string | null;
}

export default function CropKeyframePanel({
  segments,
  videoWidth,
  videoHeight,
  globalCropConfig,
  onGlobalCropChange,
  onSegmentCropChange,
  onClose,
  currentTime,
  onSeekTo,
  initialSegmentId,
}: Props) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(initialSegmentId || null);
  const [editingCrop, setEditingCrop] = useState<CropConfig | null>(null);

  // Find currently playing segment
  const currentSegment = segments.find(s =>
    currentTime >= s.start && (!s.end || currentTime <= s.end)
  );

  // Select first segment by default if no initial segment provided
  useEffect(() => {
    if (!selectedSegmentId && segments.length > 0) {
      setSelectedSegmentId(segments[0].id);
    }
  }, [segments, selectedSegmentId]);

  // Load crop config when segment is selected
  useEffect(() => {
    if (!selectedSegmentId) return;

    const segment = segments.find(s => s.id === selectedSegmentId);
    if (!segment) return;

    if (segment.cropConfig) {
      // Load the segment's specific crop config
      setEditingCrop({
        enabled: segment.cropConfig.enabled,
        preset: segment.cropConfig.preset as any,
        x: segment.cropConfig.x,
        y: segment.cropConfig.y,
        width: segment.cropConfig.width,
        height: segment.cropConfig.height,
      });
    } else {
      // No crop config for this segment - start fresh
      setEditingCrop(null);
    }
  }, [selectedSegmentId]);

  const applyPresetToSegment = useCallback((preset: CropPreset['id']) => {
    const presetInfo = PRESETS.find(p => p.id === preset);
    if (!presetInfo) return;

    let baseWidth = videoWidth;
    let baseHeight = videoHeight;

    if (presetInfo.aspectRatio !== null) {
      const targetRatio = presetInfo.aspectRatio;
      const currentRatio = videoWidth / videoHeight;

      if (currentRatio > targetRatio) {
        baseWidth = Math.round(videoHeight * targetRatio);
        baseHeight = videoHeight;
      } else {
        baseWidth = videoWidth;
        baseHeight = Math.round(videoWidth / targetRatio);
      }
    }

    const newX = Math.round((videoWidth - baseWidth) / 2);
    const newY = Math.round((videoHeight - baseHeight) / 2);

    const newCrop: CropConfig = {
      enabled: true,
      preset,
      x: newX,
      y: newY,
      width: baseWidth,
      height: baseHeight,
    };

    setEditingCrop(newCrop);
  }, [videoWidth, videoHeight]);

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    if (!editingCrop) return;

    if (axis === 'x') {
      const maxX = videoWidth - editingCrop.width;
      const newX = Math.max(0, Math.min(maxX, value));
      setEditingCrop({ ...editingCrop, x: newX });
    } else {
      const maxY = videoHeight - editingCrop.height;
      const newY = Math.max(0, Math.min(maxY, value));
      setEditingCrop({ ...editingCrop, y: newY });
    }
  };

  const applyCropToSegment = () => {
    if (!selectedSegmentId || !editingCrop) return;
    onSegmentCropChange(selectedSegmentId, editingCrop);
  };

  const applyCropToAllSegments = () => {
    if (!editingCrop) return;
    segments.forEach(segment => {
      onSegmentCropChange(segment.id, editingCrop);
    });
  };

  const removeCropFromSegment = () => {
    if (!selectedSegmentId) return;
    onSegmentCropChange(selectedSegmentId, null);
    setEditingCrop(null);
  };

  const applyGlobalCrop = () => {
    if (!editingCrop) return;
    onGlobalCropChange(editingCrop);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedSegment = segments.find(s => s.id === selectedSegmentId);

  return (
    <div style={{
      background: colors.surface,
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${colors.border}`,
      maxHeight: '80vh',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FiCrop size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color: colors.text, fontWeight: '600', fontSize: '15px' }}>
              Recorte por Clip
            </div>
            <div style={{ color: colors.textMuted, fontSize: '11px' }}>
              Ajusta el encuadre de cada segmento
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: colors.card,
            border: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
          }}
        >
          <FiX size={18} />
        </button>
      </div>

      {/* Presets Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '16px',
      }}>
        {PRESETS.map((preset) => {
          const isActive = editingCrop?.preset === preset.id && editingCrop?.enabled;
          const IconComponent = preset.icon;
          return (
            <button
              key={preset.id}
              onClick={() => applyPresetToSegment(preset.id)}
              style={{
                background: isActive ? `${preset.color}22` : colors.card,
                border: `2px solid ${isActive ? preset.color : colors.border}`,
                borderRadius: '10px',
                padding: '12px 8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IconComponent size={24} color={isActive ? preset.color : colors.textMuted} />
              </div>
              <div style={{
                color: isActive ? preset.color : colors.text,
                fontSize: '14px',
                fontWeight: '700',
              }}>
                {preset.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Segments List */}
      <div style={{
        background: colors.card,
        borderRadius: '10px',
        padding: '12px',
        marginBottom: '16px',
        maxHeight: '200px',
        overflowY: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
        }}>
          <FiFilm size={14} color={colors.textMuted} />
          <span style={{ color: colors.textMuted, fontSize: '12px', fontWeight: '600' }}>
            CLIPS ({segments.length})
          </span>
        </div>
        {segments.map((segment) => {
          const isSelected = selectedSegmentId === segment.id;
          const isCurrent = currentSegment?.id === segment.id;
          const hasCrop = !!segment.cropConfig?.enabled;

          return (
            <button
              key={segment.id}
              onClick={() => {
                setSelectedSegmentId(segment.id);
                onSeekTo(segment.start);
              }}
              style={{
                width: '100%',
                background: isSelected ? `${colors.primary}22` : 'transparent',
                border: `1px solid ${isSelected ? colors.primary : 'transparent'}`,
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '6px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  color: isSelected ? colors.primary : colors.text,
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '2px',
                }}>
                  {segment.name || `Clip ${segments.indexOf(segment) + 1}`}
                </div>
                <div style={{
                  color: colors.textMuted,
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}>
                  {formatTime(segment.start)} - {formatTime(segment.end || 0)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {isCurrent && (
                  <div style={{
                    background: colors.accent,
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '9px',
                    fontWeight: '700',
                    color: '#fff',
                  }}>
                    NOW
                  </div>
                )}
                {hasCrop && (
                  <div style={{
                    background: colors.primary,
                    borderRadius: '4px',
                    padding: '3px 6px',
                    fontSize: '10px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}>
                    <FiCrop size={10} />
                    {segment.cropConfig?.preset}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Position Controls */}
      {editingCrop && selectedSegment && (
        <>
          <div style={{
            background: colors.card,
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '12px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}>
              <FiMove size={16} color={colors.primary} />
              <span style={{ color: colors.text, fontSize: '13px', fontWeight: '600' }}>
                Ajustar posición - {selectedSegment.name}
              </span>
            </div>

            {/* X Slider */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                marginBottom: '6px',
              }}>
                <span style={{ color: colors.textMuted }}>Horizontal</span>
                <span style={{ color: colors.primary, fontFamily: 'monospace' }}>{editingCrop.x}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, videoWidth - editingCrop.width)}
                value={editingCrop.x}
                onChange={(e) => handlePositionChange('x', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '8px',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: colors.border,
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* Y Slider */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                marginBottom: '6px',
              }}>
                <span style={{ color: colors.textMuted }}>Vertical</span>
                <span style={{ color: colors.primary, fontFamily: 'monospace' }}>{editingCrop.y}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, videoHeight - editingCrop.height)}
                value={editingCrop.y}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value))}
                style={{
                  width: '100%',
                  height: '8px',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: colors.border,
                  borderRadius: '4px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          {/* Output Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            background: colors.card,
            borderRadius: '8px',
            marginBottom: '12px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: colors.textMuted, fontSize: '10px', marginBottom: '2px' }}>Original</div>
              <div style={{ color: colors.text, fontSize: '12px', fontFamily: 'monospace' }}>{videoWidth}×{videoHeight}</div>
            </div>
            <div style={{ color: colors.textMuted }}>→</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: colors.textMuted, fontSize: '10px', marginBottom: '2px' }}>Salida</div>
              <div style={{ color: colors.primary, fontSize: '12px', fontFamily: 'monospace', fontWeight: '600' }}>
                {editingCrop.width}×{editingCrop.height}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={applyCropToSegment}
              style={{
                width: '100%',
                background: colors.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <FiCheck size={16} />
              Aplicar a este clip
            </button>

            <button
              onClick={applyCropToAllSegments}
              style={{
                width: '100%',
                background: colors.secondary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <FiCopy size={16} />
              Aplicar a todos los clips
            </button>

            {selectedSegment.cropConfig && (
              <button
                onClick={removeCropFromSegment}
                style={{
                  width: '100%',
                  background: 'transparent',
                  color: colors.danger,
                  border: `1px solid ${colors.danger}`,
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <FiX size={16} />
                Quitar crop de este clip
              </button>
            )}
          </div>
        </>
      )}

      {/* Help text when no crop */}
      {!editingCrop && (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          color: colors.textMuted,
          fontSize: '12px',
        }}>
          Selecciona un formato para comenzar a recortar
        </div>
      )}
    </div>
  );
}
