import { useState, useEffect, useRef } from 'react';
import { IoMdCloudDownload, IoMdCloudUpload, IoMdTrash, IoMdGitMerge } from 'react-icons/io';
import { FiScissors, FiDownload, FiShield, FiZap } from 'react-icons/fi';
import { MdAutoDelete, MdStorage } from 'react-icons/md';
import DownloadModal from './components/DownloadModal';
import VideoEditor from './components/VideoEditor';

const generateSessionId = () => 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

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

export default function App() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [downloadedVideoId, setDownloadedVideoId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [stats, setStats] = useState({ videos: 0, downloads: 0, projects: 0 });
  const sessionIdRef = useRef<string>(generateSessionId());
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        await fetch('/api/system/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionIdRef.current, auto_clean: autoCleanup }),
        });
      } catch (error) {
        console.error('[Session] Failed to start:', error);
      }
    };

    initSession();
    loadStats();

    heartbeatRef.current = setInterval(async () => {
      try {
        await fetch('/api/system/session/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionIdRef.current }),
        });
      } catch (error) {}
    }, 30000);

    const handleUnload = () => {
      navigator.sendBeacon('/api/system/session/end', JSON.stringify({
        session_id: sessionIdRef.current,
        cleanup: autoCleanup,
      }));
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('unload', handleUnload);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, []);

  useEffect(() => {
    fetch('/api/system/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionIdRef.current, auto_clean: autoCleanup }),
    }).catch(() => {});
  }, [autoCleanup]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/system/stats');
      if (response.ok) setStats(await response.json());
    } catch (error) {}
  };

  const handleDownloadComplete = (download: any) => {
    setDownloadedVideoId(download.video_id);
    setShowDownloadModal(false);
    setShowEditor(true);
    loadStats();
  };

  const handleClearAll = async () => {
    if (!confirm('DELETE ALL DATA?\n\nThis cannot be undone!')) return;
    setIsClearing(true);
    try {
      await fetch('/api/system/clear-all', { method: 'DELETE' });
      loadStats();
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      fontFamily: "'Inter', 'SF Pro', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: colors.surface,
        borderBottom: `4px solid ${colors.accent1}`,
        padding: '24px 20px',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: colors.bg,
              border: `3px solid ${colors.accent1}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
            }}>
              🎬
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '28px',
                fontWeight: '900',
                color: colors.text,
                letterSpacing: '-1px',
                textTransform: 'uppercase',
              }}>
                LosslessCut
              </h1>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: colors.accent1,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}>
                Web Edition
              </p>
            </div>
          </div>

          {/* Stats badges */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { label: 'VID', value: stats.videos, color: colors.accent1 },
              { label: 'DL', value: stats.downloads, color: colors.accent2 },
              { label: 'PRJ', value: stats.projects, color: colors.accent3 },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: colors.bg,
                border: `2px solid ${stat.color}`,
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ color: stat.color, fontSize: '20px', fontWeight: '900' }}>{stat.value}</span>
                <span style={{ color: colors.textMuted, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {/* Download Card */}
          <button
            onClick={() => setShowDownloadModal(true)}
            style={{
              background: colors.surface,
              border: `3px solid ${colors.accent4}`,
              padding: '32px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              position: 'relative',
              boxShadow: `8px 8px 0 ${colors.accent4}`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translate(-4px, -4px)';
              e.currentTarget.style.boxShadow = `12px 12px 0 ${colors.accent4}`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = `8px 8px 0 ${colors.accent4}`;
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: colors.accent4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <IoMdCloudDownload size={32} color={colors.bg} />
            </div>
            <h2 style={{ color: colors.text, fontSize: '24px', fontWeight: '900', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
              Download
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Paste URL from YouTube, Vimeo, or 1000+ sites
            </p>
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: colors.accent4,
              color: colors.bg,
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: '900',
              textTransform: 'uppercase',
            }}>
              YT-DLP
            </div>
          </button>

          {/* Upload Card */}
          <button
            onClick={() => setShowEditor(true)}
            style={{
              background: colors.surface,
              border: `3px solid ${colors.accent1}`,
              padding: '32px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
              position: 'relative',
              boxShadow: `8px 8px 0 ${colors.accent1}`,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translate(-4px, -4px)';
              e.currentTarget.style.boxShadow = `12px 12px 0 ${colors.accent1}`;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translate(0, 0)';
              e.currentTarget.style.boxShadow = `8px 8px 0 ${colors.accent1}`;
            }}
          >
            <div style={{
              width: '64px',
              height: '64px',
              background: colors.accent1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <IoMdCloudUpload size={32} color={colors.bg} />
            </div>
            <h2 style={{ color: colors.text, fontSize: '24px', fontWeight: '900', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
              Upload & Edit
            </h2>
            <p style={{ color: colors.textMuted, fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Upload your videos to cut, trim, and merge losslessly
            </p>
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: colors.accent1,
              color: colors.bg,
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: '900',
              textTransform: 'uppercase',
            }}>
              FFmpeg
            </div>
          </button>
        </div>

        {/* Features */}
        <div style={{
          background: colors.surface,
          border: `3px solid ${colors.border}`,
          padding: '28px',
          marginBottom: '24px',
        }}>
          <h3 style={{
            color: colors.accent3,
            fontSize: '14px',
            fontWeight: '900',
            margin: '0 0 20px 0',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <FiZap /> Features
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { icon: <FiDownload size={18} />, text: 'Download from 1000+ sites' },
              { icon: <FiScissors size={18} />, text: 'Lossless cutting' },
              { icon: <IoMdGitMerge size={18} />, text: 'Merge segments' },
              { icon: <FiZap size={18} />, text: 'No re-encoding' },
              { icon: <FiShield size={18} />, text: 'Auto-delete on exit' },
              { icon: <MdStorage size={18} />, text: 'All formats supported' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: colors.textMuted }}>
                <span style={{ color: colors.accent1 }}>{f.icon}</span>
                <span style={{ fontSize: '13px' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Auto-Cleanup */}
          <div style={{
            background: colors.surface,
            border: `3px solid ${autoCleanup ? colors.accent1 : colors.border}`,
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: autoCleanup ? colors.accent1 : colors.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MdAutoDelete size={24} color={colors.bg} />
              </div>
              <div>
                <h4 style={{ color: colors.text, margin: 0, fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>
                  Auto-Delete
                </h4>
                <p style={{ color: colors.textMuted, margin: 0, fontSize: '12px' }}>
                  {autoCleanup ? 'ON - Files deleted on exit' : 'OFF - Files persist'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setAutoCleanup(!autoCleanup)}
              style={{
                width: '64px',
                height: '36px',
                background: autoCleanup ? colors.accent1 : colors.border,
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                background: colors.bg,
                position: 'absolute',
                top: '4px',
                left: autoCleanup ? '32px' : '4px',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Danger Zone */}
          <div style={{
            background: colors.surface,
            border: `3px solid ${colors.danger}`,
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <h4 style={{ color: colors.danger, margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>
                Danger Zone
              </h4>
              <p style={{ color: colors.textMuted, margin: 0, fontSize: '12px' }}>
                Delete all data now
              </p>
            </div>
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              style={{
                background: 'transparent',
                border: `2px solid ${colors.danger}`,
                color: colors.danger,
                padding: '10px 20px',
                cursor: isClearing ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: '900',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s',
                opacity: isClearing ? 0.5 : 1,
              }}
              onMouseOver={(e) => {
                if (!isClearing) {
                  e.currentTarget.style.background = colors.danger;
                  e.currentTarget.style.color = colors.bg;
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = colors.danger;
              }}
            >
              <IoMdTrash size={16} />
              {isClearing ? 'Clearing...' : 'Clear All'}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: `2px solid ${colors.border}`,
        padding: '20px',
        textAlign: 'center',
      }}>
        <p style={{ color: colors.textMuted, margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Powered by FFmpeg & yt-dlp
        </p>
      </footer>

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        onDownloadComplete={handleDownloadComplete}
      />

      {showEditor && (
        <VideoEditor
          onClose={() => {
            setShowEditor(false);
            setDownloadedVideoId(null);
            loadStats();
          }}
          initialVideoId={downloadedVideoId}
        />
      )}
    </div>
  );
}
