import { Request, Response } from 'express';
import { EmployeeProfileService } from './employeeProfiles.service';

export class EmployeeProfileController {
  static getAll = async (req: Request, res: Response) => {
    const result = await EmployeeProfileService.getAll();
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static getById = async (req: Request, res: Response) => {
    const result = await EmployeeProfileService.getById(req.params.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static create = async (req: Request, res: Response) => {
    const result = await EmployeeProfileService.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'Employee profile created successfully',
      data: result,
    });
  };

  static update = async (req: Request, res: Response) => {
    const result = await EmployeeProfileService.update(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Employee profile updated successfully',
      data: result,
    });
  };
}

export default EmployeeProfileController;
