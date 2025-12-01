import { useState, useEffect, CSSProperties } from 'react';
import { IoMdClose, IoMdDownload, IoMdCheckmark, IoMdWarning } from 'react-icons/io';
import { FaYoutube } from 'react-icons/fa';
import { apiClient, Download } from '../api/client.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDownloadComplete?: (download: Download) => void;
}

// Neobrutalist color palette
const colors = {
  bg: '#0a0a0a',
  surface: '#141414',
  border: '#2a2a2a',
  accent1: '#00ff88', // Neon green
  accent2: '#ff6b35', // Orange
  accent3: '#a855f7', // Purple
  accent4: '#00d4ff', // Cyan
  text: '#ffffff',
  textMuted: '#888888',
  danger: '#ff3333',
};

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: colors.surface,
    border: `3px solid ${colors.accent4}`,
    boxShadow: `12px 12px 0 ${colors.accent4}`,
    width: '90%',
    maxWidth: '700px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    background: colors.bg,
    borderBottom: `3px solid ${colors.accent4}`,
    color: colors.text,
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '18px',
    fontWeight: '900',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  closeButton: {
    background: 'transparent',
    border: `2px solid ${colors.text}`,
    color: colors.text,
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.15s',
  },
  inputSection: {
    padding: '20px',
    backgroundColor: colors.bg,
    borderBottom: `2px solid ${colors.border}`,
  },
  inputRow: {
    display: 'flex',
    gap: '12px',
  },
  input: {
    flex: 1,
    padding: '14px 16px',
    border: `2px solid ${colors.border}`,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  button: {
    padding: '14px 24px',
    backgroundColor: colors.accent4,
    color: colors.bg,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '900',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    transition: 'all 0.15s',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    color: colors.textMuted,
    cursor: 'not-allowed',
  },
  hint: {
    fontSize: '11px',
    color: colors.textMuted,
    marginTop: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  content: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: colors.surface,
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 0',
    color: colors.textMuted,
  },
  downloadItem: {
    padding: '16px',
    border: `2px solid ${colors.border}`,
    marginBottom: '12px',
    backgroundColor: colors.bg,
  },
  downloadRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  downloadInfo: {
    flex: 1,
    minWidth: 0,
  },
  downloadTitle: {
    fontWeight: '700',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: colors.text,
  },
  downloadUrl: {
    fontSize: '11px',
    color: colors.textMuted,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'monospace',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: '12px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent4,
    transition: 'width 0.3s',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: colors.textMuted,
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  successText: {
    marginTop: '12px',
    fontSize: '12px',
    color: colors.accent1,
    fontWeight: '700',
    textTransform: 'uppercase' as const,
  },
  errorText: {
    marginTop: '12px',
    fontSize: '12px',
    color: colors.danger,
    fontWeight: '700',
  },
};

export default function DownloadModal({ isOpen, onClose, onDownloadComplete }: Props) {
  const [url, setUrl] = useState('');
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousDownloads, setPreviousDownloads] = useState<Download[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadDownloads();
      const interval = setInterval(loadDownloads, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Check for newly completed downloads
  useEffect(() => {
    if (!onDownloadComplete) return;

    downloads.forEach((download) => {
      const prevDownload = previousDownloads.find(d => d.id === download.id);

      // If download just completed (wasn't completed before, is completed now)
      if (download.status === 'completed' && prevDownload?.status !== 'completed' && download.video_id) {
        onDownloadComplete(download);
      }
    });

    setPreviousDownloads(downloads);
  }, [downloads, onDownloadComplete]);

  const loadDownloads = async () => {
    try {
      const { downloads: downloadList } = await apiClient.listDownloads();
      setDownloads(downloadList || []);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  };

  const handleStartDownload = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const download = await apiClient.startDownload(url);
      setDownloads((prev) => [download, ...prev]);
      setUrl('');
    } catch (error: any) {
      alert(`Download failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete all download history? Downloaded videos will be removed.')) return;

    try {
      await apiClient.clearAllDownloads();
      setDownloads([]);
      alert('All downloads cleared successfully');
    } catch (error: any) {
      alert(`Failed to clear downloads: ${error.message}`);
    }
  };

  const getStatusIcon = (status: Download['status']) => {
    const iconStyle = { fontSize: '20px' };
    switch (status) {
      case 'completed':
        return <IoMdCheckmark style={{ ...iconStyle, color: colors.accent1 }} />;
      case 'failed':
        return <IoMdWarning style={{ ...iconStyle, color: colors.danger }} />;
      case 'downloading':
        return <IoMdDownload style={{ ...iconStyle, color: colors.accent4 }} />;
      default:
        return <IoMdDownload style={{ ...iconStyle, color: colors.textMuted }} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <div style={{
              width: '40px',
              height: '40px',
              background: colors.accent4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FaYoutube size={24} color={colors.bg} />
            </div>
            <span>Download from URL</span>
          </div>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseOver={(e) => {
              e.currentTarget.style.background = colors.text;
              e.currentTarget.style.color = colors.bg;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = colors.text;
            }}
          >
            <IoMdClose size={20} />
          </button>
        </div>

        <div style={styles.inputSection}>
          <div style={styles.inputRow}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="PASTE VIDEO URL HERE..."
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && handleStartDownload()}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.accent4;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border;
              }}
            />
            <button
              onClick={handleStartDownload}
              disabled={isLoading || !url.trim()}
              style={{
                ...styles.button,
                ...(isLoading || !url.trim() ? styles.buttonDisabled : {}),
              }}
              onMouseOver={(e) => {
                if (!isLoading && url.trim()) {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = `4px 4px 0 ${colors.accent4}`;
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translate(0, 0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <IoMdDownload size={18} />
              {isLoading ? 'Starting...' : 'Download'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <div style={styles.hint}>
              Supports YouTube, Vimeo, and 1000+ sites
            </div>
            {downloads.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.danger}`,
                  color: colors.danger,
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase' as const,
                  letterSpacing: '1px',
                  padding: '6px 12px',
                  transition: 'all 0.15s',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = colors.danger;
                  e.currentTarget.style.color = colors.bg;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = colors.danger;
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div style={styles.content}>
          {downloads.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{
                width: '80px',
                height: '80px',
                border: `3px solid ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <FaYoutube size={40} style={{ opacity: 0.3 }} />
              </div>
              <p style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>No downloads yet</p>
              <p style={{ fontSize: '11px', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Paste a video URL above to get started
              </p>
            </div>
          ) : (
            downloads.map((download) => (
              <div
                key={download.id}
                style={{
                  ...styles.downloadItem,
                  borderColor: download.status === 'downloading' ? colors.accent4 :
                               download.status === 'completed' ? colors.accent1 :
                               download.status === 'failed' ? colors.danger : colors.border,
                }}
              >
                <div style={styles.downloadRow}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: `2px solid ${
                      download.status === 'completed' ? colors.accent1 :
                      download.status === 'failed' ? colors.danger :
                      download.status === 'downloading' ? colors.accent4 : colors.border
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getStatusIcon(download.status)}
                  </div>
                  <div style={styles.downloadInfo}>
                    <div style={styles.downloadTitle}>{download.title || 'Untitled'}</div>
                    <div style={styles.downloadUrl}>{download.url}</div>

                    {download.status === 'downloading' && (
                      <div>
                        <div style={styles.progressText}>
                          <span>Downloading...</span>
                          <span>{download.progress.toFixed(1)}%</span>
                        </div>
                        <div style={styles.progressBar}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${download.progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {download.status === 'completed' && (
                      <div style={styles.successText}>Download Complete</div>
                    )}

                    {download.status === 'failed' && (
                      <div style={styles.errorText}>
                        Error: {download.error || 'Download failed'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
