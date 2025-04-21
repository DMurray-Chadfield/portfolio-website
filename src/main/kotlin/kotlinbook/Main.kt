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
import kotlinbook.createAndMigrateDataSource

private val log = LoggerFactory.getLogger("kotlinbook.Main")

data class TextWebResponse(
    val body: String,
    override val statusCode: Int = 200,
    override val headers : Map<String, List<String>> = mapOf()
) : WebResponse() {
    override fun copyResponse(
        statusCode: Int,
        headers: Map<String, List<String>>
    ): WebResponse = copy(body = body, statusCode = statusCode, headers = headers)
}

data class JsonWebResponse(
    val body: Any?,
    override val statusCode: Int = 200,
    override val headers: Map<String, List<String>> = mapOf()
) : WebResponse() {
    override fun copyResponse(
        statusCode: Int,
        headers: Map<String, List<String>>
    ): WebResponse = copy(body = body, statusCode = statusCode, headers = headers)
}

val env = System.getenv("KOTLINBOOK_ENV") ?: "local"
val webappConfig = createAppConfig(env)


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

    val dataSource = createAndMigrateDataSource(webappConfig)
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
/*        get("/") {
            call.respondFile(
                File(webappConfig.projectRoot + webappConfig.htmlLocation),
                "index.html"
            )
        }
 */
    }
}

fun webResponse(
    handler: suspend PipelineContext<Unit, ApplicationCall>.() -> WebResponse
): PipelineInterceptor<Unit, ApplicationCall> {
    return {
        val resp = this.handler()
        for ((name, values) in resp.headers())
            for (value in values)
                call.response.header(name, value)

        val statusCode = HttpStatusCode.fromValue(resp.statusCode)

        when (resp) {
            is TextWebResponse -> {
                call.respondText(
                    text = resp.body,
                    status = statusCode
                )
            }
            is JsonWebResponse -> {
                call.respond(KtorJsonWebResponse (
                    body = resp.body,
                    status = statusCode
                ))
            }
        }
    }
}

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