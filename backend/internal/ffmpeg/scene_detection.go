package ffmpeg

import (
	"context"
	"fmt"
	"os/exec"
	"strconv"
	"strings"

	"go.uber.org/zap"
)

// Scene represents a detected scene
type Scene struct {
	Start      float64 `json:"start"`
	End        float64 `json:"end"`
	Duration   float64 `json:"duration"`
	Type       string  `json:"type"` // "cut", "black", "silent", "keyframe"
	Confidence float64 `json:"confidence,omitempty"`
}

// SceneDetectionOptions contains options for scene detection
type SceneDetectionOptions struct {
	MinSceneLength float64 `json:"min_scene_length"` // Minimum scene length in seconds
	Threshold      float64 `json:"threshold"`        // Detection threshold (0.0-1.0)
	Mode           string  `json:"mode"`             // "all", "black", "silent", "keyframe"
}

// DetectScenes detects scenes in a video using FFmpeg
func (e *Executor) DetectScenes(ctx context.Context, input string, opts SceneDetectionOptions) ([]Scene, error) {
	args := []string{
		"-hide_banner",
		"-i", input,
		"-vf", fmt.Sprintf("select='gt(scene,%f)+gt(scene,%f)'", opts.Threshold, opts.Threshold),
		"-f", "null",
		"-showframes",
	}

	// Add scene length filter if specified
	if opts.MinSceneLength > 0 {
		filter := fmt.Sprintf("select='gt(scene,%f)+gt(scene,%f),if(gt(t\\-prev_t,t),lt(t\\-prev_t+%f),st)'", opts.Threshold, opts.Threshold, opts.MinSceneLength)
		args = append(args[:len(args)-1], "-vf", filter)
	}

	cmd := exec.CommandContext(ctx, e.ffmpegPath, args...)

	e.logger.Info("Detecting scenes",
		zap.String("input", input),
		zap.Float64("threshold", opts.Threshold),
		zap.String("mode", opts.Mode),
	)

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to detect scenes: %w", err)
	}

	// Parse scene changes from FFmpeg output
	scenes := parseSceneOutput(string(output))

	e.logger.Info("Scene detection completed",
		zap.Int("scenes_found", len(scenes)),
	)

	return scenes, nil
}

// DetectBlackScenes detects black frames in video
func (e *Executor) DetectBlackScenes(ctx context.Context, input string, minDuration float64) ([]Scene, error) {
	args := []string{
		"-hide_banner",
		"-i", input,
		"-vf", fmt.Sprintf("blackdetect=d=%f:pix_sat=0.00", minDuration),
		"-f", "null",
		"-showframes",
	}

	cmd := exec.CommandContext(ctx, e.ffmpegPath, args...)
	e.logger.Info("Detecting black scenes", zap.String("input", input))

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to detect black scenes: %w", err)
	}

	scenes := parseBlackSceneOutput(string(output))

	e.logger.Info("Black scene detection completed",
		zap.Int("scenes_found", len(scenes)),
	)

	return scenes, nil
}

// DetectSilentScenes detects silent portions in audio
func (e *Executor) DetectSilentScenes(ctx context.Context, input string, minDuration float64) ([]Scene, error) {
	args := []string{
		"-hide_banner",
		"-i", input,
		"-af", "silencedetect=noise=-30dB:duration=1",
		"-f", "null",
	}

	cmd := exec.CommandContext(ctx, e.ffmpegPath, args...)
	e.logger.Info("Detecting silent scenes", zap.String("input", input))

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to detect silent scenes: %w", err)
	}

	scenes := parseSilentSceneOutput(string(output))

	e.logger.Info("Silent scene detection completed",
		zap.Int("scenes_found", len(scenes)),
	)

	return scenes, nil
}

// GetKeyframes extracts keyframe information from video
func (e *Executor) GetKeyframes(ctx context.Context, input string) ([]float64, error) {
	args := []string{
		"-hide_banner",
		"-select_streams", "v:0",
		"-show_frames",
		"-show_entries", "frame=pkt_pts_time,key_frame",
		"-of", "csv=p=0",
		input,
	}

	cmd := exec.CommandContext(ctx, e.ffprobePath, args...)
	e.logger.Info("Extracting keyframes", zap.String("input", input))

	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to extract keyframes: %w", err)
	}

	keyframes := parseKeyframeOutput(string(output))

	e.logger.Info("Keyframe extraction completed",
		zap.Int("keyframes_found", len(keyframes)),
	)

	return keyframes, nil
}

// parseSceneOutput parses FFmpeg scene detection output
func parseSceneOutput(output string) []Scene {
	var scenes []Scene
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		if strings.Contains(line, "scene:") {
			// Parse scene information from FFmpeg log
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				start, err1 := strconv.ParseFloat(parts[1], 64)
				if err1 == nil {
					end, err2 := strconv.ParseFloat(parts[3], 64)
					if err2 == nil {
						scenes = append(scenes, Scene{
							Start:      start,
							End:        end,
							Duration:   end - start,
							Type:       "cut",
							Confidence: 0.8, // Default confidence
						})
					}
				}
			}
		}
	}

	return scenes
}

// parseBlackSceneOutput parses blackdetect output
func parseBlackSceneOutput(output string) []Scene {
	var scenes []Scene
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		if strings.Contains(line, "black_start:") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				if start, err := strconv.ParseFloat(parts[1], 64); err == nil {
					scenes = append(scenes, Scene{
						Start:      start,
						Type:       "black",
						Confidence: 0.9,
					})
				}
			}
		} else if strings.Contains(line, "black_end:") {
			if len(scenes) > 0 {
				parts := strings.Fields(line)
				if len(parts) >= 2 {
					if end, err := strconv.ParseFloat(parts[1], 64); err == nil {
						scenes[len(scenes)-1].End = end
						scenes[len(scenes)-1].Duration = end - scenes[len(scenes)-1].Start
					}
				}
			}
		}
	}

	return scenes
}

// parseSilentSceneOutput parses silencedetect output
func parseSilentSceneOutput(output string) []Scene {
	var scenes []Scene
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		if strings.Contains(line, "silence_start:") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				if start, err := strconv.ParseFloat(parts[1], 64); err == nil {
					scenes = append(scenes, Scene{
						Start:      start,
						Type:       "silent",
						Confidence: 0.8,
					})
				}
			}
		} else if strings.Contains(line, "silence_end:") {
			if len(scenes) > 0 {
				parts := strings.Fields(line)
				if len(parts) >= 2 {
					if end, err := strconv.ParseFloat(parts[1], 64); err == nil {
						scenes[len(scenes)-1].End = end
						scenes[len(scenes)-1].Duration = end - scenes[len(scenes)-1].Start
					}
				}
			}
		}
	}

	return scenes
}

// parseKeyframeOutput parses keyframe CSV output
func parseKeyframeOutput(output string) []float64 {
	var keyframes []float64
	lines := strings.Split(output, "\n")

	for _, line := range lines {
		if strings.Contains(line, ",1,") { // key_frame = 1
			parts := strings.Split(line, ",")
			if len(parts) >= 1 {
				if time, err := strconv.ParseFloat(parts[0], 64); err == nil {
					keyframes = append(keyframes, time)
				}
			}
		}
	}

	return keyframes
}
