import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  KeyRound,
  Users,
  MessageSquare,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  User,
  Phone,
  Sparkles,
  Calendar,
  RotateCw,
  UserPlus,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Search,
  X,
  Radio,
  Clock,
} from 'lucide-react';

export default function AdminTab() {
  const {
    data,
    currentUser,
    approveUser,
    rejectUser,
    revokeUser,
    changeUserRole,
    OFFICIAL_ROLES,
    OFFICIAL_ROLE_IDS,
    normalizeRole,
    quickAddAndApproveMember,
    refreshRegistrations,
    deleteUser,
    resetPassword,
    adminResetPassword,
    setManagerRole,
    assignMemberToManager,
    addManagerToUser,
    removeManagerFromUser,
    manualVerifyContact,
    setManagersForUser,
    setMembersForManager,
    updateManagerPermission,
    updateMemberPermission,
    updateAllMembersPermissions,
    updateAutoUserApproval,
    deleteFeedback,
    t,
  } = useApp();

  const autoApprovalEnabled = data.settings?.autoUserApproval !== false;

  const [activeSection, setActiveSection] = useState('members'); // 'members' | 'online' | 'approvals' | 'managers' | 'members_perm' | 'feedback'
  const [successMsg, setSuccessMsg] = useState('');

  // Multi-assignment modal state (assigning multiple managers to user OR multiple members to manager)
  const [multiAssignTargetUser, setMultiAssignTargetUser] = useState(null);
  const [multiAssignSelectedIds, setMultiAssignSelectedIds] = useState([]);
  const [multiAssignSearch, setMultiAssignSearch] = useState('');

  const handleToggleAutoApproval = async () => {
    const nextVal = !autoApprovalEnabled;
    if (updateAutoUserApproval) {
      await updateAutoUserApproval(nextVal);
    }
    flashSuccess(nextVal 
      ? '⚡ Auto New User Approval turned ON! Newly registered users will be approved automatically.'
      : '🔒 Auto New User Approval turned OFF! New registrations will require manual Admin approval.'
    );
  };

  // Manager permission edit state
  const [selectedMgrId, setSelectedMgrId] = useState(data.users.find(u => u.role === 'manager')?.id || '');
  const [permMode, setPermMode] = useState('today_only');
  const [permMaxDays, setPermMaxDays] = useState(7);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Auto-sync selected manager's permission state
  React.useEffect(() => {
    if (selectedMgrId && data.managerPermissions?.[selectedMgrId]) {
      const p = data.managerPermissions[selectedMgrId];
      setPermMode(p.mode || 'today_only');
      setPermMaxDays(p.maxDays || 7);
      setCustomStart(p.customStartDate || '');
      setCustomEnd(p.customEndDate || '');
    } else {
      setPermMode('today_only');
    }
  }, [selectedMgrId, data.managerPermissions]);

  // Member permission edit state
  const [selectedMemberPermId, setSelectedMemberPermId] = useState(data.users.find(u => u.role === 'member')?.id || '');
  const [memberPermMode, setMemberPermMode] = useState('today_only');
  const [memberPermMaxDays, setMemberPermMaxDays] = useState(7);
  const [memberCustomStart, setMemberCustomStart] = useState('');
  const [memberCustomEnd, setMemberCustomEnd] = useState('');
  const [memberPermSearch, setMemberPermSearch] = useState('');
  const [memberPermFilter, setMemberPermFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'

  // Auto-sync selected member's permission state
  React.useEffect(() => {
    if (selectedMemberPermId && data.memberPermissions?.[selectedMemberPermId]) {
      const p = data.memberPermissions[selectedMemberPermId];
      setMemberPermMode(p.mode || 'today_only');
      setMemberPermMaxDays(p.maxDays || 7);
      setMemberCustomStart(p.customStartDate || '');
      setMemberCustomEnd(p.customEndDate || '');
    } else {
      setMemberPermMode('today_only');
    }
  }, [selectedMemberPermId, data.memberPermissions]);

  // Manual Member Add/Recovery state
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualForm, setManualForm] = useState({
    fullName: '',
    username: '',
    contact: '',
    nickname: '',
    place: '',
    password: '',
  });
  const [manualError, setManualError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Members Information Tab Search & Filter state
  const [membersInfoSearch, setMembersInfoSearch] = useState('');
  const [membersInfoRoleFilter, setMembersInfoRoleFilter] = useState('all');

  const leadershipRoleIds = ['GL', 'UL', 'PTS', 'TS', 'PBCL', 'DEA', '(D) OS', 'OS', 'manager'];

  const filteredMembersInfo = (data?.users || []).filter(u => {
    if (!u) return false;
    if (membersInfoRoleFilter === 'admin' && u.role !== 'ADMIN' && u.role !== 'admin') return false;
    if (membersInfoRoleFilter === 'manager' && !leadershipRoleIds.includes(u.role)) return false;
    if (membersInfoRoleFilter === 'member' && u.role !== 'MEM' && u.role !== 'member') return false;
    if (membersInfoRoleFilter === 'pending' && u.status !== 'pending') return false;
    if (membersInfoRoleFilter === 'revoked' && u.status !== 'revoked') return false;
    if (OFFICIAL_ROLE_IDS?.includes(membersInfoRoleFilter) && u.role !== membersInfoRoleFilter) return false;

    if (!membersInfoSearch.trim()) return true;
    const q = membersInfoSearch.toLowerCase().trim();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || u.id || '').toLowerCase().includes(q) ||
      (u.contact || u.phone || '').toLowerCase().includes(q) ||
      (u.nickname || '').toLowerCase().includes(q) ||
      (u.personalPin || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.status || '').toLowerCase().includes(q)
    );
  });

  const managers = (data?.users || []).filter(u => leadershipRoleIds.includes(u.role) || (Array.isArray(u.assignedMembers) && u.assignedMembers.length > 0));
  const regularMembers = (data?.users || []).filter(u => u && (u.role === 'MEM' || u.role === 'member'));

  const filteredMembersBySearch = regularMembers.filter(m => {
    if (!memberPermSearch.trim()) return true;
    const q = memberPermSearch.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.nickname || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q) ||
      (m.contact || '').toLowerCase().includes(q)
    );
  });

  const displayedMembers = filteredMembersBySearch.filter(m => {
    if (memberPermFilter === 'unlocked') {
      const mode = data.memberPermissions?.[m.id]?.mode;
      return mode === 'allow_past_dates' || mode === 'days_limit' || mode === 'custom_range';
    }
    if (memberPermFilter === 'locked') {
      const mode = data.memberPermissions?.[m.id]?.mode;
      return !mode || mode === 'today_only';
    }
    return true;
  });

  const pendingUsers = (data?.users || []).filter(u => {
    if (!u || u.role === 'ADMIN' || u.role === 'admin' || u.id === 'surya11008') return false;
    const s = (u.status || '').toLowerCase().trim();
    if (s === 'approved' || s === 'unverified' || s === 'rejected' || s === 'revoked') return false;
    const hasValidEmail = (u.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) || (u.contact && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.contact));
    const isEmailVerified = u.emailVerified === true && (u.contactVerified === true || u.isVerified === true);
    return hasValidEmail && isEmailVerified && (s === 'pending' || s === 'waiting');
  });

  const unverifiedUsers = (data?.users || []).filter(u => {
    if (!u || u.role === 'ADMIN' || u.role === 'admin' || u.id === 'surya11008') return false;
    const s = (u.status || '').toLowerCase().trim();
    if (s === 'approved' || s === 'revoked' || s === 'rejected') return false;
    const isEmailVerified = u.emailVerified === true && (u.contactVerified === true || u.isVerified === true);
    return !isEmailVerified || s === 'unverified';
  });
  const feedbackList = data.feedbackList || [];

  const now = Date.now();
  const onlineUsers = (data?.users || []).filter(u => {
    if (!u?.id) return false;
    const presenceRecord = data.presence?.[u.id];
    const lastActiveMs = presenceRecord?.lastActiveMs || 0;
    const isOnline = (now - lastActiveMs < 180000) || (u.id === currentUser?.id);
    return isOnline;
  });

  const flashSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleManualVerify = async (userId) => {
    if (!manualVerifyContact) return;
    const res = await manualVerifyContact(userId);
    if (res?.success) {
      flashSuccess(`Contact for "${userId}" verified successfully!`);
    } else {
      alert(res?.error || 'Failed to verify contact.');
    }
  };

  const handleApprove = async (userId, targetRole = 'MEM') => {
    await approveUser(userId, targetRole);
    flashSuccess(`User approved with role "${targetRole}". Synced across SNI Website & Star Galaxy.`);
  };

  const handleRevoke = async (userId) => {
    if (userId === 'surya11008') {
      alert('Administrator account cannot be revoked!');
      return;
    }
    if (!window.confirm('Are you sure you want to revoke this user account? They will lose access to the portal.')) return;
    const res = await revokeUser(userId);
    if (res?.success) {
      flashSuccess('User access revoked. Synced across SNI Website & Star Galaxy.');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (userId === 'surya11008' && newRole !== 'ADMIN') {
      alert('Administrator (surya11008) cannot be demoted.');
      return;
    }
    const res = await changeUserRole(userId, newRole);
    if (res?.success) {
      flashSuccess(`Role changed to "${newRole}". Synced across SNI Website & Star Galaxy.`);
    } else {
      alert(res?.error || 'Failed to update role.');
    }
  };

  const handleReject = (userId) => {
    if (!confirm('Reject and delete this registration application?')) return;
    rejectUser(userId);
    flashSuccess('Application rejected.');
  };

  const handleApproveAll = () => {
    if (!confirm(`Approve all ${pendingUsers.length} pending members?`)) return;
    pendingUsers.forEach(u => approveUser(u.id, u.role || 'MEM'));
    flashSuccess(`All ${pendingUsers.length} members approved!`);
  };

  const handleRefreshRegistrations = async () => {
    if (!refreshRegistrations) return;
    setIsRefreshing(true);
    try {
      const res = await refreshRegistrations();
      flashSuccess(`Cloud sync completed! (${res?.count || 0} pending detected)`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualAddSubmit = async (e) => {
    e.preventDefault();
    setManualError('');
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
      flashSuccess(res.message || 'Member added and approved!');
      setManualForm({
        fullName: '',
        username: '',
        contact: '',
        nickname: '',
        place: '',
        password: '',
      });
      setShowManualAdd(false);
    } catch (err) {
      setManualError(err.message || 'Failed to add member.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'ADMIN' || user.id === 'surya11008') {
      alert('Super Administrator (surya11008) cannot be deleted!');
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.name}" (${user.username || user.phone}) permanently?\n\n⚠️ This will permanently remove the user from BOTH Firestore and Realtime Database across all SNI platforms.`
    );
    if (!confirmed) return;

    await deleteUser(user.id);
    flashSuccess(`User "${user.name}" deleted permanently from all databases.`);
  };

  const handleResetPass = async (user) => {
    const entered = window.prompt(
      `Enter new password for "${user.name}" (${user.username || user.phone}):`,
      `StarPass${Math.floor(1000 + Math.random() * 9000)}`
    );
    if (!entered || !entered.trim()) return;
    const cleanNewPass = entered.trim();
    const res = await (adminResetPassword || resetPassword)(user.id, cleanNewPass);
    if (res?.success) {
      flashSuccess(`Password for "${user.name}" updated to: "${cleanNewPass}" (Synced across all databases)`);
    }
  };

  const handleToggleManager = async (userId, currentRole) => {
    const isNowManager = currentRole !== 'manager';
    await setManagerRole(userId, isNowManager);
    flashSuccess(`${isNowManager ? 'Appointed as Manager' : 'Removed from Manager role'}`);
  };

  const handleAssignChange = async (memberId, managerId) => {
    await assignMemberToManager(memberId, managerId);
    flashSuccess('Member assigned to manager successfully!');
  };

  const handleAddManagerToUser = async (userId, managerId) => {
    if (!managerId) return;
    await addManagerToUser(userId, managerId);
    flashSuccess('Manager assigned successfully!');
  };

  const handleRemoveManagerFromUser = async (userId, managerId) => {
    await removeManagerFromUser(userId, managerId);
    flashSuccess('Manager assignment removed!');
  };

  const handleOpenMultiAssignForUser = (user) => {
    const mgrIds = Array.isArray(user.assignedManagerIds)
      ? user.assignedManagerIds
      : (user.assignedManagerId ? [user.assignedManagerId] : []);
    setMultiAssignTargetUser({ type: 'user_managers', user });
    setMultiAssignSelectedIds(mgrIds);
    setMultiAssignSearch('');
  };

  const handleOpenMultiAssignForManager = (manager) => {
    const memberIds = Array.isArray(manager.assignedMembers) ? manager.assignedMembers : [];
    setMultiAssignTargetUser({ type: 'manager_members', manager });
    setMultiAssignSelectedIds(memberIds);
    setMultiAssignSearch('');
  };

  const handleSaveMultiAssign = async () => {
    if (!multiAssignTargetUser) return;
    if (multiAssignTargetUser.type === 'user_managers') {
      await setManagersForUser(multiAssignTargetUser.user.id, multiAssignSelectedIds);
      flashSuccess(`Managers updated for ${multiAssignTargetUser.user.name}!`);
    } else if (multiAssignTargetUser.type === 'manager_members') {
      await setMembersForManager(multiAssignTargetUser.manager.id, multiAssignSelectedIds);
      flashSuccess(`Assigned members updated for Manager ${multiAssignTargetUser.manager.name}!`);
    }
    setMultiAssignTargetUser(null);
  };

  const handleQuickToggleManagerPerm = (mgrId) => {
    const current = data.managerPermissions?.[mgrId];
    const isCurrentlyAllowed = current && (current.mode === 'allow_past_dates' || current.mode === 'days_limit' || current.mode === 'custom_range');
    const newMode = isCurrentlyAllowed ? 'today_only' : 'allow_past_dates';
    updateManagerPermission(mgrId, {
      mode: newMode,
      allowPastDates: !isCurrentlyAllowed,
    });
    flashSuccess(isCurrentlyAllowed
      ? 'Manager restricted to Today Only input (Same as Members).'
      : 'Manager granted full permission to input & modify past dates!');
  };

  const handleSaveManagerPerm = (e) => {
    e.preventDefault();
    if (!selectedMgrId) return;
    const isAllow = permMode !== 'today_only';
    updateManagerPermission(selectedMgrId, {
      mode: permMode,
      allowPastDates: isAllow,
      maxDays: permMode === 'days_limit' ? Number(permMaxDays) : 7,
      customStartDate: permMode === 'custom_range' ? customStart : null,
      customEndDate: permMode === 'custom_range' ? customEnd : null,
    });
    flashSuccess('Manager status input permissions saved successfully!');
  };

  const handleQuickToggleMemberPerm = (memberId) => {
    const current = data.memberPermissions?.[memberId];
    const isCurrentlyAllowed = current && (current.mode === 'allow_past_dates' || current.mode === 'days_limit' || current.mode === 'custom_range');
    const newMode = isCurrentlyAllowed ? 'today_only' : 'allow_past_dates';
    updateMemberPermission(memberId, {
      mode: newMode,
      allowPastDates: !isCurrentlyAllowed,
    });
    flashSuccess(isCurrentlyAllowed
      ? 'Member restricted to Today Only input.'
      : 'Granted member past date and historical input permission!'
    );
  };

  const handleSaveMemberPerm = (e) => {
    e.preventDefault();
    if (!selectedMemberPermId) return;
    const isAllow = memberPermMode !== 'today_only';
    updateMemberPermission(selectedMemberPermId, {
      mode: memberPermMode,
      allowPastDates: isAllow,
      maxDays: memberPermMode === 'days_limit' ? Number(memberPermMaxDays) : 7,
      customStartDate: memberPermMode === 'custom_range' ? memberCustomStart : null,
      customEndDate: memberPermMode === 'custom_range' ? memberCustomEnd : null,
    });
    flashSuccess('Member permissions updated successfully!');
  };

  const handleBulkSetMembers = (mode) => {
    const isAllow = mode !== 'today_only';
    updateAllMembersPermissions({
      mode,
      allowPastDates: isAllow,
    });
    flashSuccess(isAllow
      ? 'All members granted past date input permission!'
      : 'All members restricted to Today Only input.'
    );
  };

  return (
    <div className="space-y-6 pb-24 pt-2 animate-in fade-in duration-300">
      {/* 👑 Admin Tab Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 rounded-3xl p-6 text-white shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-amber-300 animate-pulse" />
            <h2 className="font-extrabold text-xl sm:text-2xl tracking-wide">
              {t('adminPanelTitle') || 'Admin Management Center'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-2xl">
            {t('adminPanelSubtitle') || 'Members Information, Registrations, Manager Permissions & User Suggestions'}
          </p>
        </div>

        {/* Quick Header Toggle for Auto Approval */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleAutoApproval}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
              autoApprovalEnabled
                ? 'bg-emerald-500/25 border border-emerald-300 text-emerald-100 hover:bg-emerald-500/35'
                : 'bg-amber-500/25 border border-amber-300 text-amber-100 hover:bg-amber-500/35'
            }`}
            title="Click to toggle Auto New User Approval"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${autoApprovalEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>Auto Approval: {autoApprovalEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin Tab Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveSection('members')}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSection === 'members'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('tabMembers') || 'Members Information'} ({data.users.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('online')}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'online'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Online Users</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeSection === 'online' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {onlineUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('approvals')}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all relative flex items-center gap-1.5 ${
            activeSection === 'approvals'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{t('tabApprovals') || 'Pending Approvals'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            autoApprovalEnabled
              ? (activeSection === 'approvals' ? 'bg-emerald-400 text-emerald-950' : 'bg-emerald-100 text-emerald-800')
              : (activeSection === 'approvals' ? 'bg-amber-300 text-amber-950' : 'bg-amber-100 text-amber-900')
          }`}>
            Auto: {autoApprovalEnabled ? 'ON' : 'OFF'}
          </span>
          {pendingUsers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] animate-bounce">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSection('managers')}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSection === 'managers'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{t('tabManagers') || 'Manager Permissions'}</span>
        </button>

        <button
          onClick={() => setActiveSection('members_perm')}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeSection === 'members_perm'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-500" />
          <span>{t('tabMemberPermissions') || 'Member Permissions'}</span>
        </button>

        <button
          onClick={() => setActiveSection('feedback')}
          className={`px-4 py-2 rounded-2xl whitespace-nowrap transition-all relative flex items-center gap-1.5 ${
            activeSection === 'feedback'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{t('tabFeedback') || 'Feedback & Suggestions'}</span>
          {feedbackList.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-sky-500 text-white text-[10px]">
              {feedbackList.length}
            </span>
          )}
        </button>
      </div>

      {/* SECTION: LIVE ONLINE USERS (Admin Only) */}
      {activeSection === 'online' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl p-5 text-white shadow-md flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner">
                🟢
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-wide">
                  Live Online Members ({onlineUsers.length})
                </h3>
                <p className="text-xs text-emerald-100 font-bold mt-0.5">
                  Real-time active users across Star Galaxy (Visible exclusively to Admin)
                </p>
              </div>
            </div>
            <span className="bg-white/20 text-white text-xs font-black px-3.5 py-1.5 rounded-2xl shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              Live Presence Heartbeat
            </span>
          </div>

          {onlineUsers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-emerald-200 p-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Radio className="w-7 h-7 animate-pulse" />
              </div>
              <p className="text-sm font-black text-slate-700">No active users detected right now.</p>
              <p className="text-xs text-slate-400 font-bold mt-1">Users will appear automatically when they log in or browse Star Galaxy.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {onlineUsers.map(u => {
                const presenceRecord = data.presence?.[u.id];
                const lastActiveMs = presenceRecord?.lastActiveMs || 0;
                const isSelf = u.id === currentUser?.id;
                const diffMinutes = Math.floor((now - lastActiveMs) / 60000);
                const activeLabel = isSelf ? 'Active Now (You)' : diffMinutes <= 0 ? 'Active Now' : `${diffMinutes}m ago`;

                return (
                  <div
                    key={u.id}
                    className="bg-white rounded-3xl p-4 border-2 border-emerald-300 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-black text-base shadow-xs">
                          {(u.nickname || u.name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {u.name}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-400 truncate">
                          @{u.username || u.phone || u.id}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            u.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            u.role === 'manager' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                            'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {u.role}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            🟢 {activeLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 1: MEMBERS INFORMATION (All 6 Input details visible) */}
      {activeSection === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                {t('tabMembers') || 'All Registered Members & Detailed Information'}
              </h3>
              <p className="text-xs text-slate-500">
                View, search, manage and configure all registered accounts
              </p>
            </div>
            <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl font-bold">
              Total: {data.users.length} accounts
            </span>
          </div>

          {/* 🔍 Search Bar & Role Filter Controls */}
          <div className="bg-white rounded-3xl p-3.5 sm:p-4 border-2 border-indigo-100 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={membersInfoSearch}
                onChange={(e) => setMembersInfoSearch(e.target.value)}
                placeholder="Search member by Name, User ID, Phone/Gmail, Nickname, Role, or PIN..."
                className="w-full pl-10 pr-9 py-2 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 font-semibold bg-slate-50/50"
              />
              {membersInfoSearch && (
                <button
                  type="button"
                  onClick={() => setMembersInfoSearch('')}
                  className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Role Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMembersInfoRoleFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    membersInfoRoleFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({data.users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMembersInfoRoleFilter('admin')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    membersInfoRoleFilter === 'admin'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  👑 Admin ({data.users.filter(u => u.role === 'ADMIN' || u.role === 'admin').length})
                </button>
                <button
                  type="button"
                  onClick={() => setMembersInfoRoleFilter('manager')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    membersInfoRoleFilter === 'manager'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-800 border border-purple-200'
                  }`}
                >
                  ⭐ Leaders ({data.users.filter(u => leadershipRoleIds.includes(u.role)).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMembersInfoRoleFilter('member')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    membersInfoRoleFilter === 'member'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  👤 Members ({data.users.filter(u => u.role === 'MEM' || u.role === 'member').length})
                </button>
                <button
                  type="button"
                  onClick={() => setMembersInfoRoleFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    membersInfoRoleFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  ⏳ Pending ({data.users.filter(u => u.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={() => setMembersInfoRoleFilter('revoked')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    membersInfoRoleFilter === 'revoked'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  🚫 Revoked ({data.users.filter(u => u.status === 'revoked').length})
                </button>
              </div>

              {/* Specific Role Dropdown filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-bold">Role:</span>
                <select
                  value={OFFICIAL_ROLE_IDS?.includes(membersInfoRoleFilter) ? membersInfoRoleFilter : ''}
                  onChange={(e) => setMembersInfoRoleFilter(e.target.value || 'all')}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">Specific Role...</option>
                  {(OFFICIAL_ROLES || []).map(r => (
                    <option key={r.id} value={r.id}>{r.id} ({data.users.filter(u => u.role === r.id).length})</option>
                  ))}
                </select>
              </div>

              <span className="text-[11px] text-slate-500 font-semibold">
                Showing {filteredMembersInfo.length} of {data.users.length} members
              </span>
            </div>
          </div>

          {filteredMembersInfo.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200 shadow-xs space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Members Found</h4>
              <p className="text-xs text-slate-500">
                No member accounts match your search <strong className="text-indigo-600 font-bold">"{membersInfoSearch}"</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  setMembersInfoSearch('');
                  setMembersInfoRoleFilter('all');
                }}
                className="mt-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredMembersInfo.map(u => (
              <div
                key={u.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  {/* Top Bar: Full Name, Role & Status */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-sm font-black text-slate-800 block leading-tight">
                          {u.name}
                        </strong>
                        <span className="text-[11px] text-slate-400">
                          Joined: {u.createdAt || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* Official Role Selector Dropdown */}
                      <select
                        value={u.role || 'MEM'}
                        disabled={u.id === 'surya11008'}
                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border cursor-pointer ${
                          u.role === 'ADMIN' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                          leadershipRoleIds.includes(u.role) ? 'bg-purple-100 text-purple-900 border-purple-300' :
                          'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                        title="Change user official role"
                      >
                        {(OFFICIAL_ROLES || []).map(r => (
                          <option key={r.id} value={r.id}>
                            {r.id}
                          </option>
                        ))}
                      </select>

                      {onlineUsers.some(ou => ou.id === u.id) && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] bg-emerald-100 text-emerald-800 font-black border border-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      )}
                      {u.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                          PENDING
                        </span>
                      )}
                      {u.status === 'revoked' && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] bg-rose-100 text-rose-800 font-bold border border-rose-300">
                          REVOKED
                        </span>
                      )}
                      {u.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                          APPROVED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 6 Fields Detailed Information */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        {t('userId') || 'User ID'}
                      </span>
                      <code className="font-extrabold text-indigo-700 font-mono">
                        {u.username || u.id}
                      </code>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        {t('phoneOrGmail') || 'Phone or Gmail'}
                      </span>
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className="font-bold text-slate-700 truncate">
                          {u.contact || u.phone || 'N/A'}
                        </span>
                        {u.contactVerified || u.isVerified || u.role === 'ADMIN' ? (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                            ✓ Verified
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                              ⚠️ Unverified
                            </span>
                            <button
                              type="button"
                              onClick={() => handleManualVerify(u.id)}
                              className="text-[9px] text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer"
                              title="Manually mark contact as verified"
                            >
                              Verify
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        {t('nickName') || 'Nick Name'}
                      </span>
                      <span className="font-bold text-slate-700">
                        {u.nickname || 'None'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        PIN
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {u.personalPin || 'Not Set'}
                      </span>
                    </div>
                  </div>

                  {/* More Details row */}
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      {t('moreDetails') || 'More Details (Place / Region)'}
                    </span>
                    <span className="text-slate-700 font-medium">
                      {u.moreDetails || u.place || 'No additional details provided'}
                    </span>
                  </div>

                  {/* Assigned Managers (for everyone: members and managers alike) */}
                  {u.role !== 'admin' && u.id !== 'surya11008' && (() => {
                    const uMgrIds = Array.isArray(u.assignedManagerIds)
                      ? u.assignedManagerIds
                      : (u.assignedManagerId ? [u.assignedManagerId] : []);
                    const assignedMgrs = managers.filter(m => uMgrIds.includes(m.id));
                    const availableToAdd = managers.filter(m => m.id !== u.id && !uMgrIds.includes(m.id));

                    return (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/60 border border-indigo-100 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700 font-bold flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{t('assignedManagers') || 'Assigned Managers'} ({assignedMgrs.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenMultiAssignForUser(u)}
                            className="text-[10px] text-indigo-700 hover:text-indigo-900 font-bold bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50 flex items-center gap-1 cursor-pointer transition-all"
                            title="Multi-select managers with checkboxes"
                          >
                            <span>⚡ Multi-Assign</span>
                          </button>
                        </div>

                        {/* Chips of assigned managers */}
                        <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                          {assignedMgrs.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">No managers assigned yet (Unassigned)</span>
                          ) : (
                            assignedMgrs.map(mgr => (
                              <span
                                key={mgr.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-indigo-200 text-indigo-950 text-xs font-bold shadow-2xs"
                              >
                                <span>👔 {mgr.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveManagerFromUser(u.id, mgr.id)}
                                  className="text-indigo-400 hover:text-rose-600 transition-colors ml-0.5 font-black cursor-pointer text-xs"
                                  title={`Remove ${mgr.name}`}
                                >
                                  ✕
                                </button>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Dropdown to assign additional manager */}
                        {availableToAdd.length > 0 && (
                          <div className="flex items-center gap-2 pt-0.5">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) handleAddManagerToUser(u.id, e.target.value);
                              }}
                              className="bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-indigo-900 shadow-2xs flex-1 cursor-pointer"
                            >
                              <option value="">➕ Assign Manager to {u.name}...</option>
                              {availableToAdd.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.username || m.phone})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  {/* Approve / Reactivate Button */}
                  {u.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(u.id, u.role || 'MEM')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                      title="Approve / Reactivate user"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {/* Revoke Button */}
                  {u.status === 'approved' && u.id !== 'surya11008' && u.role !== 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(u.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                      title="Revoke portal access"
                    >
                      <UserX className="w-3.5 h-3.5 text-rose-600" />
                      <span>Revoke</span>
                    </button>
                  )}

                  {(u.role === 'MEM' || u.role === 'member') && (
                    <button
                      type="button"
                      onClick={() => handleQuickToggleMemberPerm(u.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer ${
                        data.memberPermissions?.[u.id]?.allowPastDates
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={data.memberPermissions?.[u.id]?.allowPastDates ? 'Past Dates Allowed. Click to restrict to Today Only.' : 'Locked to Today Only. Click to allow past dates.'}
                    >
                      {data.memberPermissions?.[u.id]?.allowPastDates ? (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>Past Dates</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Today Only</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleResetPass(u)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Reset member password"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t('resetPass') || 'Reset Pass'}</span>
                  </button>

                  {u.role !== 'ADMIN' && u.id !== 'surya11008' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Permanently remove user from all databases"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('deleteUser') || 'Delete'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* SECTION 2: PENDING APPROVALS */}
      {activeSection === 'approvals' && (
        <div className="space-y-4">
          {/* ⚡ Dedicated Auto New User Approval Toggle Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-2 border-purple-200/80 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs transition-colors shrink-0 ${
                autoApprovalEnabled ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {autoApprovalEnabled ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm sm:text-base font-black text-slate-800">
                    Auto New User Approval
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    autoApprovalEnabled 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {autoApprovalEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                  {autoApprovalEnabled 
                    ? 'When ON: Newly registered members are approved automatically and can log in immediately.'
                    : 'When OFF: Newly registered members require manual Admin review and approval before they can log in.'
                  }
                </p>
              </div>
            </div>

            {/* Interactive Big ON / OFF Switch */}
            <div className="flex items-center gap-2.5 self-end sm:self-center">
              <span className="text-xs font-black text-slate-500 hidden sm:inline">
                {autoApprovalEnabled ? 'Auto Approval ON' : 'Auto Approval OFF'}
              </span>
              <button
                type="button"
                onClick={handleToggleAutoApproval}
                className={`relative inline-flex h-10 w-24 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shadow-inner focus:outline-hidden ${
                  autoApprovalEnabled ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-slate-300 hover:bg-slate-400'
                }`}
                title={autoApprovalEnabled ? 'Click to Turn OFF Auto Approval' : 'Click to Turn ON Auto Approval'}
              >
                <span className="sr-only">Toggle Auto Approval</span>
                <span
                  className={`pointer-events-none inline-block h-9 w-12 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out flex items-center justify-center text-xs font-black ${
                    autoApprovalEnabled ? 'translate-x-11 text-emerald-700' : 'translate-x-0 text-slate-500'
                  }`}
                >
                  {autoApprovalEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                {t('tabApprovals') || 'Pending Account Registrations (Admin Approval Required)'}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                pendingUsers.length > 0 ? 'bg-amber-400 text-amber-950 animate-bounce' : 'bg-slate-200 text-slate-700'
              }`}>
                {pendingUsers.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshRegistrations}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                title="Sync from cloud"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManualAdd(prev => !prev)}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>➕ Add / Recover Member</span>
              </button>

              {pendingUsers.length > 1 && (
                <button
                  type="button"
                  onClick={handleApproveAll}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Approve All ({pendingUsers.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Manual Missed Member Recovery Card */}
          {showManualAdd && (
            <div className="p-4 bg-indigo-50/80 border-2 border-indigo-200 rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-indigo-950">
                      Recover Missed Member Registration
                    </h4>
                    <p className="text-[11px] text-indigo-700">
                      Instantly register and approve any member whose application was missed!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualAdd(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {manualError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}

              <form onSubmit={handleManualAddSubmit} className="space-y-3 bg-white p-3.5 rounded-2xl border border-indigo-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={manualForm.fullName}
                      onChange={e => setManualForm({ ...manualForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      User ID / Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. john123"
                      value={manualForm.username}
                      onChange={e => setManualForm({ ...manualForm, username: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Phone or Gmail
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210 or email"
                      value={manualForm.contact}
                      onChange={e => setManualForm({ ...manualForm, contact: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Nickname
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Johnny"
                      value={manualForm.nickname}
                      onChange={e => setManualForm({ ...manualForm, nickname: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Place / Details
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. City / Location"
                      value={manualForm.place}
                      onChange={e => setManualForm({ ...manualForm, place: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                      Password (Optional, default StarPass2026!)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter password"
                      value={manualForm.password}
                      onChange={e => setManualForm({ ...manualForm, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-indigo-500 bg-slate-50 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowManualAdd(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>✓ Add & Approve Member Immediately</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {pendingUsers.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-6 space-y-3">
              <span className="text-3xl block">🎉</span>
              <p className="text-sm font-bold text-slate-600">
                {t('noPendingApprovals') || 'No pending registrations at this moment. All clear! ✓'}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                If someone registered earlier and their request is not showing, click "➕ Add / Recover Member" above to add and approve them right away!
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRefreshRegistrations}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Check Cloud Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualAdd(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add / Recover Missed Member</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingUsers.map(applicant => (
                <div
                  key={applicant.id}
                  className="p-5 bg-white border-2 border-amber-300 rounded-3xl shadow-sm flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-base text-slate-900">{applicant.name}</h4>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        Pending Approval
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          {t('userId') || 'User ID'}
                        </span>
                        <code className="font-bold text-indigo-700">{applicant.username || applicant.id}</code>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          {t('phoneOrGmail') || 'Phone or Gmail'}
                        </span>
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="font-bold text-slate-700">{applicant.contact || applicant.phone || 'N/A'}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">✓ Email Verified</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">
                        {t('moreDetails') || 'More Details'}
                      </span>
                      <span className="text-slate-700">{applicant.moreDetails || applicant.place || 'None'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleReject(applicant.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>{t('reject') || 'Reject'}</span>
                    </button>
                    <button
                      onClick={() => handleApprove(applicant.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{t('approve') || 'Approve'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: MANAGER PERMISSIONS */}
      {activeSection === 'managers' && (
        <div className="space-y-6">
          <div className="p-4 bg-purple-50 rounded-3xl border border-purple-200 text-xs text-purple-900 leading-relaxed shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">👑</span>
              <strong className="text-sm text-purple-950 font-black">Manager Status Input & Modification Permission:</strong>
            </div>
            <p className="text-purple-800 font-medium">
              By default, managers have the same <strong>Today Only</strong> input restriction as regular members. When needed, Admin can grant or revoke past date entry and historical modification permissions here.
            </p>
          </div>

          {managers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs font-bold">
              No managers appointed yet. To appoint a manager, go to the "Members Information" subtab and click "Make Manager" on any member.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Managers Overview & Quick Toggle List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Appointed Managers & Permission Status ({managers.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {managers.map(m => {
                    const perm = data.managerPermissions?.[m.id];
                    const mode = perm?.mode || 'today_only';
                    const isAllowed = mode === 'allow_past_dates' || mode === 'days_limit' || mode === 'custom_range';

                    return (
                      <div
                        key={m.id}
                        className={`p-4 rounded-3xl border-2 transition-all shadow-xs flex flex-col justify-between gap-3 ${
                          isAllowed ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                              isAllowed ? 'bg-emerald-600' : 'bg-purple-600'
                            }`}>
                              👑
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                                  {m.name}
                                </h4>
                                {onlineUsers.some(ou => ou.id === m.id) && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {m.nickname || m.username || m.phone} • {m.assignedMembers?.length || 0} assigned
                              </p>
                            </div>
                          </div>

                          <div>
                            {isAllowed ? (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                                <span>🔓 Past Dates Allowed</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                <span>🔒 Today Only (Default)</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Assigned Members List & Quick Assign for Manager m */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span>Assigned Members & Managers ({m.assignedMembers?.length || 0}):</span>
                            <button
                              type="button"
                              onClick={() => handleOpenMultiAssignForManager(m)}
                              className="text-[10px] text-purple-700 hover:text-purple-900 font-bold bg-white px-2 py-0.5 rounded-lg border border-purple-200 shadow-2xs hover:bg-purple-50 flex items-center gap-1 cursor-pointer transition-all"
                              title="Batch multi-assign members and managers with checkboxes"
                            >
                              <span>⚡ Multi-Assign</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                            {(!m.assignedMembers || m.assignedMembers.length === 0) ? (
                              <span className="text-[11px] text-slate-400 italic">No members assigned to this manager yet.</span>
                            ) : (
                              m.assignedMembers.map(mid => {
                                const memObj = data.users.find(u => u.id === mid);
                                return (
                                  <span
                                    key={mid}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold shadow-2xs"
                                  >
                                    <span>{memObj?.role === 'manager' ? '👔 ' : '👤 '}{memObj?.name || mid}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveManagerFromUser(mid, m.id)}
                                      className="text-purple-400 hover:text-rose-600 transition-colors ml-0.5 font-black cursor-pointer"
                                      title="Unassign member"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                );
                              })
                            )}
                          </div>

                          {/* Quick Assign Member/Manager Dropdown */}
                          <div className="flex items-center gap-2 pt-1">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) handleAddManagerToUser(e.target.value, m.id);
                              }}
                              className="bg-purple-50/60 border border-purple-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-purple-900 shadow-2xs flex-1 cursor-pointer"
                            >
                              <option value="">➕ Assign Member or Manager to {m.name}...</option>
                              {data.users
                                .filter(u => u.id !== m.id && u.role !== 'admin' && u.id !== 'surya11008' && u.status === 'approved' && !(m.assignedMembers || []).includes(u.id))
                                .map(u => {
                                  const uMgrIds = Array.isArray(u.assignedManagerIds) ? u.assignedManagerIds : (u.assignedManagerId ? [u.assignedManagerId] : []);
                                  const mgrNames = managers.filter(mgr => uMgrIds.includes(mgr.id)).map(mgr => mgr.name).join(', ');
                                  return (
                                    <option key={u.id} value={u.id}>
                                      {u.name} [{u.role === 'manager' ? '👔 Manager' : '👤 Member'}] {mgrNames ? `(Managed by: ${mgrNames})` : '(Unassigned)'}
                                    </option>
                                  );
                                })}
                            </select>
                          </div>
                        </div>

                        {/* Hierarchy: Assigned Managers for Manager m */}
                        {(() => {
                          const mParentMgrIds = Array.isArray(m.assignedManagerIds)
                            ? m.assignedManagerIds
                            : (m.assignedManagerId ? [m.assignedManagerId] : []);
                          const parentMgrObjs = managers.filter(pm => mParentMgrIds.includes(pm.id));
                          const availableParents = managers.filter(pm => pm.id !== m.id && !mParentMgrIds.includes(pm.id));

                          return (
                            <div className="pt-2 border-t border-slate-100 space-y-1.5 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                <span className="flex items-center gap-1 text-indigo-900">
                                  <Users className="w-3 h-3 text-indigo-600" />
                                  <span>Assigned Managers for {m.name} ({parentMgrObjs.length}):</span>
                                </span>
                                <span className="text-[10px] text-indigo-600 font-semibold">Hierarchy</span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 min-h-[22px]">
                                {parentMgrObjs.length === 0 ? (
                                  <span className="text-[11px] text-slate-400 italic">No parent managers assigned</span>
                                ) : (
                                  parentMgrObjs.map(pm => (
                                    <span
                                      key={pm.id}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-100/70 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-2xs"
                                    >
                                      <span>👔 {pm.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveManagerFromUser(m.id, pm.id)}
                                        className="text-indigo-400 hover:text-rose-600 transition-colors ml-0.5 font-black cursor-pointer text-xs"
                                        title={`Remove ${pm.name}`}
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  ))
                                )}
                              </div>

                              {availableParents.length > 0 && (
                                <div className="flex items-center gap-2 pt-0.5">
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) handleAddManagerToUser(m.id, e.target.value);
                                    }}
                                    className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-bold text-indigo-900 shadow-2xs flex-1 cursor-pointer"
                                  >
                                    <option value="">➕ Assign {m.name} to another Manager...</option>
                                    {availableParents.map(other => (
                                      <option key={other.id} value={other.id}>
                                        {other.name} ({other.username || other.phone})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMgrId(m.id);
                              window.scrollTo({ top: 500, behavior: 'smooth' });
                            }}
                            className="text-[11px] text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                          >
                            ⚙️ Configure Details
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuickToggleManagerPerm(m.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer ${
                              isAllowed
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isAllowed ? '🔒 Restrict to Today Only' : '🔓 Grant Past Date Access'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Configuration Form */}
              <form onSubmit={handleSaveManagerPerm} className="space-y-4 bg-white p-5 sm:p-6 rounded-3xl border-2 border-purple-200 shadow-sm max-w-xl">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Configure Specific Permissions for Manager</span>
                  </h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Manager</label>
                  <select
                    value={selectedMgrId}
                    onChange={(e) => setSelectedMgrId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.nickname || m.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Permission Mode for {managers.find(m => m.id === selectedMgrId)?.name}:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'today_only', label: '🔒 Today Only (Default)' },
                      { key: 'allow_past_dates', label: '🔓 Full Past Dates' },
                      { key: 'days_limit', label: '📅 Days Limit' },
                      { key: 'custom_range', label: '🗓️ Custom Range' },
                    ].map(mode => (
                      <button
                        type="button"
                        key={mode.key}
                        onClick={() => setPermMode(mode.key)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          permMode === mode.key
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                    {permMode === 'today_only' && '🔒 Manager is restricted to Today Only input (same as members). Cannot modify historical records.'}
                    {permMode === 'allow_past_dates' && '🔓 Manager is granted full permission to select any date, enter backdated records, and modify history.'}
                    {permMode === 'days_limit' && '📅 Manager can input and modify records within the last specified number of days.'}
                    {permMode === 'custom_range' && '🗓️ Manager can input and modify records strictly within the chosen date range.'}
                  </p>
                </div>

                {permMode === 'days_limit' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Days Limit from Today (e.g. 7, 14, 30 days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={permMaxDays}
                      onChange={(e) => setPermMaxDays(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                )}

                {permMode === 'custom_range' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">End Date</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Manager Permissions
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SECTION: MEMBER PERMISSIONS */}
      {activeSection === 'members_perm' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed shadow-2xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🛡️</span>
              <strong className="text-sm text-emerald-950 font-black">Member Status Input & Historical Modification Permissions:</strong>
            </div>
            <p className="text-emerald-800 font-medium">
              By default, all members are restricted to <strong>Today Only</strong> input. When needed, Admin can grant or revoke past date entry and historical modification permissions for any specific member or all members together here.
            </p>
          </div>

          {/* Bulk Controls & Summary Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold">
                Total Members: <strong>{regularMembers.length}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                🔓 Past Dates Allowed: <strong>{regularMembers.filter(m => data.memberPermissions?.[m.id]?.allowPastDates).length}</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                🔒 Today Only: <strong>{regularMembers.filter(m => !data.memberPermissions?.[m.id]?.allowPastDates).length}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to GRANT past date access to ALL members?')) {
                    handleBulkSetMembers('allow_past_dates');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Allow All Members</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to RESTRICT ALL members to Today Only?')) {
                    handleBulkSetMembers('today_only');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Restrict All to Today</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberPermSearch}
                onChange={(e) => setMemberPermSearch(e.target.value)}
                placeholder="Search member by name, username, or contact..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-2xl bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setMemberPermFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  memberPermFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({filteredMembersBySearch.length})
              </button>
              <button
                type="button"
                onClick={() => setMemberPermFilter('unlocked')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  memberPermFilter === 'unlocked'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                🔓 Past Dates ({filteredMembersBySearch.filter(m => data.memberPermissions?.[m.id]?.allowPastDates).length})
              </button>
              <button
                type="button"
                onClick={() => setMemberPermFilter('locked')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  memberPermFilter === 'locked'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                🔒 Today Only ({filteredMembersBySearch.filter(m => !data.memberPermissions?.[m.id]?.allowPastDates).length})
              </button>
            </div>
          </div>

          {regularMembers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs font-bold">
              No registered members found.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Members Overview & Quick Toggle List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Members & Permission Status ({displayedMembers.length})</span>
                </h3>

                {displayedMembers.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-bold">
                    No members match the current filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedMembers.map(m => {
                      const perm = data.memberPermissions?.[m.id];
                      const mode = perm?.mode || 'today_only';
                      const isAllowed = mode === 'allow_past_dates' || mode === 'days_limit' || mode === 'custom_range';

                      return (
                        <div
                          key={m.id}
                          className={`p-4 rounded-3xl border-2 transition-all shadow-xs flex flex-col justify-between gap-3 ${
                            isAllowed ? 'bg-emerald-50/50 border-emerald-300' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                                isAllowed ? 'bg-emerald-600' : 'bg-slate-600'
                              }`}>
                                {isAllowed ? '🔓' : '👤'}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                                  {m.name}
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {m.nickname || m.username || m.phone || m.contact}
                                  {(() => {
                                    const mgrIds = Array.isArray(m.assignedManagerIds)
                                      ? m.assignedManagerIds
                                      : (m.assignedManagerId ? [m.assignedManagerId] : []);
                                    const names = managers.filter(mgr => mgrIds.includes(mgr.id)).map(mgr => mgr.name).join(', ');
                                    return names ? (
                                      <span className="text-indigo-600 ml-1 font-semibold">
                                        • Mgrs: {names}
                                      </span>
                                    ) : null;
                                  })()}
                                </p>
                              </div>
                            </div>

                            <div>
                              {isAllowed ? (
                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                                  {mode === 'days_limit' && `📅 Last ${perm?.maxDays || 7} Days`}
                                  {mode === 'custom_range' && `🗓️ ${perm?.customStartDate || ''} to ${perm?.customEndDate || ''}`}
                                  {(mode === 'allow_past_dates' || mode === 'all_dates') && '🔓 Past Dates Allowed'}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                                  <span>🔒 Today Only (Default)</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMemberPermId(m.id);
                                const el = document.getElementById('member-perm-config-card');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                            >
                              ⚙️ Configure Details
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickToggleMemberPerm(m.id)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer ${
                                isAllowed
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isAllowed ? '🔒 Restrict to Today Only' : '🔓 Grant Past Date Access'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detailed Configuration Form */}
              <form
                id="member-perm-config-card"
                onSubmit={handleSaveMemberPerm}
                className="space-y-4 bg-white p-5 sm:p-6 rounded-3xl border-2 border-emerald-200 shadow-sm max-w-xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Configure Specific Permissions for Member</span>
                  </h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Member</label>
                  <select
                    value={selectedMemberPermId}
                    onChange={(e) => setSelectedMemberPermId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white font-semibold cursor-pointer"
                  >
                    {regularMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.nickname || m.username || m.phone || m.contact})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Permission Mode for {regularMembers.find(m => m.id === selectedMemberPermId)?.name || 'Selected Member'}:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'today_only', label: '🔒 Today Only (Default)' },
                      { key: 'allow_past_dates', label: '🔓 Full Past Dates' },
                      { key: 'days_limit', label: '📅 Days Limit' },
                      { key: 'custom_range', label: '🗓️ Custom Range' },
                    ].map(mode => (
                      <button
                        type="button"
                        key={mode.key}
                        onClick={() => setMemberPermMode(mode.key)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          memberPermMode === mode.key
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                    {memberPermMode === 'today_only' && '🔒 Member is restricted to Today Only input. Cannot modify historical records.'}
                    {memberPermMode === 'allow_past_dates' && '🔓 Member is granted full permission to select any past date, enter backdated records, and modify history.'}
                    {memberPermMode === 'days_limit' && '📅 Member can input and modify records within the last specified number of days.'}
                    {memberPermMode === 'custom_range' && '🗓️ Member can input and modify records strictly within the chosen date range.'}
                  </p>
                </div>

                {memberPermMode === 'days_limit' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Days Limit from Today (e.g. 7, 14, 30 days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={memberPermMaxDays}
                      onChange={(e) => setMemberPermMaxDays(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                )}

                {memberPermMode === 'custom_range' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={memberCustomStart}
                        onChange={(e) => setMemberCustomStart(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">End Date</label>
                      <input
                        type="date"
                        value={memberCustomEnd}
                        onChange={(e) => setMemberCustomEnd(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Member Permissions
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: USER FEEDBACK & SUGGESTIONS */}
      {activeSection === 'feedback' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
              {t('tabFeedback') || 'Feedback & Suggestions Received from Brethren'}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {feedbackList.length} submissions
            </span>
          </div>

          {feedbackList.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-6">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">
                {t('noFeedbackYet') || 'No feedback or suggestions received yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbackList.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs">
                        {item.topic}
                      </span>
                      <span className="text-xs text-slate-400">
                        {item.date} {item.time ? `• ${item.time}` : ''}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium mt-1">
                      {item.details}
                    </p>

                    <div className="text-[11px] text-slate-500 font-semibold pt-1">
                      Submitted by: <strong className="text-indigo-600">{item.authorName}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteFeedback(item.id)}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
                    title="Delete feedback"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ⚡ Multi-Assignment Modal Dialog */}
      {multiAssignTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl border-2 border-indigo-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 p-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                  <span>⚡</span>
                  <span>
                    {multiAssignTargetUser.type === 'user_managers'
                      ? `Assign Managers to ${multiAssignTargetUser.user.name}`
                      : `Assign Members / Managers to ${multiAssignTargetUser.manager.name}`}
                  </span>
                </h3>
                <p className="text-[11px] text-indigo-100 font-medium">
                  {multiAssignTargetUser.type === 'user_managers'
                    ? 'Check all managers who can manage and input records for this user'
                    : 'Check all members and managers assigned to this manager'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMultiAssignTargetUser(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search & Bulk Select Controls */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
              <input
                type="text"
                placeholder="Search candidates by name, username, or phone..."
                value={multiAssignSearch}
                onChange={(e) => setMultiAssignSearch(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-bold text-slate-600">
                  {multiAssignSelectedIds.length} Selected
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (multiAssignTargetUser.type === 'user_managers') {
                        const allMgrIds = managers.filter(m => m.id !== multiAssignTargetUser.user.id).map(m => m.id);
                        setMultiAssignSelectedIds(allMgrIds);
                      } else {
                        const allUserIds = data.users
                          .filter(u => u.id !== multiAssignTargetUser.manager.id && u.role !== 'admin' && u.id !== 'surya11008' && u.status === 'approved')
                          .map(u => u.id);
                        setMultiAssignSelectedIds(allUserIds);
                      }
                    }}
                    className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setMultiAssignSelectedIds([])}
                    className="text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Candidate Checklist */}
            <div className="p-3 overflow-y-auto space-y-1.5 flex-1 max-h-[50vh]">
              {(() => {
                const search = multiAssignSearch.toLowerCase().trim();
                let candidates = [];

                if (multiAssignTargetUser.type === 'user_managers') {
                  candidates = managers.filter(m => m.id !== multiAssignTargetUser.user.id);
                } else {
                  candidates = data.users.filter(u =>
                    u.id !== multiAssignTargetUser.manager.id &&
                    u.role !== 'admin' &&
                    u.id !== 'surya11008' &&
                    u.status === 'approved'
                  );
                }

                if (search) {
                  candidates = candidates.filter(c =>
                    (c.name || '').toLowerCase().includes(search) ||
                    (c.username || c.id || '').toLowerCase().includes(search) ||
                    (c.phone || c.contact || '').toLowerCase().includes(search)
                  );
                }

                if (candidates.length === 0) {
                  return (
                    <div className="text-center py-8 text-xs text-slate-400 italic">
                      No matching users found.
                    </div>
                  );
                }

                return candidates.map(candidate => {
                  const isChecked = multiAssignSelectedIds.includes(candidate.id);
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => {
                        setMultiAssignSelectedIds(prev =>
                          prev.includes(candidate.id)
                            ? prev.filter(id => id !== candidate.id)
                            : [...prev, candidate.id]
                        );
                      }}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          candidate.role === 'manager'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {candidate.role === 'manager' ? '👔' : '👤'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold truncate">{candidate.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">({candidate.username || candidate.phone})</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase ${
                              candidate.role === 'manager' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {candidate.role}
                            </span>
                          </div>
                          {multiAssignTargetUser.type === 'manager_members' && (() => {
                            const cMgrIds = Array.isArray(candidate.assignedManagerIds)
                              ? candidate.assignedManagerIds
                              : (candidate.assignedManagerId ? [candidate.assignedManagerId] : []);
                            const cMgrNames = managers.filter(m => cMgrIds.includes(m.id)).map(m => m.name).join(', ');
                            return cMgrNames ? (
                              <p className="text-[10px] text-indigo-600 font-medium">Managed by: {cMgrNames}</p>
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">Unassigned</p>
                            );
                          })()}
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // controlled by container
                        className="rounded-md text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                      />
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMultiAssignTargetUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveMultiAssign}
                className="px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>💾 Save Assignments ({multiAssignSelectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
