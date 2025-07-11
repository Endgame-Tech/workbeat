#!/usr/bin/env node

/**
 * Schema Comparison Script
 * Compares SQLite and PostgreSQL schemas to identify column differences
 */

const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const path = require('path');

const SQLITE_PATH = path.join(__dirname, 'prisma', 'dev.db');
const PG_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'workbeat_user',
  password: 'legend',
  database: 'workbeat_dev'
};

class SchemaComparer {
  constructor() {
    this.sqliteDb = null;
    this.pgClient = null;
  }

  async connect() {
    console.log('🔗 Connecting to databases...');
    
    // Connect to SQLite
    this.sqliteDb = new sqlite3.Database(SQLITE_PATH, (err) => {
      if (err) throw err;
    });
    
    // Connect to PostgreSQL
    this.pgClient = new Client(PG_CONFIG);
    await this.pgClient.connect();
    console.log('✅ Connected to both databases');
  }

  async querySQLite(sql) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getSQLiteTables() {
    const tables = await this.querySQLite(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'
      ORDER BY name
    `);
    return tables.map(t => t.name);
  }

  async getPostgreSQLTables() {
    const result = await this.pgClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    return result.rows.map(row => row.table_name);
  }

  async getSQLiteColumns(tableName) {
    const columns = await this.querySQLite(`PRAGMA table_info(${tableName})`);
    return columns.map(col => col.name);
  }

  async getPostgreSQLColumns(tableName) {
    const result = await this.pgClient.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows.map(row => row.column_name);
  }

  async compareSchemas() {
    console.log('🔍 Comparing SQLite and PostgreSQL Schemas...\n');
    
    try {
      await this.connect();
      
      const sqliteTables = await this.getSQLiteTables();
      const pgTables = await this.getPostgreSQLTables();
      
      console.log('📋 Tables Comparison:');
      console.log(`SQLite: ${sqliteTables.length} tables`);
      console.log(`PostgreSQL: ${pgTables.length} tables\n`);
      
      // Focus on tables that exist in both databases
      const commonTables = sqliteTables.filter(table => {
        // Convert to lowercase and check variations
        const lowerTable = table.toLowerCase();
        return pgTables.some(pgTable => 
          pgTable === lowerTable || 
          pgTable === lowerTable + 's' || 
          pgTable === lowerTable.replace(/([A-Z])/g, '_$1').toLowerCase().substring(1) ||
          pgTable === 'daily_attendances' && lowerTable === 'dailyattendance' ||
          pgTable === 'audit_logs' && lowerTable === 'auditlog'
        );
      });
      
      console.log(`🔗 Common tables to migrate: ${commonTables.length}\n`);
      
      const schemaDifferences = {};
      
      for (const sqliteTable of commonTables) {
        // Find corresponding PostgreSQL table
        let pgTable = sqliteTable.toLowerCase();
        if (!pgTables.includes(pgTable)) {
          // Try with 's' suffix
          if (pgTables.includes(pgTable + 's')) {
            pgTable = pgTable + 's';
          }
          // Try snake_case conversion
          else {
            const snakeCase = sqliteTable.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (pgTables.includes(snakeCase)) {
              pgTable = snakeCase;
            } else if (pgTables.includes(snakeCase.substring(1))) {
              pgTable = snakeCase.substring(1);
            }
            // Special cases
            else if (sqliteTable === 'DailyAttendance' && pgTables.includes('daily_attendances')) {
              pgTable = 'daily_attendances';
            } else if (sqliteTable === 'AuditLog' && pgTables.includes('audit_logs')) {
              pgTable = 'audit_logs';
            }
          }
        }
        
        if (!pgTables.includes(pgTable)) {
          console.log(`⚠️  No PostgreSQL table found for SQLite table: ${sqliteTable}`);
          continue;
        }
        
        console.log(`\n🔍 Comparing: ${sqliteTable} → ${pgTable}`);
        console.log('─'.repeat(50));
        
        const sqliteColumns = await this.getSQLiteColumns(sqliteTable);
        const pgColumns = await this.getPostgreSQLColumns(pgTable);
        
        console.log(`SQLite columns (${sqliteColumns.length}): ${sqliteColumns.join(', ')}`);
        console.log(`PostgreSQL columns (${pgColumns.length}): ${pgColumns.join(', ')}`);
        
        // Find missing columns
        const missingInPG = sqliteColumns.filter(col => !pgColumns.includes(col));
        const extraInPG = pgColumns.filter(col => !sqliteColumns.includes(col));
        
        if (missingInPG.length > 0) {
          console.log(`❌ Missing in PostgreSQL: ${missingInPG.join(', ')}`);
        }
        
        if (extraInPG.length > 0) {
          console.log(`➕ Extra in PostgreSQL: ${extraInPG.join(', ')}`);
        }
        
        if (missingInPG.length === 0 && extraInPG.length === 0) {
          console.log('✅ Schemas match perfectly');
        }
        
        // Store differences for migration script
        schemaDifferences[sqliteTable] = {
          pgTable,
          sqliteColumns,
          pgColumns,
          missingInPG,
          extraInPG
        };
      }
      
      // Generate migration mapping
      console.log('\n' + '='.repeat(60));
      console.log('📝 Migration Mapping Summary:');
      console.log('─'.repeat(60));
      
      for (const [sqliteTable, diff] of Object.entries(schemaDifferences)) {
        if (diff.missingInPG.length > 0) {
          console.log(`\n${sqliteTable} → ${diff.pgTable}:`);
          console.log(`  ❌ Missing columns: ${diff.missingInPG.join(', ')}`);
          
          // Suggest column mappings
          for (const missingCol of diff.missingInPG) {
            const suggestions = diff.pgColumns.filter(pgCol => 
              pgCol.toLowerCase().includes(missingCol.toLowerCase()) ||
              missingCol.toLowerCase().includes(pgCol.toLowerCase())
            );
            
            if (suggestions.length > 0) {
              console.log(`     💡 ${missingCol} → ${suggestions.join(' or ')}`);
            }
          }
        }
      }
      
      return schemaDifferences;
      
    } catch (error) {
      console.error('❌ Schema comparison failed:', error.message);
      throw error;
    } finally {
      if (this.sqliteDb) this.sqliteDb.close();
      if (this.pgClient) await this.pgClient.end();
    }
  }
}

// Run comparison
if (require.main === module) {
  const comparer = new SchemaComparer();
  comparer.compareSchemas();
}

module.exports = SchemaComparer;