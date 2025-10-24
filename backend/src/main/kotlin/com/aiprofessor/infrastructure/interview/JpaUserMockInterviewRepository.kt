package com.aiprofessor.infrastructure.interview

import com.aiprofessor.domain.interview.UserMockInterview
import org.springframework.data.jpa.repository.JpaRepository

interface JpaUserMockInterviewRepository : JpaRepository<UserMockInterview, Long> {
    fun findByUserId(userId: Long): List<UserMockInterview>

    fun findByUserInterviewId(userInterviewId: Long): List<UserMockInterview>
}
