package com.aiprofessor.application.interview

import com.aiprofessor.domain.exception.InterviewNotFoundException
import com.aiprofessor.domain.exception.MockInterviewNotFoundException
import com.aiprofessor.domain.exception.ResumeProcessingException
import com.aiprofessor.domain.exception.UnauthorizedInterviewAccessException
import com.aiprofessor.domain.interview.UserInterview
import com.aiprofessor.domain.interview.UserInterviewRepository
import com.aiprofessor.domain.interview.UserMockInterview
import com.aiprofessor.domain.interview.UserMockInterviewRepository
import com.aiprofessor.infrastructure.claude.ClaudeApiClient
import com.aiprofessor.infrastructure.util.FileStorageUtils
import com.aiprofessor.infrastructure.util.PdfUtils
import com.aiprofessor.infrastructure.util.PromptLoader
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.runBlocking
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.LocalDate
import java.util.Base64

class InterviewServiceImplTest {
    private lateinit var userInterviewRepository: UserInterviewRepository
    private lateinit var userMockInterviewRepository: UserMockInterviewRepository
    private lateinit var claudeApiClient: ClaudeApiClient
    private lateinit var pdfUtils: PdfUtils
    private lateinit var fileStorageUtils: FileStorageUtils
    private lateinit var promptLoader: PromptLoader
    private lateinit var interviewService: InterviewServiceImpl

    @BeforeEach
    fun setUp() {
        userInterviewRepository = mockk()
        userMockInterviewRepository = mockk()
        claudeApiClient = mockk()
        pdfUtils = mockk()
        fileStorageUtils = mockk()
        promptLoader = mockk()

        every { promptLoader.loadPrompt("interview-questions.md") } returns "Interview questions prompt"
        every { promptLoader.loadPrompt("interview-grading.md") } returns "Interview grading prompt"

        interviewService =
            InterviewServiceImpl(
                userInterviewRepository,
                userMockInterviewRepository,
                claudeApiClient,
                pdfUtils,
                fileStorageUtils,
                promptLoader,
            )
    }

    @Test
    fun `createInterview should save and return interview`() {
        // given
        val userId = 1L
        val interviewDate = LocalDate.of(2024, 1, 15)
        val interviewType = "Backend Developer"
        val announcementUrl = "https://example.com/jobs/backend"

        val expectedInterview =
            UserInterview(
                id = 1L,
                userId = userId,
                interviewDate = interviewDate,
                interviewType = interviewType,
                announcementUrl = announcementUrl,
            )

        every {
            userInterviewRepository.save(
                match {
                    it.userId == userId &&
                        it.interviewDate == interviewDate &&
                        it.interviewType == interviewType &&
                        it.announcementUrl == announcementUrl
                },
            )
        } returns expectedInterview

        // when
        val result = interviewService.createInterview(userId, interviewDate, interviewType, announcementUrl)

        // then
        assertThat(result.userId).isEqualTo(userId)
        assertThat(result.interviewDate).isEqualTo(interviewDate)
        assertThat(result.interviewType).isEqualTo(interviewType)
        assertThat(result.announcementUrl).isEqualTo(announcementUrl)
        verify(exactly = 1) { userInterviewRepository.save(any()) }
    }

