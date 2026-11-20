import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate, formatDateTime } from '../../utils/dateUtils';
import { calculateSingleConnectionStars, calculateTotalConnectionsStars } from '../../utils/starCalculations';
import { ArrowLeft, Plus, Star, Users, MapPin, Calendar, Clock, Check, Trash2, Edit3, ShieldCheck, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import LinkifiedText from '../common/LinkifiedText';

export default function Connections({ onBack }) {
  const { selectedMemberId, data, getMemberActivity, updateMemberActivity, currentUser, dateRange, canEditMember, canUserModifyPastDates, getMemberOverallStarsBreakdown } = useApp();

  // Enforce privacy: regular member always sees own activity
  const targetMemberId = (currentUser?.role === 'admin' || currentUser?.role === 'manager')
    ? selectedMemberId
    : currentUser?.id;

  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const activityData = getMemberActivity(targetMemberId);
  const connections = activityData.connections || [];
  const overallBreakdown = getMemberOverallStarsBreakdown(targetMemberId);

  const todayStr = formatDate(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayDate);

  const canModifyDates = canUserModifyPastDates(currentUser);
  const isTodayOnlyUser = !canModifyDates;
  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const isMember = currentUser?.role === 'member';
  const isAdminOrManager = isAdmin || isManager;
  const canEdit = canEditMember(targetMemberId);

  // 📅 Interactive Calendar & Date State
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'selectedDate' | 'history'

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConn, setEditingConn] = useState(null);

  // Form fields
  const [personName, setPersonName] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState(selectedDate);
  const [time, setTime] = useState('10:00 AM');
  const [remarks, setRemarks] = useState('');
  const [selections, setSelections] = useState([]);

  // Filter connections for current date range (Date Cycle)
  const filteredConnections = connections.filter(c => !c.date || (c.date >= dateRange.startDate && c.date <= dateRange.endDate));
  const cycleStars = calculateTotalConnectionsStars(filteredConnections);

  // Filter connections for the selected calendar date
  const selectedDateConnections = connections.filter(c => c.date === selectedDate);
  const selectedDateStars = calculateTotalConnectionsStars(selectedDateConnections);

  // History grouped by date
  const groupedByDate = {};
  connections.forEach(conn => {
    const d = conn.date || 'No Date';
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(conn);
  });
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return b.localeCompare(a);
  });

  const toggleSelection = (key) => {
    setSelections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSaveConnection = (e) => {
    e.preventDefault();
    if (!personName.trim()) return;

    // RULE: Users without past date permission can ONLY record inputs for Today (todayStr)
    const effectiveDate = isTodayOnlyUser ? todayStr : (date || selectedDate || todayStr);

    if (editingConn) {
      const updated = connections.map(c => c.id === editingConn.id ? {
        ...c,
        personName: personName.trim(),
        place: place.trim(),
        date: isTodayOnlyUser ? c.date : effectiveDate,
        time: time.trim(),
        remarks: remarks.trim(),
        selections,
      } : c);
      updateMemberActivity(targetMemberId, 'connections', updated);
    } else {
      const newConn = {
        id: 'conn-' + Date.now(),
        personName: personName.trim(),
        place: place.trim(),
        date: effectiveDate,
        time: time.trim(),
        remarks: remarks.trim(),
        selections,
      };
      updateMemberActivity(targetMemberId, 'connections', [newConn, ...connections]);
    }

    setPersonName('');
    setPlace('');
    setRemarks('');
    setSelections([]);
    setEditingConn(null);
    setShowAddModal(false);
  };

  const openAddModal = (presetDate = selectedDate) => {
    setEditingConn(null);
    setPersonName('');
    setPlace('');
    setDate(isTodayOnlyUser ? todayStr : presetDate);
    setTime('10:00 AM');
    setRemarks('');
    setSelections([]);
    setShowAddModal(true);
  };

  const openEdit = (conn) => {
    setEditingConn(conn);
    setPersonName(conn.personName);
    setPlace(conn.place || '');
    setDate(conn.date || selectedDate);
    setTime(conn.time || '10:00 AM');
    setRemarks(conn.remarks || '');
    setSelections(conn.selections || []);
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;
    updateMemberActivity(targetMemberId, 'connections', connections.filter(c => c.id !== id));
    if (editingConn?.id === id) {
      setShowAddModal(false);
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
        {/* Card 1: Selected Date */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 text-white p-4 text-center shadow-md border-2 border-indigo-400/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-indigo-200 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-300" />
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
            <span className="text-2xl sm:text-3xl font-black text-amber-300">{selectedDateStars}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-[10px] text-indigo-200 mt-0.5">
            {selectedDateConnections.length} connection{selectedDateConnections.length !== 1 ? 's' : ''} on {selectedDate}
          </p>
        </div>

        {/* Card 2: Date Cycle / Filtered Range */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-sky-600 text-white p-4 text-center shadow-lg border-2 border-amber-300/70 relative overflow-hidden cute-glow-border">
          <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Date Cycle (This Week)</span>
          </div>
          <div className="text-[11px] font-bold text-sky-100 mt-0.5">
            {dateRange.startDate} → {dateRange.endDate}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-amber-300">{cycleStars}</span>
            <Star className="w-6 h-6 fill-amber-400 text-amber-400 animate-pulse" />
          </div>
          <p className="text-[10px] text-purple-100 mt-0.5">
            {filteredConnections.length} active connection{filteredConnections.length !== 1 ? 's' : ''} in cycle
          </p>
        </div>

        {/* Card 3: All-Time Overall */}
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-600 to-sky-700 text-white p-4 text-center shadow-md border-2 border-blue-300/50 relative overflow-hidden">
          <div className="text-[10px] font-black text-blue-200 uppercase tracking-wider flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-300" />
            <span>Overall All-Time</span>
          </div>
          <div className="text-[11px] font-bold text-white/90 mt-0.5">From Start to Present</div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-300">{overallBreakdown.connections.stars}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-[10px] text-blue-100 mt-0.5">
            {overallBreakdown.connections.count} total connections recorded
          </p>
        </div>
      </div>

      {/* Rules Breakdown Pill */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-2.5 flex justify-around text-[11px] font-bold text-indigo-950">
        <div>Zion Visit: <span className="text-amber-700">10 ⭐</span></div>
        <div>FMS 1-9: <span className="text-amber-700">10 ⭐ / step</span></div>
        <div>Series 1-5: <span className="text-amber-700">10 ⭐ / 2 steps</span></div>
        <div>SOM 1-20: <span className="text-amber-700">10 ⭐ / 4 steps</span></div>
      </div>

      {/* 📅 Practice Calendar & Date Control Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-indigo-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Practice & Record Calendar</span>
              <span className="text-[11px] text-slate-500">Pick any date to view, record, or modify connections</span>
            </div>
          </div>

          {/* Quick Date Shortcuts & Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              🎯 Today
            </button>
            <button
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              ⏪ Yesterday
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-indigo-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            />
          </div>
        </div>

        {/* View Mode Tabs & Add Action */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All in Range ({filteredConnections.length})
            </button>
            <button
              onClick={() => setViewMode('selectedDate')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'selectedDate'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              On {selectedDate} ({selectedDateConnections.length})
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📜 History by Date ({sortedDates.length})
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => openAddModal(selectedDate)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add for {selectedDate}</span>
            </button>
          )}
        </div>
      </div>

      {/* Connections List (Filtered by Range or Selected Date) */}
      {(viewMode === 'all' || viewMode === 'selectedDate') && (
        <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-bold text-slate-700">
            {viewMode === 'all'
              ? `Active Connections in Date Cycle (${filteredConnections.length})`
              : `Connections Recorded on ${selectedDate} (${selectedDateConnections.length})`}
          </h3>
          <span className="text-[11px] text-slate-400">Click any card to edit or modify date</span>
        </div>

        {((viewMode === 'all' ? filteredConnections : selectedDateConnections).length === 0) ? (
          <div className="text-center py-10 bg-white rounded-3xl border-2 border-slate-200 p-6">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">
              {viewMode === 'all'
                ? 'No connections recorded in this date cycle.'
                : `No connections recorded on ${selectedDate}.`}
            </p>
            {canEdit && (
              <button
                onClick={() => openAddModal(selectedDate)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Connection on {selectedDate}</span>
              </button>
            )}
          </div>
        ) : (
          (viewMode === 'all' ? filteredConnections : selectedDateConnections).map((conn, idx) => {
            const connStars = calculateSingleConnectionStars(conn);
            return (
              <div
                key={conn.id}
                onClick={() => canEdit && openEdit(conn)}
                className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-indigo-100 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                        {conn.personName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        {conn.place && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-pink-500" />
                            {conn.place}
                          </span>
                        )}
                        {conn.date && (
                          <span className="flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                            <Calendar className="w-3 h-3 text-indigo-600" />
                            {conn.date} {conn.time && `• ${conn.time}`}
                          </span>
                        )}
                      </div>
                      {conn.remarks && (
                        <p className="text-xs text-slate-600 mt-1.5 italic">
                          "<LinkifiedText text={conn.remarks} />"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stars Badge & Action Buttons */}
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-2xl shadow-xs">
                      <span className="font-black text-amber-800 text-base sm:text-lg">
                        {connStars}
                      </span>
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(conn);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 p-1 cursor-pointer"
                          title="Edit / Modify Date"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(conn.id);
                          }}
                          className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Delete Connection"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected steps preview tags */}
                {conn.selections?.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {conn.selections.slice(0, 8).map(sel => (
                      <span key={sel} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                        ✓ {sel}
                      </span>
                    ))}
                    {conn.selections.length > 8 && (
                      <span className="text-[10px] font-semibold text-slate-400 px-1 py-0.5">
                        +{conn.selections.length - 8} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    )}

      {/* 📜 Connections History Grouped by Date (Only shown when History tab is clicked) */}
      {viewMode === 'history' && (
        <div id="connections-history-section" className="bg-white rounded-3xl border-2 border-indigo-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>📜 Connections History by Date</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log of connections with person name, place, date, time, and stars earned
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200">
            Total Active Days: {sortedDates.length}
          </span>
        </div>

        {sortedDates.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No connections history recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDates.map(dateKey => {
              const dateConns = groupedByDate[dateKey] || [];
              const dateStars = calculateTotalConnectionsStars(dateConns);

              return (
                <div key={dateKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  {/* Date Header with Stars Earned on that Date */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        📅 {dateKey}
                      </span>
                      {dateKey === todayStr && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                          Today
                        </span>
                      )}
                      {dateKey === yesterdayStr && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-full">
                          Yesterday
                        </span>
                      )}
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.2 rounded-full">
                        {dateConns.length} {dateConns.length === 1 ? 'person' : 'people'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-xl">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span className="text-xs font-black text-amber-800">+{dateStars} ⭐</span>
                    </div>
                  </div>

                  {/* List of Connections on this Date */}
                  <div className="space-y-2">
                    {dateConns.map(conn => {
                      const connStars = calculateSingleConnectionStars(conn);
                      return (
                        <div
                          key={conn.id}
                          onClick={() => canEdit && openEdit(conn)}
                          className="flex items-center justify-between p-3 rounded-xl bg-white hover:bg-indigo-50/70 border border-slate-200 cursor-pointer transition-all shadow-2xs"
                        >
                          <div>
                            <span className="font-bold text-xs text-slate-800">{conn.personName}</span>
                            <span className="text-[11px] text-slate-500 ml-2">
                              {conn.place && `📍 ${conn.place}`} {conn.time && `• ⏰ ${conn.time}`}
                            </span>
                            {conn.selections?.length > 0 && (
                              <div className="text-[10px] text-indigo-600 mt-0.5 flex flex-wrap gap-1">
                                {conn.selections.map(s => (
                                  <span key={s} className="px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-100">
                                    ✓ {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              {connStars} ⭐
                            </span>
                            {canEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(conn);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 p-1 text-xs font-bold flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Date</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* Modal: Add / Edit Connection with Full Date & Time Modify */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border-2 border-indigo-300 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center justify-between">
              <span>{editingConn ? '✏️ Edit Connection & Date' : '✨ Add New Connection'}</span>
              <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-xl">
                Earned: {calculateSingleConnectionStars({ selections })} ⭐
              </span>
            </h3>

            <form onSubmit={handleSaveConnection} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Person Name *</label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. Ramu / Suresh"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Place / Area</label>
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Zion Church Road"
                    className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              {/* 📅 Date & Time Modify Controls (Open to Everyone Who Can Edit) */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Modify Date & Time</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      Date {isTodayOnlyUser && <span className="text-[10px] text-indigo-600 font-bold">(Locked to Today)</span>}
                    </label>
                    <input
                      type="date"
                      required
                      disabled={isTodayOnlyUser}
                      value={isTodayOnlyUser ? todayStr : date}
                      onChange={(e) => setDate(e.target.value)}
                      className={`w-full mt-1 px-3 py-2 text-xs border border-indigo-300 rounded-xl font-bold ${
                        isTodayOnlyUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-indigo-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Time</label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="10:00 AM"
                      className="w-full mt-1 px-3 py-2 text-xs border border-indigo-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
                {/* Shortcut Pills for Date Modal */}
                {canModifyDates && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDate(todayStr)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                      Set to Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setDate(yesterdayStr)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                      Set to Yesterday
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Remarks / Notes</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Notes about meeting..."
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              {/* Selection Boxes Section matching Pages 20-24 */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">
                  Select Completed Steps:
                </span>

                {/* 1. Zion Visit */}
                <div className="p-2.5 bg-amber-50/50 rounded-2xl border border-amber-200">
                  <button
                    type="button"
                    onClick={() => toggleSelection('ZION_VISIT')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                      selections.includes('ZION_VISIT')
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>🏛️ Zion Visit</span>
                    <span>10 ⭐</span>
                  </button>
                </div>

                {/* 2. FMS-1 to FMS-9 */}
                <div className="p-2.5 bg-sky-50/50 rounded-2xl border border-sky-200">
                  <div className="text-[11px] font-bold text-sky-800 mb-1.5 flex justify-between">
                    <span>FMS-1 to FMS-9</span>
                    <span>10 ⭐ per step</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                      const key = `FMS-${num}`;
                      const isSel = selections.includes(key);
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => toggleSelection(key)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                            isSel ? 'bg-sky-500 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Series 1 to 5 (1-1 to 5-10) */}
                <div className="p-2.5 bg-purple-50/50 rounded-2xl border border-purple-200">
                  <div className="text-[11px] font-bold text-purple-800 mb-1.5 flex justify-between">
                    <span>Series 1-1 to 5-10</span>
                    <span>10 ⭐ for every 2 steps</span>
                  </div>
                  {[1, 2, 3, 4, 5].map(series => (
                    <div key={series} className="mb-2 last:mb-0">
                      <span className="text-[10px] font-bold text-purple-700 block mb-1">
                        Series {series} ({series}-1 to {series}-10):
                      </span>
                      <div className="grid grid-cols-5 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(step => {
                          const key = `${series}-${step}`;
                          const isSel = selections.includes(key);
                          return (
                            <button
                              type="button"
                              key={key}
                              onClick={() => toggleSelection(key)}
                              className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                                isSel ? 'bg-purple-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              {key}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 4. SOM-1 to SOM-20 */}
                <div className="p-2.5 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                  <div className="text-[11px] font-bold text-emerald-800 mb-1.5 flex justify-between">
                    <span>SOM-1 to SOM-20</span>
                    <span>10 ⭐ for every 4 steps</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => {
                      const key = `SOM-${num}`;
                      const isSel = selections.includes(key);
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => toggleSelection(key)}
                          className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
                            isSel ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          SOM-{num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {editingConn && (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingConn.id)}
                    className="py-2 px-3 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-xl"
                  >
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
