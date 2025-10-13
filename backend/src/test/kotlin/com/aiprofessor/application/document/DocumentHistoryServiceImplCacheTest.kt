package com.aiprofessor.application.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.infrastructure.document.DocumentHistoryCacheService
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.LocalDateTime

class DocumentHistoryServiceImplCacheTest {
    private lateinit var documentHistoryService: DocumentHistoryServiceImpl
    private lateinit var documentHistoryRepository: DocumentHistoryRepository
    private lateinit var cacheService: DocumentHistoryCacheService

    private val testUserId = 100L

    @BeforeEach
    fun setup() {
        documentHistoryRepository = mockk(relaxed = true)
        cacheService = mockk(relaxed = true)
        documentHistoryService = DocumentHistoryServiceImpl(documentHistoryRepository, cacheService)
    }

    @Test
    fun `should use cache for first page without filter`() {
        // Given
        val history1 =
            DocumentHistory(
                id = 1L,
                userId = testUserId,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test 1",
                inputBase64 = "input1",
                outputBase64 = "output1",
                createdAt = LocalDateTime.now(),
            )
        val history2 =
            DocumentHistory(
                id = 2L,
                userId = testUserId,
                processingType = ProcessingType.EXAM_QUESTIONS,
                userPrompt = "Test 2",
                inputBase64 = "input2",
                outputBase64 = "output2",
                createdAt = LocalDateTime.now(),
            )

        val pageable = PageRequest.of(0, 20)
        val historyList = listOf(history1, history2)

        // Mock: Cache miss on first call
        every { cacheService.getCachedHistory(testUserId) } returns null

        // Mock: Repository returns data
        every {
            documentHistoryRepository.findByUserId(testUserId, pageable)
        } returns PageImpl(historyList, pageable, historyList.size.toLong())

        // When - First call should fetch from DB and cache it
        val firstResult = documentHistoryService.getDocumentHistory(testUserId, null, pageable)

        // Then
        assertNotNull(firstResult)
        assertEquals(2, firstResult.content.size)
        verify { cacheService.cacheHistory(testUserId, historyList) }

        // Mock: Cache hit on second call
        every { cacheService.getCachedHistory(testUserId) } returns historyList

        // When - Second call should use cache
        val secondResult = documentHistoryService.getDocumentHistory(testUserId, null, pageable)

        // Then - Should return same data without querying repository again
        assertEquals(2, secondResult.content.size)
        verify(exactly = 1) { documentHistoryRepository.findByUserId(testUserId, pageable) }
    }

    @Test
    fun `should not use cache when filtering by processing type`() {
        // Given
        val history1 =
            DocumentHistory(
                id = 1L,
                userId = testUserId,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test 1",
                inputBase64 = "input1",
                outputBase64 = "output1",
                createdAt = LocalDateTime.now(),
            )

        val pageable = PageRequest.of(0, 20)

        // Mock: Repository returns filtered data
        every {
            documentHistoryRepository.findByUserIdAndProcessingType(
                testUserId,
                ProcessingType.SUMMARY,
                pageable,
            )
        } returns PageImpl(listOf(history1), pageable, 1)

        // When - Query with filter should not use cache
        val result =
            documentHistoryService.getDocumentHistory(
                testUserId,
                ProcessingType.SUMMARY,
                pageable,
            )

        // Then
        assertEquals(1, result.content.size)
        assertEquals(ProcessingType.SUMMARY, result.content[0].processingType)

        // Verify cache was not used or populated
        verify(exactly = 0) { cacheService.getCachedHistory(any()) }
        verify(exactly = 0) { cacheService.cacheHistory(any(), any()) }
    }

    @Test
    fun `should not use cache for second page`() {
        // Given - Create 25 documents
        val allHistory =
            (1..25).map { i ->
                DocumentHistory(
                    id = i.toLong(),
                    userId = testUserId,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test $i",
                    inputBase64 = "input$i",
                    outputBase64 = "output$i",
                    createdAt = LocalDateTime.now(),
                )
            }

        val firstPageable = PageRequest.of(0, 20)
        val secondPageable = PageRequest.of(1, 20)

        // Mock first page
        every { cacheService.getCachedHistory(testUserId) } returns null
        every {
            documentHistoryRepository.findByUserId(testUserId, firstPageable)
        } returns PageImpl(allHistory.take(20), firstPageable, 25)

        // Mock second page - cache should not be used for page > 0
        every {
            documentHistoryRepository.findByUserId(testUserId, secondPageable)
        } returns PageImpl(allHistory.drop(20), secondPageable, 25)

        // When - First page
        val firstPageResult = documentHistoryService.getDocumentHistory(testUserId, null, firstPageable)
        assertEquals(20, firstPageResult.content.size)

        // When - Second page (should not use cache)
        val secondPageResult = documentHistoryService.getDocumentHistory(testUserId, null, secondPageable)

        // Then
        assertEquals(5, secondPageResult.content.size)
        // First page should have checked cache once, second page should NOT check cache
        // So total calls should be exactly 1 (from first page only)
        verify(exactly = 1) { cacheService.getCachedHistory(testUserId) }
    }

    @Test
    fun `should limit cached items to 20`() {
        // Given - Create 25 documents
        val allHistory =
            (1..25).map { i ->
                DocumentHistory(
                    id = i.toLong(),
                    userId = testUserId,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test $i",
                    inputBase64 = "input$i",
                    outputBase64 = "output$i",
                    createdAt = LocalDateTime.now(),
                )
            }

        val pageable = PageRequest.of(0, 20)

        // Mock: No cache initially
        every { cacheService.getCachedHistory(testUserId) } returns null

        // Mock: Repository returns 20 items
        every {
            documentHistoryRepository.findByUserId(testUserId, pageable)
        } returns PageImpl(allHistory.take(20), pageable, 25)

        // When
        documentHistoryService.getDocumentHistory(testUserId, null, pageable)

        // Then - Cache should be called with exactly 20 items
        verify { cacheService.cacheHistory(testUserId, allHistory.take(20)) }
    }

    @Test
    fun `should handle cache with smaller page size`() {
        // Given
        val allHistory =
            (1..15).map { i ->
                DocumentHistory(
                    id = i.toLong(),
                    userId = testUserId,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test $i",
                    inputBase64 = "input$i",
                    outputBase64 = "output$i",
                    createdAt = LocalDateTime.now(),
                )
            }

        val pageable10 = PageRequest.of(0, 10)

        // Mock: Cache has 15 items
        every { cacheService.getCachedHistory(testUserId) } returns allHistory

        // When - Request with smaller page size
        val result = documentHistoryService.getDocumentHistory(testUserId, null, pageable10)

        // Then - Should return only 10 items from cache
        assertEquals(10, result.content.size)
        // Should not query repository when cache is available
        verify(exactly = 0) { documentHistoryRepository.findByUserId(any(), any()) }
    }
}
