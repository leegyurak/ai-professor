package com.aiprofessor.presentation.document

import com.aiprofessor.IntegrationTestBase
import com.aiprofessor.application.auth.JwtService
import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryService
import com.aiprofessor.domain.document.DocumentProcessor
import com.aiprofessor.domain.document.DocumentResponse
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.domain.session.SessionRepository
import com.aiprofessor.domain.session.UserSession
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.coEvery
import io.mockk.every
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.time.LocalDateTime
import java.util.Base64

@AutoConfigureMockMvc
class DocumentControllerTest : IntegrationTestBase() {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var jwtService: JwtService

    @MockkBean
    private lateinit var sessionRepository: SessionRepository

    @MockkBean
    private lateinit var documentProcessor: DocumentProcessor

    @MockkBean
    private lateinit var documentHistoryService: DocumentHistoryService

    private val testUserId = 1L
    private val testUsername = "testuser"
    private val testPdfBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
    private val testResultUrl = "https://test.example.com/datas/output/testuser_123-456_summary.pdf"
    private lateinit var validToken: String

    @BeforeEach
    fun setup() {
        validToken = jwtService.generateToken(testUserId, testUsername)
        val session =
            UserSession(
                userId = testUserId,
                token = validToken,
                ipAddress = "127.0.0.1",
                macAddress = "00:00:00:00:00:00",
            )
        every { sessionRepository.findByToken(validToken) } returns session
    }

