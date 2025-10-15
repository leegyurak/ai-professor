package com.aiprofessor.presentation.document

import jakarta.validation.Validation
import jakarta.validation.Validator
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.util.Base64

class DocumentRequestDtoValidationTest {
    private lateinit var validator: Validator

    @BeforeEach
    fun setUp() {
        val factory = Validation.buildDefaultValidatorFactory()
        validator = factory.validator
    }

    @Test
    fun `valid DocumentRequestDto should have no validation errors`() {
        // given
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
        val dto =
            DocumentRequestDto(
                pdfBase64 = validBase64,
                userPrompt = "Test prompt",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `valid DocumentRequestDto with null userPrompt should have no validation errors`() {
        // given
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
        val dto =
            DocumentRequestDto(
                pdfBase64 = validBase64,
                userPrompt = null,
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `blank pdfBase64 should fail validation`() {
        // given
        val dto =
            DocumentRequestDto(
                pdfBase64 = "",
                userPrompt = "Test prompt",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).hasSize(1)
        assertThat(violations.first().message).isEqualTo("PDF base64 is required")
        assertThat(violations.first().propertyPath.toString()).isEqualTo("pdfBase64")
    }

    @Test
    fun `whitespace-only pdfBase64 should fail validation`() {
        // given
        val dto =
            DocumentRequestDto(
                pdfBase64 = "   ",
                userPrompt = "Test prompt",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).hasSize(1)
        assertThat(violations.first().message).isEqualTo("PDF base64 is required")
    }

    @Test
    fun `valid long base64 string should pass validation`() {
        // given
        val largePdfBytes = ByteArray(1024 * 1024) // 1MB
        for (i in largePdfBytes.indices) {
            largePdfBytes[i] = (i % 256).toByte()
        }
        val largeBase64 = Base64.getEncoder().encodeToString(largePdfBytes)
        val dto =
            DocumentRequestDto(
                pdfBase64 = largeBase64,
                userPrompt = "Test prompt",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `empty userPrompt string should pass validation`() {
        // given
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
        val dto =
            DocumentRequestDto(
                pdfBase64 = validBase64,
                userPrompt = "",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `userPrompt with special characters should pass validation`() {
        // given
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
        val dto =
            DocumentRequestDto(
                pdfBase64 = validBase64,
                userPrompt = "Test with special: äöü 한글 日本語 @#\$%^&*()",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `very long userPrompt should pass validation`() {
        // given
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
        val longPrompt = "x".repeat(10000)
        val dto =
            DocumentRequestDto(
                pdfBase64 = validBase64,
                userPrompt = longPrompt,
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `pdfBase64 with valid base64 characters should pass validation`() {
        // given
        // Valid base64
        val dto =
            DocumentRequestDto(
                pdfBase64 = "VGVzdCBQREYgQ29udGVudA==",
                userPrompt = "Test prompt",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `userPrompt with newlines should pass validation`() {
        // given
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
        val dto =
            DocumentRequestDto(
                pdfBase64 = validBase64,
                userPrompt = "Line 1\nLine 2\nLine 3",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `userPrompt with tabs should pass validation`() {
        // given
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
        val dto =
            DocumentRequestDto(
                pdfBase64 = validBase64,
                userPrompt = "Column1\tColumn2\tColumn3",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `pdfBase64 with padding should pass validation`() {
        // given
        // base64 with padding
        val dto =
            DocumentRequestDto(
                pdfBase64 = "dGVzdA==",
                userPrompt = "Test prompt",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `pdfBase64 without padding should pass validation`() {
        // given
        // base64 without padding
        val dto =
            DocumentRequestDto(
                pdfBase64 = "dGVzdA",
                userPrompt = "Test prompt",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `minimum valid pdfBase64 should pass validation`() {
        // given
        // Single character 'a' in base64
        val dto =
            DocumentRequestDto(
                pdfBase64 = "YQ==",
                userPrompt = "Test prompt",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `userPrompt with only whitespace should pass validation`() {
        // given
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
        val dto =
            DocumentRequestDto(
                pdfBase64 = validBase64,
                userPrompt = "     ",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }

    @Test
    fun `userPrompt with emojis should pass validation`() {
        // given
        val validBase64 = Base64.getEncoder().encodeToString("test pdf content".toByteArray())
        val dto =
            DocumentRequestDto(
                pdfBase64 = validBase64,
                userPrompt = "Test with emojis: 😀 🎉 🚀",
            )

        // when
        val violations = validator.validate(dto)

        // then
        assertThat(violations).isEmpty()
    }
}
