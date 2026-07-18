import { prisma } from '../../db/prisma';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { DecideApprovalInput } from './approvals.schemas';
import { OnboardingProgressService } from '../onboardingCases/onboardingProgress.service';

export class ApprovalService {
  /**
   * List approval sign-offs, with filters.
   */
  static async getAll(filters: {
    onboardingCaseId?: string;
    status?: string;
    approverId?: string;
  }) {
    const where: any = {};

    if (filters.onboardingCaseId) {
      where.onboardingCaseId = filters.onboardingCaseId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.approverId) {
      where.approverId = filters.approverId;
    }

    return prisma.approval.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        approver: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        task: {
          select: { id: true, title: true, description: true, status: true, taskType: true }
        },
        onboardingCase: {
          select: {
            id: true,
            status: true,
            employeeProfile: {
              select: { legalFirstName: true, legalLastName: true }
            }
          }
        }
      }
    });
  }

  /**
   * Transactional decision processing (APPROVE / REJECT).
   */
  static async decide(approvalId: string, input: DecideApprovalInput, approverId: string) {
    return prisma.$transaction(async (tx) => {
      const approval = await tx.approval.findUnique({
        where: { id: approvalId },
        include: {
          task: true,
          onboardingCase: true,
        }
      });

      if (!approval) {
        throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Approval request not found');
      }

      if (approval.status !== 'PENDING') {
        throw new AppError(ErrorCodes.BAD_REQUEST, 400, 'Approval request has already been decided');
      }

      const approverUser = await tx.user.findUnique({
        where: { id: approverId }
      });

      if (!approverUser) {
        throw new AppError(ErrorCodes.UNAUTHORIZED, 401, 'Approver account not found');
      }

      // Safeguard: verify that the deciding user is authorized to sign off
      // SYSTEM_ADMIN and HR_ADMIN can approve anything. Others can approve if it's their role or assigned to them.
      const isSystemHRAdmin = ['SYSTEM_ADMIN', 'HR_ADMIN'].includes(approverUser.role);
      const isRoleAssignee = approval.task.assignedRole === approverUser.role;
      const isDirectAssignee = approval.task.assignedToId === approverUser.id;

      if (!isSystemHRAdmin && !isRoleAssignee && !isDirectAssignee) {
        throw new AppError(
          ErrorCodes.FORBIDDEN,
          403,
          'Access denied: you are not authorized to sign off on this approval request'
        );
      }

      // 1. Update the approval record
      const updatedApproval = await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: input.status,
          remarks: input.remarks,
          approverId,
          decidedAt: new Date(),
        }
      });

      // 2. Perform actions depending on sign-off state
      if (input.status === 'APPROVED') {
        // Transition Task to COMPLETED
        await tx.onboardingTask.update({
          where: { id: approval.taskId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            completedById: approverId,
          }
        });

        // Log user-facing activity log
        await tx.onboardingActivity.create({
          data: {
            onboardingCaseId: approval.onboardingCaseId,
            actorId: approverId,
            action: 'APPROVAL_APPROVED',
            entityType: 'Approval',
            entityId: approval.id,
            newValue: input.remarks || 'No remarks provided.',
          }
        });

        // Log compliance audit event
        await tx.auditEvent.create({
          data: {
            actorId: approverId,
            entityType: 'Approval',
            entityId: approval.id,
            action: 'TASK_APPROVED',
            metadata: JSON.stringify({
              taskTitle: approval.task.title,
              caseId: approval.onboardingCaseId,
            }),
          }
        });
      } else {
        // REJECTED: Transition Task status back to TODO/IN_PROGRESS (let's set back to TODO)
        await tx.onboardingTask.update({
          where: { id: approval.taskId },
          data: {
            status: 'TODO',
            completedAt: null,
            completedById: null,
          }
        });

        // Log user-facing activity log
        await tx.onboardingActivity.create({
          data: {
            onboardingCaseId: approval.onboardingCaseId,
            actorId: approverId,
            action: 'APPROVAL_REJECTED',
            entityType: 'Approval',
            entityId: approval.id,
            newValue: input.remarks || 'Rejected by approver.',
          }
        });

        // Log compliance audit event
        await tx.auditEvent.create({
          data: {
            actorId: approverId,
            entityType: 'Approval',
            entityId: approval.id,
            action: 'TASK_REJECTED',
            metadata: JSON.stringify({
              taskTitle: approval.task.title,
              caseId: approval.onboardingCaseId,
              remarks: input.remarks,
            }),
          }
        });

        // Stub background email notification to assignee that their task was rejected
        try {
          const { NotificationService } = await import('../notifications/notification.service');
          await NotificationService.sendApprovalRejected(approval.id);
        } catch (err) {
          console.warn('⚠️ Background rejection notification failed:', err);
        }
      }

      // Recalculate progress for the case (runs within transaction context)
      await OnboardingProgressService.recalculateOnboardingProgress(approval.onboardingCaseId, tx);

      return updatedApproval;
    });
  }
}
export default ApprovalService;
