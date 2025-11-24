# LosslessCut Web Backend

Go-based backend server for LosslessCut web application.

## Features

- RESTful API for video editing operations
- FFmpeg integration for lossless video processing
- yt-dlp integration for video downloads
- WebSocket support for real-time progress updates
- Project and segment management
- File upload and storage

## Prerequisites

- Go 1.21 or higher
- FFmpeg (installed and in PATH)
- yt-dlp (optional, for download feature)

## Installation

```bash
# Install dependencies
go mod download

# Build the server
go build -o server ./cmd/server

# Or use Make
make build
```

## Configuration

Create a `config.yaml` file (or use environment variables):

```yaml
server:
  host: 0.0.0.0
  port: 8080
  max_upload_size: 10737418240  # 10GB

storage:
  base_path: /var/losslesscut
  auto_cleanup: true
  cleanup_after_days: 7

ffmpeg:
  path: ffmpeg
  threads: 0  # 0 = auto

ytdlp:
  path: yt-dlp
  max_quality: 1080p
```

Environment variables (prefix with `LOSSLESSCUT_`):
```bash
export LOSSLESSCUT_SERVER_PORT=8080
export LOSSLESSCUT_STORAGE_BASE_PATH=/tmp/losslesscut
```

## Running

```bash
# Run with default config
./server

# Run with custom config
./server --config /path/to/config.yaml

# Run in development mode
make run

# Run with hot reload (requires air)
make dev
```

## Development

```bash
# Install development tools
make install-tools

# Run tests
make test

# Run linter
make lint

# Format code
make fmt

# Generate go.sum
make tidy
```

## API Documentation

### Health Check
```bash
curl http://localhost:8080/health
```

### System Info
```bash
curl http://localhost:8080/api/system/info
```

### Create Project
```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project", "video_id": "video123"}'
```

### Upload Video
```bash
curl -X POST http://localhost:8080/api/videos/upload \
  -F "file=@/path/to/video.mp4"
```

### Download from URL (yt-dlp)
```bash
curl -X POST http://localhost:8080/api/videos/download \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=..."}'
```

## Project Structure

```
backend/
├── cmd/
│   └── server/          # Main entry point
├── internal/
│   ├── api/             # HTTP handlers and routing
│   ├── ffmpeg/          # FFmpeg wrapper
│   ├── ytdlp/           # yt-dlp wrapper
│   ├── storage/         # File storage
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   ├── websocket/       # WebSocket handlers
│   └── config/          # Configuration
├── config/              # Config files
└── Dockerfile
```

## Docker

```bash
# Build Docker image
docker build -t losslesscut-server .

# Run with Docker
docker run -p 8080:8080 \
  -v $(pwd)/data:/var/losslesscut \
  losslesscut-server

# Or use Docker Compose
docker-compose up
```

## Next Steps

### TODO (Not Yet Implemented)

- [ ] FFmpeg wrapper implementation
- [ ] yt-dlp integration
- [ ] WebSocket progress updates
- [ ] FFprobe metadata extraction
- [ ] Video streaming with HTTP range requests
- [ ] Operation queue and background processing
- [ ] User authentication (optional)
- [ ] Rate limiting
- [ ] File cleanup and retention policies

## License

GPL-2.0-only (same as LosslessCut)
