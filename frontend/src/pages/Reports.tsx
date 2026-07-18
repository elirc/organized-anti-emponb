import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Building,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function Reports() {
  const [casesSummary, setCasesSummary] = useState<any>(null);
  const [deptMetrics, setDeptMetrics] = useState<any[]>([]);
  const [tasksSummary, setTasksSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [casesRes, deptsRes, tasksRes] = await Promise.all([
        api.get('/reports/cases'),
        api.get('/reports/departments'),
        api.get('/reports/tasks'),
      ]);
      setCasesSummary(casesRes.data.data);
      setDeptMetrics(deptsRes.data.data);
      setTasksSummary(tasksRes.data.data);
    } catch (err) {
      console.error('Failed to load operational reporting metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  if (isLoading || !casesSummary || !tasksSummary) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center flex-col">
        <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 mt-4">Generating reporting aggregates & metrics...</p>
      </div>
    );
  }

  // Calculate global completed rate
  const completedRate = casesSummary.total > 0 
    ? Math.round((casesSummary.COMPLETED / casesSummary.total) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Page Title Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Operations Intelligence</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time pipeline analytics, SLA monitoring, and department cycle efficiency metrics.
          </p>
        </div>
        <button
          onClick={fetchReportData}
          className="flex items-center space-x-2 border border-slate-800 hover:bg-slate-900/60 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
        >
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Onboarded Workforce</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-white block mt-3">
            {casesSummary.COMPLETED}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Total completed cases</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Pipelines</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-white block mt-3">
            {casesSummary.IN_PROGRESS + casesSummary.PENDING_APPROVAL + casesSummary.BLOCKED}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Cases in active states</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fulfillment Rate</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-white block mt-3">
            {completedRate}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Onboarding success ratio</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">SLA Overdue Tasks</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-rose-450 block mt-3">
            {tasksSummary.overdue}
          </span>
          <span className="text-[10px] text-rose-400/70 block mt-1">Overdue checklist items</span>
        </div>
      </div>

      {/* Main Grid Splits: Funnel vs Department SLA metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column - Onboarding distribution status chart */}
        <div className="md:col-span-6 glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Pipeline Stage Allocations</h2>
          
          <div className="space-y-4">
            {[
              { label: 'Draft Cases', val: casesSummary.DRAFT, color: 'bg-slate-700' },
              { label: 'Not Started', val: casesSummary.NOT_STARTED, color: 'bg-blue-500' },
              { label: 'In Progress', val: casesSummary.IN_PROGRESS, color: 'bg-indigo-500' },
              { label: 'Pending Approvals', val: casesSummary.PENDING_APPROVAL, color: 'bg-amber-500' },
              { label: 'Blocked Pipelines', val: casesSummary.BLOCKED, color: 'bg-rose-500' },
              { label: 'Completed Case Setups', val: casesSummary.COMPLETED, color: 'bg-emerald-500' },
            ].map((row) => {
              const pct = casesSummary.total > 0 ? Math.round((row.val / casesSummary.total) * 100) : 0;
              return (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-350 font-medium">{row.label}</span>
                    <span className="text-white font-bold">{row.val} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-850">
                    <div
                      className={`h-full ${row.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Checklist Tasks fulfillment statistics */}
        <div className="md:col-span-6 glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Checklist Tasks Breakdown</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unassigned / Open</span>
              <span className="text-2xl font-extrabold text-white mt-2">{tasksSummary.TODO}</span>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">In Progress</span>
              <span className="text-2xl font-extrabold text-indigo-400 mt-2">{tasksSummary.IN_PROGRESS}</span>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pending Sign-off</span>
              <span className="text-2xl font-extrabold text-amber-400 mt-2">{tasksSummary.PENDING_APPROVAL}</span>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed / Skipped</span>
              <span className="text-2xl font-extrabold text-emerald-400 mt-2">
                {tasksSummary.COMPLETED + tasksSummary.SKIPPED}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SLA Department cycle time stats table */}
      <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Departmental Performance & SLAs</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="pb-3 pl-4">Department</th>
                <th className="pb-3 text-center">Total cases</th>
                <th className="pb-3 text-center">Active setups</th>
                <th className="pb-3 text-center">Completed setups</th>
                <th className="pb-3 text-right pr-4">Average Cycle SLA (Days)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
              {deptMetrics.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-900/20 transition-colors">
                  <td className="py-4 pl-4 font-bold text-white flex items-center space-x-2">
                    <Building className="h-4 w-4 text-indigo-400" />
                    <span>{dept.name}</span>
                  </td>
                  <td className="py-4 text-center">{dept.totalCases}</td>
                  <td className="py-4 text-center">{dept.activeCases}</td>
                  <td className="py-4 text-center">{dept.completedCases}</td>
                  <td className="py-4 text-right pr-4 font-bold">
                    {dept.averageDurationDays > 0 ? (
                      <span className="text-emerald-400">{dept.averageDurationDays} days</span>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
