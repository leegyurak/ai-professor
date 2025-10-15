package com.aiprofessor.application.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.DocumentHistoryService
import com.aiprofessor.domain.document.ProcessingType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class DocumentHistoryServiceImpl(
    private val documentHistoryRepository: DocumentHistoryRepository,
) : DocumentHistoryService {
    override fun getDocumentHistory(
        userId: Long,
        processingType: ProcessingType?,
        pageable: Pageable,
    ): Page<DocumentHistory> =
        if (processingType != null) {
            documentHistoryRepository.findByUserIdAndProcessingType(userId, processingType, pageable)
        } else {
            documentHistoryRepository.findByUserId(userId, pageable)
        }
}
