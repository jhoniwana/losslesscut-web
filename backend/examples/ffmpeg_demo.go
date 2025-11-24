// +build ignore

package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/mifi/lossless-cut/backend/internal/ffmpeg"
	"go.uber.org/zap"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run ffmpeg_demo.go <video_file>")
		fmt.Println("\nThis demo will:")
		fmt.Println("  1. Probe the video to extract metadata")
		fmt.Println("  2. Cut the first 10 seconds")
		fmt.Println("  3. Capture a snapshot at 5 seconds")
		os.Exit(1)
	}

	inputFile := os.Args[1]

	// Create logger
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	// Create FFmpeg executor
	executor := ffmpeg.NewExecutor("ffmpeg", "ffprobe", logger)

	ctx := context.Background()

	// 1. Probe the video
	fmt.Println("\n=== Probing Video ===")
	probe, err := executor.Probe(ctx, inputFile)
	if err != nil {
		log.Fatal("Failed to probe video:", err)
	}

	duration, _ := probe.GetDuration()
	fmt.Printf("Format: %s\n", probe.Format.FormatName)
	fmt.Printf("Duration: %.2f seconds\n", duration)
	fmt.Printf("Video Streams: %d\n", len(probe.GetVideoStreams()))
	fmt.Printf("Audio Streams: %d\n", len(probe.GetAudioStreams()))

	if len(probe.GetVideoStreams()) > 0 {
		vs := probe.GetVideoStreams()[0]
		fmt.Printf("Video: %s (%dx%d)\n", vs.CodecName, vs.Width, vs.Height)
	}

	if duration < 10 {
		fmt.Println("\nVideo is too short for cutting demo (< 10 seconds)")
		return
	}

	// 2. Cut first 10 seconds
	fmt.Println("\n=== Cutting Video (0-10s) ===")
	outputFile := "demo_cut.mp4"

	progressCallback := func(progress float64) {
		fmt.Printf("\rProgress: %.1f%%", progress*100)
	}

	err = executor.CutVideo(ctx, inputFile, outputFile, 0, 10, progressCallback)
	if err != nil {
		log.Fatal("\nFailed to cut video:", err)
	}

	fmt.Printf("\n✓ Cut saved to: %s\n", outputFile)

	// 3. Capture snapshot
	fmt.Println("\n=== Capturing Snapshot (5s) ===")
	snapshotFile := "demo_snapshot.jpg"

	err = executor.CaptureSnapshot(ctx, inputFile, snapshotFile, 5.0, 2)
	if err != nil {
		log.Fatal("Failed to capture snapshot:", err)
	}

	fmt.Printf("✓ Snapshot saved to: %s\n", snapshotFile)

	fmt.Println("\n=== Demo Complete! ===")
	fmt.Println("Generated files:")
	fmt.Printf("  - %s (10 second cut)\n", outputFile)
	fmt.Printf("  - %s (snapshot at 5s)\n", snapshotFile)
}
