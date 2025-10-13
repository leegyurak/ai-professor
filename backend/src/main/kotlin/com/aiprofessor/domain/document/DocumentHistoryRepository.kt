package com.aiprofessor.domain.document

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface DocumentHistoryRepository {
    fun save(documentHistory: DocumentHistory): DocumentHistory

    fun findByUserId(
        userId: Long,
        pageable: Pageable,
    ): Page<DocumentHistory>

    fun findByUserIdAndProcessingType(
        userId: Long,
        processingType: ProcessingType,
        pageable: Pageable,
    ): Page<DocumentHistory>
}
