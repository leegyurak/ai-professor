package com.aiprofessor.application.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.DocumentRequest
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.infrastructure.claude.ClaudeApiClient
import com.aiprofessor.infrastructure.util.PdfUtils
import com.aiprofessor.infrastructure.util.PromptLoader
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.Base64

class DocumentProcessorImplTest {
    private lateinit var claudeApiClient: ClaudeApiClient
    private lateinit var pdfUtils: PdfUtils
    private lateinit var promptLoader: PromptLoader
    private lateinit var documentHistoryRepository: DocumentHistoryRepository
    private lateinit var cacheService: com.aiprofessor.infrastructure.document.DocumentHistoryCacheService
    private lateinit var documentProcessor: DocumentProcessorImpl

    private val testUserId = 1L
    private val testPdfBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
    private val testUserPrompt = "Test prompt"
    private val testMarkdownResponse = "# Test Response\n\nThis is a test response."
    private val testResultPdfBytes = "result pdf content".toByteArray()
    private val testResultBase64 = Base64.getEncoder().encodeToString(testResultPdfBytes)

    @BeforeEach
    fun setup() {
        claudeApiClient = mockk()
        pdfUtils = mockk()
        promptLoader = mockk()
        documentHistoryRepository = mockk()
        cacheService = mockk(relaxed = true)

        every { promptLoader.loadPrompt("summary.md") } returns "Summary prompt"
        every { promptLoader.loadPrompt("exam-questions.md") } returns "Exam questions prompt"

        documentProcessor =
            DocumentProcessorImpl(
                claudeApiClient = claudeApiClient,
                pdfUtils = pdfUtils,
                promptLoader = promptLoader,
                documentHistoryRepository = documentHistoryRepository,
                cacheService = cacheService,
            )
    }

    @Test
    fun `processSummary should validate PDF, call Claude API, convert to PDF, and save history`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns "test pdf".toByteArray()
            coEvery {
                claudeApiClient.sendMessageWithTwoPass(
                    systemPrompt = "Summary prompt",
                    userPrompt = testUserPrompt,
                    pdfBase64 = testPdfBase64,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { pdfUtils.pdfBytesToBase64(testResultPdfBytes) } returns testResultBase64

            val historySlot = slot<DocumentHistory>()
            every { documentHistoryRepository.save(capture(historySlot)) } answers { firstArg() }

            // When
            val response = documentProcessor.processSummary(request)

            // Then
            assertEquals(testResultBase64, response.resultPdfBase64)

            verify(exactly = 1) { pdfUtils.base64ToPdfBytes(testPdfBase64) }
            coVerify(exactly = 1) {
                claudeApiClient.sendMessageWithTwoPass(
                    systemPrompt = "Summary prompt",
                    userPrompt = testUserPrompt,
                    pdfBase64 = testPdfBase64,
                )
            }
            verify(exactly = 1) { pdfUtils.markdownToPdf(testMarkdownResponse) }
            verify(exactly = 1) { pdfUtils.pdfBytesToBase64(testResultPdfBytes) }
            verify(exactly = 1) { documentHistoryRepository.save(any()) }

            // Verify saved history
            val savedHistory = historySlot.captured
            assertEquals(testUserId, savedHistory.userId)
            assertEquals(ProcessingType.SUMMARY, savedHistory.processingType)
            assertEquals(testUserPrompt, savedHistory.userPrompt)
            assertEquals(testPdfBase64, savedHistory.inputBase64)
            assertEquals(testResultBase64, savedHistory.outputBase64)
            assertNotNull(savedHistory.createdAt)
        }

    @Test
    fun `processExamQuestions should validate PDF, call Claude API, convert to PDF, and save history`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns "test pdf".toByteArray()
            coEvery {
                claudeApiClient.sendMessageWithTwoPass(
                    systemPrompt = "Exam questions prompt",
                    userPrompt = testUserPrompt,
                    pdfBase64 = testPdfBase64,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { pdfUtils.pdfBytesToBase64(testResultPdfBytes) } returns testResultBase64

            val historySlot = slot<DocumentHistory>()
            every { documentHistoryRepository.save(capture(historySlot)) } answers { firstArg() }

            // When
            val response = documentProcessor.processExamQuestions(request)

            // Then
            assertEquals(testResultBase64, response.resultPdfBase64)

            verify(exactly = 1) { pdfUtils.base64ToPdfBytes(testPdfBase64) }
            coVerify(exactly = 1) {
                claudeApiClient.sendMessageWithTwoPass(
                    systemPrompt = "Exam questions prompt",
                    userPrompt = testUserPrompt,
                    pdfBase64 = testPdfBase64,
                )
            }
            verify(exactly = 1) { pdfUtils.markdownToPdf(testMarkdownResponse) }
            verify(exactly = 1) { pdfUtils.pdfBytesToBase64(testResultPdfBytes) }
            verify(exactly = 1) { documentHistoryRepository.save(any()) }

            // Verify saved history
            val savedHistory = historySlot.captured
            assertEquals(testUserId, savedHistory.userId)
            assertEquals(ProcessingType.EXAM_QUESTIONS, savedHistory.processingType)
            assertEquals(testUserPrompt, savedHistory.userPrompt)
            assertEquals(testPdfBase64, savedHistory.inputBase64)
            assertEquals(testResultBase64, savedHistory.outputBase64)
            assertNotNull(savedHistory.createdAt)
        }

    @Test
    fun `processSummary should use default prompt when userPrompt is null`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = null,
                )

            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns "test pdf".toByteArray()
            coEvery {
                claudeApiClient.sendMessageWithTwoPass(
                    systemPrompt = "Summary prompt",
                    userPrompt = "Please analyze this document.",
                    pdfBase64 = testPdfBase64,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { pdfUtils.pdfBytesToBase64(testResultPdfBytes) } returns testResultBase64
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            val response = documentProcessor.processSummary(request)

            // Then
            assertEquals(testResultBase64, response.resultPdfBase64)
            coVerify(exactly = 1) {
                claudeApiClient.sendMessageWithTwoPass(
                    systemPrompt = "Summary prompt",
                    userPrompt = "Please analyze this document.",
                    pdfBase64 = testPdfBase64,
                )
            }
        }

    @Test
    fun `processSummary should clean base64 string with data URL prefix`() =
        runBlocking {
            // Given
            val base64WithPrefix = "data:application/pdf;base64,$testPdfBase64"
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = base64WithPrefix,
                    userPrompt = testUserPrompt,
                )

            every { pdfUtils.base64ToPdfBytes(base64WithPrefix) } returns "test pdf".toByteArray()
            // Should be cleaned
            coEvery {
                claudeApiClient.sendMessageWithTwoPass(
                    systemPrompt = "Summary prompt",
                    userPrompt = testUserPrompt,
                    pdfBase64 = testPdfBase64,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { pdfUtils.pdfBytesToBase64(testResultPdfBytes) } returns testResultBase64
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            val response = documentProcessor.processSummary(request)

            // Then
            assertEquals(testResultBase64, response.resultPdfBase64)
            coVerify(exactly = 1) {
                claudeApiClient.sendMessageWithTwoPass(
                    systemPrompt = "Summary prompt",
                    userPrompt = testUserPrompt,
                    pdfBase64 = testPdfBase64,
                )
            }
        }
}
