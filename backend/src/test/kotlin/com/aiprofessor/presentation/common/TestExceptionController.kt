package com.aiprofessor.presentation.common

import com.aiprofessor.domain.exception.ClaudeApiRateLimitException
import com.aiprofessor.domain.exception.ClaudeApiTimeoutException
import com.aiprofessor.domain.exception.InvalidCredentialsException
import com.aiprofessor.domain.exception.InvalidPdfException
import com.aiprofessor.domain.exception.MaxSessionsExceededException
import com.aiprofessor.domain.exception.PdfSizeExceededException
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@TestConfiguration
class TestExceptionControllerConfig {
    @Bean
    fun testExceptionController() = TestExceptionController()
}

@RestController
@RequestMapping("/test")
class TestExceptionController {
    @PostMapping("/invalid-credentials")
    fun invalidCredentials() {
        throw InvalidCredentialsException()
    }

    @PostMapping("/max-sessions")
    fun maxSessions() {
        throw MaxSessionsExceededException()
    }

    @PostMapping("/pdf-size-exceeded")
    fun pdfSizeExceeded() {
        throw PdfSizeExceededException()
    }

    @PostMapping("/invalid-pdf")
    fun invalidPdf() {
        throw InvalidPdfException()
    }

    @PostMapping("/claude-rate-limit")
    fun claudeRateLimit() {
        throw ClaudeApiRateLimitException()
    }

    @PostMapping("/claude-timeout")
    fun claudeTimeout() {
        throw ClaudeApiTimeoutException()
    }

    @PostMapping("/validation")
    fun validation(
        @Valid @RequestBody request: TestValidationRequest,
    ) {
        // Validation will be handled by @Valid annotation
    }

    @PostMapping("/generic-error")
    fun genericError() {
        throw RuntimeException("Unexpected error")
    }
}

data class TestValidationRequest(
    @field:NotBlank(message = "Field is required")
    val field: String,
)
