import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, Trans } from 'react-i18next';
import { 
  FiUpload, FiFolder, FiClock, FiPlay, FiSettings, 
  FiHelpCircle, FiFilm, FiMusic, FiImage, FiDownload,
  FiTrendingUp, FiZap, FiMonitor, FiSmartphone
} from 'react-icons/fi';
import { FaKeyboard, FaMouse, FaGithub, FaYoutube } from 'react-icons/fa';
import { IoMdSpeedometer } from 'react-icons/io';

import useUserSettings from '../hooks/useUserSettings';
import { KeyBinding } from '../../common/types';
import { splitKeyboardKeys } from '../util';
import Kbd from '../components/Kbd';
import { colors } from '../colors';

interface RecentProject {
  id: string;
  name: string;
  thumbnail?: string;
  duration: number;
  lastModified: Date;
  format: string;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  action: () => void;
  shortcut?: string;
  color?: string;
}

interface SupportedFormat {
  extension: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'video' | 'audio' | 'image';
}

// Mock data - in real app this would come from storage/API
const mockRecentProjects: RecentProject[] = [
  {
    id: '1',
    name: 'Presentation Clip.mp4',
    duration: 245.5,
    lastModified: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    format: 'MP4',
    thumbnail: undefined
  },
  {
    id: '2', 
    name: 'Podcast Intro.mp3',
    duration: 180.2,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    format: 'MP3',
    thumbnail: undefined
  },
  {
    id: '3',
    name: 'Tutorial Clip.mov',
    duration: 520.8,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    format: 'MOV',
    thumbnail: undefined
  }
];

const supportedFormats: SupportedFormat[] = [
  { extension: 'mp4', name: 'MP4', description: 'Universal video format', icon: <FiFilm />, category: 'video' },
  { extension: 'mov', name: 'MOV', description: 'Apple QuickTime', icon: <FiFilm />, category: 'video' },
  { extension: 'mkv', name: 'MKV', description: 'Matroska container', icon: <FiFilm />, category: 'video' },
  { extension: 'webm', name: 'WebM', description: 'Web optimized', icon: <FiFilm />, category: 'video' },
  { extension: 'avi', name: 'AVI', description: 'Classic video format', icon: <FiFilm />, category: 'video' },
  { extension: 'mp3', name: 'MP3', description: 'Universal audio', icon: <FiMusic />, category: 'audio' },
  { extension: 'wav', name: 'WAV', description: 'Uncompressed audio', icon: <FiMusic />, category: 'audio' },
  { extension: 'flac', name: 'FLAC', description: 'Lossless audio', icon: <FiMusic />, category: 'audio' },
  { extension: 'aac', name: 'AAC', description: 'Advanced audio coding', icon: <FiMusic />, category: 'audio' },
  { extension: 'jpg', name: 'JPG', description: 'Image format', icon: <FiImage />, category: 'image' },
  { extension: 'png', name: 'PNG', description: 'Image format', icon: <FiImage />, category: 'image' },
];

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

