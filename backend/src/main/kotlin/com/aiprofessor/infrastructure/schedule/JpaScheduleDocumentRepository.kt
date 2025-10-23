package com.aiprofessor.infrastructure.schedule

import com.aiprofessor.domain.schedule.ScheduleDocument
import org.springframework.data.jpa.repository.JpaRepository

interface JpaScheduleDocumentRepository : JpaRepository<ScheduleDocument, Long> {
    fun findByUserScheduleId(userScheduleId: Long): List<ScheduleDocument>

    fun countByUserScheduleId(userScheduleId: Long): Long
}
