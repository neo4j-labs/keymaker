#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Script Directory: $SCRIPT_DIR"

# Navigate to the admin-api directory
cd ../../../../engine-api

# Print current working directory
echo "Current Directory - $(pwd)"

# Install dependencies
npm install || { echo "npm install failed"; exit 1; }

# Build the project
npm run build || { echo "npm run build failed"; exit 1; }

# Define the destination build directory relative to the script location
BUILD_DEST_DIR="$SCRIPT_DIR/build"

# Create the build destination directory if it doesn't exist
mkdir -p "$BUILD_DEST_DIR"

# Copy necessary files to the build directory
cp -r ./dist/*  "$BUILD_DEST_DIR" || { echo "Copying files failed"; exit 1; }

cp -r ./package.json ./node_modules "$SCRIPT_DIR" || { echo "Copying files failed"; exit 1; }

echo "Build completed successfully."
