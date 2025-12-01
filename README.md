# LosslessCut Web Edition

Web-based lossless video/audio cutting tool powered by **Go + React + FFmpeg**.

## Features

- Lossless cutting of video and audio files
- Web-based UI - no installation required
- I/O workflow (industry-standard video editing)
- Waveform visualization
- Multi-segment editing with merge/export
- YouTube video download via yt-dlp
- Session management (save/load projects)
- Mobile responsive design

## Tech Stack

- **Backend**: Go, Gin, FFmpeg, yt-dlp
- **Frontend**: React 18, TypeScript, Vite, Framer Motion

## Quick Start

### Prerequisites

- Go 1.21+
- Node.js 18+
- FFmpeg 6.0+
- Yarn 4.x

### Development

```bash
# Terminal 1: Start Go backend
cd backend
make build
make run

# Terminal 2: Start React frontend
yarn install
yarn dev:web
```

Open http://localhost:3001

### Production Build

```bash
# Build frontend (outputs to backend/web/)
yarn build:web

# Build and run Go server
cd backend
make build
./lossless-cut-server
```

Open http://localhost:8080

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/videos/upload` | Upload video/audio file |
| GET | `/api/videos/:id/stream` | Stream video |
| DELETE | `/api/videos/:id` | Delete video |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/export` | Export/cut video |
| GET | `/api/operations/:id` | Check export progress |
| GET | `/api/outputs/:filename` | Download exported file |
| POST | `/api/download` | Download from URL (yt-dlp) |
| GET | `/health` | Health check |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `I` | Set start point |
| `O` | Set end point & create clip |
| `←` | Seek back 1 second |
| `→` | Seek forward 1 second |
| `Shift+←` | Seek back 0.1 second |
| `Shift+→` | Seek forward 0.1 second |

## License

GPL-2.0-only
