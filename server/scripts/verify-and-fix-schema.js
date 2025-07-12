#!/usr/bin/env node
/**
 * Schema Verification and Fix Script
 * This script checks if the database schema matches expectations and can fix it
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixSchema() {
  console.log('🔍 Checking database schema...\n');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check if organizations table exists
    console.log('\n📋 Checking tables...');
    try {
      const orgCount = await prisma.organization.count();
      console.log(`✅ organizations table exists (${orgCount} records)`);
    } catch (error) {
      console.log('❌ organizations table missing or inaccessible');
      console.log('Error:', error.message);
      await createMissingTables();
      return;
    }

    // Check if users table has resetPasswordToken column
    console.log('\n🔑 Checking users table schema...');
    try {
      // Try to query with resetPasswordToken field
      await prisma.user.findMany({
        where: { resetPasswordToken: { not: null } },
        take: 1
      });
      console.log('✅ users.resetPasswordToken column exists');
    } catch (error) {
      console.log('❌ users.resetPasswordToken column missing');
      console.log('Error:', error.message);
      await addMissingColumns();
      return;
    }

    // Check other critical tables
    const tables = [
      { name: 'users', model: prisma.user },
      { name: 'employees', model: prisma.employee },
      { name: 'attendances', model: prisma.attendance },
      { name: 'audit_logs', model: prisma.auditLog }
    ];

    for (const table of tables) {
      try {
        const count = await table.model.count();
        console.log(`✅ ${table.name} table exists (${count} records)`);
      } catch (error) {
        console.log(`❌ ${table.name} table missing or inaccessible`);
        console.log('Error:', error.message);
      }
    }

    console.log('\n🎉 Schema check complete!');

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    throw error;
  }
}

async function createMissingTables() {
  console.log('\n🛠️ Creating missing tables...');
  
  try {
    // Run the migration SQL directly
    console.log('Running migration SQL...');
    
    // Create organizations table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "organizations" (
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
    
    // Create unique index
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "organizations_contactEmail_key" ON "organizations"("contactEmail")
    `;
    
    console.log('✅ organizations table created');
    
    // Continue with other tables...
    await createUsersTable();
    
  } catch (error) {
    console.error('❌ Failed to create tables:', error.message);
    throw error;
  }
}

async function createUsersTable() {
  console.log('Creating users table...');
  
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "users" (
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
  
  // Create indexes
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")
  `;
  
  console.log('✅ users table created');
}

async function addMissingColumns() {
  console.log('\n🛠️ Adding missing columns...');
  
  try {
    // Add resetPasswordToken column if missing
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
    console.error('❌ Failed to add columns:', error.message);
    throw error;
  }
}

// Main execution
checkAndFixSchema()
  .then(() => {
    console.log('\n✅ Schema verification complete!');
  })
  .catch((error) => {
    console.error('\n❌ Schema verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });