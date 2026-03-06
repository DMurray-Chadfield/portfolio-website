package kotlinbook

import arrow.core.continuations.either
import com.google.gson.Gson
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.auth.Authentication
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.principal
import io.ktor.server.auth.session
import io.ktor.server.html.respondHtml
import io.ktor.server.http.content.singlePageApplication
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.request.receiveParameters
import io.ktor.server.request.receiveText
import io.ktor.server.response.respondRedirect
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import io.ktor.server.sessions.SessionTransportTransformerEncrypt
import io.ktor.server.sessions.Sessions
import io.ktor.server.sessions.clear
import io.ktor.server.sessions.cookie
import io.ktor.server.sessions.get
import io.ktor.server.sessions.maxAge
import io.ktor.server.sessions.sessions
import io.ktor.server.sessions.set
import io.ktor.util.hex
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
import kotlinx.html.ButtonType
import kotlinx.html.FormMethod
import kotlinx.html.InputType
import kotlinx.html.a
import kotlinx.html.body
import kotlinx.html.button
import kotlinx.html.form
import kotlinx.html.h1
import kotlinx.html.head
import kotlinx.html.input
import kotlinx.html.label
import kotlinx.html.p
import kotlinx.html.styleLink
import kotlinx.html.title
import kotliquery.queryOf
import kotliquery.sessionOf
import org.slf4j.LoggerFactory
import javax.sql.DataSource
import kotlin.collections.get
import kotlin.time.Duration

private val log = LoggerFactory.getLogger("kotlinbook.KtorKt")

private data class LoginApiBody(
    val email: String? = null,
    val password: String? = null
)

fun Application.createKtorApplication(webappConfig: WebappConfig, dataSource: DataSource) {
    install(StatusPages) {
        exception<Throwable> { call, cause ->
            log.error("An unknown error occurred", cause)

            call.respondText(
                text = "500: $cause",
                status = HttpStatusCode.InternalServerError
            )
        }
    }

    routing {
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

        get("/legacy-login", webResponse {
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

        post("/test_json", webResponse {
            either<ValidationError, User> {
                val input = Gson().fromJson(
                    call.receiveText(), Map::class.java
                )
                User(
                    email = validateEmail(input["email"]).bind(),
                    password = validatePassword(input["password"]).bind()
                )
            }.fold(
                { err ->
                    JsonWebResponse(
                        mapOf("error" to err.error),
                        statusCode = 422
                    )
                },
                { user ->
                    JsonWebResponse(mapOf("success" to true))
                }
            )
        })

        post("/api/login", webResponseDb(dataSource) { dbSess ->
            val input = runCatching {
                Gson().fromJson(
                    call.receiveText(),
                    LoginApiBody::class.java
                )
            }.getOrNull()
            if (input == null) {
                return@webResponseDb JsonWebResponse(
                    mapOf(
                        "success" to false,
                        "error" to "Invalid request payload"
                    ),
                    statusCode = 400
                )
            }
            val email = input.email?.trim()
            val password = input.password

            if (email.isNullOrBlank() || password.isNullOrBlank()) {
                JsonWebResponse(
                    mapOf(
                        "success" to false,
                        "error" to "Email and password are required"
                    ),
                    statusCode = 400
                )
            } else {
                val userId = authenticateUser(
                    dbSess,
                    email,
                    password
                )

                if (userId == null) {
                    JsonWebResponse(
                        mapOf(
                            "success" to false,
                            "error" to "Invalid credentials"
                        ),
                        statusCode = 401
                    )
                } else {
                    call.sessions.set(UserSession(userId = userId))
                    JsonWebResponse(
                        mapOf(
                            "success" to true,
                            "userId" to userId
                        )
                    )
                }
            }
        })

        get("/api/me", webResponseDb(dataSource) { dbSess ->
            val userSession = call.sessions.get<UserSession>()
            if (userSession == null) {
                JsonWebResponse(
                    mapOf(
                        "success" to false,
                        "error" to "Unauthorized"
                    ),
                    statusCode = 401
                )
            } else {
                val user = getUser(dbSess, userSession.userId)
                if (user == null) {
                    call.sessions.clear<UserSession>()
                    JsonWebResponse(
                        mapOf(
                            "success" to false,
                            "error" to "Unauthorized"
                        ),
                        statusCode = 401
                    )
                } else {
                    JsonWebResponse(
                        mapOf(
                            "success" to true,
                            "user" to mapOf(
                                "email" to user.email,
                                "name" to user.name
                            )
                        )
                    )
                }
            }
        })

        post("/api/logout", webResponse {
            call.sessions.clear<UserSession>()
            JsonWebResponse(mapOf("success" to true))
        })

        singlePageApplication {
            if (webappConfig.useFileSystemAssets) {
                filesPath = "src/main/resources/public"
            } else {
                useResources = true
                filesPath = "public"
            }
            defaultPage = "index.html"
        }
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
                call.respondRedirect("/legacy-login")
            }
        }
    }

    routing {
        post("/login") {
            sessionOf(dataSource).use { dbSess ->
                val params = call.receiveParameters()
                val userId = authenticateUser(
                    dbSess,
                    params["username"]!!,
                    params["password"]!!
                )

                if (userId == null) {
                    call.respondRedirect("/legacy-login")
                } else {
                    call.sessions.set(UserSession(userId = userId))
                    call.respondRedirect("/secret")
                }
            }
        }

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

        authenticate("auth-session") {
            get("/logout") {
                call.sessions.clear<UserSession>()
                call.respondRedirect("/legacy-login")
            }
        }
    }
}
