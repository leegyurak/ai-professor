package com.aiprofessor.infrastructure.config

import com.aiprofessor.domain.user.User
import com.aiprofessor.domain.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.context.annotation.Profile
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component

@Component
@Profile("dev")
class DevDataLoader(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
) : ApplicationRunner {
    private val logger = LoggerFactory.getLogger(javaClass)

    override fun run(args: ApplicationArguments?) {
        // Check if test user already exists
        if (userRepository.existsByUsername("testuser")) {
            logger.info("Test user already exists, skipping creation")
            return
        }

        // Create test user
        val testUser =
            User(
                username = "testuser",
                password = passwordEncoder.encode("test1234"),
                email = "test@example.com",
            )

        userRepository.save(testUser)
        logger.info("✅ Test user created successfully!")
        logger.info("   Username: testuser")
        logger.info("   Password: test1234")
        logger.info("   Email: test@example.com")
    }
}
