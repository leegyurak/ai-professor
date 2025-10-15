package com.aiprofessor.infrastructure.util

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths

class FileStorageUtilsTest {
    @TempDir
    lateinit var tempDir: Path

    private lateinit var fileStorageUtils: FileStorageUtils
    private val baseUrl = "https://test.example.com"

    @BeforeEach
    fun setUp() {
        // Change working directory to temp for testing
        System.setProperty("user.dir", tempDir.toString())
        fileStorageUtils = FileStorageUtils(baseUrl)
    }

    @AfterEach
    fun tearDown() {
        // Clean up test files
        val inputDir = tempDir.resolve("datas/input")
        val outputDir = tempDir.resolve("datas/output")
        if (Files.exists(inputDir)) {
            Files.walk(inputDir)
                .sorted(Comparator.reverseOrder())
                .forEach { Files.deleteIfExists(it) }
        }
        if (Files.exists(outputDir)) {
            Files.walk(outputDir)
                .sorted(Comparator.reverseOrder())
                .forEach { Files.deleteIfExists(it) }
        }
    }

    @Test
    fun `saveInputPdf should save file with correct naming convention`() {
        // given
        val username = "testuser"
        val pdfBytes = "test pdf content".toByteArray()

        // when
        val filePath = fileStorageUtils.saveInputPdf(username, pdfBytes)

        // then
        assertThat(filePath).startsWith("datas/input/$username")
        assertThat(filePath).endsWith(".pdf")
        assertThat(filePath).matches("datas/input/$username" + "_[a-f0-9-]+\\.pdf")

        // Verify file exists and has correct content
        val savedContent = Files.readAllBytes(Paths.get(filePath))
        assertThat(savedContent).isEqualTo(pdfBytes)
    }

    @Test
    fun `saveOutputPdf should save file with correct naming convention`() {
        // given
        val username = "testuser"
        val processingType = "SUMMARY"
        val pdfBytes = "test output content".toByteArray()

        // when
        val filePath = fileStorageUtils.saveOutputPdf(username, processingType, pdfBytes)

        // then
        assertThat(filePath).startsWith("datas/output/$username")
        assertThat(filePath).contains("_summary")
        assertThat(filePath).endsWith(".pdf")
        assertThat(filePath).matches("datas/output/$username" + "_[a-f0-9-]+_summary\\.pdf")

        // Verify file exists and has correct content
        val savedContent = Files.readAllBytes(Paths.get(filePath))
        assertThat(savedContent).isEqualTo(pdfBytes)
    }

    @Test
    fun `filePathToUrl should convert file path to URL correctly`() {
        // given
        val filePath = "datas/input/testuser_123-456.pdf"

        // when
        val url = fileStorageUtils.filePathToUrl(filePath)

        // then
        assertThat(url).isEqualTo("$baseUrl/datas/input/testuser_123-456.pdf")
    }

    @Test
    fun `filePathToUrl should handle leading slash`() {
        // given
        val filePath = "/datas/input/testuser_123-456.pdf"

        // when
        val url = fileStorageUtils.filePathToUrl(filePath)

        // then
        assertThat(url).isEqualTo("$baseUrl/datas/input/testuser_123-456.pdf")
    }

    @Test
    fun `filePathToUrl should handle trailing slash in base URL`() {
        // given
        val fileStorageWithTrailingSlash = FileStorageUtils("https://test.example.com/")
        val filePath = "datas/input/testuser_123-456.pdf"

        // when
        val url = fileStorageWithTrailingSlash.filePathToUrl(filePath)

        // then
        assertThat(url).isEqualTo("https://test.example.com/datas/input/testuser_123-456.pdf")
    }

    @Test
    fun `deleteFile should remove existing file`() {
        // given
        val username = "testuser"
        val pdfBytes = "test content".toByteArray()
        val filePath = fileStorageUtils.saveInputPdf(username, pdfBytes)
        assertThat(Files.exists(Paths.get(filePath))).isTrue()

        // when
        fileStorageUtils.deleteFile(filePath)

        // then
        assertThat(Files.exists(Paths.get(filePath))).isFalse()
    }

