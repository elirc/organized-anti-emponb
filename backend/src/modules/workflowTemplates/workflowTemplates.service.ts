import { prisma } from '../../db/prisma';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import {
  CreateWorkflowTemplateInput,
  UpdateWorkflowTemplateInput,
  CreateStageTemplateInput,
  CreateTaskTemplateInput,
} from './workflowTemplates.schemas';

export class WorkflowTemplateService {
  static async getAll(filters: { includeInactive?: boolean } = {}) {
    const where: any = {};
    if (filters.includeInactive !== true) {
      where.isActive = true;
    }
    return prisma.workflowTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { stages: true, cases: true }
        }
      }
    });
  }

  static async getById(id: string) {
    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { sortOrder: 'asc' },
          include: {
            taskTemplates: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        _count: {
          select: { cases: true }
        }
      }
    });

    if (!template) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Workflow template not found');
    }

    return template;
  }

  static async create(input: CreateWorkflowTemplateInput) {
    return prisma.workflowTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        isActive: true,
      },
    });
  }

  static async update(id: string, input: UpdateWorkflowTemplateInput) {
    await this.getById(id);

    return prisma.workflowTemplate.update({
      where: { id },
      data: input,
    });
  }

  /**
   * Deactivates or deletes a template based on whether it is referenced by existing onboarding cases.
   */
  static async delete(id: string) {
    const template = await prisma.workflowTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cases: true }
        }
      }
    });

    if (!template) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Workflow template not found');
    }

    // Senior Safeguard: if historical cases exist, refuse hard delete. Deactivate instead!
    if (template._count.cases > 0) {
      await prisma.workflowTemplate.update({
        where: { id },
        data: { isActive: false },
      });
      return { deactivated: true, message: 'Template is used by active cases. Deactivated instead of deleted.' };
    }

    // Otherwise, perform safe hard delete since it was never used
    await prisma.$transaction([
      prisma.taskTemplate.deleteMany({
        where: { stageTemplate: { workflowTemplateId: id } }
      }),
      prisma.workflowStageTemplate.deleteMany({
        where: { workflowTemplateId: id }
      }),
      prisma.workflowTemplate.delete({
        where: { id }
      })
    ]);

    return { deactivated: false, message: 'Template and all its stages/tasks successfully deleted.' };
  }

  static async createStage(templateId: string, input: CreateStageTemplateInput) {
    const template = await this.getById(templateId);

    return prisma.workflowStageTemplate.create({
      data: {
        workflowTemplateId: template.id,
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder,
      },
    });
  }

  static async createTaskTemplate(input: CreateTaskTemplateInput) {
    const stage = await prisma.workflowStageTemplate.findUnique({
      where: { id: input.stageTemplateId },
    });

    if (!stage) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Workflow stage template not found');
    }

    return prisma.taskTemplate.create({
      data: {
        stageTemplateId: input.stageTemplateId,
        title: input.title,
        description: input.description,
        defaultAssigneeRole: input.defaultAssigneeRole,
        taskType: input.taskType,
        requiresApproval: input.requiresApproval,
        dueOffsetDays: input.dueOffsetDays,
        sortOrder: input.sortOrder,
      },
    });
  }
}
export default WorkflowTemplateService;
