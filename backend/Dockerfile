# =====================================
# Stage 1: Build Frontend
# =====================================
FROM node:18-bookworm-slim AS frontend-builder

WORKDIR /app

# Enable Corepack for Yarn 4
RUN corepack enable

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install

# Copy source code and configs
COPY src ./src
COPY vite.config.web.ts ./
COPY tsconfig.json ./
COPY tsconfig.*.json ./

# Create output directory
RUN mkdir -p backend/web

# Build frontend for web
ENV VITE_API_URL=http://localhost:9090
RUN yarn build:web

# =====================================
# Stage 2: Build Go Backend
# =====================================
FROM golang:1.21-bookworm AS backend-builder

WORKDIR /app

# Copy Go module files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY backend/ ./

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o lossless-cut-server ./cmd/server

# =====================================
# Stage 3: Runtime Image
# =====================================
FROM debian:bookworm-slim

# Install runtime dependencies including VAAPI for hardware acceleration
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    python3-dev \
    ca-certificates \
    wget \
    fonts-noto-color-emoji \
    fonts-dejavu \
    # Build tools for InsightFace (will be removed after pip install)
    build-essential \
    g++ \
    # Intel VAAPI drivers for hardware-accelerated encoding
    intel-media-va-driver \
    vainfo \
    libva-drm2 \
    libva2 \
    && rm -rf /var/lib/apt/lists/*

# Install essential libraries for video processing and face detection
# - InsightFace: Face detection for blur feature (uses ONNX models)
# - OpenCV: Image processing and blur effects
# - yt-dlp: YouTube video downloads
RUN pip3 install --no-cache-dir --break-system-packages \
    yt-dlp \
    opencv-python-headless \
    numpy \
    Pillow \
    insightface \
    onnxruntime \
    && find /usr/local -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true \
    && find /usr/local -type f -name '*.pyc' -delete \
    && find /usr/local -type f -name '*.pyo' -delete \
    && rm -rf /root/.cache/pip

# Verify essential installations
RUN ffmpeg -version && yt-dlp --version && \
    python3 -c "import cv2; print('OpenCV:', cv2.__version__)" && \
    python3 -c "from PIL import Image; print('Pillow installed')" && \
    python3 -c "import insightface; print('InsightFace:', insightface.__version__)"

# Remove build tools to reduce image size (~500MB savings)
RUN apt-get purge -y --auto-remove \
    build-essential \
    g++ \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1000 losslesscut && \
    useradd -u 1000 -g losslesscut -m losslesscut

# Create directories with proper structure
RUN mkdir -p /var/losslesscut/uploads \
    /var/losslesscut/downloads \
    /var/losslesscut/projects \
    /var/losslesscut/outputs \
    /var/losslesscut/temp \
    /var/losslesscut/videos \
    /var/losslesscut/waveforms \
    /var/losslesscut/screenshots \
    /app/web && \
    chown -R losslesscut:losslesscut /var/losslesscut /app

WORKDIR /app

# Copy Go binary from builder stage
COPY --from=backend-builder /app/lossless-cut-server ./server

# Copy frontend build from stage 1
COPY --from=frontend-builder /app/backend/web ./web

# Copy config
COPY backend/config/config.yaml /etc/losslesscut/config.yaml

# Copy face blur and detection scripts
COPY backend/scripts/blur_faces.py ./scripts/blur_faces.py
COPY backend/scripts/detect_faces.py ./scripts/detect_faces.py

# Make binary and scripts executable
RUN chmod +x ./server ./scripts/blur_faces.py ./scripts/detect_faces.py && chown -R losslesscut:losslesscut ./server ./scripts

# Use non-root user
USER losslesscut

# Expose port
EXPOSE 9091

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9091/health || exit 1

# Set environment variables
ENV LOSSLESSCUT_STORAGE_BASE_PATH=/var/losslesscut

# Run the server
CMD ["./server", "--config", "/etc/losslesscut/config.yaml"]