    @Test
    fun `deleteFile should not throw exception for non-existent file`() {
        // given
        val filePath = "datas/input/nonexistent.pdf"

        // when & then
        org.junit.jupiter.api.assertDoesNotThrow {
            fileStorageUtils.deleteFile(filePath)
        }
    }

    @Test
    fun `readFile should return file content`() {
        // given
        val username = "testuser"
        val pdfBytes = "test content for reading".toByteArray()
        val filePath = fileStorageUtils.saveInputPdf(username, pdfBytes)

        // when
        val readBytes = fileStorageUtils.readFile(filePath)

        // then
        assertThat(readBytes).isEqualTo(pdfBytes)
    }

    @Test
    fun `fileExists should return true for existing file`() {
        // given
        val username = "testuser"
        val pdfBytes = "test content".toByteArray()
        val filePath = fileStorageUtils.saveInputPdf(username, pdfBytes)

        // when
        val exists = fileStorageUtils.fileExists(filePath)

        // then
        assertThat(exists).isTrue()
    }

    @Test
    fun `fileExists should return false for non-existent file`() {
        // given
        val filePath = "datas/input/nonexistent.pdf"

        // when
        val exists = fileStorageUtils.fileExists(filePath)

        // then
        assertThat(exists).isFalse()
    }

    @Test
    fun `saveOutputPdf should handle different processing types`() {
        // given
        val username = "testuser"
        val pdfBytes = "test content".toByteArray()

        // when
        val summaryPath = fileStorageUtils.saveOutputPdf(username, "SUMMARY", pdfBytes)
        val examPath = fileStorageUtils.saveOutputPdf(username, "EXAM_QUESTIONS", pdfBytes)

        // then
        assertThat(summaryPath).contains("_summary.pdf")
        assertThat(examPath).contains("_exam_questions.pdf")
    }

    @Test
    fun `saveInputPdf should generate unique UUIDs for same user`() {
        // given
        val username = "testuser"
        val pdfBytes = "test content".toByteArray()

        // when
        val filePath1 = fileStorageUtils.saveInputPdf(username, pdfBytes)
        val filePath2 = fileStorageUtils.saveInputPdf(username, pdfBytes)

        // then
        assertThat(filePath1).isNotEqualTo(filePath2)
        assertThat(Files.exists(Paths.get(filePath1))).isTrue()
        assertThat(Files.exists(Paths.get(filePath2))).isTrue()
    }

    @Test
    fun `saveInputPdf should handle username with special characters`() {
        // given
        val username = "test.user-123"
        val pdfBytes = "test content".toByteArray()

        // when
        val filePath = fileStorageUtils.saveInputPdf(username, pdfBytes)

        // then
        assertThat(filePath).contains(username)
        assertThat(Files.exists(Paths.get(filePath))).isTrue()
    }

    @Test
    fun `saveInputPdf should handle large PDF files`() {
        // given
        val username = "testuser"
        val largePdfBytes = ByteArray(10 * 1024 * 1024) // 10MB
        for (i in largePdfBytes.indices) {
            largePdfBytes[i] = (i % 256).toByte()
        }

        // when
        val filePath = fileStorageUtils.saveInputPdf(username, largePdfBytes)

        // then
        assertThat(Files.exists(Paths.get(filePath))).isTrue()
        val savedBytes = Files.readAllBytes(Paths.get(filePath))
        assertThat(savedBytes).hasSize(largePdfBytes.size)
    }

    @Test
    fun `saveInputPdf should overwrite existing file with same name`() {
        // given
        val username = "testuser"
        val originalBytes = "original content".toByteArray()
        val newBytes = "new content".toByteArray()

        // Save first time
        val filePath = fileStorageUtils.saveInputPdf(username, originalBytes)

        // Manually create a file with potentially conflicting name (edge case)
        Files.write(Paths.get(filePath), newBytes, java.nio.file.StandardOpenOption.TRUNCATE_EXISTING)

        // when
        val readBytes = Files.readAllBytes(Paths.get(filePath))

        // then
        assertThat(readBytes).isEqualTo(newBytes)
    }

