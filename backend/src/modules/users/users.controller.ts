import { Request, Response } from 'express';
import { UserService } from './users.service';

export class UserController {
  static getAll = async (req: Request, res: Response) => {
    const role = req.query.role as string;
    const departmentId = req.query.departmentId as string;
    
    const result = await UserService.getAll({ role, departmentId });
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static getById = async (req: Request, res: Response) => {
    const result = await UserService.getById(req.params.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  };

  static create = async (req: Request, res: Response) => {
    const result = await UserService.create(req.body);
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result,
    });
  };

  static update = async (req: Request, res: Response) => {
    const result = await UserService.update(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: result,
    });
  };

  static delete = async (req: Request, res: Response) => {
    await UserService.delete(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  };
}

export default UserController;
