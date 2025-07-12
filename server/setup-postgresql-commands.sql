-- WorkBeat PostgreSQL Setup Commands
-- Run these commands in pgAdmin or psql

-- 1. Create WorkBeat user
CREATE USER workbeat_user WITH PASSWORD 'legend';

-- 2. Create WorkBeat database
CREATE DATABASE workbeat_dev OWNER workbeat_user;

-- 3. Grant privileges
GRANT ALL PRIVILEGES ON DATABASE workbeat_dev TO workbeat_user;

-- 4. Verify setup
SELECT usename FROM pg_user WHERE usename = 'workbeat_user';
SELECT datname FROM pg_database WHERE datname = 'workbeat_dev';

-- 5. Test connection (optional)
-- \c workbeat_dev workbeat_user