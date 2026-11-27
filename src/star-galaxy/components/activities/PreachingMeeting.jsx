import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatDate, formatTimeOnly, parseTimeToMinutes } from '../../utils/dateUtils';
import { calculatePreachingMeetingStars } from '../../utils/starCalculations';
import { ArrowLeft, Clock, Star, Calendar, CheckCircle2, XCircle, AlertTriangle, Trash2, Edit3, Sparkles } from 'lucide-react';

export default function PreachingMeeting({ onBack }) {
  const { selectedMemberId, data, getMemberActivity, updateMemberActivity, currentUser, dateRange, canEditMember, canUserModifyPastDates, getMemberOverallStarsBreakdown } = useApp();

  // Enforce privacy: regular member always sees own activity
  const targetMemberId = (currentUser?.role === 'admin' || currentUser?.role === 'manager')
    ? selectedMemberId
    : currentUser?.id;

  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const activityData = getMemberActivity(targetMemberId);
  const meetings = activityData.preachingMeeting || [];
  const overallBreakdown = getMemberOverallStarsBreakdown(targetMemberId);

  const appointedCutoffTime = data.appointedTimes?.preachingMeeting || '09:30 AM';
  const cutoffMinutes = parseTimeToMinutes(appointedCutoffTime);

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
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'selectedDate' | 'history'

  // Edit / Modify Attendance Modal State
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [adjustedTime, setAdjustedTime] = useState('');
  const [adjustedDate, setAdjustedDate] = useState('');
  const [adjustedOnTime, setAdjustedOnTime] = useState(true);

  // Daily calendar dates for current Saturday to Friday range
  const startDate = new Date(dateRange.startDate);
  const daysInWeek = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    daysInWeek.push(formatDate(d));
  }

  // Active meetings in current date range (Date Cycle)
  const activeMeetings = meetings.filter(m => m.date >= dateRange.startDate && m.date <= dateRange.endDate);
  const cycleStars = calculatePreachingMeetingStars(activeMeetings);
  const onTimeChecksCount = activeMeetings.filter(m => m.checked && m.onTime).length;
  const lateChecksCount = activeMeetings.filter(m => m.checked && !m.onTime).length;

  // Record on the selected calendar date
  const selectedDateRecord = meetings.find(m => m.date === selectedDate);

  // History grouped by date
  const sortedHistory = [...meetings].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleCheckIn = (dateStr = selectedDate) => {
    if (!canEdit) return;

    // RULE: Users without past date permission can ONLY check in for Today (todayStr)
    if (isTodayOnlyUser && dateStr !== todayStr) {
      alert(`Check-in is only available for Today (${todayStr})!`);
      return;
    }

    const existing = meetings.find(m => m.date === dateStr);
    if (existing) {
      if (canModifyDates) {
        openEditModal(existing);
      }
      return;
    }

    const now = new Date();
    const actualTime = formatTimeOnly(now);
    const actualMinutes = parseTimeToMinutes(actualTime);
    const onTime = actualMinutes <= cutoffMinutes;

    const newRecord = {
      date: dateStr,
      checked: true,
      checkInTime: actualTime,
      actualTime: actualTime,
      onTime,
      timestamp: formatDateTime(now),
    };

    const updated = meetings.filter(m => m.date !== dateStr);
    updateMemberActivity(targetMemberId, 'preachingMeeting', [...updated, newRecord]);
  };

  const openEditModal = (record) => {
    if (!canModifyDates) return;
    setEditingMeeting(record);
    const currTime = record.checkInTime || '09:20 AM';
    setAdjustedTime(currTime);
    setAdjustedDate(record.date);
    setAdjustedOnTime(record.onTime ?? (parseTimeToMinutes(currTime) <= cutoffMinutes));
  };

  const handleSaveAdjustment = (e) => {
    e.preventDefault();
    if (!editingMeeting || !adjustedTime.trim()) return;

    const targetDate = adjustedDate || editingMeeting.date;

    const updated = meetings.map(m => {
      if (m.date === editingMeeting.date) {
        return {
          ...m,
          date: targetDate,
          checkInTime: adjustedTime.trim(),
          actualTime: adjustedTime.trim(),
          onTime: adjustedOnTime,
          adjusted: true,
        };
      }
      return m;
    });

    updateMemberActivity(targetMemberId, 'preachingMeeting', updated);
    setEditingMeeting(null);
  };

  const handleDeleteMeeting = (dateStr) => {
    if (!canModifyDates) return;
    if (!confirm('Are you sure you want to delete this meeting record?')) return;
    updateMemberActivity(targetMemberId, 'preachingMeeting', meetings.filter(m => m.date !== dateStr));
    if (editingMeeting?.date === dateStr) setEditingMeeting(null);
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
        <div className="rounded-3xl bg-gradient-to-br from-sky-700 via-blue-800 to-indigo-900 text-white p-4 text-center shadow-md border-2 border-sky-400/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-sky-200 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-300" />
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
            {selectedDateRecord ? (
              selectedDateRecord.onTime ? (
                <span className="text-sm sm:text-base font-extrabold text-emerald-300 bg-emerald-950/60 border border-emerald-400/50 px-2.5 py-1 rounded-xl">
                  ✓ Attended On-Time ({selectedDateRecord.checkInTime})
                </span>
              ) : (
                <span className="text-sm sm:text-base font-extrabold text-rose-300 bg-rose-950/60 border border-rose-400/50 px-2.5 py-1 rounded-xl">
                  ✗ Late ({selectedDateRecord.checkInTime})
                </span>
              )
            ) : (
              <span className="text-xs font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-xl">
                Not Checked In
              </span>
            )}
          </div>
          <p className="text-[10px] text-sky-200 mt-2">
            Cutoff: <strong>{appointedCutoffTime}</strong> on {selectedDate}
          </p>
        </div>

        {/* Card 2: Date Cycle / Filtered Range */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-blue-900 to-sky-950 text-white p-4 text-center shadow-lg border-2 border-amber-300/70 relative overflow-hidden cute-glow-border">
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
            <span className="text-emerald-300 font-bold">✓ {onTimeChecksCount} On-Time</span>
            <span className="text-slate-400">•</span>
            <span className="text-rose-300 font-bold">✗ {lateChecksCount} Late</span>
          </div>
        </div>

        {/* Card 3: All-Time Overall */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-indigo-950 to-blue-950 text-white p-4 text-center shadow-md border-2 border-indigo-400/50 relative overflow-hidden">
          <div className="text-[10px] font-black text-indigo-200 uppercase tracking-wider flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-indigo-300" />
            <span>Overall All-Time</span>
          </div>
          <div className="text-[11px] font-bold text-white/90 mt-0.5">From Start to Present</div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-300">{overallBreakdown.preachingMeeting.stars}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-[10px] text-indigo-200 mt-0.5">
            {overallBreakdown.preachingMeeting.count} total on-time meetings
          </p>
        </div>
      </div>

      {/* Star Rule Ladder */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-2.5 flex justify-around text-[11px] font-bold text-sky-950">
        <div>3 Days: <span className="text-amber-700">10 ⭐</span></div>
        <div>4 Days: <span className="text-amber-700">20 ⭐</span></div>
        <div>5+ Days: <span className="text-amber-700">30 ⭐</span></div>
        <div>Cutoff: <span className="text-indigo-700">{appointedCutoffTime}</span></div>
      </div>

      {/* 📅 Practice Calendar & Date Control Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-sky-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Practice & Record Calendar</span>
              <span className="text-[11px] text-slate-500">Pick any date to check in, view, or modify meeting attendance</span>
            </div>
          </div>

          {/* Quick Date Shortcuts & Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              🎯 Today
            </button>
            <button
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
              }`}
            >
              ⏪ Yesterday
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-sky-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-sky-400 cursor-pointer"
            />
          </div>
        </div>

        {/* View Mode Tabs & Check-in Action */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Week ({onTimeChecksCount}/7 On-Time)
            </button>
            <button
              onClick={() => setViewMode('selectedDate')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'selectedDate'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              On {selectedDate} ({selectedDateRecord ? 'Checked' : 'Pending'})
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📜 History by Date ({sortedHistory.length})
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => handleCheckIn(selectedDate)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>{selectedDateRecord ? `Edit Check-in for ${selectedDate}` : `Check In for ${selectedDate}`}</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: Weekly Schedule (Sat to Fri) */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-sky-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Weekly Attendance Breakdown ({dateRange.startDate} → {dateRange.endDate})</span>
            </h3>
            <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
              Cutoff: {appointedCutoffTime}
            </span>
          </div>

          <div className="space-y-2.5">
            {daysInWeek.map(dateStr => {
              const dayObj = new Date(dateStr);
              const dayName = dayObj.toLocaleDateString('en-US', { weekday: 'long' });
              const record = meetings.find(m => m.date === dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={dateStr}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    isSelected ? 'ring-2 ring-sky-500 shadow-sm ' : ''
                  }${
                    record
                      ? record.onTime
                        ? 'bg-emerald-50/80 border-emerald-300'
                        : 'bg-rose-50/80 border-rose-300'
                      : isToday
                      ? 'bg-sky-50/60 border-sky-300'
                      : 'bg-slate-50 border-slate-200 opacity-90'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-800">
                        {dayName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">({dateStr})</span>
                      {isToday && (
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">
                          Today
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">
                          Selected
                        </span>
                      )}
                    </div>

                    {record ? (
                      <div className="mt-1 flex items-center gap-2">
                        {record.onTime ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Checked In: {record.checkInTime} (On-Time)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 text-xs font-bold text-rose-700">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Late ({record.checkInTime})</span>
                          </div>
                        )}
                        {record.adjusted && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md font-bold">
                            Adjusted
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Not checked in yet
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    {!record ? (
                      canEdit && (
                        (isToday || canModifyDates) ? (
                          <button
                            onClick={() => handleCheckIn(dateStr)}
                            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            Check In
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                            {dateStr < todayStr ? '🔒 Closed' : '⏳ Upcoming'}
                          </span>
                        )
                      )
                    ) : (
                      <div className="flex items-center gap-1">
                        {canModifyDates && (
                          <>
                            <button
                              onClick={() => openEditModal(record)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Modify Date / Time (Authorized Users Only)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Modify</span>
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(dateStr)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Attendance (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Selected Date Details */}
      {viewMode === 'selectedDate' && (
        <div className="bg-white rounded-3xl p-5 border-2 border-sky-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800">
                Attendance for {selectedDate}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Cutoff: <strong>{appointedCutoffTime}</strong>
              </p>
            </div>

            {selectedDateRecord && (
              <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                selectedDateRecord.onTime
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                {selectedDateRecord.onTime ? '✓ Attended On-Time' : '✗ Marked Late'}
              </span>
            )}
          </div>

          {selectedDateRecord ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Check-in Time:</span>
                <span className="font-extrabold text-slate-800 text-sm">{selectedDateRecord.checkInTime}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Status:</span>
                <span className={`font-extrabold ${selectedDateRecord.onTime ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {selectedDateRecord.onTime ? 'On-Time (Counts towards stars)' : 'Late (Stars missed)'}
                </span>
              </div>
              {selectedDateRecord.timestamp && (
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Audit Timestamp:</span>
                  <span>{selectedDateRecord.timestamp}</span>
                </div>
              )}

              {canModifyDates && (
                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => openEditModal(selectedDateRecord)}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all cursor-pointer"
                  >
                    ✏️ Modify Date & Time
                  </button>
                  <button
                    onClick={() => handleDeleteMeeting(selectedDate)}
                    className="py-2 px-4 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-bold">No check-in recorded for {selectedDate}.</p>
              {canEdit && (
                (selectedDate === todayStr || canModifyDates) ? (
                  <button
                    onClick={() => handleCheckIn(selectedDate)}
                    className="mt-3 px-5 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 shadow-xs cursor-pointer"
                  >
                    Record Attendance for {selectedDate}
                  </button>
                ) : (
                  <p className="mt-3 text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 inline-block">
                    ℹ️ Check-in is only available for Today ({todayStr})
                  </p>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* 📜 Preaching Meeting History Grouped by Date (Only shown when History tab is clicked) */}
      {viewMode === 'history' && (
        <div id="preaching-meeting-history-section" className="bg-white rounded-3xl border-2 border-sky-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>📜 Preaching Meeting History by Date</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log of check-in times, on-time vs late status, and audit records
            </p>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200">
            Total Records: {sortedHistory.length}
          </span>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No meeting records yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedHistory.map((m, idx) => (
              <div
                key={`${m.date}-${idx}`}
                className="bg-slate-50 hover:bg-sky-50/50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    m.onTime ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {m.onTime ? '✓' : '✗'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-800 font-mono">📅 {m.date}</span>
                      {m.date === todayStr && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                          Today
                        </span>
                      )}
                      {m.date === yesterdayStr && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full">
                          Yesterday
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-bold">⏰ {m.checkInTime}</span>
                      <span>•</span>
                      <span className={m.onTime ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                        {m.onTime ? 'On-Time (Counts to Ladder)' : 'Late (Missed)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(m.date);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="text-xs text-sky-600 hover:text-sky-800 font-bold mr-1 cursor-pointer"
                  >
                    Select
                  </button>
                  {canModifyDates && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(m)}
                        className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer flex items-center gap-1 border border-indigo-200 shadow-2xs"
                        title="Modify (Authorized Users Only)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modify</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMeeting(m.date)}
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

      {/* Modal: Modify Attendance Date & Time */}
      {editingMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border-2 border-sky-300">
            <h3 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Modify Attendance Date & Time</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Member: <strong>{selectedMember?.name}</strong>
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              {/* Status selection toggle */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Attendance Status:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustedOnTime(true);
                      if (parseTimeToMinutes(adjustedTime) > cutoffMinutes) {
                        setAdjustedTime('09:20 AM');
                      }
                    }}
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
                    onClick={() => {
                      setAdjustedOnTime(false);
                      if (parseTimeToMinutes(adjustedTime) <= cutoffMinutes) {
                        setAdjustedTime('09:35 AM');
                      }
                    }}
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
                  className="w-full mt-1 px-3 py-2 text-xs border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-400 font-bold bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">
                  Check-in Time (e.g. 09:20 AM):
                </label>
                <input
                  type="text"
                  required
                  value={adjustedTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdjustedTime(val);
                    const mins = parseTimeToMinutes(val);
                    if (mins > 0) {
                      setAdjustedOnTime(mins <= cutoffMinutes);
                    }
                  }}
                  placeholder="09:20 AM"
                  className="w-full mt-1 px-3 py-2 text-xs border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-400 font-bold bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Cutoff: {appointedCutoffTime}. On-time counts towards stars.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustedDate(todayStr)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 cursor-pointer"
                >
                  Set to Today
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustedDate(yesterdayStr)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 cursor-pointer"
                >
                  Set to Yesterday
                </button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteMeeting(editingMeeting.date)}
                  className="py-2 px-3 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-xl cursor-pointer"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMeeting(null)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 shadow-xs cursor-pointer"
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
