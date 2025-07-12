#!/usr/bin/env node
/**
 * Force Migration Script
 * This script forces the migration to run even if Prisma thinks it's already applied
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Force applying database migrations...\n');

try {
  // Change to the server directory
  process.chdir(__dirname);
  process.chdir('..');
  
  console.log('📍 Current directory:', process.cwd());
  console.log('📄 Checking for schema file...');
  
  // Check if schema exists
  const fs = require('fs');
  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('Prisma schema file not found at: ' + schemaPath);
  }
  console.log('✅ Schema file found');
  
  // Check migration directory
  const migrationDir = path.join(process.cwd(), 'prisma', 'migrations');
  if (!fs.existsSync(migrationDir)) {
    throw new Error('Migrations directory not found at: ' + migrationDir);
  }
  console.log('✅ Migrations directory found');
  
  // List migration files
  const migrations = fs.readdirSync(migrationDir);
  console.log('📁 Available migrations:', migrations);
  
  console.log('\n🔄 Running migration deployment...');
  
  // Force reset and apply migrations
  console.log('Step 1: Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\nStep 2: Deploying migrations...');
  execSync('npx prisma migrate deploy --accept-data-loss', { stdio: 'inherit' });
  
  console.log('\nStep 3: Regenerating client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n✅ Migration force deployment complete!');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('\n📋 Troubleshooting steps:');
  console.error('1. Check DATABASE_URL environment variable');
  console.error('2. Ensure PostgreSQL database is accessible');
  console.error('3. Verify database user has CREATE/ALTER permissions');
  console.error('4. Check if migration files are correct');
  
  process.exit(1);
}