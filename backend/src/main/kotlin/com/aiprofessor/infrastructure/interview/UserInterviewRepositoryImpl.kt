package com.aiprofessor.infrastructure.interview

import com.aiprofessor.domain.interview.UserInterview
import com.aiprofessor.domain.interview.UserInterviewRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class UserInterviewRepositoryImpl(
    private val jpaUserInterviewRepository: JpaUserInterviewRepository,
) : UserInterviewRepository {
    override fun save(userInterview: UserInterview): UserInterview = jpaUserInterviewRepository.save(userInterview)

    @Transactional(readOnly = true)
    override fun findById(id: Long): UserInterview? = jpaUserInterviewRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    override fun findByUserId(userId: Long): List<UserInterview> = jpaUserInterviewRepository.findByUserId(userId)

    override fun deleteById(id: Long) = jpaUserInterviewRepository.deleteById(id)

    @Transactional(readOnly = true)
    override fun existsById(id: Long): Boolean = jpaUserInterviewRepository.existsById(id)
}
