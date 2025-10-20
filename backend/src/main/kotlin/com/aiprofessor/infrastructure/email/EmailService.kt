package com.aiprofessor.infrastructure.email

interface EmailService {
    fun sendVerificationEmail(
        toEmail: String,
        username: String,
        verificationToken: String,
    )
}
