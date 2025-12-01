import { useState, useRef, useEffect } from 'react';
import { IoMdPlay, IoMdPause, IoMdTrash, IoMdDownload, IoMdSkipForward, IoMdSkipBackward, IoMdCheckmark, IoMdClose, IoMdHelpCircle, IoMdCamera } from 'react-icons/io';
import { FiUpload, FiScissors } from 'react-icons/fi';
import { MdContentCut } from 'react-icons/md';
import { apiClient, Project, Segment, Operation } from '../api/client';

// Clean, modern colors
const colors = {
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  card: '#222222',
  border: '#333333',
  primary: '#10b981',    // Green
  secondary: '#3b82f6',  // Blue
  accent: '#f59e0b',     // Orange
  danger: '#ef4444',     // Red
  text: '#ffffff',
  textSecondary: '#a1a1a1',
  textMuted: '#666666',
};

interface Props {
  onClose: () => void;
  initialVideoId?: string | null;
}

export default function VideoEditor({ onClose, initialVideoId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [pendingCutStart, setPendingCutStart] = useState<number | null>(null);
  const [waveformUrl, setWaveformUrl] = useState<string | null>(null);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

  // Refs
  const isSeekingRef = useRef(false);
  const pendingCutStartRef = useRef<number | null>(null);
  const segmentsRef = useRef<Segment[]>([]);
  const durationRef = useRef<number>(0);
  const projectRef = useRef<Project | null>(null);

  // Keep refs in sync
  useEffect(() => { pendingCutStartRef.current = pendingCutStart; }, [pendingCutStart]);
  useEffect(() => { segmentsRef.current = segments; }, [segments]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { projectRef.current = project; }, [project]);

  // Check mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load initial video
  useEffect(() => {
    if (initialVideoId) {
      const load = async () => {
        try {
          setVideoUrl(apiClient.getVideoStreamUrl(initialVideoId));
          setVideoId(initialVideoId);
          const proj = await apiClient.createProject('Downloaded Video', initialVideoId);
          setProject(proj);
          setSegments(proj.segments || []);
        } catch (e) { console.error(e); }
      };
      load();
    }
  }, [initialVideoId]);

  // Load waveform
  useEffect(() => {
    if (videoId && duration > 0 && !waveformUrl && !isLoadingWaveform) {
      setIsLoadingWaveform(true);
      fetch(`/api/videos/${videoId}/waveform`)
        .then(r => r.ok ? r.blob() : null)
        .then(b => b && setWaveformUrl(URL.createObjectURL(b)))
        .finally(() => setIsLoadingWaveform(false));
    }
  }, [videoId, duration]);

  // Keyboard shortcuts
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (!videoRef.current) return;

      const time = videoRef.current.currentTime;
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
          break;
        case 'arrowleft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(0, time - (e.shiftKey ? 0.1 : 1));
          setCurrentTime(videoRef.current.currentTime);
          break;
        case 'arrowright':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(durationRef.current, time + (e.shiftKey ? 0.1 : 1));
          setCurrentTime(videoRef.current.currentTime);
          break;
        case 'i':
          e.preventDefault();
          // Set start point directly using video's current time
          setPendingCutStart(time);
          setCurrentTime(time);
          break;
        case 'o':
          e.preventDefault();
          // Create clip using video's current time and ref for pending start
          {
            const end = time;
            const start = pendingCutStartRef.current ?? 0;
            if (Math.abs(end - start) >= 0.1) {
              const seg: Segment = {
                id: `seg-${Date.now()}`,
                name: `Clip ${segmentsRef.current.length + 1}`,
                start: Math.min(start, end),
                end: Math.max(start, end),
                selected: true,
              };
              const updated = [...segmentsRef.current.map(s => ({ ...s, selected: true })), seg];
              setSegments(updated);
              if (projectRef.current) {
                apiClient.updateProject(projectRef.current.id, { ...projectRef.current, segments: updated }).catch(console.error);
              }
            }
            setPendingCutStart(null);
            setCurrentTime(end);
          }
          break;
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  // Time update
  const animFrameRef = useRef<number | null>(null);
  useEffect(() => {
    const update = () => {
      if (videoRef.current && !isSeekingRef.current && isPlaying) {
        setCurrentTime(videoRef.current.currentTime);
      }
      if (isPlaying) animFrameRef.current = requestAnimationFrame(update);
    };
    if (isPlaying) animFrameRef.current = requestAnimationFrame(update);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying]);

  // Poll export
  useEffect(() => {
    if (!currentOperation || ['completed', 'failed'].includes(currentOperation.status)) return;
    const poll = setInterval(async () => {
      try {
        const op = await apiClient.getOperation(currentOperation.id);
        setCurrentOperation(op);
        setExportProgress(op.progress);
        if (['completed', 'failed'].includes(op.status)) {
          clearInterval(poll);
          setIsExporting(false);
        }
      } catch { clearInterval(poll); setIsExporting(false); }
    }, 500);
    return () => clearInterval(poll);
  }, [currentOperation?.id, currentOperation?.status]);

  // Timeline handlers
  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!isSeekingRef.current || !timelineRef.current || !duration) return;
      if ('touches' in e) e.preventDefault();
      const rect = timelineRef.current.getBoundingClientRect();
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
      const time = Math.max(0, Math.min(1, x / rect.width)) * duration;
      if (videoRef.current) videoRef.current.currentTime = time;
      setCurrentTime(time);
    };
    const up = () => { isSeekingRef.current = false; setIsSeeking(false); };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [duration]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setVideoFile(file);
      const result = await apiClient.uploadVideo(file);
      setVideoUrl(apiClient.getVideoStreamUrl(result.video_id));
      setVideoId(result.video_id);
      const proj = await apiClient.createProject(file.name, result.video_id);
      setProject(proj);
      setSegments(proj.segments || []);
    } catch (e) { console.error(e); }
  };

  const handleMarkStart = () => {
    const time = videoRef.current?.currentTime ?? currentTime;
    setPendingCutStart(time);
    setCurrentTime(time);
  };

  const handleMarkEnd = () => {
    const end = videoRef.current?.currentTime ?? currentTime;
    setCurrentTime(end);
    const start = pendingCutStart ?? 0;
    if (Math.abs(end - start) < 0.1) {
      setPendingCutStart(null);
      return;
    }
    const seg: Segment = {
      id: `seg-${Date.now()}`,
      name: `Clip ${segments.length + 1}`,
      start: Math.min(start, end),
      end: Math.max(start, end),
      selected: true,
    };
    const updated = [...segments.map(s => ({ ...s, selected: true })), seg];
    setSegments(updated);
    setPendingCutStart(null);
    if (project) apiClient.updateProject(project.id, { ...project, segments: updated }).catch(console.error);
  };

  const handleQuickClip = () => {
    // Create clip from start to current time
    if (currentTime < 0.5) return;
    const seg: Segment = {
      id: `seg-${Date.now()}`,
      name: `Clip ${segments.length + 1}`,
      start: 0,
      end: currentTime,
      selected: true,
    };
    const updated = [...segments.map(s => ({ ...s, selected: true })), seg];
    setSegments(updated);
    if (project) apiClient.updateProject(project.id, { ...project, segments: updated }).catch(console.error);
  };

  const handleExport = async () => {
    if (!project || segments.length === 0) return;
    setIsExporting(true);
    setExportProgress(0);
    try {
      const op = await apiClient.exportProject(project.id, {
        segment_ids: segments.filter(s => s.selected).map(s => s.id),
        merge_segments: true,
        export_separate: false,
        format: 'mp4',
        output_name: `${videoFile?.name.split('.')[0] || 'video'}_cut`,
      });
      setCurrentOperation(op);
    } catch { setIsExporting(false); }
  };

  const handleDownload = () => {
    currentOperation?.output_files?.forEach((file: string) => {
      const a = document.createElement('a');
      a.href = `/api/outputs/${file.split('/').pop()}`;
      a.download = file.split('/').pop() || 'video.mp4';
      a.click();
    });
  };

  const handleScreenshot = async () => {
    if (!videoId || isCapturingScreenshot) return;
    setIsCapturingScreenshot(true);
    try {
      const result = await apiClient.captureScreenshot(videoId, currentTime);
      // Trigger download
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename;
      a.click();
    } catch (e) {
      console.error('Screenshot failed:', e);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const deleteSegment = (id: string) => {
    const updated = segments.filter(s => s.id !== id);
    setSegments(updated);
    if (project) apiClient.updateProject(project.id, { ...project, segments: updated }).catch(console.error);
  };

  const toggleSegment = (id: string) => {
    setSegments(segments.map(s => s.id === id ? { ...s, selected: !s.selected } : s));
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const fmtFull = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    return `${m}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const startTimeline = (e: React.MouseEvent | React.TouchEvent) => {
    if (!timelineRef.current || !duration) return;
    e.preventDefault();
    isSeekingRef.current = true;
    setIsSeeking(true);
    const rect = timelineRef.current.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const time = Math.max(0, Math.min(1, x / rect.width)) * duration;
    if (videoRef.current) videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const segColors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
  const selectedCount = segments.filter(s => s.selected).length;

  // Styles
  const btn = (bg: string, color: string = '#fff'): React.CSSProperties => ({
    background: bg,
    color,
    border: 'none',
    borderRadius: '12px',
    padding: isMobile ? '12px 16px' : '14px 24px',
    fontSize: isMobile ? '14px' : '15px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.1s, opacity 0.2s',
    width: '100%',
  });

  const iconBtn: React.CSSProperties = {
    background: colors.card,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    width: isMobile ? '44px' : '48px',
    height: isMobile ? '44px' : '48px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: colors.bg,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <header style={{
        background: colors.surface,
        padding: isMobile ? '12px 16px' : '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>✂️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', color: colors.text, fontWeight: '600' }}>
              Video Cutter
            </h1>
            {videoFile && (
              <p style={{ margin: 0, fontSize: '12px', color: colors.textMuted, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {videoFile.name}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowHelp(true)} style={iconBtn} title="Help">
            <IoMdHelpCircle size={20} />
          </button>
          <button onClick={onClose} style={iconBtn}>
            <IoMdClose size={20} />
          </button>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }} onClick={() => setShowHelp(false)}>
          <div style={{
            background: colors.surface, borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: colors.text, margin: '0 0 16px', fontSize: '20px' }}>How to Use</h2>
            <div style={{ color: colors.textSecondary, fontSize: '14px', lineHeight: '1.8' }}>
              <p><strong style={{ color: colors.primary }}>1.</strong> Upload a video file</p>
              <p><strong style={{ color: colors.primary }}>2.</strong> Navigate to where you want to start</p>
              <p><strong style={{ color: colors.primary }}>3.</strong> Press <strong style={{ color: colors.accent }}>I</strong> button (In point)</p>
              <p><strong style={{ color: colors.primary }}>4.</strong> Navigate to where you want to end</p>
              <p><strong style={{ color: colors.primary }}>5.</strong> Press <strong style={{ color: colors.secondary }}>O</strong> button (Out point)</p>
              <p><strong style={{ color: colors.primary }}>6.</strong> Tap <strong>Export</strong> to save</p>
              <hr style={{ border: 'none', borderTop: `1px solid ${colors.border}`, margin: '16px 0' }} />
              <p style={{ fontSize: '13px', color: colors.textMuted }}>
                <strong>Keyboard:</strong> Space=Play, I/O=Cut, ←→=1s, Shift+←→=0.1s
              </p>
            </div>
            <button onClick={() => setShowHelp(false)} style={{ ...btn(colors.primary), marginTop: '16px' }}>
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!videoUrl ? (
          // Upload
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '32px', gap: '24px',
          }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '24px',
              background: colors.surface, border: `2px dashed ${colors.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiUpload size={40} color={colors.primary} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: colors.text, margin: '0 0 8px', fontSize: '24px' }}>Upload Video</h2>
              <p style={{ color: colors.textMuted, margin: 0 }}>Select a video to start cutting</p>
            </div>
            <label style={{ ...btn(colors.primary), maxWidth: '280px', cursor: 'pointer' }}>
              <FiUpload size={20} /> Choose Video
              <input type="file" accept="video/*,audio/*" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
          </div>
        ) : (
          <>
            {/* Video */}
            <div style={{
              flex: 1, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', minHeight: '200px',
            }}>
              <video
                ref={videoRef}
                src={videoUrl}
                playsInline
                style={{ maxWidth: '100%', maxHeight: '100%' }}
                onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
                onTimeUpdate={() => !isSeekingRef.current && !isPlaying && videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={() => videoRef.current && (videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause())}
              />

              {/* Time badge */}
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                background: 'rgba(0,0,0,0.8)', borderRadius: '8px', padding: '8px 12px',
                color: colors.primary, fontFamily: 'monospace', fontSize: isMobile ? '16px' : '20px', fontWeight: '600',
              }}>
                {fmtFull(currentTime)}
              </div>

              {/* Cut indicator */}
              {pendingCutStart !== null && (
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  background: colors.accent, borderRadius: '8px', padding: '8px 12px',
                  color: '#000', fontSize: '13px', fontWeight: '600',
                }}>
                  ✂️ Start: {fmt(pendingCutStart)} — Now set END
                </div>
              )}

              {/* Play overlay */}
              {!isPlaying && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    width: '72px', height: '72px', background: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <IoMdPlay size={36} color="#fff" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div style={{ background: colors.surface, padding: isMobile ? '12px' : '16px' }}>
              <div
                ref={timelineRef}
                onMouseDown={startTimeline}
                onTouchStart={startTimeline}
                style={{
                  position: 'relative', height: isMobile ? '48px' : '56px',
                  background: colors.card, borderRadius: '12px', cursor: 'pointer',
                  overflow: 'hidden', touchAction: 'none',
                }}
              >
                {waveformUrl && (
                  <img src={waveformUrl} alt="" style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'fill', opacity: 0.3, filter: 'hue-rotate(140deg)',
                  }} />
                )}

                {/* Segments */}
                {segments.map((seg, i) => (
                  <div key={seg.id} style={{
                    position: 'absolute',
                    left: `${(seg.start / duration) * 100}%`,
                    width: `${((seg.end || duration) - seg.start) / duration * 100}%`,
                    height: '100%',
                    background: segColors[i % segColors.length],
                    opacity: seg.selected ? 0.6 : 0.3,
                    borderRadius: '4px',
                  }} />
                ))}

                {/* Pending region */}
                {pendingCutStart !== null && (
                  <div style={{
                    position: 'absolute',
                    left: `${(Math.min(pendingCutStart, currentTime) / duration) * 100}%`,
                    width: `${(Math.abs(currentTime - pendingCutStart) / duration) * 100}%`,
                    height: '100%',
                    background: colors.accent,
                    opacity: 0.4,
                  }} />
                )}

                {/* Playhead */}
                <div style={{
                  position: 'absolute', left: `${(currentTime / duration) * 100}%`,
                  top: 0, bottom: 0, width: '3px',
                  background: colors.danger, borderRadius: '2px', zIndex: 10,
                  boxShadow: `0 0 8px ${colors.danger}`,
                }}>
                  <div style={{
                    position: 'absolute', top: '-3px', left: '-5px',
                    width: '13px', height: '13px', background: colors.danger, borderRadius: '50%',
                  }} />
                </div>

                <span style={{ position: 'absolute', bottom: '4px', left: '8px', color: colors.textMuted, fontSize: '10px', fontFamily: 'monospace' }}>0:00</span>
                <span style={{ position: 'absolute', bottom: '4px', right: '8px', color: colors.textMuted, fontSize: '10px', fontFamily: 'monospace' }}>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ background: colors.surface, padding: isMobile ? '12px' : '16px', borderTop: `1px solid ${colors.border}` }}>
              {/* Playback + Cut controls in one row */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {/* Back 10s */}
                <button onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }} style={iconBtn} title="-10s">
                  <IoMdSkipBackward size={20} />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={() => videoRef.current && (videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause())}
                  style={{ ...iconBtn, background: colors.primary, border: 'none', width: isMobile ? '52px' : '56px', height: isMobile ? '52px' : '56px' }}
                  title="Play/Pause"
                >
                  {isPlaying ? <IoMdPause size={26} /> : <IoMdPlay size={26} style={{ marginLeft: '2px' }} />}
                </button>

                {/* Forward 10s */}
                <button onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }} style={iconBtn} title="+10s">
                  <IoMdSkipForward size={20} />
                </button>

                {/* Divider */}
                <div style={{ width: '1px', height: '32px', background: colors.border, margin: '0 8px' }} />

                {/* I - Set In Point */}
                <button
                  onClick={handleMarkStart}
                  style={{
                    ...iconBtn,
                    width: isMobile ? '48px' : '52px',
                    height: isMobile ? '48px' : '52px',
                    background: pendingCutStart !== null ? colors.accent : colors.card,
                    color: pendingCutStart !== null ? '#000' : colors.text,
                    fontSize: '18px',
                    fontWeight: '700',
                  }}
                  title="Set Start Point (I)"
                >
                  I
                </button>

                {/* O - Set Out Point */}
                <button
                  onClick={handleMarkEnd}
                  style={{
                    ...iconBtn,
                    width: isMobile ? '48px' : '52px',
                    height: isMobile ? '48px' : '52px',
                    background: colors.secondary,
                    border: 'none',
                    fontSize: '18px',
                    fontWeight: '700',
                  }}
                  title="Set End Point & Create Clip (O)"
                >
                  O
                </button>

                {/* Divider */}
                <div style={{ width: '1px', height: '32px', background: colors.border, margin: '0 8px' }} />

                {/* Screenshot button */}
                <button
                  onClick={handleScreenshot}
                  disabled={isCapturingScreenshot}
                  style={{
                    ...iconBtn,
                    opacity: isCapturingScreenshot ? 0.7 : 1,
                  }}
                  title="Take Screenshot"
                >
                  <IoMdCamera size={22} />
                </button>
              </div>

              {/* Export */}
              {segments.length > 0 && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  {currentOperation?.status === 'completed' ? (
                    <button onClick={handleDownload} style={btn(colors.primary)}>
                      <IoMdDownload size={20} /> Download Video
                    </button>
                  ) : (
                    <button onClick={handleExport} disabled={isExporting} style={{ ...btn(colors.primary), opacity: isExporting ? 0.7 : 1 }}>
                      <IoMdDownload size={20} />
                      {isExporting ? `Exporting ${Math.round(exportProgress)}%...` : `Export ${selectedCount} Clip${selectedCount !== 1 ? 's' : ''}`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Clips */}
            {segments.length > 0 && (
              <div style={{
                background: colors.bg, borderTop: `1px solid ${colors.border}`,
                padding: isMobile ? '12px' : '16px', maxHeight: '150px', overflowY: 'auto',
              }}>
                <h3 style={{ color: colors.text, margin: '0 0 10px', fontSize: '14px', fontWeight: '600' }}>
                  Your Clips ({segments.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {segments.map((seg, i) => (
                    <div key={seg.id} style={{
                      background: colors.surface, borderRadius: '10px', padding: '10px 12px',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      border: `1px solid ${seg.selected ? colors.primary : colors.border}`,
                    }}>
                      <div
                        onClick={() => toggleSegment(seg.id)}
                        style={{
                          width: '22px', height: '22px', borderRadius: '6px',
                          background: seg.selected ? colors.primary : 'transparent',
                          border: `2px solid ${seg.selected ? colors.primary : colors.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        }}
                      >
                        {seg.selected && <IoMdCheckmark size={14} color="#fff" />}
                      </div>
                      <div style={{ width: '4px', height: '24px', background: segColors[i % segColors.length], borderRadius: '2px' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: colors.text, fontSize: '13px', fontWeight: '500' }}>{seg.name}</div>
                        <div style={{ color: colors.textMuted, fontSize: '11px', fontFamily: 'monospace' }}>
                          {fmt(seg.start)} → {fmt(seg.end || duration)} ({fmt((seg.end || duration) - seg.start)})
                        </div>
                      </div>
                      <button onClick={() => deleteSegment(seg.id)} style={{
                        background: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer', padding: '6px',
                      }}>
                        <IoMdTrash size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state hint */}
            {segments.length === 0 && (
              <div style={{
                background: colors.bg, borderTop: `1px solid ${colors.border}`,
                padding: '20px', textAlign: 'center',
              }}>
                <p style={{ color: colors.textMuted, margin: 0, fontSize: '14px' }}>
                  Press <strong style={{ color: colors.accent }}>I</strong> to set start, then <strong style={{ color: colors.secondary }}>O</strong> to create a clip
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
