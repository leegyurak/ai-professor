package com.aiprofessor.infrastructure.schedule

import com.aiprofessor.domain.schedule.UserSchedule
import com.aiprofessor.domain.schedule.UserScheduleRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class UserScheduleRepositoryImpl(
    private val jpaUserScheduleRepository: JpaUserScheduleRepository,
) : UserScheduleRepository {
    override fun save(userSchedule: UserSchedule): UserSchedule = jpaUserScheduleRepository.save(userSchedule)

    @Transactional(readOnly = true)
    override fun findById(id: Long): UserSchedule? = jpaUserScheduleRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    override fun findByUserId(userId: Long): List<UserSchedule> = jpaUserScheduleRepository.findByUserId(userId)

    @Transactional(readOnly = true)
    override fun findByUserIdAndDayOfWeek(
        userId: Long,
        dayOfWeek: String,
    ): List<UserSchedule> = jpaUserScheduleRepository.findByUserIdAndDayOfWeek(userId, dayOfWeek)

    override fun deleteById(id: Long) = jpaUserScheduleRepository.deleteById(id)

    override fun deleteByUserId(userId: Long) = jpaUserScheduleRepository.deleteByUserId(userId)
}
