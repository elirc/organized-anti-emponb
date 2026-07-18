import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const Role = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  HR_SPECIALIST: 'HR_SPECIALIST',
  MANAGER: 'MANAGER',
  IT_ADMIN: 'IT_ADMIN',
  PAYROLL_ADMIN: 'PAYROLL_ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

const EmploymentType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACTOR: 'CONTRACTOR',
  INTERN: 'INTERN',
} as const;

const TaskType = {
  HR: 'HR',
  IT: 'IT',
  PAYROLL: 'PAYROLL',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  DOCUMENT: 'DOCUMENT',
  APPROVAL: 'APPROVAL',
} as const;

async function main() {
  console.log('🌱 Starting database seeding (SQLite compat)...');

  // 1. Clean existing records in correct order of dependency
  console.log('🗑️ Cleaning existing data...');
  await prisma.emailNotification.deleteMany({});
  await prisma.auditEvent.deleteMany({});
  await prisma.onboardingActivity.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.approval.deleteMany({});
  await prisma.onboardingTask.deleteMany({});
  await prisma.onboardingCase.deleteMany({});
  await prisma.employeeProfile.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.taskTemplate.deleteMany({});
  await prisma.workflowStageTemplate.deleteMany({});
  await prisma.workflowTemplate.deleteMany({});

  // 2. Create Departments
  console.log('🏢 Creating departments...');
  const engineering = await prisma.department.create({
    data: { name: 'Engineering', description: 'Software design and infrastructure operations' }
  });
  const hr = await prisma.department.create({
    data: { name: 'HR', description: 'Human resources and cultural operations' }
  });
  const sales = await prisma.department.create({
    data: { name: 'Sales', description: 'Enterprise sales and revenue operations' }
  });
  const operations = await prisma.department.create({
    data: { name: 'Operations', description: 'Global operations and business strategies' }
  });
  const finance = await prisma.department.create({
    data: { name: 'Finance', description: 'Accounting, taxes, and payroll flow' }
  });

  // 3. Create Users
  console.log('👤 Creating role-based users...');
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('password123', salt);

  const usersData = [
    {
      email: 'admin@hrflow.com',
      passwordHash,
      firstName: 'Alex',
      lastName: 'SystemAdmin',
      role: Role.SYSTEM_ADMIN,
      departmentId: operations.id,
    },
    {
      email: 'hradmin@hrflow.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'HRAdmin',
      role: Role.HR_ADMIN,
      departmentId: hr.id,
    },
    {
      email: 'specialist@hrflow.com',
      passwordHash,
      firstName: 'Michael',
      lastName: 'Specialist',
      role: Role.HR_SPECIALIST,
      departmentId: hr.id,
    },
    {
      email: 'manager@hrflow.com',
      passwordHash,
      firstName: 'David',
      lastName: 'Manager',
      role: Role.MANAGER,
      departmentId: engineering.id,
    },
    {
      email: 'it@hrflow.com',
      passwordHash,
      firstName: 'Kevin',
      lastName: 'ITAdmin',
      role: Role.IT_ADMIN,
      departmentId: operations.id,
    },
    {
      email: 'payroll@hrflow.com',
      passwordHash,
      firstName: 'Diana',
      lastName: 'PayrollAdmin',
      role: Role.PAYROLL_ADMIN,
      departmentId: finance.id,
    },
    {
      email: 'employee@hrflow.com',
      passwordHash,
      firstName: 'Maria',
      lastName: 'Santos',
      role: Role.EMPLOYEE,
      departmentId: engineering.id,
    }
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({ data: u });
    createdUsers[u.role] = user;
    console.log(`   - Created ${u.role}: ${u.email}`);
  }

  // 4. Create Employee Profile for Employee
  console.log('📄 Creating employee profiles...');
  const employeeProfile = await prisma.employeeProfile.create({
    data: {
      userId: createdUsers[Role.EMPLOYEE].id,
      legalFirstName: 'Maria',
      legalLastName: 'Santos',
      preferredName: 'Maria',
      personalEmail: 'maria.santos@personal.com',
      phone: '+1-555-0199',
      jobTitle: 'Frontend Engineer',
      employmentType: EmploymentType.FULL_TIME,
      startDate: new Date('2026-06-17T09:00:00Z'),
    }
  });

  // Create another pending employee without a user account yet (illustrating separate profiles rule)
  await prisma.employeeProfile.create({
    data: {
      legalFirstName: 'Jane',
      legalLastName: 'Doe',
      preferredName: 'Jane',
      personalEmail: 'jane.doe@candidate.com',
      phone: '+1-555-0243',
      jobTitle: 'Backend Engineer',
      employmentType: EmploymentType.CONTRACTOR,
      startDate: new Date('2026-07-01T09:00:00Z'),
    }
  });

  // 5. Create Workflow Template
  console.log('📋 Creating workflow templates...');
  const workflowTemplate = await prisma.workflowTemplate.create({
    data: {
      name: 'US Full-Time Employee Onboarding',
      description: 'Standard onboarding flow for full-time corporate hires located in the United States.',
      isActive: true,
    }
  });

  // 6. Create Template Stages & Tasks
  console.log('🗂️ Creating stages and task templates...');
  
  const stagesData = [
    { name: 'Pre-Start', sortOrder: 1 },
    { name: 'HR Setup', sortOrder: 2 },
    { name: 'IT Setup', sortOrder: 3 },
    { name: 'Manager Preparation', sortOrder: 4 },
    { name: 'Payroll Setup', sortOrder: 5 },
    { name: 'First Week', sortOrder: 6 }
  ];

  const tasksData: Record<string, any[]> = {
    'Pre-Start': [
      {
        title: 'Upload ID document',
        description: 'Upload a valid government-issued photo ID (Passport, DL) for employment validation.',
        taskType: TaskType.DOCUMENT,
        requiresApproval: true,
        dueOffsetDays: -5, // 5 days before start date
        sortOrder: 1,
      },
      {
        title: 'Complete tax form',
        description: 'Fill out and sign your Form W-4 for federal income tax withholding.',
        taskType: TaskType.DOCUMENT,
        requiresApproval: true,
        dueOffsetDays: -3,
        sortOrder: 2,
      }
    ],
    'HR Setup': [
      {
        title: 'Review employee handbook',
        description: 'Carefully read and sign off acknowledging company policies in the employee handbook.',
        taskType: TaskType.EMPLOYEE,
        requiresApproval: false,
        dueOffsetDays: 1, // 1 day after start date
        sortOrder: 1,
      }
    ],
    'IT Setup': [
      {
        title: 'Create company email',
        description: 'Configure corporate email address and verify active directory workspace privileges.',
        taskType: TaskType.IT,
        requiresApproval: false,
        defaultAssigneeRole: Role.IT_ADMIN,
        dueOffsetDays: -2,
        sortOrder: 1,
      },
      {
        title: 'Provision laptop',
        description: 'Order, configure, and ship MacBook or Thinkpad with company security images.',
        taskType: TaskType.IT,
        requiresApproval: false,
        defaultAssigneeRole: Role.IT_ADMIN,
        dueOffsetDays: -1,
        sortOrder: 2,
      }
    ],
    'Manager Preparation': [
      {
        title: 'Assign onboarding buddy',
        description: 'Pair the new hire with an experienced buddy from the team to assist first-week syncs.',
        taskType: TaskType.MANAGER,
        requiresApproval: false,
        defaultAssigneeRole: Role.MANAGER,
        dueOffsetDays: -4,
        sortOrder: 1,
      }
    ],
    'Payroll Setup': [
      {
        title: 'Confirm direct deposit',
        description: 'Verify routing and account numbers for monthly compensation payouts.',
        taskType: TaskType.PAYROLL,
        requiresApproval: false,
        defaultAssigneeRole: Role.PAYROLL_ADMIN,
        dueOffsetDays: 2,
        sortOrder: 1,
      }
    ],
    'First Week': [
      {
        title: 'Manager first-week check-in',
        description: 'First 1-on-1 check-in meeting to align expectations and answer workflow questions.',
        taskType: TaskType.APPROVAL,
        requiresApproval: true,
        defaultAssigneeRole: Role.MANAGER,
        dueOffsetDays: 5,
        sortOrder: 1,
      }
    ]
  };

  for (const stageData of stagesData) {
    const stage = await prisma.workflowStageTemplate.create({
      data: {
        workflowTemplateId: workflowTemplate.id,
        name: stageData.name,
        description: `Tasks completed during the ${stageData.name} phase.`,
        sortOrder: stageData.sortOrder
      }
    });
    console.log(`   - Stage: ${stage.name}`);

    const tasks = tasksData[stage.name] || [];
    for (const taskData of tasks) {
      await prisma.taskTemplate.create({
        data: {
          stageTemplateId: stage.id,
          ...taskData
        }
      });
      console.log(`     * Task template: ${taskData.title}`);
    }
  }

  // 7. Create a DRAFT case for demonstration
  console.log('📁 Creating dynamic onboarding cases for demonstration...');
  await prisma.onboardingCase.create({
    data: {
      employeeProfileId: employeeProfile.id,
      departmentId: engineering.id,
      workflowTemplateId: workflowTemplate.id,
      createdById: createdUsers[Role.HR_ADMIN].id,
      status: 'DRAFT',
      progressPercent: 0,
      startDate: employeeProfile.startDate,
    }
  });

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
