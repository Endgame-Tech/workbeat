#!/usr/bin/env node

/**
 * WorkBeat SQLite to PostgreSQL Migration Script
 * Migrates all existing data from SQLite to PostgreSQL
 */

const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const path = require('path');

// Configuration
const SQLITE_PATH = path.join(__dirname, 'prisma', 'dev.db');
const PG_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'workbeat_user',
  password: 'legend',
  database: 'workbeat_dev'
};

class WorkBeatMigrator {
  constructor() {
    this.sqliteDb = null;
    this.pgClient = null;
    this.stats = {};
  }

  // Convert SQLite timestamp (milliseconds) to PostgreSQL timestamp
  convertTimestamp(sqliteTimestamp) {
    if (!sqliteTimestamp) return null;
    
    // If it's already a valid ISO string, return it
    if (typeof sqliteTimestamp === 'string' && sqliteTimestamp.includes('T')) {
      return sqliteTimestamp;
    }
    
    // If it's a number (milliseconds since epoch), convert it
    const timestamp = parseInt(sqliteTimestamp);
    if (isNaN(timestamp)) return null;
    
    // Convert to JavaScript Date and then to ISO string
    const date = new Date(timestamp);
    return date.toISOString();
  }

  async connect() {
    console.log('🔗 Connecting to databases...');
    
    // Connect to SQLite
    this.sqliteDb = new sqlite3.Database(SQLITE_PATH, (err) => {
      if (err) {
        console.error('❌ SQLite connection failed:', err.message);
        throw err;
      }
      console.log('✅ Connected to SQLite database');
    });
    
    // Connect to PostgreSQL
    this.pgClient = new Client(PG_CONFIG);
    await this.pgClient.connect();
    console.log('✅ Connected to PostgreSQL database');
  }

  async disconnect() {
    if (this.sqliteDb) {
      this.sqliteDb.close();
      console.log('🔐 SQLite connection closed');
    }
    if (this.pgClient) {
      await this.pgClient.end();
      console.log('🔐 PostgreSQL connection closed');
    }
  }

