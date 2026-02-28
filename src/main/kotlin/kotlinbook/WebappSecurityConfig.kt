package kotlinbook

import kotliquery.sessionOf
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.context.annotation.Bean
import org.springframework.security.access.hierarchicalroles.RoleHierarchy
import org.springframework.security.authentication.AuthenticationProvider
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.User
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.core.Authentication
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.access.expression.DefaultWebSecurityExpressionHandler
import org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices
import org.springframework.security.web.util.matcher.AntPathRequestMatcher
import javax.sql.DataSource

@Configuration
@EnableWebSecurity
open class WebappSecurityConfig {
    @Autowired
    lateinit var dataSource: DataSource

    @Autowired
    lateinit var roleHierarchy: RoleHierarchy

    @Autowired
    lateinit var rememberMeKey: String

    @Autowired
    lateinit var userDetailsService: UserDetailsService

    @Bean
    open fun userDetailsService() =
        UserDetailsService { userName ->
            User(userName, "{noop}", listOf())
        }

    @Bean
    open fun filterChain(
        http: HttpSecurity
    ): SecurityFilterChain {
        http.authenticationProvider(object: AuthenticationProvider {
            override fun authenticate(
                auth: Authentication
            ): Authentication? {
                val username = auth.principal as String
                val password = auth.credentials as String

                val userId = sessionOf(dataSource).use { dbSess ->
                    authenticateUser(dbSess, username, password)
                }

                if (userId != null) {
                    return UsernamePasswordAuthenticationToken(
                        username,
                        password,
                        listOf(SimpleGrantedAuthority("ROLE_USER"))
                    )
                }

                if (username == "quentin" && password == "test") {
                    return UsernamePasswordAuthenticationToken(
                        username,
                        password,
                        listOf(SimpleGrantedAuthority("ROLE_ADMIN"))
                    )
                }

                return null
            }

            override fun supports(authentication: Class<*>) =
                authentication ==
                        UsernamePasswordAuthenticationToken::class.java
        })
            .authorizeRequests()
            .expressionHandler(
                DefaultWebSecurityExpressionHandler().apply {
                    setRoleHierarchy(roleHierarchy)
                }
            )
            .antMatchers("/login").permitAll()
            .antMatchers("/coroutine_test").permitAll()
            .antMatchers("/admin/**").hasRole("ADMIN")
            .antMatchers("/**").hasRole("USER")
            .anyRequest().authenticated()
            .and().formLogin()
            .and()
            .rememberMe()
            .key(rememberMeKey)
            .rememberMeServices(
                TokenBasedRememberMeServices(
                    rememberMeKey,
                    userDetailsService
                ).apply {
                    setCookieName("REMEMBER_ME_KOTLINBOOK")
                }
            )
            .and()
            .logout()
            .logoutRequestMatcher(
                AntPathRequestMatcher("/logout")
            )

        return http.build()
    }
}