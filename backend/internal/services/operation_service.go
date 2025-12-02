package services

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
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
		zap.Bool("mergeSegments", request.MergeSegments),
		zap.Bool("exportSeparate", request.ExportSeparate),
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

	// Progress callback
	onProgress := func(progress float64) {
		operation.Progress = progress * 100
		s.logger.Debug("Export progress",
			zap.String("operationId", operation.ID),
			zap.Float64("progress", operation.Progress),
		)
	}

	var outputFiles []string
	var exportErr error

	// Handle different export modes
	if len(segments) == 1 {
		// Single segment - just cut it
		outputPath := s.storage.GetOutputPath(fmt.Sprintf("%s.%s", outputName, format))
		seg := segments[0]
		end := seg.Start + 60.0
		if seg.End != nil {
			end = *seg.End
		}
		exportErr = s.ffmpeg.CutVideo(ctx, inputPath, outputPath, seg.Start, end, onProgress)
		if exportErr == nil {
			outputFiles = append(outputFiles, outputPath)
		}
	} else {
		// Multiple segments
		if request.MergeSegments {
			// Export merged file
			mergedPath := s.storage.GetOutputPath(fmt.Sprintf("%s_merged.%s", outputName, format))
			exportErr = s.exportMergedSegments(ctx, inputPath, mergedPath, segments, onProgress)
			if exportErr == nil {
				outputFiles = append(outputFiles, mergedPath)
			}
		}

		if request.ExportSeparate && exportErr == nil {
			// Export each segment separately
			separateFiles, err := s.exportMultipleSegments(ctx, inputPath, outputName, format, segments, onProgress)
			if err != nil {
				exportErr = err
			} else {
				outputFiles = append(outputFiles, separateFiles...)
			}
		}

		// Handle chapters export
		if request.ExportChapters && exportErr == nil {
			chaptersPath := s.storage.GetOutputPath(fmt.Sprintf("%s_chapters.%s", outputName, request.ChaptersFormat))
			err := s.exportChapters(ctx, chaptersPath, segments)
			if err != nil {
				exportErr = err
			} else {
				outputFiles = append(outputFiles, chaptersPath)
			}
		}

		// If neither merge nor separate was specified, default to merge
		if !request.MergeSegments && !request.ExportSeparate && !request.ExportChapters {
			mergedPath := s.storage.GetOutputPath(fmt.Sprintf("%s.%s", outputName, format))
			exportErr = s.exportMergedSegments(ctx, inputPath, mergedPath, segments, onProgress)
			if exportErr == nil {
				outputFiles = append(outputFiles, mergedPath)
			}
		}
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
	operation.OutputFiles = outputFiles

	s.logger.Info("Export completed",
		zap.String("operationId", operation.ID),
		zap.Int("outputFilesCount", len(outputFiles)),
		zap.Strings("outputFiles", outputFiles),
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

func (s *OperationService) exportMultipleSegments(ctx context.Context, inputPath, outputBaseName, format string, segments []models.Segment, onProgress ffmpeg.ProgressCallback) ([]string, error) {
	var outputFiles []string

	for i, seg := range segments {
		segmentName := fmt.Sprintf("%s_segment_%d.%s", outputBaseName, i+1, format)
		outputPath := s.storage.GetOutputPath(segmentName)

		end := seg.Start + 60.0
		if seg.End != nil {
			end = *seg.End
		}

		if err := s.ffmpeg.CutVideo(ctx, inputPath, outputPath, seg.Start, end, onProgress); err != nil {
			return outputFiles, fmt.Errorf("failed to export segment %d: %w", i, err)
		}

		outputFiles = append(outputFiles, outputPath)
	}

	return outputFiles, nil
}

// exportChapters exports segments as chapter file
func (s *OperationService) exportChapters(ctx context.Context, outputPath string, segments []models.Segment) error {
	var content string

	switch {
	case strings.HasSuffix(outputPath, ".txt"):
		content = s.generateChaptersTXT(segments)
	case strings.HasSuffix(outputPath, ".xml"):
		content = s.generateChaptersXML(segments)
	case strings.HasSuffix(outputPath, ".json"):
		content = s.generateChaptersJSON(segments)
	default:
		return fmt.Errorf("unsupported chapters format")
	}

	return os.WriteFile(outputPath, []byte(content), 0644)
}

// generateChaptersTXT creates chapters in simple text format
func (s *OperationService) generateChaptersTXT(segments []models.Segment) string {
	var content strings.Builder
	for i, seg := range segments {
		end := seg.Start + 60.0
		if seg.End != nil {
			end = *seg.End
		}

		name := seg.Name
		if name == "" {
			name = fmt.Sprintf("Chapter %d", i+1)
		}

		content.WriteString(fmt.Sprintf("%s\n", name))
		content.WriteString(fmt.Sprintf("00:%02d:%02d:%02d.%03d\n",
			int(seg.Start)/3600, (int(seg.Start)%3600)/60, int(seg.Start)%60, int((seg.Start-float64(int(seg.Start)))*1000)))
		content.WriteString(fmt.Sprintf("00:%02d:%02d:%02d.%03d\n\n",
			int(end)/3600, (int(end)%3600)/60, int(end)%60, int((end-float64(int(end)))*1000)))
	}
	return content.String()
}

// generateChaptersXML creates chapters in XML format (FFmpeg metadata)
func (s *OperationService) generateChaptersXML(segments []models.Segment) string {
	var content strings.Builder
	content.WriteString(`<?xml version="1.0" encoding="UTF-8"?>
<chapters>
`)

	for i, seg := range segments {
		end := seg.Start + 60.0
		if seg.End != nil {
			end = *seg.End
		}

		name := seg.Name
		if name == "" {
			name = fmt.Sprintf("Chapter %d", i+1)
		}

		content.WriteString(fmt.Sprintf(`  <chapter>
    <start>%f</start>
    <end>%f</end>
    <title>%s</title>
  </chapter>
`, seg.Start, end, name))
	}

	content.WriteString(`</chapters>`)
	return content.String()
}

// generateChaptersJSON creates chapters in JSON format
func (s *OperationService) generateChaptersJSON(segments []models.Segment) string {
	type Chapter struct {
		Start float64 `json:"start"`
		End   float64 `json:"end"`
		Name  string  `json:"name"`
	}

	var chapters []Chapter
	for i, seg := range segments {
		end := seg.Start + 60.0
		if seg.End != nil {
			end = *seg.End
		}

		name := seg.Name
		if name == "" {
			name = fmt.Sprintf("Chapter %d", i+1)
		}

		chapters = append(chapters, Chapter{
			Start: seg.Start,
			End:   end,
			Name:  name,
		})
	}

	data, _ := json.MarshalIndent(chapters, "", "  ")
	return string(data)
}

func (s *OperationService) GetStatus(operationID string) (*models.Operation, error) {
	operation, exists := s.operations[operationID]
	if !exists {
		return nil, fmt.Errorf("operation not found: %s", operationID)
	}
	return operation, nil
}
