package com.aiprofessor.presentation.interview

import com.aiprofessor.domain.exception.UnauthorizedException
import com.aiprofessor.domain.interview.InterviewService
import com.aiprofessor.domain.interview.UserMockInterview
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import kotlinx.coroutines.runBlocking
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/interviews/mock")
class MockInterviewController(
    private val interviewService: InterviewService,
) {
    @PostMapping
    fun createMockInterview(
        @Valid @RequestBody request: CreateMockInterviewRequestDto,
    ): ResponseEntity<MockInterviewResponseDto> =
        runBlocking {
            val userId = getCurrentUserId()

            val response =
                interviewService.createMockInterview(
                    userId = userId,
                    userInterviewId = request.userInterviewId,
                    resumeBase64 = request.resumeFile,
                )

            ResponseEntity.ok(
                MockInterviewResponseDto(
                    mockInterviewId = response.mockInterviewId,
                    questionMarkdown = response.questionMarkdown,
                ),
            )
        }

    @GetMapping("/{id}")
    fun getMockInterviewById(
        @PathVariable id: Long,
    ): ResponseEntity<MockInterviewDetailResponseDto> {
        val userId = getCurrentUserId()
        val mockInterview = interviewService.getMockInterviewById(id, userId)
        return ResponseEntity.ok(mockInterview.toDetailResponseDto())
    }

    @GetMapping
    fun getAllMockInterviews(): ResponseEntity<List<MockInterviewDetailResponseDto>> {
        val userId = getCurrentUserId()
        val mockInterviews = interviewService.getAllMockInterviewsByUser(userId)
        return ResponseEntity.ok(mockInterviews.map { it.toDetailResponseDto() })
    }

    @GetMapping("/by-interview/{userInterviewId}")
    fun getMockInterviewsByInterview(
        @PathVariable userInterviewId: Long,
    ): ResponseEntity<List<MockInterviewDetailResponseDto>> {
        val mockInterviews = interviewService.getAllMockInterviewsByInterview(userInterviewId)
        return ResponseEntity.ok(mockInterviews.map { it.toDetailResponseDto() })
    }

    @DeleteMapping("/{id}")
    fun deleteMockInterview(
        @PathVariable id: Long,
    ): ResponseEntity<Void> {
        val userId = getCurrentUserId()
        interviewService.deleteMockInterview(id, userId)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/grading")
    fun gradeMockInterview(
        @PathVariable id: Long,
        @Valid @RequestBody request: GradingRequestDto,
    ): ResponseEntity<GradingResponseDto> =
        runBlocking {
            val userId = getCurrentUserId()

            val response =
                interviewService.gradeMockInterview(
                    mockInterviewId = id,
                    userId = userId,
                    answers = request.answers,
                )

            ResponseEntity.ok(
                GradingResponseDto(
                    gradingMarkdown = response.gradingMarkdown,
                ),
            )
        }

    private fun getCurrentUserId(): Long {
        val authentication =
            SecurityContextHolder.getContext().authentication
                ?: throw UnauthorizedException("인증 정보가 없습니다.")

        return authentication.principal as? Long
            ?: throw UnauthorizedException("유효하지 않은 인증 정보입니다.")
    }
}

data class CreateMockInterviewRequestDto(
    @field:Positive(message = "User interview ID must be positive")
    val userInterviewId: Long,
    @field:NotBlank(message = "Resume file is required")
    val resumeFile: String,
)

data class MockInterviewResponseDto(
    val mockInterviewId: Long,
    val questionMarkdown: String,
)

data class MockInterviewDetailResponseDto(
    val id: Long,
    val userId: Long,
    val userInterviewId: Long,
    val resumeFilePath: String,
    val questionFilePath: String,
    val gradingFilePath: String?,
    val createdAt: String,
    val updatedAt: String,
)

data class GradingRequestDto(
    @field:NotBlank(message = "Answers are required")
    val answers: String,
)

data class GradingResponseDto(
    val gradingMarkdown: String,
)

fun UserMockInterview.toDetailResponseDto() =
    MockInterviewDetailResponseDto(
        id = id!!,
        userId = userId,
        userInterviewId = userInterviewId,
        resumeFilePath = resumeFilePath,
        questionFilePath = questionFilePath,
        gradingFilePath = gradingFilePath,
        createdAt = createdAt.toString(),
        updatedAt = updatedAt.toString(),
    )
