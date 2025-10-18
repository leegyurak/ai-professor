package com.aiprofessor.application.document

import com.aiprofessor.domain.document.CrammingRequest
import com.aiprofessor.domain.document.CrammingResponse
import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.DocumentHistoryRepository
import com.aiprofessor.domain.document.DocumentProcessor
import com.aiprofessor.domain.document.DocumentRequest
import com.aiprofessor.domain.document.DocumentResponse
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.domain.user.UserRepository
import com.aiprofessor.infrastructure.claude.ClaudeApiClient
import com.aiprofessor.infrastructure.util.FileStorageUtils
import com.aiprofessor.infrastructure.util.PdfUtils
import com.aiprofessor.infrastructure.util.PromptLoader
import org.springframework.stereotype.Service

@Service
class DocumentProcessorImpl(
    private val claudeApiClient: ClaudeApiClient,
    private val pdfUtils: PdfUtils,
    private val promptLoader: PromptLoader,
    private val documentHistoryRepository: DocumentHistoryRepository,
    private val fileStorageUtils: FileStorageUtils,
    private val userRepository: UserRepository,
) : DocumentProcessor {
    companion object {
        private const val DEFAULT_USER_PROMPT = "Please analyze this document."
    }

    private fun buildUserPromptWithImportantParts(
        basePrompt: String,
        importantParts: List<String>?,
    ): String {
        if (importantParts.isNullOrEmpty()) {
            return basePrompt
        }

        val importantPartsText =
            importantParts
                .mapIndexed { index, part -> "${index + 1}. $part" }
                .joinToString("\n")

        return buildString {
            append(basePrompt)
            append("\n\n")
            append("**중요: 다음 부분은 반드시 포함해주세요:**\n")
            append(importantPartsText)
        }
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

    private val crammingPrompt: String by lazy {
        promptLoader.loadPrompt("cramming.md")
    }

    override suspend fun processSummary(request: DocumentRequest): DocumentResponse {
        // Get user info
        val user =
            userRepository.findById(request.userId)
                ?: throw IllegalArgumentException("User not found with id: ${request.userId}")

        // Clean base64 and convert to PDF bytes
        val cleanBase64 = cleanBase64String(request.pdfBase64)
        val inputPdfBytes = pdfUtils.base64ToPdfBytes(cleanBase64)

        // Log PDF size for debugging
        val pdfSizeMB = inputPdfBytes.size / (1024.0 * 1024.0)
        println("Processing PDF size: %.2f MB (%d bytes)".format(pdfSizeMB, inputPdfBytes.size))

        // Save input PDF to file storage
        val inputFilePath = fileStorageUtils.saveInputPdf(user.username, inputPdfBytes)

        // Extract text from PDF
        println("Extracting text from PDF...")
        val extractedText = pdfUtils.extractTextFromPdf(inputPdfBytes)
        println("Extracted text length: ${extractedText.length} characters")

        // Send to Claude API with extracted text
        val baseUserPrompt = request.userPrompt ?: DEFAULT_USER_PROMPT
        val userPrompt = buildUserPromptWithImportantParts(baseUserPrompt, request.importantParts)
        val markdownResponse =
            claudeApiClient.sendMessage(
                systemPrompt = summaryPrompt,
                userPrompt = userPrompt,
                extractedText = extractedText,
            )

        // Convert markdown to PDF
        val resultPdfBytes = pdfUtils.markdownToPdf(markdownResponse)

        // Save output PDF to file storage
        val outputFilePath = fileStorageUtils.saveOutputPdf(user.username, ProcessingType.SUMMARY.name, resultPdfBytes)

        // Convert file paths to URLs
        val inputUrl = fileStorageUtils.filePathToUrl(inputFilePath)
        val outputUrl = fileStorageUtils.filePathToUrl(outputFilePath)

        // Save history
        saveHistory(
            userId = request.userId,
            processingType = ProcessingType.SUMMARY,
            userPrompt = request.userPrompt,
            inputFilePath = inputFilePath,
            outputFilePath = outputFilePath,
        )

        return DocumentResponse(resultPdfUrl = outputUrl)
    }

    override suspend fun processExamQuestions(request: DocumentRequest): DocumentResponse {
        // Get user info
        val user =
            userRepository.findById(request.userId)
                ?: throw IllegalArgumentException("User not found with id: ${request.userId}")

        // Clean base64 and convert to PDF bytes
        val cleanBase64 = cleanBase64String(request.pdfBase64)
        val inputPdfBytes = pdfUtils.base64ToPdfBytes(cleanBase64)

        // Log PDF size for debugging
        val pdfSizeMB = inputPdfBytes.size / (1024.0 * 1024.0)
        println("Processing PDF size: %.2f MB (%d bytes)".format(pdfSizeMB, inputPdfBytes.size))

        // Save input PDF to file storage
        val inputFilePath = fileStorageUtils.saveInputPdf(user.username, inputPdfBytes)

        // Extract text from PDF
        println("Extracting text from PDF...")
        val extractedText = pdfUtils.extractTextFromPdf(inputPdfBytes)
        println("Extracted text length: ${extractedText.length} characters")

        // Send to Claude API with extracted text
        val baseUserPrompt = request.userPrompt ?: DEFAULT_USER_PROMPT
        val userPrompt = buildUserPromptWithImportantParts(baseUserPrompt, request.importantParts)
        val markdownResponse =
            claudeApiClient.sendMessage(
                systemPrompt = examQuestionsPrompt,
                userPrompt = userPrompt,
                extractedText = extractedText,
            )

        // Convert markdown to PDF
        val resultPdfBytes = pdfUtils.markdownToPdf(markdownResponse)

        // Save output PDF to file storage
        val outputFilePath = fileStorageUtils.saveOutputPdf(user.username, ProcessingType.EXAM_QUESTIONS.name, resultPdfBytes)

        // Convert file paths to URLs
        val inputUrl = fileStorageUtils.filePathToUrl(inputFilePath)
        val outputUrl = fileStorageUtils.filePathToUrl(outputFilePath)

        // Save history
        saveHistory(
            userId = request.userId,
            processingType = ProcessingType.EXAM_QUESTIONS,
            userPrompt = request.userPrompt,
            inputFilePath = inputFilePath,
            outputFilePath = outputFilePath,
        )

        return DocumentResponse(resultPdfUrl = outputUrl)
    }

    override suspend fun processCramming(request: CrammingRequest): CrammingResponse {
        // Get user info
        val user =
            userRepository.findById(request.userId)
                ?: throw IllegalArgumentException("User not found with id: ${request.userId}")

        // Clean base64 and convert to PDF bytes
        val cleanBase64 = cleanBase64String(request.pdfBase64)
        val inputPdfBytes = pdfUtils.base64ToPdfBytes(cleanBase64)

        // Log PDF size for debugging
        val pdfSizeMB = inputPdfBytes.size / (1024.0 * 1024.0)
        println("Processing PDF size: %.2f MB (%d bytes)".format(pdfSizeMB, inputPdfBytes.size))

        // Save input PDF to file storage
        val inputFilePath = fileStorageUtils.saveInputPdf(user.username, inputPdfBytes)

        // Extract text from PDF
        println("Extracting text from PDF...")
        val extractedText = pdfUtils.extractTextFromPdf(inputPdfBytes)
        println("Extracted text length: ${extractedText.length} characters")

        // Build user prompt with time information
        val userPrompt = "시험까지 남은 시간: ${request.hoursUntilExam}시간"

        // Send to Claude API with extracted text
        val markdownResponse =
            claudeApiClient.sendMessage(
                systemPrompt = crammingPrompt,
                userPrompt = userPrompt,
                extractedText = extractedText,
            )

        // Convert markdown to PDF
        val resultPdfBytes = pdfUtils.markdownToPdf(markdownResponse)

        // Save output PDF to file storage
        val outputFilePath = fileStorageUtils.saveOutputPdf(user.username, ProcessingType.CRAMMING.name, resultPdfBytes)

        // Convert file paths to URLs
        val inputUrl = fileStorageUtils.filePathToUrl(inputFilePath)
        val outputUrl = fileStorageUtils.filePathToUrl(outputFilePath)

        // Save history
        saveHistory(
            userId = request.userId,
            processingType = ProcessingType.CRAMMING,
            userPrompt = userPrompt,
            inputFilePath = inputFilePath,
            outputFilePath = outputFilePath,
        )

        return CrammingResponse(
            markdownContent = markdownResponse,
            resultPdfUrl = outputUrl,
        )
    }

    private fun saveHistory(
        userId: Long,
        processingType: ProcessingType,
        userPrompt: String?,
        inputFilePath: String,
        outputFilePath: String,
    ) {
        val history =
            DocumentHistory(
                userId = userId,
                processingType = processingType,
                userPrompt = userPrompt,
                inputFilePath = inputFilePath,
                outputFilePath = outputFilePath,
            )
        documentHistoryRepository.save(history)
    }
}
