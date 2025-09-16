package kotlinbook

import com.typesafe.config.ConfigFactory
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.util.pipeline.*

import org.slf4j.LoggerFactory
import java.io.File
import kotlin.reflect.full.declaredMemberProperties
import com.zaxxer.hikari.HikariDataSource
import javax.sql.DataSource
import org.flywaydb.core.Flyway
import kotlinbook.db.datasource.createAndMigrateDataSource
import kotlinbook.db.mapFromRow
import kotlinbook.web.response.JsonWebResponse
import kotlinbook.web.response.TextWebResponse
import kotlinbook.web.webResponse
import kotlinbook.web.webResponseDb
import kotliquery.Row
import kotliquery.Session
import kotliquery.TransactionalSession
import kotliquery.queryOf
import kotliquery.sessionOf

private val log = LoggerFactory.getLogger("kotlinbook.Main")

val env = System.getenv("KOTLINBOOK_ENV") ?: "local"
val webappConfig = createAppConfig(env)
val dataSource = createAndMigrateDataSource(webappConfig)


fun main() {
    log.debug("Starting application...")
    log.debug("Application runs in the environment $env")


    val secretsRegex = "password|secret|key|url"
        .toRegex(RegexOption.IGNORE_CASE)
    log.debug("Configuration loaded successfully: ${
        WebappConfig::class.declaredMemberProperties
            .sortedBy { it.name }
            .map{
                if (secretsRegex.containsMatchIn(it.name)) {
                    "${it.name} = ${it.get(webappConfig).toString().take(2)}*****"
                } else {
                    "${it.name} = ${it.get(webappConfig)}"
                }
            }
            .joinToString(separator = "\n")
    }")

    dataSource.getConnection().use {
        conn -> conn.createStatement().use {
            stmt -> stmt.executeQuery("SELECT 1")
        }
    }

    embeddedServer(Netty, port = webappConfig.httpPort) {
        createKtorApplication()
    }.start(wait = true)
}

fun Application.createKtorApplication() {
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            kotlinbook.log.error("An unknown error occurred", cause)

            call.respondText(
                text = "500: $cause",
                status = HttpStatusCode.InternalServerError
            )
        }
    }

    routing {
        get("/", webResponse {TextWebResponse("Hello, World!")})

        get("/param_test", webResponse {
            TextWebResponse(
                "The param is ${call.request.queryParameters["foo"]}"
            )
        })

        get("/json_test", webResponse {
            JsonWebResponse(mapOf("foo" to "bar"))
        })

        get("/json_test_with_header", webResponse {
            JsonWebResponse(mapOf("foo" to "bar"))
                .appendHeader("X-Test-Header", "Just a test!")
        })

        get("/db_test", webResponseDb(dataSource) { dbSess ->
            JsonWebResponse(
                dbSess.single(queryOf("SELECT 1"), ::mapFromRow)
            )
        })
/*        get("/") {
            call.respondFile(
                File(webappConfig.projectRoot + webappConfig.htmlLocation),
                "index.html"
            )
        }
 */
    }
}


