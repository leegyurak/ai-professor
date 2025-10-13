package com.aiprofessor.presentation.common

import com.aiprofessor.IntegrationTestBase
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@AutoConfigureMockMvc(addFilters = false)
@Import(TestExceptionControllerConfig::class)
class GlobalExceptionHandlerTest
    @Autowired
    constructor(
        private val mockMvc: MockMvc,
        private val objectMapper: ObjectMapper,
    ) : IntegrationTestBase() {
        @Test
        fun `should handle InvalidCredentialsException with 401`() {
            mockMvc
                .perform(
                    post("/test/invalid-credentials")
                        .contentType(MediaType.APPLICATION_JSON),
                ).andExpect(status().isUnauthorized)
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"))
                .andExpect(jsonPath("$.message").value("아이디 또는 비밀번호가 올바르지 않습니다."))
                .andExpect(jsonPath("$.path").value("/test/invalid-credentials"))
        }

        @Test
        fun `should handle MaxSessionsExceededException with 409`() {
            mockMvc
                .perform(
                    post("/test/max-sessions")
                        .contentType(MediaType.APPLICATION_JSON),
                ).andExpect(status().isConflict)
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.details.maxSessions").value(1))
                .andExpect(jsonPath("$.details.reason").value("동시 접속 제한"))
        }

        @Test
        fun `should handle PdfSizeExceededException with 413`() {
            mockMvc
                .perform(
                    post("/test/pdf-size-exceeded")
                        .contentType(MediaType.APPLICATION_JSON),
                ).andExpect(status().isPayloadTooLarge)
                .andExpect(jsonPath("$.status").value(413))
                .andExpect(jsonPath("$.error").value("Payload Too Large"))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.details.maxSize").value("30MB"))
        }

        @Test
        fun `should handle InvalidPdfException with 400`() {
            mockMvc
                .perform(
                    post("/test/invalid-pdf")
                        .contentType(MediaType.APPLICATION_JSON),
                ).andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").exists())
        }

        @Test
        fun `should handle ClaudeApiRateLimitException with 429`() {
            mockMvc
                .perform(
                    post("/test/claude-rate-limit")
                        .contentType(MediaType.APPLICATION_JSON),
                ).andExpect(status().isTooManyRequests)
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.error").value("Too Many Requests"))
                .andExpect(jsonPath("$.message").exists())
        }

        @Test
        fun `should handle ClaudeApiTimeoutException with 504`() {
            mockMvc
                .perform(
                    post("/test/claude-timeout")
                        .contentType(MediaType.APPLICATION_JSON),
                ).andExpect(status().isGatewayTimeout)
                .andExpect(jsonPath("$.status").value(504))
                .andExpect(jsonPath("$.error").value("Gateway Timeout"))
                .andExpect(jsonPath("$.message").exists())
        }

        @Test
        fun `should handle validation errors with 400`() {
            val invalidRequest = mapOf("field" to "")

            mockMvc
                .perform(
                    post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)),
                ).andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("입력값 검증에 실패했습니다."))
                .andExpect(jsonPath("$.fieldErrors").isArray)
        }

        @Test
        fun `should handle malformed JSON with 400`() {
            mockMvc
                .perform(
                    post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid json}"),
                ).andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("잘못된 요청 형식입니다."))
        }

        @Test
        fun `should handle generic exceptions with 500`() {
            mockMvc
                .perform(
                    post("/test/generic-error")
                        .contentType(MediaType.APPLICATION_JSON),
                ).andExpect(status().isInternalServerError)
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.error").value("Internal Server Error"))
                .andExpect(jsonPath("$.message").value("예상치 못한 오류가 발생했습니다."))
        }
    }
