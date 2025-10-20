package com.aiprofessor.infrastructure.email

import jakarta.mail.internet.MimeMessage
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.mail.javamail.JavaMailSender
import org.springframework.mail.javamail.MimeMessageHelper
import org.springframework.stereotype.Service

@Service
class GmailEmailService(
    private val mailSender: JavaMailSender,
    @Value("\${mail.from.address:\${spring.mail.username}}") private val fromEmail: String,
    @Value("\${app.name:AI Professor}") private val appName: String,
    @Value("\${app.frontend-url:http://localhost:5173}") private val frontendUrl: String,
) : EmailService {
    private val logger = LoggerFactory.getLogger(GmailEmailService::class.java)

    override fun sendVerificationEmail(
        toEmail: String,
        username: String,
        verificationToken: String,
    ) {
        val verificationLink = "$frontendUrl/verify?token=$verificationToken"
        val currentYear = java.time.Year.now().value

        val htmlContent =
            """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                        line-height: 1.6;
                        color: #000000;
                        background-color: #f5f5f5;
                        -webkit-font-smoothing: antialiased;
                        -moz-osx-font-smoothing: grayscale;
                        padding: 40px 20px;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
                    }
                    .header {
                        background-color: #ffffff;
                        padding: 40px 32px 24px;
                        text-align: center;
                        border-bottom: 1px solid #e0e0e0;
                    }
                    .header h1 {
                        font-size: 22px;
                        font-weight: 700;
                        color: #000000;
                        letter-spacing: -0.02em;
                        margin-bottom: 8px;
                    }
                    .emoji {
                        font-size: 48px;
                        margin-bottom: 16px;
                        display: block;
                    }
                    .content {
                        padding: 32px;
                        background-color: #ffffff;
                    }
                    .greeting {
                        font-size: 18px;
                        font-weight: 600;
                        color: #000000;
                        margin-bottom: 16px;
                    }
                    .message {
                        font-size: 14px;
                        color: #333333;
                        line-height: 1.6;
                        margin-bottom: 16px;
                    }
                    .button-container {
                        text-align: center;
                        margin: 32px 0;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #000000;
                        color: #ffffff !important;
                        text-decoration: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.15s ease;
                    }
                    .button:hover {
                        background-color: #333333;
                        transform: translateY(-1px);
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
                    }
                    .divider {
                        margin: 24px 0;
                        text-align: center;
                        color: #666666;
                        font-size: 13px;
                        position: relative;
                    }
                    .divider::before,
                    .divider::after {
                        content: '';
                        position: absolute;
                        top: 50%;
                        width: 40%;
                        height: 1px;
                        background-color: #e0e0e0;
                    }
                    .divider::before { left: 0; }
                    .divider::after { right: 0; }
                    .link-box {
                        background-color: #f5f5f5;
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        padding: 16px;
                        margin: 16px 0;
                    }
                    .link-box p {
                        font-size: 13px;
                        color: #666666;
                        margin-bottom: 8px;
                    }
                    .link-text {
                        font-size: 12px;
                        color: #000000;
                        word-break: break-all;
                        font-family: 'Courier New', monospace;
                        background-color: #ffffff;
                        padding: 8px;
                        border-radius: 4px;
                        border: 1px solid #e0e0e0;
                    }
                    .footer {
                        background-color: #fafafa;
                        padding: 24px 32px;
                        text-align: center;
                        border-top: 1px solid #e0e0e0;
                    }
                    .footer p {
                        font-size: 13px;
                        color: #666666;
                        margin-bottom: 8px;
                    }
                    @media (max-width: 600px) {
                        body { padding: 20px 10px; }
                        .content { padding: 24px 20px; }
                        .header { padding: 32px 20px 20px; }
                        .footer { padding: 20px 16px; }
                        .button { padding: 10px 20px; font-size: 13px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <span class="emoji">🎓</span>
                        <h1>$appName 이메일 인증</h1>
                    </div>
                    <div class="content">
                        <div class="greeting">안녕하세요, ${username}님!</div>
                        <p class="message">
                            ${appName}에 가입해 주셔서 감사합니다. 🙌<br>
                            아래 버튼을 클릭하여 이메일 주소를 인증하고 모든 기능을 사용해보세요.
                        </p>
                        <div class="button-container">
                            <a href="$verificationLink" class="button">✉️ 이메일 인증하기</a>
                        </div>
                        <div class="divider">또는</div>
                        <div class="link-box">
                            <p>아래 링크를 브라우저에 복사하여 붙여넣으세요:</p>
                            <div class="link-text">$verificationLink</div>
                        </div>
                        <p class="message" style="margin-top: 24px; font-size: 13px; color: #666666;">
                            💡 본인이 요청하지 않은 경우 이 이메일을 무시하셔도 됩니다.
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; $currentYear $appName. All rights reserved.</p>
                        <p style="margin-top: 8px;">교육 자료 요약 및 문제 생성</p>
                    </div>
                </div>
            </body>
            </html>
            """.trimIndent()

        try {
            val message: MimeMessage = mailSender.createMimeMessage()
            val helper = MimeMessageHelper(message, true, "UTF-8")

            helper.setFrom(fromEmail, appName)
            helper.setTo(toEmail)
            helper.setSubject("$appName 이메일 인증")
            helper.setText(htmlContent, true)

            mailSender.send(message)
            logger.info("Verification email sent to $toEmail via Gmail SMTP")
        } catch (e: Exception) {
            logger.error("Failed to send verification email to $toEmail via Gmail SMTP", e)
            throw RuntimeException("이메일 전송에 실패했습니다", e)
        }
    }
}
