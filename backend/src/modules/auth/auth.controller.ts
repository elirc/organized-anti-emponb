import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export class AuthController {
  static register = async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    return res.status(201).json({ // Standard created code 201
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  };

  static login = async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  };

  static refresh = async (req: Request, res: Response) => {
    const result = await AuthService.refresh(req.body.refreshToken);
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  };

  static logout = async (req: Request, res: Response) => {
    await AuthService.logout(req.body.refreshToken);
    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  };

  static me = async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await AuthService.getMe(userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  };
}

export default AuthController;
