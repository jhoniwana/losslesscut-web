package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mifi/lossless-cut/backend/internal/models"
	"github.com/mifi/lossless-cut/backend/internal/services"
	"go.uber.org/zap"
)

type ProjectHandler struct {
	services *services.Services
	logger   *zap.Logger
}

func NewProjectHandler(services *services.Services, logger *zap.Logger) *ProjectHandler {
	return &ProjectHandler{
		services: services,
		logger:   logger,
	}
}

type CreateProjectRequest struct {
	Name    string `json:"name" binding:"required"`
	VideoID string `json:"video_id" binding:"required"`
}

// Create creates a new project
func (h *ProjectHandler) Create(c *gin.Context) {
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.services.Project.Create(req.Name, req.VideoID)
	if err != nil {
		h.logger.Error("Failed to create project", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, project)
}

// Get retrieves a project
func (h *ProjectHandler) Get(c *gin.Context) {
	id := c.Param("id")

	project, err := h.services.Project.Get(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, project)
}

// List returns all projects
func (h *ProjectHandler) List(c *gin.Context) {
	projects, err := h.services.Project.List()
	if err != nil {
		h.logger.Error("Failed to list projects", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

// Update updates a project
func (h *ProjectHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var project models.Project
	if err := c.ShouldBindJSON(&project); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project.ID = id
	if err := h.services.Project.Save(&project); err != nil {
		h.logger.Error("Failed to update project", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, project)
}

// Delete deletes a project
func (h *ProjectHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.services.Project.Delete(id); err != nil {
		h.logger.Error("Failed to delete project", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "project deleted"})
}

// Export exports project segments
func (h *ProjectHandler) Export(c *gin.Context) {
	id := c.Param("id")

	var req models.ExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	operation, err := h.services.Operation.Export(id, req)
	if err != nil {
		h.logger.Error("Failed to export project", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, operation)
}

// AddSegment adds a segment to a project
func (h *ProjectHandler) AddSegment(c *gin.Context) {
	id := c.Param("id")

	var segment models.Segment
	if err := c.ShouldBindJSON(&segment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.services.Project.Get(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	project.Segments = append(project.Segments, segment)
	if err := h.services.Project.Save(project); err != nil {
		h.logger.Error("Failed to add segment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, segment)
}

// UpdateSegment updates a segment
func (h *ProjectHandler) UpdateSegment(c *gin.Context) {
	id := c.Param("id")
	segmentID := c.Param("segmentId")

	var updatedSegment models.Segment
	if err := c.ShouldBindJSON(&updatedSegment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.services.Project.Get(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	found := false
	for i, seg := range project.Segments {
		if seg.ID == segmentID {
			updatedSegment.ID = segmentID
			project.Segments[i] = updatedSegment
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "segment not found"})
		return
	}

	if err := h.services.Project.Save(project); err != nil {
		h.logger.Error("Failed to update segment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedSegment)
}

// DeleteSegment deletes a segment
func (h *ProjectHandler) DeleteSegment(c *gin.Context) {
	id := c.Param("id")
	segmentID := c.Param("segmentId")

	project, err := h.services.Project.Get(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	newSegments := []models.Segment{}
	found := false
	for _, seg := range project.Segments {
		if seg.ID != segmentID {
			newSegments = append(newSegments, seg)
		} else {
			found = true
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "segment not found"})
		return
	}

	project.Segments = newSegments
	if err := h.services.Project.Save(project); err != nil {
		h.logger.Error("Failed to delete segment", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "segment deleted"})
}
