import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import {
  Users,
  CheckSquare,
  BarChart3,
  LogOut,
  Sparkles,
} from 'lucide-react';

export default function ConsoleLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      name: 'Onboarding Cases',
      path: '/cases',
      icon: Users,
      permission: null,
    },
    {
      name: 'Approvals Panel',
      path: '/approvals',
      icon: CheckSquare,
      permission: null, // Open to all, but inner actions checked
    },
    {
      name: 'Analytics Reports',
      path: '/reports',
      icon: BarChart3,
      permission: 'VIEW_REPORTS',
    },
  ];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HR_ADMIN':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'HR_SPECIALIST':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'MANAGER':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 overflow-x-hidden font-sans">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-500/5 blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none"></div>

      {/* Sidebar Panel */}
      <aside className="w-64 flex-shrink-0 glass-panel border-y-0 border-l-0 border-slate-800 flex flex-col z-20">
        
        {/* Brand header */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">HRFlow Console</span>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Operations Hub</span>
            </div>
          </div>
        </div>

        {/* Profile Card Summary */}
        {user && (
          <div className="p-4 mx-4 mt-6 rounded-xl border border-slate-800 bg-slate-900/30 flex flex-col space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="h-9 w-9 rounded-full bg-indigo-950 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold uppercase">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="truncate">
                <span className="font-bold text-xs text-white block truncate">{user.firstName} {user.lastName}</span>
                <span className="text-[10px] text-slate-400 block truncate">{user.email}</span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-800/50 flex items-center justify-between">
              <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full border uppercase ${getRoleBadgeColor(user.role)}`}>
                {user.role.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {menuItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) return null;

            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${
                  isActive
                    ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-350'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Bottom Trigger */}
        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 rounded-xl border border-transparent hover:border-rose-500/10 transition-all font-medium text-sm"
          >
            <LogOut className="h-4 w-4 text-slate-500 group-hover:text-rose-400" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 flex-shrink-0 border-b border-slate-800/60 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              {location.pathname === '/cases' && 'Onboarding Workflow Cases'}
              {location.pathname.startsWith('/cases/') && 'Onboarding Workspace'}
              {location.pathname === '/approvals' && 'Task Approvals Command'}
              {location.pathname === '/reports' && 'System Performance Analytics'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-500">Local Operations Dev Console</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
