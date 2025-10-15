package com.aiprofessor.presentation.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.ProcessingType
import com.aiprofessor.infrastructure.util.FileStorageUtils
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import java.time.LocalDateTime

class DocumentHistoryDtoTest {
    @Test
    fun `toResponseDto should convert DocumentHistory to DocumentHistoryResponseDto with URLs`() {
        // Given
        val fileStorageUtils = mockk<FileStorageUtils>()
        val inputFilePath = "datas/input/testuser_123-456.pdf"
        val outputFilePath = "datas/output/testuser_789-abc_summary.pdf"
        val inputUrl = "https://test.example.com/$inputFilePath"
        val outputUrl = "https://test.example.com/$outputFilePath"

        val documentHistory =
            DocumentHistory(
                id = 1L,
                userId = 1L,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test prompt",
                inputFilePath = inputFilePath,
                outputFilePath = outputFilePath,
                createdAt = LocalDateTime.of(2024, 1, 1, 12, 0),
            )

        every { fileStorageUtils.filePathToUrl(inputFilePath) } returns inputUrl
        every { fileStorageUtils.filePathToUrl(outputFilePath) } returns outputUrl

        // When
        val responseDto = documentHistory.toResponseDto(fileStorageUtils)

        // Then
        assertThat(responseDto.id).isEqualTo(1L)
        assertThat(responseDto.processingType).isEqualTo(ProcessingType.SUMMARY)
        assertThat(responseDto.userPrompt).isEqualTo("Test prompt")
        assertThat(responseDto.inputUrl).isEqualTo(inputUrl)
        assertThat(responseDto.outputUrl).isEqualTo(outputUrl)
        assertThat(responseDto.createdAt).isEqualTo(LocalDateTime.of(2024, 1, 1, 12, 0))

        verify(exactly = 1) { fileStorageUtils.filePathToUrl(inputFilePath) }
        verify(exactly = 1) { fileStorageUtils.filePathToUrl(outputFilePath) }
    }

    @Test
    fun `toResponseDto should handle null userPrompt`() {
        // Given
        val fileStorageUtils = mockk<FileStorageUtils>()
        val inputFilePath = "datas/input/testuser_123-456.pdf"
        val outputFilePath = "datas/output/testuser_789-abc_summary.pdf"
        val inputUrl = "https://test.example.com/$inputFilePath"
        val outputUrl = "https://test.example.com/$outputFilePath"

        val documentHistory =
            DocumentHistory(
                id = 1L,
                userId = 1L,
                processingType = ProcessingType.EXAM_QUESTIONS,
                userPrompt = null,
                inputFilePath = inputFilePath,
                outputFilePath = outputFilePath,
                createdAt = LocalDateTime.of(2024, 1, 1, 12, 0),
            )

        every { fileStorageUtils.filePathToUrl(inputFilePath) } returns inputUrl
        every { fileStorageUtils.filePathToUrl(outputFilePath) } returns outputUrl

        // When
        val responseDto = documentHistory.toResponseDto(fileStorageUtils)

        // Then
        assertThat(responseDto.userPrompt).isNull()
        assertThat(responseDto.processingType).isEqualTo(ProcessingType.EXAM_QUESTIONS)
    }

    @Test
    fun `toResponseDto should convert file paths to URLs`() {
        // Given
        val fileStorageUtils = mockk<FileStorageUtils>()
        val inputFilePath = "datas/input/user_abc.pdf"
        val outputFilePath = "datas/output/user_xyz.pdf"
        val inputUrl = "https://test.example.com/$inputFilePath"
        val outputUrl = "https://test.example.com/$outputFilePath"

        val documentHistory =
            DocumentHistory(
                id = 1L,
                userId = 1L,
                processingType = ProcessingType.SUMMARY,
                userPrompt = "Test prompt",
                inputFilePath = inputFilePath,
                outputFilePath = outputFilePath,
                createdAt = LocalDateTime.of(2024, 1, 1, 12, 0),
            )

        every { fileStorageUtils.filePathToUrl(inputFilePath) } returns inputUrl
        every { fileStorageUtils.filePathToUrl(outputFilePath) } returns outputUrl

        // When
        val responseDto = documentHistory.toResponseDto(fileStorageUtils)

        // Then
        assertThat(responseDto.inputUrl).isEqualTo(inputUrl)
        assertThat(responseDto.outputUrl).isEqualTo(outputUrl)

        verify(exactly = 1) { fileStorageUtils.filePathToUrl(inputFilePath) }
        verify(exactly = 1) { fileStorageUtils.filePathToUrl(outputFilePath) }
    }

    @Test
    fun `PagedDocumentHistoryResponseDto should have correct structure`() {
        // Given
        val content =
            listOf(
                DocumentHistoryResponseDto(
                    id = 1L,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test 1",
                    inputUrl = "https://test.example.com/input1.pdf",
                    outputUrl = "https://test.example.com/output1.pdf",
                    createdAt = LocalDateTime.now(),
                ),
                DocumentHistoryResponseDto(
                    id = 2L,
                    processingType = ProcessingType.EXAM_QUESTIONS,
                    userPrompt = "Test 2",
                    inputUrl = "https://test.example.com/input2.pdf",
                    outputUrl = "https://test.example.com/output2.pdf",
                    createdAt = LocalDateTime.now(),
                ),
            )

        // When
        val pagedResponse =
            PagedDocumentHistoryResponseDto(
                content = content,
                pageNumber = 0,
                pageSize = 10,
                totalElements = 2L,
                totalPages = 1,
                isLast = true,
            )

        // Then
        assertThat(pagedResponse.content).hasSize(2)
        assertThat(pagedResponse.pageNumber).isEqualTo(0)
        assertThat(pagedResponse.pageSize).isEqualTo(10)
        assertThat(pagedResponse.totalElements).isEqualTo(2L)
        assertThat(pagedResponse.totalPages).isEqualTo(1)
        assertThat(pagedResponse.isLast).isTrue()
    }
}
