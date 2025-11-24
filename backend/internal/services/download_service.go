package services

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"

	"github.com/mifi/lossless-cut/backend/internal/config"
	"github.com/mifi/lossless-cut/backend/internal/models"
	"github.com/mifi/lossless-cut/backend/internal/storage"
	"go.uber.org/zap"
)

// DownloadService handles video downloads using yt-dlp
type DownloadService struct {
	storage      *storage.Manager
	videoService *VideoService
	config       *config.Config
	logger       *zap.Logger
	mu           sync.Mutex
	downloads    map[string]*models.Download
}

// NewDownloadService creates a new download service
func NewDownloadService(storage *storage.Manager, videoService *VideoService, cfg *config.Config, logger *zap.Logger) *DownloadService {
	return &DownloadService{
		storage:      storage,
		videoService: videoService,
		config:       cfg,
		logger:       logger,
		downloads:    make(map[string]*models.Download),
	}
}

// DownloadRequest represents a download request
type DownloadRequest struct {
	URL    string `json:"url" binding:"required"`
	Format string `json:"format,omitempty"` // e.g., "best", "bestvideo+bestaudio", specific format ID
}

// StartDownload initiates a video download
func (s *DownloadService) StartDownload(ctx context.Context, req DownloadRequest) (*models.Download, error) {
	// Create download record
	download := &models.Download{
		URL:    req.URL,
		Status: models.DownloadStatusPending,
	}

	if err := s.storage.CreateDownload(download); err != nil {
		return nil, fmt.Errorf("failed to create download record: %w", err)
	}

	s.mu.Lock()
	s.downloads[download.ID] = download
	s.mu.Unlock()

	// Start download in background
	videoNumber := s.storage.GetNextVideoNumber()
	go s.runDownload(download.ID, req, videoNumber)

	return download, nil
}

// GetDownload retrieves download status
func (s *DownloadService) GetDownload(id string) (*models.Download, error) {
	s.mu.Lock()
	download, exists := s.downloads[id]
	s.mu.Unlock()

	if exists {
		return download, nil
	}

	// Try loading from storage
	return s.storage.GetDownload(id)
}

// ListDownloads returns all downloads
func (s *DownloadService) ListDownloads() ([]*models.Download, error) {
	return s.storage.ListDownloads()
}

// CancelDownload cancels an ongoing download
func (s *DownloadService) CancelDownload(id string) error {
	s.mu.Lock()
	download, exists := s.downloads[id]
	s.mu.Unlock()

	if !exists {
		return fmt.Errorf("download not found or already completed")
	}

	download.Status = models.DownloadStatusCancelled
	if err := s.storage.UpdateDownload(download); err != nil {
		return err
	}

	return nil
}

