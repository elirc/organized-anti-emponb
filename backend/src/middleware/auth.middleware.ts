import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../shared/utils/jwt';
import { prisma } from '../db/prisma';
import { AppError } from '../shared/errors/AppError';
import { ErrorCodes } from '../shared/errors/errorCodes';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  departmentId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 401, 'Authorization token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 401, 'Malformed authorization token');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError(ErrorCodes.TOKEN_EXPIRED, 401, 'Access token has expired');
      }
      throw new AppError(ErrorCodes.INVALID_TOKEN, 401, 'Invalid access token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        departmentId: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 401, 'User account not found');
    }

    if (!user.isActive) {
      throw new AppError(ErrorCodes.FORBIDDEN, 403, 'User account is deactivated');
    }

    // Attach user payload
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authMiddleware;
