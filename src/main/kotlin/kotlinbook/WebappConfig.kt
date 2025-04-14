package kotlinbook

import com.typesafe.config.ConfigFactory

data class WebappConfig(
    val httpPort: Int,
    val projectRoot: String,
    val htmlLocation: String,
    val dbUser: String,
    val dbPassword: String,
    val dbUrl: String
)

fun createAppConfig(env: String) =
    ConfigFactory
        .parseResources("app-${env}.conf")
        .withFallback(ConfigFactory.parseResources("app.conf"))
        .resolve()
        .let {
            WebappConfig(
                httpPort = it.getInt("httpPort"),
                projectRoot = it.getString("projectRoot"),
                htmlLocation = it.getString("htmlLocation"),
                dbUser = System.getenv("PGUSER"),
                dbPassword = System.getenv("PGPASSWORD"),
                dbUrl = "jdbc:postgresql://" + System.getenv("PGHOST") + "/" + System.getenv("PGDATABASE") + "?sslmode=require"
            )
        }

