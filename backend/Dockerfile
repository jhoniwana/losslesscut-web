# =====================================
# Stage 1: Build Frontend (React/Vite)
# =====================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY src ./src
COPY public ./public
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig.json ./
COPY tsconfig.*.json ./
COPY electron.vite.config.ts ./

# Build frontend for web (not Electron)
# This builds the renderer as a standalone web app
ENV VITE_API_URL=http://localhost:8080
RUN yarn build:web

# =====================================
# Stage 2: Build Backend (Go)
# =====================================
FROM golang:1.21-alpine AS backend-builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy backend source
COPY backend/ ./

# Build the Go server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server ./cmd/server

# =====================================
# Stage 3: Final Runtime Image
# =====================================
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    ffmpeg-libs \
    python3 \
    py3-pip \
    ca-certificates

# Install yt-dlp
RUN pip3 install --no-cache-dir yt-dlp

# Verify installations
RUN ffmpeg -version && yt-dlp --version

# Create non-root user
RUN addgroup -g 1000 losslesscut && \
    adduser -D -u 1000 -G losslesscut losslesscut

# Create directories
RUN mkdir -p /var/losslesscut /app/web && \
    chown -R losslesscut:losslesscut /var/losslesscut /app

WORKDIR /app

# Copy Go backend binary
COPY --from=backend-builder /app/server ./server

# Copy frontend build
COPY --from=frontend-builder /app/dist ./web

# Copy config
COPY backend/config/config.yaml /etc/losslesscut/config.yaml

# Use non-root user
USER losslesscut

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Set environment variables
ENV LOSSLESSCUT_STORAGE_BASE_PATH=/var/losslesscut

# Run the server
CMD ["./server", "--config", "/etc/losslesscut/config.yaml"]
