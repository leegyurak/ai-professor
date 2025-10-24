-- Create user_mock_interviews table
CREATE TABLE user_mock_interviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_interview_id BIGINT NOT NULL,
    resume_file_path VARCHAR(500) NOT NULL,
    question_file_path VARCHAR(500) NOT NULL,
    grading_file_path VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_mock_interviews_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_mock_interviews_user_interview_id FOREIGN KEY (user_interview_id) REFERENCES user_interviews(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_user_interview_id (user_interview_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
