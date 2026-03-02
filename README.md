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
docker run -p 4207:4207 -d --name kotlinbook kotlinbook:latest
```

If you need to pass environment variables (e.g., for production database), use an environment file:

```bash
docker run -p 4207:4207 -d --env-file .env --name kotlinbook kotlinbook:latest
```

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
