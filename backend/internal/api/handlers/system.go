package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mifi/lossless-cut/backend/internal/config"
	"github.com/mifi/lossless-cut/backend/internal/services"
	"go.uber.org/zap"
)

type SystemHandler struct {
	config   *config.Config
	services *services.Services
	logger   *zap.Logger
}

func NewSystemHandler(cfg *config.Config, services *services.Services, logger *zap.Logger) *SystemHandler {
	return &SystemHandler{
		config:   cfg,
		services: services,
		logger:   logger,
	}
}

func (h *SystemHandler) Info(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"name":    "LosslessCut Server",
		"version": "1.0.0",
		"ffmpeg":  h.config.FFmpeg.Path,
		"ytdlp":   h.config.YtDlp.Path,
	})
}

// ClearAll deletes all videos, downloads, projects, and outputs
func (h *SystemHandler) ClearAll(c *gin.Context) {
	h.logger.Info("Clearing all data via API request")

	if err := h.services.Storage.ClearEverything(); err != nil {
		h.logger.Error("Failed to clear all data", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to clear data"})
		return
	}

	h.logger.Info("Successfully cleared all data")
	c.JSON(http.StatusOK, gin.H{
		"message": "All videos, downloads, projects, and history have been cleared",
		"counter_reset": true,
	})
}
