package com.aiprofessor.domain.schedule

interface UserScheduleRepository {
    fun save(userSchedule: UserSchedule): UserSchedule

    fun findById(id: Long): UserSchedule?

    fun findByUserId(userId: Long): List<UserSchedule>

    fun findByUserIdAndDayOfWeek(
        userId: Long,
        dayOfWeek: String,
    ): List<UserSchedule>

    fun deleteById(id: Long)

    fun deleteByUserId(userId: Long)
}
