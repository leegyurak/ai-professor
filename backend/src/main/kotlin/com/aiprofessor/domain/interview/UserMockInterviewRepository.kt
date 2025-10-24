package com.aiprofessor.domain.interview

interface UserMockInterviewRepository {
    fun save(userMockInterview: UserMockInterview): UserMockInterview

    fun findById(id: Long): UserMockInterview?

    fun findByUserId(userId: Long): List<UserMockInterview>

    fun findByUserInterviewId(userInterviewId: Long): List<UserMockInterview>

    fun deleteById(id: Long)

    fun existsById(id: Long): Boolean
}
