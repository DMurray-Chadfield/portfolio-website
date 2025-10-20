package kotlinbook.db.datasource

import com.zaxxer.hikari.HikariDataSource
import kotlinbook.WebappConfig
import kotlinbook.env
import org.flywaydb.core.Flyway
import javax.sql.DataSource

fun createDataSource(config: WebappConfig) =
    HikariDataSource().apply() {
        jdbcUrl = config.dbUrl
        username = config.dbUser
        password = config.dbPassword
    }

fun migrateDataSource(dataSource: DataSource) {
    val locations = mutableListOf<String>("db/migration/common")
    if (env == "local") {
        locations.add("db/migration/h2")
    } else {
        locations.add("db/migration/postgres")
    }

    Flyway.configure()
        .dataSource(dataSource)
        .locations(*locations.toTypedArray())
        .table("flyway_schema_history")
        .load()
        .migrate()
}

fun createAndMigrateDataSource(config: WebappConfig) =
    createDataSource(config).also(::migrateDataSource)
