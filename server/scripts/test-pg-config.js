#!/usr/bin/env node

/**
 * Test different PostgreSQL connection configurations
 */

const { Client } = require('pg');

async function testConfigs() {
  console.log('🔍 Testing PostgreSQL Configurations...\n');
  
  const configs = [
    { name: '127.0.0.1:5432', host: '127.0.0.1', port: 5432 },
    { name: 'localhost:5432', host: 'localhost', port: 5432 },
    { name: '::1:5432 (IPv6)', host: '::1', port: 5432 },
  ];
  
  for (const config of configs) {
    console.log(`📡 Testing ${config.name}...`);
    
    const client = new Client({
      host: config.host,
      port: config.port,
      user: 'postgres',
      password: 'legend',
      database: 'postgres',
      connectionTimeoutMillis: 5000,
    });
    
    try {
      await client.connect();
      console.log(`✅ ${config.name} - SUCCESS`);
      
      const result = await client.query('SELECT version()');
      console.log(`   Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
      
      await client.end();
      
      console.log(`\n🎯 Use this configuration:`);
      console.log(`   Host: ${config.host}`);
      console.log(`   Port: ${config.port}`);
      return config;
      
    } catch (error) {
      console.log(`❌ ${config.name} - FAILED: ${error.message}`);
    }
  }
  
  console.log('\n⚠️  No working configuration found');
  console.log('💡 Try these solutions:');
  console.log('1. Check Windows Firewall settings');
  console.log('2. Restart PostgreSQL service');
  console.log('3. Check PostgreSQL is listening on 127.0.0.1:5432');
  
  return null;
}

if (require.main === module) {
  testConfigs();
}

module.exports = { testConfigs };