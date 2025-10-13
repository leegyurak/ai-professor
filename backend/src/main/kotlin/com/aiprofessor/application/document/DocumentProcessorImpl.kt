package com.aiprofessor.application.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.DocumentProcessor
import com.aiprofessor.domain.document.DocumentRequest
import com.aiprofessor.domain.document.DocumentResponse
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.infrastructure.claude.ClaudeApiClient
import com.aiprofessor.infrastructure.util.PdfUtils
import com.aiprofessor.infrastructure.util.PromptLoader
import org.springframework.stereotype.Service

@Service
class DocumentProcessorImpl(
    private val claudeApiClient: ClaudeApiClient,
    private val pdfUtils: PdfUtils,
    private val promptLoader: PromptLoader,
    private val documentHistoryRepository: DocumentHistoryRepository,
    private val cacheService: com.aiprofessor.infrastructure.document.DocumentHistoryCacheService,
) : DocumentProcessor {
    companion object {
        private const val DEFAULT_USER_PROMPT = "Please analyze this document."
    }

    private fun cleanBase64String(base64: String): String {
        // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
        return base64
            .removePrefix("data:application/pdf;base64,")
            .trim()
            .replace("\n", "")
            .replace("\r", "")
            .replace(" ", "")
    }

    private val summaryPrompt: String by lazy {
        promptLoader.loadPrompt("summary.md")
    }

    private val examQuestionsPrompt: String by lazy {
        promptLoader.loadPrompt("exam-questions.md")
    }

    override suspend fun processSummary(request: DocumentRequest): DocumentResponse {
        // Validate PDF size
        pdfUtils.base64ToPdfBytes(request.pdfBase64)

        // Clean base64 by removing data URL prefix if present
        val cleanBase64 = cleanBase64String(request.pdfBase64)

        // Send to Claude API
        val userPrompt = request.userPrompt ?: DEFAULT_USER_PROMPT
        val markdownResponse =
            claudeApiClient.sendMessage(
                systemPrompt = summaryPrompt,
                userPrompt = userPrompt,
                pdfBase64 = cleanBase64,
            )

        // Convert markdown to PDF
        val resultPdfBytes = pdfUtils.markdownToPdf(markdownResponse)
        val resultBase64 = pdfUtils.pdfBytesToBase64(resultPdfBytes)

        // Save history
        saveHistory(
            userId = request.userId,
            processingType = ProcessingType.SUMMARY,
            userPrompt = request.userPrompt,
            inputBase64 = request.pdfBase64,
            outputBase64 = resultBase64,
        )

        return DocumentResponse(resultPdfBase64 = resultBase64)
    }

    override suspend fun processExamQuestions(request: DocumentRequest): DocumentResponse {
        // Validate PDF size
        pdfUtils.base64ToPdfBytes(request.pdfBase64)

        // Clean base64 by removing data URL prefix if present
        val cleanBase64 = cleanBase64String(request.pdfBase64)

        // Send to Claude API
        val userPrompt = request.userPrompt ?: DEFAULT_USER_PROMPT
        val markdownResponse =
            claudeApiClient.sendMessage(
                systemPrompt = examQuestionsPrompt,
                userPrompt = userPrompt,
                pdfBase64 = cleanBase64,
            )

        // Convert markdown to PDF
        val resultPdfBytes = pdfUtils.markdownToPdf(markdownResponse)
        val resultBase64 = pdfUtils.pdfBytesToBase64(resultPdfBytes)

        // Save history
        saveHistory(
            userId = request.userId,
            processingType = ProcessingType.EXAM_QUESTIONS,
            userPrompt = request.userPrompt,
            inputBase64 = request.pdfBase64,
            outputBase64 = resultBase64,
        )

        return DocumentResponse(resultPdfBase64 = resultBase64)
    }

    private fun saveHistory(
        userId: Long,
        processingType: ProcessingType,
        userPrompt: String?,
        inputBase64: String,
        outputBase64: String,
    ) {
        val history =
            DocumentHistory(
                userId = userId,
                processingType = processingType,
                userPrompt = userPrompt,
                inputBase64 = inputBase64,
                outputBase64 = outputBase64,
            )
        documentHistoryRepository.save(history)

        // Invalidate cache when new history is added
        cacheService.invalidateCache(userId)
    }
}
