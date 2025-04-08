#!/bin/sh
doExit () {
    echo >&2 "$@"
    exit 1
}

[ "$#" -eq 1 ] || doExit "Usage: keymaker (start | stop | status | unpack)"
if [ "$1" = "start" ]
then
    echo "Starting Keymaker services"
    docker-compose --project-name keymaker up --detach --remove-orphans --force-recreate
    echo "Keymaker should be available in a few minutes"
    echo "  Keymaker Admin UI: http://localhost:36081"
elif [ "$1" = "stop" ]
then
    echo "Stopping Keymaker services"
    docker-compose --project-name keymaker stop
elif [ "$1" = "status" ]
then
    echo "Keymaker status"
    docker ps | grep keymaker
elif [ "$1" = "unpack" ]
then
    if [ -d "./keymaker_config" ]
    then
        echo "*** Config folder exists. Skipping unpacking of config ***"
    else
        echo ""
        echo "*** Unpacking config ***"
        echo ""
        tar xvfz keymaker_config.tar.gz
    fi
    echo ""
    echo "*** Unpacking docker images ***"
    echo ""
    docker load < keymakerDocker.tar.gz
    echo ""
fi