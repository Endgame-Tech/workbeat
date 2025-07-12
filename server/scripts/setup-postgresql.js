#!/usr/bin/env node

/**
 * PostgreSQL Database Setup Script
 * 
 * This script helps set up PostgreSQL database for WorkBeat application
 * It can be used for both local development and production deployment
 * 
 * Usage:
 *   node scripts/setup-postgresql.js [options]
 * 
 * Options:
 *   --env <environment>  Specify environment (development, production)
 *   --create-db         Create database if it doesn't exist
 *   --create-user       Create database user
 *   --migrate           Run Prisma migrations
 *   --seed              Seed database with initial data
 *   --reset             Reset database (WARNING: destroys all data)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'development';
const createDB = args.includes('--create-db');
const createUser = args.includes('--create-user');
const migrate = args.includes('--migrate');
const seed = args.includes('--seed');
const reset = args.includes('--reset');

// Logger
const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  step: (msg) => console.log(`\n🔧 ${msg}`)
};

/**
 * Load environment configuration
 */
function loadConfig() {
  const envFile = `.env.${environment}`;
  const envPath = path.join(__dirname, '..', envFile);
  
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    logger.success(`Loaded configuration from ${envFile}`);
  } else {
    logger.warn(`Configuration file ${envFile} not found, using defaults`);
    require('dotenv').config();
  }
  
  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'workbeat_user',
    password: process.env.POSTGRES_PASSWORD || 'workbeat_password',
    database: process.env.POSTGRES_DB || 'workbeat_db',
    databaseUrl: process.env.DATABASE_URL
  };
}

/**
 * Execute shell command
 */
