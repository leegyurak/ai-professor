package com.aiprofessor.application.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.DocumentHistoryService
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.infrastructure.document.DocumentHistoryCacheService
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class DocumentHistoryServiceImpl(
    private val documentHistoryRepository: DocumentHistoryRepository,
    private val cacheService: DocumentHistoryCacheService,
) : DocumentHistoryService {
    override fun getDocumentHistory(
        userId: Long,
        processingType: ProcessingType?,
        pageable: Pageable,
    ): Page<DocumentHistory> {
        // Check if we can use cache (first page, no filter, size <= 20)
        val canUseCache = pageable.pageNumber == 0 && processingType == null && pageable.pageSize <= 20

        if (canUseCache) {
            // Try to get from cache
            val cachedHistory = cacheService.getCachedHistory(userId)
            if (cachedHistory != null) {
                val pageContent = cachedHistory.take(pageable.pageSize)
                return PageImpl(pageContent, pageable, cachedHistory.size.toLong())
            }

            // Cache miss - fetch from DB
            val dbResult = documentHistoryRepository.findByUserId(userId, pageable)

            // Cache the first 20 items if we got the first page
            if (dbResult.content.isNotEmpty()) {
                cacheService.cacheHistory(userId, dbResult.content)
            }

            return dbResult
        }

        // For other cases (pagination, filtering), always query DB
        return if (processingType != null) {
            documentHistoryRepository.findByUserIdAndProcessingType(userId, processingType, pageable)
        } else {
            documentHistoryRepository.findByUserId(userId, pageable)
        }
    }
}
