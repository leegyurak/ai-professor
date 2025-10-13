package com.aiprofessor.domain.document

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

interface DocumentHistoryService {
    fun getDocumentHistory(
        userId: Long,
        processingType: ProcessingType?,
        pageable: Pageable,
    ): Page<DocumentHistory>
}
