package com.aiprofessor.presentation.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.ProcessingType
import java.time.LocalDateTime

data class DocumentHistoryResponseDto(
    val id: Long,
    val processingType: ProcessingType,
    val userPrompt: String?,
    val inputBase64: String,
    val outputBase64: String,
    val createdAt: LocalDateTime,
)

data class PagedDocumentHistoryResponseDto(
    val content: List<DocumentHistoryResponseDto>,
    val pageNumber: Int,
    val pageSize: Int,
    val totalElements: Long,
    val totalPages: Int,
    val isLast: Boolean,
)

fun DocumentHistory.toResponseDto() =
    DocumentHistoryResponseDto(
        id = this.id!!,
        processingType = this.processingType,
        userPrompt = this.userPrompt,
        inputBase64 = this.inputBase64,
        outputBase64 = this.outputBase64,
        createdAt = this.createdAt,
    )
