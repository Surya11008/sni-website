import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatDate, formatTimeOnly, parseTimeToMinutes } from '../../utils/dateUtils';
import { calculateWorshipArrivalStars } from '../../utils/starCalculations';
import { ArrowLeft, Clock, Star, Calendar, CheckCircle2, XCircle, Trash2, Edit3, Sparkles } from 'lucide-react';

export default function WorshipArrival({ onBack }) {
  const { selectedMemberId, data, getMemberActivity, updateMemberActivity, currentUser, dateRange, canEditMember, canUserModifyPastDates, getMemberOverallStarsBreakdown } = useApp();

  // Enforce privacy: regular member always sees own activity
  const targetMemberId = currentUser?.id;

  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const activityData = getMemberActivity(targetMemberId);
  const worshipList = activityData.worshipArrival || [];
  const overallBreakdown = getMemberOverallStarsBreakdown(targetMemberId);

  const canEdit = canEditMember(targetMemberId);
  const canModifyDates = canUserModifyPastDates(currentUser);
  const isTodayOnlyUser = !canModifyDates;
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isMember = currentUser?.role === 'member';
  const isAdminOrManager = isAdmin || isManager;

  const todayStr = formatDate(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayDate);

  // 📅 Interactive Calendar & Date State
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('sessions'); // 'sessions' | 'selectedDate' | 'history'

  // Custom Time / Date Adjustment State
  const [editingWorship, setEditingWorship] = useState(null);
  const [adjustedTime, setAdjustedTime] = useState('');
  const [adjustedDate, setAdjustedDate] = useState('');
  const [adjustedOnTime, setAdjustedOnTime] = useState(true);

  // The 4 weekly sessions as finalized on page 39 & 41:
  // Saturday: 9:15 AM, 1:45 PM, 6:45 PM
  // Tuesday: 6:45 PM
  const sessions = [
    { id: 'sat-1', day: 'Saturday', time: '09:15 AM', label: 'Saturday Morning' },
    { id: 'sat-2', day: 'Saturday', time: '01:45 PM', label: 'Saturday Afternoon' },
    { id: 'sat-3', day: 'Saturday', time: '06:45 PM', label: 'Saturday Evening' },
    { id: 'tue-1', day: 'Tuesday', time: '06:45 PM', label: 'Tuesday Evening' },
  ];

  // Filter worship checks in date range (Date Cycle)
  const activeWorship = worshipList.filter(w => w.date >= dateRange.startDate && w.date <= dateRange.endDate);
  const cycleStars = calculateWorshipArrivalStars(activeWorship);
  const onTimeCount = activeWorship.filter(w => w.checked && w.onTime).length;
  const lateCount = activeWorship.filter(w => w.checked && !w.onTime).length;

  // Records on selected date
  const selectedDateWorship = worshipList.filter(w => w.date === selectedDate);

  // History sorted by date descending
  const sortedHistory = [...worshipList].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleCheckIn = (session, dateToUse = selectedDate) => {
    if (!canEdit) return;

    // RULE: Users without past date permission can ONLY check in for Today (todayStr)
    const effectiveDate = isTodayOnlyUser ? todayStr : dateToUse;
    if (isTodayOnlyUser && dateToUse !== todayStr) {
      alert(`Check-in is only available for Today (${todayStr})!`);
      return;
    }

    const existing = worshipList.find(w => w.sessionKey === session.id && w.date === effectiveDate);
    if (existing) {
      if (canModifyDates) {
        openEditModal(existing);
      }
      return;
    }

    const now = new Date();
    const actualTime = formatTimeOnly(now);
    const targetMinutes = parseTimeToMinutes(session.time);
    const actualMinutes = parseTimeToMinutes(actualTime);
    const onTime = actualMinutes <= targetMinutes;

    const newRecord = {
      date: effectiveDate,
      sessionKey: session.id,
      sessionLabel: session.label,
      targetTime: session.time,
      checkInTime: actualTime,
      checked: true,
      onTime,
      timestamp: formatDateTime(now),
    };

    const updated = worshipList.filter(w => !(w.sessionKey === session.id && w.date === effectiveDate));
    updateMemberActivity(targetMemberId, 'worshipArrival', [...updated, newRecord]);
  };

  const openEditModal = (record) => {
    if (!canModifyDates) return;
    setEditingWorship(record);
    const currTime = record.checkInTime || record.targetTime || '09:15 AM';
    setAdjustedTime(currTime);
    setAdjustedDate(record.date || selectedDate);
    const targetMins = parseTimeToMinutes(record.targetTime || '09:15 AM');
    setAdjustedOnTime(record.onTime ?? (parseTimeToMinutes(currTime) <= targetMins));
  };

  const handleAdjustTimeAndDate = (e) => {
    e.preventDefault();
    if (!canModifyDates) return;
    if (!editingWorship || !adjustedTime.trim()) return;

    const updated = worshipList.map(w => {
      if (w.sessionKey === editingWorship.sessionKey && w.date === editingWorship.date) {
        return {
          ...w,
          date: adjustedDate || w.date,
          checkInTime: adjustedTime.trim(),
          onTime: adjustedOnTime,
          adjusted: true,
        };
      }
      return w;
    });

    updateMemberActivity(targetMemberId, 'worshipArrival', updated);
    setEditingWorship(null);
  };

  const handleDelete = (record) => {
    if (!canModifyDates) return;
    if (!confirm('Are you sure you want to delete this worship attendance?')) return;
    updateMemberActivity(
      targetMemberId,
      'worshipArrival',
      worshipList.filter(w => !(w.sessionKey === record.sessionKey && w.date === record.date))
    );
    if (editingWorship?.sessionKey === record.sessionKey && editingWorship?.date === record.date) {
      setEditingWorship(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Activities</span>
        </button>
        <span className="text-xs font-semibold text-slate-500">
          Member: <strong className="text-slate-800">{selectedMember?.name}</strong>
        </span>
      </div>

      {/* 3-Tier Star Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Selected Date Attendance */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-800 to-indigo-900 text-white p-4 text-center shadow-md border-2 border-blue-400/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>Selected Date</span>
            </span>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
              {selectedDate}
            </span>
          </div>

          {/* Interactive Date Change Option directly on Selected Date Card */}
          <div className="mt-2 flex items-center justify-between gap-1.5 bg-black/20 p-1.5 rounded-2xl border border-white/20">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-2 py-1 rounded-xl text-xs font-black bg-white/20 hover:bg-white/30 text-white border border-white/30 focus:outline-none focus:ring-1 focus:ring-amber-300 cursor-pointer w-full text-center"
              title="Click to select or change date"
            />
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  selectedDate === todayStr ? 'bg-amber-300 text-amber-950 font-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                  selectedDate === yesterdayStr ? 'bg-amber-300 text-amber-950 font-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Yesterday
              </button>
            </div>
          </div>

          <div className="my-2 flex items-center justify-center gap-1.5">
            {selectedDateWorship.length > 0 ? (
              <span className="text-sm font-extrabold text-amber-300 bg-white/10 px-2.5 py-1 rounded-xl">
                {selectedDateWorship.filter(w => w.onTime).length} On-Time Session{selectedDateWorship.filter(w => w.onTime).length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-xl">
                No Attendance Recorded
              </span>
            )}
          </div>
          <p className="text-[10px] text-blue-200 mt-2">
            {selectedDateWorship.length} total check-in{selectedDateWorship.length !== 1 ? 's' : ''} on {selectedDate}
          </p>
        </div>

        {/* Card 2: Date Cycle / Filtered Range */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-600 text-white p-4 text-center shadow-lg border-2 border-amber-300/70 relative overflow-hidden cute-glow-border">
          <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Date Cycle (This Week)</span>
          </div>
          <div className="text-[11px] font-bold text-sky-200 mt-0.5">
            {dateRange.startDate} → {dateRange.endDate}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-amber-300">{cycleStars}</span>
            <Star className="w-6 h-6 fill-amber-400 text-amber-400 animate-pulse" />
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-2 text-[10px]">
            <span className="text-emerald-300 font-bold">✓ {onTimeCount} On-Time</span>
            <span className="text-slate-400">•</span>
            <span className="text-rose-300 font-bold">✗ {lateCount} Late</span>
          </div>
        </div>

        {/* Card 3: All-Time Overall */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-600 to-sky-700 text-white p-4 text-center shadow-md border-2 border-blue-300/50 relative overflow-hidden">
          <div className="text-[10px] font-black text-indigo-200 uppercase tracking-wider flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-indigo-300" />
            <span>Overall All-Time</span>
          </div>
          <div className="text-[11px] font-bold text-white/90 mt-0.5">From Start to Present</div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-300">{overallBreakdown.worshipArrival.stars}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-[10px] text-indigo-200 mt-0.5">
            {overallBreakdown.worshipArrival.count} total on-time sessions
          </p>
        </div>
      </div>

      {/* Star Rule Ladder */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-2.5 flex justify-around text-[11px] font-bold text-blue-950">
        <div>2 Checks: <span className="text-amber-700">10 ⭐</span></div>
        <div>3 Checks: <span className="text-amber-700">10 ⭐</span></div>
        <div>4 Checks: <span className="text-amber-700">20 ⭐</span></div>
        <div>Total: <span className="text-indigo-700">4 Weekly Sessions</span></div>
      </div>

      {/* 📅 Practice Calendar & Date Control Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-blue-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Practice & Record Calendar</span>
              <span className="text-[11px] text-slate-500">Pick any date to check in, view, or modify worship arrival</span>
            </div>
          </div>

          {/* Quick Date Shortcuts & Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              🎯 Today
            </button>
            <button
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              ⏪ Yesterday
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-blue-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-400 cursor-pointer"
            />
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('sessions')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'sessions'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4 Weekly Sessions ({onTimeCount}/4 On-Time)
            </button>
            <button
              onClick={() => setViewMode('selectedDate')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'selectedDate'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              On {selectedDate} ({selectedDateWorship.length})
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📜 History by Date ({worshipList.length})
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: Appointed Weekly Sessions */}
      {viewMode === 'sessions' && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-blue-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Appointed Worship Times ({dateRange.startDate} → {dateRange.endDate})</span>
            </h3>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              4 Weekly Sessions
            </span>
          </div>

          <div className="space-y-3">
            {sessions.map(sess => {
              const record = activeWorship.find(w => w.sessionKey === sess.id);
              return (
                <div
                  key={sess.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    record
                      ? record.onTime
                        ? 'bg-emerald-50/80 border-emerald-300'
                        : 'bg-rose-50/80 border-rose-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-800">
                        {sess.label}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-sky-800">
                        Target: {sess.time}
                      </span>
                    </div>

                    {record ? (
                      <div className="mt-1 flex items-center gap-2">
                        {record.onTime ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Checked In On-Time: {record.checkInTime} ({record.date})
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Late ({record.checkInTime}) ({record.date})
                          </span>
                        )}
                        {record.adjusted && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md font-bold">
                            Adjusted
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">Pending Check-in</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!record ? (
                      canEdit && (
                        (selectedDate === todayStr || canModifyDates) ? (
                          <button
                            onClick={() => handleCheckIn(sess, selectedDate)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            Check In ({selectedDate})
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                            {selectedDate < todayStr ? '🔒 Closed' : '⏳ Today Only'}
                          </span>
                        )
                      )
                    ) : (
                      canModifyDates && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(record)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Modify Date / Time (Authorized Users Only)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Modify</span>
                          </button>
                          <button
                            onClick={() => handleDelete(record)}
                            className="text-red-400 hover:text-red-600 p-1.5 rounded-lg cursor-pointer"
                            title="Delete (Admin Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Sessions on Selected Date */}
      {viewMode === 'selectedDate' && (
        <div className="bg-white rounded-3xl p-5 border-2 border-blue-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800">
                Worship Attendance on {selectedDate} ({selectedDateWorship.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Check-ins stamped with this calendar date
              </p>
            </div>
          </div>

          {selectedDateWorship.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-bold">No worship check-ins recorded for {selectedDate}.</p>
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleCheckIn(s, selectedDate)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                  >
                    + Check In {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDateWorship.map((w, idx) => (
                <div
                  key={`${w.sessionKey}-${w.date}-${idx}`}
                  className="p-3.5 rounded-2xl bg-white border-2 border-blue-100 shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-extrabold text-sm text-slate-800">{w.sessionLabel}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs">
                      <span className="font-bold text-slate-600">⏰ {w.checkInTime}</span>
                      <span>•</span>
                      <span className={w.onTime ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {w.onTime ? '✓ On-Time' : '✗ Late'}
                      </span>
                    </div>
                  </div>

                  {canModifyDates && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(w)}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                        title="Modify (Authorized Users Only)"
                      >
                        Modify Date
                      </button>
                      <button
                        onClick={() => handleDelete(w)}
                        className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                        title="Delete (Admin Only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 📜 Worship Arrival History Grouped by Date (Only shown when History tab is clicked) */}
      {viewMode === 'history' && (
        <div id="worship-arrival-history-section" className="bg-white rounded-3xl border-2 border-blue-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>📜 Worship Arrival History by Date</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log of worship arrival times, on-time vs late status, and audit records
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
            Total Records: {sortedHistory.length}
          </span>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No worship records yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedHistory.map((w, idx) => (
              <div
                key={`${w.date}-${w.sessionKey}-${idx}`}
                className="bg-slate-50 hover:bg-blue-50/50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    w.onTime ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {w.onTime ? '✓' : '✗'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-800">{w.sessionLabel}</span>
                      <span className="text-[11px] text-slate-500 font-mono font-bold">📅 {w.date}</span>
                      {w.date === todayStr && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                          Today
                        </span>
                      )}
                      {w.date === yesterdayStr && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full">
                          Yesterday
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-bold">⏰ Checked-in: {w.checkInTime}</span>
                      <span>•</span>
                      <span className="text-slate-400">Target: {w.targetTime}</span>
                      <span>•</span>
                      <span className={w.onTime ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {w.onTime ? 'On-Time (Counts to Stars)' : 'Late (Missed)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(w.date);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold mr-1 cursor-pointer"
                  >
                    Select
                  </button>
                  {canModifyDates && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(w)}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer flex items-center gap-1 border border-indigo-200 shadow-2xs"
                        title="Modify (Authorized Users Only)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modify</span>
                      </button>
                      <button
                        onClick={() => handleDelete(w)}
                        className="p-1.5 text-red-400 hover:text-red-600 cursor-pointer"
                        title="Delete (Authorized Users Only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* Modal: Modify Worship Attendance Date & Time */}
      {editingWorship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border-2 border-blue-300">
            <h3 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Modify Worship Date & Time</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Session: <strong>{editingWorship.sessionLabel}</strong>
            </p>

            <form onSubmit={handleAdjustTimeAndDate} className="space-y-3">
              {/* Status selection toggle */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Attendance Status:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustedOnTime(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                      adjustedOnTime
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>🟢 On-Time</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustedOnTime(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                      !adjustedOnTime
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>🔴 Late</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Date:
                </label>
                <input
                  type="date"
                  required
                  value={adjustedDate}
                  onChange={(e) => setAdjustedDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-400 font-bold bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Check-in Time:
                </label>
                <input
                  type="text"
                  required
                  value={adjustedTime}
                  onChange={(e) => setAdjustedTime(e.target.value)}
                  placeholder="09:10 AM"
                  className="w-full mt-1 px-3 py-2 text-xs border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-400 font-bold bg-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustedDate(todayStr)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                >
                  Set to Today
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustedDate(yesterdayStr)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                >
                  Set to Yesterday
                </button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDelete(editingWorship)}
                  className="py-2 px-3 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-xl cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setEditingWorship(null)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  Save Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
