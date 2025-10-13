package com.aiprofessor.infrastructure.document

import com.aiprofessor.domain.document.DocumentHistory
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Service
import java.util.concurrent.TimeUnit

@Service
class DocumentHistoryCacheService(
    @Qualifier("cacheRedisTemplate")
    private val cacheRedisTemplate: RedisTemplate<String, Any>,
    private val objectMapper: ObjectMapper,
) {
    companion object {
        private const val CACHE_KEY_PREFIX = "document:history:"
        private const val CACHE_TTL_HOURS = 24L
        private const val MAX_CACHED_ITEMS = 20
    }

    private fun getCacheKey(userId: Long): String = "$CACHE_KEY_PREFIX$userId"

    fun getCachedHistory(userId: Long): List<DocumentHistory>? {
        val key = getCacheKey(userId)
        val cachedData = cacheRedisTemplate.opsForValue().get(key) ?: return null

        return try {
            @Suppress("UNCHECKED_CAST")
            when (cachedData) {
                is List<*> -> {
                    cachedData.map { item ->
                        when (item) {
                            is DocumentHistory -> item
                            is Map<*, *> -> objectMapper.convertValue(item, DocumentHistory::class.java)
                            else -> throw IllegalStateException("Unexpected cached data type: ${item?.javaClass}")
                        }
                    }
                }
                else -> null
            }
        } catch (e: Exception) {
            null
        }
    }

    fun cacheHistory(
        userId: Long,
        history: List<DocumentHistory>,
    ) {
        val key = getCacheKey(userId)
        val dataToCache = history.take(MAX_CACHED_ITEMS)

        cacheRedisTemplate.opsForValue().set(
            key,
            dataToCache,
            CACHE_TTL_HOURS,
            TimeUnit.HOURS,
        )
    }

    fun invalidateCache(userId: Long) {
        val key = getCacheKey(userId)
        cacheRedisTemplate.delete(key)
    }
}
