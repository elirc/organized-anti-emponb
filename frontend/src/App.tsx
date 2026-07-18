import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from './stores/authStore';

// Lazy load / import pages
import Login from './pages/Login';
import ConsoleLayout from './components/ConsoleLayout';
import CasesList from './pages/CasesList';
import CaseDetails from './pages/CaseDetails';
import ApprovalsList from './pages/ApprovalsList';
import Reports from './pages/Reports';

// Route Guard for authenticated workspaces
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col text-slate-400">
        <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs mt-4">Verifying session status...</p>
      </div>
    );
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

export default function App() {
  const checkMe = useAuthStore((state) => state.checkMe);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check session on startup
    checkMe().then((resolvedUser) => {
      // If authentic and on root or login page, redirect to pipelines dashboard
      if (resolvedUser && (location.pathname === '/login' || location.pathname === '/')) {
        navigate('/cases');
      }
    });
  }, []);

  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col text-slate-400">
        <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h1 className="text-lg font-bold text-white tracking-wider animate-pulse">HRFLOW OPERATIONS</h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-650 mt-1">Booting micro-services and workspaces...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Private Consolidated Workspaces */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <ConsoleLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/cases" replace />} />
        <Route path="cases" element={<CasesList />} />
        <Route path="cases/:id" element={<CaseDetails />} />
        <Route path="approvals" element={<ApprovalsList />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* Wildcard redirection */}
      <Route path="*" element={<Navigate to="/cases" replace />} />
    </Routes>
  );
}
