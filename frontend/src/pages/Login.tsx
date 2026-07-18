import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { Shield, Sparkles, Key, Mail, Lock } from 'lucide-react';

const PERSONAS = [
  { name: 'System Admin', email: 'admin@hrflow.com', role: 'SYSTEM_ADMIN', desc: 'Central governance' },
  { name: 'HR Admin', email: 'hradmin@hrflow.com', role: 'HR_ADMIN', desc: 'Operations owner' },
  { name: 'HR Specialist', email: 'specialist@hrflow.com', role: 'HR_SPECIALIST', desc: 'Checklist setup & review' },
  { name: 'IT Admin', email: 'it@hrflow.com', role: 'IT_ADMIN', desc: 'Hardware & provisioning' },
  { name: 'Operations Manager', email: 'manager@hrflow.com', role: 'MANAGER', desc: 'Team approvals' },
  { name: 'Payroll Admin', email: 'payroll@hrflow.com', role: 'PAYROLL_ADMIN', desc: 'Direct deposit confirmations' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to main console
    if (user) {
      navigate('/cases');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(email, password);
      navigate('/cases');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    }
  };

  const handlePersonaClick = async (emailAddr: string) => {
    setEmail(emailAddr);
    setPassword('password123');
    setErrorMsg(null);
    try {
      await login(emailAddr, 'password123');
      navigate('/cases');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 overflow-hidden px-4 py-12">
      {/* Background Decorative Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 z-10">
        
        {/* Left Column - Product Wow Info */}
        <div className="md:col-span-6 flex flex-col justify-center text-white space-y-6">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold tracking-wider text-sm uppercase">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span>Enterprise Operations Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Managing Employee Onboarding{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Elevated.
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
            Automate candidates workflow tracking, checklist progression, inter-departmental approvals, and compliance metadata uploads.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="glass-panel p-4 rounded-xl border-slate-800">
              <span className="text-2xl font-bold text-emerald-400">100%</span>
              <p className="text-xs text-slate-400 mt-1">Audit Trail Integrity</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border-slate-800">
              <span className="text-2xl font-bold text-indigo-400">Zero</span>
              <p className="text-xs text-slate-400 mt-1">Task Bottlenecks</p>
            </div>
          </div>
        </div>

        {/* Right Column - Glassmorphic Login Form & Shortcuts */}
        <div className="md:col-span-6 flex flex-col space-y-6">
          
          <div className="glass-panel p-8 rounded-2xl border-slate-800 shadow-2xl relative">
            <div className="flex flex-col space-y-2 mb-6">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Access Operations Control</h2>
              <p className="text-sm text-slate-400">Sign in with credentials or choose a developer persona</p>
            </div>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Access Key
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Authenticating...' : 'Enter Operations Panel'}</span>
              </button>
            </form>

            {/* Developer Shortcut Matrix */}
            <div className="mt-8 border-t border-slate-800/80 pt-6">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                <Key className="h-3.5 w-3.5 text-amber-500" />
                <span>Developer Persona Quick-Logins</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PERSONAS.map((persona) => (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => handlePersonaClick(persona.email)}
                    className="flex flex-col text-left p-3 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900 hover:border-indigo-500/50 transition-all group"
                  >
                    <span className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {persona.name}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate mt-0.5">
                      {persona.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
