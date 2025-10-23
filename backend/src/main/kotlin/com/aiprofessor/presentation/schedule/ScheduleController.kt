package com.aiprofessor.presentation.schedule

import com.aiprofessor.domain.exception.UnauthorizedException
import com.aiprofessor.domain.schedule.UserSchedule
import com.aiprofessor.domain.schedule.UserScheduleService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/schedules")
class ScheduleController(
    private val userScheduleService: UserScheduleService,
) {
    @PostMapping
    fun createSchedule(
        @Valid @RequestBody request: CreateScheduleRequestDto,
    ): ResponseEntity<ScheduleResponseDto> {
        val userId = getCurrentUserId()

        val schedule =
            userScheduleService.createSchedule(
                userId = userId,
                dayOfWeek = request.dayOfWeek,
                className = request.className,
            )

        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(schedule.toResponseDto())
    }

    @GetMapping("/{id}")
    fun getScheduleById(
        @PathVariable id: Long,
    ): ResponseEntity<ScheduleResponseDto> {
        val userId = getCurrentUserId()
        val schedule = userScheduleService.getScheduleById(id, userId)
        return ResponseEntity.ok(schedule.toResponseDto())
    }

    @GetMapping
    fun getAllSchedules(
        @RequestParam(required = false) dayOfWeek: String?,
    ): ResponseEntity<List<ScheduleResponseDto>> {
        val userId = getCurrentUserId()

        val schedules =
            if (dayOfWeek != null) {
                userScheduleService.getSchedulesByDayOfWeek(userId, dayOfWeek)
            } else {
                userScheduleService.getAllSchedulesByUser(userId)
            }

        return ResponseEntity.ok(schedules.map { it.toResponseDto() })
    }

    @PutMapping("/{id}")
    fun updateSchedule(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateScheduleRequestDto,
    ): ResponseEntity<ScheduleResponseDto> {
        val userId = getCurrentUserId()

        val schedule =
            userScheduleService.updateSchedule(
                id = id,
                userId = userId,
                dayOfWeek = request.dayOfWeek,
                className = request.className,
            )

        return ResponseEntity.ok(schedule.toResponseDto())
    }

    @DeleteMapping("/{id}")
    fun deleteSchedule(
        @PathVariable id: Long,
    ): ResponseEntity<Void> {
        val userId = getCurrentUserId()
        userScheduleService.deleteSchedule(id, userId)
        return ResponseEntity.noContent().build()
    }

    private fun getCurrentUserId(): Long {
        val authentication =
            SecurityContextHolder.getContext().authentication
                ?: throw UnauthorizedException("인증 정보가 없습니다.")

        return authentication.principal as? Long
            ?: throw UnauthorizedException("유효하지 않은 인증 정보입니다.")
    }

    private fun UserSchedule.toResponseDto() =
        ScheduleResponseDto(
            id = this.id!!,
            userId = this.userId,
            dayOfWeek = this.dayOfWeek,
            className = this.className,
            createdAt = this.createdAt.toString(),
            updatedAt = this.updatedAt.toString(),
        )
}

data class CreateScheduleRequestDto(
    @field:Pattern(
        regexp = "^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)$",
        message = "Day of week must be one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY",
    )
    val dayOfWeek: String,
    @field:NotBlank(message = "Class name is required")
    val className: String,
)

data class UpdateScheduleRequestDto(
    @field:Pattern(
        regexp = "^(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)$",
        message = "Day of week must be one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY",
    )
    val dayOfWeek: String?,
    val className: String?,
)

data class ScheduleResponseDto(
    val id: Long,
    val userId: Long,
    val dayOfWeek: String,
    val className: String,
    val createdAt: String,
    val updatedAt: String,
)
