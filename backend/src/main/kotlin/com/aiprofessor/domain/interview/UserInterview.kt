package com.aiprofessor.domain.interview

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "user_interviews")
class UserInterview(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(nullable = false)
    val userId: Long,
    @Column(nullable = false)
    var interviewDate: LocalDate,
    @Column(nullable = false, length = 100)
    var interviewType: String,
    @Column(nullable = false, length = 1000)
    var announcementUrl: String,
    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
