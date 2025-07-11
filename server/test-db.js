// Test script to verify controller fixes
const { prisma } = require('./config/db');

console.log('Testing database connection...');

async function testDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test employees query
    console.log('Testing employees query...');
    const employees = await prisma.employee.findMany({
      where: { organizationId: 4 },
      include: {
        _count: {
          select: {
            attendances: true
          }
        }
      },
      take: 5
    });
    console.log(`✅ Employees query successful. Found ${employees.length} employees`);
    
    // List available models
    console.log('\n📋 Available Prisma models:');
    const models = Object.keys(prisma).filter(key => 
      typeof prisma[key] === 'object' && 
      prisma[key].findMany && 
      !key.startsWith('$') && 
      key !== '_engine' && 
      key !== '_fetcher'
    );
    models.forEach(model => console.log(`  - ${model}`));
    
    await prisma.$disconnect();
    console.log('\n✅ Database test completed successfully');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();
