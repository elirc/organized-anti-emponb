import { prisma } from '../../db/prisma';
import env from '../../config/env';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Optional Redis client for BullMQ
let notificationsQueue: Queue | null = null;
let isRedisConnected = false;

try {
  const redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 2000, // Fail fast to trigger fallback
  });

  redisConnection.on('connect', () => {
    console.log('🔌 Redis connected successfully for BullMQ jobs.');
    isRedisConnected = true;
  });

  redisConnection.on('error', (err) => {
    // Suppress error logs to keep dev console extremely clean
    isRedisConnected = false;
  });

  notificationsQueue = new Queue('notifications', {
    connection: redisConnection
  });
} catch (error) {
  console.warn('⚠️ BullMQ Redis initialization bypassed. Using highly robust in-memory background job fallback.');
  isRedisConnected = false;
}

export class NotificationService {
  /**
   * Helper to write email record to DB and process asynchronously.
   */
  private static async createAndProcessEmail(params: {
    recipient: string;
    subject: string;
    body: string;
    caseId: string;
  }) {
    // 1. Log metadata in Database for operational tracking
    const emailRecord = await prisma.emailNotification.create({
      data: {
        onboardingCaseId: params.caseId,
        recipient: params.recipient,
        subject: params.subject,
        body: params.body,
        status: 'PENDING',
      }
    });

    // 2. Process Asynchronously (Queue job or process in background Promise thread)
    if (isRedisConnected && notificationsQueue) {
      await notificationsQueue.add('sendEmail', { emailId: emailRecord.id });
    } else {
      // In-Memory Fallback: run in a non-blocking background Promise
      setTimeout(async () => {
        try {
          await this.deliverEmailMock(emailRecord.id);
        } catch (err) {
          console.error(`❌ Background mock delivery failed for email ${emailRecord.id}:`, err);
        }
      }, 500); // Small delay to simulate async queue pickup
    }
  }

  /**
   * Process and mock deliver email, updating status to SENT.
   */
  static async deliverEmailMock(emailId: string) {
    const email = await prisma.emailNotification.findUnique({
      where: { id: emailId }
    });

    if (!email) return;

    // Simulate standard SMTP server send
    console.log(`\n📨 [MOCK EMAIL DISPATCH] 📨`);
    console.log(`To:      ${email.recipient}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Body:\n----------------------------------------\n${email.body}\n----------------------------------------`);
    console.log(`📬 [DISPATCH SUCCESS] emailId: ${email.id}\n`);

    await prisma.emailNotification.update({
      where: { id: emailId },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      }
    });
  }

  /**
   * Welcome Email when onboarding workflow gets started.
   */
  static async sendOnboardingStarted(caseId: string) {
    const onboardingCase = await prisma.onboardingCase.findUnique({
      where: { id: caseId },
      include: { employeeProfile: true }
    });

    if (!onboardingCase) return;

    const emailAddress = onboardingCase.employeeProfile.personalEmail || 'newhire@company.com';
    const legalName = `${onboardingCase.employeeProfile.legalFirstName} ${onboardingCase.employeeProfile.legalLastName}`;

    await this.createAndProcessEmail({
      recipient: emailAddress,
      subject: `Welcome to the Team, ${onboardingCase.employeeProfile.preferredName || legalName}!`,
      body: `Hello ${onboardingCase.employeeProfile.preferredName || legalName},\n\nWe are absolutely thrilled to welcome you as our new ${onboardingCase.employeeProfile.jobTitle || 'Team Member'}! Your onboarding workflow has officially started.\n\nPlease log in to the portal to view and complete your pre-start checklist items.\n\nBest wishes,\nHR Cultural Operations Team`,
      caseId: onboardingCase.id,
    });
  }

  /**
   * Notification to direct assignee when a task requires approval.
   */
  static async sendApprovalRequested(taskId: string) {
    const task = await prisma.onboardingTask.findUnique({
      where: { id: taskId },
      include: {
        onboardingCase: {
          include: { employeeProfile: true }
        }
      }
    });

    if (!task) return;

    // Look up manager or System HR Admin
    const hrAdmin = await prisma.user.findFirst({
      where: { role: 'HR_ADMIN', isActive: true }
    });

    const recipient = hrAdmin?.email || 'manager@hrflow.com';

    await this.createAndProcessEmail({
      recipient,
      subject: `Approval Required: ${task.title}`,
      body: `Hello Manager/HR,\n\nA new hire task completed by ${task.onboardingCase.employeeProfile.legalFirstName} requires your administrative review and approval:\n\nTask: ${task.title}\nDescription: ${task.description || 'No description'}\n\nPlease log in to your dashboard to review and approve/reject the completed task.\n\nThank you,\nHR Operations Automations`,
      caseId: task.onboardingCaseId,
    });
  }

  /**
   * Notification to task assignee when approval is rejected.
   */
  static async sendApprovalRejected(approvalId: string) {
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        task: {
          include: {
            assignedTo: true
          }
        },
        onboardingCase: {
          include: { employeeProfile: true }
        }
      }
    });

    if (!approval || !approval.task) return;

    const recipient = approval.task.assignedTo?.email || approval.onboardingCase.employeeProfile.personalEmail || 'candidate@personal.com';

    await this.createAndProcessEmail({
      recipient,
      subject: `Task Revision Required: ${approval.task.title}`,
      body: `Hello,\n\nYour completed task "${approval.task.title}" has been reviewed and requires revision.\n\nReviewer Comments: ${approval.remarks || 'No details provided.'}\n\nPlease review and re-submit the task with required corrections.\n\nThank you,\nHR Compliance Team`,
      caseId: approval.onboardingCaseId,
    });
  }
}
export default NotificationService;
