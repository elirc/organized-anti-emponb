import { describe, it, expect, vi } from 'vitest';
import { OnboardingProgressService } from '../onboardingProgress.service';

describe('OnboardingProgressService', () => {
  it('should return 0 progress if no tasks exist', async () => {
    const mockTx = {
      onboardingTask: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      onboardingCase: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    const progress = await OnboardingProgressService.recalculateOnboardingProgress('test-case-id', mockTx as any);
    expect(progress).toBe(0);
    expect(mockTx.onboardingCase.update).not.toHaveBeenCalled();
  });

  it('should correctly calculate percentage completed and skipped tasks', async () => {
    const mockTasks = [
      { id: '1', status: 'COMPLETED' },
      { id: '2', status: 'SKIPPED' },
      { id: '3', status: 'TODO' },
      { id: '4', status: 'IN_PROGRESS' },
    ];

    const mockTx = {
      onboardingTask: {
        findMany: vi.fn().mockResolvedValue(mockTasks),
      },
      onboardingCase: {
        findUnique: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS', completedAt: null }),
        update: vi.fn(),
      },
    };

    const progress = await OnboardingProgressService.recalculateOnboardingProgress('test-case-id', mockTx as any);
    expect(progress).toBe(50); // 2 out of 4 tasks = 50%
    expect(mockTx.onboardingCase.update).toHaveBeenCalledWith({
      where: { id: 'test-case-id' },
      data: { progressPercent: 50 },
    });
  });

  it('should mark case as COMPLETED if progress reaches 100%', async () => {
    const mockTasks = [
      { id: '1', status: 'COMPLETED' },
      { id: '2', status: 'SKIPPED' },
    ];

    const mockTx = {
      onboardingTask: {
        findMany: vi.fn().mockResolvedValue(mockTasks),
      },
      onboardingCase: {
        findUnique: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS', completedAt: null }),
        update: vi.fn(),
      },
    };

    const progress = await OnboardingProgressService.recalculateOnboardingProgress('test-case-id', mockTx as any);
    expect(progress).toBe(100);
    
    // Extract update call data
    const updateCall = mockTx.onboardingCase.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('COMPLETED');
    expect(updateCall.data.progressPercent).toBe(100);
    expect(updateCall.data.completedAt).toBeInstanceOf(Date);
  });

  it('should transition status back to IN_PROGRESS if task is reopened', async () => {
    const mockTasks = [
      { id: '1', status: 'COMPLETED' },
      { id: '2', status: 'TODO' },
    ];

    const mockTx = {
      onboardingTask: {
        findMany: vi.fn().mockResolvedValue(mockTasks),
      },
      onboardingCase: {
        findUnique: vi.fn().mockResolvedValue({ status: 'COMPLETED', completedAt: new Date() }),
        update: vi.fn(),
      },
    };

    const progress = await OnboardingProgressService.recalculateOnboardingProgress('test-case-id', mockTx as any);
    expect(progress).toBe(50);
    
    const updateCall = mockTx.onboardingCase.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('IN_PROGRESS');
    expect(updateCall.data.progressPercent).toBe(50);
  });
});
