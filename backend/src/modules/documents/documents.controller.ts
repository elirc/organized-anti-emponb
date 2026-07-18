import { Request, Response } from 'express';
import { DocumentService } from './documents.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';

export class DocumentController {
  static getAll = async (req: Request, res: Response) => {
    const onboardingCaseId = req.query.onboardingCaseId as string;
    const result = await DocumentService.getAll({ onboardingCaseId });
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static getById = async (req: Request, res: Response) => {
    const result = await DocumentService.getById(req.params.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static upload = async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new AppError(ErrorCodes.BAD_REQUEST, 400, 'Physical file upload is required');
    }

    // Since multer parses multipart form, Zod schema can check parsed fields
    const uploaderId = req.user!.id;
    const result = await DocumentService.upload(
      {
        onboardingCaseId: req.body.onboardingCaseId,
        title: req.body.title,
        category: req.body.category,
      },
      req.file,
      uploaderId
    );

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: result,
    });
  };

  static review = async (req: AuthenticatedRequest, res: Response) => {
    const reviewerId = req.user!.id;
    const result = await DocumentService.review(req.params.id, req.body, reviewerId);
    return res.status(200).json({
      success: true,
      message: `Document status updated to ${req.body.status}`,
      data: result,
    });
  };
}

export default DocumentController;
