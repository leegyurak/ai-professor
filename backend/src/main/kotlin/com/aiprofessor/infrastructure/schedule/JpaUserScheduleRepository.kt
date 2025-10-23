package com.aiprofessor.infrastructure.schedule

import com.aiprofessor.domain.schedule.UserSchedule
import org.springframework.data.jpa.repository.JpaRepository

interface JpaUserScheduleRepository : JpaRepository<UserSchedule, Long> {
    fun findByUserId(userId: Long): List<UserSchedule>

    fun findByUserIdAndDayOfWeek(
        userId: Long,
        dayOfWeek: String,
    ): List<UserSchedule>

    fun deleteByUserId(userId: Long)
}
