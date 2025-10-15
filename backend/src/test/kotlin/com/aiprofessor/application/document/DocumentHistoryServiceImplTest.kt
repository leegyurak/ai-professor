package com.aiprofessor.application.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.ProcessingType
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import java.time.LocalDateTime

class DocumentHistoryServiceImplTest {
    private lateinit var documentHistoryRepository: DocumentHistoryRepository
    private lateinit var documentHistoryService: DocumentHistoryServiceImpl

    @BeforeEach
    fun setUp() {
        documentHistoryRepository = mockk()
        documentHistoryService = DocumentHistoryServiceImpl(documentHistoryRepository)
    }

    @Test
    fun `getDocumentHistory should return all histories when processingType is null`() {
        // given
        val userId = 1L
        val pageable = PageRequest.of(0, 10)
        val histories =
            listOf(
                createDocumentHistory(1L, userId, ProcessingType.SUMMARY),
                createDocumentHistory(2L, userId, ProcessingType.EXAM_QUESTIONS),
            )
        val expectedPage = PageImpl(histories, pageable, histories.size.toLong())

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.content).hasSize(2)
        assertThat(result.totalElements).isEqualTo(2L)
        verify(exactly = 1) { documentHistoryRepository.findByUserId(userId, pageable) }
        verify(exactly = 0) { documentHistoryRepository.findByUserIdAndProcessingType(any(), any(), any()) }
    }

    @Test
    fun `getDocumentHistory should return filtered histories when processingType is provided`() {
        // given
        val userId = 1L
        val processingType = ProcessingType.SUMMARY
        val pageable = PageRequest.of(0, 10)
        val histories =
            listOf(
                createDocumentHistory(1L, userId, ProcessingType.SUMMARY),
                createDocumentHistory(3L, userId, ProcessingType.SUMMARY),
            )
        val expectedPage = PageImpl(histories, pageable, histories.size.toLong())

        every {
            documentHistoryRepository.findByUserIdAndProcessingType(userId, processingType, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, processingType, pageable)

        // then
        assertThat(result.content).hasSize(2)
        assertThat(result.content.all { it.processingType == ProcessingType.SUMMARY }).isTrue()
        verify(exactly = 0) { documentHistoryRepository.findByUserId(any(), any()) }
        verify(exactly = 1) { documentHistoryRepository.findByUserIdAndProcessingType(userId, processingType, pageable) }
    }

    @Test
    fun `getDocumentHistory should return empty page when user has no history`() {
        // given
        val userId = 999L
        val pageable = PageRequest.of(0, 10)
        val emptyPage = PageImpl<DocumentHistory>(emptyList(), pageable, 0L)

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns emptyPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.content).isEmpty()
        assertThat(result.totalElements).isEqualTo(0L)
        assertThat(result.totalPages).isEqualTo(0)
    }

    @Test
    fun `getDocumentHistory should handle first page correctly`() {
        // given
        val userId = 1L
        val pageable = PageRequest.of(0, 5)
        val histories = (1..5).map { createDocumentHistory(it.toLong(), userId, ProcessingType.SUMMARY) }
        val expectedPage = PageImpl(histories, pageable, 20L)

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.content).hasSize(5)
        assertThat(result.number).isEqualTo(0)
        assertThat(result.totalPages).isEqualTo(4)
        assertThat(result.isFirst).isTrue()
        assertThat(result.isLast).isFalse()
    }

    @Test
    fun `getDocumentHistory should handle middle page correctly`() {
        // given
        val userId = 1L
        val pageable = PageRequest.of(2, 5)
        val histories = (11..15).map { createDocumentHistory(it.toLong(), userId, ProcessingType.SUMMARY) }
        val expectedPage = PageImpl(histories, pageable, 20L)

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.content).hasSize(5)
        assertThat(result.number).isEqualTo(2)
        assertThat(result.totalPages).isEqualTo(4)
        assertThat(result.isFirst).isFalse()
        assertThat(result.isLast).isFalse()
    }

    @Test
    fun `getDocumentHistory should handle last page correctly`() {
        // given
        val userId = 1L
        val pageable = PageRequest.of(3, 5)
        val histories = (16..20).map { createDocumentHistory(it.toLong(), userId, ProcessingType.SUMMARY) }
        val expectedPage = PageImpl(histories, pageable, 20L)

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.content).hasSize(5)
        assertThat(result.number).isEqualTo(3)
        assertThat(result.totalPages).isEqualTo(4)
        assertThat(result.isFirst).isFalse()
        assertThat(result.isLast).isTrue()
    }

    @Test
    fun `getDocumentHistory should handle single item per page`() {
        // given
        val userId = 1L
        val pageable = PageRequest.of(0, 1)
        val histories = listOf(createDocumentHistory(1L, userId, ProcessingType.SUMMARY))
        val expectedPage = PageImpl(histories, pageable, 10L)

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.content).hasSize(1)
        assertThat(result.size).isEqualTo(1)
        assertThat(result.totalPages).isEqualTo(10)
    }

    @Test
    fun `getDocumentHistory should handle large page size`() {
        // given
        val userId = 1L
        val pageable = PageRequest.of(0, 100)
        val histories = (1..50).map { createDocumentHistory(it.toLong(), userId, ProcessingType.SUMMARY) }
        val expectedPage = PageImpl(histories, pageable, 50L)

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.content).hasSize(50)
        assertThat(result.totalPages).isEqualTo(1)
        assertThat(result.isFirst).isTrue()
        assertThat(result.isLast).isTrue()
    }

    @Test
    fun `getDocumentHistory should handle sorting by createdAt desc`() {
        // given
        val userId = 1L
        val pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"))
        val now = LocalDateTime.now()
        val histories =
            listOf(
                createDocumentHistory(1L, userId, ProcessingType.SUMMARY, now.minusDays(1)),
                createDocumentHistory(2L, userId, ProcessingType.SUMMARY, now),
            )
        val expectedPage = PageImpl(histories, pageable, histories.size.toLong())

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.content).hasSize(2)
        assertThat(result.sort.getOrderFor("createdAt")?.direction).isEqualTo(Sort.Direction.DESC)
        verify(exactly = 1) { documentHistoryRepository.findByUserId(userId, pageable) }
    }

    @Test
    fun `getDocumentHistory should filter only SUMMARY type correctly`() {
        // given
        val userId = 1L
        val processingType = ProcessingType.SUMMARY
        val pageable = PageRequest.of(0, 10)
        val histories =
            listOf(
                createDocumentHistory(1L, userId, ProcessingType.SUMMARY),
                createDocumentHistory(2L, userId, ProcessingType.SUMMARY),
            )
        val expectedPage = PageImpl(histories, pageable, histories.size.toLong())

        every {
            documentHistoryRepository.findByUserIdAndProcessingType(userId, processingType, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, processingType, pageable)

        // then
        assertThat(result.content).allMatch { it.processingType == ProcessingType.SUMMARY }
        verify(exactly = 1) { documentHistoryRepository.findByUserIdAndProcessingType(userId, processingType, pageable) }
    }

    @Test
    fun `getDocumentHistory should filter only EXAM_QUESTIONS type correctly`() {
        // given
        val userId = 1L
        val processingType = ProcessingType.EXAM_QUESTIONS
        val pageable = PageRequest.of(0, 10)
        val histories =
            listOf(
                createDocumentHistory(1L, userId, ProcessingType.EXAM_QUESTIONS),
                createDocumentHistory(2L, userId, ProcessingType.EXAM_QUESTIONS),
            )
        val expectedPage = PageImpl(histories, pageable, histories.size.toLong())

        every {
            documentHistoryRepository.findByUserIdAndProcessingType(userId, processingType, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, processingType, pageable)

        // then
        assertThat(result.content).allMatch { it.processingType == ProcessingType.EXAM_QUESTIONS }
        verify(exactly = 1) { documentHistoryRepository.findByUserIdAndProcessingType(userId, processingType, pageable) }
    }

    @Test
    fun `getDocumentHistory should handle empty result for specific processingType`() {
        // given
        val userId = 1L
        val processingType = ProcessingType.EXAM_QUESTIONS
        val pageable = PageRequest.of(0, 10)
        val emptyPage = PageImpl<DocumentHistory>(emptyList(), pageable, 0L)

        every {
            documentHistoryRepository.findByUserIdAndProcessingType(userId, processingType, pageable)
        } returns emptyPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, processingType, pageable)

        // then
        assertThat(result.content).isEmpty()
        assertThat(result.totalElements).isEqualTo(0L)
    }

    @Test
    fun `getDocumentHistory should handle different user IDs independently`() {
        // given
        val userId1 = 1L
        val userId2 = 2L
        val pageable = PageRequest.of(0, 10)

        val user1Histories = listOf(createDocumentHistory(1L, userId1, ProcessingType.SUMMARY))
        val user2Histories = listOf(createDocumentHistory(2L, userId2, ProcessingType.EXAM_QUESTIONS))

        every {
            documentHistoryRepository.findByUserId(userId1, pageable)
        } returns PageImpl(user1Histories, pageable, 1L)

        every {
            documentHistoryRepository.findByUserId(userId2, pageable)
        } returns PageImpl(user2Histories, pageable, 1L)

        // when
        val result1 = documentHistoryService.getDocumentHistory(userId1, null, pageable)
        val result2 = documentHistoryService.getDocumentHistory(userId2, null, pageable)

        // then
        assertThat(result1.content.first().userId).isEqualTo(userId1)
        assertThat(result2.content.first().userId).isEqualTo(userId2)
        verify(exactly = 1) { documentHistoryRepository.findByUserId(userId1, pageable) }
        verify(exactly = 1) { documentHistoryRepository.findByUserId(userId2, pageable) }
    }

    @Test
    fun `getDocumentHistory should preserve pageable properties`() {
        // given
        val userId = 1L
        val pageable = PageRequest.of(2, 20, Sort.by("createdAt").descending())
        val histories = (1..20).map { createDocumentHistory(it.toLong(), userId, ProcessingType.SUMMARY) }
        val expectedPage = PageImpl(histories, pageable, 100L)

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns expectedPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.number).isEqualTo(2)
        assertThat(result.size).isEqualTo(20)
        assertThat(result.sort.isSorted).isTrue()
        verify(exactly = 1) { documentHistoryRepository.findByUserId(userId, pageable) }
    }

    @Test
    fun `getDocumentHistory should handle edge case with page beyond total pages`() {
        // given
        val userId = 1L
        val pageable = PageRequest.of(10, 10) // Page 10, but only 2 pages exist
        val emptyPage = PageImpl<DocumentHistory>(emptyList(), pageable, 20L)

        every {
            documentHistoryRepository.findByUserId(userId, pageable)
        } returns emptyPage

        // when
        val result = documentHistoryService.getDocumentHistory(userId, null, pageable)

        // then
        assertThat(result.content).isEmpty()
        assertThat(result.totalElements).isEqualTo(20L)
        assertThat(result.totalPages).isEqualTo(2)
        assertThat(result.number).isEqualTo(10)
    }

    private fun createDocumentHistory(
        id: Long,
        userId: Long,
        processingType: ProcessingType,
        createdAt: LocalDateTime = LocalDateTime.now(),
    ): DocumentHistory =
        DocumentHistory(
            id = id,
            userId = userId,
            processingType = processingType,
            userPrompt = "Test prompt",
            inputFilePath = "datas/input/testuser_${id}_123-456.pdf",
            outputFilePath = "datas/output/testuser_${id}_123-456_${processingType.name.lowercase()}.pdf",
            createdAt = createdAt,
        )
}
