import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import { calculateSingleFruitStars, calculateTotalFruitsStars, extractDateFromTimestamp } from '../../utils/starCalculations';
import { ArrowLeft, Plus, Star, CheckSquare, Square, Trash2, Clock, Calendar, Edit3, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Fruits({ onBack }) {
  const { selectedMemberId, data, getMemberActivity, updateMemberActivity, currentUser, dateRange, canEditMember, canUserModifyPastDates, getMemberOverallStarsBreakdown } = useApp();

  // Enforce privacy: regular member always sees own activity
  const targetMemberId = (currentUser?.role === 'admin' || currentUser?.role === 'manager')
    ? selectedMemberId
    : currentUser?.id;

  const selectedMember = data.users.find(u => u.id === targetMemberId) || currentUser;
  const activityData = getMemberActivity(targetMemberId);
  const fruitsList = activityData.fruits || [];
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
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonDate, setNewPersonDate] = useState(selectedDate);

  // Modify Date & Time Modal
  const [editingStamp, setEditingStamp] = useState(null); // { fruitId, key, label, currentStamp }
  const [stampDate, setStampDate] = useState(selectedDate);
  const [stampTime, setStampTime] = useState('10:00 AM');

  // Edit Person Name & Date Modal
  const [editingPerson, setEditingPerson] = useState(null); // { id, personName, date }
  const [editPersonName, setEditPersonName] = useState('');
  const [editPersonDate, setEditPersonDate] = useState(selectedDate);

  const checklistItems = [
    { key: 'newLife', label: 'New Life', stars: 50 },
    { key: 'attend1', label: '1 Attend', stars: 10 },
    { key: 'attend4', label: '4 Attend', stars: 10 },
    { key: 'tithe', label: 'Tithe', stars: 10 },
    { key: 'nmsStep1', label: 'NMS (Step-1)', stars: 10 },
    { key: 'eduAttend', label: 'Education Attend', stars: 10 },
  ];

  // 1. Filter fruits in current Date Cycle
  const filteredFruits = fruitsList.filter(f => !f.date || (f.date >= dateRange.startDate && f.date <= dateRange.endDate));
  const cycleStars = calculateTotalFruitsStars(filteredFruits);

  // 2. Calculate milestones & stars for the selected calendar date
  let selectedDateStars = 0;
  const selectedDateMilestones = [];
  fruitsList.forEach(fruit => {
    checklistItems.forEach(item => {
      if (fruit.checks?.[item.key]) {
        const stamp = fruit.timestamps?.[item.key] || '';
        const d = extractDateFromTimestamp(stamp) || fruit.date;
        if (d === selectedDate) {
          selectedDateStars += item.stars;
          selectedDateMilestones.push({
            fruitId: fruit.id,
            personName: fruit.personName,
            key: item.key,
            label: item.label,
            stars: item.stars,
            stamp: stamp || d,
          });
        }
      }
    });
  });

  // 3. History grouped by completion date
  const milestonesByDate = {};
  fruitsList.forEach(fruit => {
    checklistItems.forEach(item => {
      if (fruit.checks?.[item.key]) {
        const stamp = fruit.timestamps?.[item.key] || '';
        const d = extractDateFromTimestamp(stamp) || fruit.date || 'No Date';
        if (!milestonesByDate[d]) milestonesByDate[d] = [];
        milestonesByDate[d].push({
          fruitId: fruit.id,
          personName: fruit.personName,
          key: item.key,
          label: item.label,
          stars: item.stars,
          stamp: stamp || d,
        });
      }
    });
  });
  const sortedDates = Object.keys(milestonesByDate).sort((a, b) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return b.localeCompare(a);
  });

  const handleAddPerson = (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    // RULE: Users without past date permission can ONLY record inputs for Today (todayStr)
    const effectiveDate = isTodayOnlyUser ? todayStr : (newPersonDate || selectedDate || todayStr);

    const newFruit = {
      id: 'fruit-' + Date.now(),
      personName: newPersonName.trim(),
      date: effectiveDate,
      checks: {
        newLife: false,
        attend1: false,
        attend4: false,
        tithe: false,
        nmsStep1: false,
        eduAttend: false,
      },
      timestamps: {},
    };

    updateMemberActivity(targetMemberId, 'fruits', [newFruit, ...fruitsList]);
    setNewPersonName('');
    setShowAddModal(false);
  };

  const handleToggleCheck = (fruitId, key) => {
    if (!canEdit) return;

    // RULE: Users without past date permission can ONLY record inputs for Today (todayStr)
    const targetDate = isTodayOnlyUser ? todayStr : selectedDate;

    const updated = fruitsList.map(item => {
      if (item.id === fruitId) {
        const currentVal = !!item.checks?.[key];
        const nextVal = !currentVal;
        const newChecks = { ...(item.checks || {}), [key]: nextVal };
        const newTimestamps = { ...(item.timestamps || {}) };

        if (nextVal) {
          // Stamped with targetDate (Today for members) and current time
          const now = new Date();
          const timePart = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          newTimestamps[key] = `${targetDate} • ${timePart}`;
        } else {
          delete newTimestamps[key];
        }

        return { ...item, checks: newChecks, timestamps: newTimestamps };
      }
      return item;
    });

    updateMemberActivity(targetMemberId, 'fruits', updated);
  };

  const openEditStamp = (fruit, item) => {
    if (!canModifyDates) return;
    const currentStamp = fruit.timestamps?.[item.key] || '';
    const extractedDate = extractDateFromTimestamp(currentStamp) || fruit.date || selectedDate;
    let extractedTime = '10:00 AM';
    if (currentStamp.includes('•')) {
      extractedTime = currentStamp.split('•')[1].trim();
    }
    setEditingStamp({
      fruitId: fruit.id,
      fruitName: fruit.personName,
      key: item.key,
      label: item.label,
      currentStamp,
    });
    setStampDate(extractedDate);
    setStampTime(extractedTime);
  };

  const handleSaveStamp = (e) => {
    e.preventDefault();
    if (!canModifyDates) return;
    if (!editingStamp || !stampDate) return;

    const newStamp = `${stampDate} • ${stampTime.trim() || '10:00 AM'}`;
    const updated = fruitsList.map(item => {
      if (item.id === editingStamp.fruitId) {
        return {
          ...item,
          checks: {
            ...(item.checks || {}),
            [editingStamp.key]: true,
          },
          timestamps: {
            ...(item.timestamps || {}),
            [editingStamp.key]: newStamp,
          },
        };
      }
      return item;
    });

    updateMemberActivity(targetMemberId, 'fruits', updated);
    setEditingStamp(null);
  };

  const handleUncheckFromModal = () => {
    if (!editingStamp) return;
    const updated = fruitsList.map(item => {
      if (item.id === editingStamp.fruitId) {
        const newChecks = { ...(item.checks || {}) };
        delete newChecks[editingStamp.key];
        const newTimestamps = { ...(item.timestamps || {}) };
        delete newTimestamps[editingStamp.key];
        return { ...item, checks: newChecks, timestamps: newTimestamps };
      }
      return item;
    });
    updateMemberActivity(targetMemberId, 'fruits', updated);
    setEditingStamp(null);
  };

  const openEditPerson = (fruit) => {
    setEditingPerson(fruit);
    setEditPersonName(fruit.personName);
    setEditPersonDate(fruit.date || selectedDate);
  };

  const handleSavePersonEdit = (e) => {
    e.preventDefault();
    if (!editingPerson || !editPersonName.trim()) return;

    const updated = fruitsList.map(f => {
      if (f.id === editingPerson.id) {
        return {
          ...f,
          personName: editPersonName.trim(),
          date: editPersonDate || f.date,
        };
      }
      return f;
    });

    updateMemberActivity(targetMemberId, 'fruits', updated);
    setEditingPerson(null);
  };

  const handleDelete = (fruitId) => {
    if (!confirm('Are you sure you want to delete this fruit record?')) return;
    updateMemberActivity(targetMemberId, 'fruits', fruitsList.filter(f => f.id !== fruitId));
    if (editingPerson?.id === fruitId) setEditingPerson(null);
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
        <div className="rounded-3xl bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 text-white p-4 text-center shadow-md border-2 border-purple-400/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-purple-200 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-300" />
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
          <p className="text-[10px] text-purple-200 mt-0.5">
            {selectedDateMilestones.length} milestone{selectedDateMilestones.length !== 1 ? 's' : ''} on {selectedDate}
          </p>
        </div>

        {/* Card 2: Date Cycle / Filtered Range */}
        <div className="rounded-3xl bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 text-white p-4 text-center shadow-lg border-2 border-amber-300/70 relative overflow-hidden cute-glow-border">
          <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Date Cycle (This Week)</span>
          </div>
          <div className="text-[11px] font-bold text-purple-100 mt-0.5">
            {dateRange.startDate} → {dateRange.endDate}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-amber-300">{cycleStars}</span>
            <Star className="w-6 h-6 fill-amber-400 text-amber-400 animate-pulse" />
          </div>
          <p className="text-[10px] text-purple-100 mt-0.5">
            {filteredFruits.length} fruit record{filteredFruits.length !== 1 ? 's' : ''} in cycle
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
            <span className="text-2xl sm:text-3xl font-black text-amber-300">{overallBreakdown.fruits.stars}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <p className="text-[10px] text-blue-100 mt-0.5">
            {overallBreakdown.fruits.count} total fruits recorded
          </p>
        </div>
      </div>

      {/* Rules Pill */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-2.5 flex justify-around text-[11px] font-bold text-purple-950">
        <div>New Life: <span className="text-amber-700">50 ⭐</span></div>
        <div>1 Attend: <span className="text-amber-700">10 ⭐</span></div>
        <div>4 Attend: <span className="text-amber-700">10 ⭐</span></div>
        <div>Tithe: <span className="text-amber-700">10 ⭐</span></div>
        <div>NMS (Step-1): <span className="text-amber-700">10 ⭐</span></div>
        <div>Education Attend: <span className="text-amber-700">10 ⭐</span></div>
      </div>

      {/* 📅 Practice Calendar & Date Control Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-purple-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 block">Practice & Record Calendar</span>
              <span className="text-[11px] text-slate-500">Pick any date to view, record, or modify completion dates</span>
            </div>
          </div>

          {/* Quick Date Shortcuts & Picker */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              🎯 Today
            </button>
            <button
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              ⏪ Yesterday
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-purple-300 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-purple-400 cursor-pointer"
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
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Fruits ({filteredFruits.length})
            </button>
            <button
              onClick={() => setViewMode('selectedDate')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'selectedDate'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Milestones on {selectedDate} ({selectedDateMilestones.length})
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📜 History by Date ({sortedDates.length})
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => {
                setNewPersonDate(selectedDate);
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Fruit Person</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: All Fruit Cards in Date Cycle */}
      {viewMode === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs sm:text-sm font-bold text-slate-700">
              Active Fruit Records ({filteredFruits.length})
            </h3>
            <span className="text-[11px] text-slate-400">Click checkboxes or Edit Date to modify timestamps</span>
          </div>

          {filteredFruits.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border-2 border-slate-200 p-6">
              <span className="text-3xl animate-cute-wiggle inline-block">🍇</span>
              <p className="text-xs text-slate-500 font-semibold mt-2">No fruits recorded yet in this date range.</p>
              {canEdit && (
                <button
                  onClick={() => {
                    setNewPersonDate(selectedDate);
                    setShowAddModal(true);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Fruit Person for {selectedDate}</span>
                </button>
              )}
            </div>
          ) : (
            filteredFruits.map(fruit => {
              const fruitStars = calculateSingleFruitStars(fruit);
              return (
                <div
                  key={fruit.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-purple-200 shadow-xs hover:border-purple-300 transition-all duration-200"
                >
                  {/* Person Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                        🍇
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-800">
                          {fruit.personName}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>Added: <strong>{fruit.date}</strong></span>
                          {canModifyDates && (
                            <button
                              onClick={() => openEditPerson(fruit)}
                              className="text-purple-600 hover:text-purple-800 font-bold underline cursor-pointer"
                              title="Edit Info/Date (Authorized Users Only)"
                            >
                              Edit Info/Date
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-300 px-3 py-1 rounded-2xl shadow-xs">
                        <span className="font-black text-amber-800 text-sm sm:text-base">
                          {fruitStars}
                        </span>
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleDelete(fruit.id)}
                          className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Delete Fruit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Checklist with Timestamp and Modify Date Option */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                    {checklistItems.map(item => {
                      const isChecked = !!fruit.checks?.[item.key];
                      const stamp = fruit.timestamps?.[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleToggleCheck(fruit.id, item.key)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isChecked
                              ? 'bg-purple-50/70 border-purple-300 shadow-2xs'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className={`text-xs font-bold ${isChecked ? 'text-purple-900' : 'text-slate-700'}`}>
                                {item.label}
                              </span>
                            </div>
                            <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              {item.stars} ⭐
                            </span>
                          </div>

                          {/* Date & Time stamp underneath with Edit Date button */}
                          {isChecked && stamp && (
                            <div className="mt-2 pt-1 border-t border-purple-100/80 flex items-center justify-between text-[10px] text-purple-700 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{stamp}</span>
                              </span>
                              {canModifyDates && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditStamp(fruit, item);
                                  }}
                                  className="text-purple-700 hover:text-purple-950 font-bold ml-2 underline cursor-pointer"
                                  title="Modify Completion Date & Time (Authorized Users Only)"
                                >
                                  ✏️ Edit Date
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: Milestones on Selected Date */}
      {viewMode === 'selectedDate' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs sm:text-sm font-bold text-slate-700">
              Milestones Completed on {selectedDate} ({selectedDateMilestones.length})
            </h3>
            <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              +{selectedDateStars} ⭐ Earned!
            </span>
          </div>

          {selectedDateMilestones.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border-2 border-slate-200 p-6">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-semibold">No fruit milestones stamped on {selectedDate}.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDateMilestones.map((m, idx) => {
                const targetFruit = fruitsList.find(f => f.id === m.fruitId);
                const targetItem = checklistItems.find(it => it.key === m.key);
                return (
                  <div
                    key={`${m.fruitId}-${m.key}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-purple-100 shadow-2xs hover:border-purple-300 transition-all"
                  >
                    <div>
                      <span className="font-extrabold text-xs text-slate-800">🍇 {m.personName}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                          ✓ {m.label}
                        </span>
                        <span className="text-[10px] text-slate-400">⏰ {m.stamp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                        +{m.stars} ⭐
                      </span>
                      {canEdit && targetFruit && targetItem && (
                        <button
                          onClick={() => openEditStamp(targetFruit, targetItem)}
                          className="text-purple-600 hover:text-purple-800 text-xs font-bold underline cursor-pointer"
                        >
                          Edit Date
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 📜 Fruits Milestones History Grouped by Date (Only shown when History tab is clicked) */}
      {viewMode === 'history' && (
        <div id="fruits-history-section" className="bg-white rounded-3xl border-2 border-purple-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 pb-3">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>📜 Fruits Milestones History by Date</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Chronological log of every milestone achieved across all fruit records
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-200">
            Total Active Days: {sortedDates.length}
          </span>
        </div>

        {sortedDates.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold">No milestones recorded yet. Check milestones above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDates.map(dateKey => {
              const dateMilestones = milestonesByDate[dateKey] || [];
              const dateStars = dateMilestones.reduce((acc, curr) => acc + curr.stars, 0);

              return (
                <div key={dateKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
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
                      <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.2 rounded-full">
                        {dateMilestones.length} milestone{dateMilestones.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-xl">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span className="text-xs font-black text-amber-800">+{dateStars} ⭐</span>
                    </div>
                  </div>

                  {/* List of Milestones on this Date */}
                  <div className="space-y-2">
                    {dateMilestones.map((m, idx) => {
                      const targetFruit = fruitsList.find(f => f.id === m.fruitId);
                      const targetItem = checklistItems.find(it => it.key === m.key);
                      return (
                        <div
                          key={`${dateKey}-${m.fruitId}-${m.key}-${idx}`}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-purple-50/60 border border-slate-200 transition-all shadow-2xs"
                        >
                          <div>
                            <span className="font-bold text-xs text-slate-800">🍇 {m.personName}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                                ✓ {m.label}
                              </span>
                              <span className="text-[10px] text-slate-400">⏰ {m.stamp}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              +{m.stars} ⭐
                            </span>
                            {canModifyDates && targetFruit && targetItem && (
                              <button
                                onClick={() => openEditStamp(targetFruit, targetItem)}
                                className="text-purple-600 hover:text-purple-800 text-xs font-bold underline cursor-pointer"
                                title="Edit Date (Authorized Users Only)"
                              >
                                Edit Date
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

      {/* Modal: Add Fruit Person */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-purple-300">
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span>🍇 Add Fruit Person</span>
            </h3>
            <form onSubmit={handleAddPerson} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Person Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="e.g. Brother Thomas"
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Record Date {isTodayOnlyUser && <span className="text-[10px] text-purple-700 font-bold">(Locked to Today)</span>}
                </label>
                <input
                  type="date"
                  required
                  disabled={isTodayOnlyUser}
                  value={isTodayOnlyUser ? todayStr : newPersonDate}
                  onChange={(e) => setNewPersonDate(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 text-xs border border-purple-300 rounded-xl font-bold ${
                    isTodayOnlyUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white focus:ring-2 focus:ring-purple-400'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-xs cursor-pointer"
                >
                  Add Person
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Modify Date & Timestamp for Milestone */}
      {editingStamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl border-2 border-purple-300 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Modify Milestone Date</span>
              </h3>
            </div>

            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-xs">
              <div className="font-bold text-purple-950">🍇 {editingStamp.fruitName}</div>
              <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
                Step: <strong>{editingStamp.label}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveStamp} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600">Completion Date</label>
                <input
                  type="date"
                  required
                  value={stampDate}
                  onChange={(e) => setStampDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-purple-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">Completion Time</label>
                <input
                  type="text"
                  value={stampTime}
                  onChange={(e) => setStampTime(e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full mt-1 px-3 py-2 text-xs border border-purple-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStampDate(todayStr)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
                >
                  Set to Today
                </button>
                <button
                  type="button"
                  onClick={() => setStampDate(yesterdayStr)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
                >
                  Set to Yesterday
                </button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUncheckFromModal}
                  className="py-2 px-3 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-xl"
                  title="Uncheck this milestone"
                >
                  Uncheck
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStamp(null)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-xs"
                >
                  Save Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Person Info */}
      {editingPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-purple-300">
            <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-purple-600" />
              <span>Edit Fruit Person & Date</span>
            </h3>

            <form onSubmit={handleSavePersonEdit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Person Name</label>
                <input
                  type="text"
                  required
                  value={editPersonName}
                  onChange={(e) => setEditPersonName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-400 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Added Date</label>
                <input
                  type="date"
                  required
                  value={editPersonDate}
                  onChange={(e) => setEditPersonDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-purple-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPerson(null)}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
