#!/bin/sh
###
### Usage: sh ./build_docker.sh <dir1> <dir2>
### This script will run the build.sh file for keymaker & any other directories specified in the args
###
echo ""
echo "*** Cleaning build folder ***"
echo ""
find ./build -exec rm -rdf "{}" \;
mkdir ./build
### Build keymaker
cd ./keymaker
./build.sh
cd ..
