import { useState, useEffect, CSSProperties } from 'react';
import { IoMdClose, IoMdDownload, IoMdCheckmark, IoMdWarning } from 'react-icons/io';
import { FaYoutube } from 'react-icons/fa';
import { apiClient, Download } from '../api/client.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDownloadComplete?: (download: Download) => void;
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    borderRadius: '4px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  inputSection: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
    cursor: 'not-allowed',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
  },
  content: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 0',
    color: '#9ca3af',
  },
  downloadItem: {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '12px',
    backgroundColor: 'white',
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
    fontWeight: '600',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  downloadUrl: {
    fontSize: '12px',
    color: '#6b7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s',
  },
  progressText: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  successText: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#10b981',
    fontWeight: '600',
  },
  errorText: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#ef4444',
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
        return <IoMdCheckmark style={{ ...iconStyle, color: '#10b981' }} />;
      case 'failed':
        return <IoMdWarning style={{ ...iconStyle, color: '#ef4444' }} />;
      case 'downloading':
        return <IoMdDownload style={{ ...iconStyle, color: '#3b82f6' }} />;
      default:
        return <IoMdDownload style={{ ...iconStyle, color: '#9ca3af' }} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <FaYoutube size={24} />
            <span>Download from URL</span>
          </div>
          <button style={styles.closeButton} onClick={onClose}>
            <IoMdClose size={20} />
          </button>
        </div>

        <div style={styles.inputSection}>
          <div style={styles.inputRow}>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube or video URL here..."
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && handleStartDownload()}
            />
            <button
              onClick={handleStartDownload}
              disabled={isLoading || !url.trim()}
              style={{
                ...styles.button,
                ...(isLoading || !url.trim() ? styles.buttonDisabled : {}),
              }}
            >
              <IoMdDownload />
              {isLoading ? 'Starting...' : 'Download'}
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={styles.hint}>
              Supports YouTube, Vimeo, and many other video platforms
            </div>
            {downloads.length > 0 && (
              <button
                onClick={handleClearAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  padding: '4px 8px',
                }}
              >
                Clear All History
              </button>
            )}
          </div>
        </div>

        <div style={styles.content}>
          {downloads.length === 0 ? (
            <div style={styles.emptyState}>
              <FaYoutube size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>No downloads yet</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Paste a video URL above to get started
              </p>
            </div>
          ) : (
            downloads.map((download) => (
              <div key={download.id} style={styles.downloadItem}>
                <div style={styles.downloadRow}>
                  <div>{getStatusIcon(download.status)}</div>
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
                      <div style={styles.successText}>✓ Download complete</div>
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
