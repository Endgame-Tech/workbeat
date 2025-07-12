#!/usr/bin/env node

/**
 * Direct PostgreSQL Connection Test
 * Tests connection to your PostgreSQL installation
 */

const { Client } = require('pg');

async function testConnection() {
  console.log('🔍 Testing PostgreSQL Connection...\n');
  
  // Test connection with your password
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'legend',
    database: 'postgres'
  });
  
  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await client.connect();
    
    console.log('✅ Connection successful!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log(`📊 PostgreSQL Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    
    // List databases
    const dbResult = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log(`📋 Databases: ${dbResult.rows.map(row => row.datname).join(', ')}`);
    
    await client.end();
    
    console.log('\n🎉 PostgreSQL is working! Ready to create WorkBeat database.');
    return true;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solutions:');
      console.log('1. Start PostgreSQL service in Windows Services');
      console.log('2. Check if port 5432 is blocked by firewall');
    } else if (error.code === '28P01') {
      console.log('\n💡 Password issue:');
      console.log('1. Verify password is "legend"');
      console.log('2. Try connecting with pgAdmin first');
    }
    
    return false;
  }
}

if (require.main === module) {
  testConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testConnection };