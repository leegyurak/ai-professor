package com.aiprofessor

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.jdbc.core.JdbcTemplate
import javax.sql.DataSource

class TestContainersVerification : IntegrationTestBase() {
    @Autowired
    private lateinit var dataSource: DataSource

    @Test
    fun `should connect to database`() {
        val jdbcTemplate = JdbcTemplate(dataSource)
        val result = jdbcTemplate.queryForObject("SELECT 1", Int::class.java)
        assert(result == 1) { "Database connection failed" }
        println("✅ Successfully connected to database!")
    }
}
