#!/usr/bin/env node

/**
 * Test PostgreSQL Setup for WorkBeat
 * This script tests if PostgreSQL is ready for WorkBeat
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function testPostgreSQLSetup() {
  console.log('🧪 Testing PostgreSQL Setup for WorkBeat...\n');
  
  // Test configuration
  const config = {
    host: 'localhost',
    port: 5432,
    user: 'workbeat_user',
    password: 'legend',
    database: 'workbeat_dev'
  };
  
  const client = new Client(config);
  
  try {
    // Test 1: Connection
    console.log('🔗 Testing database connection...');
    await client.connect();
    console.log('✅ Connection successful');
    
    // Test 2: Basic query
    console.log('\n🔍 Testing basic query...');
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ PostgreSQL Version: ${versionResult.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    
    // Test 3: List tables
    console.log('\n📋 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`✅ Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Test 4: Test table operations
    console.log('\n⚙️  Testing table operations...');
    
    // Test organizations table
    await client.query('SELECT COUNT(*) FROM organizations');
    console.log('✅ Organizations table accessible');
    
    // Test users table
    await client.query('SELECT COUNT(*) FROM users');
    console.log('✅ Users table accessible');
    
    // Test employees table
    await client.query('SELECT COUNT(*) FROM employees');
    console.log('✅ Employees table accessible');
    
    // Test attendances table
    await client.query('SELECT COUNT(*) FROM attendances');
    console.log('✅ Attendances table accessible');
    
    // Test 5: Check if SQLite database exists
    console.log('\n📂 Checking SQLite database...');
    const sqlitePath = path.join(__dirname, 'prisma', 'dev.db');
    if (fs.existsSync(sqlitePath)) {
      console.log(`✅ SQLite database found at: ${sqlitePath}`);
      console.log('📝 Ready for data migration');
    } else {
      console.log('⚠️  SQLite database not found - no data to migrate');
    }
    
    // Test 6: Environment check
    console.log('\n⚙️  Checking environment configuration...');
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      console.log('✅ Environment file (.env.local) found');
    } else {
      console.log('⚠️  Environment file (.env.local) not found');
    }
    
    await client.end();
    
    console.log('\n🎉 PostgreSQL Setup Complete!');
    console.log('📋 Summary:');
    console.log('   ✅ PostgreSQL installed and running');
    console.log('   ✅ Database and user created');
    console.log('   ✅ Schema tables created');
    console.log('   ✅ Connection working');
    console.log('   ✅ Ready for application');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Test the application: NODE_ENV=local npm start');
    console.log('2. Access at: http://localhost:5000');
    console.log('3. Frontend at: http://localhost:5173');
    
    return true;
    
  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solutions:');
      console.log('1. Start PostgreSQL service');
      console.log('2. Check firewall settings');
      console.log('3. Verify PostgreSQL is listening on port 5432');
    } else if (error.code === '28P01') {
      console.log('\n💡 Authentication issue:');
      console.log('1. Check username/password');
      console.log('2. Verify user permissions');
    } else if (error.code === '42P01') {
      console.log('\n💡 Table missing:');
      console.log('1. Run schema creation script');
      console.log('2. Check table names match exactly');
    }
    
    if (client._connected) {
      await client.end();
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testPostgreSQLSetup().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testPostgreSQLSetup };