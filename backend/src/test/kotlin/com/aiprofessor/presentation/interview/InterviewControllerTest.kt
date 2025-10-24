package com.aiprofessor.presentation.interview

import com.aiprofessor.IntegrationTestBase
import com.aiprofessor.application.auth.JwtService
import com.aiprofessor.domain.interview.InterviewService
import com.aiprofessor.domain.interview.UserInterview
import com.aiprofessor.domain.session.SessionRepository
import com.aiprofessor.domain.session.UserSession
import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import io.mockk.every
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.time.LocalDate

@AutoConfigureMockMvc
class InterviewControllerTest : IntegrationTestBase() {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var jwtService: JwtService

    @MockkBean
    private lateinit var sessionRepository: SessionRepository

    @MockkBean
    private lateinit var interviewService: InterviewService

    private val testUserId = 1L
    private val testUsername = "testuser"
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
    fun `createInterview should return 200 with created interview`() {
        // given
        val requestDto =
            CreateInterviewRequestDto(
                interviewDate = LocalDate.of(2024, 1, 15),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        val createdInterview =
            UserInterview(
                id = 1L,
                userId = testUserId,
                interviewDate = LocalDate.of(2024, 1, 15),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        every {
            interviewService.createInterview(
                testUserId,
                LocalDate.of(2024, 1, 15),
                "Backend Developer",
                "https://example.com/jobs/backend",
            )
        } returns createdInterview

        // when & then
        mockMvc
            .post("/api/interviews") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.id") { value(1) }
                jsonPath("$.userId") { value(testUserId) }
                jsonPath("$.interviewDate") { value("2024-01-15") }
                jsonPath("$.interviewType") { value("Backend Developer") }
                jsonPath("$.announcementUrl") { value("https://example.com/jobs/backend") }
            }
    }

    @Test
    fun `createInterview should return 400 when interviewDate is blank`() {
        // given
        val invalidJson =
            """
            {
                "interviewDate": "",
                "interviewType": "Backend Developer",
                "announcementUrl": "https://example.com/jobs/backend"
            }
            """.trimIndent()

        // when & then
        mockMvc
            .post("/api/interviews") {
                contentType = MediaType.APPLICATION_JSON
                content = invalidJson
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `createInterview should return 400 when interviewType is blank`() {
        // given
        val requestDto =
            CreateInterviewRequestDto(
                interviewDate = LocalDate.of(2024, 1, 15),
                interviewType = "",
                announcementUrl = "https://example.com/jobs/backend",
            )

        // when & then
        mockMvc
            .post("/api/interviews") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `createInterview should return 400 when announcementUrl is blank`() {
        // given
        val requestDto =
            CreateInterviewRequestDto(
                interviewDate = LocalDate.of(2024, 1, 15),
                interviewType = "Backend Developer",
                announcementUrl = "",
            )

        // when & then
        mockMvc
            .post("/api/interviews") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `getInterview should return 200 with interview details`() {
        // given
        val interviewId = 1L
        val interview =
            UserInterview(
                id = interviewId,
                userId = testUserId,
                interviewDate = LocalDate.of(2024, 1, 15),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        every { interviewService.getInterviewById(interviewId, testUserId) } returns interview

        // when & then
        mockMvc
            .get("/api/interviews/$interviewId") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.id") { value(interviewId) }
                jsonPath("$.userId") { value(testUserId) }
                jsonPath("$.interviewDate") { value("2024-01-15") }
                jsonPath("$.interviewType") { value("Backend Developer") }
                jsonPath("$.announcementUrl") { value("https://example.com/jobs/backend") }
            }
    }

    @Test
    fun `getAllInterviews should return 200 with list of interviews`() {
        // given
        val interviews =
            listOf(
                UserInterview(
                    id = 1L,
                    userId = testUserId,
                    interviewDate = LocalDate.of(2024, 1, 15),
                    interviewType = "Backend Developer",
                    announcementUrl = "https://example.com/jobs/backend",
                ),
                UserInterview(
                    id = 2L,
                    userId = testUserId,
                    interviewDate = LocalDate.of(2024, 1, 22),
                    interviewType = "Frontend Developer",
                    announcementUrl = "https://example.com/jobs/frontend",
                ),
            )

        every { interviewService.getAllInterviewsByUser(testUserId) } returns interviews

        // when & then
        mockMvc
            .get("/api/interviews") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.length()") { value(2) }
                jsonPath("$[0].id") { value(1) }
                jsonPath("$[0].interviewType") { value("Backend Developer") }
                jsonPath("$[1].id") { value(2) }
                jsonPath("$[1].interviewType") { value("Frontend Developer") }
            }
    }

    @Test
    fun `getAllInterviews should return empty list when no interviews exist`() {
        // given
        every { interviewService.getAllInterviewsByUser(testUserId) } returns emptyList()

        // when & then
        mockMvc
            .get("/api/interviews") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.length()") { value(0) }
            }
    }

    @Test
    fun `updateInterview should return 200 with updated interview`() {
        // given
        val interviewId = 1L
        val requestDto =
            UpdateInterviewRequestDto(
                interviewDate = LocalDate.of(2024, 2, 1),
                interviewType = "Full Stack Developer",
                announcementUrl = "https://example.com/jobs/fullstack",
            )

        val updatedInterview =
            UserInterview(
                id = interviewId,
                userId = testUserId,
                interviewDate = LocalDate.of(2024, 2, 1),
                interviewType = "Full Stack Developer",
                announcementUrl = "https://example.com/jobs/fullstack",
            )

        every {
            interviewService.updateInterview(
                interviewId,
                testUserId,
                LocalDate.of(2024, 2, 1),
                "Full Stack Developer",
                "https://example.com/jobs/fullstack",
            )
        } returns updatedInterview

        // when & then
        mockMvc
            .put("/api/interviews/$interviewId") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.id") { value(interviewId) }
                jsonPath("$.interviewDate") { value("2024-02-01") }
                jsonPath("$.interviewType") { value("Full Stack Developer") }
                jsonPath("$.announcementUrl") { value("https://example.com/jobs/fullstack") }
            }
    }

    @Test
    fun `updateInterview should update only provided fields`() {
        // given
        val interviewId = 1L
        val requestDto =
            UpdateInterviewRequestDto(
                interviewDate = LocalDate.of(2024, 2, 1),
                interviewType = null,
                announcementUrl = null,
            )

        val updatedInterview =
            UserInterview(
                id = interviewId,
                userId = testUserId,
                interviewDate = LocalDate.of(2024, 2, 1),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        every {
            interviewService.updateInterview(
                interviewId,
                testUserId,
                LocalDate.of(2024, 2, 1),
                null,
                null,
            )
        } returns updatedInterview

        // when & then
        mockMvc
            .put("/api/interviews/$interviewId") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.id") { value(interviewId) }
                jsonPath("$.interviewDate") { value("2024-02-01") }
            }
    }

    @Test
    fun `deleteInterview should return 204 when successful`() {
        // given
        val interviewId = 1L

        every { interviewService.deleteInterview(interviewId, testUserId) } returns Unit

        // when & then
        mockMvc
            .delete("/api/interviews/$interviewId") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isNoContent() }
            }
    }

