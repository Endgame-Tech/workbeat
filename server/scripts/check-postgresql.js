#!/usr/bin/env node

/**
 * PostgreSQL Availability Checker
 * This script checks if PostgreSQL is available and properly configured
 */

const { execSync } = require('child_process');
const { Client } = require('pg');

// Logger
const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  step: (msg) => console.log(`\n🔧 ${msg}`)
};

/**
 * Check if PostgreSQL client is installed
 */
function checkPostgreSQLClient() {
  logger.step('Checking PostgreSQL client installation...');
  
  try {
    const version = execSync('psql --version', { encoding: 'utf8' });
    logger.success(`PostgreSQL client found: ${version.trim()}`);
    return true;
  } catch (error) {
    logger.error('PostgreSQL client not found');
    logger.info('Please install PostgreSQL:');
    logger.info('  Windows: https://www.postgresql.org/download/windows/');
    logger.info('  WSL/Ubuntu: sudo apt install postgresql-client');
    logger.info('  macOS: brew install postgresql');
    return false;
  }
}

/**
 * Test PostgreSQL connection
 */
async function testPostgreSQLConnection() {
  logger.step('Testing PostgreSQL connection...');
  
  // Default connection for testing PostgreSQL availability
  const testClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres', // Common default
    database: 'postgres'
  });
  
  try {
    await testClient.connect();
    const result = await testClient.query('SELECT version()');
    await testClient.end();
    
    logger.success('PostgreSQL server is running');
    logger.info(`Version: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
    return true;
  } catch (error) {
    logger.error(`PostgreSQL connection failed: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      logger.info('PostgreSQL server is not running or not installed');
      logger.info('Please start PostgreSQL service:');
      logger.info('  Windows: Services → PostgreSQL (start service)');
      logger.info('  WSL/Ubuntu: sudo systemctl start postgresql');
      logger.info('  macOS: brew services start postgresql');
    } else if (error.code === '28P01') {
      logger.warn('Authentication failed - this is normal for initial setup');
      logger.info('PostgreSQL server is running but needs user configuration');
      return true; // Server is running, just needs setup
    }
    
    return false;
  }
}

/**
 * Test WorkBeat database connection
 */
async function testWorkBeatConnection() {
  logger.step('Testing WorkBeat database connection...');
  
  const workbeatClient = new Client({
    host: 'localhost',
    port: 5432,
    user: 'workbeat_user',
    password: 'workbeat_secure_password_123',
    database: 'workbeat_dev'
  });
  
  try {
    await workbeatClient.connect();
    const result = await workbeatClient.query('SELECT NOW()');
    await workbeatClient.end();
    
    logger.success('WorkBeat database connection successful');
    logger.info(`Database time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.warn(`WorkBeat database not ready: ${error.message}`);
    
    if (error.code === '3D000') {
      logger.info('Database "workbeat_dev" does not exist - needs to be created');
    } else if (error.code === '28P01') {
      logger.info('User "workbeat_user" authentication failed - needs to be created');
    }
    
    return false;
  }
}

/**
 * Provide setup instructions
 */
function provideSetupInstructions() {
  logger.step('Setup Instructions:');
  
  logger.info('1. Install PostgreSQL (if not already installed):');
  logger.info('   See INSTALL_POSTGRESQL.md for detailed instructions');
  logger.info('');
  
  logger.info('2. Create WorkBeat user and database:');
  logger.info('   psql -U postgres -c "CREATE USER workbeat_user WITH PASSWORD \'workbeat_secure_password_123\';"');
  logger.info('   psql -U postgres -c "CREATE DATABASE workbeat_dev OWNER workbeat_user;"');
  logger.info('   psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE workbeat_dev TO workbeat_user;"');
  logger.info('');
  
  logger.info('3. Run automated setup script:');
  logger.info('   node scripts/setup-postgresql.js --env=local --create-user --create-db --migrate');
  logger.info('');
  
  logger.info('4. Test the setup:');
  logger.info('   NODE_ENV=local node scripts/test-database.js');
}

/**
 * Main function
 */
async function main() {
  logger.info('🔍 Checking PostgreSQL Setup for WorkBeat...\n');
  
  let allGood = true;
  
  // Check 1: PostgreSQL Client
  const clientAvailable = checkPostgreSQLClient();
  if (!clientAvailable) allGood = false;
  
  // Check 2: PostgreSQL Server
  const serverRunning = await testPostgreSQLConnection();
  if (!serverRunning) allGood = false;
  
  // Check 3: WorkBeat Database
  const workbeatReady = await testWorkBeatConnection();
  if (!workbeatReady) allGood = false;
  
  logger.step('Summary:');
  logger.info(`PostgreSQL Client: ${clientAvailable ? '✅' : '❌'}`);
  logger.info(`PostgreSQL Server: ${serverRunning ? '✅' : '❌'}`);
  logger.info(`WorkBeat Database: ${workbeatReady ? '✅' : '❌'}`);
  
  if (allGood) {
    logger.success('\n🎉 PostgreSQL is ready for WorkBeat!');
    logger.info('You can now run: NODE_ENV=local npm start');
  } else {
    logger.warn('\n⚠️  PostgreSQL setup is incomplete');
    provideSetupInstructions();
  }
  
  return allGood;
}

// Run the check
if (require.main === module) {
  main().catch(error => {
    logger.error(`Check failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };