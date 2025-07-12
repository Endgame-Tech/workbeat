// Simple database connection test
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query successful:', result);
    
    await prisma.$disconnect();
    console.log('✅ Database disconnected cleanly');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
