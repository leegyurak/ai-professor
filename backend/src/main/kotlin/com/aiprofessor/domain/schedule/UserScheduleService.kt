package com.aiprofessor.domain.schedule

interface UserScheduleService {
    fun createSchedule(
        userId: Long,
        dayOfWeek: String,
        className: String,
    ): UserSchedule

    fun getScheduleById(
        id: Long,
        userId: Long,
    ): UserSchedule

    fun getAllSchedulesByUser(userId: Long): List<UserSchedule>

    fun getSchedulesByDayOfWeek(
        userId: Long,
        dayOfWeek: String,
    ): List<UserSchedule>

    fun updateSchedule(
        id: Long,
        userId: Long,
        dayOfWeek: String?,
        className: String?,
    ): UserSchedule

    fun deleteSchedule(
        id: Long,
        userId: Long,
    )
}
