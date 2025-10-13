package com.aiprofessor.infrastructure.document

import com.aiprofessor.domain.document.DocumentHistory
import com.aiprofessor.domain.document.ProcessingType
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.core.ValueOperations
import java.time.LocalDateTime
import java.util.concurrent.TimeUnit

class DocumentHistoryCacheServiceTest {
    private lateinit var cacheService: DocumentHistoryCacheService
    private lateinit var cacheRedisTemplate: RedisTemplate<String, Any>
    private lateinit var valueOperations: ValueOperations<String, Any>
    private lateinit var objectMapper: ObjectMapper

    @BeforeEach
    fun setup() {
        cacheRedisTemplate = mockk(relaxed = true)
        valueOperations = mockk(relaxed = true)
        objectMapper =
            ObjectMapper()
                .registerKotlinModule()
                .registerModule(JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)

        every { cacheRedisTemplate.opsForValue() } returns valueOperations

        cacheService = DocumentHistoryCacheService(cacheRedisTemplate, objectMapper)
    }

    private val testUserId = 1L

    @Test
    fun `should cache and retrieve document history`() {
        // Given
        val history =
            listOf(
                DocumentHistory(
                    id = 1L,
                    userId = testUserId,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test prompt",
                    inputBase64 = "input1",
                    outputBase64 = "output1",
                    createdAt = LocalDateTime.now(),
                ),
                DocumentHistory(
                    id = 2L,
                    userId = testUserId,
                    processingType = ProcessingType.EXAM_QUESTIONS,
                    userPrompt = "Test prompt 2",
                    inputBase64 = "input2",
                    outputBase64 = "output2",
                    createdAt = LocalDateTime.now(),
                ),
            )

        // When
        cacheService.cacheHistory(testUserId, history)

        // Mock the retrieval
        every { valueOperations.get("document:history:$testUserId") } returns history

        val cachedHistory = cacheService.getCachedHistory(testUserId)

        // Then
        verify { valueOperations.set("document:history:$testUserId", history, 24L, TimeUnit.HOURS) }
        assertNotNull(cachedHistory)
        assertEquals(2, cachedHistory!!.size)
        assertEquals(1L, cachedHistory[0].id)
        assertEquals(ProcessingType.SUMMARY, cachedHistory[0].processingType)
        assertEquals(2L, cachedHistory[1].id)
        assertEquals(ProcessingType.EXAM_QUESTIONS, cachedHistory[1].processingType)
    }

    @Test
    fun `should return null when cache does not exist`() {
        // Given
        every { valueOperations.get("document:history:$testUserId") } returns null

        // When
        val cachedHistory = cacheService.getCachedHistory(testUserId)

        // Then
        assertNull(cachedHistory)
    }

    @Test
    fun `should cache only first 20 items`() {
        // Given
        val history =
            (1..25).map { i ->
                DocumentHistory(
                    id = i.toLong(),
                    userId = testUserId,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test prompt $i",
                    inputBase64 = "input$i",
                    outputBase64 = "output$i",
                    createdAt = LocalDateTime.now(),
                )
            }

        // When
        cacheService.cacheHistory(testUserId, history)

        // Mock the retrieval with first 20 items
        val first20 = history.take(20)
        every { valueOperations.get("document:history:$testUserId") } returns first20

        val cachedHistory = cacheService.getCachedHistory(testUserId)

        // Then
        verify { valueOperations.set("document:history:$testUserId", first20, 24L, TimeUnit.HOURS) }
        assertNotNull(cachedHistory)
        assertEquals(20, cachedHistory!!.size)
        assertEquals(1L, cachedHistory[0].id)
        assertEquals(20L, cachedHistory[19].id)
    }

    @Test
    fun `should invalidate cache`() {
        // Given
        val history =
            listOf(
                DocumentHistory(
                    id = 1L,
                    userId = testUserId,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "Test prompt",
                    inputBase64 = "input1",
                    outputBase64 = "output1",
                    createdAt = LocalDateTime.now(),
                ),
            )
        cacheService.cacheHistory(testUserId, history)

        // When
        cacheService.invalidateCache(testUserId)

        // Mock that cache is now empty
        every { valueOperations.get("document:history:$testUserId") } returns null

        val cachedHistory = cacheService.getCachedHistory(testUserId)

        // Then
        verify { cacheRedisTemplate.delete("document:history:$testUserId") }
        assertNull(cachedHistory)
    }

    @Test
    fun `should handle different user caches independently`() {
        // Given
        val user1Id = 1L
        val user2Id = 2L

        val user1History =
            listOf(
                DocumentHistory(
                    id = 1L,
                    userId = user1Id,
                    processingType = ProcessingType.SUMMARY,
                    userPrompt = "User 1 prompt",
                    inputBase64 = "input1",
                    outputBase64 = "output1",
                    createdAt = LocalDateTime.now(),
                ),
            )

        val user2History =
            listOf(
                DocumentHistory(
                    id = 2L,
                    userId = user2Id,
                    processingType = ProcessingType.EXAM_QUESTIONS,
                    userPrompt = "User 2 prompt",
                    inputBase64 = "input2",
                    outputBase64 = "output2",
                    createdAt = LocalDateTime.now(),
                ),
            )

        // When
        cacheService.cacheHistory(user1Id, user1History)
        cacheService.cacheHistory(user2Id, user2History)

        // Mock the retrieval for different users
        every { valueOperations.get("document:history:$user1Id") } returns user1History
        every { valueOperations.get("document:history:$user2Id") } returns user2History

        val cachedUser1 = cacheService.getCachedHistory(user1Id)
        val cachedUser2 = cacheService.getCachedHistory(user2Id)

        // Then
        assertNotNull(cachedUser1)
        assertNotNull(cachedUser2)
        assertEquals(1L, cachedUser1!![0].id)
        assertEquals(2L, cachedUser2!![0].id)
    }
}
