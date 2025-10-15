package com.aiprofessor.presentation.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.infrastructure.util.FileStorageUtils
import java.time.LocalDateTime

data class DocumentHistoryResponseDto(
    val id: Long,
    val processingType: ProcessingType,
    val userPrompt: String?,
    val inputUrl: String,
    val outputUrl: String,
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

fun DocumentHistory.toResponseDto(fileStorageUtils: FileStorageUtils) =
    DocumentHistoryResponseDto(
        id = this.id!!,
        processingType = this.processingType,
        userPrompt = this.userPrompt,
        inputUrl = fileStorageUtils.filePathToUrl(this.inputFilePath),
        outputUrl = fileStorageUtils.filePathToUrl(this.outputFilePath),
        createdAt = this.createdAt,
    )
