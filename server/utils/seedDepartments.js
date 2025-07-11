const { prisma } = require('../config/db.js');

const seedDepartments = async () => {
  try {
    // Get the first organization (for testing)
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.log('No organization found. Please create an organization first.');
      return;
    }

    console.log(`Seeding departments for organization: ${organization.name}`);

    // Sample departments
    const departments = [
      {
        name: 'Engineering',
        description: 'Software development and technical operations',
        organizationId: organization.id
      },
      {
        name: 'Marketing',
        description: 'Marketing, advertising, and brand management',
        organizationId: organization.id
      },
      {
        name: 'Sales',
        description: 'Sales and business development',
        organizationId: organization.id
      },
      {
        name: 'Human Resources',
        description: 'HR operations and employee management',
        organizationId: organization.id
      },
      {
        name: 'Finance',
        description: 'Finance, accounting, and budget management',
        organizationId: organization.id
      }
    ];

    // Create departments
    for (const dept of departments) {
      const existing = await prisma.department.findFirst({
        where: {
          name: dept.name,
          organizationId: dept.organizationId
        }
      });

      if (!existing) {
        await prisma.department.create({
          data: dept
        });
        console.log(`Created department: ${dept.name}`);
      } else {
        console.log(`Department already exists: ${dept.name}`);
      }
    }

    // Update existing employees to link them to departments
    const employees = await prisma.employee.findMany({
      where: { organizationId: organization.id }
    });

    const departmentRecords = await prisma.department.findMany({
      where: { organizationId: organization.id }
    });

    for (const employee of employees) {
      if (employee.department && employee.departmentId === null) {
        const matchingDept = departmentRecords.find(d => 
          d.name.toLowerCase() === employee.department.toLowerCase()
        );

        if (matchingDept) {
          await prisma.employee.update({
            where: { id: employee.id },
            data: { departmentId: matchingDept.id }
          });
          console.log(`Linked ${employee.name} to ${matchingDept.name} department`);
        }
      }
    }

    console.log('Department seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding departments:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  seedDepartments();
}

module.exports = { seedDepartments };