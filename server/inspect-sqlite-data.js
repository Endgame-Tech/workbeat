#!/usr/bin/env node

/**
 * SQLite Data Inspection Script
 * Checks what data exists in the SQLite database before migration
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const SQLITE_PATH = path.join(__dirname, 'prisma', 'dev.db');

class SQLiteInspector {
  constructor() {
    this.db = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(SQLITE_PATH, (err) => {
        if (err) {
          console.error('❌ SQLite connection failed:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getTables() {
    const tables = await this.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%' 
      ORDER BY name
    `);
    return tables.map(table => table.name);
  }

  async getTableInfo(tableName) {
    const info = await this.query(`PRAGMA table_info(${tableName})`);
    return info;
  }

  async getRecordCount(tableName) {
    try {
      const result = await this.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      return result[0].count;
    } catch (error) {
      console.error(`Error counting records in ${tableName}:`, error.message);
      return 0;
    }
  }

  async getSampleData(tableName, limit = 3) {
    try {
      const result = await this.query(`SELECT * FROM ${tableName} LIMIT ${limit}`);
      return result;
    } catch (error) {
      console.error(`Error getting sample data from ${tableName}:`, error.message);
      return [];
    }
  }

  async inspect() {
    console.log('🔍 Inspecting SQLite Database...\n');
    
    try {
      await this.connect();
      
      // Get all tables
      const tables = await this.getTables();
      console.log(`📋 Found ${tables.length} tables: ${tables.join(', ')}\n`);
      
      if (tables.length === 0) {
        console.log('⚠️  No tables found in SQLite database');
        return;
      }
      
      // Inspect each table
      for (const tableName of tables) {
        console.log(`\n📊 Table: ${tableName}`);
        console.log('─'.repeat(50));
        
        // Get record count
        const count = await this.getRecordCount(tableName);
        console.log(`📈 Records: ${count}`);
        
        if (count > 0) {
          // Get table structure
          const structure = await this.getTableInfo(tableName);
          console.log(`🏗️  Columns: ${structure.map(col => col.name).join(', ')}`);
          
          // Get sample data
          const sampleData = await this.getSampleData(tableName, 2);
          if (sampleData.length > 0) {
            console.log('📝 Sample data:');
            sampleData.forEach((row, index) => {
              console.log(`   Row ${index + 1}:`, Object.keys(row).slice(0, 3).map(key => `${key}: ${row[key]}`).join(', '));
            });
          }
        } else {
          console.log('   (No records)');
        }
      }
      
      // Summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 Migration Summary:');
      
      let totalRecords = 0;
      for (const tableName of tables) {
        const count = await this.getRecordCount(tableName);
        totalRecords += count;
        if (count > 0) {
          console.log(`   ${tableName}: ${count} records`);
        }
      }
      
      console.log(`\n📈 Total records to migrate: ${totalRecords}`);
      
      if (totalRecords > 0) {
        console.log('\n🚀 Ready for migration!');
        console.log('Next step: Run data migration script');
      } else {
        console.log('\n💡 No data to migrate - you can start with a fresh PostgreSQL database');
      }
      
    } catch (error) {
      console.error('❌ Inspection failed:', error.message);
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }
}

// Run inspection
if (require.main === module) {
  const inspector = new SQLiteInspector();
  inspector.inspect();
}

module.exports = SQLiteInspector;