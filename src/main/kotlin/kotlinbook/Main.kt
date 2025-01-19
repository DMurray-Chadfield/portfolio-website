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
import java.io.File
import kotlin.reflect.full.declaredMemberProperties

private val log = LoggerFactory.getLogger("kotlinbook.Main")

sealed class WebResponse {
    abstract val statusCode: Int
    abstract val headers: Map<String, List<String>>

    abstract fun copyResponse(
        statusCode: Int,
        headers: Map<String, List<String>>
    ) : WebResponse

    fun appendHeader(headerName: String, headerValue: String) = appendHeader(headerName, listOf(headerValue))

    fun appendHeader(
        headerName: String,
        headerValue: List<String>
    ) = copyResponse(
            statusCode,
            headers.plus(
                Pair(
                    headerName,
                    headers.getOrDefault(
                        headerName,
                        listOf()
                    ).plus(headerValue)
                )
            )
        )

    fun headers(): Map<String, List<String>> = headers
        .map{it.key.lowercase() to it.value}
        .fold(mapOf()) {res, (k, v) ->
            res.plus(
                (
                    Pair(
                        k,
                        res.getOrDefault(k, listOf()).plus(v)
                    )
                )
            )
        }
}

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
            call.respondFile(
                File(webappConfig.projectRoot + webappConfig.htmlLocation),
                "index.html"
            )
        }
    }
}

