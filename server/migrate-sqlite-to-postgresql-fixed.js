#!/usr/bin/env node

/**
 * WorkBeat SQLite to PostgreSQL Migration Script (Fixed)
 * Handles all schema differences between SQLite and PostgreSQL
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

  // Convert SQLite timestamp to PostgreSQL date (YYYY-MM-DD)
  convertToDate(sqliteTimestamp) {
    if (!sqliteTimestamp) return null;
    
    const timestamp = parseInt(sqliteTimestamp);
    if (isNaN(timestamp)) return null;
    
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Split full name into first and last name
  splitName(fullName) {
    if (!fullName) return { firstName: '', lastName: '' };
    
    const parts = fullName.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    
    return { firstName, lastName };
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
        // Map SQLite columns to PostgreSQL columns
        await this.pgClient.query(`
          INSERT INTO users (
            id, "organizationId", email, password, name, role, 
            "isActive", "lastLogin", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            "organizationId" = EXCLUDED."organizationId",
            email = EXCLUDED.email,
            password = EXCLUDED.password,
            name = EXCLUDED.name,
            role = EXCLUDED.role,
            "isActive" = EXCLUDED."isActive",
            "lastLogin" = EXCLUDED."lastLogin",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          user.id, 
          user.organizationId, 
          user.email, 
          user.passwordHash, // SQLite passwordHash → PostgreSQL password
          user.name,
          user.role,
          true, // Default isActive to true
          this.convertTimestamp(user.lastLogin),
          this.convertTimestamp(user.createdAt), 
          this.convertTimestamp(user.updatedAt)
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

  async migrateEmployees() {
    console.log('\n👤 Migrating Employees...');
    
    try {
      const employees = await this.querySQLite('SELECT * FROM Employee ORDER BY id');
      console.log(`   Found ${employees.length} employees`);
      
      for (const employee of employees) {
        // Split name into firstName and lastName
        const { firstName, lastName } = this.splitName(employee.name);
        
        // Map SQLite columns to PostgreSQL columns
        await this.pgClient.query(`
          INSERT INTO employees (
            id, "organizationId", "employeeId", "firstName", "lastName", 
            email, phone, position, department, "hireDate", 
            salary, "isActive", "biometricData", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            "organizationId" = EXCLUDED."organizationId",
            "employeeId" = EXCLUDED."employeeId",
            "firstName" = EXCLUDED."firstName",
            "lastName" = EXCLUDED."lastName",
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            position = EXCLUDED.position,
            department = EXCLUDED.department,
            "hireDate" = EXCLUDED."hireDate",
            salary = EXCLUDED.salary,
            "isActive" = EXCLUDED."isActive",
            "biometricData" = EXCLUDED."biometricData",
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          employee.id,
          employee.organizationId,
          employee.employeeId,
          firstName,
          lastName,
          employee.email,
          employee.phone,
          employee.position,
          employee.department,
          this.convertToDate(employee.startDate), // startDate → hireDate
          null, // salary not in SQLite, set to null
          employee.isActive,
          employee.biometrics, // SQLite biometrics → PostgreSQL biometricData
          this.convertTimestamp(employee.createdAt),
          this.convertTimestamp(employee.updatedAt)
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
        // Map SQLite attendance structure to PostgreSQL structure
        // SQLite has: type, timestamp, verificationMethod, facialVerification, etc.
        // PostgreSQL has: date, checkIn, checkOut, status
        
        const attendanceDate = this.convertToDate(attendance.timestamp);
        const attendanceTime = this.convertTimestamp(attendance.timestamp);
        
        // Determine if this is check-in or check-out based on type
        const isCheckIn = attendance.type === 'check-in' || attendance.type === 'sign-in';
        
        await this.pgClient.query(`
          INSERT INTO attendances (
            id, "organizationId", "employeeId", "employeeName", 
            date, "checkIn", "checkOut", status, "ipAddress", 
            location, notes, "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET
            "organizationId" = EXCLUDED."organizationId",
            "employeeId" = EXCLUDED."employeeId",
            "employeeName" = EXCLUDED."employeeName",
            date = EXCLUDED.date,
            "checkIn" = EXCLUDED."checkIn",
            "checkOut" = EXCLUDED."checkOut",
            status = EXCLUDED.status,
            "ipAddress" = EXCLUDED."ipAddress",
            location = EXCLUDED.location,
            notes = EXCLUDED.notes,
            "updatedAt" = EXCLUDED."updatedAt"
        `, [
          attendance.id,
          attendance.organizationId,
          attendance.employeeId,
          attendance.employeeName,
          attendanceDate,
          isCheckIn ? attendanceTime : null, // checkIn if it's a check-in
          !isCheckIn ? attendanceTime : null, // checkOut if it's a check-out
          'present', // Default status
          attendance.ipAddress,
          attendance.location,
          attendance.notes,
          this.convertTimestamp(attendance.createdAt),
          this.convertTimestamp(attendance.updatedAt)
        ]);
        
        console.log(`   ✅ ${attendance.employeeName} - ${attendance.type} (${attendanceDate})`);
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

  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    try {
      const result = await this.pgClient.query(`
        SELECT 
          (SELECT COUNT(*) FROM organizations) as organizations,
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM employees) as employees,
          (SELECT COUNT(*) FROM attendances) as attendances
      `);
      
      const pgCounts = result.rows[0];
      
      console.log('📊 PostgreSQL record counts:');
      console.log(`   Organizations: ${pgCounts.organizations}`);
      console.log(`   Users: ${pgCounts.users}`);
      console.log(`   Employees: ${pgCounts.employees}`);
      console.log(`   Attendances: ${pgCounts.attendances}`);
      
      // Compare with migration stats
      console.log('\n📋 Migration comparison:');
      const tables = ['organizations', 'users', 'employees', 'attendances'];
      let allMatch = true;
      
      for (const table of tables) {
        const migrated = this.stats[table] || 0;
        const inPostgres = parseInt(pgCounts[table] || 0);
        
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
    console.log('📂 SQLite → PostgreSQL (Schema-Aware)');
    console.log('─'.repeat(50));
    
    try {
      await this.connect();
      
      // Migrate in order (respecting foreign key constraints)
      await this.migrateOrganizations();
      await this.migrateUsers();
      await this.migrateEmployees();
      await this.migrateAttendances();
      
      // Verify migration
      console.log('\n' + '='.repeat(60));
      const success = await this.verifyMigration();
      
      console.log('\n📊 Migration Summary:');
      console.log(`   Organizations: ${this.stats.organizations || 0}`);
      console.log(`   Users: ${this.stats.users || 0}`);
      console.log(`   Employees: ${this.stats.employees || 0}`);
      console.log(`   Attendances: ${this.stats.attendances || 0}`);
      
      if (success) {
        console.log('\n🎉 Migration completed successfully!');
        console.log('✅ All data verified in PostgreSQL');
        console.log('\n🚀 Next steps:');
        console.log('1. Install missing dependencies: npm install');
        console.log('2. Start WorkBeat application: npm start');
        console.log('3. Test login with existing users');
        console.log('4. Verify all functionality works');
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