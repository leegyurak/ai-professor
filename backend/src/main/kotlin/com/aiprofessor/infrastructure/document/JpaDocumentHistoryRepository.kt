package com.aiprofessor.infrastructure.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.ProcessingType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface JpaDocumentHistoryRepository : JpaRepository<DocumentHistory, Long> {
    fun findByUserIdOrderByCreatedAtDesc(
        userId: Long,
        pageable: Pageable,
    ): Page<DocumentHistory>

    fun findByUserIdAndProcessingTypeOrderByCreatedAtDesc(
        userId: Long,
        processingType: ProcessingType,
        pageable: Pageable,
    ): Page<DocumentHistory>
}
