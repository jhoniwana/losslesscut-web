package services

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/mifi/lossless-cut/backend/internal/config"
	"github.com/mifi/lossless-cut/backend/internal/ffmpeg"
	"github.com/mifi/lossless-cut/backend/internal/models"
	"github.com/mifi/lossless-cut/backend/internal/storage"
	"go.uber.org/zap"
)

type VideoService struct {
	storage  *storage.Manager
	config   *config.Config
	logger   *zap.Logger
	ffmpeg   *ffmpeg.Executor
}

func NewVideoService(storage *storage.Manager, cfg *config.Config, logger *zap.Logger) *VideoService {
	return &VideoService{
		storage: storage,
		config:  cfg,
		logger:  logger,
		ffmpeg:  ffmpeg.NewExecutor(cfg.FFmpeg.Path, "ffprobe", logger),
	}
}

func (s *VideoService) CreateFromUpload(filename string, filepath string) (*models.Video, error) {
	// Get file size
	fileSize, err := s.storage.GetFileSize(filepath)
	if err != nil {
		return nil, fmt.Errorf("failed to get file size: %w", err)
	}

	video := &models.Video{
		ID:       uuid.New().String(),
		FileName: filename,
		FilePath: filepath,
		FileSize: fileSize,
		CreatedAt: time.Now(),
	}

	// Extract metadata with FFprobe
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	probe, err := s.ffmpeg.Probe(ctx, filepath)
	if err != nil {
		s.logger.Warn("Failed to extract video metadata", zap.Error(err))
		// Don't fail the upload if probe fails, just log it
		return video, nil
	}

	// Parse metadata
	if duration, err := probe.GetDuration(); err == nil {
		video.Duration = duration
	}

	video.Format = probe.Format.FormatName

	// Get video dimensions from first video stream
	videoStreams := probe.GetVideoStreams()
	if len(videoStreams) > 0 {
		video.Width = videoStreams[0].Width
		video.Height = videoStreams[0].Height
		video.Codec = videoStreams[0].CodecName
	}

	// Convert probe result to models.VideoMetadata
	video.Metadata = convertProbeToMetadata(probe)

	// Save video metadata
	if err := s.storage.SaveVideo(video); err != nil {
		s.logger.Error("Failed to save video metadata", zap.Error(err))
		// Don't fail the upload if metadata save fails
	}

	s.logger.Info("Created video from upload",
		zap.String("id", video.ID),
		zap.String("filename", filename),
		zap.Float64("duration", video.Duration),
		zap.String("format", video.Format),
	)

	return video, nil
}

func (s *VideoService) Get(id string) (*models.Video, error) {
	return s.storage.GetVideo(id)
}

func (s *VideoService) Delete(id string) error {
	return s.storage.DeleteVideo(id)
}

// GenerateWaveform generates an audio waveform image using FFmpeg
func (s *VideoService) GenerateWaveform(inputPath, outputPath string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	return s.ffmpeg.GenerateWaveform(ctx, inputPath, outputPath)
}

// CaptureScreenshot captures a frame from a video at the specified timestamp
// Returns the path to the screenshot file
func (s *VideoService) CaptureScreenshot(videoID string, timestamp float64, quality int) (string, error) {
	video, err := s.Get(videoID)
	if err != nil {
		return "", fmt.Errorf("video not found: %w", err)
	}

	// Default quality (1=best, 31=worst for JPEG)
	if quality <= 0 || quality > 31 {
		quality = 2 // High quality default
	}

	// Generate unique filename with timestamp
	filename := fmt.Sprintf("%s_%.3f.jpg", videoID, timestamp)
	outputPath := s.storage.GetScreenshotPath(filename)

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	err = s.ffmpeg.CaptureSnapshot(ctx, video.FilePath, outputPath, timestamp, quality)
	if err != nil {
		return "", fmt.Errorf("failed to capture screenshot: %w", err)
	}

	s.logger.Info("Screenshot captured",
		zap.String("videoId", videoID),
		zap.Float64("timestamp", timestamp),
		zap.String("output", outputPath),
	)

	return filename, nil
}

// convertProbeToMetadata converts FFprobe result to our models
func convertProbeToMetadata(probe *ffmpeg.ProbeResult) models.VideoMetadata {
	metadata := models.VideoMetadata{
		Streams:  make([]models.Stream, len(probe.Streams)),
		Chapters: make([]models.Chapter, len(probe.Chapters)),
	}

	// Convert format
	bitRate, _ := strconv.ParseInt(probe.Format.BitRate, 10, 64)
	size, _ := strconv.ParseInt(probe.Format.Size, 10, 64)
	duration, _ := strconv.ParseFloat(probe.Format.Duration, 64)

	metadata.Format = models.Format{
		FormatName:     probe.Format.FormatName,
		FormatLongName: probe.Format.FormatLongName,
		Duration:       duration,
		Size:           size,
		BitRate:        bitRate,
	}

	// Convert streams
	for i, stream := range probe.Streams {
		bitRate, _ := strconv.ParseInt(stream.BitRate, 10, 64)
		duration, _ := strconv.ParseFloat(stream.Duration, 64)
		sampleRate, _ := strconv.Atoi(stream.SampleRate)

		metadata.Streams[i] = models.Stream{
			Index:      stream.Index,
			CodecType:  stream.CodecType,
			CodecName:  stream.CodecName,
			Width:      stream.Width,
			Height:     stream.Height,
			Duration:   duration,
			BitRate:    bitRate,
			SampleRate: sampleRate,
			Channels:   stream.Channels,
			Language:   stream.Tags["language"],
			Title:      stream.Tags["title"],
		}
	}

	// Convert chapters
	for i, chapter := range probe.Chapters {
		startTime, _ := strconv.ParseFloat(chapter.StartTime, 64)
		endTime, _ := strconv.ParseFloat(chapter.EndTime, 64)

		metadata.Chapters[i] = models.Chapter{
			ID:        chapter.ID,
			TimeBase:  chapter.TimeBase,
			Start:     chapter.Start,
			End:       chapter.End,
			StartTime: startTime,
			EndTime:   endTime,
			Title:     chapter.Tags["title"],
		}
	}

	return metadata
}
