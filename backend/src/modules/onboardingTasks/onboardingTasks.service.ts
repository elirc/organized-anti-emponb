import { prisma } from '../../db/prisma';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { UpdateTaskInput } from './onboardingTasks.schemas';
import { OnboardingProgressService } from '../onboardingCases/onboardingProgress.service';

export class OnboardingTasksService {
  /**
   * List concrete tasks, with filters.
   */
  static async getAll(filters: {
    onboardingCaseId?: string;
    assignedToId?: string;
    assignedRole?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters.onboardingCaseId) {
      where.onboardingCaseId = filters.onboardingCaseId;
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId;
    }

    if (filters.assignedRole) {
      where.assignedRole = filters.assignedRole;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return prisma.onboardingTask.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
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
   * Fetch single task.
   */
  static async getById(id: string) {
    const task = await prisma.onboardingTask.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        },
        approvals: {
          orderBy: { requestedAt: 'desc' },
          include: {
            approver: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!task) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Onboarding task not found');
    }

    return task;
  }

  /**
   * Update task reassignments and statuses.
   */
  static async update(id: string, input: UpdateTaskInput, actorId: string) {
    const task = await prisma.onboardingTask.findUnique({
      where: { id },
      include: { onboardingCase: true }
    });

    if (!task) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Onboarding task not found');
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;

    if (input.assignedToId !== undefined) {
      if (input.assignedToId) {
        const user = await prisma.user.findUnique({ where: { id: input.assignedToId } });
        if (!user) {
          throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Assigned user not found');
        }
      }
      updateData.assignedToId = input.assignedToId;
    }

    // Trigger state changes or approval creations
    let isProgressAffected = false;
    let finalStatus = task.status;

    if (input.status && input.status !== task.status) {
      if (input.status === 'COMPLETED' && task.requiresApproval) {
        // If task requires approval, transition to PENDING_APPROVAL and spin up Approval model!
        finalStatus = 'PENDING_APPROVAL';

        await prisma.$transaction(async (tx) => {
          // Check if there is already a pending approval to avoid duplicates
          const existingApproval = await tx.approval.findFirst({
            where: {
              taskId: task.id,
              status: 'PENDING'
            }
          });

          if (!existingApproval) {
            await tx.approval.create({
              data: {
                onboardingCaseId: task.onboardingCaseId,
                taskId: task.id,
                status: 'PENDING',
              }
            });
          }

          // Update task to PENDING_APPROVAL
          await tx.onboardingTask.update({
            where: { id: task.id },
            data: { status: 'PENDING_APPROVAL' }
          });

          // Log approval request
          await tx.onboardingActivity.create({
            data: {
              onboardingCaseId: task.onboardingCaseId,
              actorId,
              action: 'APPROVAL_REQUESTED',
              entityType: 'OnboardingTask',
              entityId: task.id,
            }
          });

          await tx.auditEvent.create({
            data: {
              actorId,
              entityType: 'OnboardingTask',
              entityId: task.id,
              action: 'TASK_APPROVAL_REQUESTED',
              metadata: JSON.stringify({
                taskTitle: task.title,
                caseId: task.onboardingCaseId
              }),
            }
          });

          // Enqueue background email notifications to managers/approvers (enqueued post-transaction in service)
          try {
            const { NotificationService } = await import('../notifications/notification.service');
            await NotificationService.sendApprovalRequested(task.id);
          } catch (err) {
            console.warn('⚠️ Background approval notification failed:', err);
          }
        });

        // Trigger dynamic progress update
        await OnboardingProgressService.recalculateOnboardingProgress(task.onboardingCaseId);
        
        return prisma.onboardingTask.findUnique({
          where: { id },
          include: { assignedTo: true }
        });
      } else {
        // Directly transition status
        finalStatus = input.status;
        updateData.status = finalStatus;
        if (finalStatus === 'COMPLETED') {
          updateData.completedAt = new Date();
          updateData.completedById = actorId;
        } else {
          updateData.completedAt = null;
          updateData.completedById = null;
        }
        isProgressAffected = true;
      }
    }

    const updatedTask = await prisma.onboardingTask.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    if (input.status && input.status !== task.status) {
      // Log task status updates
      await prisma.onboardingActivity.create({
        data: {
          onboardingCaseId: task.onboardingCaseId,
          actorId,
          action: `TASK_STATUS_CHANGED_${finalStatus}`,
          entityType: 'OnboardingTask',
          entityId: task.id,
          field: 'status',
          oldValue: task.status,
          newValue: finalStatus,
        }
      });
    }

    if (input.assignedToId !== undefined && input.assignedToId !== task.assignedToId) {
      await prisma.onboardingActivity.create({
        data: {
          onboardingCaseId: task.onboardingCaseId,
          actorId,
          action: 'TASK_REASSIGNED',
          entityType: 'OnboardingTask',
          entityId: task.id,
          field: 'assignedToId',
          oldValue: task.assignedToId,
          newValue: input.assignedToId,
        }
      });
    }

    if (isProgressAffected) {
      await OnboardingProgressService.recalculateOnboardingProgress(task.onboardingCaseId);
    }

    return updatedTask;
  }
}
export default OnboardingTasksService;
