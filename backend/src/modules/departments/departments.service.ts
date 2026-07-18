import { prisma } from '../../db/prisma';
import { AppError } from '../../shared/errors/AppError';
import { ErrorCodes } from '../../shared/errors/errorCodes';
import { CreateDepartmentInput, UpdateDepartmentInput } from './departments.schemas';

export class DepartmentService {
  static async getAll() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, cases: true }
        }
      }
    });
  }

  static async getById(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    if (!dept) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Department not found');
    }

    return dept;
  }

  static async create(input: CreateDepartmentInput) {
    const existing = await prisma.department.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new AppError(ErrorCodes.BAD_REQUEST, 400, 'A department with this name already exists');
    }

    return prisma.department.create({
      data: {
        name: input.name,
        description: input.description,
      },
    });
  }

  static async update(id: string, input: UpdateDepartmentInput) {
    // Check department exists
    await this.getById(id);

    if (input.name) {
      const existing = await prisma.department.findFirst({
        where: {
          name: input.name,
          id: { not: id },
        },
      });
      if (existing) {
        throw new AppError(ErrorCodes.BAD_REQUEST, 400, 'Another department already has this name');
      }
    }

    return prisma.department.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
      },
    });
  }

  static async delete(id: string) {
    // Check exists
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, cases: true }
        }
      }
    });

    if (!dept) {
      throw new AppError(ErrorCodes.NOT_FOUND, 404, 'Department not found');
    }

    // Business safeguard: prevent deleting departments with active dependencies
    if (dept._count.users > 0) {
      throw new AppError(
        ErrorCodes.BAD_REQUEST,
        400,
        `Cannot delete department: ${dept._count.users} user(s) are currently assigned to it`
      );
    }

    if (dept._count.cases > 0) {
      throw new AppError(
        ErrorCodes.BAD_REQUEST,
        400,
        `Cannot delete department: ${dept._count.cases} onboarding case(s) are linked to it`
      );
    }

    return prisma.department.delete({
      where: { id },
    });
  }
}
export default DepartmentService;
