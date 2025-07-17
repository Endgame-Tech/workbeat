#!/usr/bin/env node
/**
 * Emergency Minimal Server
 * Simplified server with essential routes only
 */

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

console.log('🚨 Starting emergency minimal server...');

// Trust proxy for Render
app.set('trust proxy', 1);

// CORS configuration for production
app.use(cors({
  origin: [
    'https://workbeat.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://workbeat-api.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Emergency WorkBeat API is running',
    timestamp: new Date().toISOString(),
    status: 'minimal'
  });
});

// Database health
app.get('/api/health/db', async (req, res) => {
  try {
    await prisma.$connect();
    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    res.json({
      status: 'healthy',
      organizations: orgCount,
      users: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Organization routes
app.get('/api/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await prisma.organization.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({ data: organization });
  } catch (error) {
    console.error('Organization fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Also mount on /organizations (without /api)
app.get('/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await prisma.organization.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({ data: organization });
  } catch (error) {
    console.error('Organization fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Organization registration route
app.post('/api/organizations/register', async (req, res) => {
  try {
    const { name, adminName, adminEmail, adminPassword } = req.body;
    
    // Simple validation
    if (!name || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ 
        error: 'Organization name, admin name, email and password are required' 
      });
    }
    
    // For emergency server, return mock successful registration
    res.json({
      success: true,
      data: {
        organization: {
          id: 8,
          name: name,
          createdAt: new Date().toISOString()
        },
        admin: {
          id: 1,
          name: adminName,
          email: adminEmail,
          role: 'admin',
          organizationId: 8,
          organization: {
            id: 8,
            name: name
          }
        },
        token: 'mock-token-for-emergency-server'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employee routes
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      take: 100 // Limit to prevent large responses
    });
    res.json({ data: employees });
  } catch (error) {
    console.error('Employee fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User auth login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // For emergency server, return mock successful login
    res.json({
      success: true,
      data: {
        id: 1,
        name: 'Test User',
        email: email,
        role: 'admin',
        organizationId: 8,
        organization: {
          id: 8,
          name: 'Test Organization'
        }
      },
      token: 'mock-token-for-emergency-server'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User auth register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    
    // For emergency server, return mock successful registration
    res.json({
      success: true,
      data: {
        id: 2,
        name: name,
        email: email,
        organizationId: 8
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User auth logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User auth check
app.get('/api/auth/me', async (req, res) => {
  try {
    // Simple response for now
    res.json({
      data: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        organizationId: 8
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚨 Emergency server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down emergency server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down emergency server...');
  await prisma.$disconnect();
  process.exit(0);
});