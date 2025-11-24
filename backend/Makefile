.PHONY: build run dev test lint fmt tidy clean install-tools

# Binary name
BINARY=server
MAIN_PATH=./cmd/server

# Build the application
build:
	@echo "Building..."
	@go build -o $(BINARY) $(MAIN_PATH)

# Run the application
run: build
	@echo "Running..."
	@./$(BINARY)

# Run with hot reload (requires air: go install github.com/cosmtrek/air@latest)
dev:
	@echo "Running with hot reload..."
	@air

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html

# Run linter (requires golangci-lint)
lint:
	@echo "Running linter..."
	@golangci-lint run

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# Tidy dependencies
tidy:
	@echo "Tidying dependencies..."
	@go mod tidy

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -f $(BINARY)
	@rm -f coverage.out coverage.html

# Install development tools
install-tools:
	@echo "Installing development tools..."
	@go install github.com/cosmtrek/air@latest
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Docker build
docker-build:
	@echo "Building Docker image..."
	@docker build -t losslesscut-server:latest .

# Docker run
docker-run:
	@echo "Running Docker container..."
	@docker run -p 8080:8080 -v $(shell pwd)/data:/var/losslesscut losslesscut-server:latest
