package com.aiprofessor.application.auth

import com.aiprofessor.IntegrationTestBase
import com.aiprofessor.domain.exception.InvalidCredentialsException
import com.aiprofessor.domain.exception.UserNotActiveException
import com.aiprofessor.domain.session.SessionRepository
import com.aiprofessor.domain.user.User
import com.aiprofessor.domain.user.UserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.security.crypto.password.PasswordEncoder

class AuthServiceTest
    @Autowired
    constructor(
        private val authService: AuthService,
        private val userRepository: UserRepository,
        private val passwordEncoder: PasswordEncoder,
        private val sessionRepository: SessionRepository,
    ) : IntegrationTestBase() {
        @BeforeEach
        fun setUp() {
            // Clean up test data before each test
            // Note: This assumes you have a deleteAll method or similar cleanup mechanism
        }

        @Test
        fun `should register new user with isActive false`() {
            // given
            val username = "newuser"
            val password = "password123"
            val email = "newuser@example.com"

            // when
            val response = authService.register(username, password, email)

            // then
            assertNotNull(response)
            assertEquals(username, response.username)
            assertEquals(email, response.email)
            assertNotNull(response.userId)

            // Verify user is created with isActive = false
            val savedUser = userRepository.findByUsername(username)
            assertNotNull(savedUser)
            assertFalse(savedUser!!.isActive)
        }

        @Test
        fun `should throw exception when registering duplicate username`() {
            // given
            val username = "duplicateuser"
            val password = "password123"
            val email = "user@example.com"
            authService.register(username, password, email)

            // when & then
            assertThrows(IllegalArgumentException::class.java) {
                authService.register(username, password, "another@example.com")
            }
        }

        @Test
        fun `should encrypt password when registering`() {
            // given
            val username = "encryptuser"
            val password = "plainPassword"
            val email = "encrypt@example.com"

            // when
            authService.register(username, password, email)

            // then
            val savedUser = userRepository.findByUsername(username)
            assertNotNull(savedUser)
            // Password should be encrypted, not plain text
            assertFalse(savedUser!!.password == password)
            // But it should match when checked with encoder
            assert(passwordEncoder.matches(password, savedUser.password))
        }

        @Test
        fun `should throw UserNotActiveException when inactive user tries to login`() {
            // given
            val username = "inactiveuser"
            val password = "password123"
            val email = "inactive@example.com"

            // Register user (will have isActive = false)
            authService.register(username, password, email)

            // when & then
            assertThrows(UserNotActiveException::class.java) {
                authService.login(username, password, "127.0.0.1", "00:00:00:00:00:00")
            }
        }

        @Test
        fun `should successfully login when user is active`() {
            // given
            val username = "activeuser"
            val password = "password123"
            val email = "active@example.com"

            // Create an active user directly
            val encodedPassword = passwordEncoder.encode(password)
            val activeUser =
                User(
                    username = username,
                    password = encodedPassword,
                    email = email,
                    isActive = true,
                )
            userRepository.save(activeUser)

            // when
            val response = authService.login(username, password, "127.0.0.1", "00:00:00:00:00:00")

            // then
            assertNotNull(response)
            assertEquals(username, response.username)
            assertNotNull(response.token)
        }

        @Test
        fun `should throw InvalidCredentialsException for wrong password`() {
            // given
            val username = "wrongpassuser"
            val password = "password123"
            val wrongPassword = "wrongpassword"
            val email = "wrongpass@example.com"

            val encodedPassword = passwordEncoder.encode(password)
            val user =
                User(
                    username = username,
                    password = encodedPassword,
                    email = email,
                    isActive = true,
                )
            userRepository.save(user)

            // when & then
            assertThrows(InvalidCredentialsException::class.java) {
                authService.login(username, wrongPassword, "127.0.0.1", "00:00:00:00:00:00")
            }
        }

        @Test
        fun `should throw InvalidCredentialsException for non-existent user`() {
            // given
            val username = "nonexistent"
            val password = "password123"

            // when & then
            assertThrows(InvalidCredentialsException::class.java) {
                authService.login(username, password, "127.0.0.1", "00:00:00:00:00:00")
            }
        }

        @Test
        fun `should get user info successfully`() {
            // given
            val username = "infouser"
            val password = "password123"
            val email = "info@example.com"

            val encodedPassword = passwordEncoder.encode(password)
            val user =
                User(
                    username = username,
                    password = encodedPassword,
                    email = email,
                    isActive = true,
                )
            val savedUser = userRepository.save(user)

            // when
            val response = authService.getUserInfo(savedUser.id!!)

            // then
            assertNotNull(response)
            assertEquals(savedUser.id, response.userId)
            assertEquals(username, response.username)
            assertEquals(email, response.email)
            assert(response.isActive)
        }

        @Test
        fun `should throw UserNotFoundException when getting non-existent user info`() {
            // given
            val nonExistentUserId = 99999L

            // when & then
            assertThrows(com.aiprofessor.domain.exception.UserNotFoundException::class.java) {
                authService.getUserInfo(nonExistentUserId)
            }
        }

        @Test
        fun `should delete user successfully`() {
            // given
            val username = "deleteuser"
            val password = "password123"
            val email = "delete@example.com"

            val encodedPassword = passwordEncoder.encode(password)
            val user =
                User(
                    username = username,
                    password = encodedPassword,
                    email = email,
                    isActive = true,
                )
            val savedUser = userRepository.save(user)
            val userId = savedUser.id!!

            // when
            authService.deleteUser(userId)

            // then
            val deletedUser = userRepository.findById(userId)
            assertEquals(null, deletedUser)
        }

        @Test
        fun `should throw UserNotFoundException when deleting non-existent user`() {
            // given
            val nonExistentUserId = 99999L

            // when & then
            assertThrows(com.aiprofessor.domain.exception.UserNotFoundException::class.java) {
                authService.deleteUser(nonExistentUserId)
            }
        }

        @Test
        fun `should delete all sessions when user is deleted`() {
            // given
            val username = "sessiondeleteuser"
            val password = "password123"
            val email = "sessiondelete@example.com"

            // Create user
            val encodedPassword = passwordEncoder.encode(password)
            val user =
                User(
                    username = username,
                    password = encodedPassword,
                    email = email,
                    isActive = true,
                )
            val savedUser = userRepository.save(user)
            val userId = savedUser.id!!

            // Login to create session
            authService.login(username, password, "127.0.0.1", "00:00:00:00:00:00")

            // Verify session exists
            val sessions = sessionRepository.findByUserId(userId)
            assert(sessions.isNotEmpty())

            // when
            authService.deleteUser(userId)

            // then
            val sessionsAfterDelete = sessionRepository.findByUserId(userId)
            assert(sessionsAfterDelete.isEmpty())
        }
    }
