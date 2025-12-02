#!/bin/bash

# Integration test script for LosslessCut Web
# Tests all major functionality

set -e

echo "🧪 Running LosslessCut Web Integration Tests"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    echo -n "Testing $name... "
    
    if response=$(curl -s -w "%{http_code}" -o /dev/null "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (HTTP $response, expected $expected_status)"
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Connection failed)"
        return 1
    fi
}

# Test JSON endpoint
test_json_endpoint() {
    local name=$1
    local url=$2
    local field=$3
    
    echo -n "Testing $name... "
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if echo "$response" | jq -e "$field" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ PASS${NC}"
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (Invalid JSON or missing field)"
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Connection failed)"
        return 1
    fi
}

# Start tests
echo ""
echo "🔧 Backend API Tests"
echo "--------------------"

# Test basic endpoints
test_endpoint "Health Check" "http://localhost:8080/health" "200"
test_endpoint "System Info" "http://localhost:8080/api/system/info" "200"
test_json_endpoint "System Info JSON" "http://localhost:8080/api/system/info" ".ffmpeg"

# Test video endpoints
test_endpoint "List Videos" "http://localhost:8080/api/videos" "200"
test_endpoint "List Projects" "http://localhost:8080/api/projects" "200"

echo ""
echo "🌐 Frontend Tests"
echo "------------------"

# Test frontend serving
test_endpoint "Frontend Index" "http://localhost:8080/" "200"
test_endpoint "Frontend Assets" "http://localhost:8080/assets/" "200"

echo ""
echo "📁 File System Tests"
echo "-------------------"

# Check if storage directories exist
if [ -d "/var/losslesscut" ]; then
    echo -e "${GREEN}✓ Storage directory exists${NC}"
else
    echo -e "${RED}✗ Storage directory missing${NC}"
fi

# Check subdirectories
dirs=("uploads" "projects" "outputs" "temp" "downloads" "videos" "waveforms" "screenshots")
for dir in "${dirs[@]}"; do
    if [ -d "/var/losslesscut/$dir" ]; then
        echo -e "  ${GREEN}✓ $dir${NC}"
    else
        echo -e "  ${RED}✗ $dir${NC}"
    fi
done

echo ""
echo "🔧 Tool Availability Tests"
echo "-------------------------"

# Check FFmpeg
if command -v ffmpeg >/dev/null 2>&1; then
    version=$(ffmpeg -version | head -1 | cut -d' ' -f3)
    echo -e "${GREEN}✓ FFmpeg${NC} (version $version)"
else
    echo -e "${RED}✗ FFmpeg${NC} (not found)"
fi

# Check FFprobe
if command -v ffprobe >/dev/null 2>&1; then
    echo -e "${GREEN}✓ FFprobe${NC}"
else
    echo -e "${RED}✗ FFprobe${NC} (not found)"
fi

# Check yt-dlp
if command -v yt-dlp >/dev/null 2>&1; then
    echo -e "${GREEN}✓ yt-dlp${NC}"
else
    echo -e "${YELLOW}⚠ yt-dlp${NC} (not found - downloads will be limited)"
fi

echo ""
echo "📊 Summary"
echo "==========="

# Count total tests (this is a simplified count)
total_tests=15
echo "Integration tests completed!"
echo ""
echo "🚀 To start development:"
echo "   1. Backend: cd backend && make dev"
echo "   2. Frontend: yarn dev:web"
echo "   3. Or use combined script: ./start-dev.sh"
echo ""
echo "🌐 Access URLs:"
echo "   - Frontend: http://localhost:3001 (dev) or http://localhost:8080 (prod)"
echo "   - Backend API: http://localhost:8080"
echo "   - Health: http://localhost:8080/health"
echo ""
echo "📖 For API documentation, see: backend/internal/api/router.go"