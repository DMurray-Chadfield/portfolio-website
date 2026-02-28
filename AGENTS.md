# AGENTS.md - Development Guide for Portfolio Website

This document provides guidance for agentic coding agents operating in this repository.

## Project Overview

This is a Kotlin web application using:
- **Framework**: Ktor 2.1.2 with Spring Security 5.7.3
- **Build System**: Gradle with Kotlin DSL
- **Database**: PostgreSQL (production) / H2 (development)
- **Testing**: JUnit 5 with Kotlin Test

## Build Commands

```bash
# Build and run the application
./gradlew run

# Build production JAR (shadowJar)
./gradlew shadowJar

# Build Docker image
docker build -f Dockerfile -t kotlinbook:latest .

# Run all tests
./gradlew test

# Run a single test class
./gradlew test --tests "kotlinbook.UserTest"

# Run a single test method
./gradlew test --tests "kotlinbook.UserTest.testCreateUser"

# Run tests with verbose output
./gradlew test --info

# Check for dependency updates
./gradlew dependencyUpdates

# Clean build
./gradlew clean
```

## Environment Configuration

Set the `KOTLINBOOK_ENV` environment variable to switch between environments:
- `local` (default) - Development with H2 in-memory database
- `production` - Production configuration

Configuration files in `src/main/resources/`:
- `app.conf` - Base configuration
- `app-local.conf` - Local development overrides
- `app-production.conf` - Production overrides
- `app-test.conf` - Test configuration

## Code Style Guidelines

### General Principles

- **No comments** unless explicitly required
- Use **Arrow** (`arrow-core`, `arrow-fx-coroutines`, `arrow-fx-stm`) for functional error handling and monadic operations
- Prefer **sealed classes** for union types (see `WebResponse.kt`)
- Use **data classes** for DTOs and domain models

### Naming Conventions

- **Classes**: PascalCase (`UserService`, `WebResponse`)
- **Functions/Variables**: camelCase (`getUser`, `userId`)
- **Constants**: PascalCase with descriptive names
- **Packages**: lowercase, single words or dot-separated (`kotlinbook.db`, `kotlinbook.web.response`)
- **Test Classes**: `*Test` suffix (`UserTest`, `WebResponseTest`)

### Imports

Organize imports in the following order (blank line between groups):
1. Kotlin standard library (`kotlin.*`)
2. Java standard library (`java.*`, `javax.*`)
3. Third-party libraries (alphabetical: `arrow.*`, `io.ktor.*`, etc.)
4. Project imports (`kotlinbook.*`)

Example from the codebase:
```kotlin
package kotlinbook

import arrow.core.continuations.either
import com.google.gson.Gson
import io.ktor.http.*
import io.ktor.server.application.*
import org.slf4j.LoggerFactory
import javax.sql.DataSource
import kotlinbook.db.datasource.createAndMigrateDataSource
import kotlinbook.domain.User
```

### Types and Type Safety

- Use **nullable types** (`?`) appropriately - prefer `null` over sentinel values
- Use **sealed classes** for exhaustive pattern matching
- Prefer **data classes** for immutable value objects
- Use explicit return types for public functions

### Error Handling

- Use **Arrow's `Either`** type for operations that can fail:
  ```kotlin
  suspend fun getUser(id: Long): Either<Error, User> = either {
      // Use shift() for errors, return value for success
  }
  ```
- Use **sealed classes** for error types with exhaustive handling
- Use **try-catch** sparingly; prefer `Either` for expected failure cases

### Database Operations

- Use **Kotliquery** for type-safe SQL queries
- Use **Flyway** for database migrations (SQL files in `src/main/resources/db/migration/`)
- Use **HikariCP** for connection pooling
- Wrap database operations in transactions using `dbSess.transaction { }`

### Web Response Pattern

Follow the `WebResponse` sealed class pattern for all HTTP responses:
```kotlin
sealed class WebResponse {
    abstract val statusCode: Int
    abstract val headers: Map<String, List<String>>
}
```

Use helper functions in `kotlinbook.web` package:
- `webResponse { }` - Basic handler
- `webResponseDb(dataSource) { dbSess -> }` - Handler with database session
- `webResponseTx(dataSource) { txSess -> }` - Handler with transactional session

### Security

- Passwords are hashed using **BCrypt** (`at.favre.lib:bcrypt`)
- Sessions use **encrypted cookies** with `SessionTransportTransformerEncrypt`
- Use `webResponseDb` for handlers requiring authentication

### Formatting

- **Indentation**: 4 spaces (Kotlin default)
- **Line length**: No strict limit, but prefer under 120 characters
- **Blank lines**: Single blank line between class members, double between top-level declarations
- **Braces**: Same-line opening brace for functions/classes

### Testing

- Test classes in `src/test/kotlin/kotlinbook/`
- Use `testTx { dbSess -> }` helper for transactional tests (automatically rolls back)
- Use `testDataSource` for tests requiring a data source
- Use Kotlin Test assertions: `assertEquals`, `assertNotNull`, `assertNull`, `assertTrue`, etc.

## Project Structure

```
src/
├── main/
│   ├── kotlin/kotlinbook/
│   │   ├── Main.kt, MainSpringSecurity.kt, MainSpringContext.kt
│   │   ├── BootstrapWebApp.kt, WebappConfig.kt, Auth.kt
│   │   ├── db/           # Database utilities and wrappers
│   │   ├── domain/       # Domain models (User, etc.)
│   │   └── web/          # HTTP handlers, responses, validation
│   └── resources/
│       ├── app*.conf     # Configuration files
│       ├── db/migration/ # Flyway migrations
│       └── public/       # Static assets
└── test/
    └── kotlin/kotlinbook/
        └── UserTest.kt, WebResponseTest.kt
```

## Database Migrations

- SQL migrations in `src/main/resources/db/migration/`
- Format: `V{version}__{description}.sql`
- Use H2-specific migrations in `db/migration/h2/`
- Common migrations in `db/migration/common/`

If a migration fails:
```sql
-- To rerun a failed migration:
DELETE FROM flyway_schema_history WHERE version = '{version}';

-- To mark a manually completed migration as successful:
UPDATE flyway_schema_history SET success = true WHERE version = '{version}';
```
