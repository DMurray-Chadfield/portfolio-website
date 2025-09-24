package kotlinbook

import com.typesafe.config.ConfigFactory

data class WebappConfig(
    val httpPort: Int,
    val projectRoot: String,
    val htmlLocation: String,
    val dbUser: String,
    val dbPassword: String,
    val dbUrl: String,
    val useFileSystemAssets: Boolean,
    val useSecureCookie: Boolean,
    val cookieEncryptionKey: String,
    val cookieSigningKey: String
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
                dbUser = it.getString("dbUser"),
                dbPassword = it.getString("dbPassword"),
                dbUrl = it.getString("dbUrl"),
                useFileSystemAssets = it.getBoolean("useFileSystemAssets"),
                useSecureCookie = it.getBoolean("useSecureCookie"),
                cookieEncryptionKey = it.getString("cookieEncryptionKey"),
                cookieSigningKey = it.getString("cookieSigningKey")
            )
        }

