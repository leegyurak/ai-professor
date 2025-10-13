package com.aiprofessor.presentation.auth

import com.aiprofessor.application.auth.AuthService
import com.aiprofessor.application.auth.LoginResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
) {
    @PostMapping("/login")
    fun login(
        @Valid @RequestBody request: LoginRequest,
        httpRequest: HttpServletRequest,
    ): ResponseEntity<LoginResponse> {
        val ipAddress = getClientIpAddress(httpRequest)
        val macAddress = request.macAddress

        val response = authService.login(request.username, request.password, ipAddress, macAddress)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/logout")
    fun logout(
        @RequestHeader("Authorization") authHeader: String,
    ): ResponseEntity<Unit> {
        val token = authHeader.substring(7)
        authService.logout(token)
        return ResponseEntity.ok().build()
    }

    private fun getClientIpAddress(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (xForwardedFor != null && xForwardedFor.isNotEmpty()) {
            return xForwardedFor.split(",")[0].trim()
        }

        val xRealIp = request.getHeader("X-Real-IP")
        if (xRealIp != null && xRealIp.isNotEmpty()) {
            return xRealIp
        }

        return request.remoteAddr
    }
}

data class LoginRequest(
    @field:NotBlank(message = "Username is required")
    val username: String,
    @field:NotBlank(message = "Password is required")
    val password: String,
    @field:NotBlank(message = "MAC address is required")
    val macAddress: String,
)
