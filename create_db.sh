#!/bin/bash

usage() {
  echo "Usage: $0 [--docker|--service] <path_to_env_file>"
  echo ""
  echo "  --docker   Start PostgreSQL in a Docker container (default)"
  echo "  --service  Use an already running PostgreSQL service (requires psql on PATH)"
  echo ""
  echo "In --service mode, the admin credentials used to create the user and"
  echo "database come from KOTLINBOOK_DB_ADMIN_USER and KOTLINBOOK_DB_ADMIN_PASSWORD"
  echo "(falling back to postgres / password)."
  exit 1
}

MODE="docker"

# Parse flags; the first non-flag argument is the env file
while [ $# -gt 0 ]; do
  case "$1" in
    --docker)
      MODE="docker"
      shift
      ;;
    --service)
      MODE="service"
      shift
      ;;
    -h|--help)
      usage
      ;;
    -*)
      echo "Unknown option: $1"
      usage
      ;;
    *)
      break
      ;;
  esac
done

# Check if env file is provided
if [ -z "$1" ]; then
  usage
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

CONTAINER_NAME="postgres"

# Admin credentials used to create the user and database.
# Docker mode always initializes its own superuser; service mode allows overrides.
ADMIN_USER="${KOTLINBOOK_DB_ADMIN_USER:-postgres}"
ADMIN_PASSWORD="${KOTLINBOOK_DB_ADMIN_PASSWORD:-password}"

if [ "$MODE" = "service" ]; then
  # Extract host and port from KOTLINBOOK_DB_URL, defaulting like JDBC would
  DB_HOST=$(echo "$KOTLINBOOK_DB_URL" | sed -n 's|.*://\([^:/]*\).*|\1|p')
  DB_PORT=$(echo "$KOTLINBOOK_DB_URL" | sed -n 's|.*:\([0-9][0-9]*\)/.*|\1|p')
  DB_HOST=${DB_HOST:-localhost}
  DB_PORT=${DB_PORT:-5432}

  if ! command -v psql >/dev/null 2>&1; then
    echo "Error: --service mode requires psql on PATH."
    exit 1
  fi

  export PGPASSWORD="$ADMIN_PASSWORD"

  run_sql() {
    psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$ADMIN_USER" -d "$1" -c "$2"
  }
else
  run_sql() {
    docker exec -i $CONTAINER_NAME psql -U postgres -d "$1" -c "$2"
  }
fi

if [ "$MODE" = "docker" ]; then
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
    -e PGDATA=/var/lib/postgresql/data \
    -v kotlinbook_pgdata:/var/lib/postgresql \
    postgres:latest

  echo "Waiting for PostgreSQL to become ready..."
  # Wait for postgres to be ready
  until docker exec $CONTAINER_NAME pg_isready -U postgres; do
    sleep 1
  done
  # Added a slight delay for complete startup
  sleep 2
else
  echo "Using running PostgreSQL service at $DB_HOST:$DB_PORT..."
  echo "Waiting for PostgreSQL to become ready..."
  until psql -h "$DB_HOST" -p "$DB_PORT" -U "$ADMIN_USER" -d postgres -c "SELECT 1;" >/dev/null 2>&1; do
    sleep 1
  done
fi

# 2) Create a new postgres user
echo "Creating user $KOTLINBOOK_DB_USER..."
run_sql postgres "CREATE USER \"$KOTLINBOOK_DB_USER\" WITH PASSWORD '$KOTLINBOOK_DB_PASSWORD';"

# 3) Create a new database with name equal to that specified by KOTLINBOOK_DB_URL
echo "Creating database $DB_NAME..."
run_sql postgres "CREATE DATABASE \"$DB_NAME\";"

# 4) Grant privileges to the new user on the new database and the public schema
echo "Granting privileges..."
run_sql postgres "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$KOTLINBOOK_DB_USER\";"

run_sql "$DB_NAME" "GRANT ALL ON SCHEMA public TO \"$KOTLINBOOK_DB_USER\";"

echo "Database setup complete!"
