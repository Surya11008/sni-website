import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';
import {
  Search,
  Filter,
  Calendar,
  User,
  Layers,
  ChevronRight,
  ExternalLink,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Star,
  X,
  FileText,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

const ACTIVITIES_LIST = [
  { id: 'all', name: 'All Activities', emoji: '⭐' },
  { id: 'simplePreaching', name: 'Simple Preaching', emoji: '📢', color: 'bg-sky-50 text-sky-800 border-sky-300' },
  { id: 'connections', name: 'Connections', emoji: '🌐', color: 'bg-purple-50 text-purple-800 border-purple-300' },
  { id: 'fruits', name: 'Fruits', emoji: '🍇', color: 'bg-pink-50 text-pink-800 border-pink-300' },
  { id: 'lostSheep', name: 'Lost Sheep', emoji: '🐑', color: 'bg-amber-50 text-amber-800 border-amber-300' },
  { id: 'preachingMeeting', name: 'Preaching Meeting', emoji: '📅', color: 'bg-teal-50 text-teal-800 border-teal-300' },
  { id: 'worshipArrival', name: 'Worship Arrival', emoji: '⏰', color: 'bg-blue-50 text-blue-800 border-blue-300' },
  { id: 'education', name: 'Education', emoji: '📚', color: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
  { id: 'elohimAcademy', name: 'Elohim Academy', emoji: '🏆', color: 'bg-violet-50 text-violet-800 border-violet-300' },
  { id: 'preachingAcademy', name: 'Preaching Academy', emoji: '📖', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { id: 'newSongAcademy', name: 'New Song Academy', emoji: '🎶', color: 'bg-rose-50 text-rose-800 border-rose-300' },
  { id: 'gospelDiary', name: 'Gospel Diary', emoji: '✍️', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
];

export default function AdminAllStatusFeed() {
  const { data, navigateToMemberActivity } = useApp();

  // Filter States
  const [memberFilter, setMemberFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [contentSearch, setContentSearch] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState('all'); // 'all' | 'today' | 'yesterday' | 'custom'
  const [customDate, setCustomDate] = useState(formatDate(new Date()));
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'onTime' | 'late' | 'completed'

  const todayStr = formatDate(new Date());
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayObj);

  // Extract all inputs from all members across all 10 activities & gospel diary safely
  const allInputs = useMemo(() => {
    const items = [];

    try {
      const users = Array.isArray(data?.users) ? data.users : [];
      const activitiesData = (data?.activitiesData && typeof data.activitiesData === 'object') ? data.activitiesData : {};

      users.forEach(user => {
        if (!user || !user.id) return;
        const memberId = String(user.id);
        const memberName = String(user.name || user.username || memberId);
        const memberRole = String(user.role || 'member');
        const act = activitiesData[memberId] || {};

        // 1. Simple Preaching
        if (act.simplePreaching && typeof act.simplePreaching === 'object') {
          Object.entries(act.simplePreaching).forEach(([dateKey, count]) => {
            const num = Number(count) || 0;
            if (num > 0) {
              const dStr = String(dateKey || 'N/A');
              items.push({
                id: `sp-${memberId}-${dStr}`,
                memberId,
                memberName,
                memberRole,
                activityId: 'simplePreaching',
                activityName: 'Simple Preaching',
                activityEmoji: '📢',
                date: dStr,
                time: 'Daily Record',
                content: `Preaching Count: ${num} person${num !== 1 ? 's' : ''} preached`,
                status: `${num} Preached`,
                statusType: 'completed',
              });
            }
          });
        }

        // 2. Connections
        if (Array.isArray(act.connections)) {
          act.connections.forEach((c, idx) => {
            if (!c) return;
            const contactName = String(c.personName || c.name || 'Contact');
            const place = c.place ? ` (${c.place})` : '';
            const remarks = c.remarks ? ` • Remarks: ${c.remarks}` : '';
            const selections = Array.isArray(c.selections) && c.selections.length > 0 ? ` • Topics: ${c.selections.join(', ')}` : '';
            const dStr = String(c.date || c.createdAt || 'N/A');
            const tStr = String(c.time || '');

            items.push({
              id: `conn-${memberId}-${c.id || idx}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'connections',
              activityName: 'Connections',
              activityEmoji: '🌐',
              date: dStr,
              time: tStr,
              content: `Contact: ${contactName}${place}${remarks}${selections}`,
              status: 'Connected / Added',
              statusType: 'completed',
            });
          });
        }

        // 3. Fruits
        if (Array.isArray(act.fruits)) {
          act.fruits.forEach((f, idx) => {
            if (!f) return;
            const soulName = String(f.personName || f.name || 'Soul');
            const dStr = String(f.date || f.baptismDate || 'N/A');
            const checksObj = (f.checks && typeof f.checks === 'object') ? f.checks : {};
            const completedMilestones = [];
            if (checksObj.newLife) completedMilestones.push('New Life (Baptism)');
            if (checksObj.attend1) completedMilestones.push('1st Attend');
            if (checksObj.attend4) completedMilestones.push('4th Attend');
            if (checksObj.tithe) completedMilestones.push('Tithe');
            if (checksObj.nmsStep1) completedMilestones.push('NMS Step 1');
            if (checksObj.eduAttend) completedMilestones.push('Edu Attend');

            const milestoneText = completedMilestones.length > 0
              ? `Milestones (${completedMilestones.length}): ${completedMilestones.join(', ')}`
              : 'Fruit in progress (No milestones checked yet)';

            items.push({
              id: `fruit-${memberId}-${f.id || idx}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'fruits',
              activityName: 'Fruits',
              activityEmoji: '🍇',
              date: dStr,
              time: '',
              content: `Fruit Soul: ${soulName} • ${milestoneText}`,
              status: checksObj.newLife ? 'Baptized / New Life' : (completedMilestones.length > 0 ? `${completedMilestones.length} Steps` : 'In Progress'),
              statusType: 'completed',
            });
          });
        }

        // 4. Lost Sheep
        if (Array.isArray(act.lostSheep)) {
          act.lostSheep.forEach((ls, idx) => {
            if (!ls) return;
            const soulName = String(ls.personName || ls.name || 'Soul');
            const dStr = String(ls.date || ls.restoreDate || 'N/A');
            const checksObj = (ls.checks && typeof ls.checks === 'object') ? ls.checks : {};
            const completedMilestones = [];
            if (checksObj.found) completedMilestones.push('Found Soul');
            if (checksObj.attend1) completedMilestones.push('1st Attend');
            if (checksObj.attend4) completedMilestones.push('4th Attend');
            if (checksObj.tithe) completedMilestones.push('Tithe');
            if (checksObj.nmsStep1) completedMilestones.push('NMS Step 1');
            if (checksObj.eduAttend) completedMilestones.push('Edu Attend');

            const milestoneText = completedMilestones.length > 0
              ? `Restored Steps (${completedMilestones.length}): ${completedMilestones.join(', ')}`
              : 'Lost Sheep fellowship in progress';

            const notesText = ls.notes ? ` • Notes: ${ls.notes}` : '';

            items.push({
              id: `ls-${memberId}-${ls.id || idx}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'lostSheep',
              activityName: 'Lost Sheep',
              activityEmoji: '🐑',
              date: dStr,
              time: '',
              content: `Lost Sheep: ${soulName} • ${milestoneText}${notesText}`,
              status: checksObj.found ? 'Found Soul (⭐)' : (completedMilestones.length > 0 ? `${completedMilestones.length} Restored` : 'In Fellowship'),
              statusType: 'completed',
            });
          });
        }

        // 5. Preaching Meeting
        if (Array.isArray(act.preachingMeeting)) {
          act.preachingMeeting.forEach((pm, idx) => {
            if (!pm || pm.checked === false) return;
            const isOnTime = pm.onTime === true || pm.status === 'onTime';
            const dStr = String(pm.date || 'N/A');
            const checkIn = String(pm.checkInTime || pm.actualTime || pm.time || 'Scheduled');

            items.push({
              id: `pm-${memberId}-${dStr}-${idx}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'preachingMeeting',
              activityName: 'Preaching Meeting',
              activityEmoji: '📅',
              date: dStr,
              time: checkIn,
              content: `Preaching Meeting Check-in: ${checkIn}`,
              status: isOnTime ? 'On-Time (⭐)' : 'Late Arrival',
              statusType: isOnTime ? 'onTime' : 'late',
            });
          });
        }

        // 6. Worship Arrival
        if (Array.isArray(act.worshipArrival)) {
          act.worshipArrival.forEach((wa, idx) => {
            if (!wa || wa.checked === false) return;
            const isOnTime = wa.onTime === true || wa.status === 'onTime';
            const dStr = String(wa.date || 'N/A');
            const sessionTitle = String(wa.sessionLabel || wa.serviceType || 'Worship Service');
            const checkIn = String(wa.checkInTime || wa.actualTime || '10:00 AM');
            const target = wa.targetTime ? ` (Target: ${wa.targetTime})` : '';

            items.push({
              id: `wa-${memberId}-${dStr}-${wa.sessionKey || idx}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'worshipArrival',
              activityName: 'Worship Arrival',
              activityEmoji: '⏰',
              date: dStr,
              time: checkIn,
              content: `${sessionTitle}${target} • Arrived: ${checkIn}`,
              status: isOnTime ? 'On-Time (⭐)' : 'Late Arrival',
              statusType: isOnTime ? 'onTime' : 'late',
            });
          });
        }

        // 7. Education
        if (Array.isArray(act.education)) {
          act.education.forEach((ed, idx) => {
            if (!ed) return;
            let dStr = 'N/A';
            let sessionLabel = 'Session Attended';
            let tStr = '';

            if (typeof ed === 'string') {
              dStr = ed;
            } else if (typeof ed === 'object') {
              dStr = String(ed.date || 'N/A');
              sessionLabel = String(ed.session || ed.topic || ed.category || 'Session Attended');
              if (ed.timestamp && typeof ed.timestamp === 'string' && ed.timestamp.includes('•')) {
                tStr = ed.timestamp.split('•')[1].trim();
              }
            }

            items.push({
              id: `edu-${memberId}-${dStr}-${idx}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'education',
              activityName: 'Education',
              activityEmoji: '📚',
              date: dStr,
              time: tStr,
              content: `Education Session: ${sessionLabel}`,
              status: 'Completed (⭐)',
              statusType: 'completed',
            });
          });
        }

        // 8. Elohim Academy
        if (act.elohimAcademy && typeof act.elohimAcademy === 'object') {
          const timestamps = (act.elohimAcademy.timestamps && typeof act.elohimAcademy.timestamps === 'object')
            ? act.elohimAcademy.timestamps
            : {};

          (Array.isArray(act.elohimAcademy.levelChecks) ? act.elohimAcademy.levelChecks : []).forEach(lvlKey => {
            const rawStamp = timestamps[lvlKey];
            const stampStr = typeof rawStamp === 'string' ? rawStamp : '';
            const d = stampStr.includes('•') ? stampStr.split('•')[0].trim() : (stampStr || 'N/A');
            const t = stampStr.includes('•') ? stampStr.split('•')[1].trim() : '';

            items.push({
              id: `ea-lvl-${memberId}-${lvlKey}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'elohimAcademy',
              activityName: 'Elohim Academy',
              activityEmoji: '🏆',
              date: d,
              time: t,
              content: `Level Lesson: Step ${lvlKey} Mastered`,
              status: 'Mastered (⭐)',
              statusType: 'completed',
            });
          });

          (Array.isArray(act.elohimAcademy.somChecks) ? act.elohimAcademy.somChecks : []).forEach(somKey => {
            const rawStamp = timestamps[somKey];
            const stampStr = typeof rawStamp === 'string' ? rawStamp : '';
            const d = stampStr.includes('•') ? stampStr.split('•')[0].trim() : (stampStr || 'N/A');
            const t = stampStr.includes('•') ? stampStr.split('•')[1].trim() : '';

            items.push({
              id: `ea-som-${memberId}-${somKey}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'elohimAcademy',
              activityName: 'Elohim Academy',
              activityEmoji: '🏆',
              date: d,
              time: t,
              content: `Sermon of Mission: Lesson ${somKey} Mastered`,
              status: 'Mastered (⭐)',
              statusType: 'completed',
            });
          });
        }

        // 9. Preaching Academy
        if (act.preachingAcademy && typeof act.preachingAcademy === 'object') {
          const timestamps = (act.preachingAcademy.timestamps && typeof act.preachingAcademy.timestamps === 'object')
            ? act.preachingAcademy.timestamps
            : {};

          (Array.isArray(act.preachingAcademy.bookChecks) ? act.preachingAcademy.bookChecks : []).forEach(bkKey => {
            const rawStamp = timestamps[bkKey];
            const stampStr = typeof rawStamp === 'string' ? rawStamp : '';
            const d = stampStr.includes('•') ? stampStr.split('•')[0].trim() : (stampStr || 'N/A');
            const t = stampStr.includes('•') ? stampStr.split('•')[1].trim() : '';

            items.push({
              id: `pa-${memberId}-${bkKey}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'preachingAcademy',
              activityName: 'Preaching Academy',
              activityEmoji: '📖',
              date: d,
              time: t,
              content: `Preaching Step / Book: ${bkKey} Mastered`,
              status: 'Mastered (⭐)',
              statusType: 'completed',
            });
          });
        }

        // 10. New Song Academy
        if (act.newSongAcademy && typeof act.newSongAcademy === 'object') {
          const timestamps = (act.newSongAcademy.timestamps && typeof act.newSongAcademy.timestamps === 'object')
            ? act.newSongAcademy.timestamps
            : {};

          (Array.isArray(act.newSongAcademy.songChecks) ? act.newSongAcademy.songChecks : []).forEach(songNum => {
            const rawStamp = timestamps[songNum];
            const stampStr = typeof rawStamp === 'string' ? rawStamp : '';
            const d = stampStr.includes('•') ? stampStr.split('•')[0].trim() : (stampStr || 'N/A');
            const t = stampStr.includes('•') ? stampStr.split('•')[1].trim() : '';

            items.push({
              id: `nsa-${memberId}-${songNum}`,
              memberId,
              memberName,
              memberRole,
              activityId: 'newSongAcademy',
              activityName: 'New Song Academy',
              activityEmoji: '🎶',
              date: d,
              time: t,
              content: `New Song Praised: #${songNum}`,
              status: 'Mastered (⭐)',
              statusType: 'completed',
            });
          });
        }

        // 11. Gospel Diary (safe extraction for both Object and Array schemas)
        let memberDiaries = [];
        if (data?.gospelDiary) {
          if (Array.isArray(data.gospelDiary)) {
            memberDiaries = data.gospelDiary.filter(gd => gd && (gd.memberId === memberId || gd.userId === memberId));
          } else if (typeof data.gospelDiary === 'object' && Array.isArray(data.gospelDiary[memberId])) {
            memberDiaries = data.gospelDiary[memberId];
          }
        }

        memberDiaries.forEach(gd => {
          if (!gd) return;
          const title = String(gd.title || 'Personal Entry');
          const snippet = String(gd.writing || gd.content || '').slice(0, 80);
          const dStr = String(gd.date || 'N/A');

          items.push({
            id: `gd-${memberId}-${gd.id || dStr}`,
            memberId,
            memberName,
            memberRole,
            activityId: 'gospelDiary',
            activityName: 'Gospel Diary',
            activityEmoji: '✍️',
            date: dStr,
            time: '',
            content: `Diary: "${title}" • ${snippet}${snippet.length >= 80 ? '...' : ''}`,
            status: 'Recorded',
            statusType: 'completed',
          });
        });
      });
    } catch (err) {
      console.error('Error compiling allInputs for AdminAllStatusFeed:', err);
    }

    // Sort descending by date
    return items.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [data]);

  // Apply Multi-Parameter Filters
  const filteredInputs = useMemo(() => {
    return allInputs.filter(item => {
      // 1. Member filter
      if (memberFilter !== 'all' && item.memberId !== memberFilter) {
        return false;
      }

      // 2. Activity filter
      if (activityFilter !== 'all' && item.activityId !== activityFilter) {
        return false;
      }

      // 3. Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'onTime' && item.statusType !== 'onTime') return false;
        if (statusFilter === 'late' && item.statusType !== 'late') return false;
        if (statusFilter === 'completed' && item.statusType !== 'completed') return false;
      }

      // 4. Date filter
      const itemDate = String(item.date || '');
      if (dateFilterMode === 'today') {
        if (!itemDate.includes(todayStr)) return false;
      } else if (dateFilterMode === 'yesterday') {
        if (!itemDate.includes(yesterdayStr)) return false;
      } else if (dateFilterMode === 'custom') {
        if (!itemDate.includes(customDate)) return false;
      }

      // 5. Content Search
      if (contentSearch.trim()) {
        const q = contentSearch.toLowerCase().trim();
        const contentMatch = String(item.content || '').toLowerCase().includes(q);
        const nameMatch = String(item.memberName || '').toLowerCase().includes(q);
        const activityMatch = String(item.activityName || '').toLowerCase().includes(q);
        const statusMatch = String(item.status || '').toLowerCase().includes(q);
        const dateMatch = String(item.date || '').toLowerCase().includes(q);
        if (!contentMatch && !nameMatch && !activityMatch && !statusMatch && !dateMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allInputs, memberFilter, activityFilter, statusFilter, dateFilterMode, customDate, contentSearch, todayStr, yesterdayStr]);

  const handleResetFilters = () => {
    setMemberFilter('all');
    setActivityFilter('all');
    setContentSearch('');
    setDateFilterMode('all');
    setStatusFilter('all');
  };

  const hasActiveFilters =
    memberFilter !== 'all' ||
    activityFilter !== 'all' ||
    contentSearch.trim() !== '' ||
    dateFilterMode !== 'all' ||
    statusFilter !== 'all';

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 👑 Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-5 border-2 border-amber-400/40 shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                  All Members Activity Status Feed
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                Real-time log of every person, activity, content input, date & status. Click any entry to directly edit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold text-sky-200">Total Inputs:</span>
            <span className="text-sm font-black text-white">{allInputs.length}</span>
          </div>
        </div>
      </div>

      {/* 🎛️ Comprehensive Filter Panel */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-indigo-100 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Filter Feed by Person, Activity, Date & Content</span>
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* 1. Keyword / Content Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={contentSearch}
            onChange={(e) => setContentSearch(e.target.value)}
            placeholder="Search by content input, person name, lesson, song number, soul name, or remarks..."
            className="w-full pl-10 pr-9 py-2.5 text-xs border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 font-semibold bg-slate-50/50"
          />
          {contentSearch && (
            <button
              type="button"
              onClick={() => setContentSearch('')}
              className="w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 2. Dropdown Selectors: Person + Activity + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* Member Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-indigo-600" />
              <span>Person / Member:</span>
            </label>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="all">All Members ({data?.users?.length || 0})</option>
              {(data?.users || []).map(u => (
                <option key={u.id} value={u.id}>
                  {u.name || u.username} ({u.role || 'member'})
                </option>
              ))}
            </select>
          </div>

          {/* Activity Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-600" />
              <span>Activity:</span>
            </label>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              {ACTIVITIES_LIST.map(act => (
                <option key={act.id} value={act.id}>
                  {act.emoji} {act.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
              <span>Status Filter:</span>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed / Mastered / Recorded (⭐)</option>
              <option value="onTime">On-Time Only</option>
              <option value="late">Late Arrival Only</option>
            </select>
          </div>
        </div>

        {/* 3. Date Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Date:</span>
            </span>
            <button
              type="button"
              onClick={() => setDateFilterMode('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilterMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Dates
            </button>
            <button
              type="button"
              onClick={() => setDateFilterMode('today')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilterMode === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilterMode('yesterday')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilterMode === 'yesterday'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setDateFilterMode('custom')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dateFilterMode === 'custom'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Custom Date
            </button>
          </div>

          {dateFilterMode === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold border border-indigo-200 rounded-xl bg-indigo-50/50 text-indigo-950 focus:ring-1 focus:ring-indigo-400 cursor-pointer"
            />
          )}

          <span className="text-[11px] text-slate-500 font-semibold ml-auto">
            Showing <strong className="text-indigo-700 font-bold">{filteredInputs.length}</strong> of {allInputs.length} inputs
          </span>
        </div>
      </div>

      {/* 📋 Results Feed List */}
      <div className="space-y-2.5">
        {filteredInputs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border-2 border-slate-200 shadow-xs space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Activity Inputs Found</h4>
            <p className="text-xs text-slate-500">
              No member activity records match the selected filter criteria.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredInputs.map(item => {
            const actInfo = ACTIVITIES_LIST.find(a => a.id === item.activityId) || ACTIVITIES_LIST[0];

            return (
              <div
                key={item.id}
                onClick={() => navigateToMemberActivity(item.memberId, item.activityId)}
                className="p-3.5 sm:p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group"
                title={`Click to open and edit ${item.memberName}'s ${item.activityName} inputs`}
              >
                {/* Left: Person Avatar + Name + Activity Badge + Content */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-105 transition-transform">
                    {item.memberName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Top Row: Member Name, Role, Activity Badge */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <strong className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                        {item.memberName}
                      </strong>
                      <span className={`px-2 py-0.2 rounded-md text-[9px] font-black uppercase ${
                        item.memberRole === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                        item.memberRole === 'manager' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {item.memberRole}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${actInfo.color || 'bg-slate-100 text-slate-800'}`}>
                        <span>{item.activityEmoji}</span>
                        <span>{item.activityName}</span>
                      </span>
                    </div>

                    {/* Middle Row: Content Input Description */}
                    <p className="text-xs font-semibold text-slate-700 leading-snug break-words">
                      {item.content}
                    </p>

                    {/* Bottom Row: Date & Time */}
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{item.date}</span>
                      </span>
                      {item.time && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.time}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & Direct Edit Action Button */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${
                    item.statusType === 'onTime' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                    item.statusType === 'late' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                    'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    {item.status}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToMemberActivity(item.memberId, item.activityId);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="Edit or Inspect this member's input"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Input</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
