const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db.js');

// Load env vars
dotenv.config();

// Sample data - Remove or replace with environment-specific data for production
const users = [
  // Add admin user creation logic here or use environment variables
  // Example: Process.env.ADMIN_EMAIL, Process.env.ADMIN_PASSWORD
];

const employees = [
  // Add sample employee data here for development only
  // Consider using environment variables or separate dev/prod configs
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
          contactEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
          contactPhone: process.env.ADMIN_PHONE || '+1234567890',
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