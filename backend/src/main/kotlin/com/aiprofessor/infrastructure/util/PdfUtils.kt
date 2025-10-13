package com.aiprofessor.infrastructure.util

import com.aiprofessor.domain.exception.EmptyContentException
import com.aiprofessor.domain.exception.InvalidPdfException
import com.aiprofessor.domain.exception.MarkdownConversionException
import com.aiprofessor.domain.exception.PdfProcessingException
import com.aiprofessor.domain.exception.PdfSizeExceededException
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder
import com.vladsch.flexmark.html.HtmlRenderer
import com.vladsch.flexmark.parser.Parser
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.io.ByteArrayOutputStream
import java.util.Base64

@Component
class PdfUtils(
    @Value("\${pdf.max-size-bytes}") private val maxSizeBytes: Long,
) {
    fun base64ToPdfBytes(base64: String): ByteArray {
        if (base64.isBlank()) {
            throw EmptyContentException("PDF base64 문자열이 비어있습니다.")
        }

        // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
        val cleanBase64 =
            base64
                .removePrefix("data:application/pdf;base64,")
                .trim()
                .replace("\n", "")
                .replace("\r", "")
                .replace(" ", "")

        val pdfBytes =
            try {
                Base64.getDecoder().decode(cleanBase64)
            } catch (e: IllegalArgumentException) {
                throw InvalidPdfException("유효하지 않은 Base64 형식입니다.", e)
            }

        if (pdfBytes.size > maxSizeBytes) {
            throw PdfSizeExceededException()
        }

        // Validate that it's actually a PDF by checking the PDF header
        if (pdfBytes.size < 5 || !isPdfHeader(pdfBytes)) {
            throw InvalidPdfException("유효한 PDF 파일이 아닙니다. PDF 헤더가 올바르지 않습니다.")
        }

        return pdfBytes
    }

    private fun isPdfHeader(bytes: ByteArray): Boolean {
        // PDF files must start with "%PDF-" (0x25 0x50 0x44 0x46 0x2D)
        return bytes.size >= 5 &&
            bytes[0] == 0x25.toByte() &&
            bytes[1] == 0x50.toByte() &&
            bytes[2] == 0x44.toByte() &&
            bytes[3] == 0x46.toByte() &&
            bytes[4] == 0x2D.toByte()
    }

    fun pdfBytesToBase64(pdfBytes: ByteArray): String = Base64.getEncoder().encodeToString(pdfBytes)

    fun extractTextFromPdf(pdfBytes: ByteArray): String {
        try {
            val document = PDDocument.load(pdfBytes)
            val stripper = PDFTextStripper()
            val text = stripper.getText(document)
            document.close()

            if (text.isBlank()) {
                throw EmptyContentException("PDF에서 텍스트를 추출할 수 없습니다.")
            }

            return text
        } catch (e: EmptyContentException) {
            throw e
        } catch (e: Exception) {
            throw PdfProcessingException("PDF 텍스트 추출 중 오류가 발생했습니다.", e)
        }
    }

    fun markdownToPdf(markdown: String): ByteArray {
        if (markdown.isBlank()) {
            throw EmptyContentException("변환할 Markdown 내용이 비어있습니다.")
        }

        try {
            // Convert markdown to HTML
            val parser = Parser.builder().build()
            val renderer = HtmlRenderer.builder().build()
            val document = parser.parse(markdown)
            val html = renderer.render(document)

            // Wrap HTML with proper structure and styling
            val styledHtml =
                """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <style>
                        body {
                            font-family: 'Noto Sans KR', Arial, sans-serif;
                            line-height: 1.6;
                            margin: 40px;
                            color: #333;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            margin-top: 24px;
                            margin-bottom: 16px;
                            font-weight: 600;
                        }
                        h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
                        h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
                        h3 { font-size: 1.25em; }
                        p { margin-bottom: 16px; }
                        code {
                            background-color: #f6f8fa;
                            padding: 2px 4px;
                            border-radius: 3px;
                            font-family: monospace;
                        }
                        pre {
                            background-color: #f6f8fa;
                            padding: 16px;
                            border-radius: 3px;
                            overflow-x: auto;
                        }
                        pre code {
                            background-color: transparent;
                            padding: 0;
                        }
                        ul, ol {
                            margin-bottom: 16px;
                            padding-left: 32px;
                        }
                        li {
                            margin-bottom: 8px;
                        }
                        blockquote {
                            border-left: 4px solid #ddd;
                            padding-left: 16px;
                            color: #666;
                            margin: 16px 0;
                        }
                        table {
                            border-collapse: collapse;
                            width: 100%;
                            margin-bottom: 16px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f6f8fa;
                            font-weight: 600;
                        }
                    </style>
                </head>
                <body>
                    $html
                </body>
                </html>
                """.trimIndent()

            // Convert HTML to PDF
            val outputStream = ByteArrayOutputStream()
            val builder = PdfRendererBuilder()

            // Load Noto Sans KR fonts from resources
            try {
                val classLoader = this.javaClass.classLoader

                // Load Regular font
                val regularFontStream = classLoader.getResourceAsStream("fonts/NotoSansKR-Regular.ttf")
                if (regularFontStream != null) {
                    builder.useFont({ regularFontStream }, "Noto Sans KR", 400, null, false)
                }

                // Load SemiBold font
                val semiBoldFontStream = classLoader.getResourceAsStream("fonts/NotoSansKR-SemiBold.ttf")
                if (semiBoldFontStream != null) {
                    builder.useFont({ semiBoldFontStream }, "Noto Sans KR", 600, null, false)
                }
            } catch (e: Exception) {
                // If font loading fails, continue with default fonts
                // Korean characters may not render correctly
            }

            builder.useFastMode()
            builder.withHtmlContent(styledHtml, null)
            builder.toStream(outputStream)
            builder.run()

            val pdfBytes = outputStream.toByteArray()

            if (pdfBytes.isEmpty()) {
                throw MarkdownConversionException("PDF 변환 결과가 비어있습니다.")
            }

            return pdfBytes
        } catch (e: EmptyContentException) {
            throw e
        } catch (e: MarkdownConversionException) {
            throw e
        } catch (e: Exception) {
            throw MarkdownConversionException("Markdown을 PDF로 변환하는 중 오류가 발생했습니다.", e)
        }
    }
}
