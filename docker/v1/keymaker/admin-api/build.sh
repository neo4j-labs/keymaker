#!/bin/sh

# Clean dir before build
echo ">>> Removing ./admin-api folder"
./cleanup.sh $1
# Copy in source code
echo ">>> Copying ./admin-api folder without node_modules"
rsync -av --progress ../../../../admin-api . --exclude node_modules
cd admin-api

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
# Copy in empty .env files (vars are specified in docker-compose.yml)
cp ../.env ./.env
cp ../.env ./dist/.env
# Build docker image
echo ">>> Doing docker build"
docker build --no-cache -f Dockerfile ./ -t keymaker-admin-api:${KEYMAKER_VERSION}
# Remove source code 
echo ">>> Removing ./admin-api folder"
cd ..
./cleanup.sh $1