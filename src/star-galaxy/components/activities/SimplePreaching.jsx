import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';
import { calculateSimplePreachingStars } from '../../utils/starCalculations';
import {
  ArrowLeft,
  Plus,
  Star,
  Calendar,
  CheckCircle2,
  Edit3,
  Trash2,
  ShieldCheck,
  Clock,
  Sparkles,
  History,
  Check,
  X,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function SimplePreaching({ onBack }) {
  const {
    selectedMemberId,
    data,
    getMemberActivity,
    updateMemberActivity,
    currentUser,
    dateRange,
    canEditMember,
    canUserModifyPastDates,
    getMemberOverallStarsBreakdown,
  } = useApp();

  // Enforce privacy: regular member always sees own activity
  const targetMemberId = currentUser?.id;

  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const activityData = getMemberActivity(targetMemberId);
  const preachingRecords = activityData.simplePreaching || {};
  const overallBreakdown = getMemberOverallStarsBreakdown(targetMemberId);

  const todayStr = formatDate(new Date());
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayObj);

  const canModifyDates = canUserModifyPastDates(currentUser);
  const isTodayOnlyUser = !canModifyDates;
  const canEdit = canEditMember(targetMemberId);

  // Active Calendar Date & View Mode
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('add'); // 'add' | 'history'
  const [countInput, setCountInput] = useState('');

  // Modify Modal state
  const [editingEntry, setEditingEntry] = useState(null); // { oldDate, count }
  const [editDate, setEditDate] = useState(todayStr);
  const [editCount, setEditCount] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Selected Date Metrics
  const selectedDateCount = Number(preachingRecords[selectedDate]) || 0;
  const selectedDateStars = calculateSimplePreachingStars(selectedDateCount);

  // Active Date Range (This Week) Metrics
  const activeEntries = useMemo(() => {
    return Object.entries(preachingRecords).filter(([dStr]) => {
      return dStr >= dateRange.startDate && dStr <= dateRange.endDate;
    });
  }, [preachingRecords, dateRange]);

  const weekCount = useMemo(() => {
    return activeEntries.reduce((sum, [, cnt]) => sum + (Number(cnt) || 0), 0);
  }, [activeEntries]);

  const weekStars = calculateSimplePreachingStars(weekCount);
  const remainder = weekCount % 100;
  const nextTarget = 100 - remainder;

  // History grouped by date
  const sortedHistory = useMemo(() => {
    return Object.entries(preachingRecords)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dStr, cnt]) => {
        const c = Number(cnt) || 0;
        return {
          date: dStr,
          count: c,
          stars: calculateSimplePreachingStars(c),
        };
      });
  }, [preachingRecords]);

  // Handle Add / Increment Count
  const handleAddCount = (e) => {
    e.preventDefault();
    if (!countInput || Number(countInput) <= 0) return;

    // RULE: Users restricted to Today Only can ONLY input for Today (todayStr)
    const targetInputDate = isTodayOnlyUser ? todayStr : selectedDate;
    const currentForDate = Number(preachingRecords[targetInputDate]) || 0;
    const newTotal = currentForDate + Number(countInput);

    updateMemberActivity(targetMemberId, 'simplePreaching', {
      ...preachingRecords,
      [targetInputDate]: newTotal,
    });

    showToast(`✓ Added ${countInput} count for ${isTodayOnlyUser ? `Today (${targetInputDate})` : targetInputDate}! Total: ${newTotal}`);
    setCountInput('');
  };

  // Save modified date and/or count (Requires Permission)
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!canModifyDates) {
      showToast('⚠️ You do not have permission to modify historical records.');
      return;
    }
    if (!editingEntry || !editDate || Number(editCount) <= 0) return;

    const updated = { ...preachingRecords };
    if (editingEntry.oldDate !== editDate) {
      delete updated[editingEntry.oldDate];
    }
    updated[editDate] = Number(editCount);

    updateMemberActivity(targetMemberId, 'simplePreaching', updated);
    showToast(`✓ Updated record for ${editDate} to ${editCount} count!`);
    setEditingEntry(null);
  };

  // Delete record (Requires Permission)
  const handleDeleteEntry = (dStr) => {
    if (!canModifyDates) {
      showToast('⚠️ You do not have permission to delete records.');
      return;
    }
    if (!confirm(`Delete preaching record for ${dStr}?`)) return;

    const updated = { ...preachingRecords };
    delete updated[dStr];
    updateMemberActivity(targetMemberId, 'simplePreaching', updated);
    showToast(`Deleted record for ${dStr}.`);
    if (editingEntry?.oldDate === dStr) setEditingEntry(null);
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

      {/* Floating Action Feedback Toast */}
      {toastMsg && (
        <div className="p-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold text-center shadow-lg animate-in slide-in-from-top-2 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ⭐ STAR CALCULATION ACCORDING TO DATES (DASHBOARD) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Selected Calendar Date */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-sky-300/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-100 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-200" />
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

          <div className="my-2 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {selectedDateCount}
            </span>
            <span className="text-xs font-bold text-sky-100">Count on {selectedDate}</span>
            {selectedDateStars > 0 && (
              <span className="ml-auto flex items-center gap-1 bg-amber-400 text-amber-950 font-black text-xs px-2 py-0.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-950" />
                <span>{selectedDateStars} ⭐</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-sky-100 font-semibold border-t border-white/20 pt-2">
            <span>{selectedDateCount > 0 ? `${selectedDateCount} preached on this date` : 'No count yet'}</span>
            <span className="text-[10px] font-bold text-sky-200">Daily Track</span>
          </div>
        </div>

        {/* 2. Date Cycle / This Week Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-600 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-blue-300/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Date Cycle Stars</span>
            </span>
            <span className="text-[9px] font-bold bg-white/10 px-2 py-0.5 rounded-full text-sky-200 backdrop-blur-xs">
              {dateRange?.startDate} → {dateRange?.endDate}
            </span>
          </div>

          <div className="my-2.5 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-300">
              {weekStars}
            </span>
            <Star className="w-7 h-7 fill-amber-400 text-amber-400 animate-pulse" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-sky-200 font-semibold border-t border-white/10 pt-2">
            <span>{weekCount} total count in cycle</span>
            <span className="text-[10px] text-amber-300 font-bold">100 = 10 ⭐</span>
          </div>
        </div>

        {/* 3. All-Time Overall Total Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-600 to-sky-700 text-white p-4 shadow-md flex flex-col justify-between relative overflow-hidden border border-amber-300/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Overall Total Stars</span>
            </span>
            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/30">
              All-Time
            </span>
          </div>

          <div className="my-2.5 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {overallBreakdown.simplePreaching.stars}
            </span>
            <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold border-t border-white/10 pt-2">
            <span>{overallBreakdown.simplePreaching.count} All-time Count</span>
            <span className="text-[10px] text-amber-300 font-bold">All History</span>
          </div>
        </div>
      </div>

      {/* Progress towards next 100 count */}
      <div className="p-3 bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl border border-sky-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
            🎯
          </div>
          <div>
            <span className="font-extrabold text-slate-800">
              Rule: Every 100 preaching count = 10 ⭐
            </span>
            <p className="text-[10px] text-slate-500 font-medium">
              Need <strong className="text-sky-700 font-bold">{nextTarget}</strong> more count in this cycle to earn next <strong className="text-amber-600">+10 ⭐</strong>!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-24 bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${remainder}%` }}
            />
          </div>
          <span className="text-[10px] font-black text-sky-700 font-mono">
            {remainder}/100
          </span>
        </div>
      </div>

      {/* 📅 Interactive Calendar & Date Modify Control Center */}
      <div className="bg-gradient-to-br from-white to-sky-50/50 rounded-3xl p-4 sm:p-5 border-2 border-sky-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shadow-inner">
              <Calendar className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-800">
                Preaching Date & Calendar Control
              </h3>
              <p className="text-[11px] text-slate-500">
                Select date to record preaching count or modify previous records
              </p>
            </div>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white hover:bg-sky-50 text-slate-600 border border-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white hover:bg-sky-50 text-slate-600 border border-slate-200'
              }`}
            >
              Yesterday
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-sky-100 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Active Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 bg-sky-50/50 text-slate-800 cursor-pointer w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-sky-900 bg-sky-100 font-bold px-2.5 py-1 rounded-xl border border-sky-200">
              ✨ Currently on {selectedDate}: <strong>{selectedDateCount} count</strong>
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-t border-sky-100 pt-3 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('add')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'add'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isTodayOnlyUser ? "Record Today's Count" : `Add Count for ${selectedDate}`}</span>
            {isTodayOnlyUser && (
              <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-amber-300 text-amber-950 font-black">
                Today Only
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Preaching Calendar History</span>
            <span className="px-2 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-900 font-bold">
              {sortedHistory.length} dates
            </span>
          </button>
        </div>
      </div>

      {/* RECORD PREACHING COUNT FOR SELECTED DATE / TODAY */}
      {viewMode === 'add' && canEdit && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-sky-200 shadow-xs space-y-3">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-600" />
              <span>
                {isTodayOnlyUser ? `Record Preaching Count for Today (${todayStr})` : `Record Preaching Count for ${selectedDate}`}
              </span>
            </span>
            <span className="text-xs text-sky-800 font-bold bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
              Current: {Number(preachingRecords[isTodayOnlyUser ? todayStr : selectedDate]) || 0} count
            </span>
          </h3>

          {isTodayOnlyUser && selectedDate !== todayStr && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
              <span>ℹ️</span>
              <span>
                Viewing <strong>{selectedDate}</strong>. Today-only mode active: preaching count input is recorded for <strong>Today ({todayStr})</strong>.
              </span>
            </div>
          )}

          <form onSubmit={handleAddCount} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                Enter Additional Count to Add:
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 25, 50, 100"
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-black border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-400 bg-slate-50"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isTodayOnlyUser ? `Add to Today (${todayStr})` : `Add to ${selectedDate}`}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 📜 Preaching History by Date (Only shown when History tab is clicked) */}
      {viewMode === 'history' && (
        <div id="simple-preaching-history-section" className="bg-white rounded-3xl p-5 border-2 border-sky-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-600" />
              <span>📜 Preaching History by Date</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log of preaching counts and stars earned by date
            </p>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-200">
            Total Dates: {sortedHistory.length}
          </span>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No preaching records entered yet. Enter count above!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedHistory.map((item) => (
              <div
                key={item.date}
                className="flex flex-wrap items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/50 border border-slate-200 transition-all gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 font-mono">
                    📅 {item.date}
                  </span>
                  {item.date === todayStr && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                      Today
                    </span>
                  )}
                  {item.date === yesterdayStr && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.2 rounded-full">
                      Yesterday
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-xl">
                    {item.count} count
                  </span>
                  {item.stars > 0 && (
                    <span className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-2.5 py-0.5 rounded-full border border-amber-400 shadow-2xs flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-700 text-amber-800" />
                      <span>+{item.stars} ⭐</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(item.date);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Select</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {canModifyDates && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEntry({ oldDate: item.date, count: item.count });
                        setEditDate(item.date);
                        setEditCount(String(item.count));
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-bold border border-indigo-200 shadow-2xs flex items-center gap-1 cursor-pointer ml-1"
                      title="Modify Date / Count (Authorized Users Only)"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Modify</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* 📅 Modify Preaching Date & Count Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-sky-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Modify Preaching Record
                  </h3>
                  <p className="text-[11px] text-sky-700 font-semibold">
                    Original Date: {editingEntry.oldDate}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2.5 mb-3">
              Member: <strong className="text-slate-800">{selectedMember?.name}</strong>
            </p>

            {/* Date Modify Form */}
            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    Preaching Date:
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditDate(todayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold hover:bg-sky-100"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDate(yesterdayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold hover:bg-sky-100"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Total Count for Date:
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editCount}
                  onChange={(e) => setEditCount(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteEntry(editingEntry.oldDate)}
                  className="px-3 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                  title="Delete this preaching record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex-1 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Record</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
