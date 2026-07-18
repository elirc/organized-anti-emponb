import { prisma } from '../../db/prisma';
import { hashPassword, comparePassword } from '../../shared/utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../shared/utils/jwt';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { RegisterInput, LoginInput } from './auth.schemas';
import crypto from 'crypto';

// Hash token helper to store in database safely
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export class AuthService {
  /**
   * Register a new user in the platform.
   */
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError(ErrorCodes.EMAIL_ALREADY_EXISTS, 400, 'Email address already registered');
    }

    // Verify department exists if provided
    if (input.departmentId) {
      const deptExists = await prisma.department.findUnique({
        where: { id: input.departmentId },
      });
      if (!deptExists) {
        throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Selected department does not exist');
      }
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        departmentId: input.departmentId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create session tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });

    const rawRefreshToken = generateRefreshToken({ userId: user.id });
    
    // Store hashed refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user,
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Login credentials check, generating access/refresh tokens.
   */
  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { department: true }
    });

    if (!user) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(ErrorCodes.FORBIDDEN, 403, 'Your account has been deactivated');
    }

    const validPassword = await comparePassword(input.password, user.passwordHash);
    if (!validPassword) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 401, 'Invalid email or password');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });

    const rawRefreshToken = generateRefreshToken({ userId: user.id });

    // Store hashed token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        departmentId: user.departmentId,
        departmentName: user.department?.name || null,
        isActive: user.isActive,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Rolling refresh token handler to fetch a new active session.
   */
  static async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError(ErrorCodes.INVALID_TOKEN, 401, 'Invalid refresh token');
    }

    const hashed = hashToken(refreshToken);
    const dbToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hashed,
        userId: payload.userId,
      },
    });

    if (!dbToken) {
      throw new AppError(ErrorCodes.INVALID_TOKEN, 401, 'Refresh token not recognized or revoked');
    }

    if (dbToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: dbToken.id } });
      throw new AppError(ErrorCodes.TOKEN_EXPIRED, 401, 'Refresh token has expired');
    }

    if (dbToken.revokedAt) {
      throw new AppError(ErrorCodes.INVALID_TOKEN, 401, 'Refresh token was revoked');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { department: true }
    });

    if (!user || !user.isActive) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 401, 'User account deactivated or missing');
    }

    // Refresh token rotation: delete old, issue new one
    await prisma.refreshToken.delete({ where: { id: dbToken.id } });

    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      departmentId: user.departmentId,
    });

    const rawNewRefreshToken = generateRefreshToken({ userId: user.id });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawNewRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: rawNewRefreshToken,
    };
  }

  /**
   * Revokes a refresh token in the session database.
   */
  static async logout(refreshToken: string) {
    const hashed = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({
      where: { tokenHash: hashed },
    });
  }

  /**
   * Retrieves profile details of the active user.
   */
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        departmentId: true,
        department: {
          select: { id: true, name: true }
        },
        employeeProfile: {
          select: {
            id: true,
            jobTitle: true,
            employmentType: true,
            startDate: true,
          }
        }
      },
    });

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'User not found');
    }

    return user;
  }
}
