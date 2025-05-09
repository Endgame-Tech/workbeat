const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db.js');
const User = require('../models/userModel.js');
const Employee = require('../models/employeeModel.js');

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@workbeat.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Test Employee',
    email: 'employee@workbeat.com',
    password: 'employee123',
    role: 'employee'
  }
];

const employees = [
  {
    name: 'John Doe',
    email: 'john@workbeat.com',
    department: 'Engineering',
    position: 'Software Developer',
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    isActive: true,
    employeeId: 'EMP-001',
    phone: '+1234567890',
    workSchedule: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: {
        start: '09:00',
        end: '17:00'
      }
    },
    startDate: '2023-01-15',
    employmentStatus: 'full-time',
    accessLevel: 'employee'
  },
  {
    name: 'Jane Smith',
    email: 'jane@workbeat.com',
    department: 'Marketing',
    position: 'Marketing Specialist',
    workingHours: {
      start: '09:30',
      end: '17:30'
    },
    isActive: true,
    employeeId: 'EMP-002',
    phone: '+1987654321',
    workSchedule: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: {
        start: '09:30',
        end: '17:30'
      }
    },
    startDate: '2023-02-01',
    employmentStatus: 'full-time',
    accessLevel: 'employee'
  },
  {
    name: 'Bob Johnson',
    email: 'bob@workbeat.com',
    department: 'Finance',
    position: 'Financial Analyst',
    workingHours: {
      start: '08:00',
      end: '16:00'
    },
    isActive: true,
    employeeId: 'EMP-003',
    phone: '+1122334455',
    workSchedule: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: {
        start: '08:00',
        end: '16:00'
      }
    },
    startDate: '2023-03-15',
    employmentStatus: 'full-time',
    accessLevel: 'employee'
  }
];

// Import data to database
const importData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Employee.deleteMany();

    console.log('Data cleared...');

    // Insert employees
    const createdEmployees = await Employee.insertMany(employees);
    console.log(`${createdEmployees.length} employees imported`);

    // Hash passwords before saving
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        return user;
      })
    );

    // Create users
    await User.insertMany(hashedUsers);
    console.log(`${users.length} users imported`);

    console.log('Data imported successfully!');
    process.exit();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// Delete all data
const deleteData = async () => {
  try {
    await User.deleteMany();
    await Employee.deleteMany();

    console.log('All data deleted!');
    process.exit();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

// Process command line arguments
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Invalid command. Use -i to import or -d to delete data');
  process.exit();
}