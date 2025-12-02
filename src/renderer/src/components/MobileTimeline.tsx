import { memo, useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaCut, FaUndo, FaRedo } from 'react-icons/fa';

import { FormatTimecode, StateSegment } from '../types';
import Button from './Button';

import styles from './MobileTimeline.module.css';

// Simple translation function for now
const useTranslation = () => ({
  t: (key: string) => key,
});

interface MobileTimelineProps {
  fileDurationNonZero: number;
  startTimeOffset: number;
  playerTime: number | undefined;
  commandedTime: number;
  relevantTime: number;
  zoom: number;
  seekAbs: (time: number) => void;
  cutSegments: StateSegment[];
  setCurrentSegIndex: (index: number) => void;
  currentSegIndexSafe: number;
  currentCutSeg: StateSegment | undefined;
  formatTimecode: FormatTimecode;
  formatTimeAndFrames: (time: number) => string;
  waveforms: any[];
  thumbnails: any[];
  playing: boolean;
  isFileOpened: boolean;
  onTogglePlay: () => void;
  onCut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  darkMode: boolean;
  setCutTime: (type: 'start' | 'end' | 'move', time: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const MobileTimeline = memo(({
  fileDurationNonZero,
  startTimeOffset,
  playerTime,
  commandedTime,
  relevantTime,
  zoom,
  seekAbs,
  cutSegments,
  setCurrentSegIndex,
  currentSegIndexSafe,
  currentCutSeg,
  formatTimecode,
  formatTimeAndFrames,
  waveforms,
  thumbnails,
  playing,
  isFileOpened,
  onTogglePlay,
  onCut,
  onUndo,
  onRedo,
  darkMode,
  setCutTime,
}: MobileTimelineProps) => {
  const { t } = useTranslation();

  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  // Calculate positions
  const calculateTimelinePos = useCallback((time: number | undefined) => {
    if (time === undefined || fileDurationNonZero === 0) return 0;
    return Math.min(time / fileDurationNonZero, 1);
  }, [fileDurationNonZero]);

  const calculateTimelinePercent = useCallback((time: number | undefined) => {
    const pos = calculateTimelinePos(time);
    return `${pos * 100}%`;
  }, [calculateTimelinePos]);

  const currentTimePercent = useMemo(() => calculateTimelinePercent(playerTime), [calculateTimelinePercent, playerTime]);
  const commandedTimePercent = useMemo(() => calculateTimelinePercent(commandedTime), [calculateTimelinePercent, commandedTime]);

  // Touch/Mouse handlers
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const seekTime = clickPercent * fileDurationNonZero;
    
    seekAbs(seekTime);
  }, [isDragging, seekAbs, fileDurationNonZero]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartTime(commandedTime);

    e.preventDefault();
  }, [commandedTime]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaPercent = deltaX / rect.width;
    const deltaTime = deltaPercent * fileDurationNonZero;
    
    const newTime = Math.max(0, Math.min(fileDurationNonZero, dragStartTime + deltaTime));
    seekAbs(newTime);
  }, [isDragging, dragStartX, dragStartTime, seekAbs, fileDurationNonZero]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragStartX(touch.clientX);
    setDragStartTime(commandedTime);

