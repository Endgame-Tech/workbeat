const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seedNewFeatures = async () => {
  try {
    console.log('🌱 Seeding new features data...');

    // Get the first organization to seed data for
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      console.log('❌ No organization found. Please create an organization first.');
      return;
    }

    console.log(`📊 Seeding data for organization: ${organization.name}`);

    // Seed Leave Types
    console.log('📋 Creating leave types...');
    const leaveTypes = await Promise.all([
      prisma.leaveType.upsert({
        where: { id: 1 },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'Annual Leave',
          annualAllocation: 20,
          requiresApproval: true,
          adviceNoticeDays: 7,
          isActive: true
        }
      }),
      prisma.leaveType.upsert({
        where: { id: 2 },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'Sick Leave',
          annualAllocation: 10,
          requiresApproval: false,
          adviceNoticeDays: 1,
          isActive: true
        }
      }),
      prisma.leaveType.upsert({
        where: { id: 3 },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'Personal Leave',
          annualAllocation: 5,
          requiresApproval: true,
          adviceNoticeDays: 3,
          isActive: true
        }
      }),
      prisma.leaveType.upsert({
        where: { id: 4 },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'Emergency Leave',
          annualAllocation: 3,
          requiresApproval: false,
          adviceNoticeDays: 0,
          isActive: true
        }
      }),
      prisma.leaveType.upsert({
        where: { id: 5 },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'Maternity/Paternity Leave',
          annualAllocation: 90,
          requiresApproval: true,
          adviceNoticeDays: 30,
          isActive: true
        }
      })
    ]);

    console.log(`✅ Created ${leaveTypes.length} leave types`);

    // Seed Shift Templates
    console.log('🕐 Creating shift templates...');
    const shiftTemplates = await Promise.all([
      prisma.shiftTemplate.upsert({
        where: { id: 1 },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'Morning Shift',
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          daysOfWeek: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
        }
      }),
      prisma.shiftTemplate.upsert({
        where: { id: 2 },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'Evening Shift',
          startTime: '14:00',
          endTime: '22:00',
          breakDuration: 60,
          daysOfWeek: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
        }
      }),
      prisma.shiftTemplate.upsert({
        where: { id: 3 },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'Night Shift',
          startTime: '22:00',
          endTime: '06:00',
          breakDuration: 60,
          daysOfWeek: JSON.stringify(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'])
        }
      }),
      prisma.shiftTemplate.upsert({
        where: { id: 4 },
        update: {},
        create: {
          organizationId: organization.id,
          name: 'Weekend Shift',
          startTime: '10:00',
          endTime: '18:00',
          breakDuration: 60,
          daysOfWeek: JSON.stringify(['saturday', 'sunday'])
        }
      })
    ]);

    console.log(`✅ Created ${shiftTemplates.length} shift templates`);

    // Seed Notification Templates
    console.log('🔔 Creating notification templates...');
    const notificationTemplates = await Promise.all([
      prisma.notificationTemplate.upsert({
        where: { id: 1 },
        update: {},
        create: {
          organizationId: organization.id,
          type: 'late_arrival',
          subject: 'Late Arrival Alert - {{employeeName}}',
          bodyTemplate: `Dear Manager,

{{employeeName}} from {{department}} arrived late today at {{arrivalTime}}. Expected arrival time was {{expectedTime}}.

Date: {{date}}
${organization.name ? `Reason: {{reason}}` : ''}

Please follow up as necessary.

Best regards,
WorkBeat Attendance System`
        }
      }),
      prisma.notificationTemplate.upsert({
        where: { id: 2 },
        update: {},
        create: {
          organizationId: organization.id,
          type: 'leave_request',
          subject: 'New Leave Request - {{employeeName}}',
          bodyTemplate: `A new leave request has been submitted:

Employee: {{employeeName}}
Department: {{department}}
Leave Type: {{leaveType}}
Dates: {{startDate}} to {{endDate}}
Duration: {{daysRequested}} days
Reason: {{reason}}

Please review and approve/reject this request in the WorkBeat system.

Thank you,
WorkBeat System`
        }
      }),
      prisma.notificationTemplate.upsert({
        where: { id: 3 },
        update: {},
        create: {
          organizationId: organization.id,
          type: 'leave_approved',
          subject: 'Leave Request Approved - {{leaveType}}',
          bodyTemplate: `Dear {{employeeName}},

Your leave request has been approved:

Leave Type: {{leaveType}}
Dates: {{startDate}} to {{endDate}}
Approved by: {{approverName}}

Please ensure proper handover of responsibilities before your leave.

Best regards,
{{organizationName || 'WorkBeat Team'}}`
        }
      }),
      prisma.notificationTemplate.upsert({
        where: { id: 4 },
        update: {},
        create: {
          organizationId: organization.id,
          type: 'leave_rejected',
          subject: 'Leave Request Declined - {{leaveType}}',
          bodyTemplate: `Dear {{employeeName}},

Unfortunately, your leave request has been declined:

Leave Type: {{leaveType}}
Dates: {{startDate}} to {{endDate}}
Reason for rejection: {{rejectionReason}}

Please contact your manager for more details or to discuss alternative dates.

Best regards,
{{organizationName || 'WorkBeat Team'}}`
        }
      }),
      prisma.notificationTemplate.upsert({
        where: { id: 5 },
        update: {},
        create: {
          organizationId: organization.id,
          type: 'shift_reminder',
          subject: 'Upcoming Shift Reminder - {{shiftName}}',
          bodyTemplate: `Dear {{employeeName}},

This is a reminder about your upcoming shift:

Shift: {{shiftName}}
Date: {{shiftDate}}
Time: {{startTime}} - {{endTime}}

Please ensure you arrive on time and are prepared for your shift.

Best regards,
{{organizationName || 'WorkBeat Team'}}`
        }
      }),
      prisma.notificationTemplate.upsert({
        where: { id: 6 },
        update: {},
        create: {
          organizationId: organization.id,
          type: 'weekly_summary',
          subject: 'Weekly Attendance Summary - {{weekStart}} to {{weekEnd}}',
          bodyTemplate: `Weekly Attendance Summary

Week: {{weekStart}} to {{weekEnd}}
Department: {{department}}

Summary:
- Total Hours Worked: {{totalHours}}
- Attendance Rate: {{attendanceRate}}
- Late Arrivals: {{lateArrivals}}

This is an automated summary from WorkBeat attendance system.

Best regards,
WorkBeat Team`
        }
      })
    ]);

    console.log(`✅ Created ${notificationTemplates.length} notification templates`);

    // Get active employees to create leave balances for
    const employees = await prisma.employee.findMany({
      where: {
        organizationId: organization.id,
        isActive: true
      }
    });

    if (employees.length > 0) {
      console.log(`👥 Creating leave balances for ${employees.length} employees...`);
      
      const currentYear = new Date().getFullYear();
      const leaveBalances = [];

      for (const employee of employees) {
        for (const leaveType of leaveTypes) {
          // Check if balance already exists
          const existingBalance = await prisma.leaveBalance.findFirst({
            where: {
              employeeId: employee.id,
              leaveTypeId: leaveType.id,
              year: currentYear
            }
          });

          if (!existingBalance) {
            leaveBalances.push({
              employeeId: employee.id,
              organizationId: organization.id,
              leaveTypeId: leaveType.id,
              allocatedDays: leaveType.annualAllocation,
              usedDays: 0,
              pendingDays: 0,
              year: currentYear
            });
          }
        }
      }

      if (leaveBalances.length > 0) {
        await prisma.leaveBalance.createMany({
          data: leaveBalances
        });
        console.log(`✅ Created ${leaveBalances.length} leave balance records`);
      } else {
        console.log('✅ Leave balances already exist for current year');
      }

      // Create sample leave requests
      console.log('📝 Creating sample leave requests...');
      
      const sampleRequests = [];
      const today = new Date();
      const futureDate1 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
      const futureDate2 = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000); // 3 weeks from now

      // Sample leave request 1
      if (employees.length > 0 && leaveTypes.length > 0) {
        sampleRequests.push({
          employeeId: employees[0].id,
          organizationId: organization.id,
          leaveTypeId: leaveTypes[0].id, // Annual Leave
          startDate: futureDate1,
          endDate: new Date(futureDate1.getTime() + 4 * 24 * 60 * 60 * 1000), // 5 days
          daysRequested: 5,
          reason: 'Family vacation',
          status: 'pending'
        });
      }

      // Sample leave request 2 (if we have more employees)
      if (employees.length > 1 && leaveTypes.length > 1) {
        sampleRequests.push({
          employeeId: employees[1].id,
          organizationId: organization.id,
          leaveTypeId: leaveTypes[1].id, // Sick Leave
          startDate: futureDate2,
          endDate: futureDate2,
          daysRequested: 1,
          reason: 'Medical appointment',
          status: 'approved'
        });
      }

      for (const request of sampleRequests) {
        await prisma.leaveRequest.create({
          data: request
        });
      }

      console.log(`✅ Created ${sampleRequests.length} sample leave requests`);

      // Create sample scheduled shifts for the next week
      console.log('📅 Creating sample scheduled shifts...');
      
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const sampleShifts = [];

      for (let i = 0; i < 5; i++) { // Next 5 work days
        const shiftDate = new Date(nextWeek.getTime() + i * 24 * 60 * 60 * 1000);
        
        // Skip weekends
        if (shiftDate.getDay() === 0 || shiftDate.getDay() === 6) continue;

        for (let j = 0; j < Math.min(employees.length, 3); j++) { // Limit to 3 employees
          sampleShifts.push({
            employeeId: employees[j].id,
            organizationId: organization.id,
            shiftTemplateId: shiftTemplates[0].id, // Morning Shift
            date: shiftDate,
            startTime: shiftTemplates[0].startTime,
            endTime: shiftTemplates[0].endTime,
            status: 'scheduled'
          });
        }
      }

      if (sampleShifts.length > 0) {
        await prisma.scheduledShift.createMany({
          data: sampleShifts
        });
        console.log(`✅ Created ${sampleShifts.length} sample scheduled shifts`);
      }

      // Create notification preferences for all users
      console.log('⚙️ Creating notification preferences...');
      
      const users = await prisma.user.findMany({
        where: { organizationId: organization.id }
      });

      for (const user of users) {
        await prisma.notificationPreference.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            organizationId: organization.id,
            emailEnabled: true,
            lateArrivalAlerts: true,
            leaveRequestNotifications: true,
            weeklySummary: true,
            notificationTime: '09:00'
          }
        });
      }

      console.log(`✅ Created notification preferences for ${users.length} users`);
    } else {
      console.log('⚠️ No employees found. Skipping leave balances and sample data creation.');
    }

    console.log('\n🎉 New features seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - ${leaveTypes.length} Leave Types`);
    console.log(`   - ${shiftTemplates.length} Shift Templates`);
    console.log(`   - ${notificationTemplates.length} Notification Templates`);
    console.log(`   - Leave Balances for ${employees.length} employees`);
    console.log(`   - Sample leave requests and scheduled shifts`);
    console.log(`   - Notification preferences for all users`);

  } catch (error) {
    console.error('❌ Error seeding new features:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seeder if called directly
if (require.main === module) {
  seedNewFeatures()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedNewFeatures };
