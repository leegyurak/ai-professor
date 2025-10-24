package com.aiprofessor.domain.interview

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "user_mock_interviews")
class UserMockInterview(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(nullable = false)
    val userId: Long,
    @Column(nullable = false)
    val userInterviewId: Long,
    @Column(nullable = false, length = 500)
    val resumeFilePath: String,
    @Column(nullable = false, length = 500)
    val questionFilePath: String,
    @Column(length = 500)
    var gradingFilePath: String? = null,
    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
