#!/bin/bash

# LosslessCut Web Auto-Restart Script
# Automatically restarts both backend and frontend services
# Usage: ./auto-restart.sh [options]
# Options:
#   --frontend-only    Restart only frontend
#   --backend-only     Restart only backend
#   --watch           Watch for changes and auto-restart
#   --no-build        Skip build step (faster restart)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="/root/losslesscut-web/backend"
FRONTEND_DIR="/root/losslesscut-web"
BACKEND_PID_FILE="/tmp/losslesscut-backend.pid"
FRONTEND_PID_FILE="/tmp/losslesscut-frontend.pid"
LOG_DIR="/root/losslesscut-web/logs"

# Create logs directory
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Get current PIDs
get_pids() {
    BACKEND_PID=$(cat "$BACKEND_PID_FILE" 2>/dev/null || echo "")
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE" 2>/dev/null || echo "")
}

# Kill existing processes
kill_processes() {
    log "Stopping existing processes..."
    
    # Kill by PID files first
    if [ ! -z "$BACKEND_PID" ]; then
        if ps -p "$BACKEND_PID" > /dev/null; then
            kill "$BACKEND_PID" 2>/dev/null || true
            log "Stopped backend (PID: $BACKEND_PID)"
        fi
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        if ps -p "$FRONTEND_PID" > /dev/null; then
            kill "$FRONTEND_PID" 2>/dev/null || true
            log "Stopped frontend (PID: $FRONTEND_PID)"
        fi
    fi
    
    # Force kill any remaining processes by pattern matching
    pkill -f "yarn.*dev:web" 2>/dev/null || true
    pkill -f "vite.*--config.*vite.config.web.ts" 2>/dev/null || true
    pkill -f "./server" 2>/dev/null || true
    pkill -f "./lossless-cut-server" 2>/dev/null || true
    
    # Wait for processes to die
    sleep 3
    
    # Clean up PID files
    rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"
}

# Build backend
build_backend() {
    if [ "$1" != "--no-build" ]; then
        log "Building backend..."
        cd "$BACKEND_DIR"
        if make build > "$LOG_DIR/backend-build.log" 2>&1; then
            log "✅ Backend build successful"
        else
            error "❌ Backend build failed. Check $LOG_DIR/backend-build.log"
            return 1
        fi
    fi
}

# Start backend
start_backend() {
    log "Starting backend server..."
    cd "$BACKEND_DIR"
    
    # Ensure no existing backend processes
    pkill -f "./server" 2>/dev/null || true
    pkill -f "./lossless-cut-server" 2>/dev/null || true
    sleep 1
    
    # Build first
    if ! make build > "$LOG_DIR/backend-build.log" 2>&1; then
        error "❌ Backend build failed. Check $LOG_DIR/backend-build.log"
        return 1
    fi
    
    # Start the server
    nohup ./server > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo "$BACKEND_PID" > "$BACKEND_PID_FILE"
    log "✅ Backend started (PID: $BACKEND_PID)"
}

# Start frontend
start_frontend() {
    log "Starting frontend dev server..."
    cd "$FRONTEND_DIR"
    
    # Ensure no existing frontend processes
    pkill -f "yarn.*dev:web" 2>/dev/null || true
    pkill -f "vite.*--config.*vite.config.web.ts" 2>/dev/null || true
    sleep 1
    
    # Start the frontend
    nohup yarn dev:web > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"
    log "✅ Frontend started (PID: $FRONTEND_PID)"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Check backend
    for i in {1..10}; do
        if curl -s http://localhost:8080/api/system/info > /dev/null 2>&1; then
            log "✅ Backend is healthy (attempt $i)"
            break
        else
            warning "Backend health check attempt $i failed"
            if [ $i -eq 10 ]; then
                error "❌ Backend health check failed after 10 attempts"
                return 1
            fi
        fi
        sleep 2
    done
    
    # Check frontend
    for i in {1..10}; do
        if curl -s http://localhost:3001/ > /dev/null 2>&1; then
            log "✅ Frontend is healthy (attempt $i)"
            break
        else
            warning "Frontend health check attempt $i failed"
            if [ $i -eq 10 ]; then
                error "❌ Frontend health check failed after 10 attempts"
                return 1
            fi
        fi
        sleep 2
    done
    
    log "🎉 All services are healthy!"
}

