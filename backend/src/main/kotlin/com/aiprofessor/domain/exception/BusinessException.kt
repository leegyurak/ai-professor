package com.aiprofessor.domain.exception

/**
 * Base exception for all business logic errors
 */
abstract class BusinessException(
    message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)

/**
 * Authentication and Authorization Exceptions
 */
class InvalidCredentialsException(
    message: String = "아이디 또는 비밀번호가 올바르지 않습니다.",
) : BusinessException(message)

class InvalidTokenException(
    message: String = "유효하지 않은 토큰입니다.",
) : BusinessException(message)

class ExpiredTokenException(
    message: String = "만료된 토큰입니다.",
) : BusinessException(message)

class UnauthorizedException(
    message: String = "인증이 필요합니다.",
) : BusinessException(message)

/**
 * Session Management Exceptions
 */
class MaxSessionsExceededException(
    message: String = "이미 다른 기기에서 로그인되어 있습니다. 다른 기기에서 로그아웃 후 다시 시도해주세요.",
) : BusinessException(message)

class SessionNotFoundException(
    message: String = "세션을 찾을 수 없습니다. 다시 로그인해주세요.",
) : BusinessException(message)

/**
 * User Management Exceptions
 */
class UserNotFoundException(
    message: String = "사용자를 찾을 수 없습니다.",
) : BusinessException(message)

class DuplicateUsernameException(
    username: String,
) : BusinessException("이미 사용 중인 아이디입니다: $username")

/**
 * Document Processing Exceptions
 */
class InvalidPdfException(
    message: String = "유효하지 않은 PDF 파일입니다.",
    cause: Throwable? = null,
) : BusinessException(message, cause)

class PdfSizeExceededException(
    message: String = "PDF 파일 크기가 최대 허용 크기(30MB)를 초과했습니다.",
) : BusinessException(message)

class PdfProcessingException(
    message: String = "PDF 처리 중 오류가 발생했습니다.",
    cause: Throwable? = null,
) : BusinessException(message, cause)

class MarkdownConversionException(
    message: String = "Markdown을 PDF로 변환하는 중 오류가 발생했습니다.",
    cause: Throwable? = null,
) : BusinessException(message, cause)

/**
 * Claude API Exceptions
 */
class ClaudeApiException(
    message: String = "Claude API 요청 중 오류가 발생했습니다.",
    cause: Throwable? = null,
) : BusinessException(message, cause)

class ClaudeApiRateLimitException(
    message: String = "Claude API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
) : BusinessException(message)

class ClaudeApiTimeoutException(
    message: String = "Claude API 요청 시간이 초과되었습니다. 다시 시도해주세요.",
) : BusinessException(message)

class ClaudeApiInvalidResponseException(
    message: String = "Claude API로부터 유효하지 않은 응답을 받았습니다.",
    cause: Throwable? = null,
) : BusinessException(message, cause)

/**
 * Validation Exceptions
 */
class InvalidInputException(
    message: String,
) : BusinessException(message)

class EmptyContentException(
    message: String = "내용이 비어있습니다.",
) : BusinessException(message)
