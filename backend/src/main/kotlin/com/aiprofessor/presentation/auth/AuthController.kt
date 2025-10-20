package com.aiprofessor.presentation.auth

import com.aiprofessor.application.auth.AuthService
import com.aiprofessor.application.auth.LoginResponse
import com.aiprofessor.application.auth.RegisterResponse
import com.aiprofessor.application.auth.UserInfoResponse
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService,
) {
    @PostMapping("/register")
    fun register(
        @Valid @RequestBody request: RegisterRequest,
    ): ResponseEntity<RegisterResponse> {
        val response = authService.register(request.username, request.password, request.email)
        return ResponseEntity.status(HttpStatus.CREATED).body(response)
    }

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

    @GetMapping("/me")
    fun getMyInfo(): ResponseEntity<UserInfoResponse> {
        val userId = getCurrentUserId()
        val response = authService.getUserInfo(userId)
        return ResponseEntity.ok(response)
    }

    @DeleteMapping("/me")
    fun deleteAccount(): ResponseEntity<Unit> {
        val userId = getCurrentUserId()
        authService.deleteUser(userId)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/verify-email")
    fun verifyEmail(
        @RequestParam token: String,
    ): ResponseEntity<VerifyEmailResponse> {
        val success = authService.verifyEmail(token)
        return ResponseEntity.ok(VerifyEmailResponse(success = success, message = "이메일 인증이 완료되었습니다. 이제 로그인하실 수 있습니다."))
    }

    private fun getCurrentUserId(): Long {
        val authentication = SecurityContextHolder.getContext().authentication
        return when (val principal = authentication.principal) {
            is Long -> principal
            is String -> principal.toLong()
            else -> throw IllegalStateException("Invalid principal type: ${principal::class.java}")
        }
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

data class RegisterRequest(
    @field:NotBlank(message = "Username is required")
    val username: String,
    @field:NotBlank(message = "Password is required")
    val password: String,
    @field:NotBlank(message = "Email is required")
    @field:Email(message = "Email should be valid")
    val email: String,
)

data class LoginRequest(
    @field:NotBlank(message = "Username is required")
    val username: String,
    @field:NotBlank(message = "Password is required")
    val password: String,
    @field:NotBlank(message = "MAC address is required")
    val macAddress: String,
)

data class VerifyEmailResponse(
    val success: Boolean,
    val message: String,
)
