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
    private val testResultBase64 = Base64.getEncoder().encodeToString("result pdf content".toByteArray())
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
        } returns DocumentResponse(resultPdfBase64 = testResultBase64)

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.resultPdfBase64") { value(testResultBase64) }
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
        } returns DocumentResponse(resultPdfBase64 = testResultBase64)

        // When & Then
        mockMvc
            .post("/api/documents/exam-questions") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.resultPdfBase64") { value(testResultBase64) }
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
        } returns DocumentResponse(resultPdfBase64 = testResultBase64)

        // When & Then
        mockMvc
            .post("/api/documents/summary") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.resultPdfBase64") { value(testResultBase64) }
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
                inputBase64 = testPdfBase64,
                outputBase64 = testResultBase64,
                createdAt = LocalDateTime.now().minusDays(1),
            )
        val history2 =
            DocumentHistory(
                id = 2L,
                userId = testUserId,
                processingType = ProcessingType.EXAM_QUESTIONS,
                userPrompt = "Test prompt 2",
                inputBase64 = testPdfBase64,
                outputBase64 = testResultBase64,
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
                inputBase64 = testPdfBase64,
                outputBase64 = testResultBase64,
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
                    inputBase64 = testPdfBase64,
                    outputBase64 = testResultBase64,
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
}