// runDownload executes the actual download
func (s *DownloadService) runDownload(downloadID string, req DownloadRequest, videoNumber int) {
	s.mu.Lock()
	download := s.downloads[downloadID]
	s.mu.Unlock()

	download.Status = models.DownloadStatusDownloading
	s.storage.UpdateDownload(download)

	// Get video info first
	info, err := s.getVideoInfo(req.URL)
	if err != nil {
		s.logger.Error("Failed to get video info", zap.Error(err))
		download.Status = models.DownloadStatusFailed
		download.Error = err.Error()
		s.storage.UpdateDownload(download)
		return
	}

	download.Title = info.Title
	download.Duration = info.Duration
	s.storage.UpdateDownload(download)

	// Determine output path
	outputDir := s.storage.GetDownloadPath()
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		s.logger.Error("Failed to create download directory", zap.Error(err))
		download.Status = models.DownloadStatusFailed
		download.Error = err.Error()
		s.storage.UpdateDownload(download)
		return
	}

	// Use simple sequential naming for easier FFmpeg management
	// For yt-dlp, we need to specify the extension in the template
	// yt-dlp will use the actual video extension (.mp4, .webm, .mkv, etc.)
	outputTemplate := filepath.Join(outputDir, fmt.Sprintf("video%d.%%(ext)s", videoNumber))

	s.logger.Info("Downloading video with simple naming",
		zap.Int("videoNumber", videoNumber),
		zap.String("outputTemplate", outputTemplate),
		zap.String("title", info.Title),
	)

	// Build yt-dlp command
	args := []string{
		"--newline",
		"--no-playlist",
		"--progress",
		"-o", outputTemplate,
	}

	// Add format if specified
	if req.Format != "" {
		args = append(args, "-f", req.Format)
	} else {
		args = append(args, "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best")
	}

	args = append(args, req.URL)

	// Execute yt-dlp
	cmd := exec.Command("yt-dlp", args...)

	// Create pipes for output
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		s.logger.Error("Failed to create stdout pipe", zap.Error(err))
		download.Status = models.DownloadStatusFailed
		download.Error = err.Error()
		s.storage.UpdateDownload(download)
		return
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		s.logger.Error("Failed to create stderr pipe", zap.Error(err))
		download.Status = models.DownloadStatusFailed
		download.Error = err.Error()
		s.storage.UpdateDownload(download)
		return
	}

	if err := cmd.Start(); err != nil {
		s.logger.Error("Failed to start yt-dlp", zap.Error(err))
		download.Status = models.DownloadStatusFailed
		download.Error = err.Error()
		s.storage.UpdateDownload(download)
		return
	}

	// Parse progress from stdout
	go s.parseDownloadProgress(stdout, download)

	// Log stderr
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			s.logger.Debug("yt-dlp stderr", zap.String("line", scanner.Text()))
		}
	}()

	// Wait for completion
	if err := cmd.Wait(); err != nil {
		if download.Status == models.DownloadStatusCancelled {
			s.logger.Info("Download cancelled", zap.String("id", downloadID))
			s.storage.UpdateDownload(download)
			return
		}

		s.logger.Error("yt-dlp failed", zap.Error(err))
		download.Status = models.DownloadStatusFailed
		download.Error = err.Error()
		s.storage.UpdateDownload(download)
		return
	}

	// Find the downloaded file
	// yt-dlp saves with the actual extension (.mp4, .webm, .mkv, etc.)
	// Look for video{N}.* where * is any extension
	pattern := filepath.Join(outputDir, fmt.Sprintf("video%d.*", videoNumber))
	files, err := filepath.Glob(pattern)

	if err != nil {
		s.logger.Error("Failed to glob for downloaded file",
			zap.Error(err),
			zap.String("pattern", pattern),
		)
		download.Status = models.DownloadStatusFailed
		download.Error = fmt.Sprintf("glob error: %v", err)
		s.storage.UpdateDownload(download)
		return
	}

	if len(files) == 0 {
		s.logger.Error("Downloaded file not found",
			zap.String("pattern", pattern),
			zap.Int("videoNumber", videoNumber),
		)
		download.Status = models.DownloadStatusFailed
		download.Error = "downloaded file not found"
		s.storage.UpdateDownload(download)
		return
	}

	downloadedFile := files[0]
	download.FilePath = downloadedFile

	s.logger.Info("Found downloaded file",
		zap.String("file", downloadedFile),
		zap.Int("videoNumber", videoNumber),
		zap.String("extension", filepath.Ext(downloadedFile)),
	)

	// Import the downloaded video
	filename := filepath.Base(downloadedFile)
	video, err := s.videoService.CreateFromUpload(filename, downloadedFile)
	if err != nil {
		s.logger.Error("Failed to import downloaded video", zap.Error(err))
		download.Status = models.DownloadStatusFailed
		download.Error = fmt.Sprintf("failed to import video: %v", err)
		s.storage.UpdateDownload(download)
		return
	}

	// Set the original URL
	video.OriginalURL = download.URL

	download.VideoID = video.ID
	download.Status = models.DownloadStatusCompleted
	download.Progress = 100.0
	s.storage.UpdateDownload(download)

	s.logger.Info("Download completed and imported",
		zap.String("id", downloadID),
		zap.String("file", downloadedFile),
		zap.String("video_id", video.ID),
	)

	// Clean up from memory
	s.mu.Lock()
	delete(s.downloads, downloadID)
	s.mu.Unlock()
}

// parseDownloadProgress parses yt-dlp progress output
func (s *DownloadService) parseDownloadProgress(stdout io.ReadCloser, download *models.Download) {
	scanner := bufio.NewScanner(stdout)
	// Regex to match: [download]  45.2% of 123.45MiB at 1.23MiB/s ETA 00:12
	progressRegex := regexp.MustCompile(`\[download\]\s+(\d+\.?\d*)%`)

	for scanner.Scan() {
		line := scanner.Text()

		if matches := progressRegex.FindStringSubmatch(line); len(matches) > 1 {
			if progress, err := strconv.ParseFloat(matches[1], 64); err == nil {
				download.Progress = progress
				s.storage.UpdateDownload(download)
				s.logger.Debug("Download progress",
					zap.String("id", download.ID),
					zap.Float64("progress", progress),
				)
			}
		}
	}
}

// VideoInfo represents basic video information from yt-dlp
type VideoInfo struct {
	Title    string  `json:"title"`
	Duration float64 `json:"duration"`
	Format   string  `json:"format"`
}

// getVideoInfo retrieves video information without downloading
func (s *DownloadService) getVideoInfo(url string) (*VideoInfo, error) {
	cmd := exec.Command("yt-dlp", "--dump-json", "--no-playlist", url)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get video info: %w", err)
	}

	var info VideoInfo
	if err := json.Unmarshal(output, &info); err != nil {
		return nil, fmt.Errorf("failed to parse video info: %w", err)
	}

	return &info, nil
}

// sanitizeFilename removes invalid characters from filename
func sanitizeFilename(name string) string {
	// Replace invalid characters with underscore
	invalid := regexp.MustCompile(`[<>:"/\\|?*]`)
	sanitized := invalid.ReplaceAllString(name, "_")

	// Limit length
	if len(sanitized) > 200 {
		sanitized = sanitized[:200]
	}

	return strings.TrimSpace(sanitized)
}
