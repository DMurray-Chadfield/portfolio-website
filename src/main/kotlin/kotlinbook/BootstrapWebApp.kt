package kotlinbook

import io.ktor.server.application.ApplicationStarting
import io.ktor.server.engine.BaseApplicationResponse
import io.ktor.server.engine.applicationEngineEnvironment
import io.ktor.server.engine.defaultEnginePipeline
import io.ktor.server.engine.installDefaultTransformations
import io.ktor.server.servlet.ServletApplicationEngine
import kotlinbook.db.datasource.createAndMigrateDataSource
import org.slf4j.LoggerFactory
import javax.servlet.annotation.WebListener
import javax.servlet.ServletContextEvent
import javax.servlet.ServletContextListener

private val log = LoggerFactory.getLogger("kotlinbook.BootstrapWebAppKt")

@WebListener
class BootstrapWebApp : ServletContextListener {
    override fun contextInitialized(sce: ServletContextEvent) {
        val ctx = sce.servletContext
        log.debug("Extracting config")
        val appConfig = ctx.getAttribute(
            "appConfig"
        ) as WebappConfig
        log.debug("Setting up data source")
        val dataSource = createAndMigrateDataSource(appConfig)

        log.debug("Setting up Ktor servlet environment")
        val appEngineEnvironment = applicationEngineEnvironment {
            module {
                createKtorApplication(appConfig, dataSource)
            }
        }
        val appEnginePipeline = defaultEnginePipeline(
            appEngineEnvironment
        )
        BaseApplicationResponse.setupSendPipeline(
            appEnginePipeline.sendPipeline
        )
        appEngineEnvironment.monitor.subscribe(
            ApplicationStarting
        ) {
            it.receivePipeline.merge(appEnginePipeline.receivePipeline)
            it.sendPipeline.merge(appEnginePipeline.sendPipeline)
            it.receivePipeline.installDefaultTransformations()
            it.sendPipeline.installDefaultTransformations()
        }
        ctx.setAttribute(
            ServletApplicationEngine
                .ApplicationEngineEnvironmentAttributeKey,
            appEngineEnvironment
        )

        log.debug("Setting up Ktor servlet")
        ctx.addServlet(
            "ktorServlet",
            ServletApplicationEngine::class.java
        ).apply {
            addMapping("/")
        }
    }

    override fun contextDestroyed(sce: ServletContextEvent) {
    }
}
