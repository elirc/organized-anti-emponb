import { prisma } from '../../db/prisma';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateOnboardingCaseInput, UpdateOnboardingCaseInput } from './onboardingCases.schemas';
import { validateCaseTransition, CaseStatus } from './onboardingCase.stateMachine';
import { calculateDueDate } from '../../shared/utils/dates';
import { OnboardingProgressService } from './onboardingProgress.service';

/**
 * Resolves assignee based on template default assignee roles.
 */
async function resolveAssigneeForTask(
  tx: any,
  params: { defaultAssigneeRole: string | null; departmentId: string }
) {
  if (!params.defaultAssigneeRole) {
    return null;
  }

  // Find active user in same department with the role
  const user = await tx.user.findFirst({
    where: {
      role: params.defaultAssigneeRole,
      departmentId: params.departmentId,
      isActive: true,
    },
  });

  if (user) return user;

  // Fallback: any active user in the system with this role
  return tx.user.findFirst({
    where: {
      role: params.defaultAssigneeRole,
      isActive: true,
    },
  });
}

export class OnboardingCasesService {
  /**
   * List onboarding cases, with filters and search.
   */
  static async getAll(filters: { status?: string; departmentId?: string; search?: string }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.search) {
      where.employeeProfile = {
        OR: [
          { legalFirstName: { contains: filters.search } },
          { legalLastName: { contains: filters.search } },
          { preferredName: { contains: filters.search } }
        ]
      };
    }

    return prisma.onboardingCase.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        employeeProfile: true,
        department: { select: { id: true, name: true } },
        workflowTemplate: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Fetch single case with tasks and activities.
   */
  static async getById(id: string) {
    const onboardingCase = await prisma.onboardingCase.findUnique({
      where: { id },
      include: {
        employeeProfile: true,
        department: true,
        workflowTemplate: true,
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true }
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignedTo: {
              select: { id: true, email: true, firstName: true, lastName: true }
            }
          }
        },
        documents: true,
        approvals: {
          orderBy: { requestedAt: 'desc' },
          include: {
            approver: {
              select: { id: true, firstName: true, lastName: true }
            },
            task: { select: { id: true, title: true } }
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!onboardingCase) {
      throw new AppError(ErrorCodes.CASE_NOT_FOUND, 404, 'Onboarding case not found');
    }

    return onboardingCase;
  }

  /**
   * Create a new draft onboarding case.
   */
  static async create(input: CreateOnboardingCaseInput, actorId: string) {
    // Validate profile exists
    const profile = await prisma.employeeProfile.findUnique({
      where: { id: input.employeeProfileId },
    });
    if (!profile) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Employee profile not found');
    }

    // Validate department exists
    const dept = await prisma.department.findUnique({
      where: { id: input.departmentId },
    });
    if (!dept) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Department not found');
    }

