# Dan's Portfolio Website

A Kotlin web application built with Ktor and Spring Security, now with a React SPA frontend for landing/login/profile flows.

## Tech Stack

- **Framework**: Ktor 2.1.2
- **Security**: Spring Security 5.7.3
- **Frontend**: React 18 + React Router 6 + Vite 4
- **Database**: PostgreSQL (production) / H2 (development)
- **Build System**: Gradle with Kotlin DSL
- **ORM**: Kotliquery
- **Migrations**: Flyway
- **Functional Programming**: Arrow
- **Password Hashing**: BCrypt

## Features

- React single-page frontend with `/`, `/login`, and `/profile`
- JSON auth API endpoints for SPA login/session handling
- Legacy server-rendered login flow preserved at `/legacy-login`
- Encrypted cookie sessions
- Database migrations with Flyway
- Type-safe SQL queries with Kotliquery
- Functional error handling with Arrow Either
- HTML templating with kotlinx.html
- RESTful JSON endpoints
- Single Page Application support

## Requirements

- JDK 17 or later
- Gradle
- Node.js 16+ and npm (for frontend development/build)

## Getting Started

### Running Locally

```bash
./gradlew run
```

The application runs on port 4207 by default.

### Frontend Development (Hot Reload)

Run backend and frontend dev servers in separate terminals:

```bash
# Terminal 1
./gradlew run

# Terminal 2
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173`.

Vite proxies `/api/*` to the Ktor backend at `http://localhost:4207`.

### Environment Configuration

Set the `KOTLINBOOK_ENV` environment variable:

| Value | Description |
|-------|-------------|
| `local` (default) | Development with H2 in-memory database |
| `production` | Production with PostgreSQL |

The `production` setting reads its values from environment variables (see
`src/main/resources/app-production.conf`).

#### Environment File

An example environment file is provided at [`.env.example`](.env.example). Copy
it and fill in your own values:

```bash
cp .env.example .env
```

`.env` is git-ignored, so your secrets are never committed. The example file is
safe to commit because it only contains placeholders.

| Variable | Required | Description |
|----------|:--------:|-------------|
| `KOTLINBOOK_ENV` | Yes | Set to `production` to load `app-production.conf`. Defaults to `local`. |
| `KOTLINBOOK_HTTP_PORT` | Yes | Port the HTTP server listens on (default `4207`). |
| `KOTLINBOOK_DB_URL` | Yes | JDBC URL, e.g. `jdbc:postgresql://localhost:5432/portfolio_website`. |
| `KOTLINBOOK_DB_USER` | Yes | PostgreSQL username. |
| `KOTLINBOOK_DB_PASSWORD` | Yes | PostgreSQL password. |
| `KOTLINBOOK_COOKIE_ENCRYPTION_KEY` | Yes | Hex-encoded session cookie encryption key (16 bytes). |
| `KOTLINBOOK_COOKIE_SIGNING_KEY` | Yes | Hex-encoded session cookie signing key (32 bytes). |
| `KOTLINBOOK_REMEMBER_ME_KEY` | Yes | Hex-encoded remember-me key. |

Generate secure random values for the secrets with:

```bash
openssl rand -hex 16   # KOTLINBOOK_COOKIE_ENCRYPTION_KEY
openssl rand -hex 32   # KOTLINBOOK_COOKIE_SIGNING_KEY
openssl rand -hex 32   # KOTLINBOOK_REMEMBER_ME_KEY
```

The file can be passed to Docker and the helper scripts:

```bash
./create_db.sh .env          # create the PostgreSQL user/database (see Database Setup)
./run_docker.sh .env         # run the container
```

### Database Setup

The PostgreSQL user and database are created by [`create_db.sh`](create_db.sh).
It reads `KOTLINBOOK_DB_URL`, `KOTLINBOOK_DB_USER`, and `KOTLINBOOK_DB_PASSWORD`
from the environment file and performs four steps:

1. Brings up PostgreSQL (Docker mode only) and waits until it accepts connections
2. Creates the user from `KOTLINBOOK_DB_USER`
3. Creates the database named in `KOTLINBOOK_DB_URL` (e.g. `portfolio_website`)
4. Grants the user full privileges on that database and its `public` schema

Two modes are available:

```bash
./create_db.sh --docker .env    # start PostgreSQL in a Docker container (default)
./create_db.sh --service .env   # use an already running PostgreSQL service
```

The flag can be omitted (`./create_db.sh .env` runs in Docker mode). Run the
script with `--help` to see its usage message.

#### Docker Mode (default)

Starts a container named `postgres` from the `postgres:latest` image, exposing
port `5432` with the superuser `postgres` / `password`. Data is stored in the
`kotlinbook_pgdata` Docker volume, so it survives container restarts. Any
existing container with that name is removed and replaced (the volume is kept).
Requires `docker` on PATH.

#### Service Mode

Connects to an already running PostgreSQL service instead of starting a
container. Requires `psql` on PATH (the script errors out if it is missing).
The host and port are taken from `KOTLINBOOK_DB_URL`, defaulting to
`localhost:5432`.

