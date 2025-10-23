package com.aiprofessor.application.schedule

import com.aiprofessor.domain.exception.UnauthorizedException
import com.aiprofessor.domain.schedule.UserSchedule
import com.aiprofessor.domain.schedule.UserScheduleRepository
import com.aiprofessor.domain.schedule.UserScheduleService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional
class UserScheduleServiceImpl(
    private val userScheduleRepository: UserScheduleRepository,
) : UserScheduleService {
    override fun createSchedule(
        userId: Long,
        dayOfWeek: String,
        className: String,
    ): UserSchedule {
        val schedule =
            UserSchedule(
                userId = userId,
                dayOfWeek = dayOfWeek,
                className = className,
            )
        return userScheduleRepository.save(schedule)
    }

    @Transactional(readOnly = true)
    override fun getScheduleById(
        id: Long,
        userId: Long,
    ): UserSchedule {
        val schedule =
            userScheduleRepository.findById(id)
                ?: throw IllegalArgumentException("Schedule not found with id: $id")

        if (schedule.userId != userId) {
            throw UnauthorizedException("You don't have permission to access this schedule")
        }

        return schedule
    }

    @Transactional(readOnly = true)
    override fun getAllSchedulesByUser(userId: Long): List<UserSchedule> = userScheduleRepository.findByUserId(userId)

    @Transactional(readOnly = true)
    override fun getSchedulesByDayOfWeek(
        userId: Long,
        dayOfWeek: String,
    ): List<UserSchedule> = userScheduleRepository.findByUserIdAndDayOfWeek(userId, dayOfWeek)

    override fun updateSchedule(
        id: Long,
        userId: Long,
        dayOfWeek: String?,
        className: String?,
    ): UserSchedule {
        val schedule =
            userScheduleRepository.findById(id)
                ?: throw IllegalArgumentException("Schedule not found with id: $id")

        if (schedule.userId != userId) {
            throw UnauthorizedException("You don't have permission to update this schedule")
        }

        // Since UserSchedule is immutable, create a new instance with updated values
        val updatedSchedule =
            UserSchedule(
                id = schedule.id,
                userId = schedule.userId,
                dayOfWeek = dayOfWeek ?: schedule.dayOfWeek,
                className = className ?: schedule.className,
                createdAt = schedule.createdAt,
                updatedAt = LocalDateTime.now(),
            )

        return userScheduleRepository.save(updatedSchedule)
    }

    override fun deleteSchedule(
        id: Long,
        userId: Long,
    ) {
        val schedule =
            userScheduleRepository.findById(id)
                ?: throw IllegalArgumentException("Schedule not found with id: $id")

        if (schedule.userId != userId) {
            throw UnauthorizedException("You don't have permission to delete this schedule")
        }

        userScheduleRepository.deleteById(id)
    }
}
