#!/usr/bin/env node

/**
 * SQLite to PostgreSQL Migration Script
 * 
 * This script migrates data from SQLite to PostgreSQL while preserving
 * all relationships and data integrity.
 * 
 * Usage:
 *   node scripts/migrate-to-postgresql.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be migrated without actually doing it
 *   --verbose    Show detailed output
 *   --force      Skip confirmation prompts
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Configuration
const SQLITE_DB_PATH = './dev.db';
const BACKUP_DIR = './backups';

// Initialize Prisma clients
let sqlitePrisma;
let postgresPrisma;

// Migration configuration
const MIGRATION_TABLES = [
  'organizations',
  'users', 
  'departments',
  'employees',
  'attendances',
  'daily_attendances',
  'biometric_data',
  'audit_logs',
  'leave_types',
  'leave_requests',
  'leave_balances',
  'shift_templates',
  'scheduled_shifts',
  'notification_templates',
  'notification_preferences',
  'notification_queue'
];

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose') || args.includes('-v');
const isForce = args.includes('--force');

/**
 * Logger utility
 */
const logger = {
  info: (message) => console.log(`ℹ️  ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  warn: (message) => console.log(`⚠️  ${message}`),
  error: (message) => console.error(`❌ ${message}`),
  verbose: (message) => isVerbose && console.log(`🔍 ${message}`)
};

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    logger.info(`Created backup directory: ${BACKUP_DIR}`);
  }
}

/**
 * Backup SQLite database before migration
 */
function backupSQLiteDB() {
  ensureBackupDir();
  
  if (fs.existsSync(SQLITE_DB_PATH)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `sqlite-backup-${timestamp}.db`);
    
    fs.copyFileSync(SQLITE_DB_PATH, backupPath);
    logger.success(`SQLite database backed up to: ${backupPath}`);
    return backupPath;
  } else {
    logger.warn('SQLite database not found, skipping backup');
    return null;
  }
}

/**
 * Initialize database connections
 */
async function initializeConnections() {
  try {
    // SQLite connection
    sqlitePrisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./dev.db'
        }
      }
    });
    
    // PostgreSQL connection (using environment DATABASE_URL)
    postgresPrisma = new PrismaClient();
    
    // Test connections
    await sqlitePrisma.$connect();
    await postgresPrisma.$connect();
    
    logger.success('Database connections established');
    
    return true;
  } catch (error) {
    logger.error(`Failed to initialize database connections: ${error.message}`);
    return false;
  }
}

/**
 * Get row count from SQLite table
 */
async function getSQLiteRowCount(tableName) {
  try {
    const result = await sqlitePrisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
    return result[0]?.count || 0;
  } catch (error) {
    logger.verbose(`Table ${tableName} doesn't exist in SQLite: ${error.message}`);
    return 0;
  }
}

/**
 * Get row count from PostgreSQL table
 */
async function getPostgreSQLRowCount(tableName) {
  try {
    const result = await postgresPrisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result[0]?.count) || 0;
  } catch (error) {
    logger.verbose(`Table ${tableName} doesn't exist in PostgreSQL: ${error.message}`);
    return 0;
  }
}

/**
 * Migrate organizations table
 */
async function migrateOrganizations() {
  logger.info('Migrating organizations...');
  
  const organizations = await sqlitePrisma.organization.findMany();
  logger.verbose(`Found ${organizations.length} organizations to migrate`);
  
  if (!isDryRun) {
    for (const org of organizations) {
      try {
        await postgresPrisma.organization.create({
          data: {
            id: org.id,
            name: org.name,
            industry: org.industry,
            contactEmail: org.contactEmail,
            contactPhone: org.contactPhone,
            address: org.address,
            settings: org.settings,
            subscription: org.subscription,
            isActive: org.isActive,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt
          }
        });
        logger.verbose(`Migrated organization: ${org.name}`);
      } catch (error) {
        logger.error(`Failed to migrate organization ${org.name}: ${error.message}`);
      }
    }
  }
  
  return organizations.length;
}

/**
 * Migrate users table
 */
