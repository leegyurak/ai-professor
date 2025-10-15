package com.aiprofessor.infrastructure.util

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.file.StandardOpenOption
import java.util.UUID

@Component
class FileStorageUtils(
    @Value("\${app.base-url}")
    private val baseUrl: String,
) {
    companion object {
        private const val INPUT_DIR = "datas/input"
        private const val OUTPUT_DIR = "datas/output"
    }

    init {
        // Create directories if they don't exist
        createDirectoryIfNotExists(INPUT_DIR)
        createDirectoryIfNotExists(OUTPUT_DIR)
    }

    private fun createDirectoryIfNotExists(dir: String) {
        val path = Paths.get(dir)
        if (!Files.exists(path)) {
            Files.createDirectories(path)
        }
    }

    /**
     * Save input PDF file
     * @param username Username for the file naming
     * @param pdfBytes PDF file bytes
     * @return File path in the format: datas/input/{username}_{uuid4}.pdf
     */
    fun saveInputPdf(
        username: String,
        pdfBytes: ByteArray,
    ): String {
        val uuid = UUID.randomUUID().toString()
        val fileName = "${username}_$uuid.pdf"
        val filePath = "$INPUT_DIR/$fileName"
        val path = Paths.get(filePath)

        Files.write(path, pdfBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)
        return filePath
    }

    /**
     * Save output PDF file
     * @param username Username for the file naming
     * @param processingType Type of processing (SUMMARY or EXAM_QUESTIONS)
     * @param pdfBytes PDF file bytes
     * @return File path in the format: datas/output/{username}_{uuid4}_{processing_type}.pdf
     */
    fun saveOutputPdf(
        username: String,
        processingType: String,
        pdfBytes: ByteArray,
    ): String {
        val uuid = UUID.randomUUID().toString()
        val fileName = "${username}_${uuid}_${processingType.lowercase()}.pdf"
        val filePath = "$OUTPUT_DIR/$fileName"
        val path = Paths.get(filePath)

        Files.write(path, pdfBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)
        return filePath
    }

    /**
     * Convert file path to URL
     * @param filePath File path (e.g., datas/input/file.pdf)
     * @return URL (e.g., https://a.com/datas/input/file.pdf)
     */
    fun filePathToUrl(filePath: String): String {
        // Remove leading slash if present
        val normalizedPath = filePath.trimStart('/')
        // Ensure base URL doesn't end with slash
        val normalizedBaseUrl = baseUrl.trimEnd('/')
        return "$normalizedBaseUrl/$normalizedPath"
    }

    /**
     * Delete a file
     * @param filePath File path to delete
     */
    fun deleteFile(filePath: String) {
        val path = Paths.get(filePath)
        if (Files.exists(path)) {
            Files.delete(path)
        }
    }

    /**
     * Read file as bytes
     * @param filePath File path to read
     * @return File bytes
     */
    fun readFile(filePath: String): ByteArray {
        val path = Paths.get(filePath)
        return Files.readAllBytes(path)
    }

    /**
     * Check if file exists
     * @param filePath File path to check
     * @return true if file exists, false otherwise
     */
    fun fileExists(filePath: String): Boolean {
        val path = Paths.get(filePath)
        return Files.exists(path)
    }
}
