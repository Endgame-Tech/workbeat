#!/usr/bin/env node

/**
 * Test WSL to Windows PostgreSQL Connection
 */

const { Client } = require('pg');

async function testWSLConnection() {
  console.log('🔍 Testing WSL to Windows PostgreSQL...\n');
  
  const windowsIP = '10.255.255.254';
  
  console.log(`📡 Testing connection to ${windowsIP}:5432`);
  
  const client = new Client({
    host: windowsIP,
    port: 5432,
    user: 'workbeat_user',
    password: 'legend',
    database: 'workbeat_dev',
    connectionTimeoutMillis: 10000
  });
  
  try {
    await client.connect();
    console.log('✅ Connection successful!');
    
    const result = await client.query('SELECT current_database(), current_user, version()');
    console.log(`📋 Database: ${result.rows[0].current_database}`);
    console.log(`👤 User: ${result.rows[0].current_user}`);
    console.log(`🔧 Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    
    await client.end();
    
    console.log('\n🎉 WSL can connect to Windows PostgreSQL!');
    console.log(`📝 Update DATABASE_URL to use: ${windowsIP}`);
    
    return windowsIP;
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Configure PostgreSQL to accept connections from WSL');
    console.log('2. Check Windows Firewall settings');
    console.log('3. Use Docker PostgreSQL instead');
    
    return null;
  }
}

if (require.main === module) {
  testWSLConnection();
}

module.exports = { testWSLConnection };