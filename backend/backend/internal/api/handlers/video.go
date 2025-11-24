package handlers

import (
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/mifi/lossless-cut/backend/internal/config"
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

// Upload handles video file uploads
func (h *VideoHandler) Upload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
		return
	}

	// Save uploaded file
	uploadPath := h.services.Storage.GetVideoPath(file.Filename)
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		h.logger.Error("Failed to save uploaded file", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
		return
	}

	// Create video record
	video, err := h.services.Video.CreateFromUpload(file.Filename, uploadPath)
	if err != nil {
		h.logger.Error("Failed to create video record", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"video_id": video.ID,
		"video":    video,
	})
}

// Download initiates a video download from URL using yt-dlp
func (h *VideoHandler) Download(c *gin.Context) {
	var req services.DownloadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	download, err := h.services.Download.StartDownload(c.Request.Context(), req)
	if err != nil {
		h.logger.Error("Failed to start download", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, download)
}

// Stream streams a video file with range support
func (h *VideoHandler) Stream(c *gin.Context) {
	id := c.Param("id")

	video, err := h.services.Video.Get(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "video not found"})
		return
	}

	// Determine the actual file path
	filePath := video.FilePath
	if !filepath.IsAbs(filePath) {
		filePath = h.services.Storage.GetVideoPath(video.FileName)
	}

	// Check if file exists
	if !h.services.Storage.FileExists(filePath) {
		c.JSON(http.StatusNotFound, gin.H{"error": "video file not found"})
		return
	}

	// Serve the file with range support
	c.File(filePath)
}

// Delete deletes a video
func (h *VideoHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.services.Video.Delete(id); err != nil {
		h.logger.Error("Failed to delete video", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "video deleted"})
}
