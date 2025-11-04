package kotlinbook

import com.zaxxer.hikari.HikariDataSource
import kotlinbook.db.datasource.MigratedDataSourceFactoryBean
import org.springframework.beans.factory.config.BeanDefinitionCustomizer
import org.springframework.beans.factory.config.RuntimeBeanReference
import org.springframework.context.support.StaticApplicationContext

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