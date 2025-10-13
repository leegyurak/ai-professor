package com.aiprofessor.domain.session

data class UserSession(
    val userId: Long,
    val token: String,
    val ipAddress: String,
    val macAddress: String,
    val createdAt: Long = System.currentTimeMillis(),
)
