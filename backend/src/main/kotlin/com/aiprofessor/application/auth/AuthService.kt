package com.aiprofessor.application.auth

import com.aiprofessor.domain.exception.InvalidCredentialsException
import com.aiprofessor.domain.exception.MaxSessionsExceededException
import com.aiprofessor.domain.exception.UserNotActiveException
import com.aiprofessor.domain.exception.UserNotFoundException
import com.aiprofessor.domain.session.SessionRepository
import com.aiprofessor.domain.session.UserSession
import com.aiprofessor.domain.user.User
import com.aiprofessor.domain.user.UserRepository
import com.aiprofessor.infrastructure.email.EmailService
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val sessionRepository: SessionRepository,
    private val jwtService: JwtService,
    private val passwordEncoder: PasswordEncoder,
    private val emailService: EmailService,
    @Value("\${session.max-concurrent-sessions}") private val maxConcurrentSessions: Int,
    @Value("\${jwt.secret}") private val jwtSecret: String,
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

        if (!user.isActive) {
            throw UserNotActiveException()
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

    fun register(
        username: String,
        password: String,
        email: String,
    ): RegisterResponse {
        // Check if username already exists
        if (userRepository.existsByUsername(username)) {
            throw IllegalArgumentException("Username already exists")
        }

        // Encode password
        val encodedPassword = passwordEncoder.encode(password)

        // Create user with isActive = false (will be activated after email verification)
        val user =
            User(
                username = username,
                password = encodedPassword,
                email = email,
                isActive = false,
            )

        val savedUser = userRepository.save(user)

        // Calculate expiry time (24 hours from now)
        val expiryTime = java.time.LocalDateTime.now().plusHours(24)

        // Generate email verification token (expiry time is embedded in the token)
        val verificationToken = generateVerificationToken(username, expiryTime)

        // Send verification email
        try {
            emailService.sendVerificationEmail(email, username, verificationToken)
        } catch (e: Exception) {
            // Log error but don't fail registration
            // User can request a new verification email later
            println("Failed to send verification email: ${e.message}")
        }

        return RegisterResponse(
            userId = savedUser.id!!,
            username = savedUser.username,
            email = savedUser.email,
        )
    }

    fun verifyEmail(token: String): Boolean {
        println("Received token for verification: $token")
        println("Token length: ${token.length}")

        // Decrypt token to extract username and expiry time
        val decryptedData = decryptVerificationToken(token)
        if (decryptedData == null) {
            println("Failed to decrypt verification token")
            throw IllegalArgumentException("Invalid verification token")
        }

        val (username, expiryTime) = decryptedData
        println("Decrypted username: $username, expiryTime: $expiryTime")

        // Check if token has expired (token contains the expiry time)
        if (expiryTime.isBefore(java.time.LocalDateTime.now())) {
            println("Token has expired: $expiryTime < ${java.time.LocalDateTime.now()}")
            throw IllegalArgumentException("Verification token has expired")
        }

        // Find user by username
        val user = userRepository.findByUsername(username)
        if (user == null) {
            println("User not found: $username")
            throw IllegalArgumentException("User not found")
        }

        println("Found user: ${user.username}, isActive: ${user.isActive}")

        // Check if user is already active
        if (user.isActive) {
            println("User is already active")
            throw IllegalArgumentException("Email already verified")
        }

        // Activate user
        println("Activating user: ${user.username}")
        user.isActive = true
        user.updatedAt = java.time.LocalDateTime.now()

        userRepository.save(user)
        println("User activated successfully")

        return true
    }

    private fun generateVerificationToken(
        username: String,
        expiryTime: java.time.LocalDateTime,
    ): String {
        // Prepare data to encrypt: username:expiryTime
        val dataToEncrypt = "$username:$expiryTime"

        // Generate AES-256 key from JWT secret using SHA-256
        val keyBytes = MessageDigest.getInstance("SHA-256").digest(jwtSecret.toByteArray())
        val secretKey = SecretKeySpec(keyBytes, "AES")

        // Generate random IV (16 bytes for AES)
        val iv = ByteArray(16)
        SecureRandom().nextBytes(iv)
        val ivSpec = IvParameterSpec(iv)

        // Encrypt using AES-256-CBC
        val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec)
        val encrypted = cipher.doFinal(dataToEncrypt.toByteArray())

        // Combine IV and encrypted data, then encode to Base64 URL-safe
        val combined = iv + encrypted
        return Base64.getUrlEncoder().withoutPadding().encodeToString(combined)
    }

    private fun decryptVerificationToken(token: String): Pair<String, java.time.LocalDateTime>? {
        return try {
            // Decode from Base64
            val combined = Base64.getUrlDecoder().decode(token)

            // Extract IV (first 16 bytes) and encrypted data
            if (combined.size < 16) {
                println("Token too short: ${combined.size} bytes")
                return null
            }
            val iv = combined.copyOfRange(0, 16)
            val encrypted = combined.copyOfRange(16, combined.size)

            // Generate AES-256 key from JWT secret using SHA-256
            val keyBytes = MessageDigest.getInstance("SHA-256").digest(jwtSecret.toByteArray())
            val secretKey = SecretKeySpec(keyBytes, "AES")
            val ivSpec = IvParameterSpec(iv)

            // Decrypt using AES-256-CBC
            val cipher = Cipher.getInstance("AES/CBC/PKCS5Padding")
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec)
            val decrypted = cipher.doFinal(encrypted)
            val decryptedString = String(decrypted)

            // Parse username:expiryTime
            val parts = decryptedString.split(":")
            if (parts.size < 2) {
                println("Invalid decrypted format: $decryptedString")
                return null
            }

            val username = parts[0]
            val expiryTimeString = parts.drop(1).joinToString(":") // Handle colons in datetime
            val expiryTime = java.time.LocalDateTime.parse(expiryTimeString)

            username to expiryTime
        } catch (e: Exception) {
            println("Failed to decrypt token: ${e.javaClass.simpleName} - ${e.message}")
            e.printStackTrace()
            null
        }
    }

    fun getUserInfo(userId: Long): UserInfoResponse {
        val user = userRepository.findById(userId) ?: throw UserNotFoundException()

        return UserInfoResponse(
            userId = user.id!!,
            username = user.username,
            email = user.email,
            isActive = user.isActive,
            createdAt = user.createdAt,
            updatedAt = user.updatedAt,
        )
    }

    fun deleteUser(userId: Long) {
        val user = userRepository.findById(userId) ?: throw UserNotFoundException()

        // Delete all active sessions for this user
        sessionRepository.findByUserId(userId).forEach { session ->
            sessionRepository.deleteByToken(session.token)
        }

        // Hard delete: remove user from database
        userRepository.delete(user)
    }
}

data class LoginResponse(
    val token: String,
    val userId: Long,
    val username: String,
)

data class RegisterResponse(
    val userId: Long,
    val username: String,
    val email: String,
)

data class UserInfoResponse(
    val userId: Long,
    val username: String,
    val email: String,
    val isActive: Boolean,
    val createdAt: java.time.LocalDateTime,
    val updatedAt: java.time.LocalDateTime,
)
