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

### Cleaning build directory
echo ""
echo "*** Cleaning build directory ***"
echo ""
rm -r ./build/*
### Packaging Docker images
echo ""
echo "*** Packaging docker images ***"
echo ""
docker save keymaker-ui:${KEYMAKER_VERSION} keymaker-admin-api:${KEYMAKER_VERSION} keymaker-engine-api:${KEYMAKER_VERSION} | gzip > keymakerDocker.tar.gz
mv keymakerDocker.tar.gz ./build
### Packaging Config
echo ""
echo "*** Packaging Keymaker config ***"
echo ""

tar --exclude='movies*' -zcvf keymaker_config.tar.gz ./config
mv ./keymaker_config.tar.gz ./build


#cp docker-compose.yml ./build/docker-compose.yml
sed 's|${KEYMAKER_VERSION}|'$KEYMAKER_VERSION'|g' docker-compose.yml > ./build/docker-compose.yml
cp ./keymaker.sh ./build/keymaker.sh
cp ../../admin-api/scripts/create-user.sh ./build
echo ""
echo "*** Packaging everything ***"
echo ""
cd ./build
tar cvf keymaker.tar.gz *
echo "*** Done ***"