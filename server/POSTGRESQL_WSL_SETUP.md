# PostgreSQL WSL Connection Setup

## Issue
WSL cannot connect to PostgreSQL running on Windows host.

## Solution Options

### Option 1: Configure PostgreSQL for WSL Access

1. **Edit postgresql.conf**
   - Location: `C:\Program Files\PostgreSQL\17\data\postgresql.conf`
   - Find line: `#listen_addresses = 'localhost'`
   - Change to: `listen_addresses = '*'`

2. **Edit pg_hba.conf**
   - Location: `C:\Program Files\PostgreSQL\17\data\pg_hba.conf`
   - Add line: `host all all 172.16.0.0/12 md5`
   - This allows WSL subnet access

3. **Restart PostgreSQL**
   ```cmd
   net stop postgresql-x64-17
   net start postgresql-x64-17
   ```

### Option 2: Use Windows IP Address

1. **Find Windows IP from WSL**
   ```bash
   cat /etc/resolv.conf | grep nameserver | awk '{print $2}'
   ```

2. **Update connection host**
   - Use the IP address instead of localhost
   - Example: `172.20.144.1` (varies by system)

### Option 3: Use Docker PostgreSQL (Alternative)

1. **Install Docker Desktop**
2. **Run PostgreSQL in Docker**
   ```bash
   docker run --name workbeat-postgres \
     -e POSTGRES_PASSWORD=legend \
     -e POSTGRES_USER=workbeat_user \
     -e POSTGRES_DB=workbeat_dev \
     -p 5432:5432 \
     -d postgres:15
   ```

## Current Status
- ✅ PostgreSQL installed on Windows
- ✅ Database `workbeat_dev` created
- ✅ User `workbeat_user` created
- ❌ WSL connection blocked

## Next Steps
1. Try Option 1 (configure PostgreSQL)
2. If that fails, use Option 2 (Windows IP)
3. If needed, fall back to Option 3 (Docker)

## Test Connection
After configuration, test with:
```bash
node scripts/test-postgres-connection.js
```