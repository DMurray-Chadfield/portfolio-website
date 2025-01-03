package kotlinbook

import com.typesafe.config.ConfigFactory
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.plugins.statuspages.*

import org.slf4j.LoggerFactory
import kotlin.reflect.full.declaredMemberProperties

private val log = LoggerFactory.getLogger("kotlinbook.Main")

data class WebappConfig(
    val httpPort: Int
)

sealed class WebResponse {
    abstract val statusCode: Int
    abstract val headers: Map<String, List<String>>
}

data class TextWebResponse(
    val body: String,
    override val statusCode: Int = 200,
    override val headers : Map<String, List<String>> = mapOf()
) : WebResponse()

data class JsonWebResponse(
    val body: Any?,
    override val statusCode: Int = 200,
    override val headers: Map<String, List<String>> = mapOf()
) : WebResponse()

fun main() {
    log.debug("Starting application...")

    val env = System.getenv("KOTLINBOOK_ENV") ?: "local"
    log.debug("Application runs in the environment $env")
    val webappConfig = createAppConfig(env)

    val secretsRegex = "password|secret|key"
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
        get("/") {
            call.respondText("Hello, World!")
        }
    }
}

fun createAppConfig(env: String) =
    ConfigFactory
    .parseResources("app-${env}.conf")
    .withFallback(ConfigFactory.parseResources("app.conf"))
    .resolve()
    .let {
        WebappConfig(
            httpPort = it.getInt("httpPort")
        )
    }
