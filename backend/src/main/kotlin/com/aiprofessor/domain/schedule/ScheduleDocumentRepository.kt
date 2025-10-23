package com.aiprofessor.domain.schedule

interface ScheduleDocumentRepository {
    fun save(scheduleDocument: ScheduleDocument): ScheduleDocument

    fun findById(id: Long): ScheduleDocument?

    fun findByUserScheduleId(userScheduleId: Long): List<ScheduleDocument>

    fun countByUserScheduleId(userScheduleId: Long): Long
}
