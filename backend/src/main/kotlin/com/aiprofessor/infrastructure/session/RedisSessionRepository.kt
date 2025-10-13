package com.aiprofessor.infrastructure.session

import com.aiprofessor.domain.session.SessionRepository
import com.aiprofessor.domain.session.UserSession
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.stereotype.Repository
import java.util.concurrent.TimeUnit

@Repository
class RedisSessionRepository(
    private val redisTemplate: RedisTemplate<String, String>,
    private val objectMapper: ObjectMapper,
) : SessionRepository {
    companion object {
        private const val SESSION_PREFIX = "session:"
        private const val USER_SESSIONS_PREFIX = "user:sessions:"
        private const val SESSION_EXPIRATION_HOURS = 24L
    }

    override fun save(session: UserSession) {
        val sessionKey = SESSION_PREFIX + session.token
        val userSessionsKey = USER_SESSIONS_PREFIX + session.userId

        // Save session
        redisTemplate
            .opsForValue()
            .set(
                sessionKey,
                objectMapper.writeValueAsString(session),
                SESSION_EXPIRATION_HOURS,
                TimeUnit.HOURS,
            )

        // Add to user's sessions set
        redisTemplate.opsForSet().add(userSessionsKey, session.token)
        redisTemplate.expire(userSessionsKey, SESSION_EXPIRATION_HOURS, TimeUnit.HOURS)
    }

    override fun findByUserId(userId: Long): List<UserSession> {
        val userSessionsKey = USER_SESSIONS_PREFIX + userId
        val tokens = redisTemplate.opsForSet().members(userSessionsKey) ?: emptySet()

        return tokens.mapNotNull { token ->
            findByToken(token)
        }
    }

    override fun findByToken(token: String): UserSession? {
        val sessionKey = SESSION_PREFIX + token
        val sessionJson = redisTemplate.opsForValue().get(sessionKey) ?: return null
        return objectMapper.readValue(sessionJson, UserSession::class.java)
    }

    override fun deleteByToken(token: String) {
        val session = findByToken(token) ?: return
        val sessionKey = SESSION_PREFIX + token
        val userSessionsKey = USER_SESSIONS_PREFIX + session.userId

        redisTemplate.delete(sessionKey)
        redisTemplate.opsForSet().remove(userSessionsKey, token)
    }

    override fun countByUserIdAndIpAddress(
        userId: Long,
        ipAddress: String,
    ): Int {
        val sessions = findByUserId(userId)
        return sessions.count { it.ipAddress == ipAddress }
    }

    override fun countByUserIdAndMacAddress(
        userId: Long,
        macAddress: String,
    ): Int {
        val sessions = findByUserId(userId)
        return sessions.count { it.macAddress == macAddress }
    }

    override fun deleteOldestSession(userId: Long) {
        val sessions = findByUserId(userId)
        if (sessions.isEmpty()) return

        val oldestSession = sessions.minByOrNull { it.createdAt } ?: return
        deleteByToken(oldestSession.token)
    }
}
