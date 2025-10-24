package com.aiprofessor.infrastructure.interview

import com.aiprofessor.domain.interview.UserMockInterview
import com.aiprofessor.domain.interview.UserMockInterviewRepository
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
@Transactional
class UserMockInterviewRepositoryImpl(
    private val jpaUserMockInterviewRepository: JpaUserMockInterviewRepository,
) : UserMockInterviewRepository {
    override fun save(userMockInterview: UserMockInterview): UserMockInterview = jpaUserMockInterviewRepository.save(userMockInterview)

    @Transactional(readOnly = true)
    override fun findById(id: Long): UserMockInterview? = jpaUserMockInterviewRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    override fun findByUserId(userId: Long): List<UserMockInterview> = jpaUserMockInterviewRepository.findByUserId(userId)

    @Transactional(readOnly = true)
    override fun findByUserInterviewId(userInterviewId: Long): List<UserMockInterview> =
        jpaUserMockInterviewRepository.findByUserInterviewId(userInterviewId)

    override fun deleteById(id: Long) = jpaUserMockInterviewRepository.deleteById(id)

    @Transactional(readOnly = true)
    override fun existsById(id: Long): Boolean = jpaUserMockInterviewRepository.existsById(id)
}
