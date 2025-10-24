package com.aiprofessor.presentation.interview

import com.aiprofessor.domain.exception.UnauthorizedException
import com.aiprofessor.domain.interview.InterviewService
import com.aiprofessor.domain.interview.UserInterview
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/api/interviews")
class InterviewController(
    private val interviewService: InterviewService,
) {
    @PostMapping
    fun createInterview(
        @Valid @RequestBody request: CreateInterviewRequestDto,
    ): ResponseEntity<InterviewResponseDto> {
        val userId = getCurrentUserId()

        val interview =
            interviewService.createInterview(
                userId = userId,
                interviewDate = request.interviewDate,
                interviewType = request.interviewType,
                announcementUrl = request.announcementUrl,
            )

        return ResponseEntity.ok(interview.toResponseDto())
    }

    @GetMapping("/{id}")
    fun getInterviewById(
        @PathVariable id: Long,
    ): ResponseEntity<InterviewResponseDto> {
        val userId = getCurrentUserId()
        val interview = interviewService.getInterviewById(id, userId)
        return ResponseEntity.ok(interview.toResponseDto())
    }

    @GetMapping
    fun getAllInterviews(): ResponseEntity<List<InterviewResponseDto>> {
        val userId = getCurrentUserId()
        val interviews = interviewService.getAllInterviewsByUser(userId)
        return ResponseEntity.ok(interviews.map { it.toResponseDto() })
    }

    @PutMapping("/{id}")
    fun updateInterview(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateInterviewRequestDto,
    ): ResponseEntity<InterviewResponseDto> {
        val userId = getCurrentUserId()

        val interview =
            interviewService.updateInterview(
                id = id,
                userId = userId,
                interviewDate = request.interviewDate,
                interviewType = request.interviewType,
                announcementUrl = request.announcementUrl,
            )

        return ResponseEntity.ok(interview.toResponseDto())
    }

    @DeleteMapping("/{id}")
    fun deleteInterview(
        @PathVariable id: Long,
    ): ResponseEntity<Void> {
        val userId = getCurrentUserId()
        interviewService.deleteInterview(id, userId)
        return ResponseEntity.noContent().build()
    }

    private fun getCurrentUserId(): Long {
        val authentication =
            SecurityContextHolder.getContext().authentication
                ?: throw UnauthorizedException("인증 정보가 없습니다.")

        return authentication.principal as? Long
            ?: throw UnauthorizedException("유효하지 않은 인증 정보입니다.")
    }
}

data class CreateInterviewRequestDto(
    @field:NotNull(message = "Interview date is required")
    val interviewDate: LocalDate,
    @field:NotBlank(message = "Interview type is required")
    val interviewType: String,
    @field:NotBlank(message = "Announcement URL is required")
    val announcementUrl: String,
)

data class UpdateInterviewRequestDto(
    val interviewDate: LocalDate?,
    val interviewType: String?,
    val announcementUrl: String?,
)

data class InterviewResponseDto(
    val id: Long,
    val userId: Long,
    val interviewDate: LocalDate,
    val interviewType: String,
    val announcementUrl: String,
    val createdAt: String,
    val updatedAt: String,
)

fun UserInterview.toResponseDto() =
    InterviewResponseDto(
        id = id!!,
        userId = userId,
        interviewDate = interviewDate,
        interviewType = interviewType,
        announcementUrl = announcementUrl,
        createdAt = createdAt.toString(),
        updatedAt = updatedAt.toString(),
    )
