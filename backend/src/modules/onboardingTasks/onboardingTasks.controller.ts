import { Request, Response } from 'express';
import { OnboardingTasksService } from './onboardingTasks.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class OnboardingTasksController {
  static getAll = async (req: Request, res: Response) => {
    const onboardingCaseId = req.query.onboardingCaseId as string;
    const assignedToId = req.query.assignedToId as string;
    const assignedRole = req.query.assignedRole as string;
    const status = req.query.status as string;

    const result = await OnboardingTasksService.getAll({
      onboardingCaseId,
      assignedToId,
      assignedRole,
      status,
    });
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static getById = async (req: Request, res: Response) => {
    const result = await OnboardingTasksService.getById(req.params.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static update = async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user!.id;
    const result = await OnboardingTasksService.update(req.params.id, req.body, actorId);
    return res.status(200).json({
      success: true,
      message: 'Onboarding task updated successfully',
      data: result,
    });
  };
}

export default OnboardingTasksController;
