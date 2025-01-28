#!/bin/bash

# Get the directory of the current script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Path to the version.js file
input="$SCRIPT_DIR/../../ui/src/version.js"

# Check if the input file exists
if [[ ! -f "$input" ]]; then
  echo "Error: File $input not found."
  return 1  # Use 'return' instead of 'exit' when sourcing
fi

# Extract the version number using sed
VERSION=$(sed -n "s/export const VERSION = '\([^']*\)';/\1/p" "$input")

# Replace '-' and '+' with '_'
VERSION=${VERSION//-/_}
VERSION=${VERSION//+/_}

# Output the version and export it as an environment variable
echo "VERSION: $VERSION"
export KEYMAKER_VERSION=$VERSION