package com.aiprofessor.infrastructure.schedule

import com.aiprofessor.domain.schedule.ScheduleDocument
import com.aiprofessor.domain.schedule.ScheduleDocumentRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class ScheduleDocumentRepositoryImpl(
    private val jpaScheduleDocumentRepository: JpaScheduleDocumentRepository,
) : ScheduleDocumentRepository {
    override fun save(scheduleDocument: ScheduleDocument): ScheduleDocument = jpaScheduleDocumentRepository.save(scheduleDocument)

    @Transactional(readOnly = true)
    override fun findById(id: Long): ScheduleDocument? = jpaScheduleDocumentRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    override fun findByUserScheduleId(userScheduleId: Long): List<ScheduleDocument> =
        jpaScheduleDocumentRepository.findByUserScheduleId(userScheduleId)

    @Transactional(readOnly = true)
    override fun countByUserScheduleId(userScheduleId: Long): Long = jpaScheduleDocumentRepository.countByUserScheduleId(userScheduleId)
}
