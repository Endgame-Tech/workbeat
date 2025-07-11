#!/usr/bin/env node

/**
 * Database Testing Script
 * Tests database connectivity and basic operations
 */

const config = require('../config/environment.js');
const { connectDB, getDatabaseStats, performHealthCheck } = require('../config/database.js');

async function testDatabase() {
  console.log('🧪 Testing Database Configuration...\n');
  
  try {
    // Test 1: Environment Configuration
    console.log('📋 Environment Configuration:');
    console.log(`   Environment: ${config.app.env}`);
    console.log(`   Database URL: ${config.database.url.replace(/\/\/.*:.*@/, '//***:***@')}`);
    console.log(`   Pool Config: ${config.database.pool.min}-${config.database.pool.max} connections`);
    console.log('');
    
    // Test 2: Database Connection
    console.log('🔗 Testing Database Connection...');
    await connectDB();
    console.log('');
    
    // Test 3: Health Check
    console.log('💚 Running Health Check...');
    await performHealthCheck();
    console.log('');
    
    // Test 4: Database Statistics
    console.log('📊 Database Statistics:');
    const stats = await getDatabaseStats();
    console.log(JSON.stringify(stats, null, 2));
    console.log('');
    
    // Test 5: Basic Query Test
    console.log('🔍 Testing Basic Queries...');
    const { prisma } = require('../config/database.js');
    
    // Test table existence
    try {
      const orgCount = await prisma.organization.count();
      console.log(`   ✅ Organizations table: ${orgCount} records`);
    } catch (error) {
      console.log(`   ❌ Organizations table: ${error.message}`);
    }
    
    try {
      const userCount = await prisma.user.count();
      console.log(`   ✅ Users table: ${userCount} records`);
    } catch (error) {
      console.log(`   ❌ Users table: ${error.message}`);
    }
    
    try {
      const empCount = await prisma.employee.count();
      console.log(`   ✅ Employees table: ${empCount} records`);
    } catch (error) {
      console.log(`   ❌ Employees table: ${error.message}`);
    }
    
    try {
      const attCount = await prisma.attendance.count();
      console.log(`   ✅ Attendance table: ${attCount} records`);
    } catch (error) {
      console.log(`   ❌ Attendance table: ${error.message}`);
    }
    
    console.log('\n✅ All database tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    const { disconnectDB } = require('../config/database.js');
    await disconnectDB();
  }
}

// Run the test
if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase };