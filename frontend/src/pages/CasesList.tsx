import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import {
  Plus,
  Search,
  Play,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck,
} from 'lucide-react';

export default function CasesList() {
  const [cases, setCases] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formProfileId, setFormProfileId] = useState('');
  const [formDeptId, setFormDeptId] = useState('');
  const [formTemplateId, setFormTemplateId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  const hasPermission = useAuthStore((state) => state.hasPermission);
  const navigate = useNavigate();

  const fetchCases = async () => {
    try {
      const res = await api.get('/onboarding-cases', {
        params: {
          search,
          status: statusFilter || undefined,
          departmentId: deptFilter || undefined,
        }
      });
      setCases(res.data.data);
    } catch (err) {
      console.error('Failed to load onboarding cases:', err);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [profilesRes, deptsRes, templatesRes] = await Promise.all([
        api.get('/employee-profiles'),
        api.get('/departments'),
        api.get('/workflow-templates'),
      ]);
      setProfiles(profilesRes.data.data);
      setDepartments(deptsRes.data.data);
      // Filter only active templates
      setTemplates(templatesRes.data.data.filter((t: any) => t.isActive));
    } catch (err) {
      console.error('Failed to fetch dropdown configurations:', err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [search, statusFilter, deptFilter]);

  useEffect(() => {
    if (isModalOpen) {
      fetchFormOptions();
    }
  }, [isModalOpen]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitLoading(true);

    try {
      await api.post('/onboarding-cases', {
        employeeProfileId: formProfileId,
        departmentId: formDeptId,
        workflowTemplateId: formTemplateId,
        startDate: formStartDate,
      });

      setIsModalOpen(false);
      setFormProfileId('');
      setFormDeptId('');
      setFormTemplateId('');
      setFormStartDate('');
      
      fetchCases();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create case');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleStartWorkflow = async (caseId: string) => {
    try {
      await api.post(`/onboarding-cases/${caseId}/start`);
      fetchCases();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start workflow');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'border-slate-800 bg-slate-900/30 text-slate-400';
      case 'NOT_STARTED':
        return 'border-blue-500/20 bg-blue-500/10 text-blue-400';
      case 'IN_PROGRESS':
        return 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400';
      case 'PENDING_APPROVAL':
        return 'border-amber-500/20 bg-amber-500/10 text-amber-400 animate-pulse';
      case 'BLOCKED':
        return 'border-rose-500/20 bg-rose-500/10 text-rose-400';
      case 'COMPLETED':
        return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
      default:
        return 'border-slate-800 bg-slate-900/30 text-slate-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header operations row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Onboarding Pipelines</h1>
          <p className="text-sm text-slate-400 mt-1">
            Initiate, track, and complete enterprise personnel workspace setups.
          </p>
        </div>

        {hasPermission('CREATE_ONBOARDING_CASE') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/10"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Draft Onboarding Case</span>
          </button>
        )}
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Cases</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-white block mt-3">
            {cases.filter((c) => ['IN_PROGRESS', 'PENDING_APPROVAL', 'BLOCKED'].includes(c.status)).length}
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Launch</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Play className="h-4 w-4" />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-white block mt-3">
            {cases.filter((c) => c.status === 'NOT_STARTED').length}
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Blocked Steps</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Plus className="h-4 w-4 rotate-45" />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-white block mt-3">
            {cases.filter((c) => c.status === 'BLOCKED').length}
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Finished</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <span className="text-3xl font-extrabold text-white block mt-3">
            {cases.filter((c) => c.status === 'COMPLETED').length}
          </span>
        </div>
      </div>

      {/* Filtering and search operations row */}
      <div className="glass-panel p-4 rounded-xl border-slate-800/80 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate legal or preferred name..."
            className="w-full bg-slate-900/40 border border-slate-800/80 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/40 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-900/40 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Onboarding Cases */}
      {cases.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border-slate-800 text-center">
          <FileText className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white">No onboarding cases found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Change filters, or draft a new employee onboarding case to begin workflow tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div
              key={c.id}
              className="glass-panel rounded-2xl border-slate-800 hover:border-slate-700/80 p-6 flex flex-col justify-between transition-all duration-300 shadow-md relative overflow-hidden group"
            >
              <div>
                {/* Header row */}
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">
                    {c.department.name}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadge(c.status)}`}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Candidate detail */}
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                  {c.employeeProfile.preferredName || `${c.employeeProfile.legalFirstName} ${c.employeeProfile.legalLastName}`}
                </h3>
                <span className="text-xs text-slate-400 block mt-0.5 font-medium">{c.employeeProfile.jobTitle}</span>

                {/* Start Date */}
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-4">
                  <span>Start Date:</span>
                  <span className="text-slate-350 font-medium">
                    {new Date(c.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>

                {/* Dynamic Progress indicator */}
                {c.status !== 'NOT_STARTED' && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-slate-500">Pipeline Progress</span>
                      <span className="text-white font-bold">{c.progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${c.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom command row */}
              <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                {c.status === 'NOT_STARTED' ? (
                  <button
                    onClick={() => handleStartWorkflow(c.id)}
                    className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Launch Workflow</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="flex items-center space-x-1 text-xs font-bold text-slate-400 hover:text-white transition-colors group/btn"
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1 text-slate-500 group-hover/btn:text-white" />
                  </button>
                )}

                <span className="text-[10px] text-slate-600">
                  {c.workflowTemplate.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal Slideover */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel w-full max-w-xl rounded-2xl border-slate-850 p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold text-white mb-2">Draft Onboarding Case</h2>
            <p className="text-xs text-slate-400 mb-6">
              Create a record linking employee candidates, organizational departments, and templates stages.
            </p>

            {actionError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Select Candidate Profile
                </label>
                <select
                  required
                  value={formProfileId}
                  onChange={(e) => setFormProfileId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose candidate...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.legalFirstName} {p.legalLastName} ({p.jobTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Department
                  </label>
                  <select
                    required
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Workflow Template
                  </label>
                  <select
                    required
                    value={formTemplateId}
                    onChange={(e) => setFormTemplateId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose template...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  First Day / Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-850 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-850 hover:bg-slate-900 text-slate-350 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitLoading}
                  className="px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-bold transition-colors"
                >
                  {isSubmitLoading ? 'Saving...' : 'Draft Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
