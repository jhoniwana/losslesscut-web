import { useState, useRef, useEffect } from 'react';
import { IoMdPlay, IoMdPause, IoMdCut, IoMdTrash, IoMdDownload, IoMdAdd, IoMdSkipForward, IoMdSkipBackward } from 'react-icons/io';
import { FiUpload, FiScissors } from 'react-icons/fi';
import { MdContentCut } from 'react-icons/md';
import { apiClient, Project, Segment, Operation } from '../api/client';

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
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1x to 10x zoom
  const [zoomOffset, setZoomOffset] = useState(0); // For panning when zoomed
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Load video from download if initialVideoId is provided
  useEffect(() => {
    if (initialVideoId) {
      const loadDownloadedVideo = async () => {
        try {
          const url = apiClient.getVideoStreamUrl(initialVideoId);
          setVideoUrl(url);

          // Create project for this video
          const newProject = await apiClient.createProject(`Downloaded Video`, initialVideoId);
          setProject(newProject);
          setSegments(newProject.segments || []);
        } catch (error) {
          console.error('Failed to load downloaded video:', error);
          alert('Failed to load downloaded video');
        }
      };
      loadDownloadedVideo();
    }
  }, [initialVideoId]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            seekRelative(-0.033); // ~1 frame at 30fps
          } else {
            seekRelative(-1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            seekRelative(0.033); // ~1 frame at 30fps
          } else {
            seekRelative(1);
          }
          break;
        case ',':
          e.preventDefault();
          jumpToPreviousSegment();
          break;
        case '.':
          e.preventDefault();
          jumpToNextSegment();
          break;
        case 'i':
          e.preventDefault();
          setSegmentStart();
          break;
        case 'o':
          e.preventDefault();
          setSegmentEnd();
          break;
        case 'e':
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            exportVideo();
          }
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            cutAtCurrentTime();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTime, duration, segments, selectedSegmentId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setVideoFile(file);
      const result = await apiClient.uploadVideo(file);

      const url = apiClient.getVideoStreamUrl(result.video_id);
      setVideoUrl(url);

      const newProject = await apiClient.createProject(file.name, result.video_id);
      setProject(newProject);
      setSegments(newProject.segments || []);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload video');
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isSeeking) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume;
      generateWaveform();
    }
  };

  const generateWaveform = async () => {
    if (!videoRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const response = await fetch(videoUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const rawData = audioBuffer.getChannelData(0);
      const samples = 200; // Number of samples for the waveform
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData: number[] = [];

      for (let i = 0; i < samples; i++) {
        const blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j]);
        }
        filteredData.push(sum / blockSize);
      }

      const maxVal = Math.max(...filteredData);
      const normalizedData = filteredData.map(n => n / maxVal);
      setWaveformData(normalizedData);
    } catch (error) {
      console.error('Failed to generate waveform:', error);
      setWaveformData([]);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      const clampedTime = Math.max(0, Math.min(time, duration));
      videoRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
    }
  };

  const seekRelative = (seconds: number) => {
    seekTo(currentTime + seconds);
  };

  const jumpToNextSegment = () => {
    if (segments.length === 0) return;
    const sortedSegments = [...segments].sort((a, b) => a.start - b.start);
    const nextSegment = sortedSegments.find(s => s.start > currentTime);
    if (nextSegment) {
      selectSegment(nextSegment.id);
    } else {
      selectSegment(sortedSegments[0].id);
    }
  };

  const jumpToPreviousSegment = () => {
    if (segments.length === 0) return;
    const sortedSegments = [...segments].sort((a, b) => b.start - a.start);
    const prevSegment = sortedSegments.find(s => s.start < currentTime);
    if (prevSegment) {
      selectSegment(prevSegment.id);
    } else {
      selectSegment(sortedSegments[0].id);
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const addSegment = () => {
    const newSegment: Segment = {
      id: `seg-${Date.now()}`,
      name: `Segment ${segments.length + 1}`,
      start: currentTime,
      end: Math.min(currentTime + 10, duration),
      selected: true,
    };

    const updatedSegments = [...segments.map(s => ({ ...s, selected: false })), newSegment];
    setSegments(updatedSegments);
    setSelectedSegmentId(newSegment.id);

    if (project) {
      apiClient.updateProject(project.id, { ...project, segments: updatedSegments });
    }
  };

  const setSegmentStart = () => {
    if (!selectedSegmentId) {
      addSegment();
      return;
    }

    const updatedSegments = segments.map(s =>
      s.id === selectedSegmentId ? { ...s, start: currentTime } : s
    );
    setSegments(updatedSegments);

    if (project) {
      apiClient.updateProject(project.id, { ...project, segments: updatedSegments });
    }
  };

  const setSegmentEnd = () => {
    if (!selectedSegmentId) {
      addSegment();
      return;
    }

    const updatedSegments = segments.map(s =>
      s.id === selectedSegmentId ? { ...s, end: currentTime } : s
    );
    setSegments(updatedSegments);

    if (project) {
      apiClient.updateProject(project.id, { ...project, segments: updatedSegments });
    }
  };

  const cutAtCurrentTime = () => {
    if (!selectedSegmentId) return;

    const selectedSegment = segments.find(s => s.id === selectedSegmentId);
    if (!selectedSegment) return;

    // Split the selected segment at current time
    const segment1: Segment = {
      id: `seg-${Date.now()}-1`,
      name: `${selectedSegment.name} (1)`,
      start: selectedSegment.start,
      end: currentTime,
      selected: false,
    };

    const segment2: Segment = {
      id: `seg-${Date.now()}-2`,
      name: `${selectedSegment.name} (2)`,
      start: currentTime,
      end: selectedSegment.end,
      selected: true,
    };

    const updatedSegments = segments.filter(s => s.id !== selectedSegmentId);
    updatedSegments.push(segment1, segment2);
    setSegments(updatedSegments);
    setSelectedSegmentId(segment2.id);

    if (project) {
      apiClient.updateProject(project.id, { ...project, segments: updatedSegments });
    }
  };

  const deleteSegment = (id: string) => {
    const updatedSegments = segments.filter(s => s.id !== id);
    setSegments(updatedSegments);

    if (selectedSegmentId === id) {
      setSelectedSegmentId(null);
    }

    if (project) {
      apiClient.updateProject(project.id, { ...project, segments: updatedSegments });
    }
  };

  const selectSegment = (id: string) => {
    const updatedSegments = segments.map(s => ({ ...s, selected: s.id === id }));
    setSegments(updatedSegments);
    setSelectedSegmentId(id);

    const segment = updatedSegments.find(s => s.id === id);
    if (segment) {
      seekTo(segment.start);
    }
  };

  // Poll operation status
  useEffect(() => {
    if (!currentOperation || currentOperation.status === 'completed' || currentOperation.status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const updatedOperation = await apiClient.getOperation(currentOperation.id);
        setCurrentOperation(updatedOperation);
        setExportProgress(updatedOperation.progress);

        if (updatedOperation.status === 'completed' || updatedOperation.status === 'failed') {
          clearInterval(pollInterval);
          setIsExporting(false);
        }
      } catch (error) {
        console.error('Failed to poll operation status:', error);
        clearInterval(pollInterval);
        setIsExporting(false);
      }
    }, 1000); // Poll every 1 second

    return () => clearInterval(pollInterval);
  }, [currentOperation?.id, currentOperation?.status]);

  const exportVideo = async () => {
    if (!project || segments.length === 0) {
      alert('Please add at least one segment');
      return;
    }

    const selectedSegments = segments.filter(s => s.selected);
    if (selectedSegments.length === 0) {
      alert('Please select at least one segment to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    try {
      const operation = await apiClient.exportProject(project.id, {
        segment_ids: selectedSegments.map(s => s.id),
        merge_segments: selectedSegments.length > 1,
        format: 'mp4',
        output_name: `${videoFile?.name.split('.')[0] || 'video'}_cut`,
      });

      setCurrentOperation(operation);
      // Polling will handle the rest via useEffect
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error as Error).message);
      setIsExporting(false);
    }
  };

  const downloadExportedFile = () => {
    if (!currentOperation || !currentOperation.output_files || currentOperation.output_files.length === 0) {
      return;
    }

    currentOperation.output_files.forEach((file: string) => {
      const filename = file.split('/').pop();
      const downloadUrl = `/api/outputs/${filename}`;

      // Create temporary link and trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || 'export.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !duration) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;

    seekTo(time);
  };

  const getSegmentColor = (index: number) => {
    const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0f0f23',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
            🎬 LosslessCut Editor
          </h2>
          {videoFile && (
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
              {videoFile.name}
            </div>
          )}
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
        }}>
          Close Editor
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {!videoUrl ? (
          /* Upload Area */
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '24px',
            padding: '40px',
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FiUpload size={56} color="white" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '24px' }}>
                Upload a video to start editing
              </h3>
              <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
                Supports MP4, MKV, AVI, MOV, and more
              </p>
            </div>
            <label style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Choose Video File
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ) : (
          <>
            {/* Video Player */}
            <div style={{
              flex: 1,
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <video
                ref={videoRef}
                src={videoUrl}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'block',
                }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Time Display Overlay */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 'bold',
              }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Timeline */}
            <div style={{
              backgroundColor: '#16213e',
              padding: '16px 24px',
              borderTop: '1px solid #0f3460',
            }}>
              <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                style={{
                  position: 'relative',
                  height: '60px',
                  backgroundColor: '#0f3460',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginBottom: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Waveform visualization */}
                {waveformData.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    padding: '4px 2px',
                    opacity: 0.3,
                  }}>
                    {waveformData.map((value, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '2px',
                          height: `${value * 100}%`,
                          backgroundColor: '#667eea',
                          borderRadius: '1px',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Segments on timeline */}
                {segments.map((segment, idx) => {
                  const startPercent = ((segment.start / duration) * 100);
                  const widthPercent = (((segment.end || duration) - segment.start) / duration) * 100;

                  return (
                    <div
                      key={segment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectSegment(segment.id);
                      }}
                      style={{
                        position: 'absolute',
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                        height: '100%',
                        backgroundColor: getSegmentColor(idx),
                        opacity: segment.selected ? 0.9 : 0.5,
                        border: segment.selected ? '2px solid white' : 'none',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {segment.name}
                    </div>
                  );
                })}

                {/* Playhead */}
                <div style={{
                  position: 'absolute',
                  left: `${(currentTime / duration) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 4px rgba(239, 68, 68, 0.8)',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-6px',
                    left: '-4px',
                    width: 0,
                    height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '8px solid #ef4444',
                  }} />
                </div>
              </div>

              {/* Scrubber */}
              <input
                type="range"
                min="0"
                max={duration || 0}
                step="0.01"
                value={currentTime}
                onChange={(e) => {
                  const time = Number(e.target.value);
                  setCurrentTime(time);
                  setIsSeeking(true);
                }}
                onMouseUp={(e) => {
                  seekTo(Number((e.target as HTMLInputElement).value));
                  setIsSeeking(false);
                }}
                style={{
                  width: '100%',
                  height: '6px',
                  cursor: 'pointer',
                  accentColor: '#667eea',
                }}
              />
            </div>

            {/* Controls */}
            <div style={{
              backgroundColor: '#16213e',
              padding: '16px 24px',
              borderTop: '1px solid #0f3460',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              {/* Playback controls */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => seekRelative(-5)} style={iconButtonStyle}>
                  <IoMdSkipBackward size={20} />
                </button>

                <button onClick={togglePlay} style={{
                  ...iconButtonStyle,
                  background: '#667eea',
                  width: '48px',
                  height: '48px',
                }}>
                  {isPlaying ? <IoMdPause size={24} /> : <IoMdPlay size={24} />}
                </button>

                <button onClick={() => seekRelative(5)} style={iconButtonStyle}>
                  <IoMdSkipForward size={20} />
                </button>
              </div>

              {/* Playback speed */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '12px', marginRight: '4px' }}>Speed:</span>
                {[0.25, 0.5, 1, 1.5, 2].map(rate => (
                  <button
                    key={rate}
                    onClick={() => changePlaybackRate(rate)}
                    style={{
                      ...buttonStyle,
                      padding: '6px 12px',
                      fontSize: '12px',
                      background: playbackRate === rate ? '#667eea' : '#0f3460',
                      fontWeight: playbackRate === rate ? '700' : '400',
                    }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Zoom controls */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '12px', marginRight: '4px' }}>Zoom:</span>
                <button
                  onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
                  disabled={zoomLevel <= 1}
                  style={{
                    ...buttonStyle,
                    padding: '6px 12px',
                    fontSize: '12px',
                    opacity: zoomLevel <= 1 ? 0.5 : 1,
                  }}
                >
                  -
                </button>
                <span style={{ color: 'white', fontSize: '12px', minWidth: '30px', textAlign: 'center' }}>
                  {zoomLevel}x
                </span>
                <button
                  onClick={() => setZoomLevel(Math.min(10, zoomLevel + 1))}
                  disabled={zoomLevel >= 10}
                  style={{
                    ...buttonStyle,
                    padding: '6px 12px',
                    fontSize: '12px',
                    opacity: zoomLevel >= 10 ? 0.5 : 1,
                  }}
                >
                  +
                </button>
              </div>

              {/* Segment controls */}
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <button
                  onClick={setSegmentStart}
                  title="Set segment start (I)"
                  style={buttonStyle}
                >
                  [ Start (I)
                </button>

                <button
                  onClick={setSegmentEnd}
                  title="Set segment end (O)"
                  style={buttonStyle}
                >
                  End (O) ]
                </button>

                <button
                  onClick={cutAtCurrentTime}
                  title="Cut at current time (Ctrl+C)"
                  style={{ ...buttonStyle, background: '#f59e0b' }}
                  disabled={!selectedSegmentId}
                >
                  <FiScissors /> Cut
                </button>

                <button
                  onClick={addSegment}
                  title="Add new segment"
                  style={{ ...buttonStyle, background: '#10b981' }}
                >
                  <IoMdAdd /> Add Segment
                </button>
              </div>

              {/* Export Section */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Export Button */}
                <button
                  onClick={exportVideo}
                  disabled={isExporting || segments.length === 0 || (currentOperation && currentOperation.status !== 'failed')}
                  style={{
                    ...buttonStyle,
                    background: segments.length === 0 ? '#444' : '#667eea',
                    padding: '10px 24px',
                    fontSize: '15px',
                    fontWeight: '700',
                  }}
                >
                  <IoMdDownload /> {isExporting ? `Exporting... ${Math.round(exportProgress)}%` : 'Export'}
                </button>

                {/* Download Button (appears when export complete) */}
                {currentOperation && currentOperation.status === 'completed' && (
                  <button
                    onClick={downloadExportedFile}
                    style={{
                      ...buttonStyle,
                      background: '#10b981',
                      padding: '10px 24px',
                      fontSize: '15px',
                      fontWeight: '700',
                      animation: 'pulse 2s infinite',
                    }}
                  >
                    <IoMdDownload /> Click to Download
                  </button>
                )}

                {/* Error Message */}
                {currentOperation && currentOperation.status === 'failed' && (
                  <div style={{ color: '#ef4444', fontSize: '14px' }}>
                    Export failed: {currentOperation.error || 'Unknown error'}
                  </div>
                )}
              </div>
            </div>

            {/* Segments Panel */}
            <div style={{
              height: '200px',
              backgroundColor: '#16213e',
              borderTop: '1px solid #0f3460',
              overflowY: 'auto',
              padding: '16px 24px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>
                  Segments ({segments.length})
                </h3>
                <div style={{ color: '#888', fontSize: '12px' }}>
                  Keyboard: Space=Play, ←→=Seek (Shift+←→=Frame), I=Start, O=End, Ctrl+C=Cut, ,/. =Prev/Next Segment
                </div>
              </div>

              {segments.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: '#666',
                }}>
                  <MdContentCut size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ margin: 0 }}>No segments yet</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    Press 'I' to set start, 'O' to set end, or click "Add Segment"
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {segments.map((segment, idx) => (
                    <div
                      key={segment.id}
                      onClick={() => selectSegment(segment.id)}
                      style={{
                        backgroundColor: segment.selected ? '#667eea' : '#0f3460',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        border: segment.selected ? '2px solid #fff' : '2px solid transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                      }}>
                        <div style={{
                          width: '8px',
                          height: '32px',
                          borderRadius: '2px',
                          background: getSegmentColor(idx),
                        }} />
                        <div style={{ color: 'white', flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {segment.name}
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.8, fontFamily: 'monospace' }}>
                            {formatTime(segment.start)} → {formatTime(segment.end || duration)}
                            {' '}
                            <span style={{ opacity: 0.6 }}>
                              (Duration: {formatTime((segment.end || duration) - segment.start)})
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSegment(segment.id);
                        }}
                        style={{
                          background: '#ef4444',
                          border: 'none',
                          color: 'white',
                          width: '36px',
                          height: '36px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                      >
                        <IoMdTrash size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  background: '#0f3460',
  border: 'none',
  color: 'white',
  padding: '10px 16px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '14px',
  fontWeight: '600',
  transition: 'background 0.2s',
};

const iconButtonStyle: React.CSSProperties = {
  background: '#0f3460',
  border: 'none',
  color: 'white',
  width: '40px',
  height: '40px',
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};
