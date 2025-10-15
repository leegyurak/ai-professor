-- Migration to change from base64 storage to file path storage
ALTER TABLE document_history
    ADD COLUMN input_file_path VARCHAR(500) NULL AFTER user_prompt,
    ADD COLUMN output_file_path VARCHAR(500) NULL AFTER input_file_path;

-- Drop base64 columns as we now use file storage
ALTER TABLE document_history
    DROP COLUMN input_base64,
    DROP COLUMN output_base64;