Before using this mode, set a password on the admin superuser — a freshly
installed PostgreSQL service has none. Run this once after bringing the
service up:

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'password';"
```

Replace `'password'` with your admin password, if you set one. The script
authenticates with these (optional) variables, overridable in the environment
file or the shell:

| Variable | Default | Description |
|----------|---------|-------------|
| `KOTLINBOOK_DB_ADMIN_USER` | `postgres` | Admin user used to create the app user and database |
| `KOTLINBOOK_DB_ADMIN_PASSWORD` | `password` | Admin user's password |

#### Re-running the Script

`CREATE USER` and `CREATE DATABASE` fail if the user or database already
exists, so the script is intended for first-time setup. To start over, drop
the user and database (or, in Docker mode, delete the container and the
`kotlinbook_pgdata` volume with `docker volume rm kotlinbook_pgdata`) and run
the script again. Flyway migrations are applied automatically when the
application starts.

### Building

Build the production JAR:

```bash
./gradlew shadowJar
```

`processResources` depends on `buildFrontend`, so Gradle automatically:
1. Runs `npm install` in `frontend/`
2. Runs `npm run build`
3. Copies `frontend/dist/*` to `src/main/resources/public/`

Build a Docker image:

```bash
docker build -f Dockerfile -t kotlinbook:latest .
```

### Running with Docker

Run the container:

```bash
docker run --network host -d --name kotlinbook kotlinbook:latest
```

If you need to pass environment variables (e.g., for production database), use an environment file. Start by copying the example file and filling it in (see [Environment File](#environment-file)):

```bash
cp .env.example .env
docker run --network host -d --env-file .env --name kotlinbook kotlinbook:latest
```

The container uses the host's network namespace (`--network host`), so the app
listens directly on the host's port 4207 (`KOTLINBOOK_HTTP_PORT`) with no
published ports required. This also means `localhost` in `KOTLINBOOK_DB_URL`
works as-is: the container reaches the host's PostgreSQL over loopback.

Alternatively, you can use the provided helper script:

```bash
./run_docker.sh .env
```

## Testing

Run all tests:

```bash
./gradlew test
```

Run a specific test class:

```bash
./gradlew test --tests "kotlinbook.UserTest"
```

Run tests with verbose output:

```bash
./gradlew test --info
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Navbar, ProtectedRoute
│   ├── context/         # AuthContext for session state
│   └── pages/           # LandingPage, LoginPage, ProfilePage
├── package.json
└── vite.config.js

src/
├── main/
│   ├── kotlin/kotlinbook/
│   │   ├── MainSpringSecurity.kt # Primary entry point (mainClass) — starts embedded Jetty, registers BootstrapWebApp
│   │   ├── BootstrapWebApp.kt   # Servlet listener — bootstraps Ktor (as a servlet) and Spring Security
│   │   ├── WebappSecurityConfig.kt # Spring Security filter chain and auth provider
│   │   ├── Main.kt              # Standalone alternative entry point (Ktor/Netty only, no Spring Security)
│   │   ├── MainSpringContext.kt  # Standalone alternative entry point using a Spring ApplicationContext
│   │   ├── Ktor.kt              # Routes and handlers
│   │   ├── Auth.kt              # Authentication logic
│   │   ├── WebappConfig.kt      # Configuration
│   │   ├── db/                  # Database utilities
│   │   ├── domain/              # Domain models
│   │   └── web/                 # HTTP handlers, responses
│   └── resources/
│       ├── app*.conf           # Configuration files
│       ├── db/migration/       # Flyway migrations
│       └── public/             # Static assets
└── test/
    └── kotlin/kotlinbook/
        └── UserTest.kt
```

## Routes

### Main Application (port 4207)

| Method | Path | Auth Required | Description |
|--------|------|:-------------:|-------------|
| GET | `/` | No | SPA entry (React landing page via static `index.html`) |
| GET | `/param_test` | No | Echo the `foo` query parameter |
| GET | `/json_test` | No | Returns a sample JSON response |
| GET | `/json_test_with_header` | No | Returns sample JSON with a custom response header |
| GET | `/db_test` | No | Runs a test query against the database |
| GET | `/coroutine_test` | No | Tests coroutine behaviour via a proxied internal request |
| GET | `/html_test` | No | Renders a basic HTML test page |
| GET | `/html_webresponse_test` | No | Renders an HTML page using the app layout |
| GET | `/legacy-login` | No | Renders legacy server-side login form |
| POST | `/login` | No | Legacy login submit; redirects to `/secret` on success |
| POST | `/api/login` | No | SPA login endpoint (`{ email, password }`) |
| GET | `/api/me` | Session | Returns current authenticated user (`email`, `name`) |
| POST | `/api/logout` | No | Clears session and returns `{ success: true }` |
| POST | `/test_json` | No | Validates a JSON body and returns the parsed user or a validation error |
| GET | `/secret` | ✓ | Protected page showing logged-in user details |
| GET | `/logout` | ✓ | Clears the session and redirects to `/legacy-login` |
| GET | `/*` | No | Single Page Application — serves static files from `/public`, falling back to `index.html` |

### Internal Server (port 9876)

> These routes are only accessible within the server environment and are not exposed publicly.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/random_number` | Returns a random number after a random delay (200–2000 ms) |
| GET | `/ping` | Health check — returns `pong` |
| POST | `/reverse` | Reverses the text body of the request |

## Database Migrations

SQL migrations are in `src/main/resources/db/migration/`. Format: `V{version}__{description}.sql`

### Troubleshooting Migrations

Rerun a failed migration:
```sql
DELETE FROM flyway_schema_history WHERE version = '{version}';
```

Mark migration as successful:
```sql
UPDATE flyway_schema_history SET success = true WHERE version = '{version}';
```
