#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Script Directory: $SCRIPT_DIR"

# Navigate to the ui directory
cd ../../../../ui || { echo "Failed to navigate to ui directory"; exit 1; }

# Print current working directory
echo "Current Directory - $(pwd)"

# Check if package.json exists in the current directory
if [ ! -f "package.json" ]; then
    echo "package.json not found in $(pwd). Exiting."
    exit 1
fi

# Install dependencies
npm install --verbose --include=dev || { echo "npm install failed"; exit 1; }

# Build the React project
echo "Building the UI..."
npm run build || { echo "npm run build failed"; exit 1; }

# Define the destination build directory relative to the script location
BUILD_DEST_DIR="$SCRIPT_DIR/build"

# Create the build destination directory if it doesn't exist
mkdir -p "$BUILD_DEST_DIR"

# Copy the build artifacts to the destination directory
cp -r ./build/* "$BUILD_DEST_DIR" || { echo "Failed to copy build files"; exit 1; }

echo "Build completed successfully."
