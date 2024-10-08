#!/bin/sh
if [ "$1" = "-skipNpmInstall" ]
then
    mkdir ./keep
    mv ./admin-api/node_modules ./keep
    find ./admin-api -exec rm -rdf "{}" \;
else
    find ./admin-api -exec rm -rdf "{}" \;
fi
