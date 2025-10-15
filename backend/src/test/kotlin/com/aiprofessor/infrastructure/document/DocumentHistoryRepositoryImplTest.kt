package com.aiprofessor.infrastructure.document

import com.aiprofessor.IntegrationTestBase
import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.domain.user.User
import com.aiprofessor.infrastructure.user.JpaUserRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Transactional
class DocumentHistoryRepositoryImplTest : IntegrationTestBase() {
    @Autowired
    private lateinit var documentHistoryRepository: DocumentHistoryRepository

    @Autowired
    private lateinit var jpaUserRepository: JpaUserRepository

    private lateinit var testUser: User

    @BeforeEach
    fun setup() {
        testUser =
            jpaUserRepository.save(
                User(
                    username = "test-user",
                    password = "hashed-password",
                    email = "test@example.com",
                ),
            )
    }

    @Test
    fun `should save and retrieve document history for summary`() {
        // Given
        val history =
            DocumentHistory(
                userId = testUser.id!!,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test summary prompt",
                inputFilePath = "datas/input/testuser_123-456.pdf",
                outputFilePath = "datas/output/testuser_123-456_summary.pdf",
                createdAt = LocalDateTime.now(),
            )

        // When
        val savedHistory = documentHistoryRepository.save(history)

        // Then
        assertNotNull(savedHistory.id)
        assertEquals(testUser.id, savedHistory.userId)
        assertEquals(ProcessingType.SUMMARY, savedHistory.processingType)
        assertEquals("Test summary prompt", savedHistory.userPrompt)
        assertEquals("datas/input/testuser_123-456.pdf", savedHistory.inputFilePath)
        assertEquals("datas/output/testuser_123-456_summary.pdf", savedHistory.outputFilePath)
        assertNotNull(savedHistory.createdAt)
    }

    @Test
    fun `should save and retrieve document history for exam questions`() {
        // Given
        val history =
            DocumentHistory(
                userId = testUser.id!!,
                processingType = ProcessingType.EXAM_QUESTIONS,
                userPrompt = "Test exam questions prompt",
                inputFilePath = "datas/input/testuser_789-abc.pdf",
                outputFilePath = "datas/output/testuser_789-abc_exam_questions.pdf",
                createdAt = LocalDateTime.now(),
            )

        // When
        val savedHistory = documentHistoryRepository.save(history)

        // Then
        assertNotNull(savedHistory.id)
        assertEquals(testUser.id, savedHistory.userId)
        assertEquals(ProcessingType.EXAM_QUESTIONS, savedHistory.processingType)
        assertEquals("Test exam questions prompt", savedHistory.userPrompt)
        assertEquals("datas/input/testuser_789-abc.pdf", savedHistory.inputFilePath)
        assertEquals("datas/output/testuser_789-abc_exam_questions.pdf", savedHistory.outputFilePath)
        assertNotNull(savedHistory.createdAt)
    }

    @Test
    fun `should save document history with null userPrompt`() {
        // Given
        val history =
            DocumentHistory(
                userId = testUser.id!!,
                processingType = ProcessingType.SUMMARY,
                userPrompt = null,
                inputFilePath = "datas/input/testuser_def-123.pdf",
                outputFilePath = "datas/output/testuser_def-123_summary.pdf",
                createdAt = LocalDateTime.now(),
            )

        // When
        val savedHistory = documentHistoryRepository.save(history)

        // Then
        assertNotNull(savedHistory.id)
        assertEquals(testUser.id, savedHistory.userId)
        assertEquals(ProcessingType.SUMMARY, savedHistory.processingType)
        assertEquals(null, savedHistory.userPrompt)
        assertEquals("datas/input/testuser_def-123.pdf", savedHistory.inputFilePath)
        assertEquals("datas/output/testuser_def-123_summary.pdf", savedHistory.outputFilePath)
        assertNotNull(savedHistory.createdAt)
    }

    @Test
    fun `should save multiple document histories for same user`() {
        // Given
        val history1 =
            DocumentHistory(
                userId = testUser.id!!,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "First prompt",
                inputFilePath = "datas/input/testuser_aaa-111.pdf",
                outputFilePath = "datas/output/testuser_aaa-111_summary.pdf",
                createdAt = LocalDateTime.now(),
            )

        val history2 =
            DocumentHistory(
                userId = testUser.id!!,
                processingType = ProcessingType.EXAM_QUESTIONS,
                userPrompt = "Second prompt",
                inputFilePath = "datas/input/testuser_bbb-222.pdf",
                outputFilePath = "datas/output/testuser_bbb-222_exam_questions.pdf",
                createdAt = LocalDateTime.now(),
            )

        // When
        val savedHistory1 = documentHistoryRepository.save(history1)
        val savedHistory2 = documentHistoryRepository.save(history2)

        // Then
        assertNotNull(savedHistory1.id)
        assertNotNull(savedHistory2.id)
        assertEquals(testUser.id, savedHistory1.userId)
        assertEquals(testUser.id, savedHistory2.userId)
        assertEquals(ProcessingType.SUMMARY, savedHistory1.processingType)
        assertEquals(ProcessingType.EXAM_QUESTIONS, savedHistory2.processingType)
    }

    @Test
    fun `should save document history with long file paths`() {
        // Given
        val longUsername = "very_long_username_for_testing"
        val longInputPath = "datas/input/${longUsername}_123e4567-e89b-12d3-a456-426614174000.pdf"
        val longOutputPath = "datas/output/${longUsername}_123e4567-e89b-12d3-a456-426614174000_summary.pdf"

        val history =
            DocumentHistory(
                userId = testUser.id!!,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test long file paths",
                inputFilePath = longInputPath,
                outputFilePath = longOutputPath,
                createdAt = LocalDateTime.now(),
            )

        // When
        val savedHistory = documentHistoryRepository.save(history)

        // Then
        assertNotNull(savedHistory.id)
        assertEquals(longInputPath, savedHistory.inputFilePath)
        assertEquals(longOutputPath, savedHistory.outputFilePath)
    }
}
