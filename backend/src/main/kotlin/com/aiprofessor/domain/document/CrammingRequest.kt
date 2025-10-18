package com.aiprofessor.domain.document

data class CrammingRequest(
    val userId: Long,
    val pdfBase64: String,
    val hoursUntilExam: Int,
)
