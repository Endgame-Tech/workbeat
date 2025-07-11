-- Test WorkBeat Database Connection
-- Run this in Windows Command Prompt

-- Connect to workbeat_dev as workbeat_user
\c workbeat_dev workbeat_user

-- Test basic operations
SELECT current_database(), current_user, version();

-- Create a test table to verify permissions
CREATE TABLE test_table (id SERIAL PRIMARY KEY, name VARCHAR(50));
INSERT INTO test_table (name) VALUES ('test');
SELECT * FROM test_table;
DROP TABLE test_table;

-- Show we're ready for Prisma
SELECT 'PostgreSQL is ready for WorkBeat!' as status;