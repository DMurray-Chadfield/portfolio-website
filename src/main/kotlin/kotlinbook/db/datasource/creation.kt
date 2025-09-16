package kotlinbook.db.datasource

import com.zaxxer.hikari.HikariDataSource
import kotlinbook.WebappConfig
import org.flywaydb.core.Flyway
import javax.sql.DataSource

fun createDataSource(config: WebappConfig) =
    HikariDataSource().apply() {
        jdbcUrl = config.dbUrl
        username = config.dbUser
        password = config.dbPassword
    }

fun migrateDataSource(dataSource: DataSource) {
    Flyway.configure()
        .dataSource(dataSource)
        .locations("db/migration")
        .table("flyway_schema_history")
        .load()
        .migrate()
}

fun createAndMigrateDataSource(config: WebappConfig) =
    createDataSource(config).also(::migrateDataSource)
