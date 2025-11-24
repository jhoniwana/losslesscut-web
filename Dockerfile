# =====================================
# Stage 1: Build Frontend (React/Vite)
# =====================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install --immutable

# Copy frontend source
COPY src/renderer ./src/renderer
COPY src/common ./src/common
COPY locales ./locales
COPY index.html ./
COPY vite.config.web.ts ./
COPY tsconfig.json ./
COPY tsconfig.web.json ./

# Build frontend for web
ENV NODE_ENV=production
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
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o server ./cmd/server

# =====================================
# Stage 3: Final Runtime Image
# =====================================
FROM alpine:latest

LABEL maintainer="LosslessCut Web"
LABEL description="Self-hosted web version of LosslessCut with Go backend"

# Install runtime dependencies
RUN apk add --no-cache \
    ffmpeg \
    ffmpeg-libs \
    python3 \
    py3-pip \
    ca-certificates \
    wget

# Install yt-dlp
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

# Verify installations
RUN ffmpeg -version && \
    ffprobe -version && \
    yt-dlp --version

# Create non-root user
RUN addgroup -g 1000 losslesscut && \
    adduser -D -u 1000 -G losslesscut losslesscut

# Create directories
RUN mkdir -p /var/losslesscut/uploads \
             /var/losslesscut/projects \
             /var/losslesscut/outputs \
             /var/losslesscut/temp \
             /app/web && \
    chown -R losslesscut:losslesscut /var/losslesscut /app

WORKDIR /app

# Copy Go backend binary
COPY --from=backend-builder --chown=losslesscut:losslesscut /app/server ./server

# Copy frontend build
COPY --from=frontend-builder --chown=losslesscut:losslesscut /app/dist ./web

# Copy config
COPY --chown=losslesscut:losslesscut backend/config/config.yaml /etc/losslesscut/config.yaml

# Use non-root user
USER losslesscut

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Set environment variables
ENV LOSSLESSCUT_STORAGE_BASE_PATH=/var/losslesscut \
    LOSSLESSCUT_SERVER_HOST=0.0.0.0 \
    LOSSLESSCUT_SERVER_PORT=8080

# Run the server
CMD ["./server"]
