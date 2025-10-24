package com.aiprofessor.domain.exception

class InterviewNotFoundException(message: String) : RuntimeException(message)

class MockInterviewNotFoundException(message: String) : RuntimeException(message)

class UnauthorizedInterviewAccessException(message: String) : RuntimeException(message)

class InvalidAnnouncementUrlException(message: String) : RuntimeException(message)

class ResumeProcessingException(message: String, cause: Throwable? = null) : RuntimeException(message, cause)

class GradingNotAvailableException(message: String) : RuntimeException(message)
