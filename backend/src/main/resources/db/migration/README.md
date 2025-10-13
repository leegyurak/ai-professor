# Database Migrations

This directory contains Flyway database migration scripts.

## Naming Convention

Migration files must follow this naming pattern:
```
V{version}__{description}.sql
```

Examples:
- `V1__Create_users_table.sql`
- `V2__Add_email_index.sql`
- `V3__Create_documents_table.sql`

## Version Numbers

- Use sequential integers (V1, V2, V3, etc.)
- Never modify an already applied migration
- To fix an error in a migration, create a new migration

## Best Practices

1. **Keep migrations small and focused**
   - One migration = one logical change
   - Makes it easier to track changes and rollback if needed

2. **Test migrations before committing**
   - Test on local database
   - Verify with `./gradlew flywayInfo` and `./gradlew flywayValidate`

3. **Never modify applied migrations**
   - Once a migration is committed and applied, it should never be changed
   - Create a new migration to fix issues

4. **Use descriptive names**
   - Good: `V2__Add_user_status_column.sql`
   - Bad: `V2__Update.sql`

## Flyway Commands

```bash
# Check migration status
./gradlew flywayInfo

# Validate migrations
./gradlew flywayValidate

# Apply migrations
./gradlew flywayMigrate

# Clean database (WARNING: Deletes all data)
./gradlew flywayClean
```

## Migration Examples

### Creating a table
```sql
CREATE TABLE example (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Adding a column
```sql
ALTER TABLE users
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
```

### Creating an index
```sql
CREATE INDEX idx_users_email ON users(email);
```

### Inserting seed data
```sql
INSERT INTO users (username, password, email)
VALUES ('admin', '$2a$10$...', 'admin@example.com');
```
