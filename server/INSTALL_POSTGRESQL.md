# PostgreSQL Installation Guide for WorkBeat

## 🎯 **Quick Installation Options**

### **Option 1: Windows Native Installation (Recommended)**

1. **Download PostgreSQL for Windows:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the latest version (15.x or 16.x)
   - Run the installer as Administrator

2. **Installation Settings:**
   ```
   Port: 5432 (default)
   Superuser: postgres
   Password: [choose a strong password - remember this!]
   Locale: Default
   ```

3. **Verify Installation:**
   ```cmd
   # Open Command Prompt or PowerShell
   psql --version
   ```

### **Option 2: WSL Ubuntu Installation**

1. **Open WSL Terminal and run:**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **Set up PostgreSQL:**
   ```bash
   sudo -u postgres psql
   ```

### **Option 3: Docker Installation (Alternative)**

1. **Install Docker Desktop for Windows**

2. **Run PostgreSQL Container:**
   ```bash
   docker run --name workbeat-postgres \
     -e POSTGRES_PASSWORD=workbeat123 \
     -e POSTGRES_USER=workbeat_user \
     -e POSTGRES_DB=workbeat_db \
     -p 5432:5432 \
     -d postgres:15
   ```

---

## 🔧 **Setup Instructions**

### **After Installing PostgreSQL:**

1. **Create Database and User:**

   **Windows (pgAdmin or psql):**
   ```sql
   -- Connect as postgres user
   CREATE USER workbeat_user WITH PASSWORD 'workbeat_secure_password_123';
   CREATE DATABASE workbeat_dev OWNER workbeat_user;
   CREATE DATABASE workbeat_prod OWNER workbeat_user;
   GRANT ALL PRIVILEGES ON DATABASE workbeat_dev TO workbeat_user;
   GRANT ALL PRIVILEGES ON DATABASE workbeat_prod TO workbeat_user;
   ```

   **WSL/Linux:**
   ```bash
   sudo -u postgres createuser --interactive workbeat_user
   sudo -u postgres createdb workbeat_dev
   sudo -u postgres createdb workbeat_prod
   ```

2. **Test Connection:**
   ```bash
   psql -h localhost -U workbeat_user -d workbeat_dev
   # Enter password when prompted
   ```

---

## 📝 **Environment Configuration**

After PostgreSQL is installed, update your environment files:

### **Create `.env.local` (for local PostgreSQL testing):**
```env
NODE_ENV=development
DATABASE_URL="postgresql://workbeat_user:workbeat_secure_password_123@localhost:5432/workbeat_dev?schema=public"
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=workbeat_user
POSTGRES_PASSWORD=workbeat_secure_password_123
POSTGRES_DB=workbeat_dev
POSTGRES_SSL=false

# Database Pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_IDLE_TIMEOUT=30000
DATABASE_POOL_CONNECTION_TIMEOUT=10000

# Use your existing JWT secret or generate a new one
JWT_SECRET=your_existing_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

---

## 🚀 **Quick Start Commands**

Once PostgreSQL is installed, run these commands in your WorkBeat server directory:

```bash
# 1. Test PostgreSQL connection
node scripts/test-database.js

# 2. Set up database schema
NODE_ENV=local npx prisma migrate deploy

# 3. Migrate your existing SQLite data
node scripts/migrate-to-postgresql.js --verbose

# 4. Start server with PostgreSQL
NODE_ENV=local npm start
```

---

## 🆘 **Troubleshooting**

### **Common Issues:**

#### **"psql: command not found"**
- **Windows**: Add PostgreSQL bin folder to PATH
  - Default: `C:\Program Files\PostgreSQL\15\bin`
- **WSL**: Install with `sudo apt install postgresql-client`

#### **"Connection refused"**
- Check if PostgreSQL service is running
- **Windows**: Services → PostgreSQL (should be "Running")
- **WSL**: `sudo systemctl status postgresql`

#### **"Authentication failed"**
- Check username and password in DATABASE_URL
- Ensure user has correct permissions

#### **"Database does not exist"**
- Create database first: `createdb workbeat_dev`
- Or run setup script: `node scripts/setup-postgresql.js --create-db`

---

## 📋 **Next Steps**

1. ✅ Install PostgreSQL (choose your preferred method above)
2. ✅ Create database and user
3. ✅ Update environment variables
4. ✅ Run migration scripts
5. ✅ Test and verify

**Need help?** Run the automated setup script after PostgreSQL is installed:
```bash
node scripts/setup-postgresql.js --env=local --create-user --create-db --migrate
```