  async querySQLite(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async migrateOrganizations() {
    console.log('\n📊 Migrating Organizations...');
    
    try {
      const organizations = await this.querySQLite('SELECT * FROM Organization ORDER BY id');
      console.log(`   Found ${organizations.length} organizations`);
      
      for (const org of organizations) {
        await this.pgClient.query(`
          INSERT INTO organizations (
            id, name, industry, "contactEmail", "contactPhone", 
            address, settings, subscription, "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            industry = EXCLUDED.industry,
            "contactEmail" = EXCLUDED."contactEmail",
            "contactPhone" = EXCLUDED."contactPhone",
            address = EXCLUDED.address,
            settings = EXCLUDED.settings,
            subscription = EXCLUDED.subscription,
            "isActive" = EXCLUDED."isActive",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          org.id, org.name, org.industry, org.contactEmail, org.contactPhone,
          org.address, org.settings, org.subscription, org.isActive,
          this.convertTimestamp(org.createdAt), this.convertTimestamp(org.updatedAt)
        ]);
        
        console.log(`   ✅ ${org.name} (ID: ${org.id})`);
      }
      
      // Update sequence
      if (organizations.length > 0) {
        const maxId = Math.max(...organizations.map(org => org.id));
        await this.pgClient.query(`SELECT setval('organizations_id_seq', $1)`, [maxId]);
      }
      
      this.stats.organizations = organizations.length;
      console.log(`   ✅ Migrated ${organizations.length} organizations`);
      
    } catch (error) {
      console.error('❌ Organizations migration failed:', error.message);
      throw error;
    }
  }

  async migrateUsers() {
    console.log('\n👥 Migrating Users...');
    
    try {
      const users = await this.querySQLite('SELECT * FROM User ORDER BY id');
      console.log(`   Found ${users.length} users`);
      
      for (const user of users) {
        await this.pgClient.query(`
          INSERT INTO users (
            id, "organizationId", email, password, name, role, 
            "organizationRole", "employeeId", "lastLogin", "failedLoginAttempts",
            "isLocked", "resetPasswordToken", "resetPasswordExpire", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            "organizationId" = EXCLUDED."organizationId",
            email = EXCLUDED.email,
            password = EXCLUDED.password,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            "organizationRole" = EXCLUDED."organizationRole",
            "employeeId" = EXCLUDED."employeeId",
            "lastLogin" = EXCLUDED."lastLogin",
            "failedLoginAttempts" = EXCLUDED."failedLoginAttempts",
            "isLocked" = EXCLUDED."isLocked",
            "resetPasswordToken" = EXCLUDED."resetPasswordToken",
            "resetPasswordExpire" = EXCLUDED."resetPasswordExpire",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          user.id, user.organizationId, user.email, user.passwordHash, user.name,
          user.role, user.organizationRole, user.employeeId, this.convertTimestamp(user.lastLogin),
          user.failedLoginAttempts, user.isLocked, user.resetPasswordToken,
          this.convertTimestamp(user.resetPasswordExpire), this.convertTimestamp(user.createdAt), this.convertTimestamp(user.updatedAt)
        ]);
        
        console.log(`   ✅ ${user.email} (${user.name})`);
      }
      
      // Update sequence
      if (users.length > 0) {
        const maxId = Math.max(...users.map(user => user.id));
        await this.pgClient.query(`SELECT setval('users_id_seq', $1)`, [maxId]);
      }
      
      this.stats.users = users.length;
      console.log(`   ✅ Migrated ${users.length} users`);
      
    } catch (error) {
      console.error('❌ Users migration failed:', error.message);
      throw error;
    }
  }

  async migrateDepartments() {
    console.log('\n🏢 Migrating Departments...');
    
    try {
      const departments = await this.querySQLite('SELECT * FROM Department ORDER BY id');
      console.log(`   Found ${departments.length} departments`);
      
      // First, create departments table if it doesn't exist (extended schema)
      await this.pgClient.query(`
        CREATE TABLE IF NOT EXISTS "departments" (
          "id" SERIAL PRIMARY KEY,
          "organizationId" INTEGER NOT NULL,
          "name" VARCHAR(100) NOT NULL,
          "description" TEXT,
          "parentId" INTEGER,
          "headId" INTEGER,
          "workingHours" TEXT,
          "isActive" BOOLEAN DEFAULT true NOT NULL,
          "deletedAt" TIMESTAMPTZ(6),
          "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
          FOREIGN KEY ("parentId") REFERENCES "departments"("id") ON DELETE SET NULL
        );
      `);
      
      for (const dept of departments) {
        await this.pgClient.query(`
          INSERT INTO departments (
            id, "organizationId", name, description, "parentId", "headId",
            "workingHours", "isActive", "deletedAt", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            "organizationId" = EXCLUDED."organizationId",
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            "parentId" = EXCLUDED."parentId",
            "headId" = EXCLUDED."headId",
            "workingHours" = EXCLUDED."workingHours",
            "isActive" = EXCLUDED."isActive",
            "deletedAt" = EXCLUDED."deletedAt",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          dept.id, dept.organizationId, dept.name, dept.description, dept.parentId,
          dept.headId, dept.workingHours, dept.isActive, this.convertTimestamp(dept.deletedAt),
          this.convertTimestamp(dept.createdAt), this.convertTimestamp(dept.updatedAt)
        ]);
        
        console.log(`   ✅ ${dept.name} (ID: ${dept.id})`);
      }
      
      // Update sequence
      if (departments.length > 0) {
        const maxId = Math.max(...departments.map(dept => dept.id));
        await this.pgClient.query(`SELECT setval('departments_id_seq', $1)`, [maxId]);
      }
      
      this.stats.departments = departments.length;
      console.log(`   ✅ Migrated ${departments.length} departments`);
      
    } catch (error) {
      console.error('❌ Departments migration failed:', error.message);
      throw error;
    }
  }

  async migrateEmployees() {
    console.log('\n👤 Migrating Employees...');
    
    try {
      const employees = await this.querySQLite('SELECT * FROM Employee ORDER BY id');
      console.log(`   Found ${employees.length} employees`);
      
      for (const employee of employees) {
        await this.pgClient.query(`
          INSERT INTO employees (
            id, "organizationId", name, email, department, "departmentId",
            position, "profileImage", "employeeId", phone, "workSchedule",
            "startDate", "employmentStatus", "accessLevel", "isActive",
            "faceRecognition", biometrics, "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          ON CONFLICT (id) DO UPDATE SET
            "organizationId" = EXCLUDED."organizationId",
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            department = EXCLUDED.department,
            "departmentId" = EXCLUDED."departmentId",
            position = EXCLUDED.position,
            "profileImage" = EXCLUDED."profileImage",
            "employeeId" = EXCLUDED."employeeId",
            phone = EXCLUDED.phone,
            "workSchedule" = EXCLUDED."workSchedule",
            "startDate" = EXCLUDED."startDate",
            "employmentStatus" = EXCLUDED."employmentStatus",
            "accessLevel" = EXCLUDED."accessLevel",
            "isActive" = EXCLUDED."isActive",
            "faceRecognition" = EXCLUDED."faceRecognition",
            biometrics = EXCLUDED.biometrics,
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          employee.id, employee.organizationId, employee.name, employee.email,
          employee.department, employee.departmentId, employee.position,
          employee.profileImage, employee.employeeId, employee.phone,
          employee.workSchedule, this.convertTimestamp(employee.startDate), employee.employmentStatus,
          employee.accessLevel, employee.isActive, employee.faceRecognition,
          employee.biometrics, this.convertTimestamp(employee.createdAt), this.convertTimestamp(employee.updatedAt)
        ]);
        
        console.log(`   ✅ ${employee.name} (${employee.employeeId})`);
      }
      
      // Update sequence
      if (employees.length > 0) {
        const maxId = Math.max(...employees.map(emp => emp.id));
        await this.pgClient.query(`SELECT setval('employees_id_seq', $1)`, [maxId]);
      }
      
      this.stats.employees = employees.length;
      console.log(`   ✅ Migrated ${employees.length} employees`);
      
    } catch (error) {
      console.error('❌ Employees migration failed:', error.message);
      throw error;
    }
  }

  async migrateAttendances() {
    console.log('\n📅 Migrating Attendances...');
    
    try {
      const attendances = await this.querySQLite('SELECT * FROM Attendance ORDER BY id');
      console.log(`   Found ${attendances.length} attendance records`);
      
      for (const attendance of attendances) {
        await this.pgClient.query(`
          INSERT INTO attendances (
            id, "employeeId", "organizationId", type, timestamp, location,
            "ipAddress", "isLate", notes, "verificationMethod", "facialVerification",
            "facialCapture", "fingerprintVerification", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            "employeeId" = EXCLUDED."employeeId",
            "organizationId" = EXCLUDED."organizationId",
            type = EXCLUDED.type,
            timestamp = EXCLUDED.timestamp,
            location = EXCLUDED.location,
            "ipAddress" = EXCLUDED."ipAddress",
            "isLate" = EXCLUDED."isLate",
            notes = EXCLUDED.notes,
            "verificationMethod" = EXCLUDED."verificationMethod",
            "facialVerification" = EXCLUDED."facialVerification",
            "facialCapture" = EXCLUDED."facialCapture",
            "fingerprintVerification" = EXCLUDED."fingerprintVerification",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          attendance.id, attendance.employeeId, attendance.organizationId,
          attendance.type, this.convertTimestamp(attendance.timestamp), attendance.location,
          attendance.ipAddress, attendance.isLate, attendance.notes,
          attendance.verificationMethod, attendance.facialVerification,
          attendance.facialCapture, attendance.fingerprintVerification,
          this.convertTimestamp(attendance.createdAt), this.convertTimestamp(attendance.updatedAt)
        ]);
        
        console.log(`   ✅ ${attendance.employeeName} - ${attendance.type} (${attendance.timestamp})`);
      }
      
      // Update sequence
      if (attendances.length > 0) {
        const maxId = Math.max(...attendances.map(att => att.id));
        await this.pgClient.query(`SELECT setval('attendances_id_seq', $1)`, [maxId]);
      }
      
      this.stats.attendances = attendances.length;
      console.log(`   ✅ Migrated ${attendances.length} attendance records`);
      
    } catch (error) {
      console.error('❌ Attendances migration failed:', error.message);
      throw error;
    }
  }

  async migrateAuditLogs() {
    console.log('\n📋 Migrating Audit Logs...');
    
    try {
      const auditLogs = await this.querySQLite('SELECT * FROM AuditLog ORDER BY id');
      console.log(`   Found ${auditLogs.length} audit log records`);
      
      // Create audit_logs table if it doesn't exist
      await this.pgClient.query(`
        CREATE TABLE IF NOT EXISTS "audit_logs" (
          "id" SERIAL PRIMARY KEY,
          "userId" INTEGER,
          "action" VARCHAR(100) NOT NULL,
          "details" TEXT,
          "ipAddress" INET,
          "resourceType" VARCHAR(50) DEFAULT 'system' NOT NULL,
          "resourceId" VARCHAR(100),
          "createdAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
          "updatedAt" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
        );
      `);
      
      for (const log of auditLogs) {
        await this.pgClient.query(`
          INSERT INTO audit_logs (
            id, "userId", action, details, "ipAddress", "resourceType",
            "resourceId", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            "userId" = EXCLUDED."userId",
            action = EXCLUDED.action,
            details = EXCLUDED.details,
            "ipAddress" = EXCLUDED."ipAddress",
            "resourceType" = EXCLUDED."resourceType",
            "resourceId" = EXCLUDED."resourceId",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          log.id, log.userId, log.action, log.details, log.ipAddress,
          log.resourceType, log.resourceId, this.convertTimestamp(log.createdAt), this.convertTimestamp(log.updatedAt)
        ]);
        
        console.log(`   ✅ ${log.action} (User: ${log.userId || 'System'})`);
      }
      
      // Update sequence
      if (auditLogs.length > 0) {
        const maxId = Math.max(...auditLogs.map(log => log.id));
        await this.pgClient.query(`SELECT setval('audit_logs_id_seq', $1)`, [maxId]);
      }
      
      this.stats.auditLogs = auditLogs.length;
      console.log(`   ✅ Migrated ${auditLogs.length} audit log records`);
      
    } catch (error) {
      console.error('❌ Audit logs migration failed:', error.message);
      throw error;
    }
  }

  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    try {
      const result = await this.pgClient.query(`
        SELECT 
          (SELECT COUNT(*) FROM organizations) as organizations,
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM employees) as employees,
          (SELECT COUNT(*) FROM attendances) as attendances,
          (SELECT COUNT(*) FROM departments) as departments,
          (SELECT COUNT(*) FROM audit_logs) as audit_logs
      `);
      
      const pgCounts = result.rows[0];
      
      console.log('📊 PostgreSQL record counts:');
      console.log(`   Organizations: ${pgCounts.organizations}`);
      console.log(`   Users: ${pgCounts.users}`);
      console.log(`   Employees: ${pgCounts.employees}`);
      console.log(`   Attendances: ${pgCounts.attendances}`);
      console.log(`   Departments: ${pgCounts.departments}`);
      console.log(`   Audit Logs: ${pgCounts.audit_logs}`);
      
      // Compare with migration stats
      console.log('\n📋 Migration comparison:');
      const tables = ['organizations', 'users', 'employees', 'attendances', 'departments', 'auditLogs'];
      let allMatch = true;
      
      for (const table of tables) {
        const pgKey = table === 'auditLogs' ? 'audit_logs' : table;
        const migrated = this.stats[table] || 0;
        const inPostgres = parseInt(pgCounts[pgKey] || 0);
        
        if (migrated === inPostgres) {
          console.log(`   ✅ ${table}: ${migrated} ↔ ${inPostgres}`);
        } else {
          console.log(`   ❌ ${table}: ${migrated} ↔ ${inPostgres} (MISMATCH)`);
          allMatch = false;
        }
      }
      
      return allMatch;
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      throw error;
    }
  }

