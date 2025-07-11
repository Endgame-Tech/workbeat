#!/usr/bin/env node

/**
 * Simple WorkBeat Database Creator
 * Creates database and user using postgres superuser
 */

const { Client } = require('pg');

async function createWorkBeatDB() {
  console.log('🔧 Creating WorkBeat Database...\n');
  
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
    console.log('✅ Connected successfully');
    
    // Create user if not exists
    console.log('👤 Creating workbeat_user...');
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'workbeat_user') THEN
          CREATE USER workbeat_user WITH PASSWORD 'legend';
        END IF;
      END $$;
    `);
    console.log('✅ User ready');
    
    // Create database if not exists
    console.log('🗄️  Creating workbeat_dev database...');
    try {
      await client.query(`CREATE DATABASE workbeat_dev OWNER workbeat_user;`);
      console.log('✅ Database created');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️  Database already exists');
      } else {
        throw error;
      }
    }
    
    // Grant privileges
    console.log('🔐 Setting permissions...');
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE workbeat_dev TO workbeat_user;`);
    console.log('✅ Permissions set');
    
    await client.end();
    
    console.log('\n🎉 WorkBeat database setup complete!');
    console.log('📋 Ready to run migration');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed:', error.message);
    if (client._connected) {
      await client.end();
    }
    return false;
  }
}

if (require.main === module) {
  createWorkBeatDB();
}

module.exports = { createWorkBeatDB };