    e.preventDefault();
  }, [commandedTime]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || !timelineRef.current) return;

    const touch = e.touches[0];
    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = touch.clientX - dragStartX;
    const deltaPercent = deltaX / rect.width;
    const deltaTime = deltaPercent * fileDurationNonZero;
    
    const newTime = Math.max(0, Math.min(fileDurationNonZero, dragStartTime + deltaTime));
    seekAbs(newTime);
  }, [isDragging, dragStartX, dragStartTime, seekAbs, fileDurationNonZero]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse/touch event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Auto-scroll timeline to keep playhead visible
  useEffect(() => {
    if (!playheadRef.current || !timelineRef.current) return;

    const playheadRect = playheadRef.current.getBoundingClientRect();
    const timelineRect = timelineRef.current.getBoundingClientRect();
    
    const playheadRelativeX = playheadRect.left - timelineRect.left;
    const scrollContainer = timelineRef.current.parentElement;
    
    if (scrollContainer) {
      const containerWidth = scrollContainer.clientWidth;
      const scrollLeft = scrollContainer.scrollLeft;
      
      // Keep playhead in center third of view
      if (playheadRelativeX < containerWidth * 0.2) {
        scrollContainer.scrollLeft = Math.max(0, scrollLeft - (containerWidth * 0.2 - playheadRelativeX));
      } else if (playheadRelativeX > containerWidth * 0.8) {
        scrollContainer.scrollLeft = scrollLeft + (playheadRelativeX - containerWidth * 0.8);
      }
    }
  }, [commandedTimePercent]);

  const displayTime = relevantTime + startTimeOffset;

  return (
    <div className={`${styles.mobileTimeline} ${darkMode ? styles.dark : styles.light}`}>
      {/* Top controls bar */}
      <div className={styles.controlsBar}>
        <div className={styles.timeDisplay}>
          {formatTimeAndFrames(displayTime)}
        </div>
        
        <div className={styles.controlButtons}>
          <Button
            onClick={onUndo}
            className={styles.controlButton}
            disabled={false} // TODO: Add undo state
            title={t('Undo')}
          >
            <FaUndo />
          </Button>
          
          <Button
            onClick={onTogglePlay}
            className={`${styles.controlButton} ${styles.playButton}`}
            title={playing ? t('Pause') : t('Play')}
          >
            {playing ? <FaPause /> : <FaPlay />}
          </Button>
          
          <Button
            onClick={onCut}
            className={`${styles.controlButton} ${styles.cutButton}`}
            title={t('Cut')}
            disabled={!isFileOpened}
          >
            <FaCut />
          </Button>
          
          <Button
            onClick={onRedo}
            className={styles.controlButton}
            disabled={false} // TODO: Add redo state
            title={t('Redo')}
          >
            <FaRedo />
          </Button>
        </div>
      </div>

      {/* Timeline track */}
      <div className={styles.timelineContainer}>
        <div className={styles.timelineScroll}>
          <div
            ref={timelineRef}
            className={styles.timelineTrack}
            style={{ width: `${zoom * 100}%` }}
            onClick={handleTimelineClick}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Background track */}
            <div className={styles.trackBackground} />
            
            {/* Waveform visualization */}
            {waveforms.length > 0 && (
              <div className={styles.waveformContainer}>
                {waveforms.map((waveform, i) => (
                  <div
                    key={i}
                    className={styles.waveform}
                    style={{
                      left: 'from' in waveform ? calculateTimelinePercent(waveform.from) : '0%',
                      width: 'to' in waveform 
                        ? `${((Math.min(waveform.to, fileDurationNonZero) - waveform.from) / fileDurationNonZero) * 100}%`
                        : '100%',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Thumbnails */}
            {thumbnails.length > 0 && (
              <div className={styles.thumbnailContainer}>
                {thumbnails.map((thumbnail, i) => {
                  const leftPercent = (thumbnail.time / fileDurationNonZero) * 100;
                  return (
                    <img
                      key={thumbnail.url}
                      src={thumbnail.url}
                      alt=""
                      className={styles.thumbnail}
                      style={{ left: `${leftPercent}%` }}
                    />
                  );
                })}
              </div>
            )}

            {/* Cut segments */}
            {cutSegments.map((seg, i) => {
              const startPercent = calculateTimelinePercent(seg.start);
              const endPercent = calculateTimelinePercent(seg.end);
              const width = parseFloat(endPercent) - parseFloat(startPercent);
              
              return (
                <div
                  key={seg.segId}
                  className={`${styles.segment} ${seg.selected ? styles.selected : ''}`}
                  style={{
                    left: startPercent,
                    width: `${width}%`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSegIndex(i);
                  }}
                >
                  <div className={styles.segmentLabel}>
                    {formatTimecode({ seconds: seg.start })}
                  </div>
                </div>
              );
            })}

            {/* Playhead */}
            <motion.div
              ref={playheadRef}
              className={styles.playhead}
              style={{ left: commandedTimePercent }}
              animate={{ left: commandedTimePercent }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              <div className={styles.playheadLine} />
              <div className={styles.playheadHandle} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className={styles.zoomControls}>
        <Button
          onClick={onZoomOut}
          className={styles.zoomButton}
          title={t('Zoom Out')}
        >
          −
        </Button>
        <div className={styles.zoomLevel}>
          {Math.round(zoom * 100)}%
        </div>
        <Button
          onClick={onZoomIn}
          className={styles.zoomButton}
          title={t('Zoom In')}
        >
          +
        </Button>
      </div>
    </div>
  );
});

MobileTimeline.displayName = 'MobileTimeline';

export default MobileTimeline;