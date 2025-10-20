#!/bin/bash

env_file=$1
if [[ -z $env_file ]]
then
	echo "You must pass an env file. USAGE: run_docker.sh [ENV_FILE_PATH]"
	exit 1
fi

docker run -p 4207:4207 -d --env-file "$env_file" --name kotlinbook kotlinbook:latest
