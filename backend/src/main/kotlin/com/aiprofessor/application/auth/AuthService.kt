package com.aiprofessor.application.auth

import com.aiprofessor.domain.exception.InvalidCredentialsException
import com.aiprofessor.domain.exception.MaxSessionsExceededException
import com.aiprofessor.domain.session.SessionRepository
import com.aiprofessor.domain.session.UserSession
import com.aiprofessor.domain.user.UserRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val sessionRepository: SessionRepository,
    private val jwtService: JwtService,
    private val passwordEncoder: PasswordEncoder,
    @Value("\${session.max-concurrent-sessions}") private val maxConcurrentSessions: Int,
) {
    fun login(
        username: String,
        password: String,
        ipAddress: String,
        macAddress: String,
    ): LoginResponse {
        val user =
            userRepository.findByUsername(username)
                ?: throw InvalidCredentialsException()

        if (!passwordEncoder.matches(password, user.password)) {
            throw InvalidCredentialsException()
        }

        // Check concurrent sessions
        val currentSessions = sessionRepository.findByUserId(user.id!!)
        if (currentSessions.size >= maxConcurrentSessions) {
            // Check if same IP/MAC exists
            val sameIpCount = sessionRepository.countByUserIdAndIpAddress(user.id, ipAddress)
            val sameMacCount = sessionRepository.countByUserIdAndMacAddress(user.id, macAddress)

            if (sameIpCount == 0 && sameMacCount == 0) {
                // No existing session from same IP/MAC, reject login
                throw MaxSessionsExceededException()
            }
            // If same IP or MAC exists, allow login and let new session replace old one
        }

        val token = jwtService.generateToken(user.id, user.username)

        val session =
            UserSession(
                userId = user.id,
                token = token,
                ipAddress = ipAddress,
                macAddress = macAddress,
            )

        sessionRepository.save(session)

        return LoginResponse(token = token, userId = user.id, username = user.username)
    }

    fun logout(token: String) {
        sessionRepository.deleteByToken(token)
    }

    fun validateToken(token: String): Boolean = jwtService.validateToken(token) && sessionRepository.findByToken(token) != null

    fun getUserIdFromToken(token: String): Long? = jwtService.getUserIdFromToken(token)
}

data class LoginResponse(
    val token: String,
    val userId: Long,
    val username: String,
)
