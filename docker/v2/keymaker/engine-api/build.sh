#!/bin/sh

# Clean dir before build
echo ">>> Removing ./engine-api folder"
./cleanup.sh $1
# Copy in source code
echo ">>> Copying ./engine-api folder without node_modules"
rsync -av --progress ../../../../engine-api . --exclude node_modules
cd engine-api

# Install deps
echo ">>> Installing dependencies"
if [ "$1" = "-skipNpmInstall" ]
then
    echo ">>> Skipping npm install"
    mv ../keep/node_modules .
else
    echo ">>> Doing npm install"
    npm install
fi
# Copy in empty .env files (vars are specified in docker-compose-all.yml)
cp ../.env ./.env
cp ../.env ./dist/.env
# Build docker image
echo ">>> Doing docker build"
docker build --no-cache -f Dockerfile ./ -t keymaker-engine-api:${KEYMAKER_VERSION}
# Remove source code 
echo ">>> Removing ./engine-api folder"
cd ..
./cleanup.sh $1