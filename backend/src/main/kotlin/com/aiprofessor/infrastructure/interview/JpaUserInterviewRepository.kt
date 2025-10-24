package com.aiprofessor.infrastructure.interview

import com.aiprofessor.domain.interview.UserInterview
import org.springframework.data.jpa.repository.JpaRepository

interface JpaUserInterviewRepository : JpaRepository<UserInterview, Long> {
    fun findByUserId(userId: Long): List<UserInterview>
}
