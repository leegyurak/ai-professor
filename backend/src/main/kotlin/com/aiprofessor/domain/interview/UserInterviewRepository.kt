package com.aiprofessor.domain.interview

interface UserInterviewRepository {
    fun save(userInterview: UserInterview): UserInterview

    fun findById(id: Long): UserInterview?

    fun findByUserId(userId: Long): List<UserInterview>

    fun deleteById(id: Long)

    fun existsById(id: Long): Boolean
}
