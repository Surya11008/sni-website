import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Share2,
  Download,
  CalendarDays,
  CalendarCheck,
  CalendarPlus,
  Repeat,
  Copy,
  Check,
  CheckCheck,
  Filter,
  Sparkles,
  Bell,
  ArrowRight,
  Tag,
  X,
  ExternalLink,
  Flame,
} from 'lucide-react';

export const EVENT_TYPES = [
  { id: 'Worship Service', labelEn: 'Worship Service', labelTe: 'ఆరాధనా సమయం', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-600', icon: '🕊️' },
  { id: 'Sacred Assembly', labelEn: 'Sacred Assembly', labelTe: 'పవిత్ర సమావేశం', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-600', icon: '📜' },
  { id: 'Sacred Feast', labelEn: 'Sacred Feast', labelTe: 'పవిత్ర పండుగ', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-600', icon: '🌾' },
  { id: 'Prayer Watch', labelEn: 'Prayer Watch', labelTe: 'ప్రార్థనా సమయం', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-600', icon: '🕯️' },
  { id: 'Choir & Music', labelEn: 'Choir & Music', labelTe: 'గాన సాధన & స్తుతి', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600', icon: '🎶' },
  { id: 'Youth Fellowship', labelEn: 'Youth Fellowship', labelTe: 'యువజన కూటం', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-600', icon: '🌟' },
  { id: 'Pastoral Notice', labelEn: 'Pastoral Notice', labelTe: 'సంఘ ప్రకటన', color: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-600', icon: '📢' },
];

export const RECURRENCE_OPTIONS = [
  { id: 'none', label: 'One-Time Event (ఒకేసారి)' },
  { id: 'weekly_sabbath', label: 'Every Sabbath (ప్రతి విశ్రాంతి దినం)' },
  { id: 'weekly_tuesday', label: 'Every Tuesday (ప్రతి మంగళవారం)' },
  { id: 'monthly', label: 'Monthly (ప్రతి నెలా)' },
  { id: 'annual', label: 'Annual Sacred Feast (వార్షిక పండుగ)' },
];

// Helper to extract 'YYYY-MM-DD' from item
export function getItemDateStr(item) {
  if (!item) return null;
  if (item.eventDate && typeof item.eventDate === 'string') {
    return item.eventDate.trim().slice(0, 10);
  }
  if (item.date && typeof item.date === 'string') {
    return item.date.trim().slice(0, 10);
  }
  if (item.createdAt?.toDate) {
    try {
      const d = item.createdAt.toDate();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  }
  return null;
}

// Format 'YYYY-MM-DD' to readable text
export function formatReadableDate(dateStr, isTelugu = false) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString(isTelugu ? 'te-IN' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// Generate Google Calendar Link
export function getGoogleCalendarUrl(item) {
  const titleText = item.title || item.titleEn || 'Church Schedule';
  const descText = (item.desc || item.descEn || '').replace(/<[^>]*>/g, '').slice(0, 500);
  const locationText = item.eventLocation || 'SNI Church Sanctuary';
  const dateStr = getItemDateStr(item) || new Date().toISOString().slice(0, 10);
  const cleanDate = dateStr.replace(/-/g, '');
  const datesParam = `${cleanDate}T090000Z/${cleanDate}T110000Z`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titleText)}&dates=${datesParam}&details=${encodeURIComponent(descText)}&location=${encodeURIComponent(locationText)}`;
}

// Download .ICS calendar event file
export function downloadICSFile(item, e) {
  if (e) e.stopPropagation();
  const titleText = item.title || item.titleEn || 'Church Schedule';
  const descText = (item.desc || item.descEn || '').replace(/<[^>]*>/g, '').slice(0, 500);
  const locationText = item.eventLocation || 'SNI Church Sanctuary';
  const dateStr = getItemDateStr(item) || new Date().toISOString().slice(0, 10);
  const cleanDate = dateStr.replace(/-/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SNI Assembly//Schedule Tracker//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${titleText.replace(/,/g, '\\,')}`,
    `DESCRIPTION:${descText.replace(/\n/g, '\\n').replace(/,/g, '\\,')}`,
    `LOCATION:${locationText.replace(/,/g, '\\,')}`,
    `DTSTART;VALUE=DATE:${cleanDate}`,
    `DTEND;VALUE=DATE:${cleanDate}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = (item.title || 'schedule').slice(0, 24).replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `${fileName}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * CalendarScheduleHub
 * Complete interactive tracking and calendar management hub for New Updates, Events, and Schedule pages.
 */
export default function CalendarScheduleHub({
  pageSlug = 'schedule',
  pageTitle = 'Schedule',
  contents = [],
  selectedDate = null,
  onSelectDate = () => {},
  dateRangePreset = 'all',
  onChangeDatePreset = () => {},
  selectedEventType = 'all',
  onChangeEventType = () => {},
  onOpenAddSchedule = () => {},
  onOpenArticle = () => {},
  isAdmin = false,
  isTelugu = false,
  viewMode = 'calendar',
  onToggleViewMode = () => {},
}) {
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      }
    }
    return new Date();
  });

  const [copiedId, setCopiedId] = useState(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

  // Today string
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Map of dateStr -> array of content items
  const calendarDateMap = useMemo(() => {
    const map = {};
    contents.forEach((item) => {
      const ds = getItemDateStr(item);
      if (ds) {
        if (!map[ds]) map[ds] = [];
        map[ds].push(item);
      }
    });
    return map;
  }, [contents]);

  // Compute Next Upcoming Schedule
  const nextUpcomingItem = useMemo(() => {
    const upcoming = contents
      .filter((item) => {
        const ds = getItemDateStr(item);
        return ds && ds >= todayStr;
      })
      .sort((a, b) => {
        const dsA = getItemDateStr(a) || '';
        const dsB = getItemDateStr(b) || '';
        return dsA.localeCompare(dsB);
      });
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [contents, todayStr]);

  // Statistics
  const stats = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let thisMonthCount = 0;
    const currentYearMonth = `${currentMonthDate.getFullYear()}-${String(currentMonthDate.getMonth() + 1).padStart(2, '0')}`;

    contents.forEach((item) => {
      const ds = getItemDateStr(item);
      if (ds) {
        if (ds === todayStr) todayCount++;
        if (ds >= todayStr) upcomingCount++;
        if (ds.startsWith(currentYearMonth)) thisMonthCount++;
      }
    });

    return { todayCount, upcomingCount, thisMonthCount, totalCount: contents.length };
  }, [contents, todayStr, currentMonthDate]);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(todayStr);
  };

  // Build calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];
    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({ dayNum, dateStr, isCurrentMonth: false });
    }
    // Current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNum: i, dateStr, isCurrentMonth: true });
    }
    // Next month padding to fill multiple of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const m = month === 11 ? 1 : month + 2;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNum: i, dateStr, isCurrentMonth: false });
    }
    return days;
  }, [currentMonthDate]);

  // Copy schedule details
  const handleCopySchedule = (item, e) => {
    if (e) e.stopPropagation();
    const dateStr = getItemDateStr(item) || 'Upcoming';
    const text = [
      `📅 ${item.title || item.titleEn}`,
      item.eventType ? `📌 Type: ${item.eventType}` : '',
      `🗓 Date: ${dateStr}`,
      item.eventTime ? `⏰ Time: ${item.eventTime}` : '',
      item.eventLocation ? `📍 Venue: ${item.eventLocation}` : '',
      item.desc ? `\n${item.desc.replace(/<[^>]*>/g, '').slice(0, 160)}...` : '',
      `\n🔗 ${window.location.href}`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Selected date's events
  const selectedDayItems = useMemo(() => {
    if (!selectedDate) return [];
    return calendarDateMap[selectedDate] || [];
  }, [selectedDate, calendarDateMap]);

  const monthYearLabel = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full space-y-4 mb-6 animate-in fade-in duration-300">
      {/* 1. TOP INTELLIGENCE BANNER: NEXT UPCOMING SCHEDULE HIGHLIGHT */}
      {nextUpcomingItem && (
        <div className="rounded-2xl bg-gradient-to-r from-[#071B3B] via-[#0F294A] to-[#132A4A] text-white p-4 sm:p-5 shadow-lg border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#F4B942] text-[#071B3B] flex items-center justify-center shrink-0 shadow-md">
              <CalendarCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-[#F4B942] border border-[#F4B942]/40 text-[10px] font-black uppercase tracking-wider">
                  ⚡ Next Upcoming Schedule
                </span>
                {getItemDateStr(nextUpcomingItem) === todayStr && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] animate-pulse">
                    Happening Today!
                  </span>
                )}
                <span className="text-xs text-slate-300 flex items-center gap-1 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#F4B942]" />
                  <span>{nextUpcomingItem.eventTime || 'Official Time'}</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-1">
                {nextUpcomingItem.title || nextUpcomingItem.titleEn}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-300" />
                  <span>{formatReadableDate(getItemDateStr(nextUpcomingItem), isTelugu)}</span>
                </span>
                {nextUpcomingItem.eventLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    <span>{nextUpcomingItem.eventLocation}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto flex-wrap">
            <a
              href={getGoogleCalendarUrl(nextUpcomingItem)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 shadow-xs cursor-pointer"
              title="Add this event to Google Calendar"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-[#F4B942]" />
              <span>Add to Google</span>
            </a>
            <button
              type="button"
              onClick={(e) => downloadICSFile(nextUpcomingItem, e)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 shadow-xs cursor-pointer"
              title="Download iCal file for Apple / Outlook Calendar"
            >
              <Download className="w-3.5 h-3.5 text-[#F4B942]" />
              <span>.ICS</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenArticle(nextUpcomingItem)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. CALENDAR TRACKING CONTROL HUB */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-4 sm:p-6 space-y-5">
        {/* Hub Header: Month Controls, Statistics & Quick Add */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70">
                <CalendarDays className="w-5 h-5 text-[#C59B27]" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[#071B3B] flex items-center gap-2">
                  <span>{isTelugu ? 'క్యాలెండర్ షెడ్యూల్ & ట్రాకింగ్' : `${pageTitle} Calendar & Tracking`}</span>
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Live Sync
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {isTelugu
                    ? 'క్యాలెండర్ తేదీల ద్వారా అన్ని ఆరాధనలు, కార్యక్రమాలు మరియు తాజా సమాచారాన్ని ట్రాక్ చేయండి'
                    : 'Track, schedule, and sync services, assemblies, and notifications by date'}
                </p>
              </div>
            </div>
          </div>

          {/* Month Switcher & Statistics Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick KPI stats */}
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Today: <b>{stats.todayCount}</b></span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Upcoming: <b>{stats.upcomingCount}</b></span>
              </span>
            </div>

            {/* Month Navigator */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl text-slate-600 hover:bg-white hover:text-slate-900 transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs sm:text-sm font-extrabold text-[#071B3B] min-w-[130px] text-center select-none">
                {monthYearLabel}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl text-slate-600 hover:bg-white hover:text-slate-900 transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleJumpToToday}
                className="px-2.5 py-1 rounded-xl bg-white text-[#071B3B] hover:bg-amber-50 text-xs font-bold transition shadow-2xs border border-slate-200 cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Admin Add Schedule Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => onOpenAddSchedule(selectedDate || todayStr)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Schedule</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              title={isCalendarExpanded ? 'Collapse Calendar Grid' : 'Expand Calendar Grid'}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. INTERACTIVE MONTHLY CALENDAR GRID */}
        {isCalendarExpanded && (
          <div className="space-y-2">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-500 uppercase tracking-wider py-1 border-b border-slate-100">
              <span className="text-rose-500">Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span className="text-indigo-600">Sat (Sabbath)</span>
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((cell, idx) => {
                const dayItems = calendarDateMap[cell.dateStr] || [];
                const isToday = cell.dateStr === todayStr;
                const isSelected = selectedDate === cell.dateStr;
                const hasEvents = dayItems.length > 0;

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    onClick={() => onSelectDate(isSelected ? null : cell.dateStr)}
                    className={`relative min-h-[58px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-2xl border text-left transition flex flex-col justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-[#071B3B] text-white border-[#071B3B] shadow-md ring-2 ring-[#F4B942]/60'
                        : isToday
                        ? 'bg-amber-50/70 border-amber-300 text-slate-900 ring-2 ring-amber-400/40'
                        : cell.isCurrentMonth
                        ? 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-800'
                        : 'bg-slate-50/60 border-slate-100 text-slate-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Date Number & Badges */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-black rounded-lg w-5 h-5 flex items-center justify-center ${
                          isToday && !isSelected
                            ? 'bg-[#F4B942] text-[#071B3B]'
                            : isSelected
                            ? 'text-[#F4B942]'
                            : ''
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {hasEvents && (
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-[#F4B942] text-[#071B3B]'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {dayItems.length}
                        </span>
                      )}
                    </div>

                    {/* Event Preview Dots & Micro Titles */}
                    <div className="w-full space-y-0.5 overflow-hidden">
                      {hasEvents ? (
                        <>
                          {dayItems.slice(0, 2).map((item, i) => (
                            <div
                              key={item.id || i}
                              className={`text-[9px] sm:text-[10px] font-semibold truncate rounded px-1 py-0.2 leading-tight flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  item.eventType === 'Worship Service'
                                    ? 'bg-blue-500'
                                    : item.eventType === 'Sacred Feast'
                                    ? 'bg-amber-500'
                                    : item.eventType === 'Sacred Assembly'
                                    ? 'bg-purple-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span className="truncate">{item.title || item.titleEn}</span>
                            </div>
                          ))}
                          {dayItems.length > 2 && (
                            <span className="text-[9px] font-bold text-slate-400 pl-1 block">
                              +{dayItems.length - 2} more
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="h-2"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. ACTIVE DATE FILTER BANNER (When a date is clicked) */}
        {selectedDate && (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-[#F4B942]/60 flex items-center justify-between gap-3 flex-wrap animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <CalendarCheck className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-900">
                  Filtering for Date:{' '}
                  <span className="font-extrabold text-[#071B3B]">
                    {formatReadableDate(selectedDate, isTelugu)}
                  </span>
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  ({selectedDayItems.length} {selectedDayItems.length === 1 ? 'item' : 'items'} found)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onOpenAddSchedule(selectedDate)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Schedule on this Day</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onSelectDate(null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear Date Filter</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. PRESET FILTERS & EVENT TYPE SELECTORS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Date range presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Range:</span>
            </span>
            {[
              { id: 'all', label: 'All Dates' },
              { id: 'today', label: `Today (${stats.todayCount})` },
              { id: 'upcoming', label: `Upcoming (${stats.upcomingCount})` },
              { id: 'this_month', label: `This Month (${stats.thisMonthCount})` },
              { id: 'past', label: 'Past Schedules' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChangeDatePreset(preset.id);
                  onSelectDate(null);
                }}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs border ${
                  dateRangePreset === preset.id && !selectedDate
                    ? 'bg-[#071B3B] text-[#F4B942] border-[#071B3B] shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Event type filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>Type:</span>
            </span>
            <button
              type="button"
              onClick={() => onChangeEventType('all')}
              className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs border ${
                selectedEventType === 'all'
                  ? 'bg-[#071B3B] text-[#F4B942] border-[#071B3B] shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
              }`}
            >
              All Types
            </button>
            {EVENT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => onChangeEventType(type.id)}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition cursor-pointer text-xs border flex items-center gap-1 ${
                  selectedEventType === type.id
                    ? 'bg-[#071B3B] text-[#F4B942] border-[#071B3B] shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white'
                }`}
              >
                <span>{type.icon}</span>
                <span>{isTelugu ? type.labelTe : type.labelEn}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
