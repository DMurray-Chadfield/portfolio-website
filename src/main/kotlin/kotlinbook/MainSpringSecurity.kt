package kotlinbook

import org.eclipse.jetty.server.HttpConnectionFactory
import org.eclipse.jetty.server.Server
import org.eclipse.jetty.server.ServerConnector
import org.eclipse.jetty.servlet.ListenerHolder
import org.eclipse.jetty.servlet.ServletContextHandler


fun main() {
    val appConfig = createAppConfig(
        System.getenv("KOTLINBOOK_ENV") ?: "local"
    )

    val server = Server()
    val connector = ServerConnector(
        server,
        HttpConnectionFactory()
    )
    connector.port = appConfig.httpPort
    server.addConnector(connector)
    server.handler = ServletContextHandler(
        ServletContextHandler.SESSIONS
    ).apply {
        contextPath = "/"
        resourceBase = System.getProperty("java.io.tmpdir")
        servletContext.setAttribute("appConfig", appConfig)
        servletHandler.addListener(
            ListenerHolder(BootstrapWebApp::class.java)
        )
    }
    server.start()
    server.join()
}