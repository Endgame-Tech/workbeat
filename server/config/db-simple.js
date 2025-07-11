const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class SimplePrisma {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, '../prisma/dev.db'));
  }

  async $connect() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT 1', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async $disconnect() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err);
        resolve();
      });
    });
  }

  // Organization methods
  get organization() {
    return {
      findMany: () => this.query('SELECT * FROM Organization'),
      findUnique: (params) => this.query('SELECT * FROM Organization WHERE id = ?', [params.where.id]),
      create: (params) => this.insert('Organization', params.data),
      update: (params) => this.update('Organization', params.data, params.where),
      delete: (params) => this.delete('Organization', params.where)
    };
  }

  // Employee methods
  get employee() {
    return {
      findMany: (params = {}) => {
        let query = 'SELECT * FROM Employee';
        let values = [];
        if (params.where) {
          const conditions = Object.keys(params.where).map(key => `${key} = ?`);
          query += ' WHERE ' + conditions.join(' AND ');
          values = Object.values(params.where);
        }
        return this.query(query, values);
      },
      findUnique: (params) => this.query('SELECT * FROM Employee WHERE id = ?', [params.where.id]),
      create: (params) => this.insert('Employee', params.data),
      update: (params) => this.update('Employee', params.data, params.where),
      delete: (params) => this.delete('Employee', params.where)
    };
  }

  // User methods
  get user() {
    return {
      findMany: () => this.query('SELECT * FROM User'),
      findUnique: (params) => this.query('SELECT * FROM User WHERE id = ?', [params.where.id]),
      findFirst: (params) => this.query('SELECT * FROM User WHERE email = ? LIMIT 1', [params.where.email]),
      create: (params) => this.insert('User', params.data),
      update: (params) => this.update('User', params.data, params.where)
    };
  }

  // Attendance methods
  get attendance() {
    return {
      findMany: (params = {}) => {
        let query = 'SELECT * FROM Attendance';
        let values = [];
        if (params.where) {
          const conditions = Object.keys(params.where).map(key => `${key} = ?`);
          query += ' WHERE ' + conditions.join(' AND ');
          values = Object.values(params.where);
        }
        if (params.orderBy) {
          query += ' ORDER BY ' + Object.keys(params.orderBy)[0] + ' ' + Object.values(params.orderBy)[0];
        }
        return this.query(query, values);
      },
      create: (params) => this.insert('Attendance', params.data)
    };
  }

  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...data });
      });
    });
  }

  update(table, data, where) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const values = [...Object.values(data), ...Object.values(where)];
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve({ ...data, ...where });
      });
    });
  }

  delete(table, where) {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ');
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const values = Object.values(where);
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, values, function(err) {
        if (err) reject(err);
        else resolve({ count: this.changes });
      });
    });
  }
}

const prisma = new SimplePrisma();

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('SQLite Database connected successfully');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB };