package com.aiprofessor.infrastructure.openai

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
open class OpenAiApiClient(
    @Value("\${openai.api.key}") private val apiKey: String,
    @Value("\${openai.api.url}") private val apiUrl: String = "https://api.openai.com/v1/responses",
    @Value("\${openai.api.model}") private val model: String = "gpt-5",
    @Value("\${openai.api.max-tokens}") private val maxTokens: Int = 128000,
    private val objectMapper: ObjectMapper = ObjectMapper(),
) {
    private val client =
        OkHttpClient
            .Builder()
            .connectTimeout(120, TimeUnit.SECONDS)
            .readTimeout(600, TimeUnit.SECONDS) // 10 minutes for large PDF processing
            .writeTimeout(120, TimeUnit.SECONDS)
            .build()

    open suspend fun sendMessage(
        systemPrompt: String,
        userPrompt: String,
        pdfBase64: String,
    ): String =
        withContext(Dispatchers.IO) {
            try {
                val input = mutableListOf<InputMessage>()

                // Add system message
                input.add(
                    InputMessage(
                        role = "system",
                        content =
                            listOf(
                                InputContent(
                                    type = "input_text",
                                    text = systemPrompt,
                                ),
                            ),
                    ),
                )

                // Add user message with PDF and text
                input.add(
                    InputMessage(
                        role = "user",
                        content =
                            listOf(
                                InputContent(
                                    type = "input_file",
                                    filename = "document.pdf",
                                    fileData = pdfBase64,
                                ),
                                InputContent(
                                    type = "input_text",
                                    text = userPrompt,
                                ),
                            ),
                    ),
                )

                val request =
                    OpenAiRequest(
                        model = model,
                        input = input,
                    )

                val requestBody =
                    objectMapper
                        .writeValueAsString(request)
                        .toRequestBody("application/json".toMediaType())

                val httpRequest =
                    Request
                        .Builder()
                        .url(apiUrl)
                        .addHeader("Authorization", "Bearer $apiKey")
                        .addHeader("Content-Type", "application/json")
                        .post(requestBody)
                        .build()

                val response =
                    try {
                        client.newCall(httpRequest).execute()
                    } catch (e: SocketTimeoutException) {
                        throw ClaudeApiTimeoutException()
                    } catch (e: Exception) {
                        throw ClaudeApiException("OpenAI API 연결 중 오류가 발생했습니다.", e)
                    }

                if (!response.isSuccessful) {
                    val errorBody = response.body?.string() ?: "No error details"
                    when (response.code) {
                        429 -> throw ClaudeApiRateLimitException()
                        408, 504 -> throw ClaudeApiTimeoutException()
                        500, 502, 503 ->
                            throw ClaudeApiException(
                                "OpenAI API 서버 오류가 발생했습니다. (HTTP ${response.code})",
                            )
                        else ->
                            throw ClaudeApiException(
                                "OpenAI API 요청 실패: HTTP ${response.code} - $errorBody",
                            )
                    }
                }

                val responseBody =
                    response.body?.string()
                        ?: throw ClaudeApiInvalidResponseException("OpenAI API 응답이 비어있습니다.")

                val openAiResponse =
                    try {
                        objectMapper.readValue(responseBody, OpenAiResponse::class.java)
                    } catch (e: Exception) {
                        throw ClaudeApiInvalidResponseException("OpenAI API 응답을 파싱할 수 없습니다.", e)
                    }

                val outputItem =
                    openAiResponse.output.firstOrNull()
                        ?: throw ClaudeApiInvalidResponseException("OpenAI API 응답에 출력이 없습니다.")

                // Extract and return text content
                outputItem.content.firstOrNull { it.type == "output_text" }?.text
                    ?.takeIf { it.isNotBlank() }
                    ?: throw ClaudeApiInvalidResponseException("OpenAI API 응답에 텍스트 내용이 없습니다.")
            } catch (e: ClaudeApiException) {
                throw e
            } catch (e: ClaudeApiRateLimitException) {
                throw e
            } catch (e: ClaudeApiTimeoutException) {
                throw e
            } catch (e: ClaudeApiInvalidResponseException) {
                throw e
            } catch (e: Exception) {
                throw ClaudeApiException("OpenAI API 요청 중 예상치 못한 오류가 발생했습니다.", e)
            }
        }
}

data class OpenAiRequest(
    val model: String,
    val input: List<InputMessage>,
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class InputMessage(
    val role: String,
    val content: List<InputContent>,
)

@JsonInclude(JsonInclude.Include.NON_NULL)
data class InputContent(
    val type: String,
    val filename: String? = null,
    @JsonProperty("file_data")
    val fileData: String? = null,
    val text: String? = null,
)

data class OpenAiResponse(
    val id: String,
    val model: String,
    val output: List<OutputItem>,
)

data class OutputItem(
    val role: String,
    val content: List<OutputContent>,
    @JsonProperty("finish_reason")
    val finishReason: String?,
)

data class OutputContent(
    val type: String,
    val text: String?,
)
