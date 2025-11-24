package ffmpeg

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// ProgressParser parses FFmpeg stderr output for progress information
type ProgressParser struct {
	duration float64
}

// NewProgressParser creates a new progress parser
func NewProgressParser(duration float64) *ProgressParser {
	return &ProgressParser{
		duration: duration,
	}
}

// ParseLine parses a single line of FFmpeg output and returns progress (0-1)
// Returns -1 if line doesn't contain progress information
func (p *ProgressParser) ParseLine(line string) float64 {
	// Match video progress: "frame=  123 fps= 45 q=28.0 size=  1024kB time=00:01:23.45 bitrate= 123.4kbits/s"
	videoPattern := regexp.MustCompile(`frame=\s*\S+\s+fps=\s*\S+\s+q=\s*\S+\s+(?:size|Lsize)=\s*\S+\s+time=\s*(\S+)\s+`)
	matches := videoPattern.FindStringSubmatch(line)

	if len(matches) == 0 {
		// Match audio-only progress: "size=  233422kB time=01:45:50.68 bitrate= 301.1kbits/s"
		audioPattern := regexp.MustCompile(`(?:size|Lsize)=\s*\S+\s+time=\s*(\S+)\s+`)
		matches = audioPattern.FindStringSubmatch(line)
	}

	if len(matches) < 2 {
		return -1 // No progress found
	}

	timeStr := matches[1]
	currentTime, err := parseFFmpegTime(timeStr)
	if err != nil {
		return -1
	}

	// Handle negative time (sometimes FFmpeg outputs this)
	if currentTime < 0 {
		return -1
	}

	// Calculate progress
	if p.duration <= 0 {
		return -1
	}

	progress := currentTime / p.duration
	if progress > 1 {
		progress = 1
	}

	return progress
}

// parseFFmpegTime parses FFmpeg time format (HH:MM:SS.MS) to seconds
func parseFFmpegTime(timeStr string) (float64, error) {
	// Match format: [-]HH:MM:SS.MS
	pattern := regexp.MustCompile(`^(-?)(\d+):(\d+):(\d+)\.(\d+)$`)
	matches := pattern.FindStringSubmatch(timeStr)

	if len(matches) != 6 {
		return 0, fmt.Errorf("invalid time format: %s", timeStr)
	}

	sign := matches[1]
	hours, _ := strconv.Atoi(matches[2])
	minutes, _ := strconv.Atoi(matches[3])
	seconds, _ := strconv.Atoi(matches[4])
	centiseconds, _ := strconv.Atoi(matches[5])

	totalSeconds := float64(hours*3600 + minutes*60 + seconds) + float64(centiseconds)/100.0

	if sign == "-" {
		totalSeconds = -totalSeconds
	}

	return totalSeconds, nil
}

// ParseFFmpegError extracts error message from FFmpeg stderr output
func ParseFFmpegError(stderr string) string {
	// Look for common FFmpeg error patterns
	lines := strings.Split(stderr, "\n")

	for i := len(lines) - 1; i >= 0; i-- {
		line := strings.TrimSpace(lines[i])

		// Look for error indicators
		if strings.Contains(line, "error") ||
		   strings.Contains(line, "Error") ||
		   strings.Contains(line, "Invalid") ||
		   strings.Contains(line, "failed") ||
		   strings.Contains(line, "No such") {
			return line
		}
	}

	// If no specific error found, return last non-empty line
	for i := len(lines) - 1; i >= 0; i-- {
		line := strings.TrimSpace(lines[i])
		if line != "" {
			return line
		}
	}

	return "Unknown FFmpeg error"
}