function EnhancedHomeTab({ 
  mifiLink, 
  currentCutSeg, 
  onClick, 
  darkMode, 
  keyBindingByAction 
}: {
  mifiLink: unknown;
  currentCutSeg: any;
  onClick: () => void;
  darkMode?: boolean;
  keyBindingByAction: Record<string, KeyBinding>;
}) {
  const { t } = useTranslation();
  const { simpleMode } = useUserSettings();
  const [dragging, setDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'recent' | 'formats' | 'help'>('upload');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // In real implementation, this would trigger the same upload logic as VideoEditor
      console.log('Files selected:', files);
    }
  }, []);

  const quickActions: QuickAction[] = useMemo(() => [
    {
      icon: <FiFolder />,
      label: t('Open Project'),
      description: t('Load existing project'),
      action: () => console.log('Open project'),
      shortcut: keyBindingByAction['openProject']?.keys,
      color: colors.primary
    },
    {
      icon: <FiDownload />,
      label: t('Import from URL'),
      description: t('Download video from URL'),
      action: () => console.log('Import from URL'),
      shortcut: keyBindingByAction['downloadFromUrl']?.keys,
      color: colors.success
    },
    {
      icon: <FiSettings />,
      label: t('Preferences'),
      description: t('Application settings'),
      action: () => console.log('Open settings'),
      shortcut: keyBindingByAction['openSettings']?.keys,
      color: colors.textMuted
    }
  ], [t, keyBindingByAction]);

  const renderShortcut = (keys: string | undefined) => {
    if (!keys || keys === '') return <kbd>UNBOUND</kbd>;
    const split = splitKeyboardKeys(keys);
    return split.map((key, i) => (
      <span key={key}>
        <Kbd code={key} />
        {i < split.length - 1 && <span style={{ fontSize: '.7em', margin: '0 .2em' }}>+</span>}
      </span>
    ));
  };

  const containerStyle = {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.surface} 100%)`,
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const cardStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease'
  };

  const buttonStyle = {
    background: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: 'transparent',
    color: colors.text,
    border: `1px solid ${colors.border}`
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '3rem' }}
      >
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: colors.text,
          margin: '0 0 0.5rem 0',
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.success})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          LosslessCut
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: colors.textMuted, 
          margin: 0,
          maxWidth: '600px',
          lineHeight: 1.6
        }}>
          {t('The fastest way to cut videos without re-encoding. Perfect for editors, content creators, and anyone working with media files.')}
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{ marginBottom: '2rem' }}
      >
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          marginBottom: '2rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'upload', label: t('Upload'), icon: <FiUpload /> },
            { id: 'recent', label: t('Recent'), icon: <FiClock /> },
            { id: 'formats', label: t('Formats'), icon: <FiFilm /> },
            { id: 'help', label: t('Help'), icon: <FiHelpCircle /> }
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                ...buttonStyle,
                background: activeTab === tab.id ? colors.primary : 'transparent',
                color: activeTab === tab.id ? 'white' : colors.text,
                border: `1px solid ${activeTab === tab.id ? colors.primary : colors.border}`,
                fontSize: '0.9rem'
              }}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={cardStyle}
          >
            {/* Upload Zone */}
            <motion.div
              style={{
                border: `2px dashed ${dragging ? colors.primary : colors.border}`,
                borderRadius: '16px',
                padding: '3rem 2rem',
                textAlign: 'center',
                background: dragging ? `${colors.primary}10` : 'transparent',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                marginBottom: '2rem'
              }}
              whileHover={{ scale: 1.02 }}
              onDragOver={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <motion.div
                animate={{ scale: dragging ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <FiUpload size={48} color={dragging ? colors.primary : colors.textMuted} />
              </motion.div>
              <h3 style={{ color: colors.text, margin: '1rem 0 0.5rem 0', fontSize: '1.3rem' }}>
                {t('Drop files here')}
              </h3>
              <p style={{ color: colors.textMuted, margin: '0 0 1.5rem 0' }}>
                {t('or click to browse')}
              </p>
              <input
                id="file-input"
                type="file"
                accept="video/*,audio/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </motion.div>

            {/* Quick Actions */}
            <div>
              <h4 style={{ color: colors.text, margin: '0 0 1.5rem 0', fontSize: '1.1rem' }}>
                {t('Quick Actions')}
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem' 
              }}>
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      ...cardStyle,
                      padding: '1.2rem',
                      cursor: 'pointer',
                      borderLeft: `4px solid ${action.color || colors.border}`
                    }}
                    onClick={action.action}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ 
                        color: action.color || colors.primary, 
                        fontSize: '1.5rem' 
                      }}>
                        {action.icon}
                      </div>
                      <div>
                        <div style={{ 
                          color: colors.text, 
                          fontWeight: '600', 
                          fontSize: '1rem',
                          marginBottom: '0.25rem'
                        }}>
                          {action.label}
                        </div>
                        <div style={{ 
                          color: colors.textMuted, 
                          fontSize: '0.85rem',
                          lineHeight: 1.4
                        }}>
                          {action.description}
                        </div>
                      </div>
                    </div>
                    {action.shortcut && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        marginTop: '0.5rem',
                        fontSize: '0.8rem',
                        color: colors.textMuted
                      }}>
                        <FaKeyboard size={12} />
                        {renderShortcut(action.shortcut)}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'recent' && (
          <motion.div
            key="recent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={cardStyle}
          >
            <h3 style={{ color: colors.text, margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
              {t('Recent Projects')}
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {mockRecentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    ...cardStyle,
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{
                    width: '60px',
                    height: '40px',
                    borderRadius: '8px',
                    background: colors.border,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.textMuted
                  }}>
                    <FiFilm size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: colors.text, 
                      fontWeight: '600', 
                      marginBottom: '0.25rem' 
                    }}>
                      {project.name}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      color: colors.textMuted
                    }}>
                      <span>{formatTime(project.duration)}</span>
                      <span>{formatRelativeTime(project.lastModified)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'formats' && (
          <motion.div
            key="formats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={cardStyle}
          >
            <h3 style={{ color: colors.text, margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
              {t('Supported Formats')}
            </h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }}>
                {[
                  { icon: <FiFilm />, label: 'Video', color: colors.primary },
                  { icon: <FiMusic />, label: 'Audio', color: colors.success },
                  { icon: <FiImage />, label: 'Image', color: colors.warning }
                ].map(category => (
                  <div key={category.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: `${category.color}20`,
                    border: `1px solid ${category.color}40`
                  }}>
                    <div style={{ color: category.color }}>{category.icon}</div>
                    <span style={{ 
                      color: colors.text, 
                      fontWeight: '600' 
                    }}>
                      {category.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '0.8rem' 
            }}>
              {supportedFormats.map((format, index) => (
                <motion.div
                  key={format.extension}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  style={{
                    ...cardStyle,
                    padding: '0.8rem',
                    cursor: 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{ color: colors.textMuted }}>
                    {format.icon}
                  </div>
                  <div>
                    <div style={{ 
                      color: colors.text, 
                      fontWeight: '600',
                      marginBottom: '0.2rem'
                    }}>
                      .{format.extension}
                    </div>
                    <div style={{ 
                      color: colors.textMuted, 
                      fontSize: '0.8rem',
                      lineHeight: 1.3
                    }}>
                      {format.name}
                    </div>
                    <div style={{ 
                      color: colors.textMuted, 
                      fontSize: '0.75rem',
                      marginTop: '0.2rem'
                    }}>
                      {format.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'help' && (
          <motion.div
            key="help"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={cardStyle}
          >
            <h3 style={{ color: colors.text, margin: '0 0 1.5rem 0', fontSize: '1.3rem' }}>
              {t('Help & Resources')}
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '1rem' 
            }}>
              {[
                {
                  title: t('Keyboard Shortcuts'),
                  description: t('Master keyboard shortcuts for faster editing'),
                  icon: <FaKeyboard />,
                  action: () => console.log('Open keyboard shortcuts')
                },
                {
                  title: t('Video Tutorials'),
                  description: t('Learn advanced editing techniques'),
                  icon: <FiPlay />,
                  action: () => console.log('Open tutorials')
                },
                {
                  title: t('Documentation'),
                  description: t('Complete user guide and API docs'),
                  icon: <FiHelpCircle />,
                  action: () => console.log('Open documentation')
                },
                {
                  title: t('GitHub Repository'),
                  description: t('View source code and contribute'),
                  icon: <FaGithub />,
                  action: () => window.open('https://github.com/mifi/lossless-cut', '_blank')
                },
                {
                  title: t('YouTube Channel'),
                  description: t('Video tutorials and tips'),
                  icon: <FaYoutube />,
                  action: () => window.open('https://youtube.com/c/mifio', '_blank')
                },
                {
                  title: t('Performance Tips'),
                  description: t('Optimize your workflow and settings'),
                  icon: <IoMdSpeedometer />,
                  action: () => console.log('Open performance tips')
                }
              ].map((resource, index) => (
                <motion.div
                  key={resource.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    ...cardStyle,
                    padding: '1.2rem',
                    cursor: 'pointer',
                    borderLeft: `4px solid ${colors.primary}`
                  }}
                  onClick={resource.action}
                >
                  <div style={{ 
                    fontSize: '1.8rem', 
                    color: colors.primary,
                    marginBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    {resource.icon}
                  </div>
                  <div>
                    <div style={{ 
                      color: colors.text, 
                      fontWeight: '600', 
                      fontSize: '1.1rem',
                      marginBottom: '0.5rem'
                    }}>
                      {resource.title}
                    </div>
                    <div style={{ 
                      color: colors.textMuted, 
                      fontSize: '0.9rem',
                      lineHeight: 1.5
                    }}>
                      {resource.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        style={{ 
          textAlign: 'center', 
          marginTop: '3rem',
          padding: '2rem',
          borderTop: `1px solid ${colors.border}`,
          color: colors.textMuted,
          fontSize: '0.9rem'
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <Trans>
            <strong>Pro Tip:</strong> Use <kbd>I</kbd> and <kbd>O</kbd> keys to quickly set cut points while playing!
          </Trans>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiMonitor />
            <span>Desktop</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiSmartphone />
            <span>Mobile</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiZap />
            <span>{t('Lightning Fast')}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default EnhancedHomeTab;