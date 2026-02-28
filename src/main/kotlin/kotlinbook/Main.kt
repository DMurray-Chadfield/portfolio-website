package kotlinbook

import arrow.core.continuations.either
import com.google.gson.Gson
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.plugins.forwardedheaders.*
import io.ktor.util.pipeline.*

import org.slf4j.LoggerFactory
import kotlin.reflect.full.declaredMemberProperties
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.principal
import io.ktor.server.auth.session
import io.ktor.server.html.respondHtml
import io.ktor.server.http.content.files
import io.ktor.server.http.content.resources
import io.ktor.server.http.content.singlePageApplication
import io.ktor.server.http.content.static
import io.ktor.server.request.receiveParameters
import io.ktor.server.request.receiveText
import io.ktor.server.sessions.SessionTransportTransformerEncrypt
import io.ktor.server.sessions.Sessions
import io.ktor.server.sessions.clear
import io.ktor.server.sessions.cookie
import io.ktor.server.sessions.maxAge
import io.ktor.server.sessions.sessions
import io.ktor.server.sessions.set
import io.ktor.util.hex
import javax.sql.DataSource
import kotlinbook.db.datasource.createAndMigrateDataSource
import kotlinbook.db.getUser
import kotlinbook.db.mapFromRow
import kotlinbook.domain.User
import kotlinbook.web.html.AppLayout
import kotlinbook.web.response.HtmlWebResponse
import kotlinbook.web.response.JsonWebResponse
import kotlinbook.web.response.TextWebResponse
import kotlinbook.web.validation.ValidationError
import kotlinbook.web.validation.validateEmail
import kotlinbook.web.validation.validatePassword
import kotlinbook.web.webResponse
import kotlinbook.web.webResponseDb
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import kotlinx.html.ButtonType
import kotlinx.html.FormMethod
import kotlinx.html.InputType
import kotlinx.html.a
import kotlinx.html.body
import kotlinx.html.button
import kotlinx.html.form
import kotlinx.html.head
import kotlinx.html.h1
import kotlinx.html.input
import kotlinx.html.label
import kotlinx.html.p
import kotlinx.html.styleLink
import kotlinx.html.title
import kotliquery.Session
import kotliquery.queryOf
import kotliquery.sessionOf
import kotlin.collections.mapOf
import kotlin.time.Duration

private val log = LoggerFactory.getLogger("kotlinbook.Main")

val env = System.getenv("KOTLINBOOK_ENV") ?: "local"


fun main() {
    log.debug("Starting application...")
    log.debug("Application runs in the environment $env")

    val webappConfig = createAppConfig(env)
    val dataSource = createAndMigrateDataSource(webappConfig)
    val secretsRegex = "password|secret|key|url"
        .toRegex(RegexOption.IGNORE_CASE)
    log.debug("Configuration loaded successfully: ${
        WebappConfig::class.declaredMemberProperties
            .sortedBy { it.name }
            .map {
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
        install(XForwardedHeaders)
        setUpKtorCookieSecurity(webappConfig, dataSource)
        createKtorApplication(webappConfig, dataSource)
    }.start(wait = true)
}


// Local suspend functions for coroutine test - no HTTP calls needed
suspend fun getRandomNumber(): String {
    val num = (200L..2000L).random()
    delay(num)
    return num.toString()
}

suspend fun reverseText(text: String): String {
    return text.reversed()
}

suspend fun pingService(): String {
    return "pong"
}

suspend fun handleCoroutineTest(
    dbSess: Session
): TextWebResponse {
    // Call local functions instead of making HTTP calls
    val randomNumber = getRandomNumber()
    val reversed = reverseText(randomNumber)
    
    val pingResult = pingService()
    
    val queryResult = withContext(Dispatchers.IO) {
        dbSess.single(
            queryOf(
                "SELECT count(*) count from user_t WHERE email != ?",
                pingResult
            ),
            ::mapFromRow
        )
    }
    
    return TextWebResponse("""
        Random number: $randomNumber
        Reversed: $reversed
        Query: $queryResult
    """.trimIndent())
}