    // Validate template exists
    const template = await prisma.workflowTemplate.findUnique({
      where: { id: input.workflowTemplateId },
    });
    if (!template) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Workflow template not found');
    }

    const onboardingCase = await prisma.onboardingCase.create({
      data: {
        employeeProfileId: input.employeeProfileId,
        departmentId: input.departmentId,
        workflowTemplateId: input.workflowTemplateId,
        createdById: actorId,
        status: 'NOT_STARTED', // Initialize case as NOT_STARTED so it can be started directly
        progressPercent: 0,
        startDate: new Date(input.startDate),
      },
      include: {
        employeeProfile: true,
        department: true,
        workflowTemplate: true,
      }
    });

    // Create activity record
    await prisma.onboardingActivity.create({
      data: {
        onboardingCaseId: onboardingCase.id,
        actorId,
        action: 'CASE_CREATED',
        entityType: 'OnboardingCase',
        entityId: onboardingCase.id,
      }
    });

    return onboardingCase;
  }

  /**
   * Update case metadata.
   */
  static async update(id: string, input: UpdateOnboardingCaseInput) {
    const current = await this.getById(id);

    const updateData: any = {};
    if (input.departmentId) updateData.departmentId = input.departmentId;
    if (input.workflowTemplateId) updateData.workflowTemplateId = input.workflowTemplateId;
    if (input.startDate) updateData.startDate = new Date(input.startDate);

    if (input.status && input.status !== current.status) {
      validateCaseTransition(current.status as CaseStatus, input.status as CaseStatus);
      updateData.status = input.status;
    }

    return prisma.onboardingCase.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Transition onboarding case status with explicit checks.
   */
  static async updateStatus(id: string, newStatus: CaseStatus, actorId: string) {
    const current = await this.getById(id);
    validateCaseTransition(current.status as CaseStatus, newStatus);

    const updated = await prisma.onboardingCase.update({
      where: { id },
      data: {
        status: newStatus,
        cancelledAt: newStatus === 'CANCELLED' ? new Date() : current.cancelledAt,
      },
    });

    await prisma.onboardingActivity.create({
      data: {
        onboardingCaseId: id,
        actorId,
        action: `STATUS_CHANGED_${newStatus}`,
        entityType: 'OnboardingCase',
        entityId: id,
        field: 'status',
        oldValue: current.status,
        newValue: newStatus,
      }
    });

    return updated;
  }

  /**
   * CRITICAL TRANSACTIONAL SERVICE: starts the workflow generating tasks from template.
   */
  static async startOnboardingCase(caseId: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const onboardingCase = await tx.onboardingCase.findUnique({
        where: { id: caseId },
        include: {
          workflowTemplate: {
            include: {
              stages: {
                include: {
                  taskTemplates: true
                }
              }
            }
          }
        }
      });

      if (!onboardingCase) {
        throw new AppError(ErrorCodes.CASE_NOT_FOUND, 404, 'Onboarding case not found');
      }

      if (onboardingCase.status !== 'NOT_STARTED') {
        throw new AppError(ErrorCodes.CASE_CANNOT_BE_STARTED, 400, 'Onboarding case must be in NOT_STARTED state');
      }

      const generatedTasks = [];

      // Sort stages to preserve order during task generation
      const sortedStages = [...onboardingCase.workflowTemplate.stages].sort((a, b) => a.sortOrder - b.sortOrder);

      for (const stage of sortedStages) {
        const sortedTaskTemplates = [...stage.taskTemplates].sort((a, b) => a.sortOrder - b.sortOrder);
        
        for (const taskTemplate of sortedTaskTemplates) {
          const assignedUser = await resolveAssigneeForTask(tx, {
            defaultAssigneeRole: taskTemplate.defaultAssigneeRole,
            departmentId: onboardingCase.departmentId,
          });

          // Determine initial status based on task dependencies or defaults
          const taskStatus = 'TODO';

          const task = await tx.onboardingTask.create({
            data: {
              onboardingCaseId: onboardingCase.id,
              title: taskTemplate.title,
              description: taskTemplate.description,
              taskType: taskTemplate.taskType,
              status: taskStatus,
              requiresApproval: taskTemplate.requiresApproval,
              assignedToId: assignedUser?.id || null,
              assignedRole: taskTemplate.defaultAssigneeRole,
              dueDate: calculateDueDate(onboardingCase.startDate, taskTemplate.dueOffsetDays),
            }
          });

          generatedTasks.push(task);
        }
      }

      // Update case to IN_PROGRESS
      const updatedCase = await tx.onboardingCase.update({
        where: { id: caseId },
        data: {
          status: 'IN_PROGRESS',
          progressPercent: 0,
        }
      });

      // Log user-facing activity log
      await tx.onboardingActivity.create({
        data: {
          onboardingCaseId: caseId,
          actorId,
          action: 'ONBOARDING_STARTED',
          entityType: 'OnboardingCase',
          entityId: caseId,
        }
      });

      // Log compliance audit event
      await tx.auditEvent.create({
        data: {
          actorId,
          entityType: 'OnboardingCase',
          entityId: caseId,
          action: 'STARTED_ONBOARDING',
          metadata: JSON.stringify({
            generatedTaskCount: generatedTasks.length,
          }),
        }
      });

      // Stub notification triggers (jobs enqueued after transaction succeeds in controller)
      return {
        case: updatedCase,
        generatedTasksCount: generatedTasks.length,
      };
    });
  }
}
export default OnboardingCasesService;
