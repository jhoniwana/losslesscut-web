#!/bin/bash

# Development script for LosslessCut Web
# Starts both Go backend (with hot reload) and React frontend (with hot reload)

set -e

echo "🚀 Starting LosslessCut Web development environment..."

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down development servers..."
    jobs -p | xargs -r kill
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if required tools are installed
if ! command -v air &> /dev/null; then
    echo "❌ 'air' is not installed. Please install it with: go install github.com/cosmtrek/air@latest"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    echo "❌ 'yarn' is not installed. Please install it first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    yarn install
fi

# Check Go dependencies
echo "📦 Checking Go dependencies..."
cd backend
if [ ! -f "go.mod" ] || [ ! -d "vendor" ]; then
    echo "📦 Installing Go dependencies..."
    go mod download
    go mod tidy
fi

cd ..

# Start Go backend with hot reload
echo "🔧 Starting Go backend with hot reload (port 8080)..."
cd backend
air &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start React frontend with hot reload
echo "⚛️ Starting React frontend with hot reload (port 3001)..."
yarn dev:web &
FRONTEND_PID=$!

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🌐 Frontend: http://localhost:3001"
echo "🔧 Backend API: http://localhost:8080"
echo "📖 API Docs: http://localhost:8080/api/system/info"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for any process to exit
wait