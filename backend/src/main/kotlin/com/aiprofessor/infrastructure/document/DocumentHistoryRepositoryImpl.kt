package com.aiprofessor.infrastructure.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.ProcessingType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Repository

@Repository
class DocumentHistoryRepositoryImpl(
    private val jpaDocumentHistoryRepository: JpaDocumentHistoryRepository,
) : DocumentHistoryRepository {
    override fun save(documentHistory: DocumentHistory): DocumentHistory {
        return jpaDocumentHistoryRepository.save(documentHistory)
    }

    override fun findByUserId(
        userId: Long,
        pageable: Pageable,
    ): Page<DocumentHistory> {
        return jpaDocumentHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
    }

    override fun findByUserIdAndProcessingType(
        userId: Long,
        processingType: ProcessingType,
        pageable: Pageable,
    ): Page<DocumentHistory> {
        return jpaDocumentHistoryRepository.findByUserIdAndProcessingTypeOrderByCreatedAtDesc(
            userId,
            processingType,
            pageable,
        )
    }
}
