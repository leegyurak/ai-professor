package com.aiprofessor.infrastructure.config

import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder

@Configuration
class JacksonConfig {
    @Bean
    @Primary
    fun objectMapper(builder: Jackson2ObjectMapperBuilder): ObjectMapper {
        val mapper = builder.build<ObjectMapper>()

        // Set stream read constraints for large PDF base64 strings
        val factory = mapper.factory
        val constraints =
            factory
                .streamReadConstraints()
                .rebuild()
                .maxStringLength(100_000_000) // 100MB
                .build()

        factory.setStreamReadConstraints(constraints)

        return mapper
    }
}
