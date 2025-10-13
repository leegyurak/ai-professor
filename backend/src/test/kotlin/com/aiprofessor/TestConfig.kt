package com.aiprofessor

import com.aiprofessor.infrastructure.openai.OpenAiApiClient
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
    fun mockOpenAiApiClient(objectMapper: ObjectMapper): OpenAiApiClient =
        object : OpenAiApiClient(
            apiKey = "mock-api-key",
            apiUrl = "https://api.openai.com/v1/responses",
            model = "gpt-5",
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

                This is a mock response from OpenAI API for testing purposes.

                ## Key Points
                - Test point 1
                - Test point 2
                - Test point 3
                """.trimIndent()
        }
}
