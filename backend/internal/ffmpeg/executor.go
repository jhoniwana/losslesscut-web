package ffmpeg

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"os/exec"
	"sync"

	"go.uber.org/zap"
)

// Executor manages FFmpeg process execution
type Executor struct {
	ffmpegPath  string
	ffprobePath string
	logger      *zap.Logger
	mu          sync.Mutex
	processes   map[string]*exec.Cmd
}

// NewExecutor creates a new FFmpeg executor
func NewExecutor(ffmpegPath, ffprobePath string, logger *zap.Logger) *Executor {
	if ffmpegPath == "" {
		ffmpegPath = "ffmpeg"
	}
	if ffprobePath == "" {
		ffprobePath = "ffprobe"
	}

	return &Executor{
		ffmpegPath:  ffmpegPath,
		ffprobePath: ffprobePath,
		logger:      logger,
		processes:   make(map[string]*exec.Cmd),
	}
}

// ProgressCallback is called with progress updates (0.0 to 1.0)
type ProgressCallback func(progress float64)

// ExecuteOptions contains options for FFmpeg execution
type ExecuteOptions struct {
	Args       []string
	Duration   float64
	OnProgress ProgressCallback
	StdinData  io.Reader
}

// Execute runs FFmpeg with the given arguments
func (e *Executor) Execute(ctx context.Context, opts ExecuteOptions) error {
	cmd := exec.CommandContext(ctx, e.ffmpegPath, opts.Args...)

	// Log the command
	e.logger.Info("Executing FFmpeg",
		zap.String("command", cmd.String()),
	)

	// Set up stdin if provided
	if opts.StdinData != nil {
		cmd.Stdin = opts.StdinData
	}

	// Capture stderr for progress parsing
	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("failed to create stderr pipe: %w", err)
	}

	// Capture stdout
	var stdoutBuf bytes.Buffer
	cmd.Stdout = &stdoutBuf

	// Start the command
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	// Track the process
	processID := fmt.Sprintf("%d", cmd.Process.Pid)
	e.mu.Lock()
	e.processes[processID] = cmd
	e.mu.Unlock()

	defer func() {
		e.mu.Lock()
		delete(e.processes, processID)
		e.mu.Unlock()
	}()

	// Parse progress in a goroutine
	var stderrBuf bytes.Buffer
	progressDone := make(chan struct{})

	go func() {
		defer close(progressDone)
		e.parseProgress(stderrPipe, &stderrBuf, opts.Duration, opts.OnProgress)
	}()

	// Wait for process to complete
	err = cmd.Wait()

	// Wait for progress parsing to finish
	<-progressDone

	if err != nil {
		// Extract error message from stderr
		stderrStr := stderrBuf.String()
		errorMsg := ParseFFmpegError(stderrStr)

		e.logger.Error("FFmpeg execution failed",
			zap.Error(err),
			zap.String("stderr", errorMsg),
		)

		return fmt.Errorf("ffmpeg failed: %s", errorMsg)
	}

	e.logger.Info("FFmpeg execution completed successfully")
	return nil
}

// parseProgress reads stderr line by line and calls progress callback
func (e *Executor) parseProgress(stderr io.Reader, stderrBuf *bytes.Buffer, duration float64, onProgress ProgressCallback) {
	parser := NewProgressParser(duration)
	scanner := bufio.NewScanner(io.TeeReader(stderr, stderrBuf))

	for scanner.Scan() {
		line := scanner.Text()

		if onProgress != nil {
			progress := parser.ParseLine(line)
			if progress >= 0 {
				onProgress(progress)
			}
		}
	}

	if err := scanner.Err(); err != nil {
		e.logger.Warn("Error reading FFmpeg stderr", zap.Error(err))
	}
}

