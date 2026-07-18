import { Request, Response } from 'express';
import { OnboardingCasesService } from './onboardingCases.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { CaseStatus } from './onboardingCase.stateMachine';

export class OnboardingCasesController {
  static getAll = async (req: Request, res: Response) => {
    const status = req.query.status as string;
    const departmentId = req.query.departmentId as string;
    const search = req.query.search as string;

    const result = await OnboardingCasesService.getAll({ status, departmentId, search });
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static getById = async (req: Request, res: Response) => {
    const result = await OnboardingCasesService.getById(req.params.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static create = async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user!.id;
    const result = await OnboardingCasesService.create(req.body, actorId);
    return res.status(201).json({
      success: true,
      message: 'Onboarding case drafted successfully',
      data: result,
    });
  };

  static update = async (req: AuthenticatedRequest, res: Response) => {
    const result = await OnboardingCasesService.update(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Onboarding case updated successfully',
      data: result,
    });
  };

  static start = async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user!.id;
    const result = await OnboardingCasesService.startOnboardingCase(req.params.id, actorId);

    // Queue WELCOME email notifications after successful transaction
    try {
      const { NotificationService } = await import('../notifications/notification.service');
      const email = result.case.employeeProfileId; // Or fetch email profile
      await NotificationService.sendOnboardingStarted(result.case.id);
    } catch (err) {
      console.warn('⚠️ Background notification enqueuing failed post-transaction:', err);
    }

    return res.status(200).json({
      success: true,
      message: `Onboarding workflow started. Generated ${result.generatedTasksCount} concrete tasks.`,
      data: result.case,
    });
  };

  static updateStatus = async (req: AuthenticatedRequest, res: Response) => {
    const actorId = req.user!.id;
    const status = req.body.status as CaseStatus;
    const result = await OnboardingCasesService.updateStatus(req.params.id, status, actorId);
    return res.status(200).json({
      success: true,
      message: `Onboarding case status transitioned to ${status}`,
      data: result,
    });
  };
}

export default OnboardingCasesController;