    @Test
    fun `createInterview should return 403 when not authenticated`() {
        // given
        val requestDto =
            CreateInterviewRequestDto(
                interviewDate = LocalDate.of(2024, 1, 15),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        // when & then
        mockMvc
            .post("/api/interviews") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
            }.andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `getInterview should return 403 when not authenticated`() {
        // when & then
        mockMvc
            .get("/api/interviews/1")
            .andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `getAllInterviews should return 403 when not authenticated`() {
        // when & then
        mockMvc
            .get("/api/interviews")
            .andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `updateInterview should return 403 when not authenticated`() {
        // given
        val requestDto =
            UpdateInterviewRequestDto(
                interviewDate = LocalDate.of(2024, 2, 1),
                interviewType = "Full Stack Developer",
                announcementUrl = "https://example.com/jobs/fullstack",
            )

        // when & then
        mockMvc
            .put("/api/interviews/1") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
            }.andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `deleteInterview should return 403 when not authenticated`() {
        // when & then
        mockMvc
            .delete("/api/interviews/1")
            .andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `createInterview should handle invalid date format`() {
        // given
        val invalidJson =
            """
            {
                "interviewDate": "invalid-date",
                "interviewType": "Backend Developer",
                "announcementUrl": "https://example.com/jobs/backend"
            }
            """.trimIndent()

        // when & then
        mockMvc
            .post("/api/interviews") {
                contentType = MediaType.APPLICATION_JSON
                content = invalidJson
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `createInterview should handle malformed JSON`() {
        // when & then
        mockMvc
            .post("/api/interviews") {
                contentType = MediaType.APPLICATION_JSON
                content = "{invalid json"
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `createInterview should handle special characters in fields`() {
        // given
        val requestDto =
            CreateInterviewRequestDto(
                interviewDate = LocalDate.of(2024, 1, 15),
                interviewType = "Backend Developer with 한글 & Special Chars!",
                announcementUrl = "https://example.com/jobs/backend?id=123&lang=ko",
            )

        val createdInterview =
            UserInterview(
                id = 1L,
                userId = testUserId,
                interviewDate = LocalDate.of(2024, 1, 15),
                interviewType = "Backend Developer with 한글 & Special Chars!",
                announcementUrl = "https://example.com/jobs/backend?id=123&lang=ko",
            )

        every {
            interviewService.createInterview(
                testUserId,
                LocalDate.of(2024, 1, 15),
                "Backend Developer with 한글 & Special Chars!",
                "https://example.com/jobs/backend?id=123&lang=ko",
            )
        } returns createdInterview

        // when & then
        mockMvc
            .post("/api/interviews") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.interviewType") { value("Backend Developer with 한글 & Special Chars!") }
                jsonPath("$.announcementUrl") { value("https://example.com/jobs/backend?id=123&lang=ko") }
            }
    }
}
