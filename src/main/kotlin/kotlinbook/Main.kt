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

private val log = LoggerFactory.getLogger("kotlinbook.Main")

data class WebappConfig(
    val httpPort: Int
)

fun main() {
    log.debug("Starting application...")

    val webappConfig = createAppConfig()

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

fun createAppConfig() =
    ConfigFactory
    .parseResources("app.conf")
    .resolve()
    .let {
        WebappConfig(
            httpPort = it.getInt("httpPort")
        )
    }
