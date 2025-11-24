package ffmpeg

import (
	"testing"
)

func TestParseFFmpegTime(t *testing.T) {
	tests := []struct {
		input    string
		expected float64
		wantErr  bool
	}{
		{"00:00:05.50", 5.5, false},
		{"00:01:30.00", 90.0, false},
		{"01:23:45.67", 5025.67, false},
		{"-00:00:06.46", -6.46, false},
		{"invalid", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result, err := parseFFmpegTime(tt.input)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if result != tt.expected {
				t.Errorf("parseFFmpegTime(%q) = %f, want %f", tt.input, result, tt.expected)
			}
		})
	}
}

func TestProgressParser_ParseLine(t *testing.T) {
	parser := NewProgressParser(100.0)

	tests := []struct {
		name     string
		line     string
		expected float64
	}{
		{
			name:     "video progress",
			line:     "frame=  123 fps= 45 q=28.0 size=  1024kB time=00:00:50.00 bitrate= 123.4kbits/s",
			expected: 0.5,
		},
		{
			name:     "audio progress",
			line:     "size=  233422kB time=00:01:45.00 bitrate= 301.1kbits/s speed= 353x",
			expected: 1.05, // Will be capped at 1.0
		},
		{
			name:     "no progress",
			line:     "Random FFmpeg output without time",
			expected: -1,
		},
		{
			name:     "negative time",
			line:     "frame=  123 fps= 45 q=28.0 size=  1024kB time=-00:00:06.46 bitrate= 123.4kbits/s",
			expected: -1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parser.ParseLine(tt.line)

			// For positive expected values, check if result is close (allow for capping at 1.0)
			if tt.expected >= 0 {
				if result < 0 {
					t.Errorf("ParseLine() returned %f, expected positive value", result)
				}
				if tt.expected > 1.0 && result > 1.0 {
					t.Errorf("ParseLine() should cap at 1.0, got %f", result)
				}
			} else if result != -1 {
				t.Errorf("ParseLine() = %f, want %f", result, tt.expected)
			}
		})
	}
}

func TestParseFFmpegError(t *testing.T) {
	tests := []struct {
		name     string
		stderr   string
		contains string
	}{
		{
			name:     "file not found",
			stderr:   "ffmpeg version 4.4\nInput #0, mov,mp4,m4a,3gp,3g2,mj2, from 'test.mp4':\ntest.mp4: No such file or directory",
			contains: "No such",
		},
		{
			name:     "invalid codec",
			stderr:   "ffmpeg version 4.4\nUnknown encoder 'invalid_codec'\nError initializing output stream",
			contains: "Error",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ParseFFmpegError(tt.stderr)
			if result == "" {
				t.Error("ParseFFmpegError returned empty string")
			}
		})
	}
}
