#!/bin/bash

# Check if env file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_env_file>"
  exit 1
fi

ENV_FILE=$1

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Environment file $ENV_FILE not found."
  exit 1
fi

# Source the env file, ignoring comments and allowing unquoted values
set -a
source "$ENV_FILE"
set +a

# Extract database name from KOTLINBOOK_DB_URL
# Assumes JDBC URL like: jdbc:postgresql://localhost:5432/dbname
DB_NAME=$(echo "$KOTLINBOOK_DB_URL" | sed 's/.*\///' | sed 's/?.*//')

if [ -z "$DB_NAME" ]; then
  echo "Could not parse database name from KOTLINBOOK_DB_URL: $KOTLINBOOK_DB_URL"
  exit 1
fi

if [ -z "$KOTLINBOOK_DB_USER" ] || [ -z "$KOTLINBOOK_DB_PASSWORD" ]; then
  echo "Missing KOTLINBOOK_DB_USER or KOTLINBOOK_DB_PASSWORD in $ENV_FILE"
  exit 1
fi

CONTAINER_NAME="kotlinbook-postgres"

# 1) Bring up new postgres docker container
echo "Starting PostgreSQL container ($CONTAINER_NAME)..."
# Pull the latest image if necessary is implied by using postgres:latest but we can be explicit
docker pull postgres:latest

# Remove the container if it exists but is stopped
docker rm -f $CONTAINER_NAME 2>/dev/null || true

docker run -d --name $CONTAINER_NAME \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=postgres \
  -p 5432:5432 \
  -v kotlinbook_pgdata:/var/lib/postgresql/data \
  postgres:latest

echo "Waiting for PostgreSQL to become ready..."
# Wait for postgres to be ready
until docker exec $CONTAINER_NAME pg_isready -U postgres; do
  sleep 1
done
# Added a slight delay for complete startup
sleep 2

# 2) Create a new postgres user
echo "Creating user $KOTLINBOOK_DB_USER..."
docker exec -i $CONTAINER_NAME psql -U postgres -d postgres -c \
  "CREATE USER \"$KOTLINBOOK_DB_USER\" WITH PASSWORD '$KOTLINBOOK_DB_PASSWORD';"

# 3) Create a new database with name equal to that specified by KOTLINBOOK_DB_URL
echo "Creating database $DB_NAME..."
docker exec -i $CONTAINER_NAME psql -U postgres -d postgres -c \
  "CREATE DATABASE \"$DB_NAME\";"

# 4) Grant privileges to the new user on the new database and the public schema
echo "Granting privileges..."
docker exec -i $CONTAINER_NAME psql -U postgres -d postgres -c \
  "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$KOTLINBOOK_DB_USER\";"

docker exec -i $CONTAINER_NAME psql -U postgres -d "$DB_NAME" -c \
  "GRANT ALL ON SCHEMA public TO \"$KOTLINBOOK_DB_USER\";"

echo "Database setup complete!"
