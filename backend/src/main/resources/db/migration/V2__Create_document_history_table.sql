CREATE TABLE document_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    processing_type VARCHAR(50) NOT NULL,
    user_prompt TEXT,
    input_base64 LONGTEXT NOT NULL,
    output_base64 LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_document_history_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
