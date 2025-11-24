package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/mifi/lossless-cut/backend/internal/config"
	"github.com/mifi/lossless-cut/backend/internal/models"
	"github.com/mifi/lossless-cut/backend/internal/services"
	"go.uber.org/zap"
)

type VideoHandler struct {
	services *services.Services
	config   *config.Config
	logger   *zap.Logger
}

func NewVideoHandler(services *services.Services, cfg *config.Config, logger *zap.Logger) *VideoHandler {
	return &VideoHandler{
		services: services,
		config:   cfg,
		logger:   logger,
	}
}

func (h *VideoHandler) Upload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}

	// Check file size
	if file.Size > h.config.Server.MaxUploadSize {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file too large"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	filename := uuid.New().String() + ext
	destPath := h.services.Storage.GetVideoPath(filename)

	// Save file
	if err := c.SaveUploadedFile(file, destPath); err != nil {
		h.logger.Error("Failed to save uploaded file", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	// Create video record
	video, err := h.services.Video.CreateFromUpload(file.Filename, destPath)
	if err != nil {
		h.logger.Error("Failed to create video record", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create video"})
		return
	}

	h.logger.Info("Video uploaded successfully",
		zap.String("id", video.ID),
		zap.String("filename", file.Filename),
		zap.Int64("size", file.Size),
	)

	c.JSON(http.StatusCreated, models.UploadResponse{
		VideoID: video.ID,
		Video:   video,
	})
}

func (h *VideoHandler) Download(c *gin.Context) {
	var req models.DownloadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement yt-dlp download
	c.JSON(http.StatusNotImplemented, gin.H{"error": "yt-dlp download not yet implemented"})
}

func (h *VideoHandler) Stream(c *gin.Context) {
	videoID := c.Param("id")

	// Get video metadata
	video, err := h.services.Video.Get(videoID)
	if err != nil {
		h.logger.Error("Video not found", zap.String("id", videoID), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "video not found"})
		return
	}

	videoPath := video.FilePath
	if !h.services.Storage.FileExists(videoPath) {
		h.logger.Error("Video file not found", zap.String("path", videoPath))
		c.JSON(http.StatusNotFound, gin.H{"error": "video file not found"})
		return
	}

	// Open file
	file, err := os.Open(videoPath)
	if err != nil {
		h.logger.Error("Failed to open video file", zap.String("path", videoPath), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to open video"})
		return
	}
	defer file.Close()

	// Get file info
	fileInfo, err := file.Stat()
	if err != nil {
		h.logger.Error("Failed to stat video file", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get file info"})
		return
	}

	// Set headers
	c.Header("Content-Type", "video/mp4") // TODO: Detect proper content type
	c.Header("Content-Length", fmt.Sprintf("%d", fileInfo.Size()))
	c.Header("Accept-Ranges", "bytes")

	// TODO: Implement proper HTTP range requests for seeking

	// Stream file
	if _, err := io.Copy(c.Writer, file); err != nil {
		h.logger.Error("Failed to stream video", zap.Error(err))
	}
}

func (h *VideoHandler) Delete(c *gin.Context) {
	videoID := c.Param("id")

	if err := h.services.Video.Delete(videoID); err != nil {
		h.logger.Error("Failed to delete video", zap.String("id", videoID), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete video"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "video deleted"})
}
