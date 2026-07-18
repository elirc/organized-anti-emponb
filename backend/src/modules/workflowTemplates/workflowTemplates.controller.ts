import { Request, Response } from 'express';
import { WorkflowTemplateService } from './workflowTemplates.service';

export class WorkflowTemplateController {
  static getAll = async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const result = await WorkflowTemplateService.getAll({ includeInactive });
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static getById = async (req: Request, res: Response) => {
    const result = await WorkflowTemplateService.getById(req.params.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static create = async (req: Request, res: Response) => {
    const result = await WorkflowTemplateService.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Workflow template created successfully',
      data: result,
    });
  };

  static update = async (req: Request, res: Response) => {
    const result = await WorkflowTemplateService.update(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Workflow template updated successfully',
      data: result,
    });
  };

  static delete = async (req: Request, res: Response) => {
    const result = await WorkflowTemplateService.delete(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { deactivated: result.deactivated },
    });
  };

  static createStage = async (req: Request, res: Response) => {
    const result = await WorkflowTemplateService.createStage(req.params.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Stage template appended successfully',
      data: result,
    });
  };

  static createTaskTemplate = async (req: Request, res: Response) => {
    const result = await WorkflowTemplateService.createTaskTemplate(req.body);
    return res.status(201).json({
      success: true,
      message: 'Task template appended successfully',
      data: result,
    });
  };
}

export default WorkflowTemplateController;
