/**
 * Script to create an admin user for WorkBeat
 * Run this script with Node.js: node createAdminUser.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Admin user credentials - Use environment variables for production
const adminUser = {
  name: process.env.ADMIN_NAME || 'Admin',
  email: process.env.ADMIN_EMAIL || 'admin@example.com',
  password: process.env.ADMIN_PASSWORD || 'changeme123',
  role: 'admin'
};

// Function to create admin user
const createAdmin = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database Connected...');

    // Create default organization first
    let organization = await prisma.organization.findFirst({
      where: { name: 'Default Organization' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          industry: 'Technology',
          contactEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
          contactPhone: '+1234567890',
          settings: JSON.stringify({
            workingHours: {
              default: {
                start: '09:00',
                end: '17:00'
              }
            }
          }),
          subscription: JSON.stringify({
            plan: 'trial',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            maxEmployees: 10,
            features: ['basic_attendance', 'admin_dashboard']
          })
        }
      });
      console.log('Default organization created successfully');
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminUser.email }
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists. No need to create a new one.');
    } else {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminUser.password, salt);

      // Create the admin user
      const user = await prisma.user.create({
        data: {
          name: adminUser.name,
          email: adminUser.email,
          passwordHash,
          role: adminUser.role,
          organizationId: organization.id
        }
      });
      console.log(`Admin user created successfully with ID: ${user.id}`);
    }

    // Create a default employee user - Use environment variables for production
    const employeeUser = {
      name: process.env.EMPLOYEE_NAME || 'Employee',
      email: process.env.EMPLOYEE_EMAIL || 'employee@example.com',
      password: process.env.EMPLOYEE_PASSWORD || 'changeme123',
      role: 'employee'
    };

    const existingEmployee = await prisma.user.findUnique({
      where: { email: employeeUser.email }
    });
    
    if (existingEmployee) {
      console.log('Employee user already exists. No need to create a new one.');
    } else {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(employeeUser.password, salt);

      // Create the employee user
      const user = await prisma.user.create({
        data: {
          name: employeeUser.name,
          email: employeeUser.email,
          passwordHash,
          role: employeeUser.role,
          organizationId: organization.id
        }
      });
      console.log(`Employee user created successfully with ID: ${user.id}`);
    }

    // Disconnect from database
    await prisma.$disconnect();
    console.log('Database Disconnected...');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Run the function
createAdmin();