    @Test
    fun `saveOutputPdf should handle uppercase processing type`() {
        // given
        val username = "testuser"
        val processingType = "EXAM_QUESTIONS"
        val pdfBytes = "test content".toByteArray()

        // when
        val filePath = fileStorageUtils.saveOutputPdf(username, processingType, pdfBytes)

        // then
        assertThat(filePath).contains("_exam_questions.pdf")
        assertThat(Files.exists(Paths.get(filePath))).isTrue()
    }

    @Test
    fun `filePathToUrl should handle multiple slashes`() {
        // given
        val filePath = "//datas//input//testuser_123-456.pdf"

        // when
        val url = fileStorageUtils.filePathToUrl(filePath)

        // then
        assertThat(url).isEqualTo("$baseUrl/datas//input//testuser_123-456.pdf")
    }

    @Test
    fun `readFile should throw exception for non-existent file`() {
        // given
        val filePath = "datas/input/nonexistent.pdf"

        // when & then
        org.junit.jupiter.api.assertThrows<java.nio.file.NoSuchFileException> {
            fileStorageUtils.readFile(filePath)
        }
    }

    @Test
    fun `saveInputPdf should handle empty PDF bytes`() {
        // given
        val username = "testuser"
        val emptyBytes = ByteArray(0)

        // when
        val filePath = fileStorageUtils.saveInputPdf(username, emptyBytes)

        // then
        assertThat(Files.exists(Paths.get(filePath))).isTrue()
        assertThat(Files.size(Paths.get(filePath))).isEqualTo(0L)
    }

    @Test
    fun `saveOutputPdf should handle mixed case processing type`() {
        // given
        val username = "testuser"
        val processingType = "ExamQuestions"
        val pdfBytes = "test content".toByteArray()

        // when
        val filePath = fileStorageUtils.saveOutputPdf(username, processingType, pdfBytes)

        // then
        assertThat(filePath).contains("_examquestions.pdf")
    }

    @Test
    fun `deleteFile should be idempotent`() {
        // given
        val username = "testuser"
        val pdfBytes = "test content".toByteArray()
        val filePath = fileStorageUtils.saveInputPdf(username, pdfBytes)

        // when
        fileStorageUtils.deleteFile(filePath)
        fileStorageUtils.deleteFile(filePath) // Delete again

        // then
        assertThat(Files.exists(Paths.get(filePath))).isFalse()
    }

    @Test
    fun `filePathToUrl should preserve query parameters if present`() {
        // given
        val filePath = "datas/input/testuser_123-456.pdf?version=1"

        // when
        val url = fileStorageUtils.filePathToUrl(filePath)

        // then
        assertThat(url).isEqualTo("$baseUrl/datas/input/testuser_123-456.pdf?version=1")
    }

    @Test
    fun `saveInputPdf should work with concurrent requests`() {
        // given
        val username = "testuser"
        val pdfBytes = "test content".toByteArray()
        val filePaths = mutableListOf<String>()

        // when - simulate concurrent saves
        repeat(10) {
            filePaths.add(fileStorageUtils.saveInputPdf(username, pdfBytes))
        }

        // then - all should be unique and exist
        assertThat(filePaths).hasSize(10)
        assertThat(filePaths.toSet()).hasSize(10) // All unique
        filePaths.forEach { path ->
            assertThat(Files.exists(Paths.get(path))).isTrue()
        }
    }

    @Test
    fun `filePathToUrl should handle unicode characters in filename`() {
        // given
        val filePath = "datas/input/사용자_123-456.pdf"

        // when
        val url = fileStorageUtils.filePathToUrl(filePath)

        // then
        assertThat(url).contains("사용자")
    }
}
