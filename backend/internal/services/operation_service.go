package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/mifi/lossless-cut/backend/internal/config"
	"github.com/mifi/lossless-cut/backend/internal/ffmpeg"
	"github.com/mifi/lossless-cut/backend/internal/models"
	"github.com/mifi/lossless-cut/backend/internal/storage"
	"go.uber.org/zap"
)

type OperationService struct {
	storage    *storage.Manager
	config     *config.Config
	logger     *zap.Logger
	ffmpeg     *ffmpeg.Executor
	operations map[string]*models.Operation
}

func NewOperationService(storage *storage.Manager, cfg *config.Config, logger *zap.Logger) *OperationService {
	return &OperationService{
		storage:    storage,
		config:     cfg,
		logger:     logger,
		ffmpeg:     ffmpeg.NewExecutor(cfg.FFmpeg.Path, "ffprobe", logger),
		operations: make(map[string]*models.Operation),
	}
}

func (s *OperationService) Export(project *models.Project, request models.ExportRequest) (*models.Operation, error) {
	operation := &models.Operation{
		ID:        uuid.New().String(),
		Type:      models.OperationTypeExport,
		ProjectID: project.ID,
		Status:    models.OperationStatusPending,
		Progress:  0,
		CreatedAt: time.Now(),
	}

	// Store operation
	s.operations[operation.ID] = operation

	// Run export in background
	go s.runExport(operation, project, request)

	return operation, nil
}

func (s *OperationService) runExport(operation *models.Operation, project *models.Project, request models.ExportRequest) {
	operation.Status = models.OperationStatusProcessing
	ctx := context.Background()

	// Get actual video file path from metadata
	video, err := s.storage.GetVideo(project.VideoID)
	if err != nil {
		operation.Status = models.OperationStatusFailed
		operation.Error = fmt.Sprintf("video not found: %v", err)
		s.logger.Error("Failed to get video for export",
			zap.String("videoId", project.VideoID),
			zap.Error(err),
		)
		return
	}

	inputPath := video.FilePath
	s.logger.Info("Starting export",
		zap.String("operationId", operation.ID),
		zap.String("inputPath", inputPath),
		zap.String("videoId", project.VideoID),
	)

	// Determine segments to export
	segments := project.Segments
	if len(request.SegmentIDs) > 0 {
		// Filter to specified segments
		filteredSegments := []models.Segment{}
		for _, seg := range project.Segments {
			for _, id := range request.SegmentIDs {
				if seg.ID == id {
					filteredSegments = append(filteredSegments, seg)
					break
				}
			}
		}
		segments = filteredSegments
	}

	if len(segments) == 0 {
		operation.Status = models.OperationStatusFailed
		operation.Error = "no segments to export"
		return
	}

	// Build output filename
	outputName := request.OutputName
	if outputName == "" {
		outputName = fmt.Sprintf("%s_export_%d", project.Name, time.Now().Unix())
	}

	format := request.Format
	if format == "" {
		format = "mp4"
	}

	outputPath := s.storage.GetOutputPath(fmt.Sprintf("%s.%s", outputName, format))

	// Progress callback
	onProgress := func(progress float64) {
		operation.Progress = progress * 100
		s.logger.Debug("Export progress",
			zap.String("operationId", operation.ID),
			zap.Float64("progress", operation.Progress),
		)
	}

	// Execute export based on request type
	var exportErr error
	if request.MergeSegments && len(segments) > 1 {
		// Export and merge multiple segments
		exportErr = s.exportMergedSegments(ctx, inputPath, outputPath, segments, onProgress)
	} else if len(segments) == 1 {
		// Export single segment
		seg := segments[0]
		end := seg.Start + 60.0 // Default end if not specified
		if seg.End != nil {
			end = *seg.End
		}
		exportErr = s.ffmpeg.CutVideo(ctx, inputPath, outputPath, seg.Start, end, onProgress)
	} else {
		// Export multiple segments as separate files
		exportErr = s.exportMultipleSegments(ctx, inputPath, outputName, format, segments, onProgress)
	}

	if exportErr != nil {
		operation.Status = models.OperationStatusFailed
		operation.Error = exportErr.Error()
		s.logger.Error("Export failed",
			zap.String("operationId", operation.ID),
			zap.Error(exportErr),
		)
		return
	}

	// Success
	now := time.Now()
	operation.Status = models.OperationStatusCompleted
	operation.Progress = 100
	operation.CompletedAt = &now
	operation.OutputFiles = []string{outputPath}

	s.logger.Info("Export completed",
		zap.String("operationId", operation.ID),
		zap.String("output", outputPath),
	)
}

func (s *OperationService) exportMergedSegments(ctx context.Context, inputPath, outputPath string, segments []models.Segment, onProgress ffmpeg.ProgressCallback) error {
	// Cut each segment to temp files
	tempFiles := make([]string, len(segments))

	for i, seg := range segments {
		tempFile := s.storage.GetTempPath(fmt.Sprintf("segment_%d_%s.mp4", i, uuid.New().String()))
		tempFiles[i] = tempFile

		end := seg.Start + 60.0
		if seg.End != nil {
			end = *seg.End
		}

		// Cut segment (no progress callback for individual segments)
		if err := s.ffmpeg.CutVideo(ctx, inputPath, tempFile, seg.Start, end, nil); err != nil {
			return fmt.Errorf("failed to cut segment %d: %w", i, err)
		}
	}

	// Merge all segments
	totalDuration := 0.0
	for _, seg := range segments {
		end := seg.Start + 60.0
		if seg.End != nil {
			end = *seg.End
		}
		totalDuration += (end - seg.Start)
	}

	if err := s.ffmpeg.MergeVideos(ctx, tempFiles, outputPath, totalDuration, onProgress); err != nil {
		return fmt.Errorf("failed to merge segments: %w", err)
	}

	// Clean up temp files
	for _, tempFile := range tempFiles {
		s.storage.DeleteFile(tempFile)
	}

	return nil
}

func (s *OperationService) exportMultipleSegments(ctx context.Context, inputPath, outputBaseName, format string, segments []models.Segment, onProgress ffmpeg.ProgressCallback) error {
	for i, seg := range segments {
		segmentName := fmt.Sprintf("%s_segment_%d.%s", outputBaseName, i+1, format)
		outputPath := s.storage.GetOutputPath(segmentName)

		end := seg.Start + 60.0
		if seg.End != nil {
			end = *seg.End
		}

		if err := s.ffmpeg.CutVideo(ctx, inputPath, outputPath, seg.Start, end, onProgress); err != nil {
			return fmt.Errorf("failed to export segment %d: %w", i, err)
		}
	}

	return nil
}

func (s *OperationService) GetStatus(operationID string) (*models.Operation, error) {
	operation, exists := s.operations[operationID]
	if !exists {
		return nil, fmt.Errorf("operation not found: %s", operationID)
	}
	return operation, nil
}
