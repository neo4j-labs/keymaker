#!/bin/sh
if [ "$1" = "-skipNpmInstall" ]
then
    mkdir ./keep
    mv ./engine-api/node_modules ./keep
    find ./engine-api -exec rm -rdf "{}" \;
else
    find ./engine-api -exec rm -rdf "{}" \;
fi
