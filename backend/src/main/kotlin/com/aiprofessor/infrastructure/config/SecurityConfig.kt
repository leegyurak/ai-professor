package com.aiprofessor.infrastructure.config

import com.aiprofessor.infrastructure.security.ElectronAppFilter
import com.aiprofessor.infrastructure.security.JwtAuthenticationFilter
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtAuthenticationFilter: JwtAuthenticationFilter,
    private val electronAppFilter: ElectronAppFilter,
    @Value("\${spring.profiles.active:dev}") private val activeProfile: String,
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .anyRequest().authenticated()
            }
            .addFilterBefore(electronAppFilter, UsernamePasswordAuthenticationFilter::class.java)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)

        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()

        when (activeProfile) {
            "dev", "test" -> {
                // Development and Test: Allow all origins
                configuration.allowedOriginPatterns = listOf("*")
                configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                configuration.allowedHeaders = listOf("*")
                configuration.allowCredentials = true
                configuration.maxAge = 3600L
            }
            "prod" -> {
                // Production: Allow Electron app and ai-professor.me domain
                // Electron app should send requests with custom origin
                configuration.allowedOriginPatterns = listOf("app://*", "file://*", "https://ai-professor.me", "https://*.ai-professor.me")
                configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                configuration.allowedHeaders = listOf("Authorization", "Content-Type", "X-App-Token")
                configuration.allowCredentials = true
                configuration.maxAge = 3600L
            }
            else -> {
                // Default: Same as dev
                configuration.allowedOriginPatterns = listOf("*")
                configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                configuration.allowedHeaders = listOf("*")
                configuration.allowCredentials = true
                configuration.maxAge = 3600L
            }
        }

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()
}
