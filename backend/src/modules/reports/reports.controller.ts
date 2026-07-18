import { Request, Response } from 'express';
import { ReportingService } from './reports.service';

export class ReportingController {
  static getCasesSummary = async (req: Request, res: Response) => {
    const result = await ReportingService.getCasesSummary();
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static getDepartmentMetrics = async (req: Request, res: Response) => {
    const result = await ReportingService.getDepartmentMetrics();
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static getTasksSummary = async (req: Request, res: Response) => {
    const result = await ReportingService.getTasksSummary();
    return res.status(200).json({
      success: true,
      data: result,
    });
  };
}

export default ReportingController;
