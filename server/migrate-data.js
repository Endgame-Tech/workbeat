#!/usr/bin/env node

/**
 * Data Migration Script - SQLite to PostgreSQL
 * Run this from Windows Command Prompt or PowerShell
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

class DataMigrator {
  constructor() {
    this.sqliteDb = null;
    this.pgClient = null;
    this.stats = {
      organizations: 0,
      users: 0,
      employees: 0,
      attendances: 0,
      dailyAttendances: 0
    };
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
      const organizations = await this.querySQLite('SELECT * FROM organizations ORDER BY id');
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
          org.createdAt, org.updatedAt
        ]);
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
      const users = await this.querySQLite('SELECT * FROM users ORDER BY id');
      console.log(`   Found ${users.length} users`);
      
      for (const user of users) {
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
          user.id, user.organizationId, user.email, user.password, user.name,
          user.role, user.isActive, user.lastLogin, user.createdAt, user.updatedAt
        ]);
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
      const employees = await this.querySQLite('SELECT * FROM employees ORDER BY id');
      console.log(`   Found ${employees.length} employees`);
      
      for (const employee of employees) {
        await this.pgClient.query(`
          INSERT INTO employees (
            id, "organizationId", "employeeId", "firstName", "lastName", 
            email, phone, position, department, "hireDate", salary, 
            "isActive", "biometricData", "createdAt", "updatedAt"
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
          employee.id, employee.organizationId, employee.employeeId,
          employee.firstName, employee.lastName, employee.email, employee.phone,
          employee.position, employee.department, employee.hireDate, employee.salary,
          employee.isActive, employee.biometricData, employee.createdAt, employee.updatedAt
        ]);
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
      const attendances = await this.querySQLite('SELECT * FROM attendances ORDER BY id');
      console.log(`   Found ${attendances.length} attendance records`);
      
      for (const attendance of attendances) {
        await this.pgClient.query(`
          INSERT INTO attendances (
            id, "organizationId", "employeeId", "employeeName", date, 
            "checkIn", "checkOut", status, "ipAddress", location, 
            notes, "createdAt", "updatedAt"
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
          attendance.id, attendance.organizationId, attendance.employeeId,
          attendance.employeeName, attendance.date, attendance.checkIn,
          attendance.checkOut, attendance.status, attendance.ipAddress,
          attendance.location, attendance.notes, attendance.createdAt, attendance.updatedAt
        ]);
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
      
      console.log('📊 PostgreSQL record counts:');
      console.log(`   Organizations: ${result.rows[0].organizations}`);
      console.log(`   Users: ${result.rows[0].users}`);
      console.log(`   Employees: ${result.rows[0].employees}`);
      console.log(`   Attendances: ${result.rows[0].attendances}`);
      
      return result.rows[0];
      
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      throw error;
    }
  }

  async migrate() {
    console.log('🚀 Starting data migration...\n');
    
    try {
      await this.connect();
      
      // Migrate in order (respecting foreign key constraints)
      await this.migrateOrganizations();
      await this.migrateUsers();
      await this.migrateEmployees();
      await this.migrateAttendances();
      
      // Verify migration
      await this.verifyMigration();
      
      console.log('\n📊 Migration Summary:');
      console.log(`   Organizations: ${this.stats.organizations}`);
      console.log(`   Users: ${this.stats.users}`);
      console.log(`   Employees: ${this.stats.employees}`);
      console.log(`   Attendances: ${this.stats.attendances}`);
      
      console.log('\n🎉 Migration completed successfully!');
      
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
  const migrator = new DataMigrator();
  migrator.migrate().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = DataMigrator;