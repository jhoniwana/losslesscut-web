import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, FaPause, FaCut, FaUndo, FaRedo, FaUpload, 
  FaDownload, FaCog, FaExpand, FaCompress, FaVolumeUp,
  FaVolumeMute, FaStepForward, FaStepBackward, FaFilm,
  FaMusic, FaImage, FaFileVideo, FaClock, FaMagic
} from 'react-icons/fa';
import { HiOutlinePhotograph, HiOutlineSparkles } from 'react-icons/hi';

// Simple translation function for now
const useTranslation = () => ({
  t: (key: string, params?: Record<string, any>) => {
    if (!params) return key;
    let result = key;
    Object.entries(params).forEach(([param, value]) => {
      result = result.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
    });
    return result;
  },
});

import Button from './Button';
import styles from './HomeUI.module.css';

interface HomeUIProps {
  isFileOpened: boolean;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  darkMode: boolean;
  onTogglePlay: () => void;
  onCut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onUpload: () => void;
  onDownload: () => void;
  onSettings: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
  fileName?: string;
  progress?: number;
}

const HomeUI = memo(({
  isFileOpened,
  playing,
  currentTime,
  duration,
  volume,
  isMuted,
  darkMode,
  onTogglePlay,
  onCut,
  onUndo,
  onRedo,
  onUpload,
  onDownload,
  onSettings,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onZoomIn,
  onZoomOut,
  zoom,
  fileName,
  progress,
}: HomeUIProps) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const progressPercent = useMemo(() => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isFileOpened) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const seekTime = clickPercent * duration;
    
    onSeek(seekTime);
  }, [isFileOpened, duration, onSeek]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value));
  }, [onVolumeChange]);

  if (isMobile) {
    return (
      <div className={`${styles.homeUI} ${styles.mobile} ${darkMode ? styles.dark : styles.light}`}>
        {/* Mobile Header */}
        <header className={styles.mobileHeader}>
          <div className={styles.headerLeft}>
            <Button
              onClick={onUpload}
              className={styles.iconButton}
              title={t('Open file')}
            >
              <FaUpload />
            </Button>
            {fileName && (
              <div className={styles.fileName}>
                {fileName.length > 20 ? `${fileName.substring(0, 17)}...` : fileName}
              </div>
            )}
          </div>
          
          <div className={styles.headerRight}>
            <Button
              onClick={onSettings}
              className={styles.iconButton}
              title={t('Settings')}
            >
              <FaCog />
            </Button>
          </div>
        </header>

        {/* Mobile Video Area */}
        <main className={styles.mobileMain}>
          {!isFileOpened ? (
            <div className={styles.welcomeScreen}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={styles.welcomeContent}
              >
                <div className={styles.welcomeIcon}>
                  <FaFilm />
                </div>
                <h2 style={{ 
                  color: 'var(--accent)', 
                  fontSize: '24px', 
                  fontWeight: '700',
                  marginBottom: '12px',
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}>
                  {t('Welcome to LosslessCut')}
                </h2>
                <p style={{ 
                  color: 'var(--secondary)', 
                  fontSize: '16px',
                  lineHeight: '1.5',
                  marginBottom: '24px'
                }}>
                  {t('The swiss army knife of lossless video/audio editing')}
                </p>
                
                <div className={styles.welcomeActions}>
                  <Button
                    onClick={onUpload}
                    className={styles.primaryButton}
                    size="large"
                  >
                    <FaUpload /> {t('Open File')}
                  </Button>
                  
                  <Button
                    onClick={onDownload}
                    className={styles.secondaryButton}
                    size="large"
                  >
                    <FaDownload /> {t('Download from URL')}
                  </Button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className={styles.videoContainer}>
              {/* Video preview would go here */}
              <div className={styles.videoPlaceholder}>
                <FaFilm />
                <p>{t('Video preview')}</p>
              </div>
              
              {/* Mobile Timeline */}
              <div className={styles.mobileTimeline}>
                <div 
                  className={styles.timelineTrack}
                  onClick={handleTimelineClick}
                >
                  <div 
                    className={styles.timelineProgress}
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div 
                    className={styles.timelineHandle}
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>
                
                <div className={styles.timeDisplay}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
              
              {/* Mobile Controls */}
              <div className={styles.mobileControls}>
                <div className={styles.controlsRow}>
                  <Button
                    onClick={() => onSeek(Math.max(0, currentTime - 10))}
                    className={styles.controlButton}
                    disabled={!isFileOpened}
                  >
                    <FaStepBackward />
                  </Button>
                  
                  <Button
                    onClick={onTogglePlay}
                    className={`${styles.controlButton} ${styles.playButton}`}
                    disabled={!isFileOpened}
                  >
                    {playing ? <FaPause /> : <FaPlay />}
                  </Button>
                  
                  <Button
                    onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                    className={styles.controlButton}
                    disabled={!isFileOpened}
                  >
                    <FaStepForward />
                  </Button>
                </div>
                
                <div className={styles.controlsRow}>
                  <Button
                    onClick={onCut}
                    className={`${styles.controlButton} ${styles.cutButton}`}
                    disabled={!isFileOpened}
                  >
                    <FaCut />
                  </Button>
                  
                  <Button
                    onClick={onUndo}
                    className={styles.controlButton}
                    disabled={!isFileOpened}
                  >
                    <FaUndo />
                  </Button>
                  
                  <Button
                    onClick={onRedo}
                    className={styles.controlButton}
                    disabled={!isFileOpened}
                  >
                    <FaRedo />
                  </Button>
                </div>
                
                <div className={styles.controlsRow}>
                  <Button
                    onClick={onZoomOut}
                    className={styles.controlButton}
                    disabled={!isFileOpened}
                  >
                    <FaCompress />
                  </Button>
                  
                  <Button
                    onClick={onZoomIn}
                    className={styles.controlButton}
                    disabled={!isFileOpened}
                  >
                    <FaExpand />
                  </Button>
                  
                  <Button
                    onClick={onToggleMute}
                    className={styles.controlButton}
                    disabled={!isFileOpened}
                  >
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Bar */}
        <footer className={styles.mobileFooter}>
          <div className={styles.volumeControl}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className={styles.volumeSlider}
              disabled={!isFileOpened}
            />
            <span className={styles.volumeLabel}>
              {Math.round(volume * 100)}%
            </span>
          </div>
          
          {progress !== undefined && (
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </footer>
      </div>
    );
  }

  // Desktop UI
  return (
    <div className={`${styles.homeUI} ${styles.desktop} ${darkMode ? styles.dark : styles.light}`}>
      {/* Desktop Header */}
      <header className={styles.desktopHeader}>
        <div className={styles.headerSection}>
          <div className={styles.logo}>
            <FaFilm />
            <span>LosslessCut</span>
          </div>
          
          <nav className={styles.headerNav}>
            <Button onClick={onUpload} className={styles.navButton}>
              <FaUpload /> {t('File')}
            </Button>
            <Button onClick={onDownload} className={styles.navButton}>
              <FaDownload /> {t('Download')}
            </Button>
            <Button onClick={onSettings} className={styles.navButton}>
              <FaCog /> {t('Settings')}
            </Button>
          </nav>
        </div>
        
        {fileName && (
          <div className={styles.fileInfo}>
            <span className={styles.fileName}>{fileName}</span>
            <span className={styles.fileDuration}>{formatTime(duration)}</span>
          </div>
        )}
      </header>

      {/* Desktop Main Content */}
      <main className={styles.desktopMain}>
        {!isFileOpened ? (
          <div className={styles.welcomeScreen}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className={styles.welcomeContent}
            >
              <div className={styles.welcomeIcon}>
                <HiOutlineSparkles />
              </div>
              <h1>{t('Welcome to LosslessCut Web')}</h1>
              <p className={styles.welcomeDescription}>
                {t('The ultimate cross platform FFmpeg GUI for extremely fast and lossless operations on video, audio, subtitle and other related media files.')}
              </p>
              
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <FaCut className={styles.featureIcon} />
                  <h3>{t('Lossless Cutting')}</h3>
                  <p>{t('Cut video and audio files without re-encoding')}</p>
                </div>
                
                <div className={styles.featureCard}>
                  <HiOutlinePhotograph className={styles.featureIcon} />
                  <h3>{t('Smart Capture')}</h3>
                  <p>{t('Extract frames and screenshots with precision')}</p>
                </div>
                
                <div className={styles.featureCard}>
                  <FaMusic className={styles.featureIcon} />
                  <h3>{t('Audio Editing')}</h3>
                  <p>{t('Extract and manipulate audio tracks')}</p>
                </div>
                
                <div className={styles.featureCard}>
                  <FaMagic className={styles.featureIcon} />
                  <h3>{t('Smart Cut Technology')}</h3>
                  <p>{t('Intelligent cutting with minimal re-encoding')}</p>
                </div>
              </div>
              
              <div className={styles.welcomeActions}>
                <Button
                  onClick={onUpload}
                  className={styles.primaryButton}
                  size="large"
                >
                  <FaUpload /> {t('Open Media File')}
                </Button>
                
                <Button
                  onClick={onDownload}
                  className={styles.secondaryButton}
                  size="large"
                >
                  <FaDownload /> {t('Download from URL')}
                </Button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className={styles.desktopWorkspace}>
            {/* Video area would be here */}
            <div className={styles.videoArea}>
              <div className={styles.videoPlaceholder}>
                <FaFileVideo />
                <p>{t('Video preview area')}</p>
                <p>{t('Current: {{time}} / {{duration}}', { 
                  time: formatTime(currentTime), 
                  duration: formatTime(duration) 
                })}</p>
              </div>
            </div>
            
            {/* Timeline area would be here */}
            <div className={styles.timelineArea}>
              <div className={styles.timelineHeader}>
                <div className={styles.timelineControls}>
                  <Button onClick={onZoomOut} className={styles.zoomButton}>
                    <FaCompress /> {Math.round(zoom * 100)}%
                  </Button>
                  <Button onClick={onZoomIn} className={styles.zoomButton}>
                    <FaExpand />
                  </Button>
                </div>
                
                <div className={styles.playbackControls}>
                  <Button onClick={() => onSeek(Math.max(0, currentTime - 10))}>
                    <FaStepBackward />
                  </Button>
                  <Button onClick={onTogglePlay} className={styles.playButton}>
                    {playing ? <FaPause /> : <FaPlay />}
                  </Button>
                  <Button onClick={() => onSeek(Math.min(duration, currentTime + 10))}>
                    <FaStepForward />
                  </Button>
                  <Button onClick={onCut} className={styles.cutButton}>
                    <FaCut /> {t('Cut')}
                  </Button>
                  <Button onClick={onUndo}>
                    <FaUndo /> {t('Undo')}
                  </Button>
                  <Button onClick={onRedo}>
                    <FaRedo /> {t('Redo')}
                  </Button>
                </div>
              </div>
              
              {/* Timeline track would be here */}
              <div 
                className={styles.timelineTrack}
                onClick={handleTimelineClick}
              >
                <div 
                  className={styles.timelineProgress}
                  style={{ width: `${progressPercent}%` }}
                />
                <div 
                  className={styles.timelineHandle}
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
            </div>
            
            {/* Bottom controls */}
            <div className={styles.bottomControls}>
              <div className={styles.volumeControl}>
                <Button onClick={onToggleMute}>
                  {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className={styles.volumeSlider}
                />
                <span className={styles.volumeLabel}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
              
              {progress !== undefined && (
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                  <span className={styles.progressText}>
                    {t('Processing... {{progress}}%', { progress: Math.round(progress) })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

HomeUI.displayName = 'HomeUI';

export default HomeUI;