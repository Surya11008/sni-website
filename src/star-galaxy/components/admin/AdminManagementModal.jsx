import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  KeyRound,
  Users,
  Calendar,
  ArrowUpCircle,
  X,
  CheckCircle,
  AlertCircle,
  Lock,
  Flame,
  Cloud,
  ExternalLink,
  Database,
  Trash2,
} from 'lucide-react';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isFirebaseConfigured,
} from '../../firebase/firebaseConfig';

export default function AdminManagementModal({ onClose }) {
  const {
    data,
    approveUser,
    rejectUser,
    deleteUser,
    resetPassword,
    setManagerRole,
    assignMemberToManager,
    updateManagerPermission,
    publishAppUpdate,
  } = useApp();

  const [activeSection, setActiveSection] = useState('users'); // 'users' | 'approvals' | 'managers' | 'update' | 'firebase'
  const [successMsg, setSuccessMsg] = useState('');

  // Firebase Config state
  const storedConfig = getStoredFirebaseConfig() || {};
  const [fbApiKey, setFbApiKey] = useState(storedConfig.apiKey || '');
  const [fbProjectId, setFbProjectId] = useState(storedConfig.projectId || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(storedConfig.authDomain || '');
  const [fbStorageBucket, setFbStorageBucket] = useState(storedConfig.storageBucket || '');
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(storedConfig.messagingSenderId || '');
  const [fbAppId, setFbAppId] = useState(storedConfig.appId || '');
  const [snippetPaste, setSnippetPaste] = useState('');

  const isConnected = isFirebaseConfigured();

  // Update Broadcast form state
  const [newVersion, setNewVersion] = useState('1.2.0');
  const [updateTitle, setUpdateTitle] = useState('Exciting New Star Galaxy Features');
  const [updateDetails, setUpdateDetails] = useState('Updated Academy checklists and smoother performance.');

  // Manager permission edit state
  const [selectedMgrId, setSelectedMgrId] = useState(data.users.find(u => u.role === 'manager')?.id || '');
  const [permMode, setPermMode] = useState('standard');
  const [permMaxDays, setPermMaxDays] = useState(7);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const managers = data.users.filter(u => u.role === 'manager');
  const approvedMembers = data.users.filter(u => u.role === 'member' && u.status === 'approved');
  const pendingUsers = data.users.filter(u => u.status === 'pending');

  const flashSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleApprove = (userId) => {
    approveUser(userId);
    flashSuccess('User approved successfully!');
  };

  const handleReject = (userId) => {
    if (!confirm('Reject and delete this registration application?')) return;
    rejectUser(userId);
    flashSuccess('Application rejected.');
  };

  const handleDeleteUser = (user) => {
    if (user.role === 'admin' || user.id === 'surya11008') {
      alert('Admin account cannot be deleted!');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${user.name}" (${user.phone})?\n\n⚠️ All user records and earned stars will be permanently deleted.`
    );
    if (!confirmed) return;

    deleteUser(user.id);
    flashSuccess(`User "${user.name}" has been deleted.`);
  };

  const handleResetPass = async (user) => {
    const entered = window.prompt(
      `Enter new password for "${user.name}" (${user.username || user.phone}):`,
      `StarPass${Math.floor(1000 + Math.random() * 9000)}`
    );
    if (!entered || !entered.trim()) return;
    const cleanNewPass = entered.trim();
    const res = await resetPassword(user.id, cleanNewPass);
    if (res.success) {
      flashSuccess(`Password for "${user.name}" updated to: "${cleanNewPass}"`);
    }
  };

  const handleToggleManager = async (userId, currentRole) => {
    const isNowManager = currentRole !== 'manager';
    await setManagerRole(userId, isNowManager);
    flashSuccess(`${isNowManager ? 'Appointed as Manager' : 'Removed from Manager'}`);
  };

  const handleAssignChange = async (memberId, managerId) => {
    await assignMemberToManager(memberId, managerId);
    flashSuccess('Member assigned to manager successfully!');
  };

  const handleSaveManagerPerm = (e) => {
    e.preventDefault();
    if (!selectedMgrId) return;
    updateManagerPermission(selectedMgrId, {
      mode: permMode,
      maxDays: Number(permMaxDays),
      customStartDate: customStart || null,
      customEndDate: customEnd || null,
    });
    flashSuccess('Manager Status Input Permissions updated!');
  };

  const handlePublishUpdate = (e) => {
    e.preventDefault();
    publishAppUpdate(newVersion, updateTitle, updateDetails);
    flashSuccess('App update broadcasted! Members will see the popup.');
  };

  const handleParseSnippet = () => {
    try {
      const apiKeyMatch = snippetPaste.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = snippetPaste.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = snippetPaste.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = snippetPaste.match(/storageBucket:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = snippetPaste.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = snippetPaste.match(/appId:\s*["']([^"']+)["']/);

      if (apiKeyMatch) setFbApiKey(apiKeyMatch[1]);
      if (authDomainMatch) setFbAuthDomain(authDomainMatch[1]);
      if (projectIdMatch) setFbProjectId(projectIdMatch[1]);
      if (storageBucketMatch) setFbStorageBucket(storageBucketMatch[1]);
      if (messagingSenderIdMatch) setFbMessagingSenderId(messagingSenderIdMatch[1]);
      if (appIdMatch) setFbAppId(appIdMatch[1]);

      flashSuccess('Firebase credentials parsed successfully!');
    } catch (e) {
      alert('Could not parse snippet. Please copy and paste individual keys.');
    }
  };

  const handleSaveFirebase = (e) => {
    e.preventDefault();
    if (!fbApiKey.trim() || !fbProjectId.trim()) {
      alert('API Key and Project ID are required.');
      return;
    }
    const config = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
      projectId: fbProjectId.trim(),
      storageBucket: fbStorageBucket.trim() || `${fbProjectId.trim()}.appspot.com`,
      messagingSenderId: fbMessagingSenderId.trim() || '',
      appId: fbAppId.trim() || '',
    };
    saveFirebaseConfig(config);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-2xl lg:max-w-5xl w-full p-5 sm:p-7 shadow-2xl border-2 border-purple-200 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                👑 Admin Management Panel
              </h2>
              <p className="text-[11px] text-slate-500">
                Full governance, User approvals, Manager appointments & Security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100 mb-4 text-xs">
          <button
            onClick={() => setActiveSection('users')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeSection === 'users' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Members ({data.users.length})
          </button>
          <button
            onClick={() => setActiveSection('approvals')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all relative ${
              activeSection === 'approvals' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Approvals
            {pendingUsers.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('managers')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeSection === 'managers' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Manager Permissions
          </button>
          <button
            onClick={() => setActiveSection('update')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeSection === 'update' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Broadcast App Update
          </button>
          <button
            onClick={() => setActiveSection('firebase')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
              activeSection === 'firebase'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-300" />
            <span>Firebase Cloud</span>
            {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />}
          </button>
        </div>

        {/* 1. All Members Tab */}
        {activeSection === 'users' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase">
              Registered Accounts & Role Controls
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.users.map(u => (
                <div
                  key={u.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs text-slate-800">{u.name}</strong>
                      <span className={`px-2 py-0.2 rounded-md text-[10px] font-extrabold uppercase ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                        u.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role}
                      </span>
                      {u.status === 'pending' && (
                        <span className="px-2 py-0.2 rounded-md text-[10px] bg-rose-100 text-rose-800 font-bold">
                          PENDING
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Phone: <code className="text-slate-700">{u.phone}</code> • Place: {u.place || 'N/A'} • PIN: {u.personalPin || 'Not Set'}
                    </div>
                    {u.role === 'member' && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-400">Assigned Manager:</span>
                        <select
                          value={u.assignedManagerId || ''}
                          onChange={(e) => handleAssignChange(u.id, e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700"
                        >
                          <option value="">Unassigned</option>
                          {managers.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleToggleManager(u.id, u.role)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                          u.role === 'manager'
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {u.role === 'manager' ? 'Demote to Member' : 'Make Manager'}
                      </button>
                    )}
                    <button
                      onClick={() => handleResetPass(u)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1 cursor-pointer"
                      title="Reset member password"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Reset Pass</span>
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1 shadow-2xs"
                        title="Permanently Delete User"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Pending Approvals Tab (Page 70) */}
        {activeSection === 'approvals' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-600 uppercase">
              New Account Registrations (Admin Approval Required)
            </h3>
            {pendingUsers.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No pending registrations at this moment. All clear! ✓
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pendingUsers.map(applicant => (
                  <div
                    key={applicant.id}
                    className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{applicant.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phone: <strong>{applicant.phone}</strong> • Place: {applicant.place} • Registered: {applicant.createdAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(applicant.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(applicant.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. Manager Permissions Tab (Pages 4, 5, 6) */}
        {activeSection === 'managers' && (
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 leading-relaxed">
              <strong>Manager Status Input Permission Rule:</strong> By default, Managers can record status up to 7 days back. Admin can adjust custom date ranges or time limits here.
            </div>

            <form onSubmit={handleSaveManagerPerm} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700">Select Manager</label>
                <select
                  value={selectedMgrId}
                  onChange={(e) => setSelectedMgrId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-semibold"
                >
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.nickname})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Permission Mode</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { key: 'standard', label: 'Standard 7 Days' },
                    { key: 'days_limit', label: 'Extended Days' },
                    { key: 'custom_range', label: 'Custom Date Range' },
                  ].map(mode => (
                    <button
                      type="button"
                      key={mode.key}
                      onClick={() => setPermMode(mode.key)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        permMode === mode.key ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {permMode === 'days_limit' && (
                <div>
                  <label className="text-xs font-bold text-slate-700">Days Limit (e.g. 14, 30 days)</label>
                  <input
                    type="number"
                    min="1"
                    value={permMaxDays}
                    onChange={(e) => setPermMaxDays(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  />
                </div>
              )}

              {permMode === 'custom_range' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Allowed From Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Allowed To Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Save Permission Rule
              </button>
            </form>
          </div>
        )}

        {/* 4. Broadcast App Update Tab (Pages 70-72) */}
        {activeSection === 'update' && (
          <form onSubmit={handlePublishUpdate} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
              <span>Broadcast App Version Update</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Publishing will show the Home popup for all members with "View Update" and "Close" buttons.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700">New Version String</label>
              <input
                type="text"
                required
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="e.g. 1.2.0"
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Update Title</label>
              <input
                type="text"
                required
                value={updateTitle}
                onChange={(e) => setUpdateTitle(e.target.value)}
                placeholder="Title..."
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Release Notes / Details</label>
              <textarea
                required
                rows={3}
                value={updateDetails}
                onChange={(e) => setUpdateDetails(e.target.value)}
                placeholder="Explain what is new..."
                className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Broadcast Update to All Members</span>
            </button>
          </form>
        )}

        {/* 5. Firebase Cloud Database Setup Tab */}
        {activeSection === 'firebase' && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              isConnected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold ${
                  isConnected ? 'bg-emerald-600' : 'bg-amber-500'
                }`}>
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm">
                    {isConnected ? '🟢 Cloud Firestore Connected!' : '⚪ Local Mode (Ready to Connect)'}
                  </h4>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    {isConnected
                      ? `Project ID: ${storedConfig?.projectId} • Realtime cloud sync active`
                      : 'Data is currently saved in browser storage. Connect Firebase for permanent cloud backup.'}
                  </p>
                </div>
              </div>

              {isConnected && (
                <button
                  type="button"
                  onClick={clearFirebaseConfig}
                  className="px-3 py-1.5 bg-white border border-rose-300 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors"
                >
                  Disconnect
                </button>
              )}
            </div>

            {/* Quick Paste Snippet Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Option A: Paste Firebase Config Snippet</span>
                <span className="text-[10px] text-amber-700 font-semibold">Firebase Console &gt; Project Settings</span>
              </label>
              <textarea
                rows={3}
                value={snippetPaste}
                onChange={(e) => setSnippetPaste(e.target.value)}
                placeholder="const firebaseConfig = { apiKey: '...', projectId: '...', ... };"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-mono"
              />
              <button
                type="button"
                onClick={handleParseSnippet}
                className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors"
              >
                Auto Fill from Snippet
              </button>
            </div>

            {/* Form for Individual Keys */}
            <form onSubmit={handleSaveFirebase} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block uppercase">
                Option B: Enter Keys Manually
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600">Firebase API Key *</label>
                  <input
                    type="text"
                    required
                    value={fbApiKey}
                    onChange={(e) => setFbApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600">Project ID *</label>
                  <input
                    type="text"
                    required
                    value={fbProjectId}
                    onChange={(e) => setFbProjectId(e.target.value)}
                    placeholder="star-galaxy-app"
                    className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-600">Auth Domain</label>
                  <input
                    type="text"
                    value={fbAuthDomain}
                    onChange={(e) => setFbAuthDomain(e.target.value)}
                    placeholder="star-galaxy-app.firebaseapp.com"
                    className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600">App ID</label>
                  <input
                    type="text"
                    value={fbAppId}
                    onChange={(e) => setFbAppId(e.target.value)}
                    placeholder="1:123456789:web:abcdef"
                    className="w-full mt-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <Flame className="w-4 h-4 text-yellow-200" />
                <span>Save & Connect Firebase Cloud</span>
              </button>
            </form>

            {/* Step-by-Step Guide */}
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-950 space-y-2">
              <strong className="block font-black text-sky-900 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-sky-600" />
                <span>How to Setup Free Firebase Project (Quick Steps):</span>
              </strong>
              <ol className="list-decimal pl-4 space-y-1 text-slate-700 leading-relaxed text-[11px]">
                <li>
                  Open{' '}
                  <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-sky-700 font-bold underline inline-flex items-center gap-0.5">
                    <span>console.firebase.google.com</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  and click <strong>"Add project"</strong>.
                </li>
                <li>Enter project name <strong>"Star Galaxy"</strong>.</li>
                <li>After project creation, click the <strong>Web icon (&lt;/&gt;)</strong> to register web app.</li>
                <li>Copy the <code>firebaseConfig</code> code and paste it into the box above.</li>
                <li>From left menu, open <strong>Build &gt; Firestore Database</strong> and click <strong>"Create Database"</strong> (Start in test mode).</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
