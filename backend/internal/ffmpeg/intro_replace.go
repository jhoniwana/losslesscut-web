package ffmpeg

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

// CreateVideoFromImage converts an image to a video with specified duration
// Matches the original video's resolution, framerate, and codec settings
func (e *Executor) CreateVideoFromImage(imagePath, outputPath string, duration float64, width, height int, fps float64) error {
	if duration <= 0 {
		return fmt.Errorf("duration must be greater than 0")
	}

	// Build FFmpeg command to create video from image
	args := []string{
		"-loop", "1",
		"-i", imagePath,
		"-c:v", "libx264",
		"-t", fmt.Sprintf("%.3f", duration),
		"-vf", fmt.Sprintf("scale=%d:%d", width, height),
		"-r", fmt.Sprintf("%.2f", fps),
		"-pix_fmt", "yuv420p",
		"-y",
		outputPath,
	}

	ctx := context.Background()
	return e.Execute(ctx, ExecuteOptions{Args: args})
}

// ExtractAudioSegment extracts audio from a video for a specific duration
func (e *Executor) ExtractAudioSegment(inputPath, outputPath string, duration float64) error {
	if duration <= 0 {
		return fmt.Errorf("duration must be greater than 0")
	}

	args := []string{
		"-i", inputPath,
		"-t", fmt.Sprintf("%.3f", duration),
		"-vn",
		"-acodec", "copy",
		"-y",
		outputPath,
	}

	ctx := context.Background()
	return e.Execute(ctx, ExecuteOptions{Args: args})
}

// CombineVideoAndAudio merges a video file with an audio file
func (e *Executor) CombineVideoAndAudio(videoPath, audioPath, outputPath string) error {
	args := []string{
		"-i", videoPath,
		"-i", audioPath,
		"-c:v", "copy",
		"-c:a", "aac",
		"-shortest",
		"-y",
		outputPath,
	}

	ctx := context.Background()
	return e.Execute(ctx, ExecuteOptions{Args: args})
}

// TrimVideoFromStart removes the beginning of a video (keeps everything after startTime)
func (e *Executor) TrimVideoFromStart(inputPath, outputPath string, startTime float64) error {
	if startTime < 0 {
		return fmt.Errorf("start time must be non-negative")
	}

	args := []string{
		"-ss", fmt.Sprintf("%.3f", startTime),
		"-i", inputPath,
		"-c", "copy",
		"-y",
		outputPath,
	}

	ctx := context.Background()
	return e.Execute(ctx, ExecuteOptions{Args: args})
}

// ConcatenateVideos joins multiple videos together
func (e *Executor) ConcatenateVideos(inputPaths []string, outputPath string) error {
	if len(inputPaths) < 2 {
		return fmt.Errorf("need at least 2 videos to concatenate")
	}

	// Create a temporary concat list file
	tempDir := filepath.Dir(outputPath)
	concatListPath := filepath.Join(tempDir, "concat_list.txt")

	// Write the concat list
	var concatList string
	for _, path := range inputPaths {
		absPath, err := filepath.Abs(path)
		if err != nil {
			return fmt.Errorf("failed to get absolute path: %w", err)
		}
		concatList += fmt.Sprintf("file '%s'\n", absPath)
	}

	if err := os.WriteFile(concatListPath, []byte(concatList), 0644); err != nil {
		return fmt.Errorf("failed to create concat list: %w", err)
	}
	defer os.Remove(concatListPath)

	args := []string{
		"-f", "concat",
		"-safe", "0",
		"-i", concatListPath,
		"-c", "copy",
		"-y",
		outputPath,
	}

	ctx := context.Background()
	return e.Execute(ctx, ExecuteOptions{Args: args})
}

// ReplaceIntroWithImage replaces the beginning of a video with an image
func (e *Executor) ReplaceIntroWithImage(videoPath, imagePath, outputPath string, duration float64, onProgress ProgressCallback) error {
	if duration <= 0 {
		return fmt.Errorf("duration must be greater than 0")
	}

	// Get video metadata
	ctx := context.Background()
	metadata, err := e.Probe(ctx, videoPath)
	if err != nil {
		return fmt.Errorf("failed to probe video: %w", err)
	}

	// Parse duration from metadata
	videoDuration, err := strconv.ParseFloat(metadata.Format.Duration, 64)
	if err != nil || videoDuration < duration {
		return fmt.Errorf("video duration is shorter than replacement duration")
	}

	// Get video stream info
	var width, height int
	var fps float64 = 30.0 // default
	for _, stream := range metadata.Streams {
		if stream.CodecType == "video" {
			width = stream.Width
			height = stream.Height
			// Parse frame rate
			if stream.RFrameRate != "" {
				// Parse "30/1" format
				var num, den int
				fmt.Sscanf(stream.RFrameRate, "%d/%d", &num, &den)
				if den > 0 {
					fps = float64(num) / float64(den)
				}
			}
			break
		}
	}

	if width == 0 || height == 0 {
		return fmt.Errorf("could not determine video resolution")
	}

	// Create temp directory for intermediate files
	tempDir := filepath.Join(filepath.Dir(outputPath), "temp_intro_replace")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)

	// Step 1: Create video from image
	introVideoPath := filepath.Join(tempDir, "intro_video.mp4")
	if err := e.CreateVideoFromImage(imagePath, introVideoPath, duration, width, height, fps); err != nil {
		return fmt.Errorf("failed to create video from image: %w", err)
	}
	if onProgress != nil {
		onProgress(20.0)
	}

	// Step 2: Extract audio from original video's intro
	introAudioPath := filepath.Join(tempDir, "intro_audio.aac")
	if err := e.ExtractAudioSegment(videoPath, introAudioPath, duration); err != nil {
		// No audio is okay
		introAudioPath = ""
	}
	if onProgress != nil {
		onProgress(40.0)
	}

	// Step 3: Combine intro video with original audio
	introWithAudioPath := filepath.Join(tempDir, "intro_with_audio.mp4")
	if introAudioPath != "" {
		if err := e.CombineVideoAndAudio(introVideoPath, introAudioPath, introWithAudioPath); err != nil {
			return fmt.Errorf("failed to combine video and audio: %w", err)
		}
	} else {
		introWithAudioPath = introVideoPath
	}
	if onProgress != nil {
		onProgress(60.0)
	}

	// Step 4: Trim original video from start time
	restVideoPath := filepath.Join(tempDir, "rest_video.mp4")
	if err := e.TrimVideoFromStart(videoPath, restVideoPath, duration); err != nil {
		return fmt.Errorf("failed to trim video: %w", err)
	}
	if onProgress != nil {
		onProgress(80.0)
	}

	// Step 5: Concatenate intro + rest
	if err := e.ConcatenateVideos([]string{introWithAudioPath, restVideoPath}, outputPath); err != nil {
		return fmt.Errorf("failed to concatenate videos: %w", err)
	}
	if onProgress != nil {
		onProgress(100.0)
	}

	return nil
}
