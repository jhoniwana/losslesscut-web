import { useState, useEffect } from 'react';
import neoBrutalism from '../styles/neobrutalism';
import NeoDialog from './NeoDialog';
import NeoInput from './NeoInput';
import NeoButton from './NeoButton';
import NeoCard from './NeoCard';
import {
  IoMdDownload,
  IoMdCheckmark,
  IoMdWarning,
  IoMdLink,
  IoMdVideocam,
  IoMdTime,
  IoMdFolder,
  IoMdTrash
} from 'react-icons/io';
import {
  FaYoutube,
  FaVimeo,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaTwitch,
  FaSoundcloud,
} from 'react-icons/fa';
import { apiClient, Download } from '../api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDownloadComplete?: (download: Download) => void;
}

export default function DownloadModal({ isOpen, onClose, onDownloadComplete }: Props) {
  const [url, setUrl] = useState('');
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previousDownloads, setPreviousDownloads] = useState<Download[]>([]);
  const [urlError, setUrlError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDownloads();
      const interval = setInterval(loadDownloads, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!onDownloadComplete) return;

    downloads.forEach((download) => {
      const prevDownload = previousDownloads.find(d => d.id === download.id);

      if (download.status === 'completed' && prevDownload?.status !== 'completed' && download.video_id) {
        onDownloadComplete(download);
      }
    });

    setPreviousDownloads(downloads);
  }, [downloads, onDownloadComplete, previousDownloads]);

  const loadDownloads = async () => {
    try {
      const { downloads: downloadList } = await apiClient.listDownloads();
      setDownloads(downloadList || []);
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  };

  const handleStartDownload = async () => {
    if (!url.trim()) {
      setUrlError(true);
      setTimeout(() => setUrlError(false), 2000);
      return;
    }

    setIsLoading(true);
    try {
      const download = await apiClient.startDownload(url);
      setDownloads((prev) => [download, ...prev]);
      setUrl('');
      setUrlError(false);
    } catch (error: any) {
      console.error('Download failed:', error);
      const errorMessage = error.message || 'Failed to start download';
      setDownloads((prev) => [{
        id: `error-${Date.now()}`,
        url,
        title: 'Download Failed',
        status: 'failed',
        error: errorMessage,
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, ...prev]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete all download history? Downloaded videos will be removed.')) return;

    try {
      await apiClient.clearAllDownloads();
      setDownloads([]);
    } catch (error: any) {
      alert(`Failed to clear downloads: ${error.message}`);
    }
  };

  const getStatusIcon = (status: Download['status']) => {
    switch (status) {
      case 'completed':
        return <IoMdCheckmark size={24} style={{ color: neoBrutalism.colors.success }} />;
      case 'failed':
        return <IoMdWarning size={24} style={{ color: neoBrutalism.colors.error }} />;
      case 'downloading':
        return <IoMdDownload size={24} style={{ color: neoBrutalism.colors.primary }} />;
      default:
        return <IoMdDownload size={24} style={{ color: neoBrutalism.colors.onSurfaceVariant }} />;
    }
  };

  const getPlatformIcon = (url: string) => {
    const domain = url.toLowerCase();
    const iconStyle = { size: 20, color: neoBrutalism.colors.primary };

    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return <FaYoutube {...iconStyle} />;
    } else if (domain.includes('vimeo.com')) {
      return <FaVimeo {...iconStyle} />;
    } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
      return <FaTwitter {...iconStyle} />;
    } else if (domain.includes('facebook.com')) {
      return <FaFacebook {...iconStyle} />;
    } else if (domain.includes('instagram.com')) {
      return <FaInstagram {...iconStyle} />;
    } else if (domain.includes('tiktok.com')) {
      return <FaTiktok {...iconStyle} />;
    } else if (domain.includes('twitch.tv')) {
      return <FaTwitch {...iconStyle} />;
    } else if (domain.includes('soundcloud.com')) {
      return <FaSoundcloud {...iconStyle} />;
    } else {
      return <IoMdVideocam size={20} style={{ color: neoBrutalism.colors.onSurfaceVariant }} />;
    }
  };

  return (
    <NeoDialog
      open={isOpen}
      onClose={onClose}
      title="Smart Downloader"
      maxWidth="lg"
    >
      {/* Input Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: neoBrutalism.spacing.lg,
        marginBottom: neoBrutalism.spacing.xl,
      }}>
        {/* URL Input */}
        <NeoInput
          label="Video URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          error={urlError}
          helperText={urlError ? "Please enter a valid URL" : "Paste a video URL from YouTube, Vimeo, TikTok, and 1000+ platforms"}
          prefix={url ? getPlatformIcon(url) : <IoMdLink size={20} />}
          fullWidth
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleStartDownload();
            }
          }}
        />

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: neoBrutalism.spacing.md,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <NeoButton
            onClick={handleStartDownload}
            disabled={isLoading || !url.trim()}
            variant="filled"
            color="primary"
            icon={<IoMdDownload />}
            fullWidth
          >
            {isLoading ? 'Starting...' : 'Download'}
          </NeoButton>

          {downloads.length > 0 && (
            <NeoButton
              onClick={handleClearAll}
              variant="outlined"
              color="error"
              icon={<IoMdTrash />}
            >
              Clear All
            </NeoButton>
          )}
        </div>

        {/* Supported Platforms */}
        <NeoCard variant="filled" style={{ padding: neoBrutalism.spacing.md }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: neoBrutalism.spacing.sm,
          }}>
            <div style={{
              ...neoBrutalism.typography.labelMedium,
              color: neoBrutalism.colors.onSurfaceVariant,
              display: 'flex',
              alignItems: 'center',
              gap: neoBrutalism.spacing.xs,
            }}>
              <IoMdLink size={16} />
              Supported Platforms
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: neoBrutalism.spacing.sm,
            }}>
              {[
                { icon: <FaYoutube size={16} />, name: 'YouTube' },
                { icon: <FaVimeo size={16} />, name: 'Vimeo' },
                { icon: <FaTwitter size={16} />, name: 'Twitter' },
                { icon: <FaTiktok size={16} />, name: 'TikTok' },
                { icon: <FaInstagram size={16} />, name: 'Instagram' },
                { icon: <FaFacebook size={16} />, name: 'Facebook' },
                { icon: <FaTwitch size={16} />, name: 'Twitch' },
                { icon: <FaSoundcloud size={16} />, name: 'SoundCloud' },
              ].map((platform) => (
                <div
                  key={platform.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: neoBrutalism.spacing.xs,
                    padding: `${neoBrutalism.spacing.xs} ${neoBrutalism.spacing.sm}`,
                    backgroundColor: neoBrutalism.colors.surfaceContainerHighest,
                    borderRadius: neoBrutalism.shape.small,
                    ...neoBrutalism.typography.bodySmall,
                    color: neoBrutalism.colors.onSurface,
                  }}
                >
                  <span style={{ color: neoBrutalism.colors.primary }}>{platform.icon}</span>
                  <span>{platform.name}</span>
                </div>
              ))}
            </div>
          </div>
        </NeoCard>

        {/* Queue Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: neoBrutalism.spacing.xs,
          ...neoBrutalism.typography.bodySmall,
          color: neoBrutalism.colors.onSurfaceVariant,
        }}>
          <IoMdFolder size={16} />
          {downloads.length} download{downloads.length !== 1 ? 's' : ''} in queue
        </div>
      </div>

      {/* Downloads List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: neoBrutalism.spacing.md,
      }}>
        {downloads.length === 0 ? (
          <NeoCard variant="outlined" style={{
            padding: neoBrutalism.spacing.xxxl,
            textAlign: 'center',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: neoBrutalism.spacing.lg,
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: neoBrutalism.shape.large,
                backgroundColor: neoBrutalism.colors.surfaceContainerHighest,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IoMdVideocam size={40} style={{ color: neoBrutalism.colors.onSurfaceVariant, opacity: 0.5 }} />
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: neoBrutalism.spacing.xs,
              }}>
                <h3 style={{
                  ...neoBrutalism.typography.titleLarge,
                  color: neoBrutalism.colors.onSurface,
                  margin: 0,
                }}>Ready to Download</h3>
                <p style={{
                  ...neoBrutalism.typography.bodyMedium,
                  color: neoBrutalism.colors.onSurfaceVariant,
                  margin: 0,
                  maxWidth: '300px',
                }}>
                  Paste a video URL above to start downloading from 1000+ supported platforms
                </p>
              </div>
            </div>
          </NeoCard>
        ) : (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: neoBrutalism.spacing.xs,
              ...neoBrutalism.typography.labelMedium,
              color: neoBrutalism.colors.onSurfaceVariant,
            }}>
              <IoMdTime size={16} />
              Download Queue
            </div>

            {downloads.map((download) => (
              <NeoCard
                key={download.id}
                variant="elevated"
                elevation={1}
                style={{
                  borderLeft: `4px solid ${
                    download.status === 'downloading' ? neoBrutalism.colors.primary :
                    download.status === 'completed' ? neoBrutalism.colors.success :
                    download.status === 'failed' ? neoBrutalism.colors.error :
                    neoBrutalism.colors.outline
                  }`,
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: neoBrutalism.spacing.md,
                }}>
                  {/* Status Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: neoBrutalism.shape.medium,
                    backgroundColor: neoBrutalism.colors.surfaceContainerHighest,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getStatusIcon(download.status)}
                  </div>

                  {/* Download Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      ...neoBrutalism.typography.titleMedium,
                      color: neoBrutalism.colors.onSurface,
                      marginBottom: neoBrutalism.spacing.xs,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {download.title || 'Untitled Video'}
                    </div>

                    <div style={{
                      ...neoBrutalism.typography.bodySmall,
                      color: neoBrutalism.colors.onSurfaceVariant,
                      display: 'flex',
                      alignItems: 'center',
                      gap: neoBrutalism.spacing.xs,
                      marginBottom: neoBrutalism.spacing.md,
                      overflow: 'hidden',
                    }}>
                      {getPlatformIcon(download.url)}
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {download.url}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {download.status === 'downloading' && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: neoBrutalism.spacing.xs,
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          ...neoBrutalism.typography.labelSmall,
                          color: neoBrutalism.colors.onSurfaceVariant,
                        }}>
                          <span>Downloading...</span>
                          <span style={{
                            ...neoBrutalism.typography.labelMedium,
                            color: neoBrutalism.colors.primary,
                            fontWeight: neoBrutalism.typography.fontWeight.bold,
                          }}>
                            {download.progress.toFixed(1)}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '8px',
                          backgroundColor: neoBrutalism.colors.surfaceContainerHighest,
                          borderRadius: neoBrutalism.shape.full,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${download.progress}%`,
                            height: '100%',
                            backgroundColor: neoBrutalism.colors.primary,
                            transition: `width ${neoBrutalism.motion.duration.medium2} ${neoBrutalism.motion.easing.standard}`,
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Success State */}
                    {download.status === 'completed' && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: neoBrutalism.spacing.xs,
                        padding: `${neoBrutalism.spacing.xs} ${neoBrutalism.spacing.md}`,
                        backgroundColor: neoBrutalism.colors.successContainer,
                        color: neoBrutalism.colors.onSuccessContainer,
                        borderRadius: neoBrutalism.shape.small,
                        ...neoBrutalism.typography.labelMedium,
                      }}>
                        <IoMdCheckmark size={16} />
                        Ready to Edit
                      </div>
                    )}

                    {/* Error State */}
                    {download.status === 'failed' && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: neoBrutalism.spacing.xs,
                        padding: neoBrutalism.spacing.md,
                        backgroundColor: neoBrutalism.colors.errorContainer,
                        borderRadius: neoBrutalism.shape.small,
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: neoBrutalism.spacing.xs,
                          ...neoBrutalism.typography.labelMedium,
                          color: neoBrutalism.colors.onErrorContainer,
                        }}>
                          <IoMdWarning size={16} />
                          Download Failed
                        </div>
                        <div style={{
                          ...neoBrutalism.typography.bodySmall,
                          color: neoBrutalism.colors.onErrorContainer,
                        }}>
                          {download.error || 'Unknown error occurred'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </NeoCard>
            ))}
          </>
        )}
      </div>
    </NeoDialog>
  );
}