    @Test
    fun `generateSummary should return 200 with result PDF`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = "Test prompt",
            )

        coEvery {
            documentProcessor.processSummary(
                match { it.userId == testUserId && it.pdfBase64 == testPdfBase64 },
            )
        } returns DocumentResponse(resultPdfUrl = testResultUrl)

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.resultPdfUrl") { value(testResultUrl) }
            }
    }

    @Test
    fun `generateExamQuestions should return 200 with result PDF`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = "Test prompt",
            )

        coEvery {
            documentProcessor.processExamQuestions(
                match { it.userId == testUserId && it.pdfBase64 == testPdfBase64 },
            )
        } returns DocumentResponse(resultPdfUrl = testResultUrl)

        // When & Then
        mockMvc
            .post("/api/documents/exam-questions") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.resultPdfUrl") { value(testResultUrl) }
            }
    }

    @Test
    fun `generateSummary should return 400 when pdfBase64 is blank`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = "",
                userPrompt = "Test prompt",
            )

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `generateSummary should work with null userPrompt`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = null,
            )

        coEvery {
            documentProcessor.processSummary(
                match { it.userId == testUserId && it.userPrompt == null },
            )
        } returns DocumentResponse(resultPdfUrl = testResultUrl)

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.resultPdfUrl") { value(testResultUrl) }
            }
    }

    @Test
    fun `generateExamQuestions should return 400 when pdfBase64 is blank`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = "",
                userPrompt = "Test prompt",
            )

        // When & Then
        mockMvc
            .post("/api/documents/exam-questions") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `getDocumentHistory should return paginated history without filter`() {
        // Given
        val history1 =
            DocumentHistory(
                id = 1L,
                userId = testUserId,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test prompt 1",
                inputFilePath = "datas/input/testuser_123-456.pdf",
                outputFilePath = "datas/output/testuser_123-456_summary.pdf",
                createdAt = LocalDateTime.now().minusDays(1),
            )
        val history2 =
            DocumentHistory(
                id = 2L,
                userId = testUserId,
                processingType = ProcessingType.EXAM_QUESTIONS,
                userPrompt = "Test prompt 2",
                inputFilePath = "datas/input/testuser_789-abc.pdf",
                outputFilePath = "datas/output/testuser_789-abc_exam_questions.pdf",
                createdAt = LocalDateTime.now(),
            )

        val page = PageImpl(listOf(history2, history1), PageRequest.of(0, 20), 2)

        every {
            documentHistoryService.getDocumentHistory(testUserId, null, any())
        } returns page

        // When & Then
        mockMvc
            .get("/api/documents/history") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.content.length()") { value(2) }
                jsonPath("$.content[0].id") { value(2) }
                jsonPath("$.content[0].processingType") { value("EXAM_QUESTIONS") }
                jsonPath("$.content[1].id") { value(1) }
                jsonPath("$.content[1].processingType") { value("SUMMARY") }
                jsonPath("$.pageNumber") { value(0) }
                jsonPath("$.pageSize") { value(20) }
                jsonPath("$.totalElements") { value(2) }
                jsonPath("$.totalPages") { value(1) }
                jsonPath("$.isLast") { value(true) }
            }
    }

    @Test
    fun `getDocumentHistory should return filtered history by processingType`() {
        // Given
        val history =
            DocumentHistory(
                id = 1L,
                userId = testUserId,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test prompt",
                inputFilePath = "datas/input/testuser_123-456.pdf",
                outputFilePath = "datas/output/testuser_123-456_summary.pdf",
                createdAt = LocalDateTime.now(),
            )

        val page = PageImpl(listOf(history), PageRequest.of(0, 20), 1)

        every {
            documentHistoryService.getDocumentHistory(testUserId, ProcessingType.SUMMARY, any())
        } returns page

        // When & Then
        mockMvc
            .get("/api/documents/history?processingType=SUMMARY") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.content.length()") { value(1) }
                jsonPath("$.content[0].processingType") { value("SUMMARY") }
                jsonPath("$.totalElements") { value(1) }
            }
    }

    @Test
    fun `getDocumentHistory should support custom pagination`() {
        // Given
        val histories =
            List(5) { index ->
                DocumentHistory(
                    id = index.toLong(),
                    userId = testUserId,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test prompt $index",
                    inputFilePath = "datas/input/testuser_$index-456.pdf",
                    outputFilePath = "datas/output/testuser_$index-456_summary.pdf",
                    createdAt = LocalDateTime.now().minusDays(index.toLong()),
                )
            }

        val page = PageImpl(histories, PageRequest.of(1, 5), 15)

        every {
            documentHistoryService.getDocumentHistory(testUserId, null, any())
        } returns page

        // When & Then
        mockMvc
            .get("/api/documents/history?page=1&size=5") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.content.length()") { value(5) }
                jsonPath("$.pageNumber") { value(1) }
                jsonPath("$.pageSize") { value(5) }
                jsonPath("$.totalElements") { value(15) }
                jsonPath("$.totalPages") { value(3) }
                jsonPath("$.isLast") { value(false) }
            }
    }

    @Test
    fun `getDocumentHistory should return 403 when not authenticated`() {
        // When & Then
        mockMvc
            .get("/api/documents/history")
            .andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `generateSummary should return 403 when not authenticated`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = "Test prompt",
            )

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
            }.andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `generateExamQuestions should return 403 when not authenticated`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = "Test prompt",
            )

        // When & Then
        mockMvc
            .post("/api/documents/exam-questions") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
            }.andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `generateSummary should return 403 when token is invalid`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = "Test prompt",
            )

        every { sessionRepository.findByToken("invalid-token") } returns null

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer invalid-token")
            }.andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `generateSummary should handle very long user prompt`() {
        // Given
        val longPrompt = "x".repeat(10000)
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = longPrompt,
            )

        coEvery {
            documentProcessor.processSummary(
                match { it.userPrompt == longPrompt },
            )
        } returns DocumentResponse(resultPdfUrl = testResultUrl)

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.resultPdfUrl") { value(testResultUrl) }
            }
    }

    @Test
    fun `generateSummary should handle large base64 PDF`() {
        // Given
        val largePdfBytes = ByteArray(10 * 1024 * 1024) // 10MB
        val largeBase64 = Base64.getEncoder().encodeToString(largePdfBytes)
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = largeBase64,
                userPrompt = "Test prompt",
            )

        coEvery {
            documentProcessor.processSummary(
                match { it.pdfBase64 == largeBase64 },
            )
        } returns DocumentResponse(resultPdfUrl = testResultUrl)

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.resultPdfUrl") { value(testResultUrl) }
            }
    }

    @Test
    fun `generateSummary should handle special characters in user prompt`() {
        // Given
        val specialPrompt = "Test with special chars: äöü 한글 日本語 @#\$%^&*()"
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = specialPrompt,
            )

        coEvery {
            documentProcessor.processSummary(
                match { it.userPrompt == specialPrompt },
            )
        } returns DocumentResponse(resultPdfUrl = testResultUrl)

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.resultPdfUrl") { value(testResultUrl) }
            }
    }

    @Test
    fun `getDocumentHistory should handle empty history gracefully`() {
        // Given
        val emptyPage = PageImpl<DocumentHistory>(emptyList(), PageRequest.of(0, 20), 0)

        every {
            documentHistoryService.getDocumentHistory(testUserId, null, any())
        } returns emptyPage

        // When & Then
        mockMvc
            .get("/api/documents/history") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.content.length()") { value(0) }
                jsonPath("$.totalElements") { value(0) }
                jsonPath("$.totalPages") { value(0) }
                jsonPath("$.isLast") { value(true) }
            }
    }

    @Test
    fun `getDocumentHistory should handle invalid processingType parameter`() {
        // When & Then
        mockMvc
            .get("/api/documents/history?processingType=INVALID_TYPE") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `getDocumentHistory should handle page number zero`() {
        // Given
        val histories =
            listOf(
                DocumentHistory(
                    id = 1L,
                    userId = testUserId,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test prompt",
                    inputFilePath = "datas/input/testuser_123-456.pdf",
                    outputFilePath = "datas/output/testuser_123-456_summary.pdf",
                    createdAt = LocalDateTime.now(),
                ),
            )

        val page = PageImpl(histories, PageRequest.of(0, 20), 1)

        every {
            documentHistoryService.getDocumentHistory(testUserId, null, any())
        } returns page

        // When & Then
        mockMvc
            .get("/api/documents/history?page=0") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.pageNumber") { value(0) }
                jsonPath("$.content.length()") { value(1) }
            }
    }

    @Test
    fun `getDocumentHistory should handle very large page size`() {
        // Given
        val histories =
            (1..100).map { index ->
                DocumentHistory(
                    id = index.toLong(),
                    userId = testUserId,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test prompt $index",
                    inputFilePath = "datas/input/testuser_$index-456.pdf",
                    outputFilePath = "datas/output/testuser_$index-456_summary.pdf",
                    createdAt = LocalDateTime.now().minusDays(index.toLong()),
                )
            }

        val page = PageImpl(histories, PageRequest.of(0, 1000), 100)

        every {
            documentHistoryService.getDocumentHistory(testUserId, null, any())
        } returns page

        // When & Then
        mockMvc
            .get("/api/documents/history?size=1000") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.content.length()") { value(100) }
                jsonPath("$.pageSize") { value(1000) }
            }
    }

    @Test
    fun `generateSummary should return 400 when request body is missing`() {
        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `generateSummary should return 400 when request body is malformed JSON`() {
        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = "{invalid json"
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `generateExamQuestions should handle empty userPrompt string`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = "",
            )

        coEvery {
            documentProcessor.processExamQuestions(
                match { it.userPrompt == "" },
            )
        } returns DocumentResponse(resultPdfUrl = testResultUrl)

        // When & Then
        mockMvc
            .post("/api/documents/exam-questions") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.resultPdfUrl") { value(testResultUrl) }
            }
    }

    @Test
    fun `getDocumentHistory should return URLs in correct format`() {
        // Given
        val history =
            DocumentHistory(
                id = 1L,
                userId = testUserId,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test prompt",
                inputFilePath = "datas/input/testuser_123-456.pdf",
                outputFilePath = "datas/output/testuser_123-456_summary.pdf",
                createdAt = LocalDateTime.now(),
            )

        val page = PageImpl(listOf(history), PageRequest.of(0, 20), 1)

        every {
            documentHistoryService.getDocumentHistory(testUserId, null, any())
        } returns page

        // When & Then
        mockMvc
            .get("/api/documents/history") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.content[0].inputUrl") { exists() }
                jsonPath("$.content[0].outputUrl") { exists() }
                jsonPath("$.content[0].inputUrl") { isString() }
                jsonPath("$.content[0].outputUrl") { isString() }
            }
    }

    @Test
    fun `getDocumentHistory should filter EXAM_QUESTIONS correctly`() {
        // Given
        val history =
            DocumentHistory(
                id = 1L,
                userId = testUserId,
                processingType = ProcessingType.EXAM_QUESTIONS,
                userPrompt = "Test prompt",
                inputFilePath = "datas/input/testuser_123-456.pdf",
                outputFilePath = "datas/output/testuser_123-456_exam_questions.pdf",
                createdAt = LocalDateTime.now(),
            )

        val page = PageImpl(listOf(history), PageRequest.of(0, 20), 1)

        every {
            documentHistoryService.getDocumentHistory(testUserId, ProcessingType.EXAM_QUESTIONS, any())
        } returns page

        // When & Then
        mockMvc
            .get("/api/documents/history?processingType=EXAM_QUESTIONS") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.content.length()") { value(1) }
                jsonPath("$.content[0].processingType") { value("EXAM_QUESTIONS") }
                jsonPath("$.content[0].outputUrl") { exists() }
            }
    }

    @Test
    fun `generateSummary should handle whitespace-only userPrompt`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = "   ",
            )

        coEvery {
            documentProcessor.processSummary(
                match { it.userPrompt == "   " },
            )
        } returns DocumentResponse(resultPdfUrl = testResultUrl)

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.resultPdfUrl") { value(testResultUrl) }
            }
    }

    @Test
    fun `generateSummary should preserve URL format in response`() {
        // Given
        val requestDto =
            DocumentRequestDto(
                pdfBase64 = testPdfBase64,
                userPrompt = "Test prompt",
            )

        val expectedUrl = "https://example.com/datas/output/user_uuid_summary.pdf"

        coEvery {
            documentProcessor.processSummary(any())
        } returns DocumentResponse(resultPdfUrl = expectedUrl)

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.resultPdfUrl") { value(expectedUrl) }
            }

        // Verify URL format
        assert(expectedUrl.startsWith("https://"))
    }
}
