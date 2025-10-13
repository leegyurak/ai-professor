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
import java.util.Base64

@Transactional
class DocumentHistoryRepositoryImplTest : IntegrationTestBase() {
    @Autowired
    private lateinit var documentHistoryRepository: DocumentHistoryRepository

    @Autowired
    private lateinit var jpaUserRepository: JpaUserRepository

    private lateinit var testUser: User
    private val testPdfBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
    private val testResultBase64 = Base64.getEncoder().encodeToString("result pdf content".toByteArray())

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
                inputBase64 = testPdfBase64,
                outputBase64 = testResultBase64,
                createdAt = LocalDateTime.now(),
            )

        // When
        val savedHistory = documentHistoryRepository.save(history)

        // Then
        assertNotNull(savedHistory.id)
        assertEquals(testUser.id, savedHistory.userId)
        assertEquals(ProcessingType.SUMMARY, savedHistory.processingType)
        assertEquals("Test summary prompt", savedHistory.userPrompt)
        assertEquals(testPdfBase64, savedHistory.inputBase64)
        assertEquals(testResultBase64, savedHistory.outputBase64)
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
                inputBase64 = testPdfBase64,
                outputBase64 = testResultBase64,
                createdAt = LocalDateTime.now(),
            )

        // When
        val savedHistory = documentHistoryRepository.save(history)

        // Then
        assertNotNull(savedHistory.id)
        assertEquals(testUser.id, savedHistory.userId)
        assertEquals(ProcessingType.EXAM_QUESTIONS, savedHistory.processingType)
        assertEquals("Test exam questions prompt", savedHistory.userPrompt)
        assertEquals(testPdfBase64, savedHistory.inputBase64)
        assertEquals(testResultBase64, savedHistory.outputBase64)
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
                inputBase64 = testPdfBase64,
                outputBase64 = testResultBase64,
                createdAt = LocalDateTime.now(),
            )

        // When
        val savedHistory = documentHistoryRepository.save(history)

        // Then
        assertNotNull(savedHistory.id)
        assertEquals(testUser.id, savedHistory.userId)
        assertEquals(ProcessingType.SUMMARY, savedHistory.processingType)
        assertEquals(null, savedHistory.userPrompt)
        assertEquals(testPdfBase64, savedHistory.inputBase64)
        assertEquals(testResultBase64, savedHistory.outputBase64)
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
                inputBase64 = testPdfBase64,
                outputBase64 = testResultBase64,
                createdAt = LocalDateTime.now(),
            )

        val history2 =
            DocumentHistory(
                userId = testUser.id!!,
                processingType = ProcessingType.EXAM_QUESTIONS,
                userPrompt = "Second prompt",
                inputBase64 = testPdfBase64,
                outputBase64 = testResultBase64,
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
    fun `should save document history with large base64 content`() {
        // Given
        val largePdfBase64 = Base64.getEncoder().encodeToString("a".repeat(100000).toByteArray())
        val largeResultBase64 = Base64.getEncoder().encodeToString("b".repeat(100000).toByteArray())

        val history =
            DocumentHistory(
                userId = testUser.id!!,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test large content",
                inputBase64 = largePdfBase64,
                outputBase64 = largeResultBase64,
                createdAt = LocalDateTime.now(),
            )

        // When
        val savedHistory = documentHistoryRepository.save(history)

        // Then
        assertNotNull(savedHistory.id)
        assertEquals(largePdfBase64, savedHistory.inputBase64)
        assertEquals(largeResultBase64, savedHistory.outputBase64)
    }
}
