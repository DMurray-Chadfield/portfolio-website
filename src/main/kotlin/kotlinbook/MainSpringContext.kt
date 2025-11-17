package kotlinbook

import com.zaxxer.hikari.HikariDataSource
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import kotlinbook.db.datasource.MigratedDataSourceFactoryBean
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.config.BeanDefinitionCustomizer
import org.springframework.beans.factory.config.RuntimeBeanReference
import org.springframework.context.support.StaticApplicationContext
import javax.sql.DataSource

private val log = LoggerFactory.getLogger("kotlinbook.MainSpringContextKt")

fun main() {
    log.debug("Starting application...")
    val env = System.getenv("KOTLINBOOK_ENV") ?: "local"
    log.debug("Application runs in the environment ${env}")
    val config = createAppConfig(env)
    log.debug("Creating app context")
    val ctx = createApplicationContext(config)
    log.debug("Getting data source")
    val dataSource =
        ctx.getBean("dataSource", DataSource::class.java)
    embeddedServer(Netty, port = config.httpPort) {
        setUpKtorCookieSecurity(config, dataSource)
        createKtorApplication(config, dataSource)
    }.start(wait = true)
}

fun createApplicationContext(appConfig: WebappConfig) =
    StaticApplicationContext().apply {
        beanFactory.registerSingleton("appConfig", appConfig)
        registerBean(
            "unmigratedDataSource",
            HikariDataSource::class.java,
            BeanDefinitionCustomizer { bd ->
                bd.propertyValues.apply {
                    add("jdbcUrl", appConfig.dbUrl)
                    add("username", appConfig.dbUser)
                    add("password", appConfig.dbPassword)
                }
            }
        )
        registerBean(
            "dataSource",
            MigratedDataSourceFactoryBean::class.java,
            BeanDefinitionCustomizer { bd ->
                bd.propertyValues.apply {
                    add(
                        "unmigratedDataSource",
                        RuntimeBeanReference("unmigratedDataSource")
                    )
                }
            }
        )
        refresh()
        registerShutdownHook()
    }