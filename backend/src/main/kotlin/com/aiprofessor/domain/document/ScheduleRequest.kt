package com.aiprofessor.domain.document

data class ScheduleRequest(
    val userId: Long,
    val userScheduleId: Long,
    val fileBase64: String,
)
