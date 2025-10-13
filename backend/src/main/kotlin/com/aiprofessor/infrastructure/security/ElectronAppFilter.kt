package com.aiprofessor.infrastructure.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class ElectronAppFilter(
    @Value("\${spring.profiles.active:dev}") private val activeProfile: String,
    @Value("\${app.electron.token:}") private val electronToken: String,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        // Only validate in production
        if (activeProfile == "prod") {
            val appToken = request.getHeader("X-App-Token")
            val origin = request.getHeader("Origin")

            // Check if request is from Electron app
            val isElectronApp =
                (appToken != null && appToken == electronToken) ||
                    (origin != null && (origin.startsWith("app://") || origin.startsWith("file://")))

            if (!isElectronApp && !isPublicEndpoint(request)) {
                response.status = HttpServletResponse.SC_FORBIDDEN
                response.writer.write("Access denied: Only Electron app is allowed")
                return
            }
        }

        filterChain.doFilter(request, response)
    }

    private fun isPublicEndpoint(request: HttpServletRequest): Boolean {
        val path = request.requestURI
        // Allow health check or other public endpoints if needed
        return path.startsWith("/actuator/health")
    }
}
