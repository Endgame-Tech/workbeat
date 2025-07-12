#!/usr/bin/env node
/**
 * Database Status Test Script
 * Helps debug production database connection and schema issues
 */

const { prisma } = require('./config/db');

async function testDatabaseStatus() {
  console.log('🔍 Testing database connection and schema...\n');
  
  try {
    // Test basic connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test if tables exist
    console.log('\n2️⃣ Checking if required tables exist...');
    
    const requiredTables = [
      'organizations',
      'users', 
      'employees',
      'attendances',
      'audit_logs'
    ];

    for (const table of requiredTables) {
      try {
        const result = await prisma.$queryRaw`
          SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_name = ${table} AND table_schema = 'public'
        `;
        const exists = parseInt(result[0].count) > 0;
        console.log(`${exists ? '✅' : '❌'} Table "${table}": ${exists ? 'exists' : 'missing'}`);
      } catch (error) {
        console.log(`❌ Error checking table "${table}": ${error.message}`);
      }
    }

    // Test a simple organization query
    console.log('\n3️⃣ Testing organization model...');
    try {
      const orgCount = await prisma.organization.count();
      console.log(`✅ Organizations table accessible. Current count: ${orgCount}`);
    } catch (error) {
      console.log(`❌ Cannot access organizations table: ${error.message}`);
    }

    // Test user model with resetPasswordToken field
    console.log('\n4️⃣ Testing user model with resetPasswordToken...');
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table accessible. Current count: ${userCount}`);
      
      // Test a query that uses resetPasswordToken
      const testQuery = await prisma.user.findMany({
        where: { resetPasswordToken: { not: null } },
        take: 1
      });
      console.log(`✅ resetPasswordToken field accessible`);
    } catch (error) {
      console.log(`❌ Issue with users table or resetPasswordToken: ${error.message}`);
    }

    console.log('\n🎉 Database status check complete!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabaseStatus()
  .catch(console.error)
  .finally(() => process.exit());