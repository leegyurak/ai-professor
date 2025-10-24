package com.aiprofessor.domain.interview

import java.time.LocalDate

interface InterviewService {
    fun createInterview(
        userId: Long,
        interviewDate: LocalDate,
        interviewType: String,
        announcementUrl: String,
    ): UserInterview

    fun getInterviewById(
        id: Long,
        userId: Long,
    ): UserInterview

    fun getAllInterviewsByUser(userId: Long): List<UserInterview>

    fun updateInterview(
        id: Long,
        userId: Long,
        interviewDate: LocalDate?,
        interviewType: String?,
        announcementUrl: String?,
    ): UserInterview

    fun deleteInterview(
        id: Long,
        userId: Long,
    )

    suspend fun createMockInterview(
        userId: Long,
        userInterviewId: Long,
        resumeBase64: String,
    ): MockInterviewResponse

    fun getMockInterviewById(
        id: Long,
        userId: Long,
    ): UserMockInterview

    fun getAllMockInterviewsByUser(userId: Long): List<UserMockInterview>

    fun getAllMockInterviewsByInterview(userInterviewId: Long): List<UserMockInterview>

    fun deleteMockInterview(
        id: Long,
        userId: Long,
    )

    suspend fun gradeMockInterview(
        mockInterviewId: Long,
        userId: Long,
        answers: String,
    ): GradingResponse
}

data class MockInterviewResponse(
    val mockInterviewId: Long,
    val questionMarkdown: String,
)

data class GradingResponse(
    val gradingMarkdown: String,
)
