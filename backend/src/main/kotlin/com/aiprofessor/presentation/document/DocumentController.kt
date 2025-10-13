package com.aiprofessor.presentation.document

import com.aiprofessor.domain.document.DocumentHistoryService
import com.aiprofessor.domain.document.DocumentProcessor
import com.aiprofessor.domain.document.DocumentRequest
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.domain.exception.UnauthorizedException
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import kotlinx.coroutines.runBlocking
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/documents")
class DocumentController(
    private val documentProcessor: DocumentProcessor,
    private val documentHistoryService: DocumentHistoryService,
) {
    @PostMapping("/summary")
    fun generateSummary(
        @Valid @RequestBody request: DocumentRequestDto,
    ): ResponseEntity<DocumentResponseDto> =
        runBlocking {
            val userId = getCurrentUserId()

            val domainRequest =
                DocumentRequest(
                    userId = userId,
                    pdfBase64 = request.pdfBase64,
                    userPrompt = request.userPrompt,
                )

            val response = documentProcessor.processSummary(domainRequest)

            ResponseEntity.ok(
                DocumentResponseDto(
                    resultPdfBase64 = response.resultPdfBase64,
                ),
            )
        }

    @PostMapping("/exam-questions")
    fun generateExamQuestions(
        @Valid @RequestBody request: DocumentRequestDto,
    ): ResponseEntity<DocumentResponseDto> =
        runBlocking {
            val userId = getCurrentUserId()

            val domainRequest =
                DocumentRequest(
                    userId = userId,
                    pdfBase64 = request.pdfBase64,
                    userPrompt = request.userPrompt,
                )

            val response = documentProcessor.processExamQuestions(domainRequest)

            ResponseEntity.ok(
                DocumentResponseDto(
                    resultPdfBase64 = response.resultPdfBase64,
                ),
            )
        }

    @GetMapping("/history")
    fun getDocumentHistory(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) processingType: ProcessingType?,
    ): ResponseEntity<PagedDocumentHistoryResponseDto> {
        val userId = getCurrentUserId()

        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val historyPage = documentHistoryService.getDocumentHistory(userId, processingType, pageable)

        val response =
            PagedDocumentHistoryResponseDto(
                content = historyPage.content.map { it.toResponseDto() },
                pageNumber = historyPage.number,
                pageSize = historyPage.size,
                totalElements = historyPage.totalElements,
                totalPages = historyPage.totalPages,
                isLast = historyPage.isLast,
            )

        return ResponseEntity.ok(response)
    }

    private fun getCurrentUserId(): Long {
        val authentication =
            SecurityContextHolder.getContext().authentication
                ?: throw UnauthorizedException("인증 정보가 없습니다.")

        return authentication.principal as? Long
            ?: throw UnauthorizedException("유효하지 않은 인증 정보입니다.")
    }
}

data class DocumentRequestDto(
    @field:NotBlank(message = "PDF base64 is required")
    val pdfBase64: String,
    val userPrompt: String? = null,
)

data class DocumentResponseDto(
    val resultPdfBase64: String,
)