  async migrate() {
    console.log('🚀 Starting WorkBeat Data Migration...\n');
    console.log('📂 SQLite → PostgreSQL');
    console.log('─'.repeat(50));
    
    try {
      await this.connect();
      
      // Migrate in order (respecting foreign key constraints)
      await this.migrateOrganizations();
      await this.migrateUsers();
      await this.migrateDepartments();
      await this.migrateEmployees();
      await this.migrateAttendances();
      await this.migrateAuditLogs();
      
      // Verify migration
      console.log('\n' + '='.repeat(60));
      const success = await this.verifyMigration();
      
      console.log('\n📊 Migration Summary:');
      console.log(`   Organizations: ${this.stats.organizations || 0}`);
      console.log(`   Users: ${this.stats.users || 0}`);
      console.log(`   Departments: ${this.stats.departments || 0}`);
      console.log(`   Employees: ${this.stats.employees || 0}`);
      console.log(`   Attendances: ${this.stats.attendances || 0}`);
      console.log(`   Audit Logs: ${this.stats.auditLogs || 0}`);
      
      if (success) {
        console.log('\n🎉 Migration completed successfully!');
        console.log('✅ All data verified in PostgreSQL');
        console.log('\n🚀 Next steps:');
        console.log('1. Start WorkBeat application: npm start');
        console.log('2. Test login with existing users');
        console.log('3. Verify all functionality works');
      } else {
        console.log('\n⚠️  Migration completed with warnings');
        console.log('Please check the data manually');
      }
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run migration
if (require.main === module) {
  const migrator = new WorkBeatMigrator();
  migrator.migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = WorkBeatMigrator;