import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  XCircle,
  CheckCircle,
  Clock,
  User,
  AlertCircle,
} from 'lucide-react';

export default function ApprovalsList() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [remarks, setRemarks] = useState<string>('');
  const [activeApprovalId, setActiveApprovalId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals');
      setApprovals(res.data.data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionError(null);
    if (status === 'REJECTED' && !remarks.trim()) {
      setActionError('Remarks/rejection reasons are strictly required for rejections.');
      return;
    }

    try {
      await api.post(`/approvals/${approvalId}/decide`, {
        status,
        remarks: remarks || undefined,
      });

      setRemarks('');
      setActiveApprovalId(null);
      fetchApprovals();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Decision failed.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Approvals Command Console</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review, sign off on compliance items, or return tasks for candidate revision.
        </p>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {approvals.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border-slate-800 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-400/80 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">All approvals resolved</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Outstanding onboarding tasks are currently in-progress or completed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {approvals.map((app) => (
            <div
              key={app.id}
              className={`glass-panel p-6 rounded-2xl border transition-all duration-350 ${
                app.status === 'PENDING' ? 'border-slate-800' : 'border-slate-850 opacity-70'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  Task Sign-off Request
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase tracking-wider ${
                  app.status === 'APPROVED' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                  app.status === 'REJECTED' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-400 animate-pulse'
                }`}>
                  {app.status}
                </span>
              </div>

              {/* Candidate Info */}
              <div className="flex items-center space-x-2.5 mb-4 bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Candidate Profile</span>
                  <span className="text-sm font-bold text-white">
                    {app.onboardingCase.employeeProfile.legalFirstName} {app.onboardingCase.employeeProfile.legalLastName}
                  </span>
                </div>
              </div>

              {/* Task Title & Description */}
              <h3 className="text-lg font-bold text-white leading-tight">{app.task.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-2">{app.task.description || 'No description provided.'}</p>

              {/* Requested Time */}
              <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-4">
                <Clock className="h-3.5 w-3.5" />
                <span>Requested on {new Date(app.requestedAt).toLocaleString()}</span>
              </div>

              {/* Pending Decisions Panel */}
              {app.status === 'PENDING' && (
                <div className="mt-6 pt-4 border-t border-slate-850 space-y-4">
                  {activeApprovalId === app.id ? (
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Decision Notes / Remarks
                      </label>
                      <textarea
                        required
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Provide details or reasons for approval/rejection decision..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                        rows={2}
                      />
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDecision(app.id, 'APPROVED')}
                          className="flex items-center space-x-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDecision(app.id, 'REJECTED')}
                          className="flex items-center space-x-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-lg"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Reject (Revise)</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveApprovalId(null);
                            setRemarks('');
                          }}
                          className="text-xs border border-slate-800 hover:bg-slate-900 text-slate-400 px-3 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveApprovalId(app.id);
                        setRemarks('');
                        setActionError(null);
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-bold text-slate-350 hover:text-white transition-colors"
                    >
                      Make Sign-off Decision
                    </button>
                  )}
                </div>
              )}

              {/* Resolved Decisions remarks display */}
              {app.status !== 'PENDING' && app.remarks && (
                <div className="mt-4 pt-4 border-t border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    Decision Remarks (Reviewed by {app.approver?.firstName} {app.approver?.lastName})
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                    {app.remarks}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
