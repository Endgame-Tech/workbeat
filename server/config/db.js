const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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