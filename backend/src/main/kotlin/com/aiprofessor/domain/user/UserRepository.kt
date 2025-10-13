package com.aiprofessor.domain.user

interface UserRepository {
    fun save(user: User): User

    fun findByUsername(username: String): User?

    fun findById(id: Long): User?

    fun existsByUsername(username: String): Boolean
}
