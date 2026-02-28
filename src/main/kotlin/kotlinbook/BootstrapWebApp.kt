package kotlinbook

import io.ktor.server.application.ApplicationStarting
import io.ktor.server.engine.BaseApplicationResponse
import io.ktor.server.engine.applicationEngineEnvironment
import io.ktor.server.engine.defaultEnginePipeline
import io.ktor.server.engine.installDefaultTransformations
import io.ktor.server.servlet.ServletApplicationEngine
import kotlinbook.db.datasource.createAndMigrateDataSource
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.support.DefaultListableBeanFactory
import org.springframework.context.annotation.AnnotatedBeanDefinitionReader
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl
import org.springframework.web.context.support.AbstractRefreshableWebApplicationContext
import org.springframework.web.filter.DelegatingFilterProxy
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

        log.debug("Setting up Spring Security")
        val roleHierarchy = """
  ROLE_ADMIN > ROLE_USER
"""
        val wac = object : AbstractRefreshableWebApplicationContext() {
            override fun loadBeanDefinitions(
                beanFactory: DefaultListableBeanFactory
            ) {
                beanFactory.registerSingleton(
                    "dataSource",
                    dataSource
                )
                beanFactory.registerSingleton(
                    "rememberMeKey",
                    appConfig.rememberMeKey
                )
                beanFactory.registerSingleton(
                    "roleHierarchy",
                    RoleHierarchyImpl().apply {
                        setHierarchy(roleHierarchy)
                    }
                )
                AnnotatedBeanDefinitionReader(beanFactory)
                    .register(WebappSecurityConfig::class.java)
            }
        }

        wac.servletContext = ctx
        ctx.addFilter(
            "springSecurityFilterChain",
            DelegatingFilterProxy("springSecurityFilterChain", wac)
        ).apply {
            addMappingForServletNames(null, false, "ktorServlet")
        }
    }

    override fun contextDestroyed(sce: ServletContextEvent) {
    }
}
