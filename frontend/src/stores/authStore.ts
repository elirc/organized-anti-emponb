import { create } from 'zustand';
import api from '../utils/api';

export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'HR_ADMIN'
  | 'HR_SPECIALIST'
  | 'MANAGER'
  | 'IT_ADMIN'
  | 'PAYROLL_ADMIN'
  | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkMe: () => Promise<User | null>;
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
}

export const PermissionMatrix: Record<string, UserRole[]> = {
  MANAGE_USERS: ['SYSTEM_ADMIN', 'HR_ADMIN'],
  CREATE_ONBOARDING_CASE: ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_SPECIALIST'],
  VIEW_ALL_CASES: ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_SPECIALIST'],
  VIEW_AUDIT_LOGS: ['SYSTEM_ADMIN', 'HR_ADMIN'],
  VIEW_REPORTS: ['SYSTEM_ADMIN', 'HR_ADMIN', 'HR_SPECIALIST'],
  APPROVE_MANAGER_STEP: ['SYSTEM_ADMIN', 'MANAGER'],
  COMPLETE_IT_TASK: ['SYSTEM_ADMIN', 'IT_ADMIN'],
  COMPLETE_PAYROLL_TASK: ['SYSTEM_ADMIN', 'PAYROLL_ADMIN'],
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = res.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return user;
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      set({ isLoading: false, error: errMsg });
      throw new Error(errMsg);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      console.warn('⚠️ Log out request to server bypassed:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  checkMe: async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return null;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data;
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return user;
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return null;
    }
  },

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;

    // Super Admin Bypass
    if (user.role === 'SYSTEM_ADMIN') return true;

    const allowedRoles = PermissionMatrix[permission];
    if (!allowedRoles) return false;

    return allowedRoles.includes(user.role);
  },
}));

export default useAuthStore;
