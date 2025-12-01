# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LosslessCut Web Edition - A Go backend + React frontend for lossless video/audio editing using FFmpeg.

## Features

- Lossless cutting of video and audio files
- Web-based UI with dark theme
- I/O workflow (industry-standard video editing)
- Waveform visualization
- Multi-segment editing with merge/export
- YouTube video download via yt-dlp
- Session management (save/load projects)
- Mobile responsive design with touch support
- Keyboard shortcuts for efficient editing

## Build & Development Commands

### Web Frontend
```bash
yarn install                    # Install dependencies
yarn dev:web                    # Start web dev server (port 3001, proxies to Go backend)
yarn build:web                  # Build web frontend to backend/web/
yarn tsc                        # TypeScript type checking
yarn test                       # Run Vitest tests
yarn lint                       # ESLint
```

### Go Backend (in backend/ directory)
```bash
cd backend
make build                      # Build Go server
make run                        # Run server (port 8080)
make dev                        # Run with hot reload (requires air)
make test                       # Run Go tests
make lint                       # golangci-lint
make fmt                        # Format Go code
```

### Full Stack Development
```bash
# Terminal 1: Start Go backend
cd backend && make dev

# Terminal 2: Start React frontend
yarn dev:web
```

### Production
```bash
yarn build:web                  # Build frontend to backend/web/
cd backend && make build        # Build Go binary
./lossless-cut-server           # Run on port 8080
```

## Architecture

### Web Frontend Structure
```
src/renderer/src/
├── App.web.tsx        # Web entry point
├── App.tsx            # Root component
├── hooks/             # Custom hooks (useFfmpegOperations, useWaveform, etc.)
├── components/
│   ├── VideoEditor.tsx    # Main editor component with I/O workflow
│   ├── DownloadModal.tsx  # YouTube/URL download modal
│   └── ...
└── contexts/          # React contexts
```

### Go Backend Structure
```
backend/
├── cmd/server/        # Entry point (main.go)
└── internal/
    ├── api/           # HTTP handlers (Gin framework)
    │   ├── handlers/  # Request handlers (video.go, project.go, system.go)
    │   ├── middleware/# Logging middleware
    │   └── router.go  # Route definitions
    ├── ffmpeg/        # FFmpeg wrapper - video/audio processing
    │   ├── executor.go # FFmpeg command execution
    │   ├── probe.go   # FFprobe metadata extraction
    │   └── progress.go # Progress parsing
    ├── services/      # Business logic
    │   ├── video_service.go
    │   ├── project_service.go
    │   ├── operation_service.go
    │   └── download_service.go  # yt-dlp integration
    ├── storage/       # File storage management
    └── config/        # Configuration (Viper)
```

### Key Patterns
- **Segments**: Core data model for editing - represent time ranges with start/end times
- **I/O Workflow**: Press I to set start point, O to set end point and create clip
- **FFmpeg Integration**: Command-line wrapper in Go, lossless cutting with `-c copy`
- **HTTP Range Requests**: Required for video seeking in browser
- **State**: React hooks + useState for state management

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `I` | Set start point (In) |
| `O` | Set end point & create clip (Out) |
| `←` | Seek back 1 second |
| `→` | Seek forward 1 second |
| `Shift+←` | Seek back 0.1 second |
| `Shift+→` | Seek forward 0.1 second |

## Supported Formats

The backend supports all FFmpeg-compatible formats including:
- **Video**: MP4, MOV, MKV, WebM, AVI, WMV, FLV, M4V, 3GP
- **Audio**: MP3, AAC, WAV, FLAC, OGG, M4A
- **Container detection**: Uses FFprobe for automatic format detection

## API Endpoints

```
POST   /api/videos/upload       Upload video/audio files
GET    /api/videos/:id/stream   Stream video with range request support
DELETE /api/videos/:id          Delete video

POST   /api/projects            Create project
GET    /api/projects            List projects
GET    /api/projects/:id        Get project
PUT    /api/projects/:id        Update project
DELETE /api/projects/:id        Delete project
POST   /api/projects/:id/export Export/cut video

GET    /api/operations/:id      Check export progress
GET    /api/outputs/:filename   Download exported file

POST   /api/download            Download from URL (yt-dlp)
GET    /api/download/:id/status Check download progress

GET    /health                  Health check
GET    /api/system/info         System info (FFmpeg version, etc.)
```

## Build Configuration

- **vite.config.web.ts**: Web edition config (outputs to `backend/web/`, proxies API to :8080)
- **tsconfig.web.json**: TypeScript config for web frontend
- Uses Yarn 4.11.0 with lockfile

## Key Technologies

**Frontend**: React 18, TypeScript, Vite, Framer Motion, react-icons
**Backend**: Go, Gin, Zap (logging), Viper (config)
**Processing**: FFmpeg, yt-dlp
**Testing**: Vitest (frontend), Go testing (backend)

## Performance Notes

- Use `-ss` before `-i` for fast seeking (input seeking)
- Use `-c copy` for lossless operations (no re-encoding)
- Use `-movflags +faststart` for web-optimized MP4
- HTTP range requests enable video seeking without full download
- requestAnimationFrame for smooth playback time updates
