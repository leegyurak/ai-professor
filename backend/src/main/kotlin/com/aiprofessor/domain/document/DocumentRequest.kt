package com.aiprofessor.domain.document

data class DocumentRequest(
    val userId: Long,
    val pdfBase64: String,
    val userPrompt: String? = null,
)
