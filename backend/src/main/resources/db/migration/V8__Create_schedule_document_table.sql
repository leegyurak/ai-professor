-- Create schedule_document table
CREATE TABLE schedule_document (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_schedule_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    count INT NOT NULL,
    input_file_path VARCHAR(500) NOT NULL,
    output_file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_schedule_document_user_schedule_id FOREIGN KEY (user_schedule_id) REFERENCES user_schedules(id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_document_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_schedule_id (user_schedule_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
