# Dan's Portfolio Website

A Kotlin web application built with Ktor and Spring Security, serving as a personal portfolio and demonstrating modern web development practices.

## Tech Stack

- **Framework**: Ktor 2.1.2
- **Security**: Spring Security 5.7.3
- **Database**: PostgreSQL (production) / H2 (development)
- **Build System**: Gradle with Kotlin DSL
- **ORM**: Kotliquery
- **Migrations**: Flyway
- **Functional Programming**: Arrow
- **Password Hashing**: BCrypt

## Features

- User authentication with session-based login
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

## Getting Started

### Running Locally

```bash
./gradlew run
```

The application runs on port 4207 by default.

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
src/
├── main/
│   ├── kotlin/kotlinbook/
│   │   ├── Main.kt              # Application entry point
│   │   ├── MainSpringSecurity.kt # Spring Security integration
│   │   ├── Ktor.kt              # Routes and handlers
│   │   ├── Auth.kt              # Authentication logic
│   │   ├── BootstrapWebApp.kt   # App bootstrap
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

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Hello World |
| GET | `/login` | Login page |
| POST | `/login` | Submit login |
| GET | `/secret` | Protected route (requires auth) |
| GET | `/logout` | Logout |

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
