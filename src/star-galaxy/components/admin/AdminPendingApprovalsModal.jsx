import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  CheckCircle2,
  X,
  Clock,
  Phone,
  User,
  MapPin,
  Sparkles,
  CheckCheck,
  RotateCw,
  UserPlus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Key,
} from 'lucide-react';

export default function AdminPendingApprovalsModal({ isOpenOverride, onCloseOverride }) {
  const {
    data,
    currentUser,
    approveUser,
    rejectUser,
    quickAddAndApproveMember,
    refreshRegistrations,
    updateAutoUserApproval,
    showPendingApprovalsModal,
    setShowPendingApprovalsModal,
  } = useApp();

  const autoApprovalEnabled = data?.settings?.autoUserApproval !== false;

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'admin' || currentUser?.id === 'surya11008';
  const [sessionApprovedIds, setSessionApprovedIds] = useState(() => new Set());

  // Filter only applicants who have completed real email verification and are waiting for Admin approval
  const pendingUsers = (data?.users || []).filter(u => {
    if (!u || u.role === 'ADMIN' || u.role === 'admin' || u.id === 'surya11008') return false;
    if (sessionApprovedIds.has(u.id)) return false;
    const s = (u.status || '').toLowerCase().trim();
    if (s === 'approved' || s === 'unverified' || s === 'rejected' || s === 'revoked') return false;
    const isEmailVerified = u.emailVerified === true && (u.contactVerified === true || u.isVerified === true);
    return isEmailVerified && (s === 'pending' || s === 'waiting');
  });

  const [hasSkipped, setHasSkipped] = useState(() => {
    try {
      return sessionStorage.getItem('skip_pending_approvals_modal') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [actionFeedback, setActionFeedback] = useState(null); // { id, type, name }
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);

  // Manual Member Add/Recovery state
  const [manualForm, setManualForm] = useState({
    fullName: '',
    username: '',
    contact: '',
    nickname: '',
    place: '',
    password: '',
  });
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState('');

  // If new pending users arrive, unskip automatically so Admin gets notified
  const [prevPendingCount, setPrevPendingCount] = useState(pendingUsers.length);
  useEffect(() => {
    if (pendingUsers.length > prevPendingCount) {
      setHasSkipped(false);
      try {
        sessionStorage.removeItem('skip_pending_approvals_modal');
      } catch (e) {}
    }
    setPrevPendingCount(pendingUsers.length);
  }, [pendingUsers.length, prevPendingCount]);

  // Determine if modal should be open:
  const isVisible = isOpenOverride !== undefined
    ? isOpenOverride
    : (isAdmin && (showPendingApprovalsModal || (pendingUsers.length > 0 && !hasSkipped)));

  if (!isAdmin || !isVisible) {
    return null;
  }

  const handleSkip = () => {
    setHasSkipped(true);
    if (setShowPendingApprovalsModal) setShowPendingApprovalsModal(false);
    try {
      sessionStorage.setItem('skip_pending_approvals_modal', 'true');
    } catch (e) {}
    if (onCloseOverride) onCloseOverride();
  };

  const handleApprove = (userId, name) => {
    setSessionApprovedIds(prev => new Set(prev).add(userId));
    approveUser(userId);
    setActionFeedback({ id: userId, type: 'approve', name });
    setTimeout(() => {
      setActionFeedback(null);
      if (pendingUsers.length <= 1) {
        handleSkip();
      }
    }, 1500);
  };

  const handleReject = (userId, name) => {
    if (!confirm(`Are you sure you want to reject and delete registration for "${name}"?`)) {
      return;
    }
    rejectUser(userId);
    setActionFeedback({ id: userId, type: 'reject', name });
    setTimeout(() => {
      setActionFeedback(null);
      if (pendingUsers.length <= 1) {
        handleSkip();
      }
    }, 1500);
  };

  const handleApproveAll = () => {
    if (!confirm(`Approve all ${pendingUsers.length} pending members?`)) return;
    const allIds = pendingUsers.map(u => u.id);
    setSessionApprovedIds(prev => new Set([...prev, ...allIds]));
    pendingUsers.forEach(u => approveUser(u.id));
    setActionFeedback({ id: 'all', type: 'approve', name: `All ${pendingUsers.length} members` });
    setTimeout(() => {
      setActionFeedback(null);
      handleSkip();
    }, 1500);
  };

  const handleRefresh = async () => {
    if (!refreshRegistrations) return;
    setIsRefreshing(true);
    try {
      const res = await refreshRegistrations();
      setActionFeedback({
        id: 'refresh',
        type: 'approve',
        name: `Cloud sync completed! (${res?.count || 0} pending detected)`,
      });
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualError('');
    setManualSuccess('');

    if (!manualForm.fullName.trim() || !manualForm.username.trim()) {
      setManualError('Full Name and User ID (Username) are required!');
      return;
    }

    try {
      const res = await quickAddAndApproveMember({
        fullName: manualForm.fullName.trim(),
        username: manualForm.username.trim(),
        contact: manualForm.contact.trim(),
        nickname: manualForm.nickname.trim(),
        place: manualForm.place.trim(),
        password: manualForm.password.trim() || 'StarPass2026!',
      });

      if (!res.success) {
        setManualError(res.error || 'Failed to add member.');
        return;
      }

      setManualSuccess(res.message || 'Member added and approved!');
      setManualForm({
        fullName: '',
        username: '',
        contact: '',
        nickname: '',
        place: '',
        password: '',
      });
      setTimeout(() => {
        setManualSuccess('');
        setShowManualAdd(false);
      }, 2000);
    } catch (err) {
      setManualError(err.message || 'Failed to add member.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-indigo-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white p-4 sm:p-5 flex items-center justify-between relative shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-wide">
                  New User Approval Requests
                </h3>
                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                  {pendingUsers.length}
                </span>
              </div>
              <p className="text-[11px] text-sky-200 font-medium">
                Pending registrations awaiting Admin approval
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Refresh Registrations from Cloud"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Close / Skip 'X' */}
            <button
              onClick={handleSkip}
              className="p-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 cursor-pointer"
              title="Skip for now"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in duration-200 ${
              actionFeedback.type === 'approve'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {actionFeedback.type === 'approve'
                ? (actionFeedback.id === 'refresh' ? actionFeedback.name : `✓ "${actionFeedback.name}" has been Approved!`)
                : `✗ "${actionFeedback.name}" was Rejected.`}
            </span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 divide-y-0">
          {/* ⚡ Quick Auto Approval On/Off Card */}
          <div className="p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 ${
                autoApprovalEnabled ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {autoApprovalEnabled ? <Sparkles className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h6 className="text-xs font-black text-slate-800">
                    Auto User Approval
                  </h6>
                  <span className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${
                    autoApprovalEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {autoApprovalEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  {autoApprovalEnabled
                    ? 'New users approved automatically'
                    : 'Requires manual admin approval'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const nextVal = !autoApprovalEnabled;
                if (updateAutoUserApproval) await updateAutoUserApproval(nextVal);
              }}
              className={`relative inline-flex h-7 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shadow-inner ${
                autoApprovalEnabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
              title="Toggle Auto Approval"
            >
              <span
                className={`pointer-events-none inline-block h-6 w-7 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-black ${
                  autoApprovalEnabled ? 'translate-x-8 text-emerald-700' : 'translate-x-0 text-slate-500'
                }`}
              >
                {autoApprovalEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Quick Manual Add / Missed Member Recovery Accordion */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowManualAdd(prev => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-indigo-100/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-indigo-950">
                    ➕ Recover Missed Registration / Add Member
                  </h5>
                  <p className="text-[10px] text-indigo-700 font-medium">
                    If someone registered earlier and was missed, add and approve them here instantly!
                  </p>
                </div>
              </div>
              {showManualAdd ? (
                <ChevronUp className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {showManualAdd && (
              <form onSubmit={handleManualSubmit} className="p-3.5 pt-1 space-y-2.5 border-t border-indigo-100 bg-white">
                {manualError && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{manualError}</span>
                  </div>
                )}
                {manualSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{manualSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={manualForm.fullName}
                      onChange={e => setManualForm({ ...manualForm, fullName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                      User ID / Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. john123"
                      value={manualForm.username}
                      onChange={e => setManualForm({ ...manualForm, username: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                      Phone or Gmail
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210 or email"
                      value={manualForm.contact}
                      onChange={e => setManualForm({ ...manualForm, contact: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                      Nickname / Place
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Johnny / City"
                      value={manualForm.nickname}
                      onChange={e => setManualForm({ ...manualForm, nickname: e.target.value, place: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">
                      Password (Optional, default: StarPass2026!)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter member password"
                      value={manualForm.password}
                      onChange={e => setManualForm({ ...manualForm, password: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualAdd(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>✓ Add & Approve Immediately</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Pending Users List */}
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
              <Sparkles className="w-10 h-10 text-emerald-500 mx-auto animate-bounce mb-2" />
              <h4 className="text-sm font-black text-slate-800">No Pending Requests!</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                All user accounts are currently approved. Use the "Recover Missed Registration" tool above if you need to register someone manually.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Check Cloud Again</span>
                </button>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            pendingUsers.map((user) => (
              <div
                key={user.id}
                className="bg-slate-50/90 rounded-2xl p-3.5 sm:p-4 border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs space-y-2.5"
              >
                {/* User Top Info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0 border border-indigo-200">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                        {user.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          ID: {user.username || user.id}
                        </span>
                        {user.nickname && (
                          <span className="text-[10px] text-pink-700 font-semibold bg-pink-50 px-1.5 py-0.2 rounded border border-pink-200">
                            Nick: {user.nickname}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{user.createdAt || 'Recent'}</span>
                  </span>
                </div>

                {/* Additional Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="w-3 h-3 text-sky-600 shrink-0" />
                    <span className="font-semibold text-slate-700">Contact:</span>
                    <span className="font-bold text-slate-900 truncate">{user.contact || user.phone || 'N/A'}</span>
                  </div>

                  {user.moreDetails && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-pink-600 shrink-0" />
                      <span className="font-semibold text-slate-700">Details / Place:</span>
                      <span className="font-bold text-slate-900 truncate">{user.moreDetails}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 sm:col-span-2 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-500">Requested Role:</span>
                    <span className="font-bold text-purple-700 uppercase">Regular Member</span>
                  </div>
                </div>

                {/* Approve & Reject Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApprove(user.id, user.name)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(user.id, user.name)}
                    className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Reject applicant"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reject</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer with Skip Button */}
        {pendingUsers.length > 0 && (
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSkip}
              className="py-2 px-4 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Skip for Now</span>
            </button>

            {pendingUsers.length > 1 && (
              <button
                type="button"
                onClick={handleApproveAll}
                className="py-2 px-4 rounded-xl text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Approve All ({pendingUsers.length})</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
