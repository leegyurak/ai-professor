package com.aiprofessor.infrastructure.claude

import com.aiprofessor.domain.exception.ClaudeApiException
import com.aiprofessor.domain.exception.ClaudeApiInvalidResponseException
import com.aiprofessor.domain.exception.ClaudeApiRateLimitException
import com.aiprofessor.domain.exception.ClaudeApiTimeoutException
import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.databind.ObjectMapper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.net.SocketTimeoutException
import java.util.concurrent.TimeUnit

@Component
open class ClaudeApiClient(
    @Value("\${claude.api.key}") private val apiKey: String,
    @Value("\${claude.api.url}") private val apiUrl: String = "https://api.anthropic.com/v1/messages",
    @Value("\${claude.api.model}") private val model: String = "claude-sonnet-4-5",
    @Value("\${claude.api.max-tokens}") private val maxTokens: Int = 64000,
    private val objectMapper: ObjectMapper = ObjectMapper(),
) {
    private val client =
        OkHttpClient
            .Builder()
            .connectTimeout(120, TimeUnit.SECONDS)
            .readTimeout(600, TimeUnit.SECONDS) // 10 minutes for large PDF processing
            .writeTimeout(120, TimeUnit.SECONDS)
            .build()

    /**
     * 2-Pass approach to avoid max token limits
     * Pass 1: Get outline/table of contents (300-600 tokens)
     * Pass 2+: Get detailed content for each section (no token limit per section)
     */
    open suspend fun sendMessageWithTwoPass(
        systemPrompt: String,
        userPrompt: String,
        pdfBase64: String,
    ): String =
        withContext(Dispatchers.IO) {
            try {
                // Pass 1: Get outline with limited tokens (300-600)
                val outlinePrompt =
                    """
                    $userPrompt

                    Please provide ONLY a concise outline or table of contents.
                    List the main sections/topics that should be covered.
                    Do NOT include detailed content yet.
                    Format as a numbered list of section titles.
                    """.trimIndent()

                val outline = sendMessageInternal(systemPrompt, outlinePrompt, pdfBase64, 600)

                // Parse sections from outline (assuming numbered list format)
                val sections = parseSectionsFromOutline(outline)

                if (sections.isEmpty()) {
                    // Fallback to single pass if outline parsing fails
                    return@withContext sendMessageInternal(systemPrompt, userPrompt, pdfBase64, maxTokens)
                }

                // Pass 2+: Get detailed content for each section
                val sectionContents = mutableListOf<String>()
                sectionContents.add("# Document Analysis\n\n")
                sectionContents.add("## Table of Contents\n$outline\n\n")

                for ((index, section) in sections.withIndex()) {
                    val sectionPrompt =
                        """
                        $userPrompt

                        Focus ONLY on this section: "$section"
                        Provide detailed analysis and content for this section only.
                        Section ${index + 1} of ${sections.size}.
                        """.trimIndent()

                    val sectionContent = sendMessageInternal(systemPrompt, sectionPrompt, pdfBase64, maxTokens)
                    sectionContents.add("## $section\n\n$sectionContent\n\n")
                }

                sectionContents.joinToString("\n")
            } catch (e: ClaudeApiException) {
                throw e
            } catch (e: ClaudeApiRateLimitException) {
                throw e
            } catch (e: ClaudeApiTimeoutException) {
                throw e
            } catch (e: ClaudeApiInvalidResponseException) {
                throw e
            } catch (e: Exception) {
                throw ClaudeApiException("Claude API 요청 중 예상치 못한 오류가 발생했습니다.", e)
            }
        }

    private fun parseSectionsFromOutline(outline: String): List<String> {
        // Parse numbered list (e.g., "1. Section Title", "2. Another Section")
        val sections = mutableListOf<String>()
        val lines = outline.lines()

        for (line in lines) {
            val trimmed = line.trim()
            // Match patterns like "1. Title", "1) Title", "- Title", "* Title"
            val sectionMatch = Regex("""^[\d\-*•]+[\.)]\s*(.+)$""").find(trimmed)
            if (sectionMatch != null) {
                sections.add(sectionMatch.groupValues[1].trim())
            } else if (trimmed.isNotEmpty() && !trimmed.startsWith("#")) {
                // Include non-empty lines that aren't headers
                sections.add(trimmed)
            }
        }

        return sections
    }

    /**
     * Legacy single-pass method for backward compatibility
     */
    open suspend fun sendMessage(
        systemPrompt: String,
        userPrompt: String,
        pdfBase64: String,
    ): String = sendMessageInternal(systemPrompt, userPrompt, pdfBase64, maxTokens)

    private suspend fun sendMessageInternal(
        systemPrompt: String,
        userPrompt: String,
        pdfBase64: String,
        tokenLimit: Int,
    ): String =
        withContext(Dispatchers.IO) {
            try {
                val request =
                    ClaudeRequest(
                        model = model,
                        maxTokens = tokenLimit,
                        system = systemPrompt,
                        messages =
                            listOf(
                                Message(
                                    role = "user",
                                    content =
                                        listOf(
                                            ContentBlock(
                                                type = "document",
                                                source =
                                                    DocumentSource(
                                                        type = "base64",
                                                        mediaType = "application/pdf",
                                                        data = pdfBase64,
                                                    ),
                                            ),
                                            ContentBlock(
                                                type = "text",
                                                text = userPrompt,
                                            ),
                                        ),
                                ),
                            ),
                    )

                val requestBody =
                    objectMapper
                        .writeValueAsString(request)
                        .toRequestBody("application/json".toMediaType())

                val httpRequest =
                    Request
                        .Builder()
                        .url(apiUrl)
                        .addHeader("x-api-key", apiKey)
                        .addHeader("anthropic-version", "2023-06-01")
                        .addHeader("content-type", "application/json")
                        .post(requestBody)
                        .build()

                val response =
                    try {
                        client.newCall(httpRequest).execute()
                    } catch (e: SocketTimeoutException) {
                        throw ClaudeApiTimeoutException()
                    } catch (e: Exception) {
                        throw ClaudeApiException("Claude API 연결 중 오류가 발생했습니다.", e)
                    }

                if (!response.isSuccessful) {
                    val errorBody = response.body?.string() ?: "No error details"
                    when (response.code) {
                        429 -> throw ClaudeApiRateLimitException()
                        408, 504 -> throw ClaudeApiTimeoutException()
                        500, 502, 503 ->
                            throw ClaudeApiException(
                                "Claude API 서버 오류가 발생했습니다. (HTTP ${response.code})",
                            )
                        else ->
                            throw ClaudeApiException(
                                "Claude API 요청 실패: HTTP ${response.code} - $errorBody",
                            )
                    }
                }

                val responseBody =
                    response.body?.string()
                        ?: throw ClaudeApiInvalidResponseException("Claude API 응답이 비어있습니다.")

                val claudeResponse =
                    try {
                        objectMapper.readValue(responseBody, ClaudeResponse::class.java)
                    } catch (e: Exception) {
                        throw ClaudeApiInvalidResponseException("Claude API 응답을 파싱할 수 없습니다.", e)
                    }

                // Extract text content from response
                claudeResponse.content
                    .firstOrNull { it.type == "text" }
                    ?.text
                    ?.takeIf { it.isNotBlank() }
                    ?: throw ClaudeApiInvalidResponseException("Claude API 응답에 텍스트 내용이 없습니다.")
            } catch (e: ClaudeApiException) {
                throw e
            } catch (e: ClaudeApiRateLimitException) {
                throw e
            } catch (e: ClaudeApiTimeoutException) {
                throw e
            } catch (e: ClaudeApiInvalidResponseException) {
                throw e
            } catch (e: Exception) {
                throw ClaudeApiException("Claude API 요청 중 예상치 못한 오류가 발생했습니다.", e)
            }
        }
}

data class ClaudeRequest(
    val model: String,
    @JsonProperty("max_tokens")
    val maxTokens: Int,
    val system: String,
    val messages: List<Message>,
)

data class Message(
    val role: String,
    val content: List<ContentBlock>,
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class ContentBlock(
    val type: String,
    val source: DocumentSource? = null,
    val text: String? = null,
)

data class DocumentSource(
    val type: String,
    @JsonProperty("media_type")
    val mediaType: String,
    val data: String,
)

data class ClaudeResponse(
    val id: String,
    val type: String,
    val role: String,
    val content: List<ResponseContent>,
    val model: String,
    @JsonProperty("stop_reason")
    val stopReason: String,
)

data class ResponseContent(
    val type: String,
    val text: String?,
)
