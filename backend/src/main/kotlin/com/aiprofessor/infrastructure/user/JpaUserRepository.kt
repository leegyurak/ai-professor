package com.aiprofessor.infrastructure.user

import com.aiprofessor.domain.user.User
import org.springframework.data.jpa.repository.JpaRepository

interface JpaUserRepository : JpaRepository<User, Long> {
    fun findByUsername(username: String): User?

    fun existsByUsername(username: String): Boolean
}
