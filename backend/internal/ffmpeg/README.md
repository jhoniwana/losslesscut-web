# FFmpeg Package

This package provides a Go wrapper for FFmpeg and FFprobe operations.

## Features

✅ **Implemented:**
- FFmpeg process execution with progress tracking
- Progress parsing from stderr
- FFprobe metadata extraction (JSON parsing)
- Video cutting (lossless `-c copy`)
- Video merging (concat demuxer)
- Format conversion
- Snapshot/thumbnail capture
- Audio extraction
- Context-based cancellation
- Error handling and reporting

## Usage

### Create an Executor

```go
import "github.com/mifi/lossless-cut/backend/internal/ffmpeg"

executor := ffmpeg.NewExecutor("ffmpeg", "ffprobe", logger)
```

### Extract Video Metadata

```go
ctx := context.Background()
probe, err := executor.Probe(ctx, "/path/to/video.mp4")
if err != nil {
    log.Fatal(err)
}

duration, _ := probe.GetDuration()
videoStreams := probe.GetVideoStreams()
audioStreams := probe.GetAudioStreams()
```

### Cut a Video Segment

```go
err := executor.CutVideo(
    ctx,
    "/path/to/input.mp4",
    "/path/to/output.mp4",
    10.5,  // start time in seconds
    30.0,  // end time in seconds
    func(progress float64) {
        fmt.Printf("Progress: %.1f%%\n", progress*100)
    },
)
```

### Merge Multiple Videos

```go
files := []string{
    "/path/to/segment1.mp4",
    "/path/to/segment2.mp4",
    "/path/to/segment3.mp4",
}

err := executor.MergeVideos(
    ctx,
    files,
    "/path/to/merged.mp4",
    120.0, // total duration
    func(progress float64) {
        fmt.Printf("Merging: %.1f%%\n", progress*100)
    },
)
```

### Capture Snapshot

```go
err := executor.CaptureSnapshot(
    ctx,
    "/path/to/video.mp4",
    "/path/to/snapshot.jpg",
    15.0, // timestamp in seconds
    2,    // quality (1-31, lower is better)
)
```

## Progress Parsing

The progress parser extracts progress information from FFmpeg's stderr output:

```go
parser := ffmpeg.NewProgressParser(100.0) // total duration

// Parse FFmpeg output line by line
progress := parser.ParseLine("frame= 123 fps= 45 q=28.0 size= 1024kB time=00:00:50.00 bitrate= 123.4kbits/s")
// Returns: 0.5 (50% progress)
```

## FFprobe Response

The `ProbeResult` contains all metadata from FFprobe:

```go
type ProbeResult struct {
    Format   Format    `json:"format"`
    Streams  []Stream  `json:"streams"`
    Chapters []Chapter `json:"chapters,omitempty"`
}
```

Helper methods:
- `GetDuration()` - Get duration in seconds
- `GetVideoStreams()` - Get all video streams
- `GetAudioStreams()` - Get all audio streams
- `GetSubtitleStreams()` - Get all subtitle streams

## Error Handling

```go
err := executor.CutVideo(ctx, input, output, start, end, nil)
if err != nil {
    // Error messages are parsed from FFmpeg stderr
    // Example: "ffmpeg failed: No such file or directory"
    log.Println("FFmpeg error:", err)
}
```

## Cancellation

All operations support context cancellation:

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
defer cancel()

err := executor.CutVideo(ctx, input, output, start, end, onProgress)
// Will be cancelled after 5 minutes
```

## Testing

Run tests:
```bash
go test ./internal/ffmpeg/...
```

Tests include:
- Progress parsing
- Time format parsing
- Error message extraction

## Implementation Details

### Progress Parsing

The progress parser matches two patterns:

1. **Video progress:**
   ```
   frame=  123 fps= 45 q=28.0 size=  1024kB time=00:00:50.00 bitrate= 123.4kbits/s
   ```

2. **Audio-only progress:**
   ```
   size=  233422kB time=01:45:50.68 bitrate= 301.1kbits/s speed= 353x
   ```

### FFmpeg Commands

**Cut (lossless):**
```bash
ffmpeg -hide_banner -i input.mp4 -ss 10.5 -to 30.0 -c copy -avoid_negative_ts make_zero -y output.mp4
```

**Merge (concat demuxer):**
```bash
# Create concat.txt:
# file 'segment1.mp4'
# file 'segment2.mp4'

ffmpeg -hide_banner -f concat -safe 0 -i concat.txt -c copy -y output.mp4
```

**Probe:**
```bash
ffprobe -v quiet -print_format json -show_format -show_streams -show_chapters input.mp4
```

## Comparison with TypeScript Version

This Go implementation mirrors the TypeScript version in `src/main/ffmpeg.ts`:

| Feature | TypeScript | Go |
|---------|-----------|-----|
| Process execution | `execa` | `os/exec` |
| Progress parsing | Regex on stderr | Regex on stderr (same patterns) |
| FFprobe | JSON parsing | JSON parsing (same structure) |
| Cancellation | AbortController | context.Context |
| Logging | winston | zap |

The command-line arguments and logic are **identical** - only the programming language differs!
