import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../stores/authStore';
import {
  ArrowLeft,
  Calendar,
  Building,
  Briefcase,
  UploadCloud,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react';

export default function CaseDetails() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any>(null);
  
  // File upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('ID');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Document review state
  const [reviewRemarks, setReviewRemarks] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const fetchData = async () => {
    try {
      const res = await api.get(`/onboarding-cases/${id}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch case detail:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to load user directories:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, [id]);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/onboarding-tasks/${taskId}`, { status: newStatus });
      fetchData();
      if (activeTask?.id === taskId) {
        // Refresh active task detail
        const taskRes = await api.get(`/onboarding-tasks/${taskId}`);
        setActiveTask(taskRes.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleReassignTask = async (taskId: string, userId: string | null) => {
    try {
      await api.patch(`/onboarding-tasks/${taskId}`, { assignedToId: userId || null });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Reassignment failed');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!selectedFile) {
      setUploadError('Please select a physical file first.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('onboardingCaseId', id!);
    formData.append('title', uploadTitle);
    formData.append('category', uploadCategory);

    try {
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadTitle('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      fetchData();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReviewDocument = async (docId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.post(`/documents/${docId}/review`, {
        status,
        remarks: reviewRemarks || undefined,
      });
      setReviewRemarks('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Review submission failed');
    }
  };

  if (!data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center flex-col">
        <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 mt-4">Loading candidate workspace details...</p>
      </div>
    );
  }

  const candidateName = data.employeeProfile.preferredName || `${data.employeeProfile.legalFirstName} ${data.employeeProfile.legalLastName}`;

  return (
    <div className="space-y-8">
      {/* Back button and profile card */}
      <div className="flex items-center space-x-4">
        <Link
          to="/cases"
          className="p-2 border border-slate-800 rounded-xl hover:bg-slate-900/60 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Workspace Dashboard</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{candidateName}</h1>
        </div>
      </div>

      {/* Grid Layout splits Profile/Progress and Active work */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Column: checklist and stages */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Main Checklist Card */}
          <div className="glass-panel p-6 rounded-2xl border-slate-800">
            <h2 className="text-xl font-bold text-white mb-4">Onboarding Checklist Tasks</h2>
            
            <div className="space-y-4">
              {data.tasks.map((task: any) => (
                <div
                  key={task.id}
                  onClick={() => setActiveTask(activeTask?.id === task.id ? null : task)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    activeTask?.id === task.id
                      ? 'border-indigo-500/40 bg-indigo-500/5'
                      : 'border-slate-850 bg-slate-900/20 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="flex-shrink-0">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle className="h-5 w-5 text-emerald-400" />
                        ) : task.status === 'PENDING_APPROVAL' ? (
                          <Clock className="h-5 w-5 text-amber-400 animate-pulse" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-slate-700"></div>
                        )}
                      </div>
                      <div className="truncate">
                        <span className={`text-sm font-bold text-white block ${task.status === 'COMPLETED' && 'line-through text-slate-500'}`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">
                          Type: {task.taskType} {task.requiresApproval && '• Requires Approval'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Due: {new Date(task.dueDate).toLocaleDateString(undefined, { dateStyle: 'short' })}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        task.status === 'COMPLETED' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' :
                        task.status === 'PENDING_APPROVAL' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-slate-800 text-slate-400'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Task Actions panel */}
                  {activeTask?.id === task.id && (
                    <div className="mt-4 pt-4 border-t border-slate-850 space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                      <p className="text-xs text-slate-400 leading-relaxed">{task.description || 'No description provided.'}</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {/* Status update controller */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Checklist Action
                          </label>
                          <div className="flex gap-2">
                            {task.status !== 'COMPLETED' && task.status !== 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                                  className="text-xs bg-emerald-500 hover:bg-emerald-600 font-bold px-3 py-2 rounded-lg text-white"
                                >
                                  Mark Completed
                                </button>
                                <button
                                  onClick={() => handleUpdateTaskStatus(task.id, 'SKIPPED')}
                                  className="text-xs border border-slate-800 hover:bg-slate-900 font-bold px-3 py-2 rounded-lg text-slate-350"
                                >
                                  Skip
                                </button>
                              </>
                            )}
                            {task.status === 'COMPLETED' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'TODO')}
                                className="text-xs border border-slate-800 hover:bg-slate-900 font-bold px-3 py-2 rounded-lg text-slate-350"
                              >
                                Reopen Task
                              </button>
                            )}
                            {task.status === 'PENDING_APPROVAL' && (
                              <div className="flex items-center space-x-1 text-xs text-amber-400">
                                <Clock className="h-4 w-4" />
                                <span>Awaiting admin sign-off approval</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Reassignment controller */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Assigned Hand-off
                          </label>
                          <select
                            value={task.assignedToId || ''}
                            onChange={(e) => handleReassignTask(task.id, e.target.value || null)}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="">Unassigned Role: {task.assignedRole || 'None'}</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName} ({u.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Profile metadata and Document Upload panels */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Candidate Profile Info card */}
          <div className="glass-panel p-6 rounded-2xl border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Workspace Details</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-slate-300">
                <Briefcase className="h-4 w-4 text-slate-500" />
                <span className="text-xs">{data.employeeProfile.jobTitle}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <Building className="h-4 w-4 text-slate-500" />
                <span className="text-xs">{data.department.name}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-xs">
                  {new Date(data.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-slate-300">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-xs">{data.employeeProfile.personalEmail || 'No personal email'}</span>
              </div>
            </div>

            <div className="border-t border-slate-850 mt-6 pt-4">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-500">Case Status</span>
                <span className="text-white font-bold">{data.status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Progress Completed</span>
                <span className="text-indigo-400 font-bold">{data.progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Document Upload panel */}
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compliance Document Uploads</h3>
            
            {uploadError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px]">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-3">
              <input
                type="text"
                required
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Document Title (e.g. Passport)"
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
              />

              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ID">Identity Document (Passport/DL)</option>
                <option value="TAX_FORM">Tax Verification Form</option>
                <option value="CONTRACT">Signed Employment Contract</option>
                <option value="HANDBOOK_ACK">Handbook Acknowledgment</option>
              </select>

              <div className="relative">
                <input
                  type="file"
                  required
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-slate-900 border border-dashed border-slate-800 rounded-lg flex items-center justify-center space-x-2 text-xs text-slate-400 hover:text-white"
                >
                  <UploadCloud className="h-4 w-4 text-slate-500" />
                  <span>{selectedFile ? selectedFile.name : 'Choose physical file...'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                {isUploading ? 'Uploading file...' : 'Submit Document'}
              </button>
            </form>

            {/* Uploaded Documents List */}
            <div className="border-t border-slate-850 pt-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Submitted Uploads</span>
              {data.documents.length === 0 ? (
                <span className="text-xs text-slate-600 block">No documents uploaded yet.</span>
              ) : (
                <div className="space-y-3">
                  {data.documents.map((doc: any) => (
                    <div key={doc.id} className="p-3 rounded-lg border border-slate-850 bg-slate-900/10 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-white block">{doc.title}</span>
                          <span className="text-[9px] text-slate-500 block truncate">{doc.fileName}</span>
                        </div>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          doc.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          doc.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {doc.status}
                        </span>
                      </div>

                      {/* Display reviewer remarks if present */}
                      {doc.remarks && (
                        <p className="text-[10px] text-rose-400/90 leading-relaxed bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                          Remarks: {doc.remarks}
                        </p>
                      )}

                      {/* View document link */}
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 block"
                      >
                        Download Physical Asset
                      </a>

                      {/* HR Document Review module */}
                      {doc.status === 'PENDING' && hasPermission('CREATE_ONBOARDING_CASE') && (
                        <div className="pt-2 border-t border-slate-850/50 space-y-2">
                          <input
                            type="text"
                            value={reviewRemarks}
                            onChange={(e) => setReviewRemarks(e.target.value)}
                            placeholder="Rejection remarks (optional)..."
                            className="w-full bg-slate-900/80 border border-slate-850 rounded px-2.5 py-1 text-[10px] text-white placeholder-slate-600 focus:outline-none"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleReviewDocument(doc.id, 'APPROVED')}
                              className="text-[9px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReviewDocument(doc.id, 'REJECTED')}
                              className="text-[9px] font-bold bg-rose-500 hover:bg-rose-600 text-white px-2 py-1 rounded"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
