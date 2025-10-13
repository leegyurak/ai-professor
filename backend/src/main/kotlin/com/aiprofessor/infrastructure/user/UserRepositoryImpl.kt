package com.aiprofessor.infrastructure.user

import com.aiprofessor.domain.user.User
import com.aiprofessor.domain.user.UserRepository
import org.springframework.stereotype.Repository

@Repository
class UserRepositoryImpl(
    private val jpaUserRepository: JpaUserRepository,
) : UserRepository {
    override fun save(user: User): User = jpaUserRepository.save(user)

    override fun findByUsername(username: String): User? = jpaUserRepository.findByUsername(username)

    override fun findById(id: Long): User? = jpaUserRepository.findById(id).orElse(null)

    override fun existsByUsername(username: String): Boolean = jpaUserRepository.existsByUsername(username)
}
