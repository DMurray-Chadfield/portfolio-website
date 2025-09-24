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
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.principal
import io.ktor.server.auth.session
import io.ktor.server.html.respondHtml
import io.ktor.server.http.content.files
import io.ktor.server.http.content.resources
import io.ktor.server.http.content.static
import io.ktor.server.request.receiveParameters
import io.ktor.server.request.receiveText
import io.ktor.server.sessions.SessionTransportTransformerEncrypt
import io.ktor.server.sessions.Sessions
import io.ktor.server.sessions.cookie
import io.ktor.server.sessions.maxAge
import io.ktor.server.sessions.sessions
import io.ktor.server.sessions.set
import io.ktor.util.hex
import jdk.nashorn.internal.objects.NativeJava.type
import javax.sql.DataSource
import org.flywaydb.core.Flyway
import kotlinbook.db.datasource.createAndMigrateDataSource
import kotlinbook.db.getUser
import kotlinbook.db.mapFromRow
import kotlinbook.web.html.AppLayout
import kotlinbook.web.response.HtmlWebResponse
import kotlinbook.web.response.JsonWebResponse
import kotlinbook.web.response.TextWebResponse
import kotlinbook.web.webResponse
import kotlinbook.web.webResponseDb
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
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
import kotliquery.Row
import kotliquery.Session
import kotliquery.TransactionalSession
import kotliquery.queryOf
import kotliquery.sessionOf
import kotlin.time.Duration

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

    embeddedServer(Netty, port = 9876) {
        routing {
            get("/random_number", webResponse {
                val num = (200L..2000L).random()
                delay(num)
                TextWebResponse(num.toString())
            })

            get("/ping", webResponse {
                TextWebResponse("pong")
            })

            post("/reverse", webResponse {
                TextWebResponse(call.receiveText().reversed())
            })
        }
    }.start(wait = false)

    embeddedServer(Netty, port = webappConfig.httpPort) {
        setUpKtorCookieSecurity(webappConfig, dataSource)
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

        get("/coroutine_test", webResponseDb(dataSource) { dbSess ->
            handleCoroutineTest(dbSess)
        })

        get("/html_test") {
            call.respondHtml {
                head {
                    title("Hello, World!")
                    styleLink("/app.css")
                }
                body {
                    h1 { +"Hello, World!" }
                }

            }
        }

        get("/html_webresponse_test", webResponse {
            HtmlWebResponse(AppLayout("Hello, World!").apply {
                pageBody {
                    h1 {
                        +"Hello, readers!"
                    }
                }
            })
        })

        get("/login", webResponse {
            HtmlWebResponse(AppLayout("Log in").apply {
                pageBody {
                    form(method = FormMethod.post, action = "/login") {
                        p {
                            label { +"E-mail" }
                            input(type = InputType.text, name = "username")
                        }
                        p {
                            label { +"Password" }
                            input(type = InputType.password, name = "password")
                        }

                        button(type = ButtonType.submit) { +"Log in" }
                    }
                }
            })
        })

        authenticate("auth-session") {
            get("/secret", webResponseDb(dataSource) { dbSess ->
                val userSession = call.principal<UserSession>()!!
                val user = getUser(dbSess, userSession.userId)!!

                HtmlWebResponse(
                    AppLayout("Welcome, ${user.email}").apply {
                        pageBody {
                            h1 {
                                +"Hello there, ${user.email}"
                            }
                            p { +"You're logged in." }
                            p {
                                a(href = "/logout") { +"Log out" }
                            }
                        }
                    }
                )
            })
        }

        static("/") {
            if (webappConfig.useFileSystemAssets) {
                files("src/main/resources/public")
            } else {
                resources("public")
            }
        }
/*        get("/") {
            call.respondFile(
                File(webappConfig.projectRoot + webappConfig.htmlLocation),
                "index.html"
            )
        }
 */
    }
}

fun Application.setUpKtorCookieSecurity(
    appConfig: WebappConfig,
    dataSource: DataSource
) {
    install(Sessions) {
        cookie<UserSession>("user-session") {
            transform(
                SessionTransportTransformerEncrypt(
                    hex(appConfig.cookieEncryptionKey),
                    hex(appConfig.cookieSigningKey)
                )
            )
            cookie.maxAge = Duration.parse("7d")
            cookie.httpOnly = true
            cookie.path = "/"
            cookie.secure = appConfig.useSecureCookie
            cookie.extensions["SameSite"] = "lax"
        }
    }

    install(Authentication) {
        session<UserSession>("auth-session") {
            validate{ session ->
                session
            }
            challenge {
                call.respondRedirect("/login")
            }
        }
    }

    routing {
        post("/login") {
            sessionOf(kotlinbook.dataSource).use { dbSess ->
                val params = call.receiveParameters()
                val userId = authenticateUser(
                    dbSess,
                    params["username"]!!,
                    params["password"]!!
                )

                if (userId == null) {
                    call.respondRedirect("/login")
                } else {
                    call.sessions.set(UserSession(userId = userId))
                    call.respondRedirect("/secret")
                }
            }
        }
    }
}

suspend fun handleCoroutineTest(
    dbSess: Session
) = coroutineScope {
    val client = HttpClient(CIO)

    val randomNumberRequest = async {
        client.get("http://localhost:9876/random_number").bodyAsText()
    }

    val reverseRequest = async {
        client.post("http://localhost:9876/reverse") {
            setBody(randomNumberRequest.await())
        }.bodyAsText()
    }

    val queryOperation = async {
        val pingPong = client.get("http://localhost:9876/ping").bodyAsText()

        withContext(Dispatchers.IO)
        {
            dbSess.single(
                queryOf(
                    "SELECT count(*) count from user_t WHERE email != ?",
                    pingPong
                ),
                ::mapFromRow
            )
        }
    }
    TextWebResponse("""
        Random number: ${randomNumberRequest.await()}
        Reversed: ${reverseRequest.await()}
        Query: ${queryOperation.await()}
    """)
}


