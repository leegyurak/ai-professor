package com.aiprofessor.application.auth

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.Date
import javax.crypto.SecretKey

@Service
class JwtService(
    @Value("\${jwt.secret}") private val secret: String,
    @Value("\${jwt.expiration}") private val expiration: Long,
) {
    private val secretKey: SecretKey by lazy {
        Keys.hmacShaKeyFor(secret.toByteArray())
    }

    fun generateToken(
        userId: Long,
        username: String,
    ): String =
        Jwts
            .builder()
            .subject(userId.toString())
            .claim("username", username)
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + expiration))
            .signWith(secretKey)
            .compact()

    fun validateToken(token: String): Boolean =
        try {
            Jwts
                .parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
            true
        } catch (e: Exception) {
            false
        }

    fun getUserIdFromToken(token: String): Long? =
        try {
            val claims = getClaims(token)
            claims.subject.toLong()
        } catch (e: Exception) {
            null
        }

    fun getUsernameFromToken(token: String): String? =
        try {
            val claims = getClaims(token)
            claims["username"] as? String
        } catch (e: Exception) {
            null
        }

    private fun getClaims(token: String): Claims =
        Jwts
            .parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .payload
}
