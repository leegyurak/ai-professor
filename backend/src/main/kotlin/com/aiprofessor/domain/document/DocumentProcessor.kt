package com.aiprofessor.domain.document

interface DocumentProcessor {
    suspend fun processSummary(request: DocumentRequest): DocumentResponse

    suspend fun processExamQuestions(request: DocumentRequest): DocumentResponse
}
