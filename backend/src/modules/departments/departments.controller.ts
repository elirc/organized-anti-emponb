import { Request, Response } from 'express';
import { DepartmentService } from './departments.service';

export class DepartmentController {
  static getAll = async (req: Request, res: Response) => {
    const result = await DepartmentService.getAll();
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static getById = async (req: Request, res: Response) => {
    const result = await DepartmentService.getById(req.params.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static create = async (req: Request, res: Response) => {
    const result = await DepartmentService.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: result,
    });
  };

  static update = async (req: Request, res: Response) => {
    const result = await DepartmentService.update(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: result,
    });
  };

  static delete = async (req: Request, res: Response) => {
    await DepartmentService.delete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Department deleted successfully',
    });
  };
}

export default DepartmentController;
