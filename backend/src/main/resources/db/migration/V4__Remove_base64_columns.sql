-- Make file path columns NOT NULL now that we're fully migrated
ALTER TABLE document_history
    MODIFY COLUMN input_file_path VARCHAR(500) NOT NULL,
    MODIFY COLUMN output_file_path VARCHAR(500) NOT NULL;
