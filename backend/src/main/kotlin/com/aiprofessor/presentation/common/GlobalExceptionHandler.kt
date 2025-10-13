package com.aiprofessor.presentation.common

import com.aiprofessor.domain.exception.BusinessException
import com.aiprofessor.domain.exception.ClaudeApiException
import com.aiprofessor.domain.exception.ClaudeApiInvalidResponseException
import com.aiprofessor.domain.exception.ClaudeApiRateLimitException
import com.aiprofessor.domain.exception.ClaudeApiTimeoutException
import com.aiprofessor.domain.exception.DuplicateUsernameException
import com.aiprofessor.domain.exception.EmptyContentException
import com.aiprofessor.domain.exception.ExpiredTokenException
import com.aiprofessor.domain.exception.InvalidCredentialsException
import com.aiprofessor.domain.exception.InvalidInputException
import com.aiprofessor.domain.exception.InvalidPdfException
import com.aiprofessor.domain.exception.InvalidTokenException
import com.aiprofessor.domain.exception.MarkdownConversionException
import com.aiprofessor.domain.exception.MaxSessionsExceededException
import com.aiprofessor.domain.exception.PdfProcessingException
import com.aiprofessor.domain.exception.PdfSizeExceededException
import com.aiprofessor.domain.exception.SessionNotFoundException
import com.aiprofessor.domain.exception.UnauthorizedException
import com.aiprofessor.domain.exception.UserNotFoundException
import jakarta.servlet.http.HttpServletRequest
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException

@RestControllerAdvice
class GlobalExceptionHandler {
    private val logger = LoggerFactory.getLogger(javaClass)

    /**
     * Authentication & Authorization Exceptions
     */
    @ExceptionHandler(InvalidCredentialsException::class)
    fun handleInvalidCredentials(
        ex: InvalidCredentialsException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Invalid credentials attempt from {}", request.remoteAddr)
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(
                ErrorResponse(
                    status = HttpStatus.UNAUTHORIZED.value(),
                    error = "Unauthorized",
                    message = ex.message ?: "Invalid credentials",
                    path = request.requestURI,
                ),
            )
    }

    @ExceptionHandler(InvalidTokenException::class, ExpiredTokenException::class)
    fun handleTokenException(
        ex: BusinessException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Token validation failed: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(
                ErrorResponse(
                    status = HttpStatus.UNAUTHORIZED.value(),
                    error = "Unauthorized",
                    message = ex.message ?: "Invalid or expired token",
                    path = request.requestURI,
                ),
            )
    }

    @ExceptionHandler(UnauthorizedException::class)
    fun handleUnauthorized(
        ex: UnauthorizedException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Unauthorized access attempt to {}", request.requestURI)
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(
                ErrorResponse(
                    status = HttpStatus.UNAUTHORIZED.value(),
                    error = "Unauthorized",
                    message = ex.message ?: "Authentication required",
                    path = request.requestURI,
                ),
            )
    }

    /**
     * Session Management Exceptions
     */
    @ExceptionHandler(MaxSessionsExceededException::class)
    fun handleMaxSessionsExceeded(
        ex: MaxSessionsExceededException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Max sessions exceeded: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(
                ErrorResponse(
                    status = HttpStatus.CONFLICT.value(),
                    error = "Conflict",
                    message = ex.message ?: "Maximum concurrent sessions exceeded",
                    path = request.requestURI,
                    details =
                        mapOf(
                            "maxSessions" to 1,
                            "reason" to "동시 접속 제한",
                        ),
                ),
            )
    }

    @ExceptionHandler(SessionNotFoundException::class)
    fun handleSessionNotFound(
        ex: SessionNotFoundException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Session not found: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(
                ErrorResponse(
                    status = HttpStatus.UNAUTHORIZED.value(),
                    error = "Unauthorized",
                    message = ex.message ?: "Session not found",
                    path = request.requestURI,
                ),
            )
    }

    /**
     * User Management Exceptions
     */
    @ExceptionHandler(UserNotFoundException::class)
    fun handleUserNotFound(
        ex: UserNotFoundException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("User not found: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(
                ErrorResponse(
                    status = HttpStatus.NOT_FOUND.value(),
                    error = "Not Found",
                    message = ex.message ?: "User not found",
                    path = request.requestURI,
                ),
            )
    }

    @ExceptionHandler(DuplicateUsernameException::class)
    fun handleDuplicateUsername(
        ex: DuplicateUsernameException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Duplicate username: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(
                ErrorResponse(
                    status = HttpStatus.CONFLICT.value(),
                    error = "Conflict",
                    message = ex.message ?: "Username already exists",
                    path = request.requestURI,
                ),
            )
    }

    /**
     * Document Processing Exceptions
     */
    @ExceptionHandler(PdfSizeExceededException::class)
    fun handlePdfSizeExceeded(
        ex: PdfSizeExceededException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("PDF size exceeded: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(
                ErrorResponse(
                    status = HttpStatus.PAYLOAD_TOO_LARGE.value(),
                    error = "Payload Too Large",
                    message = ex.message ?: "PDF file size exceeds maximum allowed size",
                    path = request.requestURI,
                    details =
                        mapOf(
                            "maxSize" to "30MB",
                        ),
                ),
            )
    }

