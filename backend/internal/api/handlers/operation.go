package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mifi/lossless-cut/backend/internal/services"
	"go.uber.org/zap"
)

type OperationHandler struct {
	services *services.Services
	logger   *zap.Logger
}

func NewOperationHandler(services *services.Services, logger *zap.Logger) *OperationHandler {
	return &OperationHandler{
		services: services,
		logger:   logger,
	}
}

// GetStatus returns the status of an operation
func (h *OperationHandler) GetStatus(c *gin.Context) {
	operationID := c.Param("id")

	operation, err := h.services.Operation.GetStatus(operationID)
	if err != nil {
		h.logger.Error("Failed to get operation status", zap.String("id", operationID), zap.Error(err))
		c.JSON(http.StatusNotFound, gin.H{"error": "operation not found"})
		return
	}

	c.JSON(http.StatusOK, operation)
}
