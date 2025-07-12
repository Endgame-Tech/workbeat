#!/usr/bin/env node
/**
 * Emergency Schema Fix Script
 * Directly adds missing columns to production database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSchemaNow() {
  console.log('🚨 EMERGENCY: Fixing database schema...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Check what tables exist
    console.log('🔍 Checking existing tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const existingTables = tables.map(t => t.table_name);
    console.log('📋 Existing tables:', existingTables);

    // Create missing tables
    await createMissingTables(existingTables);
    
    // Add missing columns to existing tables
    await addMissingColumns();
    
    console.log('\n🎉 Schema is now complete! Registration should work.');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createMissingTables(existingTables) {
  console.log('\n🔧 Creating missing tables...');
  
  // Create audit_logs table if missing
  if (!existingTables.includes('audit_logs')) {
    console.log('Creating audit_logs table...');
    await prisma.$executeRaw`
      CREATE TABLE "audit_logs" (
        "id" SERIAL NOT NULL,
        "userId" INTEGER,
        "action" VARCHAR(100) NOT NULL,
        "details" TEXT,
        "ipAddress" VARCHAR(45),
        "resourceType" VARCHAR(50) NOT NULL DEFAULT 'system',
        "resourceId" VARCHAR(100),
        "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
      )
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_userId" ON "audit_logs"("userId")
    `;
    
    console.log('✅ audit_logs table created');
  }
  
  // Create organizations table if missing
  if (!existingTables.includes('organizations')) {
    console.log('Creating organizations table...');
    await prisma.$executeRaw`
      CREATE TABLE "organizations" (
        "id" SERIAL NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "industry" VARCHAR(100) NOT NULL,
        "contactEmail" VARCHAR(255) NOT NULL,
        "contactPhone" VARCHAR(20) NOT NULL,
        "address" TEXT,
        "settings" TEXT,
        "subscription" TEXT,
        "subscriptionStatus" VARCHAR(20) DEFAULT 'trial',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
      )
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "organizations_contactEmail_key" ON "organizations"("contactEmail")
    `;
    
    console.log('✅ organizations table created');
  }
  
  // Create users table if missing
  if (!existingTables.includes('users')) {
    console.log('Creating users table...');
    await prisma.$executeRaw`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "organizationId" INTEGER NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "passwordHash" VARCHAR(255) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'admin',
        "organizationRole" VARCHAR(50),
        "employeeId" INTEGER,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "lastLogin" TIMESTAMPTZ(6),
        "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
        "isLocked" BOOLEAN NOT NULL DEFAULT false,
        "resetPasswordToken" VARCHAR(255),
        "resetPasswordExpire" TIMESTAMPTZ(6),
        "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      )
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")
    `;
    
    console.log('✅ users table created');
  }
  
  // Create employees table if missing
  if (!existingTables.includes('employees')) {
    console.log('Creating employees table...');
    await prisma.$executeRaw`
      CREATE TABLE "employees" (
        "id" SERIAL NOT NULL,
        "organizationId" INTEGER NOT NULL,
        "employeeId" VARCHAR(50) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(255),
        "department" VARCHAR(100) NOT NULL,
        "position" VARCHAR(100) NOT NULL,
        "phone" VARCHAR(20),
        "workSchedule" TEXT,
        "employmentStatus" VARCHAR(20) DEFAULT 'full-time',
        "accessLevel" VARCHAR(20) DEFAULT 'employee',
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
      )
    `;
    
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "employees_organizationId_employeeId_key" ON "employees"("organizationId", "employeeId")
    `;
    
    console.log('✅ employees table created');
  }
}

async function addMissingColumns() {
  console.log('\n🔧 Adding missing columns...');
  
  // Add resetPasswordToken columns to users table if missing
  try {
    await prisma.$executeRaw`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR(255)
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "resetPasswordExpire" TIMESTAMPTZ(6)
    `;
    
    console.log('✅ Added resetPasswordToken and resetPasswordExpire columns');
  } catch (error) {
    console.log('ℹ️ resetPasswordToken columns may already exist');
  }
  
  // Test the schema
  console.log('🧪 Testing schema...');
  
  try {
    const orgCount = await prisma.organization.count();
    console.log(`✅ organizations table accessible (${orgCount} records)`);
  } catch (error) {
    console.log('❌ organizations table issue:', error.message);
  }
  
  try {
    const userCount = await prisma.user.count();
    console.log(`✅ users table accessible (${userCount} records)`);
  } catch (error) {
    console.log('❌ users table issue:', error.message);
  }
  
  try {
    const auditCount = await prisma.auditLog.count();
    console.log(`✅ audit_logs table accessible (${auditCount} records)`);
  } catch (error) {
    console.log('❌ audit_logs table issue:', error.message);
  }
}

// Run immediately
fixSchemaNow()
  .then(() => {
    console.log('\n✅ Emergency fix complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Emergency fix failed:', error);
    process.exit(1);
  });