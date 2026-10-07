#!/bin/bash

env_file=$1
if [[ -z $env_file ]]
then
	echo "You must pass an env file. USAGE: run_docker.sh [ENV_FILE_PATH]"
	exit 1
fi

docker pull ghcr.io/dmurray-chadfield/portfolio-website:latest
docker rm -f portfolio-website 2>/dev/null || true
docker run --network host -d --env-file "$env_file" --name portfolio-website ghcr.io/dmurray-chadfield/portfolio-website:latest
