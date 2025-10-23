package com.aiprofessor.domain.schedule

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "schedule_document")
class ScheduleDocument(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(nullable = false)
    val userScheduleId: Long,
    @Column(nullable = false)
    val userId: Long,
    @Column(nullable = false)
    val count: Int,
    @Column(nullable = false, length = 500)
    val inputFilePath: String,
    @Column(nullable = false, length = 500)
    val outputFilePath: String,
    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now(),
)