    @ExceptionHandler(InvalidPdfException::class)
    fun handleInvalidPdf(
        ex: InvalidPdfException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Invalid PDF: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = "Bad Request",
                    message = ex.message ?: "Invalid PDF file",
                    path = request.requestURI,
                ),
            )
    }

    @ExceptionHandler(PdfProcessingException::class, MarkdownConversionException::class)
    fun handlePdfProcessing(
        ex: BusinessException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.error("PDF processing error: {}", ex.message, ex)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(
                ErrorResponse(
                    status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    error = "Internal Server Error",
                    message = ex.message ?: "Error processing PDF",
                    path = request.requestURI,
                ),
            )
    }

    /**
     * Claude API Exceptions
     */
    @ExceptionHandler(ClaudeApiRateLimitException::class)
    fun handleClaudeRateLimit(
        ex: ClaudeApiRateLimitException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Claude API rate limit exceeded: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.TOO_MANY_REQUESTS)
            .body(
                ErrorResponse(
                    status = HttpStatus.TOO_MANY_REQUESTS.value(),
                    error = "Too Many Requests",
                    message = ex.message ?: "API rate limit exceeded",
                    path = request.requestURI,
                ),
            )
    }

    @ExceptionHandler(ClaudeApiTimeoutException::class)
    fun handleClaudeTimeout(
        ex: ClaudeApiTimeoutException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.error("Claude API timeout: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.GATEWAY_TIMEOUT)
            .body(
                ErrorResponse(
                    status = HttpStatus.GATEWAY_TIMEOUT.value(),
                    error = "Gateway Timeout",
                    message = ex.message ?: "API request timeout",
                    path = request.requestURI,
                ),
            )
    }

    @ExceptionHandler(ClaudeApiInvalidResponseException::class)
    fun handleClaudeInvalidResponse(
        ex: ClaudeApiInvalidResponseException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.error("Claude API invalid response: {}", ex.message, ex)
        return ResponseEntity
            .status(HttpStatus.BAD_GATEWAY)
            .body(
                ErrorResponse(
                    status = HttpStatus.BAD_GATEWAY.value(),
                    error = "Bad Gateway",
                    message = ex.message ?: "Invalid API response",
                    path = request.requestURI,
                ),
            )
    }

    @ExceptionHandler(ClaudeApiException::class)
    fun handleClaudeApi(
        ex: ClaudeApiException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.error("Claude API error: {}", ex.message, ex)
        return ResponseEntity
            .status(HttpStatus.BAD_GATEWAY)
            .body(
                ErrorResponse(
                    status = HttpStatus.BAD_GATEWAY.value(),
                    error = "Bad Gateway",
                    message = ex.message ?: "External API error",
                    path = request.requestURI,
                ),
            )
    }

    /**
     * Validation Exceptions
     */
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest,
    ): ResponseEntity<ValidationErrorResponse> {
        logger.warn("Validation failed: {}", ex.message)

        val fieldErrors =
            ex.bindingResult.allErrors.mapNotNull { error ->
                if (error is FieldError) {
                    ValidationErrorResponse.FieldError(
                        field = error.field,
                        rejectedValue = error.rejectedValue,
                        message = error.defaultMessage ?: "Validation failed",
                    )
                } else {
                    null
                }
            }

        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ValidationErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = "Bad Request",
                    message = "입력값 검증에 실패했습니다.",
                    path = request.requestURI,
                    fieldErrors = fieldErrors,
                ),
            )
    }

    @ExceptionHandler(InvalidInputException::class, EmptyContentException::class)
    fun handleInvalidInput(
        ex: BusinessException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Invalid input: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = "Bad Request",
                    message = ex.message ?: "Invalid input",
                    path = request.requestURI,
                ),
            )
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleHttpMessageNotReadable(
        ex: HttpMessageNotReadableException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Malformed JSON request: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = "Bad Request",
                    message = "잘못된 요청 형식입니다.",
                    path = request.requestURI,
                ),
            )
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(
        ex: MethodArgumentTypeMismatchException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.warn("Type mismatch: {}", ex.message)
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(
                ErrorResponse(
                    status = HttpStatus.BAD_REQUEST.value(),
                    error = "Bad Request",
                    message = "잘못된 파라미터 타입입니다: ${ex.name}",
                    path = request.requestURI,
                ),
            )
    }

    /**
     * Generic Business Exception Handler
     */
    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(
        ex: BusinessException,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.error("Business exception: {}", ex.message, ex)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(
                ErrorResponse(
                    status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    error = "Internal Server Error",
                    message = ex.message ?: "An error occurred",
                    path = request.requestURI,
                ),
            )
    }

    /**
     * Generic Exception Handler (Catch-all)
     */
    @ExceptionHandler(Exception::class)
    fun handleGenericException(
        ex: Exception,
        request: HttpServletRequest,
    ): ResponseEntity<ErrorResponse> {
        logger.error("Unexpected error: {}", ex.message, ex)
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(
                ErrorResponse(
                    status = HttpStatus.INTERNAL_SERVER_ERROR.value(),
                    error = "Internal Server Error",
                    message = "예상치 못한 오류가 발생했습니다.",
                    path = request.requestURI,
                ),
            )
    }
}
