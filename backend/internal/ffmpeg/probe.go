package ffmpeg

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"time"

	"go.uber.org/zap"
)

// ProbeResult contains video metadata from FFprobe
type ProbeResult struct {
	Format   Format    `json:"format"`
	Streams  []Stream  `json:"streams"`
	Chapters []Chapter `json:"chapters,omitempty"`
}

// Format contains container format information
type Format struct {
	Filename       string  `json:"filename"`
	FormatName     string  `json:"format_name"`
	FormatLongName string  `json:"format_long_name"`
	Duration       string  `json:"duration"`
	Size           string  `json:"size"`
	BitRate        string  `json:"bit_rate,omitempty"`
	Tags           Tags    `json:"tags,omitempty"`
}

// Stream contains information about a media stream
type Stream struct {
	Index              int     `json:"index"`
	CodecName          string  `json:"codec_name"`
	CodecLongName      string  `json:"codec_long_name"`
	CodecType          string  `json:"codec_type"` // video, audio, subtitle, data
	CodecTagString     string  `json:"codec_tag_string"`
	Width              int     `json:"width,omitempty"`
	Height             int     `json:"height,omitempty"`
	CodedWidth         int     `json:"coded_width,omitempty"`
	CodedHeight        int     `json:"coded_height,omitempty"`
	SampleAspectRatio  string  `json:"sample_aspect_ratio,omitempty"`
	DisplayAspectRatio string  `json:"display_aspect_ratio,omitempty"`
	PixFmt             string  `json:"pix_fmt,omitempty"`
	Level              int     `json:"level,omitempty"`
	ColorRange         string  `json:"color_range,omitempty"`
	ColorSpace         string  `json:"color_space,omitempty"`
	SampleFmt          string  `json:"sample_fmt,omitempty"`
	SampleRate         string  `json:"sample_rate,omitempty"`
	Channels           int     `json:"channels,omitempty"`
	ChannelLayout      string  `json:"channel_layout,omitempty"`
	BitsPerSample      int     `json:"bits_per_sample,omitempty"`
	RFrameRate         string  `json:"r_frame_rate"`
	AvgFrameRate       string  `json:"avg_frame_rate"`
	TimeBase           string  `json:"time_base"`
	StartPts           int64   `json:"start_pts"`
	StartTime          string  `json:"start_time"`
	DurationTs         int64   `json:"duration_ts,omitempty"`
	Duration           string  `json:"duration,omitempty"`
	BitRate            string  `json:"bit_rate,omitempty"`
	NbFrames           string  `json:"nb_frames,omitempty"`
	Disposition        Disposition `json:"disposition"`
	Tags               Tags    `json:"tags,omitempty"`
}

// Disposition contains stream disposition flags
type Disposition struct {
	Default         int `json:"default"`
	Dub             int `json:"dub"`
	Original        int `json:"original"`
	Comment         int `json:"comment"`
	Lyrics          int `json:"lyrics"`
	Karaoke         int `json:"karaoke"`
	Forced          int `json:"forced"`
	HearingImpaired int `json:"hearing_impaired"`
	VisualImpaired  int `json:"visual_impaired"`
	CleanEffects    int `json:"clean_effects"`
	AttachedPic     int `json:"attached_pic"`
	TimedThumbnails int `json:"timed_thumbnails"`
}

// Chapter contains chapter information
type Chapter struct {
	ID        int     `json:"id"`
	TimeBase  string  `json:"time_base"`
	Start     int64   `json:"start"`
	StartTime string  `json:"start_time"`
	End       int64   `json:"end"`
	EndTime   string  `json:"end_time"`
	Tags      Tags    `json:"tags,omitempty"`
}

// Tags contains metadata tags
type Tags map[string]string

// Probe extracts metadata from a media file using FFprobe
func (e *Executor) Probe(ctx context.Context, filePath string) (*ProbeResult, error) {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	args := []string{
		"-v", "quiet",
		"-print_format", "json",
		"-show_format",
		"-show_streams",
		"-show_chapters",
		filePath,
	}

	cmd := exec.CommandContext(ctx, e.ffprobePath, args...)

	e.logger.Info("Executing FFprobe",
		zap.String("file", filePath),
	)

	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("ffprobe failed: %s", string(exitErr.Stderr))
		}
		return nil, fmt.Errorf("ffprobe execution failed: %w", err)
	}

	var result ProbeResult
	if err := json.Unmarshal(output, &result); err != nil {
		return nil, fmt.Errorf("failed to parse ffprobe output: %w", err)
	}

	e.logger.Info("FFprobe completed successfully",
		zap.String("format", result.Format.FormatName),
		zap.Int("streams", len(result.Streams)),
	)

	return &result, nil
}

// GetDuration extracts the duration from probe result in seconds
func (p *ProbeResult) GetDuration() (float64, error) {
	var duration float64
	if _, err := fmt.Sscanf(p.Format.Duration, "%f", &duration); err != nil {
		return 0, fmt.Errorf("failed to parse duration: %w", err)
	}
	return duration, nil
}

// GetVideoStreams returns all video streams
func (p *ProbeResult) GetVideoStreams() []Stream {
	var videos []Stream
	for _, stream := range p.Streams {
		if stream.CodecType == "video" {
			videos = append(videos, stream)
		}
	}
	return videos
}

// GetAudioStreams returns all audio streams
func (p *ProbeResult) GetAudioStreams() []Stream {
	var audios []Stream
	for _, stream := range p.Streams {
		if stream.CodecType == "audio" {
			audios = append(audios, stream)
		}
	}
	return audios
}

// GetSubtitleStreams returns all subtitle streams
func (p *ProbeResult) GetSubtitleStreams() []Stream {
	var subtitles []Stream
	for _, stream := range p.Streams {
		if stream.CodecType == "subtitle" {
			subtitles = append(subtitles, stream)
		}
	}
	return subtitles
}
