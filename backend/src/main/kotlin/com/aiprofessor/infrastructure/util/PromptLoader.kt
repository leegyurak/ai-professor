package com.aiprofessor.infrastructure.util

import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component

@Component
class PromptLoader {
    fun loadPrompt(filename: String): String {
        val resource = ClassPathResource("prompts/$filename")
        return resource.inputStream.bufferedReader().use { it.readText() }
    }
}
