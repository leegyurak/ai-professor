package com.aiprofessor.presentation.common

import com.fasterxml.jackson.annotation.JsonInclude
import java.time.LocalDateTime

/**
 * Standard error response structure
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class ErrorResponse(
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val status: Int,
    val error: String,
    val message: String,
    val path: String? = null,
    val details: Map<String, Any>? = null,
)

/**
 * Validation error response with field-level errors
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
data class ValidationErrorResponse(
    val timestamp: LocalDateTime = LocalDateTime.now(),
    val status: Int,
    val error: String,
    val message: String,
    val path: String? = null,
    val fieldErrors: List<FieldError>,
) {
    data class FieldError(
        val field: String,
        val rejectedValue: Any?,
        val message: String,
    )
}
