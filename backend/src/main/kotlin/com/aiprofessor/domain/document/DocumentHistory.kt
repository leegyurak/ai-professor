package com.aiprofessor.domain.document

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "document_history")
@JsonIgnoreProperties(ignoreUnknown = true, value = ["hibernateLazyInitializer", "handler"])
class DocumentHistory(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null,
    @Column(nullable = false)
    val userId: Long,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50, columnDefinition = "VARCHAR(50)")
    val processingType: ProcessingType,
    @Column(columnDefinition = "TEXT")
    val userPrompt: String? = null,
    @Column(nullable = false, length = 500)
    val inputFilePath: String,
    @Column(nullable = false, length = 500)
    val outputFilePath: String,
    @Column(nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
)

enum class ProcessingType {
    SUMMARY,
    EXAM_QUESTIONS,
}
