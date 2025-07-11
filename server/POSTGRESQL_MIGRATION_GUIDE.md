# PostgreSQL Migration Guide

This guide walks you through migrating your WorkBeat application from SQLite to PostgreSQL for production deployment.

## 🎯 **Migration Overview**

### **Why Migrate to PostgreSQL?**

- **Scalability**: Handle thousands of concurrent users
- **Performance**: Better query optimization and indexing
- **Features**: Advanced data types (INET, JSONB, Arrays)
- **Reliability**: ACID compliance and better backup options
- **Enterprise Ready**: Meet enterprise database requirements

### **What's Included**

- ✅ Updated Prisma schema with PostgreSQL optimizations
- ✅ Database connection pooling
- ✅ Environment-specific configurations
- ✅ Automated migration scripts
- ✅ Data preservation during migration
- ✅ Health check and monitoring

---

## 🚀 **Quick Start Migration**

### **Prerequisites**
1. PostgreSQL 12+ installed and running
2. Node.js 16+ and npm
3. Existing WorkBeat SQLite database

### **Option 1: Automated Setup (Recommended)**
```bash
# 1. Install PostgreSQL dependencies (already done)
npm install pg @types/pg

# 2. Set up PostgreSQL database
node scripts/setup-postgresql.js --env=production --create-user --create-db --migrate

# 3. Migrate existing data
node scripts/migrate-to-postgresql.js

# 4. Test the setup
node scripts/test-database.js

# 5. Start server with PostgreSQL
NODE_ENV=production npm start
```

### **Option 2: Manual Setup**
See detailed steps below.

---

## 📋 **Detailed Migration Steps**

### **Step 1: Install and Configure PostgreSQL**

#### **Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### **macOS:**
```bash
brew install postgresql
brew services start postgresql
```

#### **Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/)

### **Step 2: Create Database and User**

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create user and database
CREATE USER workbeat_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE workbeat_prod OWNER workbeat_user;
GRANT ALL PRIVILEGES ON DATABASE workbeat_prod TO workbeat_user;
\q
```

### **Step 3: Configure Environment**

#### **Update .env.production:**
```env
NODE_ENV=production
DATABASE_URL="postgresql://workbeat_user:your_secure_password@localhost:5432/workbeat_prod?schema=public"
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=workbeat_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=workbeat_prod
POSTGRES_SSL=false

# Connection Pool
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_POOL_IDLE_TIMEOUT=30000
DATABASE_POOL_CONNECTION_TIMEOUT=10000
```

#### **For Development (Optional):**
```env
# .env.development
NODE_ENV=development
DATABASE_URL="postgresql://workbeat_user:dev_password@localhost:5432/workbeat_dev?schema=public"
```

### **Step 4: Run Database Migration**

#### **Generate and Apply Schema:**
```bash
# Generate Prisma client for PostgreSQL
npx prisma generate

# Apply migrations to create tables
npx prisma migrate deploy

# Or create new migration
npx prisma migrate dev --name init_postgresql
```

#### **Migrate Existing Data:**
```bash
# Test migration (dry run)
node scripts/migrate-to-postgresql.js --dry-run --verbose

# Run actual migration
node scripts/migrate-to-postgresql.js --verbose

# Verify migration
node scripts/test-database.js
```

### **Step 5: Test and Verify**

```bash
# Test database connectivity
node scripts/test-database.js

# Start server
NODE_ENV=production npm start

