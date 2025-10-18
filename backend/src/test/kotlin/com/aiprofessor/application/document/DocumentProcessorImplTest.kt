package com.aiprofessor.application.document

import com.aiprofessor.domain.document.CrammingRequest
import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.DocumentRequest
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.domain.user.User
import com.aiprofessor.domain.user.UserRepository
import com.aiprofessor.infrastructure.claude.ClaudeApiClient
import com.aiprofessor.infrastructure.util.FileStorageUtils
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
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.LocalDateTime
import java.util.Base64

class DocumentProcessorImplTest {
    private lateinit var claudeApiClient: ClaudeApiClient
    private lateinit var pdfUtils: PdfUtils
    private lateinit var promptLoader: PromptLoader
    private lateinit var documentHistoryRepository: DocumentHistoryRepository
    private lateinit var fileStorageUtils: FileStorageUtils
    private lateinit var userRepository: UserRepository
    private lateinit var documentProcessor: DocumentProcessorImpl

    private val testUserId = 1L
    private val testUsername = "testuser"
    private val testUser =
        User(
            id = testUserId,
            username = testUsername,
            password = "password",
            email = "test@example.com",
            createdAt = LocalDateTime.now(),
        )
    private val testPdfBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
    private val testPdfBytes = "test pdf content".toByteArray()
    private val testExtractedText = "Extracted text from PDF document."
    private val testUserPrompt = "Test prompt"
    private val testMarkdownResponse = "# Test Response\n\nThis is a test response."
    private val testResultPdfBytes = "result pdf content".toByteArray()
    private val testInputFilePath = "datas/input/testuser_123-456.pdf"
    private val testOutputFilePath = "datas/output/testuser_789-abc_summary.pdf"
    private val testOutputUrl = "https://test.example.com/datas/output/testuser_789-abc_summary.pdf"

    @BeforeEach
    fun setup() {
        claudeApiClient = mockk()
        pdfUtils = mockk()
        promptLoader = mockk()
        documentHistoryRepository = mockk()
        fileStorageUtils = mockk()
        userRepository = mockk()

        every { promptLoader.loadPrompt("summary.md") } returns "Summary prompt"
        every { promptLoader.loadPrompt("exam-questions.md") } returns "Exam questions prompt"
        every { promptLoader.loadPrompt("cramming.md") } returns "Cramming prompt"

        documentProcessor =
            DocumentProcessorImpl(
                claudeApiClient = claudeApiClient,
                pdfUtils = pdfUtils,
                promptLoader = promptLoader,
                documentHistoryRepository = documentHistoryRepository,
                fileStorageUtils = fileStorageUtils,
                userRepository = userRepository,
            )
    }

