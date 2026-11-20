import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { db } from '../firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import {
  formatDate,
  formatTimeOnly,
  createStampFromDateAndTime,
  parseStampToDateAndTime,
  time12To24,
  time24To12,
  getCurrentWeekRange,
} from '../utils/dateUtils';
import {
  calculateElohimAcademyStars,
  calculateElohimDateBreakdown,
  calculateElohimAcademyStarsInRange,
} from '../utils/starCalculations';
import {
  Star,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit3,
  Sparkles,
  History,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Users,
  Search,
  BookOpen,
  RefreshCw,
  Trophy,
} from 'lucide-react';

export default function StarsProgramTracker() {
  const { currentUser, userProfile } = useAuth();
  const { isTelugu } = useLanguage();

  const isAdmin =
    userProfile?.role === 'admin' ||
    currentUser?.email === 'surya11008@sni.org.in' ||
    currentUser?.email === 'admin@sni.org.in' ||
    currentUser?.email?.startsWith('surya');
  const isLeader = isAdmin || userProfile?.role === 'pastor' || userProfile?.role === 'manager';

  // Selected Member for Admins/Pastors
  const [selectedMemberId, setSelectedMemberId] = useState(currentUser?.uid || '');
  const [membersList, setMembersList] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  // Elohim Academy Activity Data
  const [elohimData, setElohimData] = useState({
    levelChecks: [],
    somChecks: [],
    timestamps: {},
  });
  const [savingStatus, setSavingStatus] = useState('saved'); // 'saved', 'saving', 'error'

  // Date controls
  const todayStr = useMemo(() => formatDate(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return formatDate(y);
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [weekOffset, setWeekOffset] = useState(0);
  const currentWeek = useMemo(() => getCurrentWeekRange(weekOffset), [weekOffset]);

  // View Mode: 'all' | 'dateOnly' | 'history'
  const [viewMode, setViewMode] = useState('all');

  // Edit Modal State
  const [editingKey, setEditingKey] = useState(null);
  const [editDate, setEditDate] = useState(todayStr);
  const [editTime, setEditTime] = useState('12:00');

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Sync selectedMemberId with currentUser if empty
  useEffect(() => {
    if (!selectedMemberId && currentUser?.uid) {
      setSelectedMemberId(currentUser.uid);
    }
  }, [currentUser, selectedMemberId]);

  // Load all members for admin/leader dropdown
  useEffect(() => {
    if (!isLeader) return;

    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const users = [];
        snap.forEach((d) => {
          users.push({ id: d.id, ...d.data() });
        });
        setMembersList(users);
      } catch (err) {
        console.warn('Could not load users list for stars tracker:', err);
      }
    };

    fetchUsers();
  }, [isLeader]);

  // Subscribe to selected member's stars data in Firestore
  useEffect(() => {
    if (!selectedMemberId) return;

    // First try loading from localStorage for instant display
    const cached = localStorage.getItem(`sni_stars_${selectedMemberId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.levelChecks)) {
          setElohimData(parsed);
        }
      } catch (e) {
        // ignore
      }
    }

    // Subscribe to real-time updates from users/{selectedMemberId} document
    const userDocRef = doc(db, 'users', selectedMemberId);
    const unsub = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const uData = docSnap.data();
          const activity = uData?.elohimAcademy || {
            levelChecks: [],
            somChecks: [],
            timestamps: {},
          };
          setElohimData({
            levelChecks: Array.isArray(activity.levelChecks) ? activity.levelChecks : [],
            somChecks: Array.isArray(activity.somChecks) ? activity.somChecks : [],
            timestamps: activity.timestamps || {},
          });
          // Cache in localStorage
          localStorage.setItem(`sni_stars_${selectedMemberId}`, JSON.stringify(activity));
        }
      },
      (err) => {
        console.warn('Realtime sync error:', err);
      }
    );

    return () => unsub();
  }, [selectedMemberId]);

  // Persist updates to Firestore and LocalStorage
  const persistElohimData = async (newData) => {
    if (!selectedMemberId) return;
    setSavingStatus('saving');
    // Immediate local update
    setElohimData(newData);
    localStorage.setItem(`sni_stars_${selectedMemberId}`, JSON.stringify(newData));

    try {
      const userDocRef = doc(db, 'users', selectedMemberId);
      await setDoc(
        userDocRef,
        {
          elohimAcademy: newData,
          lastActivityAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSavingStatus('saved');
    } catch (err) {
      console.error('Failed to save stars data to Firestore:', err);
      setSavingStatus('error');
      showToast('⚠️ Saved locally. Will sync to server when connection improves.');
    }
  };

  const levelChecks = elohimData.levelChecks || [];
  const somChecks = elohimData.somChecks || [];
  const timestamps = elohimData.timestamps || {};

  // Calculations
  const totalStars = useMemo(() => {
    return calculateElohimAcademyStars(levelChecks, somChecks);
  }, [levelChecks, somChecks]);

  const dateBreakdown = useMemo(() => {
    return calculateElohimDateBreakdown(levelChecks, somChecks, timestamps);
  }, [levelChecks, somChecks, timestamps]);

  const selectedDateStars = dateBreakdown.starsByDate[selectedDate] || 0;

  const rangeResult = useMemo(() => {
    return calculateElohimAcademyStarsInRange(
      levelChecks,
      somChecks,
      timestamps,
      currentWeek.startDate,
      currentWeek.endDate
    );
  }, [levelChecks, somChecks, timestamps, currentWeek.startDate, currentWeek.endDate]);

  const rangeStars = rangeResult.stars;
  const rangeItemsCount = rangeResult.count;
  const milestoneKeys = dateBreakdown.milestoneKeys;

  // Level Milestone Progress
  const levelCount = levelChecks.length;
  let nextLevelMilestone = 2;
  if (levelCount >= 2) {
    nextLevelMilestone = Math.min(50, levelCount + 1);
  }
  const levelsNeededForNextMilestone =
    levelCount >= 50 ? 0 : levelCount < 2 ? 2 - levelCount : 1;

  // SOM Milestone Progress
  const somCount = somChecks.length;
  let nextSomMilestone = 4;
  if (somCount >= 4) {
    nextSomMilestone = Math.min(20, 4 + (Math.floor((somCount - 4) / 2) + 1) * 2);
  }
  const somNeededForNextMilestone =
    somCount >= 20 ? 0 : somCount < 4 ? 4 - somCount : nextSomMilestone - somCount;

  // Items on currently selected calendar date
  const itemsOnSelectedDate = useMemo(() => {
    const list = [];
    [...levelChecks, ...somChecks].forEach((key) => {
      const stamp = timestamps[key];
      if (!stamp) return;
      const parsed = parseStampToDateAndTime(stamp);
      if (parsed.date === selectedDate) {
        list.push({ key, isSom: key.startsWith('SOM-'), time12: parsed.time12 });
      }
    });
    return list;
  }, [levelChecks, somChecks, timestamps, selectedDate]);

  // Practice History grouped by date
  const historyByDate = useMemo(() => {
    const map = {};
    [...levelChecks, ...somChecks].forEach((key) => {
      const stamp = timestamps[key];
      const parsed = parseStampToDateAndTime(stamp);
      const d = parsed.date;
      if (!map[d]) map[d] = [];
      map[d].push({ key, isSom: key.startsWith('SOM-'), time12: parsed.time12 });
    });

    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((dateKey) => ({
      date: dateKey,
      items: map[dateKey],
      count: map[dateKey].length,
      stars: dateBreakdown.starsByDate[dateKey] || 0,
    }));
  }, [levelChecks, somChecks, timestamps, dateBreakdown]);

  // Toggle Level Check
  const toggleLevelCheck = (key) => {
    const isChecked = levelChecks.includes(key);

    if (isChecked) {
      const parsed = parseStampToDateAndTime(timestamps[key]);
      setEditingKey(key);
      setEditDate(parsed.date);
      setEditTime(parsed.time24);
      return;
    }

    const now = new Date();
    const time12 = formatTimeOnly(now);
    const newStamp = createStampFromDateAndTime(selectedDate, time12);

    const newLevelChecks = [...levelChecks, key];
    const newTimestamps = { ...timestamps, [key]: newStamp };

    persistElohimData({
      ...elohimData,
      levelChecks: newLevelChecks,
      timestamps: newTimestamps,
    });
    showToast(`✓ ${key} completed on ${selectedDate} (${time12})`);
  };

  // Toggle SOM Check
  const toggleSomCheck = (key) => {
    const isChecked = somChecks.includes(key);

    if (isChecked) {
      const parsed = parseStampToDateAndTime(timestamps[key]);
      setEditingKey(key);
      setEditDate(parsed.date);
      setEditTime(parsed.time24);
      return;
    }

    const now = new Date();
    const time12 = formatTimeOnly(now);
    const newStamp = createStampFromDateAndTime(selectedDate, time12);

    const newSomChecks = [...somChecks, key];
    const newTimestamps = { ...timestamps, [key]: newStamp };

    persistElohimData({
      ...elohimData,
      somChecks: newSomChecks,
      timestamps: newTimestamps,
    });
    showToast(`✓ ${key} completed on ${selectedDate} (${time12})`);
  };

  // Open Edit Date Modal
  const handleOpenModifyModal = (e, key) => {
    e.stopPropagation();
    const parsed = parseStampToDateAndTime(timestamps[key]);
    setEditingKey(key);
    setEditDate(parsed.date);
    setEditTime(parsed.time24);
  };

  // Save Modified Date
  const handleSaveModifiedDate = (e) => {
    e.preventDefault();
    if (!editingKey) return;

    const time12Str = time24To12(editTime);
    const newStamp = createStampFromDateAndTime(editDate, time12Str);

    persistElohimData({
      ...elohimData,
      timestamps: {
        ...timestamps,
        [editingKey]: newStamp,
      },
    });

    showToast(`✓ ${editingKey} updated to ${editDate} (${time12Str})`);
    setEditingKey(null);
  };

  // Uncheck Item
  const handleUncheckItem = () => {
    if (!editingKey) return;
    const keyToRemove = editingKey;
    const isLevel = keyToRemove.startsWith('L');
    const newLevelChecks = isLevel
      ? levelChecks.filter((k) => k !== keyToRemove)
      : levelChecks;
    const newSomChecks = !isLevel
      ? somChecks.filter((k) => k !== keyToRemove)
      : somChecks;
    const newTimestamps = { ...timestamps };
    delete newTimestamps[keyToRemove];

    persistElohimData({
      ...elohimData,
      levelChecks: newLevelChecks,
      somChecks: newSomChecks,
      timestamps: newTimestamps,
    });

    showToast(`${keyToRemove} unchecked.`);
    setEditingKey(null);
  };

  // Active selected member details
  const currentSelectedUser =
    membersList.find((m) => m.id === selectedMemberId) ||
    (selectedMemberId === currentUser?.uid ? userProfile || currentUser : null);

  const selectedMemberName =
    currentSelectedUser?.displayName ||
    currentSelectedUser?.name ||
    currentSelectedUser?.email?.split('@')[0] ||
    'Member';

  const filteredMembers = membersList.filter(
    (m) =>
      m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.displayName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 p-3.5 rounded-2xl bg-[#071B3B] text-[#F4B942] border border-[#F4B942]/40 text-xs font-bold shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#F4B942] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header & Member Switcher */}
      <div className="bg-gradient-to-r from-[#071B3B] via-[#0F294A] to-[#071B3B] rounded-3xl p-5 sm:p-7 text-white border border-[#132A4A] shadow-xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F4B942]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#F4B942]/20 text-[#F4B942] border border-[#F4B942]/30 flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-[#F4B942]" />
                <span>{isTelugu ? 'ఆకాశ నక్షత్రాల కార్యక్రమం' : 'Stars Program • Elohim Academy'}</span>
              </span>
              <span className="text-[10px] text-slate-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {savingStatus === 'saving'
                  ? isTelugu ? 'సేవ్ అవుతోంది...' : 'Syncing...'
                  : isTelugu ? 'ఆన్‌లైన్ సమన్వయం' : 'Live Synced'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-sans">
              <span>{isTelugu ? 'నక్షత్రాల సాధన & ప్రగతి పట్టిక' : 'Elohim Academy & SOM Curriculum'}</span>
            </h2>

            <p className="text-xs text-slate-300 max-w-2xl font-medium leading-relaxed">
              {isTelugu
                ? 'దానియేలు 12:3 - అనేకులను నీతి మార్గమున నడిపించువారు ఆకాశ జ్యోతులవలె సదాకాలము ప్రకాశింతురు. 50 లెవల్స్ మరియు 20 SOM మిషన్ ప్రసంగాల ద్వారా నక్షత్రాలను సంపాదించండి.'
                : 'Daniel 12:3 — Those who lead many to righteousness will shine like the stars forever and ever. Master all 50 Level lessons and 20 SOM checkboxes to earn celestial stars.'}
            </p>
          </div>

          {/* Member Selection for Admins / Pastors */}
          <div className="shrink-0 flex items-center gap-2">
            {isLeader && membersList.length > 0 ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#F4B942]" />
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-slate-300 block">
                      {isTelugu ? 'సభ్యుడు / రికార్డు' : 'Active Member'}
                    </span>
                    <span className="text-xs font-black text-[#F4B942] truncate max-w-[130px] sm:max-w-[180px] block">
                      {selectedMemberName}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-300 transition-transform ${
                      isMemberDropdownOpen ? 'rotate-90 text-[#F4B942]' : ''
                    }`}
                  />
                </button>

                {isMemberDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#0F294A] border border-[#1E3A8A] shadow-2xl p-3 z-50 space-y-2 animate-in fade-in zoom-in-95">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder={isTelugu ? 'సభ్యుని వెతకండి...' : 'Search member name/email...'}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-[#071B3B] text-white border border-[#1E3A8A] focus:outline-none focus:border-[#F4B942]"
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {/* Current User Quick Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMemberId(currentUser?.uid);
                          setIsMemberDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                          selectedMemberId === currentUser?.uid
                            ? 'bg-[#F4B942] text-[#071B3B] font-bold'
                            : 'text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-black block">
                            ★ {currentUser?.displayName || currentUser?.email?.split('@')[0]} (You)
                          </span>
                          <span className="text-[10px] opacity-75">{currentUser?.email}</span>
                        </div>
                        {selectedMemberId === currentUser?.uid && <Check className="w-4 h-4 shrink-0" />}
                      </button>

                      {filteredMembers
                        .filter((m) => m.id !== currentUser?.uid)
                        .map((mem) => {
                          const isSel = selectedMemberId === mem.id;
                          return (
                            <button
                              key={mem.id}
                              type="button"
                              onClick={() => {
                                setSelectedMemberId(mem.id);
                                setIsMemberDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                                isSel
                                  ? 'bg-[#F4B942] text-[#071B3B] font-bold'
                                  : 'text-slate-200 hover:bg-white/10'
                              }`}
                            >
                              <div className="truncate">
                                <span className="font-bold block">
                                  {mem.name || mem.displayName || mem.email?.split('@')[0]}
                                </span>
                                <span className="text-[10px] opacity-70 truncate block">{mem.email}</span>
                              </div>
                              {isSel && <Check className="w-4 h-4 shrink-0" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 text-xs">
                <span className="text-[10px] text-slate-300 block">{isTelugu ? 'సభ్యుడు' : 'Member'}</span>
                <span className="font-black text-[#F4B942]">{selectedMemberName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top 3 Metric Cards (Theme: Classic Navy & Gold) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Selected Calendar Date Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-[#071B3B] via-[#0F294A] to-[#1E3A8A] text-white p-5 shadow-lg flex flex-col justify-between border-2 border-[#1E3A8A]/60 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#F4B942] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#F4B942]" />
              <span>{isTelugu ? 'ఎంచుకున్న తేదీ' : 'Selected Date'}</span>
            </span>
            <span className="text-[10px] font-bold bg-white/15 px-2.5 py-0.5 rounded-full text-slate-200">
              {selectedDate}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-1.5 bg-black/30 p-1.5 rounded-2xl border border-white/10">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-2 py-1 rounded-xl text-xs font-black bg-white/10 hover:bg-white/20 text-white border border-white/20 focus:outline-none focus:ring-1 focus:ring-[#F4B942] cursor-pointer w-full text-center"
              title="Click to select date"
            />
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition ${
                  selectedDate === todayStr
                    ? 'bg-[#F4B942] text-[#071B3B] font-black shadow-xs'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {isTelugu ? 'నేడు' : 'Today'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(yesterdayStr)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold cursor-pointer transition ${
                  selectedDate === yesterdayStr
                    ? 'bg-[#F4B942] text-[#071B3B] font-black shadow-xs'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {isTelugu ? 'నిన్న' : 'Yesterday'}
              </button>
            </div>
          </div>

          <div className="my-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {selectedDateStars}
              </span>
              <Star className="w-8 h-8 fill-[#F4B942] text-[#F4B942] animate-pulse drop-shadow-md" />
            </div>
            {selectedDateStars > 0 && (
              <span className="bg-[#F4B942] text-[#071B3B] font-black px-2.5 py-1 rounded-xl text-[10px] shadow-sm animate-bounce">
                Milestone Hit! +{selectedDateStars} ⭐
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold border-t border-white/15 pt-2.5">
            <span>{itemsOnSelectedDate.length} {isTelugu ? 'పాఠాలు ఈ తేదీన పూర్తయ్యాయి' : `items on ${selectedDate}`}</span>
            <span className="text-[10px] text-[#F4B942] font-bold uppercase">{isTelugu ? 'ఒక రోజు' : 'Single Day'}</span>
          </div>
        </div>

        {/* Card 2: Date Cycle Stars (Week Cycle) */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1E112A] via-[#2A1747] to-[#3B125B] text-white p-5 shadow-lg flex flex-col justify-between border-2 border-purple-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#F4B942] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F4B942]" />
              <span>{isTelugu ? 'వారపు సైకిల్ నక్షత్రాలు' : 'Date Cycle Stars'}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev - 1)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[9px] font-bold bg-white/15 px-2 py-0.5 rounded-full text-purple-200">
                {currentWeek.startDate.slice(5)} → {currentWeek.endDate.slice(5)}
              </span>
              <button
                type="button"
                onClick={() => setWeekOffset((prev) => prev + 1)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Next Week"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="my-3 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#F4B942]">
              {rangeStars}
            </span>
            <Star className="w-8 h-8 fill-[#F4B942] text-[#F4B942] drop-shadow-md" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-purple-200 font-semibold border-t border-white/10 pt-2.5">
            <span>{rangeItemsCount} {isTelugu ? 'ఈ వారంలో పాఠాలు' : 'items in this cycle'}</span>
            <span className="text-[10px] text-[#F4B942] font-bold uppercase">{isTelugu ? 'వారపు సైకిల్' : 'Week Cycle'}</span>
          </div>
        </div>

        {/* Card 3: Overall Total Stars */}
        <div className="rounded-3xl bg-gradient-to-br from-[#071B3B] via-[#151D2A] to-[#0A101D] text-white p-5 shadow-lg flex flex-col justify-between border-2 border-[#F4B942]/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#F4B942] flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#F4B942]" />
              <span>{isTelugu ? 'మొత్తం జీవితకాల నక్షత్రాలు' : 'Overall Total Stars'}</span>
            </span>
            <span className="text-[10px] font-bold bg-[#F4B942]/20 text-[#F4B942] px-2.5 py-0.5 rounded-full border border-[#F4B942]/40">
              {isTelugu ? 'ఆల్-టైమ్' : 'All-Time'}
            </span>
          </div>

          <div className="my-3 flex items-center gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {totalStars}
            </span>
            <Star className="w-8 h-8 fill-[#F4B942] text-[#F4B942] drop-shadow-md" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold border-t border-white/15 pt-2.5">
            <span>
              Levels: <strong className="text-white">{levelChecks.length}/50</strong> • SOM:{' '}
              <strong className="text-white">{somChecks.length}/20</strong>
            </span>
            <span className="text-[10px] text-[#F4B942] font-bold uppercase">{isTelugu ? 'సిలబస్' : 'Curriculum'}</span>
          </div>
        </div>
      </div>

      {/* 🌟 3. Motivational Milestone Progress Banners (Classic Theme) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Levels 1 to 5 Milestone Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/70 to-purple-50/80 rounded-3xl border-2 border-indigo-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#071B3B] text-[#F4B942] flex items-center justify-center font-bold text-sm shadow-md shrink-0 border border-[#F4B942]/30">
              🎯
            </div>
            <div>
              <span className="font-extrabold text-[#071B3B] text-xs sm:text-sm block">
                {levelCount < 2
                  ? `${isTelugu ? 'నియమం: మొదటి 2 పాఠాలు = 10 ⭐' : 'Rule: First 2 lessons = 10 ⭐'} (${levelCount}/2)`
                  : levelCount >= 50
                  ? `${isTelugu ? 'అన్ని 50 లెవల్స్ పూర్తయ్యాయి! 🏆' : 'Levels: All 50 Completed! 🏆'} (50/50)`
                  : `${isTelugu ? 'తదుపరి మైలురాయి' : 'Next Milestone'}: +10 ⭐ at ${nextLevelMilestone} lessons`}
              </span>
              <p className="text-[11px] text-slate-600 font-medium">
                {levelCount >= 50 ? (
                  isTelugu ? 'అన్ని 50 లెవల్ పాఠాలు పూర్తయ్యాయి. గరిష్ట నక్షత్రాలు లభించాయి!' : 'All 50 level lessons completed. Max stars earned!'
                ) : (
                  <>
                    {isTelugu ? 'తదుపరి ' : 'Complete '}
                    <strong className="text-indigo-800 font-black">{levelsNeededForNextMilestone}</strong>
                    {isTelugu ? ' పాఠం(లు) పూర్తి చేసి ' : ` more lesson${levelsNeededForNextMilestone === 1 ? '' : 's'} to unlock `}
                    <strong className="text-amber-600 font-black">+10 ⭐</strong>!
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-24 sm:w-28 bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300/50 shadow-inner">
              <div
                className="bg-gradient-to-r from-[#0F294A] to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${
                    levelCount < 2
                      ? (levelCount / 2) * 100
                      : levelCount >= 50
                      ? 100
                      : (levelCount / 50) * 100
                  }%`,
                }}
              />
            </div>
            <span className="text-xs font-black text-indigo-900 font-mono bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
              {levelCount < 2 ? `${levelCount}/2` : levelCount >= 50 ? '50/50' : `${levelCount}/50`}
            </span>
          </div>
        </div>

        {/* SOM 1 to 20 Milestone Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-yellow-50/80 rounded-3xl border-2 border-amber-300 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#C59B27] text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0 border border-amber-400">
              🎯
            </div>
            <div>
              <span className="font-extrabold text-amber-950 text-xs sm:text-sm block">
                {somCount < 4
                  ? `${isTelugu ? 'నియమం: మొదటి 4 పాఠాలు = 10 ⭐' : 'Rule: First 4 lessons = 10 ⭐'} (${somCount}/4)`
                  : somCount >= 20
                  ? `${isTelugu ? 'SOM: అన్ని 20 పూర్తయ్యాయి! 🏆' : 'SOM: All 20 Completed! 🏆'} (20/20)`
                  : `${isTelugu ? 'తదుపరి మైలురాయి' : 'Next Milestone'}: +10 ⭐ at ${nextSomMilestone} lessons`}
              </span>
              <p className="text-[11px] text-amber-800 font-medium">
                {somCount >= 20 ? (
                  isTelugu ? 'అన్ని 20 మిషన్ ప్రసంగాలు పూర్తయ్యాయి. గరిష్ట నక్షత్రాలు సాధించారు!' : 'All 20 Sermon of Mission checkboxes completed. Max stars earned!'
                ) : (
                  <>
                    {isTelugu ? 'తదుపరి ' : 'Complete '}
                    <strong className="text-amber-900 font-black">{somNeededForNextMilestone}</strong>
                    {isTelugu ? ' పాఠం(లు) పూర్తి చేసి ' : ` more lesson${somNeededForNextMilestone === 1 ? '' : 's'} to unlock `}
                    <strong className="text-amber-600 font-black">+10 ⭐</strong>!
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-24 sm:w-28 bg-amber-100 rounded-full h-3 overflow-hidden border border-amber-300 shadow-inner">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${
                    somCount < 4
                      ? (somCount / 4) * 100
                      : somCount >= 20
                      ? 100
                      : (((somCount - 4) % 2) / 2) * 100
                  }%`,
                }}
              />
            </div>
            <span className="text-xs font-black text-amber-900 font-mono bg-white px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
              {somCount < 4
                ? `${somCount}/4`
                : somCount >= 20
                ? '20/20'
                : `${(somCount - 4) % 2}/2`}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Interactive Calendar & Date Modify Control Center */}
      <div className="bg-gradient-to-br from-white via-slate-50 to-amber-50/30 rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#071B3B] text-[#F4B942] flex items-center justify-center font-bold shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#071B3B]">
                {isTelugu ? 'సాధన తేదీ & క్యాలెండర్ నియంత్రణ' : 'Practice Date & Calendar Control'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isTelugu
                  ? 'పూర్తయిన పాఠాలను నమోదు చేయడానికి తేదీని ఎంచుకోండి లేదా మార్చండి'
                  : 'Select date to record completed lessons or modify completion timestamps'}
              </p>
            </div>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-[#071B3B] text-[#F4B942] shadow-sm font-black'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {isTelugu ? 'నేడు (Today)' : 'Today'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-[#071B3B] text-[#F4B942] shadow-sm font-black'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {isTelugu ? 'నిన్న (Yesterday)' : 'Yesterday'}
            </button>
          </div>
        </div>

        {/* Date Selector Row */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              {isTelugu ? 'సక్రియ తేదీ (Active Date):' : 'Active Date:'}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C59B27] bg-slate-50 text-slate-800 cursor-pointer w-full sm:w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-900 bg-amber-50 font-bold px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1.5 shadow-2xs">
              <Star className="w-3.5 h-3.5 text-[#C59B27] fill-[#F4B942]" />
              <span>
                {selectedDateStars} {isTelugu ? 'నక్షత్రాలు ఈ తేదీన' : 'Stars earned on this date'}
              </span>
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-200 pt-3 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'all'
                ? 'bg-[#071B3B] text-[#F4B942] shadow-md font-black'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{isTelugu ? 'అన్ని లెవల్స్ & SOM' : 'All Levels & SOM'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('dateOnly')}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'dateOnly'
                ? 'bg-[#071B3B] text-[#F4B942] shadow-md font-black'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>
              {isTelugu ? `${selectedDate} నాటికి పూర్తయినవి` : `Completed on ${selectedDate}`}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F4B942] text-[#071B3B] font-black">
              {itemsOnSelectedDate.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'history'
                ? 'bg-[#071B3B] text-[#F4B942] shadow-md font-black'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isTelugu ? 'సాధన చరిత్ర (Calendar History)' : 'Practice Calendar History'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800 font-bold">
              {historyByDate.length} {isTelugu ? 'రోజులు' : 'days'}
            </span>
          </button>
        </div>
      </div>

      {/* 5. LEVELS & SOM GRIDS */}
      {viewMode !== 'history' && (
        <div className="space-y-5">
          {viewMode === 'dateOnly' && (
            <div className="p-4 bg-indigo-50/90 rounded-2xl border border-indigo-200 flex items-center justify-between text-xs">
              <span className="font-bold text-[#071B3B]">
                {isTelugu ? (
                  <>ఫిల్టర్ చేయబడింది: <strong>{selectedDate}</strong> తేదీన పూర్తయిన పాఠాలు మాత్రమే ({itemsOnSelectedDate.length} అంశాలు)</>
                ) : (
                  <>Filtered: Displaying only items completed on <strong>{selectedDate}</strong> ({itemsOnSelectedDate.length} items)</>
                )}
              </span>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className="text-xs font-black text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
              >
                {isTelugu ? 'అన్నీ చూపించు' : 'Show All'}
              </button>
            </div>
          )}

          {/* Level 1 to Level 5 Cards */}
          {[1, 2, 3, 4, 5].map((lvl) => {
            const levelSteps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const visibleSteps =
              viewMode === 'dateOnly'
                ? levelSteps.filter((step) => {
                    const key = `L${lvl}-${step}`;
                    const parsed = timestamps[key]
                      ? parseStampToDateAndTime(timestamps[key])
                      : null;
                    return levelChecks.includes(key) && parsed?.date === selectedDate;
                  })
                : levelSteps;

            if (viewMode === 'dateOnly' && visibleSteps.length === 0) return null;

            return (
              <div
                key={lvl}
                className="bg-white rounded-3xl p-5 border-2 border-slate-200 hover:border-[#1E3A8A]/30 shadow-sm transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#071B3B] text-[#F4B942] flex items-center justify-center font-black text-xs">
                      {lvl}
                    </div>
                    <div>
                      <span className="text-sm font-black text-[#071B3B]">
                        {isTelugu ? `స్థాయి-${lvl} (Level-${lvl})` : `Level-${lvl}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold ml-2">
                        10 Lessons
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                    {levelSteps.filter((s) => levelChecks.includes(`L${lvl}-${s}`)).length}/10 Done
                  </span>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {visibleSteps.map((step) => {
                    const key = `L${lvl}-${step}`;
                    const isChecked = levelChecks.includes(key);
                    const stamp = timestamps[key];
                    const parsed = stamp ? parseStampToDateAndTime(stamp) : null;
                    const isMatchingActiveDate = parsed?.date === selectedDate;
                    const isMilestone = milestoneKeys.has(key);

                    return (
                      <div
                        key={key}
                        onClick={() => toggleLevelCheck(key)}
                        className={`relative group py-2.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer ${
                          isChecked
                            ? isMatchingActiveDate
                              ? 'bg-gradient-to-br from-[#071B3B] to-[#1E3A8A] text-white border-[#F4B942] shadow-md scale-102 font-black ring-2 ring-[#F4B942]/60'
                              : 'bg-[#071B3B] text-white border-[#071B3B] shadow-xs font-black'
                            : 'bg-slate-50/80 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 active:scale-95'
                        }`}
                        title={
                          isChecked
                            ? `${key} completed on ${stamp} (Click to Modify Date)`
                            : `Click to record ${key} for ${selectedDate}`
                        }
                      >
                        {/* Milestone indicator badge */}
                        {isChecked && isMilestone && (
                          <div
                            className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-[#F4B942] text-[#071B3B] flex items-center justify-center shadow-xs border border-white animate-pulse"
                            title="Milestone Lesson! Earned +10 Stars on completion date"
                          >
                            <Star className="w-2.5 h-2.5 fill-[#071B3B]" />
                          </div>
                        )}

                        <span className="text-xs font-black">{step}</span>
                        <span className="text-[10px] mt-0.5 font-bold">
                          {isChecked ? '✓' : '□'}
                        </span>

                        {isChecked && stamp && (
                          <span className="text-[7px] text-[#F4B942] mt-0.5 leading-none scale-90 truncate max-w-full font-semibold">
                            {parsed?.date ? parsed.date.slice(5) : stamp.split('•')[0] || stamp}
                          </span>
                        )}

                        {isChecked && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenModifyModal(e, key)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-[#071B3B] shadow-xs flex items-center justify-center hover:scale-110 transition opacity-80 group-hover:opacity-100 border border-slate-200"
                            title="Modify completion date"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* SOM 1 to 20 Section */}
          {(() => {
            const somNums = Array.from({ length: 20 }, (_, i) => i + 1);
            const visibleSom =
              viewMode === 'dateOnly'
                ? somNums.filter((num) => {
                    const key = `SOM-${num}`;
                    const parsed = timestamps[key]
                      ? parseStampToDateAndTime(timestamps[key])
                      : null;
                    return somChecks.includes(key) && parsed?.date === selectedDate;
                  })
                : somNums;

            if (viewMode === 'dateOnly' && visibleSom.length === 0) return null;

            return (
              <div className="bg-white rounded-3xl p-5 border-2 border-amber-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-sm sm:text-base font-black text-amber-950 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#C59B27]" />
                    <span>{isTelugu ? 'మిషన్ ప్రసంగాలు (SOM 1 to 20 Checkboxes)' : 'SOM 1 to 20 Checkboxes'}</span>
                  </h3>
                  <span className="text-[11px] text-amber-900 font-bold bg-amber-100/90 px-3 py-1 rounded-xl border border-amber-200">
                    {isTelugu
                      ? 'మొదటి 4: 10 ⭐, తరువాత ప్రతి 2కి: 10 ⭐'
                      : '4 checks: 10 ⭐, then every 2 checks: 10 ⭐'}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
                  {visibleSom.map((num) => {
                    const key = `SOM-${num}`;
                    const isChecked = somChecks.includes(key);
                    const stamp = timestamps[key];
                    const parsed = stamp ? parseStampToDateAndTime(stamp) : null;
                    const isMatchingActiveDate = parsed?.date === selectedDate;
                    const isMilestone = milestoneKeys.has(key);

                    return (
                      <div
                        key={key}
                        onClick={() => toggleSomCheck(key)}
                        className={`relative group py-3 px-1 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-200 select-none cursor-pointer ${
                          isChecked
                            ? isMatchingActiveDate
                              ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-300 shadow-md scale-102 font-black ring-2 ring-amber-300'
                              : 'bg-amber-500 text-white border-amber-500 shadow-xs font-black'
                            : 'bg-amber-50/50 text-amber-900 border-amber-200 hover:bg-amber-100/60 active:scale-95'
                        }`}
                        title={
                          isChecked
                            ? `${key} completed on ${stamp} (Click to Modify Date)`
                            : `Click to record ${key} for ${selectedDate}`
                        }
                      >
                        {isChecked && isMilestone && (
                          <div
                            className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-white text-amber-800 flex items-center justify-center shadow-xs border border-amber-300 animate-pulse"
                            title="Milestone SOM! Earned +10 Stars on completion date"
                          >
                            <Star className="w-2.5 h-2.5 fill-amber-500" />
                          </div>
                        )}

                        <span className="text-xs font-black">{num}</span>
                        <span className="text-[10px] mt-0.5">{isChecked ? '✓' : '□'}</span>

                        {isChecked && stamp && (
                          <span className="text-[7px] text-amber-100 mt-0.5 leading-none scale-90 truncate max-w-full font-semibold">
                            {parsed?.date ? parsed.date.slice(5) : stamp.split('•')[0] || stamp}
                          </span>
                        )}

                        {isChecked && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenModifyModal(e, key)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white text-amber-800 shadow-xs flex items-center justify-center hover:scale-110 transition opacity-80 group-hover:opacity-100 border border-amber-200"
                            title="Modify completion date"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. Practice History by Date View */}
      {viewMode === 'history' && (
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-base font-extrabold text-[#071B3B] flex items-center gap-2">
                <History className="w-5 h-5 text-[#C59B27]" />
                <span>{isTelugu ? '📜 సాధన తేదీల చరిత్ర (Practice History)' : '📜 Practice History by Date'}</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isTelugu
                  ? 'ప్రతి పాఠం మరియు SOM పూర్తి చేసిన తేదీ, సమయం మరియు సాధించిన నక్షత్రాల సమగ్ర లాగ్'
                  : 'Chronological log of every lesson and SOM completed with date, time, and stars earned'}
              </p>
            </div>
            <span className="text-xs font-bold text-[#071B3B] bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
              {isTelugu ? 'మొత్తం సాధన రోజులు' : 'Total Active Days'}: {historyByDate.length}
            </span>
          </div>

          {historyByDate.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-500">
                {isTelugu ? 'ఇంకా పాఠాలు ఏవీ పూర్తి కాలేదు. గ్రిడ్‌లో పాఠాలను తనిఖీ చేయండి!' : 'No lessons completed yet. Check lessons in the grid above!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyByDate.map((group) => (
                <div
                  key={group.date}
                  className={`p-4 rounded-2xl border transition space-y-2.5 ${
                    group.stars > 0
                      ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                      : 'bg-slate-50/80 hover:bg-slate-100/60 border-slate-200'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        📅 {group.date}
                      </span>
                      {group.date === todayStr && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          {isTelugu ? 'నేడు (Today)' : 'Today'}
                        </span>
                      )}
                      {group.date === yesterdayStr && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          {isTelugu ? 'నిన్న (Yesterday)' : 'Yesterday'}
                        </span>
                      )}
                      <span className="text-xs font-bold text-[#071B3B] bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                        {group.count} {group.count === 1 ? 'lesson' : 'lessons'}
                      </span>

                      {group.stars > 0 ? (
                        <span className="text-xs font-black text-[#071B3B] bg-gradient-to-r from-amber-300 to-yellow-400 px-3 py-0.5 rounded-full border border-amber-400 shadow-2xs flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#071B3B] text-[#071B3B]" />
                          <span>+{group.stars} Stars Earned!</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">
                          (Progress towards next milestone)
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(group.date);
                        setViewMode('dateOnly');
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      className="text-xs text-[#071B3B] hover:text-[#C59B27] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isTelugu ? 'గ్రిడ్‌లో చూడండి' : 'View in Grid'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {group.items.map(({ key, isSom, time12 }) => {
                      const isMilestone = milestoneKeys.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={(e) => handleOpenModifyModal(e, key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer group hover:scale-102 ${
                            isMilestone
                              ? 'bg-[#071B3B] text-[#F4B942] border-2 border-[#F4B942]'
                              : isSom
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-white border border-slate-200 text-slate-800'
                          }`}
                          title={`Click to modify date for ${key}`}
                        >
                          <span>{key}</span>
                          {isMilestone && (
                            <Star className="w-3.5 h-3.5 fill-[#F4B942] text-[#F4B942]" />
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({time12})
                          </span>
                          <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-[#F4B942]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. Date Modification Modal */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#071B3B] text-[#F4B942] flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#071B3B]">
                    {isTelugu ? 'పూర్తయిన తేదీని మార్చండి' : 'Modify Completion Date'}
                  </h3>
                  <p className="text-[11px] text-[#C59B27] font-extrabold">
                    Lesson: {editingKey}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingKey(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Member: <strong className="text-slate-800">{selectedMemberName}</strong>
            </p>

            <form onSubmit={handleSaveModifiedDate} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">
                    {isTelugu ? 'పూర్తయిన తేదీ:' : 'Completion Date:'}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditDate(todayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditDate(yesterdayStr)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
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
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C59B27] bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1.5">
                  {isTelugu ? 'పూర్తయిన సమయం:' : 'Completion Time:'}
                </label>
                <input
                  type="time"
                  required
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#C59B27] bg-slate-50 text-slate-900 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
                <span className="text-[10px] font-bold text-amber-800 block uppercase">
                  {isTelugu ? 'ఫార్మాట్ చేసిన టైమ్‌స్టాంప్ ప్రివ్యూ:' : 'Formatted Timestamp Preview:'}
                </span>
                <span className="font-extrabold text-[#071B3B] font-mono text-[11px]">
                  📅 {createStampFromDateAndTime(editDate, time24To12(editTime))}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUncheckItem}
                  className="px-3.5 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
                  title="Remove this lesson from completed list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isTelugu ? 'తొలగించు' : 'Uncheck'}</span>
                </button>

                <div className="flex-1 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingKey(null)}
                    className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition cursor-pointer"
                  >
                    {isTelugu ? 'రద్దు' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isTelugu ? 'సేవ్ చేయండి' : 'Save Date'}</span>
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
