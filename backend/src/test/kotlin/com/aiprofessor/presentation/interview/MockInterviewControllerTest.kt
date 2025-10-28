package com.aiprofessor.presentation.interview

import com.aiprofessor.IntegrationTestBase
import com.aiprofessor.application.auth.JwtService
import com.aiprofessor.domain.interview.GradingResponse
import com.aiprofessor.domain.interview.InterviewService
import com.aiprofessor.domain.interview.MockInterviewResponse
import com.aiprofessor.domain.interview.UserMockInterview
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
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.Base64

@AutoConfigureMockMvc
class MockInterviewControllerTest : IntegrationTestBase() {
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
    private val testResumeBase64 = Base64.getEncoder().encodeToString("test resume content".toByteArray())

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
    fun `createMockInterview should return 200 with question markdown`() {
        // given
        val requestDto =
            CreateMockInterviewRequestDto(
                userInterviewId = 1L,
                resumeFile = testResumeBase64,
            )

        val questionMarkdown =
            """
            # 면접 예상 질문

            ## Q1. 자기소개를 해주세요
            ...
            """.trimIndent()

        val response =
            MockInterviewResponse(
                mockInterviewId = 1L,
                questionMarkdown = questionMarkdown,
            )

        coEvery {
            interviewService.createMockInterview(testUserId, 1L, testResumeBase64)
        } returns response

        // when & then
        mockMvc
            .post("/api/interviews/mock") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.mockInterviewId") { value(1) }
                jsonPath("$.questionMarkdown") { value(questionMarkdown) }
            }
    }

    @Test
    fun `createMockInterview should return 400 when userInterviewId is missing`() {
        // given
        val invalidJson =
            """
            {
                "resumeFile": "$testResumeBase64"
            }
            """.trimIndent()

        // when & then
        mockMvc
            .post("/api/interviews/mock") {
                contentType = MediaType.APPLICATION_JSON
                content = invalidJson
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `createMockInterview should return 400 when resumeFile is blank`() {
        // given
        val requestDto =
            CreateMockInterviewRequestDto(
                userInterviewId = 1L,
                resumeFile = "",
            )

        // when & then
        mockMvc
            .post("/api/interviews/mock") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `getMockInterview should return 200 with mock interview details`() {
        // given
        val mockInterviewId = 1L
        val mockInterview =
            UserMockInterview(
                id = mockInterviewId,
                userId = testUserId,
                userInterviewId = 1L,
                resumeFilePath = "datas/interview/user_1/resume_123.pdf",
                questionFilePath = "datas/interview/user_1/questions_123.pdf",
                gradingFilePath = "datas/interview/user_1/grading_123.pdf",
            )

        every { interviewService.getMockInterviewById(mockInterviewId, testUserId) } returns mockInterview

        // when & then
        mockMvc
            .get("/api/interviews/mock/$mockInterviewId") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.id") { value(mockInterviewId) }
                jsonPath("$.userId") { value(testUserId) }
                jsonPath("$.userInterviewId") { value(1) }
                jsonPath("$.resumeFilePath") { value("datas/interview/user_1/resume_123.pdf") }
                jsonPath("$.questionFilePath") { value("datas/interview/user_1/questions_123.pdf") }
                jsonPath("$.gradingFilePath") { value("datas/interview/user_1/grading_123.pdf") }
            }
    }

    @Test
    fun `getAllMockInterviews should return 200 with list of mock interviews`() {
        // given
        val mockInterviews =
            listOf(
                UserMockInterview(
                    id = 1L,
                    userId = testUserId,
                    userInterviewId = 1L,
                    resumeFilePath = "datas/interview/user_1/resume_123.pdf",
                    questionFilePath = "datas/interview/user_1/questions_123.pdf",
                ),
                UserMockInterview(
                    id = 2L,
                    userId = testUserId,
                    userInterviewId = 2L,
                    resumeFilePath = "datas/interview/user_1/resume_456.pdf",
                    questionFilePath = "datas/interview/user_1/questions_456.pdf",
                ),
            )

        every { interviewService.getAllMockInterviewsByUser(testUserId) } returns mockInterviews

        // when & then
        mockMvc
            .get("/api/interviews/mock") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.length()") { value(2) }
                jsonPath("$[0].id") { value(1) }
                jsonPath("$[0].userInterviewId") { value(1) }
                jsonPath("$[1].id") { value(2) }
                jsonPath("$[1].userInterviewId") { value(2) }
            }
    }

    @Test
    fun `getAllMockInterviews should return empty list when no mock interviews exist`() {
        // given
        every { interviewService.getAllMockInterviewsByUser(testUserId) } returns emptyList()

        // when & then
        mockMvc
            .get("/api/interviews/mock") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.length()") { value(0) }
            }
    }

    @Test
    fun `getMockInterviewsByInterview should return 200 with filtered list`() {
        // given
        val userInterviewId = 1L
        val mockInterviews =
            listOf(
                UserMockInterview(
                    id = 1L,
                    userId = testUserId,
                    userInterviewId = userInterviewId,
                    resumeFilePath = "datas/interview/user_1/resume_123.pdf",
                    questionFilePath = "datas/interview/user_1/questions_123.pdf",
                ),
                UserMockInterview(
                    id = 3L,
                    userId = testUserId,
                    userInterviewId = userInterviewId,
                    resumeFilePath = "datas/interview/user_1/resume_789.pdf",
                    questionFilePath = "datas/interview/user_1/questions_789.pdf",
                ),
            )

        every { interviewService.getAllMockInterviewsByInterview(userInterviewId) } returns mockInterviews

        // when & then
        mockMvc
            .get("/api/interviews/mock/by-interview/$userInterviewId") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.length()") { value(2) }
                jsonPath("$[0].userInterviewId") { value(userInterviewId) }
                jsonPath("$[1].userInterviewId") { value(userInterviewId) }
            }
    }

    @Test
    fun `deleteMockInterview should return 204 when successful`() {
        // given
        val mockInterviewId = 1L

        every { interviewService.deleteMockInterview(mockInterviewId, testUserId) } returns Unit

        // when & then
        mockMvc
            .delete("/api/interviews/mock/$mockInterviewId") {
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isNoContent() }
            }
    }

    @Test
    fun `gradeMockInterview should return 200 with grading markdown`() {
        // given
        val mockInterviewId = 1L
        val requestDto =
            GradingRequestDto(
                answers = "My answer to question 1...",
            )

        val gradingMarkdown =
            """
            # 면접 답변 종합 평가 보고서

            ## 📊 최종 채점 결과
            **등급**: 합격
            **총점**: 92/100점
            ...
            """.trimIndent()

        val response = GradingResponse(gradingMarkdown = gradingMarkdown)

        coEvery {
            interviewService.gradeMockInterview(mockInterviewId, testUserId, "My answer to question 1...")
        } returns response

        // when & then
        mockMvc
            .post("/api/interviews/mock/$mockInterviewId/grading") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                content { contentType(MediaType.APPLICATION_JSON) }
                jsonPath("$.gradingMarkdown") { value(gradingMarkdown) }
            }
    }

    @Test
    fun `gradeMockInterview should return 400 when answers is blank`() {
        // given
        val mockInterviewId = 1L
        val requestDto =
            GradingRequestDto(
                answers = "",
            )

        // when & then
        mockMvc
            .post("/api/interviews/mock/$mockInterviewId/grading") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `createMockInterview should return 403 when not authenticated`() {
        // given
        val requestDto =
            CreateMockInterviewRequestDto(
                userInterviewId = 1L,
                resumeFile = testResumeBase64,
            )

        // when & then
        mockMvc
            .post("/api/interviews/mock") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
            }.andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `getMockInterview should return 403 when not authenticated`() {
        // when & then
        mockMvc
            .get("/api/interviews/mock/1")
            .andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `getAllMockInterviews should return 403 when not authenticated`() {
        // when & then
        mockMvc
            .get("/api/interviews/mock")
            .andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `getMockInterviewsByInterview should return 403 when not authenticated`() {
        // when & then
        mockMvc
            .get("/api/interviews/mock/by-interview/1")
            .andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `deleteMockInterview should return 403 when not authenticated`() {
        // when & then
        mockMvc
            .delete("/api/interviews/mock/1")
            .andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `gradeMockInterview should return 403 when not authenticated`() {
        // given
        val requestDto =
            GradingRequestDto(
                answers = "My answer to question 1...",
            )

        // when & then
        mockMvc
            .post("/api/interviews/mock/1/grading") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
            }.andExpect {
                status { isForbidden() }
            }
    }

    @Test
    fun `createMockInterview should handle large base64 resume`() {
        // given
        val largeResumeBytes = ByteArray(10 * 1024 * 1024) // 10MB
        val largeBase64 = Base64.getEncoder().encodeToString(largeResumeBytes)
        val requestDto =
            CreateMockInterviewRequestDto(
                userInterviewId = 1L,
                resumeFile = largeBase64,
            )

        val response =
            MockInterviewResponse(
                mockInterviewId = 1L,
                questionMarkdown = "# Questions",
            )

        coEvery {
            interviewService.createMockInterview(testUserId, 1L, largeBase64)
        } returns response

        // when & then
        mockMvc
            .post("/api/interviews/mock") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.mockInterviewId") { value(1) }
            }
    }

    @Test
    fun `createMockInterview should handle malformed JSON`() {
        // when & then
        mockMvc
            .post("/api/interviews/mock") {
                contentType = MediaType.APPLICATION_JSON
                content = "{invalid json"
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isBadRequest() }
            }
    }

    @Test
    fun `gradeMockInterview should handle long answers`() {
        // given
        val mockInterviewId = 1L
        val longAnswers = "x".repeat(50000)
        val requestDto = GradingRequestDto(answers = longAnswers)

        val response = GradingResponse(gradingMarkdown = "# Grading Result\n합격")

        coEvery {
            interviewService.gradeMockInterview(mockInterviewId, testUserId, longAnswers)
        } returns response

        // when & then
        mockMvc
            .post("/api/interviews/mock/$mockInterviewId/grading") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.gradingMarkdown") { exists() }
            }
    }

    @Test
    fun `gradeMockInterview should handle special characters in answers`() {
        // given
        val mockInterviewId = 1L
        val specialAnswers = "답변 with special chars: äöü 한글 日本語 @#\$%^&*()\n\n줄바꿈도 포함"
        val requestDto = GradingRequestDto(answers = specialAnswers)

        val response = GradingResponse(gradingMarkdown = "# Grading Result\n합격")

        coEvery {
            interviewService.gradeMockInterview(mockInterviewId, testUserId, specialAnswers)
        } returns response

        // when & then
        mockMvc
            .post("/api/interviews/mock/$mockInterviewId/grading") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.gradingMarkdown") { exists() }
            }
    }

    @Test
    fun `createMockInterview should handle base64 with data URL prefix`() {
        // given
        val base64WithPrefix = "data:application/pdf;base64,$testResumeBase64"
        val requestDto =
            CreateMockInterviewRequestDto(
                userInterviewId = 1L,
                resumeFile = base64WithPrefix,
            )

        val response =
            MockInterviewResponse(
                mockInterviewId = 1L,
                questionMarkdown = "# Questions",
            )

        coEvery {
            interviewService.createMockInterview(testUserId, 1L, base64WithPrefix)
        } returns response

        // when & then
        mockMvc
            .post("/api/interviews/mock") {
                contentType = MediaType.APPLICATION_JSON
                content = objectMapper.writeValueAsString(requestDto)
                header("Authorization", "Bearer $validToken")
            }.andExpect {
                status { isOk() }
                jsonPath("$.mockInterviewId") { value(1) }
            }
    }
}