// CutVideo cuts a video segment with maximum performance optimizations
func (e *Executor) CutVideo(ctx context.Context, input, output string, start, end float64, onProgress ProgressCallback) error {
	duration := end - start

	// OPTIMIZED for LOSSLESS cutting with proper timestamp handling:
	// 1. -i input file first
	// 2. -ss AFTER -i = output seeking (frame-accurate with -c copy)
	// 3. -t = duration to extract
	// 4. -map 0 = copy all streams (video, audio, subtitles)
	// 5. -c copy = lossless stream copy (no re-encoding)
	// 6. -avoid_negative_ts make_zero = fix timestamp issues
	// 7. -movflags +faststart = web-optimized MP4 (moov atom at start)
	//
	// NOTE: We use -ss AFTER -i for -c copy to avoid timestamp conflicts.
	// This is slightly slower but ensures proper frame extraction with stream copy.
	args := []string{
		"-hide_banner",
		"-i", input,
		"-ss", fmt.Sprintf("%.3f", start),     // OUTPUT SEEKING (after -i) = accurate with -c copy
		"-t", fmt.Sprintf("%.3f", duration),   // Duration to extract
		"-map", "0",                           // Copy all streams
		"-c", "copy",                          // Lossless copy - no re-encoding
		"-avoid_negative_ts", "make_zero",    // Fix timestamp issues
		"-movflags", "+faststart",            // Web-optimized (moov atom at start)
		"-y",                                  // Overwrite output
		output,
	}

	return e.Execute(ctx, ExecuteOptions{
		Args:       args,
		Duration:   duration,
		OnProgress: onProgress,
	})
}

// MergeVideos merges multiple video segments using concat demuxer (optimized)
func (e *Executor) MergeVideos(ctx context.Context, inputs []string, output string, totalDuration float64, onProgress ProgressCallback) error {
	// Create concat file content
	var concatContent bytes.Buffer
	for _, input := range inputs {
		concatContent.WriteString(fmt.Sprintf("file '%s'\n", input))
	}

	// OPTIMIZED for LOSSLESS merging:
	// - concat demuxer with -c copy = no re-encoding
	// - movflags +faststart = web-optimized output
	// - map 0 = copy all streams
	args := []string{
		"-hide_banner",
		"-f", "concat",
		"-safe", "0",
		"-i", "pipe:0",                // Read concat file list from stdin
		"-map", "0",                   // Copy all streams
		"-c", "copy",                  // Lossless copy - no re-encoding
		"-avoid_negative_ts", "make_zero",  // Fix timestamp issues
		"-movflags", "+faststart",    // Web-optimized MP4
		"-y",
		output,
	}

	return e.Execute(ctx, ExecuteOptions{
		Args:       args,
		Duration:   totalDuration,
		OnProgress: onProgress,
		StdinData:  &concatContent,
	})
}

// ConvertFormat converts video to different format
func (e *Executor) ConvertFormat(ctx context.Context, input, output, format string, duration float64, onProgress ProgressCallback) error {
	args := []string{
		"-hide_banner",
		"-i", input,
		"-c", "copy",
	}

	if format != "" {
		args = append(args, "-f", format)
	}

	args = append(args, "-y", output)

	return e.Execute(ctx, ExecuteOptions{
		Args:       args,
		Duration:   duration,
		OnProgress: onProgress,
	})
}

// CaptureSnapshot captures a frame as an image
func (e *Executor) CaptureSnapshot(ctx context.Context, input, output string, timestamp float64, quality int) error {
	args := []string{
		"-hide_banner",
		"-ss", fmt.Sprintf("%.3f", timestamp),
		"-i", input,
		"-vframes", "1",
		"-q:v", fmt.Sprintf("%d", quality),
		"-y",
		output,
	}

	return e.Execute(ctx, ExecuteOptions{
		Args: args,
	})
}

// ExtractAudio extracts audio track from video
func (e *Executor) ExtractAudio(ctx context.Context, input, output string, duration float64, onProgress ProgressCallback) error {
	args := []string{
		"-hide_banner",
		"-i", input,
		"-vn", // No video
		"-acodec", "copy",
		"-y",
		output,
	}

	return e.Execute(ctx, ExecuteOptions{
		Args:       args,
		Duration:   duration,
		OnProgress: onProgress,
	})
}

// GetFFmpegPath returns the FFmpeg binary path
func (e *Executor) GetFFmpegPath() string {
	return e.ffmpegPath
}

// GetFFprobePath returns the FFprobe binary path
func (e *Executor) GetFFprobePath() string {
	return e.ffprobePath
}