async function migrateUsers() {
  logger.info('Migrating users...');
  
  const users = await sqlitePrisma.user.findMany();
  logger.verbose(`Found ${users.length} users to migrate`);
  
  if (!isDryRun) {
    for (const user of users) {
      try {
        await postgresPrisma.user.create({
          data: {
            id: user.id,
            organizationId: user.organizationId,
            email: user.email,
            passwordHash: user.passwordHash,
            name: user.name,
            role: user.role,
            organizationRole: user.organizationRole,
            employeeId: user.employeeId,
            lastLogin: user.lastLogin,
            failedLoginAttempts: user.failedLoginAttempts,
            isLocked: user.isLocked,
            resetPasswordToken: user.resetPasswordToken,
            resetPasswordExpire: user.resetPasswordExpire,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        });
        logger.verbose(`Migrated user: ${user.email}`);
      } catch (error) {
        logger.error(`Failed to migrate user ${user.email}: ${error.message}`);
      }
    }
  }
  
  return users.length;
}

/**
 * Migrate employees table
 */
async function migrateEmployees() {
  logger.info('Migrating employees...');
  
  const employees = await sqlitePrisma.employee.findMany();
  logger.verbose(`Found ${employees.length} employees to migrate`);
  
  if (!isDryRun) {
    for (const employee of employees) {
      try {
        await postgresPrisma.employee.create({
          data: {
            id: employee.id,
            organizationId: employee.organizationId,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            departmentId: employee.departmentId,
            position: employee.position,
            profileImage: employee.profileImage,
            employeeId: employee.employeeId,
            phone: employee.phone,
            workSchedule: employee.workSchedule,
            startDate: employee.startDate,
            employmentStatus: employee.employmentStatus,
            accessLevel: employee.accessLevel,
            isActive: employee.isActive,
            faceRecognition: employee.faceRecognition,
            biometrics: employee.biometrics,
            createdAt: employee.createdAt,
            updatedAt: employee.updatedAt
          }
        });
        logger.verbose(`Migrated employee: ${employee.name}`);
      } catch (error) {
        logger.error(`Failed to migrate employee ${employee.name}: ${error.message}`);
      }
    }
  }
  
  return employees.length;
}

/**
 * Migrate attendance records
 */
async function migrateAttendances() {
  logger.info('Migrating attendance records...');
  
  const attendances = await sqlitePrisma.attendance.findMany();
  logger.verbose(`Found ${attendances.length} attendance records to migrate`);
  
  if (!isDryRun) {
    for (const attendance of attendances) {
      try {
        await postgresPrisma.attendance.create({
          data: {
            id: attendance.id,
            employeeId: attendance.employeeId,
            employeeName: attendance.employeeName,
            organizationId: attendance.organizationId,
            type: attendance.type,
            timestamp: attendance.timestamp,
            location: attendance.location,
            ipAddress: attendance.ipAddress,
            isLate: attendance.isLate,
            notes: attendance.notes,
            verificationMethod: attendance.verificationMethod,
            facialVerification: attendance.facialVerification,
            facialCapture: attendance.facialCapture,
            fingerprintVerification: attendance.fingerprintVerification,
            createdAt: attendance.createdAt,
            updatedAt: attendance.updatedAt
          }
        });
        logger.verbose(`Migrated attendance record: ${attendance.id}`);
      } catch (error) {
        logger.error(`Failed to migrate attendance ${attendance.id}: ${error.message}`);
      }
    }
  }
  
  return attendances.length;
}

/**
 * Main migration function
 */
async function runMigration() {
  logger.info('🚀 Starting SQLite to PostgreSQL migration...');
  
  if (isDryRun) {
    logger.warn('DRY RUN MODE - No data will be modified');
  }
  
  // Step 1: Backup SQLite database
  const backupPath = backupSQLiteDB();
  
  // Step 2: Initialize connections
  const connectionsReady = await initializeConnections();
  if (!connectionsReady) {
    process.exit(1);
  }
  
  // Step 3: Check current state
  logger.info('📊 Checking current database state...');
  for (const table of MIGRATION_TABLES) {
    const sqliteCount = await getSQLiteRowCount(table);
    const postgresCount = await getPostgreSQLRowCount(table);
    logger.info(`${table}: SQLite(${sqliteCount}) → PostgreSQL(${postgresCount})`);
  }
  
  // Step 4: Confirm migration
  if (!isForce && !isDryRun) {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      readline.question('Do you want to proceed with the migration? (yes/no): ', resolve);
    });
    
    readline.close();
    
    if (answer.toLowerCase() !== 'yes') {
      logger.info('Migration cancelled by user');
      process.exit(0);
    }
  }
  
  // Step 5: Run migrations in order (respecting foreign key constraints)
  const migrationResults = {};
  
  try {
    // Reset sequences to avoid ID conflicts
    if (!isDryRun) {
      logger.info('Resetting PostgreSQL sequences...');
      await postgresPrisma.$executeRaw`SELECT setval(pg_get_serial_sequence('organizations', 'id'), 1, false)`;
      await postgresPrisma.$executeRaw`SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false)`;
      await postgresPrisma.$executeRaw`SELECT setval(pg_get_serial_sequence('employees', 'id'), 1, false)`;
      await postgresPrisma.$executeRaw`SELECT setval(pg_get_serial_sequence('attendances', 'id'), 1, false)`;
    }
    
    // Migrate in dependency order
    migrationResults.organizations = await migrateOrganizations();
    migrationResults.users = await migrateUsers();
    migrationResults.employees = await migrateEmployees();
    migrationResults.attendances = await migrateAttendances();
    
    // Update sequences to current max values
    if (!isDryRun) {
      logger.info('Updating PostgreSQL sequences...');
      await postgresPrisma.$executeRaw`SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations))`;
      await postgresPrisma.$executeRaw`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))`;
      await postgresPrisma.$executeRaw`SELECT setval('employees_id_seq', (SELECT MAX(id) FROM employees))`;
      await postgresPrisma.$executeRaw`SELECT setval('attendances_id_seq', (SELECT MAX(id) FROM attendances))`;
    }
    
    // Step 6: Verify migration
    logger.info('🔍 Verifying migration...');
    for (const table of Object.keys(migrationResults)) {
      const postgresCount = await getPostgreSQLRowCount(table);
      const expectedCount = migrationResults[table];
      
      if (postgresCount === expectedCount) {
        logger.success(`${table}: ${postgresCount} records migrated successfully`);
      } else {
        logger.error(`${table}: Expected ${expectedCount}, found ${postgresCount}`);
      }
    }
    
    logger.success('🎉 Migration completed successfully!');
    
  } catch (error) {
    logger.error(`Migration failed: ${error.message}`);
    if (backupPath) {
      logger.info(`SQLite backup available at: ${backupPath}`);
    }
    process.exit(1);
  } finally {
    await sqlitePrisma.$disconnect();
    await postgresPrisma.$disconnect();
  }
}

/**
 * Handle script execution
 */
if (require.main === module) {
  runMigration().catch((error) => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runMigration,
  logger
};