package com.aiprofessor.application.interview

import com.aiprofessor.domain.exception.InterviewNotFoundException
import com.aiprofessor.domain.exception.InvalidAnnouncementUrlException
import com.aiprofessor.domain.exception.MockInterviewNotFoundException
import com.aiprofessor.domain.exception.ResumeProcessingException
import com.aiprofessor.domain.exception.UnauthorizedInterviewAccessException
import com.aiprofessor.domain.interview.GradingResponse
import com.aiprofessor.domain.interview.InterviewService
import com.aiprofessor.domain.interview.MockInterviewResponse
import com.aiprofessor.domain.interview.UserInterview
import com.aiprofessor.domain.interview.UserInterviewRepository
import com.aiprofessor.domain.interview.UserMockInterview
import com.aiprofessor.domain.interview.UserMockInterviewRepository
import com.aiprofessor.infrastructure.claude.ClaudeApiClient
import com.aiprofessor.infrastructure.util.FileStorageUtils
import com.aiprofessor.infrastructure.util.PdfUtils
import com.aiprofessor.infrastructure.util.PromptLoader
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.Base64

@Service
@Transactional
class InterviewServiceImpl(
    private val userInterviewRepository: UserInterviewRepository,
    private val userMockInterviewRepository: UserMockInterviewRepository,
    private val claudeApiClient: ClaudeApiClient,
    private val pdfUtils: PdfUtils,
    private val fileStorageUtils: FileStorageUtils,
    private val promptLoader: PromptLoader,
) : InterviewService {
    private val interviewQuestionsPrompt: String by lazy {
        promptLoader.loadPrompt("interview-questions.md")
    }

    private val interviewGradingPrompt: String by lazy {
        promptLoader.loadPrompt("interview-grading.md")
    }

    override fun createInterview(
        userId: Long,
        interviewDate: LocalDate,
        interviewType: String,
        announcementUrl: String,
    ): UserInterview {
        val interview =
            UserInterview(
                userId = userId,
                interviewDate = interviewDate,
                interviewType = interviewType,
                announcementUrl = announcementUrl,
            )
        return userInterviewRepository.save(interview)
    }

    @Transactional(readOnly = true)
    override fun getInterviewById(
        id: Long,
        userId: Long,
    ): UserInterview {
        val interview =
            userInterviewRepository.findById(id)
                ?: throw InterviewNotFoundException("면접 일정을 찾을 수 없습니다. (ID: $id)")

        if (interview.userId != userId) {
            throw UnauthorizedInterviewAccessException("해당 면접 일정에 접근할 권한이 없습니다.")
        }

        return interview
    }

    @Transactional(readOnly = true)
    override fun getAllInterviewsByUser(userId: Long): List<UserInterview> = userInterviewRepository.findByUserId(userId)

    override fun updateInterview(
        id: Long,
        userId: Long,
        interviewDate: LocalDate?,
        interviewType: String?,
        announcementUrl: String?,
    ): UserInterview {
        val interview = getInterviewById(id, userId)

        interviewDate?.let { interview.interviewDate = it }
        interviewType?.let { interview.interviewType = it }
        announcementUrl?.let { interview.announcementUrl = it }
        interview.updatedAt = java.time.LocalDateTime.now()

        return userInterviewRepository.save(interview)
    }

    override fun deleteInterview(
        id: Long,
        userId: Long,
    ) {
        val interview = getInterviewById(id, userId)
        userInterviewRepository.deleteById(interview.id!!)
    }

    override suspend fun createMockInterview(
        userId: Long,
        userInterviewId: Long,
        resumeBase64: String,
    ): MockInterviewResponse {
        // Get interview info
        val interview = getInterviewById(userInterviewId, userId)

        // Decode and save resume PDF
        val cleanBase64 = cleanBase64String(resumeBase64)
        val resumeBytes =
            try {
                Base64.getDecoder().decode(cleanBase64)
            } catch (e: IllegalArgumentException) {
                throw ResumeProcessingException("이력서 파일 형식이 올바르지 않습니다.", e)
            }

        val resumeText =
            try {
                pdfUtils.extractTextFromPdf(resumeBytes)
            } catch (e: Exception) {
                throw ResumeProcessingException("이력서에서 텍스트를 추출할 수 없습니다.", e)
            }

        // Fetch announcement URL content
        val announcementContent = fetchUrlContent(interview.announcementUrl)

        // Generate interview questions using Claude
        val userPrompt =
            """
            # 채용 공고 정보
            $announcementContent

            # 지원자 이력서
            $resumeText
            """.trimIndent()

        val questionMarkdown =
            claudeApiClient.sendMessage(
                systemPrompt = interviewQuestionsPrompt,
                userPrompt = userPrompt,
                extractedText = "",
            )

        // Save files
        val resumeFilePath = fileStorageUtils.saveInterviewFile(userId, "resume", resumeBytes)
        val questionPdfBytes = pdfUtils.markdownToPdf(questionMarkdown)
        val questionFilePath = fileStorageUtils.saveInterviewFile(userId, "questions", questionPdfBytes)

        // Save mock interview
        val mockInterview =
            UserMockInterview(
                userId = userId,
                userInterviewId = userInterviewId,
                resumeFilePath = resumeFilePath,
                questionFilePath = questionFilePath,
            )
        val savedMockInterview = userMockInterviewRepository.save(mockInterview)

        return MockInterviewResponse(
            mockInterviewId = savedMockInterview.id!!,
            questionMarkdown = questionMarkdown,
        )
    }

    @Transactional(readOnly = true)
    override fun getMockInterviewById(
        id: Long,
        userId: Long,
    ): UserMockInterview {
        val mockInterview =
            userMockInterviewRepository.findById(id)
                ?: throw MockInterviewNotFoundException("모의 면접을 찾을 수 없습니다. (ID: $id)")

        if (mockInterview.userId != userId) {
            throw UnauthorizedInterviewAccessException("해당 모의 면접에 접근할 권한이 없습니다.")
        }

        return mockInterview
    }

    @Transactional(readOnly = true)
    override fun getAllMockInterviewsByUser(userId: Long): List<UserMockInterview> = userMockInterviewRepository.findByUserId(userId)

    @Transactional(readOnly = true)
    override fun getAllMockInterviewsByInterview(userInterviewId: Long): List<UserMockInterview> =
        userMockInterviewRepository.findByUserInterviewId(userInterviewId)

    override fun deleteMockInterview(
        id: Long,
        userId: Long,
    ) {
        val mockInterview = getMockInterviewById(id, userId)
        userMockInterviewRepository.deleteById(mockInterview.id!!)
    }

    override suspend fun gradeMockInterview(
        mockInterviewId: Long,
        userId: Long,
        answers: String,
    ): GradingResponse {
        val mockInterview = getMockInterviewById(mockInterviewId, userId)

        // Read question file
        val questionText = fileStorageUtils.readTextFile(mockInterview.questionFilePath)

        // Grade using Claude
        val userPrompt =
            """
            # 면접 질문
            $questionText

            # 지원자 답변
            $answers
            """.trimIndent()

        val gradingMarkdown =
            claudeApiClient.sendMessage(
                systemPrompt = interviewGradingPrompt,
                userPrompt = userPrompt,
                extractedText = "",
            )

        // Save grading result
        val gradingPdfBytes = pdfUtils.markdownToPdf(gradingMarkdown)
        val gradingFilePath = fileStorageUtils.saveInterviewFile(userId, "grading", gradingPdfBytes)

        mockInterview.gradingFilePath = gradingFilePath
        mockInterview.updatedAt = java.time.LocalDateTime.now()
        userMockInterviewRepository.save(mockInterview)

        return GradingResponse(gradingMarkdown = gradingMarkdown)
    }

    private fun cleanBase64String(base64: String): String =
        base64
            .substringAfter("base64,", base64)
            .trim()
            .replace("\n", "")
            .replace("\r", "")
            .replace(" ", "")

    private fun fetchUrlContent(url: String): String {
        return try {
            val connection = java.net.URL(url).openConnection()
            connection.setRequestProperty("User-Agent", "Mozilla/5.0")
            connection.getInputStream().bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            throw InvalidAnnouncementUrlException("채용 공고 URL을 읽을 수 없습니다. URL: $url")
        }
    }
}
