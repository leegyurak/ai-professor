package com.aiprofessor.infrastructure.security

import com.aiprofessor.application.auth.JwtService
import com.aiprofessor.domain.session.SessionRepository
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService,
    private val sessionRepository: SessionRepository,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val authHeader = request.getHeader("Authorization")

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response)
            return
        }

        val token = authHeader.substring(7)

        try {
            if (jwtService.validateToken(token) && sessionRepository.findByToken(token) != null) {
                val userId = jwtService.getUserIdFromToken(token)
                val username = jwtService.getUsernameFromToken(token)

                if (userId != null && username != null) {
                    val authentication =
                        UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            emptyList(),
                        )
                    authentication.details = WebAuthenticationDetailsSource().buildDetails(request)
                    SecurityContextHolder.getContext().authentication = authentication
                }
            }
        } catch (e: Exception) {
            logger.error("Cannot set user authentication", e)
        }

        filterChain.doFilter(request, response)
    }
}
