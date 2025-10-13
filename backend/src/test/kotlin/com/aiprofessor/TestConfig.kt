package com.aiprofessor

import com.aiprofessor.infrastructure.claude.ClaudeApiClient
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

@TestConfiguration
class TestConfig {
    @Bean
    @Primary
    fun testPasswordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    @Primary
    fun mockClaudeApiClient(objectMapper: ObjectMapper): ClaudeApiClient =
        object : ClaudeApiClient(
            apiKey = "mock-api-key",
            apiUrl = "https://mock.api.com",
            model = "mock-model",
            maxTokens = 4096,
            objectMapper = objectMapper,
        ) {
            override suspend fun sendMessage(
                systemPrompt: String,
                userPrompt: String,
                pdfBase64: String,
            ): String =
                // Return a simple mock response for tests
                """
                # Mock Summary Response

                This is a mock response from Claude API for testing purposes.

                ## Key Points
                - Test point 1
                - Test point 2
                - Test point 3
                """.trimIndent()
        }
}