    @Test
    fun `processSummary should validate PDF, save files, call Claude API, and save history`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Summary prompt",
                    userPrompt = testUserPrompt,
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) } returns testOutputFilePath
            every { fileStorageUtils.filePathToUrl(testInputFilePath) } returns "https://test.example.com/$testInputFilePath"
            every { fileStorageUtils.filePathToUrl(testOutputFilePath) } returns testOutputUrl

            val historySlot = slot<DocumentHistory>()
            every { documentHistoryRepository.save(capture(historySlot)) } answers { firstArg() }

            // When
            val response = documentProcessor.processSummary(request)

            // Then
            assertEquals(testOutputUrl, response.resultPdfUrl)

            verify(exactly = 1) { userRepository.findById(testUserId) }
            verify(exactly = 1) { pdfUtils.base64ToPdfBytes(testPdfBase64) }
            verify(exactly = 1) { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) }
            coVerify(exactly = 1) {
                claudeApiClient.sendMessage(
                    systemPrompt = "Summary prompt",
                    userPrompt = testUserPrompt,
                    extractedText = testExtractedText,
                )
            }
            verify(exactly = 1) { pdfUtils.markdownToPdf(testMarkdownResponse) }
            verify(exactly = 1) { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) }
            verify(exactly = 1) { fileStorageUtils.filePathToUrl(testOutputFilePath) }
            verify(exactly = 1) { documentHistoryRepository.save(any()) }

            // Verify saved history
            val savedHistory = historySlot.captured
            assertEquals(testUserId, savedHistory.userId)
            assertEquals(ProcessingType.SUMMARY, savedHistory.processingType)
            assertEquals(testUserPrompt, savedHistory.userPrompt)
            assertEquals(testInputFilePath, savedHistory.inputFilePath)
            assertEquals(testOutputFilePath, savedHistory.outputFilePath)
            assertNotNull(savedHistory.createdAt)
        }

    @Test
    fun `processExamQuestions should validate PDF, save files, call Claude API, and save history`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            val examOutputFilePath = "datas/output/testuser_789-abc_exam_questions.pdf"
            val examOutputUrl = "https://test.example.com/$examOutputFilePath"

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Exam questions prompt",
                    userPrompt = testUserPrompt,
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "EXAM_QUESTIONS", testResultPdfBytes) } returns examOutputFilePath
            every { fileStorageUtils.filePathToUrl(testInputFilePath) } returns "https://test.example.com/$testInputFilePath"
            every { fileStorageUtils.filePathToUrl(examOutputFilePath) } returns examOutputUrl

            val historySlot = slot<DocumentHistory>()
            every { documentHistoryRepository.save(capture(historySlot)) } answers { firstArg() }

            // When
            val response = documentProcessor.processExamQuestions(request)

            // Then
            assertEquals(examOutputUrl, response.resultPdfUrl)

            verify(exactly = 1) { userRepository.findById(testUserId) }
            verify(exactly = 1) { pdfUtils.base64ToPdfBytes(testPdfBase64) }
            verify(exactly = 1) { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) }
            coVerify(exactly = 1) {
                claudeApiClient.sendMessage(
                    systemPrompt = "Exam questions prompt",
                    userPrompt = testUserPrompt,
                    extractedText = testExtractedText,
                )
            }
            verify(exactly = 1) { pdfUtils.markdownToPdf(testMarkdownResponse) }
            verify(exactly = 1) { fileStorageUtils.saveOutputPdf(testUsername, "EXAM_QUESTIONS", testResultPdfBytes) }
            verify(exactly = 1) { fileStorageUtils.filePathToUrl(examOutputFilePath) }
            verify(exactly = 1) { documentHistoryRepository.save(any()) }

            // Verify saved history
            val savedHistory = historySlot.captured
            assertEquals(testUserId, savedHistory.userId)
            assertEquals(ProcessingType.EXAM_QUESTIONS, savedHistory.processingType)
            assertEquals(testUserPrompt, savedHistory.userPrompt)
            assertEquals(testInputFilePath, savedHistory.inputFilePath)
            assertEquals(examOutputFilePath, savedHistory.outputFilePath)
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

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Summary prompt",
                    userPrompt = "Please analyze this document.",
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) } returns testOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns testOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            val response = documentProcessor.processSummary(request)

            // Then
            assertEquals(testOutputUrl, response.resultPdfUrl)
            coVerify(exactly = 1) {
                claudeApiClient.sendMessage(
                    systemPrompt = "Summary prompt",
                    userPrompt = "Please analyze this document.",
                    extractedText = testExtractedText,
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

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            // Should be cleaned
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Summary prompt",
                    userPrompt = testUserPrompt,
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) } returns testOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns testOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            val response = documentProcessor.processSummary(request)

            // Then
            assertEquals(testOutputUrl, response.resultPdfUrl)
            coVerify(exactly = 1) {
                claudeApiClient.sendMessage(
                    systemPrompt = "Summary prompt",
                    userPrompt = testUserPrompt,
                    extractedText = testExtractedText,
                )
            }
        }

    @Test
    fun `processSummary should throw exception when user not found`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            every { userRepository.findById(testUserId) } returns null

            // When & Then
            val exception =
                org.junit.jupiter.api.assertThrows<IllegalArgumentException> {
                    runBlocking { documentProcessor.processSummary(request) }
                }
            assertTrue(exception.message!!.contains("User not found"))
        }

    @Test
    fun `processExamQuestions should throw exception when user not found`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            every { userRepository.findById(testUserId) } returns null

            // When & Then
            val exception =
                org.junit.jupiter.api.assertThrows<IllegalArgumentException> {
                    runBlocking { documentProcessor.processExamQuestions(request) }
                }
            assertTrue(exception.message!!.contains("User not found"))
        }

    @Test
    fun `processSummary should handle file storage failure gracefully`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } throws
                java.io.IOException("Disk full")

            // When & Then
            org.junit.jupiter.api.assertThrows<java.io.IOException> {
                runBlocking { documentProcessor.processSummary(request) }
            }
        }

    @Test
    fun `processSummary should handle Claude API failure`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(any(), any(), any())
            } throws RuntimeException("API Error")

            // When & Then
            org.junit.jupiter.api.assertThrows<RuntimeException> {
                runBlocking { documentProcessor.processSummary(request) }
            }
        }

    @Test
    fun `processSummary should handle markdown to PDF conversion failure`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(any(), any(), any())
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } throws
                RuntimeException("PDF conversion failed")

            // When & Then
            org.junit.jupiter.api.assertThrows<RuntimeException> {
                runBlocking { documentProcessor.processSummary(request) }
            }
        }

    @Test
    fun `processSummary should handle database save failure`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(any(), any(), any())
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) } returns testOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns testOutputUrl
            every { documentHistoryRepository.save(any()) } throws
                RuntimeException("Database connection failed")

            // When & Then
            org.junit.jupiter.api.assertThrows<RuntimeException> {
                runBlocking { documentProcessor.processSummary(request) }
            }
        }

    @Test
    fun `processSummary should handle invalid base64`() =
        runBlocking {
            // Given
            val invalidBase64 = "not-valid-base64!!!"
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = invalidBase64,
                    userPrompt = testUserPrompt,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(any()) } throws IllegalArgumentException("Invalid base64")

            // When & Then
            org.junit.jupiter.api.assertThrows<IllegalArgumentException> {
                runBlocking { documentProcessor.processSummary(request) }
            }
        }

    @Test
    fun `processSummary should handle very long user prompt`() =
        runBlocking {
            // Given
            val longPrompt = "A".repeat(10000)
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = longPrompt,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage("Summary prompt", longPrompt, testExtractedText)
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) } returns testOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns testOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            val response = documentProcessor.processSummary(request)

            // Then
            assertEquals(testOutputUrl, response.resultPdfUrl)
            coVerify(exactly = 1) {
                claudeApiClient.sendMessage("Summary prompt", longPrompt, testExtractedText)
            }
        }

    @Test
    fun `processExamQuestions should handle all processing steps successfully`() =
        runBlocking {
            // Given
            // Test with null prompt
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = null,
                )

            val examOutputFilePath = "datas/output/testuser_789-abc_exam_questions.pdf"
            val examOutputUrl = "https://test.example.com/$examOutputFilePath"

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(
                    "Exam questions prompt",
                    "Please analyze this document.",
                    testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "EXAM_QUESTIONS", testResultPdfBytes) } returns examOutputFilePath
            every { fileStorageUtils.filePathToUrl(testInputFilePath) } returns "https://test.example.com/$testInputFilePath"
            every { fileStorageUtils.filePathToUrl(examOutputFilePath) } returns examOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            val response = documentProcessor.processExamQuestions(request)

            // Then
            assertEquals(examOutputUrl, response.resultPdfUrl)

            // Verify all steps were called
            verify(exactly = 1) { userRepository.findById(testUserId) }
            verify(exactly = 1) { pdfUtils.base64ToPdfBytes(testPdfBase64) }
            verify(exactly = 1) { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) }
            coVerify(exactly = 1) {
                claudeApiClient.sendMessage(
                    "Exam questions prompt",
                    "Please analyze this document.",
                    testExtractedText,
                )
            }
            verify(exactly = 1) { pdfUtils.markdownToPdf(testMarkdownResponse) }
            verify(exactly = 1) { fileStorageUtils.saveOutputPdf(testUsername, "EXAM_QUESTIONS", testResultPdfBytes) }
            verify(exactly = 1) { documentHistoryRepository.save(any()) }
        }

    @Test
    fun `processSummary should save correct history data`() =
        runBlocking {
            // Given
            val customPrompt = "Custom analysis request"
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = customPrompt,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(any(), any(), any())
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) } returns testOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns testOutputUrl

            val historySlot = slot<DocumentHistory>()
            every { documentHistoryRepository.save(capture(historySlot)) } answers { firstArg() }

            // When
            documentProcessor.processSummary(request)

            // Then
            val savedHistory = historySlot.captured
            assertEquals(testUserId, savedHistory.userId)
            assertEquals(ProcessingType.SUMMARY, savedHistory.processingType)
            assertEquals(customPrompt, savedHistory.userPrompt)
            assertEquals(testInputFilePath, savedHistory.inputFilePath)
            assertEquals(testOutputFilePath, savedHistory.outputFilePath)
            assertNotNull(savedHistory.createdAt)
        }

    @Test
    fun `processSummary should include important parts in user prompt`() =
        runBlocking {
            // Given
            val importantParts = listOf("개념 A에 대한 설명", "예시 B 포함", "그림 C 설명")
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                    importantParts = importantParts,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText

            val capturedUserPrompt = slot<String>()
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Summary prompt",
                    userPrompt = capture(capturedUserPrompt),
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) } returns testOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns testOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            documentProcessor.processSummary(request)

            // Then
            val finalPrompt = capturedUserPrompt.captured
            assertTrue(finalPrompt.contains(testUserPrompt))
            assertTrue(finalPrompt.contains("중요: 다음 부분은 반드시 포함해주세요"))
            assertTrue(finalPrompt.contains("1. 개념 A에 대한 설명"))
            assertTrue(finalPrompt.contains("2. 예시 B 포함"))
            assertTrue(finalPrompt.contains("3. 그림 C 설명"))
        }

    @Test
    fun `processExamQuestions should include important parts in user prompt`() =
        runBlocking {
            // Given
            val importantParts = listOf("핵심 개념 X", "공식 Y")
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                    importantParts = importantParts,
                )

            val examOutputFilePath = "datas/output/testuser_789-abc_exam_questions.pdf"
            val examOutputUrl = "https://test.example.com/$examOutputFilePath"

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText

            val capturedUserPrompt = slot<String>()
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Exam questions prompt",
                    userPrompt = capture(capturedUserPrompt),
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "EXAM_QUESTIONS", testResultPdfBytes) } returns examOutputFilePath
            every { fileStorageUtils.filePathToUrl(testInputFilePath) } returns "https://test.example.com/$testInputFilePath"
            every { fileStorageUtils.filePathToUrl(examOutputFilePath) } returns examOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            documentProcessor.processExamQuestions(request)

            // Then
            val finalPrompt = capturedUserPrompt.captured
            assertTrue(finalPrompt.contains(testUserPrompt))
            assertTrue(finalPrompt.contains("중요: 다음 부분은 반드시 포함해주세요"))
            assertTrue(finalPrompt.contains("1. 핵심 개념 X"))
            assertTrue(finalPrompt.contains("2. 공식 Y"))
        }

    @Test
    fun `processSummary should work without important parts`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                    importantParts = null,
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText

            val capturedUserPrompt = slot<String>()
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Summary prompt",
                    userPrompt = capture(capturedUserPrompt),
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) } returns testOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns testOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            val response = documentProcessor.processSummary(request)

            // Then
            assertEquals(testOutputUrl, response.resultPdfUrl)
            val finalPrompt = capturedUserPrompt.captured
            assertEquals(testUserPrompt, finalPrompt) // Should be just the user prompt without important parts
        }

    @Test
    fun `processSummary should work with empty important parts list`() =
        runBlocking {
            // Given
            val request =
                DocumentRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    userPrompt = testUserPrompt,
                    importantParts = emptyList(),
                )

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText

            val capturedUserPrompt = slot<String>()
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Summary prompt",
                    userPrompt = capture(capturedUserPrompt),
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "SUMMARY", testResultPdfBytes) } returns testOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns testOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            val response = documentProcessor.processSummary(request)

            // Then
            assertEquals(testOutputUrl, response.resultPdfUrl)
            val finalPrompt = capturedUserPrompt.captured
            assertEquals(testUserPrompt, finalPrompt) // Should be just the user prompt without important parts
        }

    @Test
    fun `processCramming should process PDF and return markdown content and PDF URL`() =
        runBlocking {
            // Given
            val hoursUntilExam = 3
            val request =
                CrammingRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    hoursUntilExam = hoursUntilExam,
                )

            val crammingOutputFilePath = "datas/output/testuser_789-abc_cramming.pdf"
            val crammingOutputUrl = "https://test.example.com/$crammingOutputFilePath"

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Cramming prompt",
                    userPrompt = "시험까지 남은 시간: ${hoursUntilExam}시간",
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "CRAMMING", testResultPdfBytes) } returns crammingOutputFilePath
            every { fileStorageUtils.filePathToUrl(testInputFilePath) } returns "https://test.example.com/$testInputFilePath"
            every { fileStorageUtils.filePathToUrl(crammingOutputFilePath) } returns crammingOutputUrl

            val historySlot = slot<DocumentHistory>()
            every { documentHistoryRepository.save(capture(historySlot)) } answers { firstArg() }

            // When
            val response = documentProcessor.processCramming(request)

            // Then
            assertEquals(testMarkdownResponse, response.markdownContent)
            assertEquals(crammingOutputUrl, response.resultPdfUrl)

            verify(exactly = 1) { userRepository.findById(testUserId) }
            verify(exactly = 1) { pdfUtils.base64ToPdfBytes(testPdfBase64) }
            verify(exactly = 1) { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) }
            coVerify(exactly = 1) {
                claudeApiClient.sendMessage(
                    systemPrompt = "Cramming prompt",
                    userPrompt = "시험까지 남은 시간: ${hoursUntilExam}시간",
                    extractedText = testExtractedText,
                )
            }
            verify(exactly = 1) { pdfUtils.markdownToPdf(testMarkdownResponse) }
            verify(exactly = 1) { fileStorageUtils.saveOutputPdf(testUsername, "CRAMMING", testResultPdfBytes) }
            verify(exactly = 1) { fileStorageUtils.filePathToUrl(crammingOutputFilePath) }
            verify(exactly = 1) { documentHistoryRepository.save(any()) }

            // Verify saved history
            val savedHistory = historySlot.captured
            assertEquals(testUserId, savedHistory.userId)
            assertEquals(ProcessingType.CRAMMING, savedHistory.processingType)
            assertEquals("시험까지 남은 시간: ${hoursUntilExam}시간", savedHistory.userPrompt)
            assertEquals(testInputFilePath, savedHistory.inputFilePath)
            assertEquals(crammingOutputFilePath, savedHistory.outputFilePath)
            assertNotNull(savedHistory.createdAt)
        }

    @Test
    fun `processCramming should include hours until exam in user prompt`() =
        runBlocking {
            // Given
            val hoursUntilExam = 5
            val request =
                CrammingRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    hoursUntilExam = hoursUntilExam,
                )

            val crammingOutputFilePath = "datas/output/testuser_789-abc_cramming.pdf"
            val crammingOutputUrl = "https://test.example.com/$crammingOutputFilePath"

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText

            val capturedUserPrompt = slot<String>()
            coEvery {
                claudeApiClient.sendMessage(
                    systemPrompt = "Cramming prompt",
                    userPrompt = capture(capturedUserPrompt),
                    extractedText = testExtractedText,
                )
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "CRAMMING", testResultPdfBytes) } returns crammingOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns crammingOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            documentProcessor.processCramming(request)

            // Then
            val finalPrompt = capturedUserPrompt.captured
            assertEquals("시험까지 남은 시간: ${hoursUntilExam}시간", finalPrompt)
            assertTrue(finalPrompt.contains("5시간"))
        }

    @Test
    fun `processCramming should throw exception when user not found`() =
        runBlocking {
            // Given
            val request =
                CrammingRequest(
                    userId = testUserId,
                    pdfBase64 = testPdfBase64,
                    hoursUntilExam = 3,
                )

            every { userRepository.findById(testUserId) } returns null

            // When & Then
            val exception =
                org.junit.jupiter.api.assertThrows<IllegalArgumentException> {
                    runBlocking { documentProcessor.processCramming(request) }
                }
            assertTrue(exception.message!!.contains("User not found"))
        }

    @Test
    fun `processCramming should clean base64 string with data URL prefix`() =
        runBlocking {
            // Given
            val base64WithPrefix = "data:application/pdf;base64,$testPdfBase64"
            val request =
                CrammingRequest(
                    userId = testUserId,
                    pdfBase64 = base64WithPrefix,
                    hoursUntilExam = 2,
                )

            val crammingOutputFilePath = "datas/output/testuser_789-abc_cramming.pdf"
            val crammingOutputUrl = "https://test.example.com/$crammingOutputFilePath"

            every { userRepository.findById(testUserId) } returns testUser
            every { pdfUtils.base64ToPdfBytes(testPdfBase64) } returns testPdfBytes
            every { fileStorageUtils.saveInputPdf(testUsername, testPdfBytes) } returns testInputFilePath
            every { pdfUtils.extractTextFromPdf(testPdfBytes) } returns testExtractedText
            coEvery {
                claudeApiClient.sendMessage(any(), any(), any())
            } returns testMarkdownResponse
            every { pdfUtils.markdownToPdf(testMarkdownResponse) } returns testResultPdfBytes
            every { fileStorageUtils.saveOutputPdf(testUsername, "CRAMMING", testResultPdfBytes) } returns crammingOutputFilePath
            every { fileStorageUtils.filePathToUrl(any()) } returns crammingOutputUrl
            every { documentHistoryRepository.save(any()) } answers { firstArg() }

            // When
            val response = documentProcessor.processCramming(request)

            // Then
            assertEquals(crammingOutputUrl, response.resultPdfUrl)
            assertEquals(testMarkdownResponse, response.markdownContent)
            verify(exactly = 1) { pdfUtils.base64ToPdfBytes(testPdfBase64) }
        }
}
