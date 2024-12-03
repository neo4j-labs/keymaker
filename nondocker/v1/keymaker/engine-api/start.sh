#!/bin/bash

# Check if .env file exists and source it
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Script Directory: $SCRIPT_DIR"

# Navigate to the build directory and start the server
npm run serve