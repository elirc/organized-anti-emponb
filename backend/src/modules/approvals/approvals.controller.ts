import { Request, Response } from 'express';
import { ApprovalService } from './approvals.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class ApprovalController {
  static getAll = async (req: Request, res: Response) => {
    const onboardingCaseId = req.query.onboardingCaseId as string;
    const status = req.query.status as string;
    const approverId = req.query.approverId as string;

    const result = await ApprovalService.getAll({ onboardingCaseId, status, approverId });
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static decide = async (req: AuthenticatedRequest, res: Response) => {
    const approverId = req.user!.id;
    const result = await ApprovalService.decide(req.params.id, req.body, approverId);
    return res.status(200).json({
      success: true,
      message: `Approval request ${req.body.status.toLowerCase()} successfully`,
      data: result,
    });
  };
}

export default ApprovalController;