# Watch mode
watch_mode() {
    log "Starting watch mode (auto-restart on changes)..."
    
    while true; do
        # Watch backend files
        inotifywait -r -e modify,create,delete "$BACKEND_DIR/internal" 2>/dev/null
        if [ $? -eq 0 ]; then
            log "🔄 Backend changes detected, restarting..."
            restart_backend_only
        fi
        
        # Watch frontend files (excluding node_modules)
        inotifywait -r -e modify,create,delete "$FRONTEND_DIR/src" --exclude "/node_modules/" 2>/dev/null
        if [ $? -eq 0 ]; then
            log "🔄 Frontend changes detected, restarting..."
            restart_frontend_only
        fi
        
        sleep 5
    done
}

# Restart functions
restart_all() {
    log "🔄 Restarting all services..."
    kill_processes
    sleep 2
    build_backend
    start_backend
    start_frontend
    health_check
}

restart_backend_only() {
    log "🔄 Restarting backend only..."
    kill_processes
    sleep 2
    build_backend
    start_backend
    health_check
}

restart_frontend_only() {
    log "🔄 Restarting frontend only..."
    kill_processes
    sleep 2
    start_frontend
    health_check
}

# Show status
show_status() {
    get_pids
    
    echo "=== LosslessCut Web Status ==="
    echo "Backend PID: ${BACKEND_PID:-Not running}"
    echo "Frontend PID: ${FRONTEND_PID:-Not running}"
    echo ""
    
    if [ ! -z "$BACKEND_PID" ] && ps -p "$BACKEND_PID" > /dev/null; then
        echo "✅ Backend: Running"
        curl -s http://localhost:8080/api/system/info > /dev/null && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Unhealthy"
    else
        echo "❌ Backend: Not running"
    fi
    
    if [ ! -z "$FRONTEND_PID" ] && ps -p "$FRONTEND_PID" > /dev/null; then
        echo "✅ Frontend: Running"
        curl -s http://localhost:3001/ > /dev/null && echo "   Health: ✅ Healthy" || echo "   Health: ❌ Unhealthy"
    else
        echo "❌ Frontend: Not running"
    fi
    
    echo "=========================="
}

# Show logs
show_logs() {
    echo "=== Recent Logs ==="
    echo ""
    echo "📊 Backend Log (last 20 lines):"
    tail -20 "$LOG_DIR/backend.log" 2>/dev/null || echo "No backend log found"
    echo ""
    echo "🌐 Frontend Log (last 20 lines):"
    tail -20 "$LOG_DIR/frontend.log" 2>/dev/null || echo "No frontend log found"
    echo "=========================="
}

# Cleanup function
cleanup() {
    log "Cleaning up..."
    kill_processes
    rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"
    exit 0
}

# Setup signal handlers
trap cleanup SIGINT SIGTERM

# Main script logic
main() {
    case "${1:-restart}" in
        "restart")
            restart_all
            ;;
        "start")
            get_pids
            if [ -z "$BACKEND_PID" ] || ! ps -p "$BACKEND_PID" > /dev/null; then
                start_backend
            else
                log "Backend is already running"
            fi
            
            if [ -z "$FRONTEND_PID" ] || ! ps -p "$FRONTEND_PID" > /dev/null; then
                start_frontend
            else
                log "Frontend is already running"
            fi
            
            health_check
            ;;
        "stop")
            log "Stopping all services..."
            kill_processes
            rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "watch")
            watch_mode
            ;;
        "frontend-only")
            restart_frontend_only
            ;;
        "backend-only")
            restart_backend_only
            ;;
        "--help"|"-h")
            echo "LosslessCut Web Auto-Restart Script"
            echo ""
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  restart         Restart all services (default)"
            echo "  start           Start services if not running"
            echo "  stop            Stop all services"
            echo "  status          Show current status"
            echo "  logs            Show recent logs"
            echo "  watch           Watch for changes and auto-restart"
            echo "  frontend-only   Restart only frontend"
            echo "  backend-only    Restart only backend"
            echo ""
            echo "Options:"
            echo "  --no-build      Skip build step for faster restart"
            echo ""
            echo "Examples:"
            echo "  $0 restart                    # Restart all services"
            echo "  $0 restart --no-build          # Restart without rebuilding"
            echo "  $0 status                     # Show current status"
            echo "  $0 logs                       # Show logs"
            echo "  $0 watch                      # Watch mode"
            echo ""
            exit 0
            ;;
        *)
            restart_all
            ;;
    esac
}

# Check dependencies
if ! command -v inotifywait > /dev/null 2>&1; then
    warning "inotifywait not found. Install with: sudo apt-get install inotify-tools"
    warning "Watch mode will not be available"
fi

# Run main function with all arguments
main "$@"