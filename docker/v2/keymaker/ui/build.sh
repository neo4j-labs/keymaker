#!/bin/sh

# Clean dir before build
echo ">>> Removing ./ui folder"
./cleanup.sh $1
# Copy in source code
echo ">>> Copying ./ui folder without node_modules"
rsync -av --progress ../../../../ui . --exclude node_modules
cd ui
rm ./public/config/env-config.js
rmdir ./public/config
# Install deps
echo ">>> Doing Keymaker UI build"
if [ "$1" = "-skipNpmInstall" ]
then
    echo ">>> Skipping npm install"
    mv ../keep/node_modules .
else
    echo ">>> Doing npm install"
    npm install
fi
# Include Nginx config
echo ">>> Overwrite nginx.conf"
cp ../nginx.conf ./nginx.conf
# Build docker image
echo ">>> Doing docker build"
docker build --no-cache -f Dockerfile ./ -t keymaker-ui:${KEYMAKER_VERSION}
# Remove source code 
echo ">>> Removing ./ui folder"
cd ..
./cleanup.sh $1