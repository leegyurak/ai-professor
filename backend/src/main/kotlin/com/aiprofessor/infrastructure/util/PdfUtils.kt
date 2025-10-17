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
            PDDocument.load(pdfBytes).use { document ->
                val stripper = PDFTextStripper()
                // Ensure proper encoding for Unicode characters including emojis
                stripper.sortByPosition = true
                val text = stripper.getText(document)

                if (text.isBlank()) {
                    throw EmptyContentException("PDF에서 텍스트를 추출할 수 없습니다.")
                }

                // Clean up any replacement characters that might have been introduced
                // but preserve actual content
                return text
            }
        } catch (e: EmptyContentException) {
            throw e
        } catch (e: Exception) {
            throw PdfProcessingException("PDF 텍스트 추출 중 오류가 발생했습니다.", e)
        }
    }

    /**
     * Replace emojis with empty string or fallback character
     * since most PDF fonts don't support emoji rendering
     */
    private fun sanitizeForPdf(text: String): String {
        // Remove emojis and other problematic Unicode characters
        // Keep Korean, English, numbers, and common punctuation
        return text.replace(Regex("[^\\p{L}\\p{N}\\p{P}\\p{Z}\\n\\r\\t]"), "")
    }

    fun markdownToPdf(markdown: String): ByteArray {
        if (markdown.isBlank()) {
            throw EmptyContentException("변환할 Markdown 내용이 비어있습니다.")
        }

        try {
            // Sanitize markdown content to remove emojis
            val sanitizedMarkdown = sanitizeForPdf(markdown)

            // Convert markdown to HTML
            val parser = Parser.builder().build()
            val renderer = HtmlRenderer.builder().build()
            val document = parser.parse(sanitizedMarkdown)
            val html = renderer.render(document)

            // Wrap HTML with proper structure and styling
            val styledHtml =
                """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8" />
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <style>
                        @font-face {
                            font-family: 'Emoji';
                            src: local('Apple Color Emoji'), local('Segoe UI Emoji'), local('Noto Color Emoji');
                        }
                        * {
                            box-sizing: border-box;
                        }
                        body {
                            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                            line-height: 1.8;
                            margin: 50px 60px;
                            color: #24292e;
                            font-size: 14px;
                            word-wrap: break-word;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            margin-top: 32px;
                            margin-bottom: 20px;
                            font-weight: 600;
                            line-height: 1.4;
                            color: #1a1a1a;
                        }
                        h1:first-child, h2:first-child, h3:first-child {
                            margin-top: 0;
                        }
                        h1 {
                            font-size: 2.2em;
                            border-bottom: 2px solid #e1e4e8;
                            padding-bottom: 0.4em;
                            margin-bottom: 24px;
                        }
                        h2 {
                            font-size: 1.8em;
                            border-bottom: 1px solid #e1e4e8;
                            padding-bottom: 0.35em;
                            margin-bottom: 20px;
                        }
                        h3 {
                            font-size: 1.4em;
                            margin-bottom: 16px;
                        }
                        h4 { font-size: 1.2em; }
                        h5 { font-size: 1.1em; }
                        h6 { font-size: 1em; color: #6a737d; }
                        p {
                            margin-top: 0;
                            margin-bottom: 16px;
                            text-align: justify;
                        }
                        strong, b {
                            font-weight: 700;
                            color: #1a1a1a;
                        }
                        em, i {
                            font-style: italic;
                        }
                        code {
                            background-color: rgba(27, 31, 35, 0.05);
                            padding: 3px 6px;
                            border-radius: 4px;
                            font-family: 'D2 Coding', 'Noto Sans KR', 'SFMono-Regular', Consolas, monospace;
                            font-size: 0.88em;
                            color: #24292e;
                            border: 1px solid rgba(27, 31, 35, 0.1);
                        }
                        pre {
                            background-color: #f6f8fa;
                            padding: 18px;
                            border-radius: 6px;
                            overflow-x: auto;
                            margin: 16px 0;
                            border: 1px solid #e1e4e8;
                            font-family: 'D2 Coding', 'Noto Sans KR', 'SFMono-Regular', Consolas, monospace;
                            font-size: 0.88em;
                            line-height: 1.6;
                        }
                        pre code {
                            background-color: transparent;
                            padding: 0;
                            border: none;
                            border-radius: 0;
                            font-size: 1em;
                        }
                        ul, ol {
                            margin-top: 0;
                            margin-bottom: 16px;
                            padding-left: 2em;
                        }
                        ul ul, ul ol, ol ol, ol ul {
                            margin-top: 8px;
                            margin-bottom: 8px;
                        }
                        li {
                            margin-bottom: 6px;
                            line-height: 1.7;
                        }
                        li > p {
                            margin-bottom: 8px;
                        }
                        blockquote {
                            border-left: 4px solid #dfe2e5;
                            padding: 8px 16px;
                            color: #6a737d;
                            margin: 16px 0;
                            background-color: #f6f8fa;
                            border-radius: 0 4px 4px 0;
                        }
                        blockquote > :first-child {
                            margin-top: 0;
                        }
                        blockquote > :last-child {
                            margin-bottom: 0;
                        }
                        table {
                            border-collapse: collapse;
                            width: 100%;
                            margin: 20px 0;
                            display: table;
                            overflow: auto;
                            border-spacing: 0;
                        }
                        table tr {
                            background-color: #ffffff;
                            border-top: 1px solid #d0d7de;
                        }
                        table tr:nth-child(2n) {
                            background-color: #f6f8fa;
                        }
                        th, td {
                            border: 1px solid #d0d7de;
                            padding: 10px 14px;
                            text-align: left;
                            vertical-align: top;
                        }
                        th {
                            background-color: #f6f8fa;
                            font-weight: 600;
                            color: #24292e;
                        }
                        hr {
                            height: 0.25em;
                            padding: 0;
                            margin: 24px 0;
                            background-color: #e1e4e8;
                            border: 0;
                        }
                        a {
                            color: #0366d6;
                            text-decoration: none;
                        }
                        a:hover {
                            text-decoration: underline;
                        }
                        img {
                            max-width: 100%;
                            box-sizing: content-box;
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

            // Load fonts from resources
            try {
                val classLoader = this.javaClass.classLoader

                // Load Noto Sans KR Regular font
                val regularFontStream = classLoader.getResourceAsStream("fonts/NotoSansKR-Regular.ttf")
                if (regularFontStream != null) {
                    builder.useFont({ regularFontStream }, "Noto Sans KR", 400, null, false)
                }

                // Load Noto Sans KR SemiBold font
                val semiBoldFontStream = classLoader.getResourceAsStream("fonts/NotoSansKR-SemiBold.ttf")
                if (semiBoldFontStream != null) {
                    builder.useFont({ semiBoldFontStream }, "Noto Sans KR", 600, null, false)
                }

                // Load D2 Coding Regular font
                val d2CodingFontStream = classLoader.getResourceAsStream("fonts/D2Coding-Ver1.3.2-20180524.ttf")
                if (d2CodingFontStream != null) {
                    builder.useFont({ d2CodingFontStream }, "D2 Coding", 400, null, false)
                }

                // Load D2 Coding Bold font
                val d2CodingBoldFontStream = classLoader.getResourceAsStream("fonts/D2CodingBold-Ver1.3.2-20180524.ttf")
                if (d2CodingBoldFontStream != null) {
                    builder.useFont({ d2CodingBoldFontStream }, "D2 Coding", 700, null, false)
                }
            } catch (e: Exception) {
                // If font loading fails, continue with default fonts
                // Korean characters may not render correctly
            }

            builder.useFastMode()
            // Use withHtmlContent with proper baseUri for UTF-8 content
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
