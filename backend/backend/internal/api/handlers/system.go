package handlers

import (
	"net/http"
	"runtime"

	"github.com/gin-gonic/gin"
	"github.com/mifi/lossless-cut/backend/internal/config"
	"go.uber.org/zap"
)

type SystemHandler struct {
	config *config.Config
	logger *zap.Logger
}

func NewSystemHandler(cfg *config.Config, logger *zap.Logger) *SystemHandler {
	return &SystemHandler{
		config: cfg,
		logger: logger,
	}
}

// Info returns system information
func (h *SystemHandler) Info(c *gin.Context) {
	info := gin.H{
		"version":    "0.1.0",
		"go_version": runtime.Version(),
		"os":         runtime.GOOS,
		"arch":       runtime.GOARCH,
		"storage":    h.config.Storage.BasePath,
	}

	c.JSON(http.StatusOK, info)
}
