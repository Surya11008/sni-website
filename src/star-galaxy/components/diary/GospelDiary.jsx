import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDate } from '../../utils/dateUtils';
import {
  BookOpen,
  Calendar,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Smile,
  Check,
  Clock,
  Heart,
  Flame,
  Search,
  ArrowLeft,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import MultiMediaUploader from '../common/MultiMediaUploader';
import MultiMediaDisplay from '../common/MultiMediaDisplay';
import LinkifiedText from '../common/LinkifiedText';

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Joyful' },
  { emoji: '🙏', label: 'Thankful' },
  { emoji: '🔥', label: 'Passionate' },
  { emoji: '🌟', label: 'Inspired' },
  { emoji: '🕊️', label: 'Peace' },
  { emoji: '💪', label: 'Strong' },
  { emoji: '❤️', label: 'Loving' },
  { emoji: '💧', label: 'Touched' },
];

export default function GospelDiary({ onBack }) {
  const { currentUser, data, saveGospelDiaryEntry, deleteGospelDiaryEntry, canUserModifyPastDates } = useApp();

  const todayStr = formatDate(new Date());
  const canModifyDates = canUserModifyPastDates(currentUser);
  const isTodayOnlyUser = !canModifyDates;
  const isMember = currentUser?.role === 'member';
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Diary Form state
  const [entryDate, setEntryDate] = useState(todayStr);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryWriting, setEntryWriting] = useState('');
  const [selectedMood, setSelectedMood] = useState('😊');
  const [entryMediaItems, setEntryMediaItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saveToast, setSaveToast] = useState('');

  // Calendar View state: 'month' | 'week' | 'year'
  const [calendarView, setCalendarView] = useState('month');
  const [activeDate, setActiveDate] = useState(new Date()); // Controls calendar page
  const [filterDate, setFilterDate] = useState(null); // Optional date filter clicked on calendar

  // Get user's diary entries - strictly private to currentUser only
  const userEntries = useMemo(() => {
    if (!currentUser?.id) return [];
    const entries = data.gospelDiary?.[currentUser.id] || [];
    // Strict isolation: only entries belonging to currentUser
    return entries.filter(e => !e.userId || e.userId === currentUser.id);
  }, [data.gospelDiary, currentUser?.id]);

  // Map of dates with entries -> set of 'YYYY-MM-DD'
  const datesWithEntries = useMemo(() => {
    const map = new Map();
    userEntries.forEach(entry => {
      if (entry.date) {
        if (!map.has(entry.date)) map.set(entry.date, []);
        map.get(entry.date).push(entry);
      }
    });
    return map;
  }, [userEntries]);

  // Handle Form Submit
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!entryTitle.trim() && !entryWriting.trim() && entryMediaItems.length === 0) return;

    const entry = {
      id: editingId || ('diary-' + Date.now()),
      userId: currentUser?.id,
      authorName: currentUser?.name,
      date: isTodayOnlyUser ? todayStr : (entryDate || todayStr),
      title: entryTitle.trim() || 'Daily Reflection',
      writing: entryWriting.trim(),
      mood: selectedMood,
      mediaItems: entryMediaItems,
      createdAt: new Date().toISOString(),
    };

    await saveGospelDiaryEntry(entry);
    setSaveToast(editingId ? 'Diary note updated!' : 'Diary note saved with checkmark ✓');
    setEditingId(null);
    setEntryTitle('');
    setEntryWriting('');
    setSelectedMood('😊');
    setEntryMediaItems([]);

    setTimeout(() => setSaveToast(''), 3000);
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setEntryDate(entry.date || todayStr);
    setEntryTitle(entry.title || '');
    setEntryWriting(entry.writing || '');
    setSelectedMood(entry.mood || '😊');
    setEntryMediaItems(
      entry.mediaItems && entry.mediaItems.length > 0
        ? entry.mediaItems
        : (entry.mediaUrl ? [{ url: entry.mediaUrl, type: entry.mediaType || 'image' }] : [])
    );
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this diary entry?')) {
      deleteGospelDiaryEntry(id);
      if (editingId === id) {
        setEditingId(null);
        setEntryTitle('');
        setEntryWriting('');
        setEntryMediaItems([]);
      }
    }
  };

  // Calendar navigation
  const prevPeriod = () => {
    const d = new Date(activeDate);
    if (calendarView === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (calendarView === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (calendarView === 'year') {
      d.setFullYear(d.getFullYear() - 1);
    }
    setActiveDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(activeDate);
    if (calendarView === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (calendarView === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (calendarView === 'year') {
      d.setFullYear(d.getFullYear() + 1);
    }
    setActiveDate(d);
  };

  const jumpToToday = () => {
    setActiveDate(new Date());
    setEntryDate(todayStr);
    setFilterDate(null);
  };

  // Filtered entries to display in Notes section
  const displayedEntries = useMemo(() => {
    if (filterDate) {
      return userEntries.filter(e => e.date === filterDate);
    }
    return userEntries;
  }, [userEntries, filterDate]);

  // ================= CALENDAR BUILDERS =================
  // 1. Month View Days
  const monthDays = useMemo(() => {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Leading empty slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        dateStr: dStr,
        hasEntry: datesWithEntries.has(dStr),
        isToday: dStr === todayStr,
      });
    }
    return days;
  }, [activeDate, datesWithEntries, todayStr]);

  // 2. Week View Days (7 days around activeDate)
  const weekDays = useMemo(() => {
    const curr = new Date(activeDate);
    const dayOfWeek = curr.getDay(); // 0 is Sun
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dStr = formatDate(d);
      days.push({
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        dayNum: d.getDate(),
        dateStr: dStr,
        hasEntry: datesWithEntries.has(dStr),
        isToday: dStr === todayStr,
      });
    }
    return days;
  }, [activeDate, datesWithEntries, todayStr]);

  // 3. Year View Months (12 months of activeDate year)
  const yearMonths = useMemo(() => {
    const year = activeDate.getFullYear();
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let m = 0; m < 12; m++) {
      const daysInM = new Date(year, m + 1, 0).getDate();
      let entriesCount = 0;
      for (let d = 1; d <= daysInM; d++) {
        const dStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        if (datesWithEntries.has(dStr)) entriesCount++;
      }
      months.push({
        monthIndex: m,
        name: monthNames[m],
        entriesCount,
        hasEntries: entriesCount > 0,
      });
    }
    return months;
  }, [activeDate, datesWithEntries]);

  return (
    <div className="space-y-6">
      {/* Navigation Back button if onBack is provided */}
      {onBack && (
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-black transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-amber-600" />
            <span>← Back to More</span>
          </button>
        </div>
      )}

      {/* 📖 Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30">
            📖
          </div>
          <div>
            <h3 className="font-black text-base sm:text-xl tracking-tight">
              Gospel Diary
            </h3>
            <p className="text-xs text-amber-100 mt-0.5">
              Record daily preaching reflections, testimonies, mood & track connected calendar
            </p>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/30 text-center">
          <span className="text-[10px] uppercase font-bold text-amber-100 block">Total Notes</span>
          <span className="text-base sm:text-lg font-black text-white">{userEntries.length}</span>
        </div>
      </div>

      {/* 🔒 100% Personal & Private Shield Guarantee */}
      <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs text-emerald-950">
                100% Personal & Confidential
              </span>
              <span className="bg-emerald-200/70 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-full">
                Your Eyes Only
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Entries are strictly isolated to <strong className="text-emerald-950">{currentUser?.name}</strong>. Neither Admin, Managers, nor other members can view your diary notes.
            </p>
          </div>
        </div>
        <div className="text-[11px] font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs shrink-0 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>User Isolation Active</span>
        </div>
      </div>

      {/* 📝 Diary Input Form (Today Date, Title, Writing, Mood/Feel Emoji) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-600" />
            <h4 className="font-black text-xs sm:text-sm text-slate-800">
              {editingId ? 'Edit Diary Note' : 'New Diary Note'}
            </h4>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setEntryTitle('');
                setEntryWriting('');
                setEntryMediaItems([]);
              }}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {saveToast && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-300 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}

        <form onSubmit={handleSaveEntry} className="space-y-4">
          {/* Row 1: Date & Mood Emoji Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Date * {isTodayOnlyUser && <span className="text-[10px] text-amber-700 font-bold">(Locked to Today)</span>}
              </label>
              <input
                type="date"
                required
                disabled={isTodayOnlyUser}
                value={isTodayOnlyUser ? todayStr : entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className={`w-full px-3.5 py-2 text-xs font-bold border border-slate-200 rounded-xl ${
                  isTodayOnlyUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-amber-400'
                }`}
              />
            </div>

            <div className="sm:col-span-8">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mood / Feeling Emoji *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_OPTIONS.map(m => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setSelectedMood(m.emoji)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                      selectedMood === m.emoji
                        ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{m.emoji}</span>
                    <span className="text-[10px] hidden sm:inline">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
              placeholder="e.g. Joyful preaching fellowship at community hall..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Row 3: Writing / Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Writing / Reflection Notes *
            </label>
            <textarea
              required
              rows={4}
              value={entryWriting}
              onChange={(e) => setEntryWriting(e.target.value)}
              placeholder="Write your gospel experiences, preaching lessons, grace received, prayer requests..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 leading-relaxed font-sans"
            />
          </div>

          {/* Optional Attachments: Audios, Voice Notes, Photos, Videos, Documents */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Attachments (Audio Voice Notes, Photos, Videos, Documents) - Optional
            </label>
            <MultiMediaUploader
              mediaItems={entryMediaItems}
              setMediaItems={setEntryMediaItems}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingId ? 'Update Diary Note ✓' : 'Save to Gospel Diary ✓'}</span>
          </button>
        </form>
      </div>

      {/* 📅 Connected Calendar Section (Week, Month, Year View + Check Marks) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        {/* Calendar Top Header: Navigation & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                Connected Calendar
              </h4>
              <p className="text-[10px] text-slate-500">
                Daily input entered shows a Check Mark (✓)
              </p>
            </div>
          </div>

          {/* View Switcher: Week / Month / Year */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {[
              { key: 'week', label: 'Week' },
              { key: 'month', label: 'Month' },
              { key: 'year', label: 'Year' },
            ].map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => setCalendarView(v.key)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  calendarView === v.key
                    ? 'bg-white text-orange-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period Navigation Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevPeriod}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-black text-xs sm:text-sm text-slate-800">
              {calendarView === 'week' && `Week of ${formatDate(activeDate)}`}
              {calendarView === 'month' && activeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {calendarView === 'year' && `${activeDate.getFullYear()}`}
            </span>
            <button
              type="button"
              onClick={nextPeriod}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {filterDate && (
              <button
                type="button"
                onClick={() => setFilterDate(null)}
                className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100"
              >
                Clear Date Filter ({filterDate}) ✕
              </button>
            )}
            <button
              type="button"
              onClick={jumpToToday}
              className="text-xs font-bold text-slate-600 hover:text-orange-600 bg-slate-100 px-3 py-1 rounded-lg"
            >
              Today
            </button>
          </div>
        </div>

        {/* 1. MONTH VIEW */}
        {calendarView === 'month' && (
          <div>
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 uppercase py-1 border-b border-slate-100">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {monthDays.map((item, idx) => {
                if (!item) {
                  return <div key={`empty-${idx}`} className="h-12 sm:h-14 rounded-xl bg-slate-50/40" />;
                }
                const isSelected = filterDate === item.dateStr;
                return (
                  <div
                    key={item.dateStr}
                    onClick={() => {
                      setFilterDate(item.dateStr);
                      if (canModifyDates) setEntryDate(item.dateStr);
                    }}
                    className={`h-12 sm:h-14 rounded-2xl p-1 sm:p-1.5 flex flex-col justify-between cursor-pointer border transition-all ${
                      isSelected
                        ? 'bg-amber-100 border-amber-500 shadow-sm ring-2 ring-amber-300'
                        : item.hasEntry
                        ? 'bg-emerald-50/90 border-emerald-300 hover:bg-emerald-100'
                        : item.isToday
                        ? 'bg-sky-50 border-sky-300 font-bold'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-bold ${item.isToday ? 'text-sky-700 font-black' : 'text-slate-700'}`}>
                        {item.dayNum}
                      </span>
                      {item.isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" title="Today" />
                      )}
                    </div>

                    {/* ✅ Check Mark if entry exists on this day! */}
                    {item.hasEntry && (
                      <div className="flex items-center justify-center gap-0.5 text-emerald-700 font-black text-xs sm:text-sm">
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                        <span className="text-[10px] hidden sm:inline">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. WEEK VIEW */}
        {calendarView === 'week' && (
          <div className="grid grid-cols-7 gap-2 pt-2">
            {weekDays.map(item => {
              const isSelected = filterDate === item.dateStr;
              return (
                <div
                  key={item.dateStr}
                  onClick={() => {
                    setFilterDate(item.dateStr);
                    if (canModifyDates) setEntryDate(item.dateStr);
                  }}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-between gap-2 cursor-pointer border transition-all text-center ${
                    isSelected
                      ? 'bg-amber-100 border-amber-500 shadow-sm ring-2 ring-amber-300'
                      : item.hasEntry
                      ? 'bg-emerald-50 border-emerald-300'
                      : item.isToday
                      ? 'bg-sky-50 border-sky-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{item.dayName}</span>
                  <span className="text-sm font-black text-slate-800">{item.dayNum}</span>

                  {item.hasEntry ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-2xs">
                      ✓
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-300 flex items-center justify-center text-xs">
                      -
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 3. YEAR VIEW */}
        {calendarView === 'year' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-2">
            {yearMonths.map(m => (
              <div
                key={m.name}
                onClick={() => {
                  const d = new Date(activeDate);
                  d.setMonth(m.monthIndex);
                  setActiveDate(d);
                  setCalendarView('month');
                }}
                className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                  m.hasEntries
                    ? 'bg-emerald-50/80 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <h5 className="font-black text-xs sm:text-sm text-slate-800">{m.name}</h5>
                <div className="mt-1 flex items-center justify-center gap-1">
                  {m.hasEntries ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{m.entriesCount} entries</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">No notes</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📜 Saved Diary Notes Cards ("notes la chupinchali") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>
              {filterDate ? `Diary Notes for ${filterDate}` : 'All Diary Notes'}
            </span>
          </h4>
          <span className="text-xs text-slate-400 font-semibold">
            {displayedEntries.length} {displayedEntries.length === 1 ? 'note' : 'notes'}
          </span>
        </div>

        {displayedEntries.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-amber-200">
            <div className="text-3xl mb-2">📖</div>
            <h5 className="font-bold text-xs sm:text-sm text-slate-700">No Diary Notes Yet</h5>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {filterDate
                ? `No diary entry written for ${filterDate}. Use the form above to add one!`
                : 'Share your daily reflections and experiences in your personal Gospel Diary.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {displayedEntries.map(entry => (
              <div
                key={entry.id}
                className="bg-white rounded-3xl p-5 border border-amber-200 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
              >
                {/* Note Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl p-1.5 bg-amber-50 rounded-2xl border border-amber-200" title="Mood">
                      {entry.mood || '😊'}
                    </span>
                    <div>
                      <h5 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                        <LinkifiedText text={entry.title} />
                      </h5>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {entry.date}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Logged</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(entry)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 transition-colors"
                      title="Edit Note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Note Body */}
                <LinkifiedText
                  as="p"
                  text={entry.writing}
                  className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-amber-50/30 p-3 rounded-2xl border border-amber-100 font-sans block"
                />

                {/* Attached MultiMedia (Audios, Voice Notes, Photos, Videos, Docs) */}
                {(entry.mediaItems?.length > 0 || entry.mediaUrl) && (
                  <div className="mt-2.5">
                    <MultiMediaDisplay
                      mediaItems={entry.mediaItems}
                      singleUrl={entry.mediaUrl}
                      singleType={entry.mediaType}
                      title={entry.title}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
