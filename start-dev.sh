#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Install frontend dependencies
echo "Installing frontend dependencies with Yarn..."
yarn install

echo "Building and starting backend server in the background..."
# Run backend in a subshell in the background
(cd backend && make build && make run) &
backend_pid=$!

echo "Backend server started with PID: $backend_pid"
echo "You can stop it later using 'kill $backend_pid'"

# Wait a few seconds for the backend to initialize
sleep 5

echo "Starting frontend development server in the foreground..."
echo "Frontend will be available at http://localhost:3001"
yarn dev:web

# When yarn dev:web is stopped (e.g., with Ctrl+C), kill the backend process
echo "Stopping backend server..."
kill $backend_pid