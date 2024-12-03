#!/bin/bash
sudo nginx
# Check if nginx is installed
if ! command -v nginx &> /dev/null
then
    echo "NGINX could not be found. Please install NGINX to proceed."
    exit 1
fi

# Copy nginx configuration
echo "Setting up NGINX..."
# sudo cp ./nginx.conf /usr/local/etc/nginx/nginx.conf || { echo "Failed to copy nginx.conf"; exit 1; }
# sudo cp ./nginx.conf /opt/homebrew/etc/nginx/nginx.conf || { echo "Failed to copy nginx.conf"; exit 1; }
sudo cp ./nginx.conf /etc/nginx/nginx.conf || { echo "Failed to copy nginx.conf"; exit 1; }


# Start or reload NGINX
echo "Starting NGINX..."
sudo nginx -s reload || { echo "Failed to reload NGINX"; exit 1; }

echo "UI is being served at http://localhost:3000 (or your configured host)"
