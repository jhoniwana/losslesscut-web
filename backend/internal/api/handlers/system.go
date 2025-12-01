package handlers

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/mifi/lossless-cut/backend/internal/config"
	"github.com/mifi/lossless-cut/backend/internal/services"
	"go.uber.org/zap"
)

// Session tracks active user sessions for auto-cleanup
type Session struct {
	ID        string
	LastSeen  time.Time
	AutoClean bool
}

type SystemHandler struct {
	config   *config.Config
	services *services.Services
	logger   *zap.Logger
	sessions map[string]*Session
	sessLock sync.RWMutex
}

func NewSystemHandler(cfg *config.Config, services *services.Services, logger *zap.Logger) *SystemHandler {
	h := &SystemHandler{
		config:   cfg,
		services: services,
		logger:   logger,
		sessions: make(map[string]*Session),
	}

	// Start session cleanup goroutine
	go h.sessionCleanupLoop()

	return h
}

// sessionCleanupLoop checks for expired sessions and cleans up data
func (h *SystemHandler) sessionCleanupLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		h.sessLock.Lock()
		now := time.Now()
		for id, session := range h.sessions {
			// If session hasn't been seen in 2 minutes and auto-clean is enabled
			if session.AutoClean && now.Sub(session.LastSeen) > 2*time.Minute {
				h.logger.Info("Session expired, triggering auto-cleanup",
					zap.String("sessionId", id),
					zap.Duration("inactive", now.Sub(session.LastSeen)),
				)
				delete(h.sessions, id)

				// Only cleanup if no other active sessions
				if len(h.sessions) == 0 {
					go func() {
						if err := h.services.Storage.ClearEverything(); err != nil {
							h.logger.Error("Auto-cleanup failed", zap.Error(err))
						} else {
							h.logger.Info("Auto-cleanup completed successfully")
						}
					}()
				}
			}
		}
		h.sessLock.Unlock()
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
		"message":       "All videos, downloads, projects, and history have been cleared",
		"counter_reset": true,
	})
}

// SessionStart creates or updates a session with auto-cleanup option
func (h *SystemHandler) SessionStart(c *gin.Context) {
	var req struct {
		SessionID string `json:"session_id"`
		AutoClean bool   `json:"auto_clean"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	h.sessLock.Lock()
	h.sessions[req.SessionID] = &Session{
		ID:        req.SessionID,
		LastSeen:  time.Now(),
		AutoClean: req.AutoClean,
	}
	h.sessLock.Unlock()

	h.logger.Info("Session started",
		zap.String("sessionId", req.SessionID),
		zap.Bool("autoClean", req.AutoClean),
	)

	c.JSON(http.StatusOK, gin.H{
		"session_id": req.SessionID,
		"auto_clean": req.AutoClean,
		"message":    "Session registered",
	})
}

// SessionHeartbeat updates session last seen time
func (h *SystemHandler) SessionHeartbeat(c *gin.Context) {
	var req struct {
		SessionID string `json:"session_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	h.sessLock.Lock()
	if session, exists := h.sessions[req.SessionID]; exists {
		session.LastSeen = time.Now()
	}
	h.sessLock.Unlock()

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// SessionEnd ends a session and optionally triggers cleanup
func (h *SystemHandler) SessionEnd(c *gin.Context) {
	var req struct {
		SessionID string `json:"session_id"`
		Cleanup   bool   `json:"cleanup"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	h.sessLock.Lock()
	session, exists := h.sessions[req.SessionID]
	if exists {
		delete(h.sessions, req.SessionID)
	}
	remainingSessions := len(h.sessions)
	h.sessLock.Unlock()

	if exists && (req.Cleanup || session.AutoClean) && remainingSessions == 0 {
		h.logger.Info("Session ended, triggering cleanup",
			zap.String("sessionId", req.SessionID),
		)

		if err := h.services.Storage.ClearEverything(); err != nil {
			h.logger.Error("Session cleanup failed", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cleanup failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Session ended and data cleared",
			"cleaned": true,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Session ended",
		"cleaned": false,
	})
}

// GetStats returns storage statistics
func (h *SystemHandler) GetStats(c *gin.Context) {
	videos, _ := h.services.Storage.ListVideos()
	downloads, _ := h.services.Storage.ListDownloads()
	projects, _ := h.services.Storage.ListProjects()

	h.sessLock.RLock()
	activeSessions := len(h.sessions)
	h.sessLock.RUnlock()

	c.JSON(http.StatusOK, gin.H{
		"videos":          len(videos),
		"downloads":       len(downloads),
		"projects":        len(projects),
		"active_sessions": activeSessions,
	})
}