function execCommand(command, description) {
  try {
    logger.info(`Executing: ${description}`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    logger.success(description);
    return output;
  } catch (error) {
    logger.error(`Failed: ${description}`);
    logger.error(error.message);
    return null;
  }
}

/**
 * Check if PostgreSQL is installed and running
 */
function checkPostgreSQL() {
  logger.step('Checking PostgreSQL installation...');
  
  const psqlVersion = execCommand('psql --version', 'Check PostgreSQL client');
  if (!psqlVersion) {
    logger.error('PostgreSQL client not found. Please install PostgreSQL first.');
    logger.info('Install instructions:');
    logger.info('  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib');
    logger.info('  macOS: brew install postgresql');
    logger.info('  Windows: Download from https://www.postgresql.org/download/');
    return false;
  }
  
  logger.success(`PostgreSQL found: ${psqlVersion.trim()}`);
  return true;
}

/**
 * Create PostgreSQL user
 */
function createPostgreSQLUser(config) {
  logger.step('Creating PostgreSQL user...');
  
  const createUserSQL = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${config.user}') THEN
        CREATE ROLE ${config.user} WITH LOGIN PASSWORD '${config.password}';
        ALTER ROLE ${config.user} CREATEDB;
        GRANT ALL PRIVILEGES ON DATABASE postgres TO ${config.user};
      END IF;
    END
    $$;
  `;
  
  const command = `psql -h ${config.host} -p ${config.port} -U postgres -c "${createUserSQL}"`;
  const result = execCommand(command, `Create user ${config.user}`);
  
  if (result !== null) {
    logger.success(`User ${config.user} created successfully`);
    return true;
  }
  
  return false;
}

/**
 * Create PostgreSQL database
 */
function createPostgreSQLDatabase(config) {
  logger.step('Creating PostgreSQL database...');
  
  const createDBSQL = `
    SELECT 'CREATE DATABASE ${config.database}' 
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${config.database}')\\gexec
  `;
  
  const command = `psql -h ${config.host} -p ${config.port} -U ${config.user} -d postgres -c "${createDBSQL}"`;
  const result = execCommand(command, `Create database ${config.database}`);
  
  if (result !== null) {
    logger.success(`Database ${config.database} created successfully`);
    return true;
  }
  
  return false;
}

/**
 * Run Prisma migrations
 */
function runPrismaMigrations() {
  logger.step('Running Prisma migrations...');
  
  // Generate Prisma client
  execCommand('npx prisma generate', 'Generate Prisma client');
  
  // Run migrations
  const result = execCommand('npx prisma migrate deploy', 'Deploy Prisma migrations');
  
  if (result !== null) {
    logger.success('Prisma migrations completed successfully');
    return true;
  }
  
  return false;
}

/**
 * Seed database with initial data
 */
function seedDatabase() {
  logger.step('Seeding database with initial data...');
  
  // Check if seeder exists
  const seederPath = path.join(__dirname, '..', 'utils', 'seeder.js');
  if (fs.existsSync(seederPath)) {
    const result = execCommand('node utils/seeder.js -i', 'Seed database');
    if (result !== null) {
      logger.success('Database seeded successfully');
      return true;
    }
  } else {
    logger.warn('Seeder file not found, skipping database seeding');
    return true;
  }
  
  return false;
}

/**
 * Reset database (dangerous operation)
 */
function resetDatabase() {
  logger.step('Resetting database...');
  logger.warn('THIS WILL DELETE ALL DATA IN THE DATABASE!');
  
  // Ask for confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('Are you sure you want to reset the database? Type "yes" to confirm: ', (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 'yes') {
        const result = execCommand('npx prisma migrate reset --force', 'Reset database');
        if (result !== null) {
          logger.success('Database reset successfully');
          resolve(true);
        } else {
          resolve(false);
        }
      } else {
        logger.info('Database reset cancelled');
        resolve(true);
      }
    });
  });
}

/**
 * Test database connection
 */
function testDatabaseConnection(config) {
  logger.step('Testing database connection...');
  
  const testSQL = 'SELECT version();';
  const command = `psql "${config.databaseUrl}" -c "${testSQL}"`;
  const result = execCommand(command, 'Test database connection');
  
  if (result !== null) {
    logger.success('Database connection successful');
    logger.info(`PostgreSQL version: ${result.trim().split('\n')[2]?.trim()}`);
    return true;
  }
  
  return false;
}

/**
 * Generate environment file template
 */
function generateEnvTemplate(config) {
  logger.step('Generating environment configuration...');
  
  const envContent = `# PostgreSQL Configuration for ${environment}
NODE_ENV=${environment}
DATABASE_URL=postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?schema=public
POSTGRES_HOST=${config.host}
POSTGRES_PORT=${config.port}
POSTGRES_USER=${config.user}
POSTGRES_PASSWORD=${config.password}
POSTGRES_DB=${config.database}
POSTGRES_SSL=${environment === 'production' ? 'true' : 'false'}

# Database Pool Configuration
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_IDLE_TIMEOUT=30000
DATABASE_POOL_CONNECTION_TIMEOUT=10000

# Security Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=change_this_to_a_secure_random_string_at_least_32_characters
SESSION_SECRET=change_this_to_another_secure_random_string
BCRYPT_ROUNDS=12
`;

  const envPath = path.join(__dirname, '..', `.env.${environment}.template`);
  fs.writeFileSync(envPath, envContent);
  logger.success(`Environment template created: .env.${environment}.template`);
}

/**
 * Main setup function
 */
async function main() {
  logger.info(`🚀 Setting up PostgreSQL for WorkBeat (${environment} environment)`);
  
  // Load configuration
  const config = loadConfig();
  
  // Check PostgreSQL installation
  if (!checkPostgreSQL()) {
    process.exit(1);
  }
  
  // Create user if requested
  if (createUser) {
    if (!createPostgreSQLUser(config)) {
      logger.error('Failed to create PostgreSQL user');
      process.exit(1);
    }
  }
  
  // Create database if requested
  if (createDB) {
    if (!createPostgreSQLDatabase(config)) {
      logger.error('Failed to create PostgreSQL database');
      process.exit(1);
    }
  }
  
  // Test connection
  if (!testDatabaseConnection(config)) {
    logger.error('Database connection failed');
    process.exit(1);
  }
  
  // Reset database if requested (dangerous!)
  if (reset) {
    const resetSuccess = await resetDatabase();
    if (!resetSuccess) {
      process.exit(1);
    }
  }
  
  // Run migrations if requested
  if (migrate) {
    if (!runPrismaMigrations()) {
      logger.error('Failed to run Prisma migrations');
      process.exit(1);
    }
  }
  
  // Seed database if requested
  if (seed) {
    if (!seedDatabase()) {
      logger.error('Failed to seed database');
      process.exit(1);
    }
  }
  
  // Generate environment template
  generateEnvTemplate(config);
  
  logger.success('🎉 PostgreSQL setup completed successfully!');
  logger.info('\nNext steps:');
  logger.info('1. Update your .env file with the correct database URL');
  logger.info('2. Run "npm start" to start the application');
  logger.info('3. Test the application with the new PostgreSQL database');
}

// Run the setup
if (require.main === module) {
  main().catch((error) => {
    logger.error(`Setup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main, logger };