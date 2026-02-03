import { useState, useRef, useEffect, useCallback } from 'react';
import { IoMdClose, IoMdCloudUpload, IoMdCheckmark } from 'react-icons/io';
import { FiUpload } from 'react-icons/fi';
import neoBrutalism from '../styles/neobrutalism';

// Neobrutal colors
const colors = {
  bg: neoBrutalism.colors.background,
  surface: neoBrutalism.colors.surface,
  card: neoBrutalism.colors.surface,
  border: neoBrutalism.colors.border,
  primary: neoBrutalism.colors.primary,
  secondary: neoBrutalism.colors.secondary,
  accent: neoBrutalism.colors.accent,
  danger: neoBrutalism.colors.error,
  success: neoBrutalism.colors.success,
  text: neoBrutalism.colors.text.primary,
  textSecondary: neoBrutalism.colors.text.secondary,
  textMuted: neoBrutalism.colors.text.muted,
};

interface ReplaceIntroModalProps {
  videoId: string;
  onClose: () => void;
  onSuccess: (newVideoId: string) => void;
}

export default function ReplaceIntroModal({ videoId, onClose, onSuccess }: ReplaceIntroModalProps) {
  const [duration, setDuration] = useState<number>(5);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle file selection from input
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, etc.)');
      return;
    }

    setImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle paste event (Ctrl+V)
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFileSelect(file);
          break;
        }
      }
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Setup paste listener
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!image) {
      setError('Please select or paste an image');
      return;
    }

    if (duration <= 0) {
      setError('Duration must be greater than 0');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('duration', duration.toString());

      const response = await fetch(`/api/videos/${videoId}/replace-intro`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to replace intro');
      }

      const data = await response.json();
      onSuccess(data.video.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }}>
      <div style={{
        background: colors.surface,
        border: neoBrutalism.borders.extraThick,
        boxShadow: neoBrutalism.shadows.xl,
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          background: colors.primary,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: neoBrutalism.borders.thick,
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: neoBrutalism.typography.fontWeight.black,
            color: colors.text,
            textTransform: 'uppercase',
          }}>
            Replace Intro
          </h2>
          <button
            onClick={onClose}
            style={{
              background: colors.text,
              border: neoBrutalism.borders.medium,
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={isProcessing}
          >
            <IoMdClose size={24} color={colors.primary} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Duration Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: neoBrutalism.typography.fontWeight.bold,
              color: colors.text,
              textTransform: 'uppercase',
            }}>
              Duration to Replace (seconds)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: neoBrutalism.typography.fontWeight.medium,
                border: neoBrutalism.borders.thick,
                background: colors.bg,
                color: colors.text,
                outline: 'none',
              }}
              disabled={isProcessing}
            />
            <p style={{
              margin: '8px 0 0',
              fontSize: '12px',
              color: colors.textMuted,
            }}>
              The first {duration} seconds will be replaced with your image
            </p>
          </div>

          {/* Image Drop Zone */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: neoBrutalism.typography.fontWeight.bold,
              color: colors.text,
              textTransform: 'uppercase',
            }}>
              Image
            </label>
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: neoBrutalism.borders.thick,
                borderColor: dragOver ? colors.accent : colors.border,
                background: dragOver ? colors.accent + '20' : colors.bg,
                padding: '32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      border: neoBrutalism.borders.medium,
                    }}
                  />
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: neoBrutalism.typography.fontWeight.bold,
                    color: colors.success,
                  }}>
                    <IoMdCheckmark size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Image loaded: {image?.name}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: colors.textMuted,
                  }}>
                    Click to change or paste another image (Ctrl+V)
                  </p>
                </>
              ) : (
                <>
                  <FiUpload size={48} color={colors.text} />
                  <p style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: neoBrutalism.typography.fontWeight.bold,
                    color: colors.text,
                  }}>
                    Drop image here or click to browse
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: colors.textSecondary,
                  }}>
                    Or press <strong>Ctrl+V</strong> to paste from clipboard
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: colors.textMuted,
                  }}>
                    Supports JPG, PNG, WebP, etc.
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              style={{ display: 'none' }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              background: colors.danger,
              border: neoBrutalism.borders.medium,
              marginBottom: '16px',
            }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: neoBrutalism.typography.fontWeight.bold,
                color: colors.text,
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={onClose}
              disabled={isProcessing}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: neoBrutalism.typography.fontWeight.bold,
                border: neoBrutalism.borders.thick,
                background: colors.surface,
                color: colors.text,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.5 : 1,
                textTransform: 'uppercase',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !image}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: neoBrutalism.typography.fontWeight.bold,
                border: neoBrutalism.borders.thick,
                background: isProcessing || !image ? colors.textMuted : colors.success,
                color: colors.text,
                cursor: isProcessing || !image ? 'not-allowed' : 'pointer',
                boxShadow: isProcessing || !image ? 'none' : neoBrutalism.shadows.medium,
                textTransform: 'uppercase',
              }}
            >
              {isProcessing ? 'Processing...' : 'Replace Intro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
