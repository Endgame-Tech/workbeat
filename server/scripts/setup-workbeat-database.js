#!/usr/bin/env node

/**
 * WorkBeat Database Setup Script
 * Creates database and user for WorkBeat application
 */

const { Client } = require('pg');

async function setupWorkBeatDatabase() {
  console.log('🔧 Setting up WorkBeat Database...\n');
  
  // Connect as postgres superuser
  const adminClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'legend',
    database: 'postgres'
  });
  
  try {
    await adminClient.connect();
    console.log('✅ Connected as postgres superuser');
    
    // Create workbeat_user
    console.log('👤 Creating workbeat_user...');
    try {
      await adminClient.query(`
        CREATE USER workbeat_user WITH PASSWORD 'workbeat_secure_password_123';
      `);
      console.log('✅ User workbeat_user created');
    } catch (error) {
      if (error.code === '42710') {
        console.log('ℹ️  User workbeat_user already exists');
      } else {
        throw error;
      }
    }
    
    // Create workbeat_dev database
    console.log('🗄️  Creating workbeat_dev database...');
    try {
      await adminClient.query(`
        CREATE DATABASE workbeat_dev OWNER workbeat_user;
      `);
      console.log('✅ Database workbeat_dev created');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️  Database workbeat_dev already exists');
      } else {
        throw error;
      }
    }
    
    // Grant privileges
    console.log('🔐 Granting privileges...');
    await adminClient.query(`
      GRANT ALL PRIVILEGES ON DATABASE workbeat_dev TO workbeat_user;
    `);
    console.log('✅ Privileges granted');
    
    await adminClient.end();
    
    // Test workbeat_user connection
    console.log('\n🧪 Testing workbeat_user connection...');
    const workbeatClient = new Client({
      host: 'localhost',
      port: 5432,
      user: 'workbeat_user',
      password: 'workbeat_secure_password_123',
      database: 'workbeat_dev'
    });
    
    await workbeatClient.connect();
    const result = await workbeatClient.query('SELECT current_database(), current_user;');
    console.log(`✅ Connected to: ${result.rows[0].current_database} as ${result.rows[0].current_user}`);
    
    await workbeatClient.end();
    
    console.log('\n🎉 WorkBeat database setup complete!');
    console.log('📋 Connection Details:');
    console.log('   Host: localhost');
    console.log('   Port: 5432');
    console.log('   Database: workbeat_dev');
    console.log('   User: workbeat_user');
    console.log('   Password: workbeat_secure_password_123');
    
    return true;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  setupWorkBeatDatabase().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupWorkBeatDatabase };