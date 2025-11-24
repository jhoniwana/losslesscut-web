import { useState } from 'react';
import { IoMdCloudDownload, IoMdCloudUpload, IoMdTrash } from 'react-icons/io';
import DownloadModal from './components/DownloadModal';
import VideoEditor from './components/VideoEditor';
import { apiClient } from './api/client';

export default function App() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [downloadedVideoId, setDownloadedVideoId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const handleDownloadComplete = (download: any) => {
    // Close download modal and open editor with the downloaded video
    setDownloadedVideoId(download.video_id);
    setShowDownloadModal(false);
    setShowEditor(true);
  };

  const handleClearAll = async () => {
    const confirmed = confirm(
      '⚠️ WARNING: This will permanently delete ALL:\n\n' +
      '• Downloaded videos\n' +
      '• Uploaded videos\n' +
      '• Projects\n' +
      '• Export history\n' +
      '• All data\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you absolutely sure?'
    );

    if (!confirmed) return;

    // Double confirmation for safety
    const doubleConfirm = confirm(
      '⚠️ FINAL WARNING!\n\n' +
      'This will delete EVERYTHING permanently.\n\n' +
      'Click OK to proceed with deletion.'
    );

    if (!doubleConfirm) return;

    setIsClearing(true);
    try {
      const response = await fetch('/api/system/clear-all', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear data');
      }

      alert('✅ All data has been cleared successfully!\n\nThe video counter has been reset to 1.\n\nYou can now start fresh.');

      // Reload the page to reset everything
      window.location.reload();
    } catch (error: any) {
      alert(`❌ Failed to clear data: ${error.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1a1a2e' }}>
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
            🎬 LosslessCut Web
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
            The swiss army knife of lossless video/audio editing
          </p>
        </div>
      </header>

      <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onClick={() => setShowDownloadModal(true)}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
          }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <IoMdCloudDownload size={40} color="white" />
              </div>
              <h2 style={{ fontSize: '22px', marginBottom: '12px', color: '#1a1a2e' }}>
                Download from URL
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                Download videos from YouTube, Vimeo, and other platforms using yt-dlp
              </p>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onClick={() => setShowEditor(true)}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
          }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <IoMdCloudUpload size={40} color="white" />
              </div>
              <h2 style={{ fontSize: '22px', marginBottom: '12px', color: '#1a1a2e' }}>
                Upload & Edit
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
                Upload your own videos to trim, cut, and merge losslessly
              </p>
            </div>
          </div>

        </div>

        <div style={{
          marginTop: '48px',
          padding: '24px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>Features</h3>
          <ul style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '2', margin: 0, paddingLeft: '20px' }}>
            <li>✅ Download videos from YouTube and 1000+ sites</li>
            <li>✅ Lossless cutting and trimming</li>
            <li>✅ Merge multiple videos</li>
            <li>✅ Extract audio tracks</li>
            <li>🔄 Full video editor (in progress)</li>
          </ul>
        </div>

        {/* Clear All Data Section */}
        <div style={{
          marginTop: '24px',
          padding: '24px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '12px',
          border: '2px solid rgba(239, 68, 68, 0.3)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ color: '#ef4444', marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>
                ⚠️ Danger Zone
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: 0 }}>
                Clear all videos, downloads, projects, and history. This action cannot be undone!
              </p>
            </div>
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              style={{
                background: isClearing ? '#991b1b' : '#ef4444',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: isClearing ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                opacity: isClearing ? 0.6 : 1,
              }}
              onMouseOver={(e) => {
                if (!isClearing) {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseOut={(e) => {
                if (!isClearing) {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <IoMdTrash size={20} />
              {isClearing ? 'Clearing...' : 'Clear All Data'}
            </button>
          </div>
        </div>
      </main>

      <footer style={{
        padding: '20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '13px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <p style={{ margin: 0 }}>
          LosslessCut Web • Powered by FFmpeg & yt-dlp
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
          }}
          initialVideoId={downloadedVideoId}
        />
      )}
    </div>
  );
}
