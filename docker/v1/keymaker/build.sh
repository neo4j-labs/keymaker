#!/bin/sh
if [ -z "$KEYMAKER_VERSION" ]
then
    echo "KEYMAKER_VERSION must be set first by running command:"
    echo "  source ./getVersion.sh"
    exit 1
else
    echo "KEYMAKER_VERSION is ${KEYMAKER_VERSION}, ok to proceed? (y/n)"
    read isVersionOk
    if [ "$isVersionOk" != "y" ]
    then
        echo "Stopping build, re-run when version is ok."
        exit 1
    else
        echo "Building with KEYMAKER_VERSION ${KEYMAKER_VERSION}"
    fi
fi

echo ""
echo "*** Building Keymaker ***"
echo ""
### Build Keymaker Admin API
echo ""
echo "*** Building Keymaker Admin API ***"
echo ""
cd ./admin-api
./build.sh $1
cd ..
### Build Keymaker Engine API
echo ""
echo "*** Building Keymaker Engine API ***"
echo ""
cd ./engine-api
./build.sh $1
cd ..
### Build Keymaker UI
echo ""
echo "*** Building Keymaker UI ***"
echo ""
cd ./ui
./build.sh $1
cd ..