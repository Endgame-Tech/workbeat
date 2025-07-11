const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db-simple.js');

// Load env vars
dotenv.config();

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
  {    name: 'Jane Smith',
    email: 'jane@workbeat.com',
    department: 'Marketing',
    position: 'Marketing Specialist',
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
  {    name: 'Bob Johnson',
    email: 'bob@workbeat.com',
    department: 'Finance',
    position: 'Financial Analyst',
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
    // Create or find default organization
    let organization = await prisma.organization.findFirst({
      where: { name: 'Default Organization' }
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Default Organization',
          industry: 'Technology',
          contactEmail: 'admin@workbeat.com',
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

    // Clear existing data
    await prisma.user.deleteMany();
    await prisma.employee.deleteMany();

    console.log('Data cleared...');    // Insert employees
    const createdEmployees = await Promise.all(
      employees.map(async (employee) => {
        return prisma.employee.create({
          data: {
            ...employee,
            organizationId: organization.id,
            workSchedule: JSON.stringify(employee.workSchedule),
            workingHours: JSON.stringify(employee.workingHours),
            startDate: new Date(employee.startDate)
          }
        });
      })
    );
    console.log(`${createdEmployees.length} employees imported`);

    // Hash passwords and create users
    const createdUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(user.password, salt);
        
        return prisma.user.create({
          data: {
            name: user.name,
            email: user.email,
            passwordHash,
            role: user.role,
            organizationId: organization.id
          }
        });
      })
    );
    console.log(`${createdUsers.length} users imported`);

    console.log('Data imported successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Delete all data
const deleteData = async () => {
  try {
    await prisma.user.deleteMany();
    await prisma.employee.deleteMany();

    console.log('All data deleted!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    await prisma.$disconnect();
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