    @Test
    fun `getInterviewById should return interview when found and user matches`() {
        // given
        val userId = 1L
        val interviewId = 1L
        val interview =
            UserInterview(
                id = interviewId,
                userId = userId,
                interviewDate = LocalDate.now(),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        every { userInterviewRepository.findById(interviewId) } returns interview

        // when
        val result = interviewService.getInterviewById(interviewId, userId)

        // then
        assertThat(result).isEqualTo(interview)
        verify(exactly = 1) { userInterviewRepository.findById(interviewId) }
    }

    @Test
    fun `getInterviewById should throw InterviewNotFoundException when interview not found`() {
        // given
        val userId = 1L
        val interviewId = 999L

        every { userInterviewRepository.findById(interviewId) } returns null

        // when & then
        assertThatThrownBy {
            interviewService.getInterviewById(interviewId, userId)
        }
            .isInstanceOf(InterviewNotFoundException::class.java)
            .hasMessageContaining("면접 일정을 찾을 수 없습니다")
    }

    @Test
    fun `getInterviewById should throw UnauthorizedInterviewAccessException when user does not match`() {
        // given
        val userId = 1L
        val otherUserId = 2L
        val interviewId = 1L
        val interview =
            UserInterview(
                id = interviewId,
                userId = otherUserId,
                interviewDate = LocalDate.now(),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        every { userInterviewRepository.findById(interviewId) } returns interview

        // when & then
        assertThatThrownBy {
            interviewService.getInterviewById(interviewId, userId)
        }
            .isInstanceOf(UnauthorizedInterviewAccessException::class.java)
            .hasMessageContaining("해당 면접 일정에 접근할 권한이 없습니다")
    }

    @Test
    fun `getAllInterviewsByUser should return all interviews for user`() {
        // given
        val userId = 1L
        val interviews =
            listOf(
                UserInterview(
                    id = 1L,
                    userId = userId,
                    interviewDate = LocalDate.now(),
                    interviewType = "Backend Developer",
                    announcementUrl = "https://example.com/jobs/backend",
                ),
                UserInterview(
                    id = 2L,
                    userId = userId,
                    interviewDate = LocalDate.now().plusDays(7),
                    interviewType = "Frontend Developer",
                    announcementUrl = "https://example.com/jobs/frontend",
                ),
            )

        every { userInterviewRepository.findByUserId(userId) } returns interviews

        // when
        val result = interviewService.getAllInterviewsByUser(userId)

        // then
        assertThat(result).hasSize(2)
        assertThat(result).isEqualTo(interviews)
        verify(exactly = 1) { userInterviewRepository.findByUserId(userId) }
    }

    @Test
    fun `updateInterview should update all fields when provided`() {
        // given
        val userId = 1L
        val interviewId = 1L
        val originalInterview =
            UserInterview(
                id = interviewId,
                userId = userId,
                interviewDate = LocalDate.of(2024, 1, 15),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        val newDate = LocalDate.of(2024, 2, 1)
        val newType = "Full Stack Developer"
        val newUrl = "https://example.com/jobs/fullstack"

        every { userInterviewRepository.findById(interviewId) } returns originalInterview
        every { userInterviewRepository.save(any()) } returns originalInterview

        // when
        val result =
            interviewService.updateInterview(
                interviewId,
                userId,
                newDate,
                newType,
                newUrl,
            )

        // then
        assertThat(result.interviewDate).isEqualTo(newDate)
        assertThat(result.interviewType).isEqualTo(newType)
        assertThat(result.announcementUrl).isEqualTo(newUrl)
        verify(exactly = 1) { userInterviewRepository.save(originalInterview) }
    }

    @Test
    fun `updateInterview should only update provided fields`() {
        // given
        val userId = 1L
        val interviewId = 1L
        val originalDate = LocalDate.of(2024, 1, 15)
        val originalType = "Backend Developer"
        val originalUrl = "https://example.com/jobs/backend"
        val originalInterview =
            UserInterview(
                id = interviewId,
                userId = userId,
                interviewDate = originalDate,
                interviewType = originalType,
                announcementUrl = originalUrl,
            )

        val newDate = LocalDate.of(2024, 2, 1)

        every { userInterviewRepository.findById(interviewId) } returns originalInterview
        every { userInterviewRepository.save(any()) } returns originalInterview

        // when
        val result =
            interviewService.updateInterview(
                interviewId,
                userId,
                newDate,
                null,
                null,
            )

        // then
        assertThat(result.interviewDate).isEqualTo(newDate)
        assertThat(result.interviewType).isEqualTo(originalType)
        assertThat(result.announcementUrl).isEqualTo(originalUrl)
    }

    @Test
    fun `deleteInterview should delete interview when user matches`() {
        // given
        val userId = 1L
        val interviewId = 1L
        val interview =
            UserInterview(
                id = interviewId,
                userId = userId,
                interviewDate = LocalDate.now(),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        every { userInterviewRepository.findById(interviewId) } returns interview
        every { userInterviewRepository.deleteById(interviewId) } returns Unit

        // when
        interviewService.deleteInterview(interviewId, userId)

        // then
        verify(exactly = 1) { userInterviewRepository.deleteById(interviewId) }
    }

    @Test
    fun `createMockInterview should throw ResumeProcessingException when base64 is invalid`() {
        // given
        val userId = 1L
        val userInterviewId = 1L
        val invalidBase64 = "invalid-base64!!!"

        val interview =
            UserInterview(
                id = userInterviewId,
                userId = userId,
                interviewDate = LocalDate.now(),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        every { userInterviewRepository.findById(userInterviewId) } returns interview

        // when & then
        assertThatThrownBy {
            runBlocking {
                interviewService.createMockInterview(userId, userInterviewId, invalidBase64)
            }
        }
            .isInstanceOf(ResumeProcessingException::class.java)
            .hasMessageContaining("이력서 파일 형식이 올바르지 않습니다")
    }

    @Test
    fun `createMockInterview should throw ResumeProcessingException when PDF extraction fails`() {
        // given
        val userId = 1L
        val userInterviewId = 1L
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())

        val interview =
            UserInterview(
                id = userInterviewId,
                userId = userId,
                interviewDate = LocalDate.now(),
                interviewType = "Backend Developer",
                announcementUrl = "https://example.com/jobs/backend",
            )

        every { userInterviewRepository.findById(userInterviewId) } returns interview
        every { pdfUtils.extractTextFromPdf(any()) } throws RuntimeException("PDF extraction failed")

        // when & then
        assertThatThrownBy {
            runBlocking {
                interviewService.createMockInterview(userId, userInterviewId, validBase64)
            }
        }
            .isInstanceOf(ResumeProcessingException::class.java)
            .hasMessageContaining("이력서에서 텍스트를 추출할 수 없습니다")
    }

    @Test
    fun `getMockInterviewById should return mock interview when found and user matches`() {
        // given
        val userId = 1L
        val mockInterviewId = 1L
        val mockInterview =
            UserMockInterview(
                id = mockInterviewId,
                userId = userId,
                userInterviewId = 1L,
                resumeFilePath = "datas/interview/user_1/resume_123.pdf",
                questionFilePath = "datas/interview/user_1/questions_123.pdf",
            )

        every { userMockInterviewRepository.findById(mockInterviewId) } returns mockInterview

        // when
        val result = interviewService.getMockInterviewById(mockInterviewId, userId)

        // then
        assertThat(result).isEqualTo(mockInterview)
        verify(exactly = 1) { userMockInterviewRepository.findById(mockInterviewId) }
    }

    @Test
    fun `getMockInterviewById should throw MockInterviewNotFoundException when not found`() {
        // given
        val userId = 1L
        val mockInterviewId = 999L

        every { userMockInterviewRepository.findById(mockInterviewId) } returns null

        // when & then
        assertThatThrownBy {
            interviewService.getMockInterviewById(mockInterviewId, userId)
        }
            .isInstanceOf(MockInterviewNotFoundException::class.java)
            .hasMessageContaining("모의 면접을 찾을 수 없습니다")
    }

    @Test
    fun `getMockInterviewById should throw UnauthorizedInterviewAccessException when user does not match`() {
        // given
        val userId = 1L
        val otherUserId = 2L
        val mockInterviewId = 1L
        val mockInterview =
            UserMockInterview(
                id = mockInterviewId,
                userId = otherUserId,
                userInterviewId = 1L,
                resumeFilePath = "datas/interview/user_2/resume_123.pdf",
                questionFilePath = "datas/interview/user_2/questions_123.pdf",
            )

        every { userMockInterviewRepository.findById(mockInterviewId) } returns mockInterview

        // when & then
        assertThatThrownBy {
            interviewService.getMockInterviewById(mockInterviewId, userId)
        }
            .isInstanceOf(UnauthorizedInterviewAccessException::class.java)
            .hasMessageContaining("해당 모의 면접에 접근할 권한이 없습니다")
    }

    @Test
    fun `getAllMockInterviewsByUser should return all mock interviews for user`() {
        // given
        val userId = 1L
        val mockInterviews =
            listOf(
                UserMockInterview(
                    id = 1L,
                    userId = userId,
                    userInterviewId = 1L,
                    resumeFilePath = "datas/interview/user_1/resume_123.pdf",
                    questionFilePath = "datas/interview/user_1/questions_123.pdf",
                ),
                UserMockInterview(
                    id = 2L,
                    userId = userId,
                    userInterviewId = 2L,
                    resumeFilePath = "datas/interview/user_1/resume_456.pdf",
                    questionFilePath = "datas/interview/user_1/questions_456.pdf",
                ),
            )

        every { userMockInterviewRepository.findByUserId(userId) } returns mockInterviews

        // when
        val result = interviewService.getAllMockInterviewsByUser(userId)

        // then
        assertThat(result).hasSize(2)
        assertThat(result).isEqualTo(mockInterviews)
        verify(exactly = 1) { userMockInterviewRepository.findByUserId(userId) }
    }

    @Test
    fun `getAllMockInterviewsByInterview should return all mock interviews for interview`() {
        // given
        val userInterviewId = 1L
        val mockInterviews =
            listOf(
                UserMockInterview(
                    id = 1L,
                    userId = 1L,
                    userInterviewId = userInterviewId,
                    resumeFilePath = "datas/interview/user_1/resume_123.pdf",
                    questionFilePath = "datas/interview/user_1/questions_123.pdf",
                ),
                UserMockInterview(
                    id = 2L,
                    userId = 1L,
                    userInterviewId = userInterviewId,
                    resumeFilePath = "datas/interview/user_1/resume_456.pdf",
                    questionFilePath = "datas/interview/user_1/questions_456.pdf",
                ),
            )

        every { userMockInterviewRepository.findByUserInterviewId(userInterviewId) } returns mockInterviews

        // when
        val result = interviewService.getAllMockInterviewsByInterview(userInterviewId)

        // then
        assertThat(result).hasSize(2)
        assertThat(result).isEqualTo(mockInterviews)
        verify(exactly = 1) { userMockInterviewRepository.findByUserInterviewId(userInterviewId) }
    }

    @Test
    fun `deleteMockInterview should delete mock interview when user matches`() {
        // given
        val userId = 1L
        val mockInterviewId = 1L
        val mockInterview =
            UserMockInterview(
                id = mockInterviewId,
                userId = userId,
                userInterviewId = 1L,
                resumeFilePath = "datas/interview/user_1/resume_123.pdf",
                questionFilePath = "datas/interview/user_1/questions_123.pdf",
            )

        every { userMockInterviewRepository.findById(mockInterviewId) } returns mockInterview
        every { userMockInterviewRepository.deleteById(mockInterviewId) } returns Unit

        // when
        interviewService.deleteMockInterview(mockInterviewId, userId)

        // then
        verify(exactly = 1) { userMockInterviewRepository.deleteById(mockInterviewId) }
    }

    @Test
    fun `gradeMockInterview should save grading file path and return markdown`() {
        // given
        val userId = 1L
        val mockInterviewId = 1L
        val answers = "My answer to question 1..."
        val mockInterview =
            UserMockInterview(
                id = mockInterviewId,
                userId = userId,
                userInterviewId = 1L,
                resumeFilePath = "datas/interview/user_1/resume_123.pdf",
                questionFilePath = "datas/interview/user_1/questions_123.pdf",
            )

        val questionText = "Question 1: Tell me about yourself"
        val gradingMarkdown = "# Grading Result\n합격"
        val gradingPdfBytes = "grading pdf".toByteArray()
        val gradingFilePath = "datas/interview/user_1/grading_123.pdf"

        every { userMockInterviewRepository.findById(mockInterviewId) } returns mockInterview
        every { fileStorageUtils.readTextFile(mockInterview.questionFilePath) } returns questionText
        coEvery {
            claudeApiClient.sendMessage(
                systemPrompt = "Interview grading prompt",
                userPrompt = any(),
                extractedText = "",
            )
        } returns gradingMarkdown
        every { pdfUtils.markdownToPdf(gradingMarkdown) } returns gradingPdfBytes
        every { fileStorageUtils.saveInterviewFile(userId, "grading", gradingPdfBytes) } returns gradingFilePath
        every { userMockInterviewRepository.save(any()) } returns mockInterview

        // when
        val result =
            runBlocking {
                interviewService.gradeMockInterview(mockInterviewId, userId, answers)
            }

        // then
        assertThat(result.gradingMarkdown).isEqualTo(gradingMarkdown)
        assertThat(mockInterview.gradingFilePath).isEqualTo(gradingFilePath)
        verify(exactly = 1) { fileStorageUtils.readTextFile(mockInterview.questionFilePath) }
        verify(exactly = 1) { pdfUtils.markdownToPdf(gradingMarkdown) }
        verify(exactly = 1) { fileStorageUtils.saveInterviewFile(userId, "grading", gradingPdfBytes) }
        verify(exactly = 1) { userMockInterviewRepository.save(mockInterview) }
    }
}
