package com.aiprofessor.application.auth

import com.aiprofessor.IntegrationTestBase
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired

class JwtServiceTest
    @Autowired
    constructor(
        private val jwtService: JwtService,
    ) : IntegrationTestBase() {
        @Test
        fun `should generate valid JWT token`() {
            // given
            val userId = 1L
            val username = "testuser"

            // when
            val token = jwtService.generateToken(userId, username)

            // then
            assertNotNull(token)
            assertTrue(token.isNotEmpty())
        }

        @Test
        fun `should validate correct token`() {
            // given
            val userId = 1L
            val username = "testuser"
            val token = jwtService.generateToken(userId, username)

            // when
            val isValid = jwtService.validateToken(token)

            // then
            assertTrue(isValid)
        }

        @Test
        fun `should invalidate wrong token`() {
            // given
            val wrongToken = "invalid.token.here"

            // when
            val isValid = jwtService.validateToken(wrongToken)

            // then
            assertFalse(isValid)
        }

        @Test
        fun `should extract userId from token`() {
            // given
            val userId = 1L
            val username = "testuser"
            val token = jwtService.generateToken(userId, username)

            // when
            val extractedUserId = jwtService.getUserIdFromToken(token)

            // then
            assertEquals(userId, extractedUserId)
        }

        @Test
        fun `should extract username from token`() {
            // given
            val userId = 1L
            val username = "testuser"
            val token = jwtService.generateToken(userId, username)

            // when
            val extractedUsername = jwtService.getUsernameFromToken(token)

            // then
            assertEquals(username, extractedUsername)
        }
    }
