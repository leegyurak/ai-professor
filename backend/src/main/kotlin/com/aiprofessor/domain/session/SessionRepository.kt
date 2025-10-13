package com.aiprofessor.domain.session

interface SessionRepository {
    fun save(session: UserSession)

    fun findByUserId(userId: Long): List<UserSession>

    fun findByToken(token: String): UserSession?

    fun deleteByToken(token: String)

    fun countByUserIdAndIpAddress(
        userId: Long,
        ipAddress: String,
    ): Int

    fun countByUserIdAndMacAddress(
        userId: Long,
        macAddress: String,
    ): Int

    fun deleteOldestSession(userId: Long)
}