# Check health endpoint
curl http://localhost:5000/health
```

---

## 🔧 **Configuration Options**

### **Environment Variables**

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `DATABASE_URL` | PostgreSQL/SQLite | PostgreSQL | Database connection string |
| `DATABASE_POOL_MIN` | 1 | 5 | Minimum connections |
| `DATABASE_POOL_MAX` | 5 | 20 | Maximum connections |
| `POSTGRES_SSL` | false | true | Enable SSL for production |

### **Connection Pool Settings**

```env
# Conservative (Small apps)
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Balanced (Medium apps) 
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Aggressive (Large apps)
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=50
```

---

## 🛠️ **Deployment Scenarios**

### **Local Development**
```bash
# Use development environment
NODE_ENV=development npm start
```

### **Staging Environment**
```bash
# Use production database with staging data
NODE_ENV=staging npm start
```

### **Production Deployment**
```bash
# Use production environment
NODE_ENV=production npm start
```

---

## 📊 **Performance Optimization**

### **Database Indexing**
The new schema includes optimized indexes:
- Primary keys on all tables
- Foreign key indexes for relationships
- Composite indexes for queries
- Timestamp indexes for reporting

### **Connection Pooling Benefits**
- **Reduced overhead**: Reuse database connections
- **Better concurrency**: Handle more simultaneous users
- **Resource management**: Automatic connection cleanup
- **Failover support**: Retry logic for failed connections

### **Query Performance**
PostgreSQL provides:
- Better query planner
- Materialized views support
- Advanced indexing (GIN, GiST)
- Parallel query execution

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Connection Refused**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U workbeat_user -d workbeat_prod
```

#### **Authentication Failed**
```bash
# Check pg_hba.conf file
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Ensure line exists:
local   all   workbeat_user   md5
```

#### **Migration Errors**
```bash
# Check existing data conflicts
node scripts/migrate-to-postgresql.js --dry-run --verbose

# Reset and retry
npx prisma migrate reset --force
node scripts/migrate-to-postgresql.js
```

#### **Performance Issues**
```bash
# Check connection pool usage
curl http://localhost:5000/health

# Monitor PostgreSQL
SELECT * FROM pg_stat_activity WHERE datname = 'workbeat_prod';
```

### **Database Maintenance**

#### **Regular Maintenance Tasks**
```bash
# Analyze database statistics
node -e "require('./config/database.js').maintenance.analyze()"

# Vacuum and analyze
node -e "require('./config/database.js').maintenance.vacuum()"

# Check database size
node -e "require('./config/database.js').maintenance.getSize().then(console.log)"
```

#### **Backup and Restore**
```bash
# Create backup
pg_dump -h localhost -U workbeat_user workbeat_prod > backup.sql

# Restore from backup
psql -h localhost -U workbeat_user workbeat_prod < backup.sql
```

---

## 📈 **Monitoring and Maintenance**

### **Health Checks**
- Database connectivity test
- Connection pool status
- Query performance metrics
- Disk space monitoring

### **Logging**
- Connection events
- Query performance
- Error tracking
- Security events

### **Alerts**
Set up monitoring for:
- High connection usage
- Slow queries (>5s)
- Failed connections
- Disk space <20%

---

## 🎉 **Post-Migration Checklist**

- [ ] Database connection successful
- [ ] All tables created correctly
- [ ] Data migrated without loss
- [ ] Indexes are optimized
- [ ] Connection pooling working
- [ ] Application starts successfully
- [ ] All API endpoints functional
- [ ] Performance is acceptable
- [ ] Backups configured
- [ ] Monitoring in place

---

## 📚 **Additional Resources**

### **Scripts Reference**
- `scripts/setup-postgresql.js` - Automated PostgreSQL setup
- `scripts/migrate-to-postgresql.js` - Data migration utility
- `scripts/test-database.js` - Connection and health testing
- `config/database.js` - Enhanced database configuration
- `config/environment.js` - Environment management

### **Configuration Files**
- `.env.development` - Development settings
- `.env.production` - Production settings
- `prisma/schema.prisma` - Updated database schema

### **Useful Commands**
```bash
# Check PostgreSQL version
psql --version

# Connect to database
psql -h localhost -U workbeat_user -d workbeat_prod

# List databases
\l

# List tables
\dt

# Exit psql
\q
```

---

## ⚠️ **Important Notes**

1. **Always backup your SQLite database** before migration
2. **Test the migration** in a staging environment first
3. **Update connection strings** in your environment files
4. **Monitor performance** after migration
5. **Set up regular backups** for PostgreSQL

Your WorkBeat application is now ready for enterprise-scale deployment with PostgreSQL! 🚀