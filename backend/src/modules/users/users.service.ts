import { prisma } from '../../db/prisma';
import { hashPassword } from '../../shared/utils/password';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateUserInput, UpdateUserInput } from './users.schemas';

export class UserService {
  /**
   * Retrieves all users, supporting filters on role and departmentId.
   */
  static async getAll(filters: { role?: string; departmentId?: string }) {
    const where: any = {};
    
    if (filters.role) {
      where.role = filters.role;
    }
    
    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    return prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        departmentId: true,
        department: {
          select: { id: true, name: true }
        },
        createdAt: true,
      }
    });
  }

  /**
   * Fetch a single user details.
   */
  static async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        departmentId: true,
        department: {
          select: { id: true, name: true }
        },
        employeeProfile: {
          select: { id: true, jobTitle: true, startDate: true }
        },
        createdAt: true,
      }
    });

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'User not found');
    }

    return user;
  }

  /**
   * Create a new system user account.
   */
  static async create(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError(ErrorCodes.EMAIL_ALREADY_EXISTS, 400, 'Email address already registered');
    }

    if (input.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!dept) {
        throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Department not found');
      }
    }

    const hashedPassword = await hashPassword(input.password);

    return prisma.user.create({
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
        isActive: true,
        departmentId: true,
        createdAt: true,
      }
    });
  }

  /**
   * Update an existing user.
   */
  static async update(id: string, input: UpdateUserInput) {
    const user = await this.getById(id);

    const updateData: any = { ...input };

    if (input.email && input.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new AppError(ErrorCodes.EMAIL_ALREADY_EXISTS, 400, 'Email address is already in use');
      }
    }

    if (input.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
      if (!dept) {
        throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Department not found');
      }
    }

    if (input.password) {
      updateData.passwordHash = await hashPassword(input.password);
      delete updateData.password;
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        departmentId: true,
        createdAt: true,
      }
    });
  }

  /**
   * Deletes a user, checking linked cases and tasks first.
   */
  static async delete(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignedTasks: true,
            createdCases: true,
            approvals: true,
          }
        }
      }
    });

    if (!user) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'User not found');
    }

    // Safeguard: prevent deleting users with active system assignments
    if (user._count.assignedTasks > 0 || user._count.createdCases > 0 || user._count.approvals > 0) {
      throw new AppError(
        ErrorCodes.BAD_REQUEST,
        400,
        `Cannot delete user: they have ${user._count.assignedTasks} assigned tasks, ${user._count.createdCases} onboarding cases created, or ${user._count.approvals} approvals decided. Deactivate their account instead.`
      );
    }

    return prisma.user.delete({
      where: { id },
    });
  }
}
export default UserService;
