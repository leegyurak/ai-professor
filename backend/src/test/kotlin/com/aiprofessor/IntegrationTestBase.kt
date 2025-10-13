package com.aiprofessor

import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.MySQLContainer
import org.testcontainers.utility.DockerImageName

@SpringBootTest
@ActiveProfiles("test")
abstract class IntegrationTestBase {
    companion object {
        private val mysqlContainer: MySQLContainer<*> =
            MySQLContainer(DockerImageName.parse("mysql:8.0"))
                .withDatabaseName("aiprofessor_test")
                .withUsername("test")
                .withPassword("test")
                .apply {
                    start()
                }

        private val redisContainer: GenericContainer<*> =
            GenericContainer(DockerImageName.parse("redis:7-alpine"))
                .withExposedPorts(6379)
                .apply {
                    start()
                }

        @JvmStatic
        @DynamicPropertySource
        fun properties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", mysqlContainer::getJdbcUrl)
            registry.add("spring.datasource.username", mysqlContainer::getUsername)
            registry.add("spring.datasource.password", mysqlContainer::getPassword)

            registry.add("spring.data.redis.host", redisContainer::getHost)
            registry.add("spring.data.redis.port") { redisContainer.getMappedPort(6379) }
        }
    }
}
