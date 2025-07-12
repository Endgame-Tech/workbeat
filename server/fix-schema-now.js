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

    console.log('🔧 Adding missing resetPasswordToken column...');
    
    // Add the missing column directly
    await prisma.$executeRaw`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "resetPasswordToken" VARCHAR(255)
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "resetPasswordExpire" TIMESTAMPTZ(6)
    `;
    
    console.log('✅ Added resetPasswordToken and resetPasswordExpire columns');
    
    // Verify the fix worked
    console.log('🧪 Testing the fix...');
    
    const testQuery = await prisma.user.findMany({
      where: { resetPasswordToken: { not: null } },
      take: 1
    });
    
    console.log('✅ Schema fix successful! resetPasswordToken column is now accessible');
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`📊 Current user count: ${userCount}`);
    
    console.log('\n🎉 Schema is now fixed! Registration should work.');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    
    // Try to get more details about the error
    if (error.message.includes('does not exist')) {
      console.log('\n🔍 Checking what tables exist...');
      try {
        const tables = await prisma.$queryRaw`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        console.log('📋 Available tables:', tables.map(t => t.table_name));
      } catch (e) {
        console.log('Could not list tables:', e.message);
      }
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
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