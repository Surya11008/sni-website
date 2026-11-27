import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getSaturdayToFridayWeek, formatDate, formatDateTime, formatTimeOnly, getPostSortTime } from '../utils/dateUtils';
import * as starCalc from '../utils/starCalculations';
import { TRANSLATIONS } from '../utils/translations';
import { isFirebaseConfigured } from '../firebase/firebaseConfig';
import {
  subscribeUsers,
  saveUserToFirestore,
  deleteUserFromFirestore,
  deleteUserFromRTDB,
  savePendingRegistrationToFirestore,
  subscribePendingRegistrations,
  removePendingRegistrationFromFirestore,
  markRegistrationApprovedInFirestore,
  getPendingRegistrationsFromFirestore,
  getAllUsersFromFirestore,
  subscribeAllActivities,
  saveMemberActivitiesToFirestore,
  subscribeNewsPosts,
  saveNewsPostToFirestore,
  deleteNewsPostFromFirestore,
  loadChunkedPostMedia,
  subscribeAdminNotices,
  saveAdminNoticeToFirestore,
  deleteAdminNoticeFromFirestore,
  subscribeGalleryMedia,
  saveGalleryMediaToFirestore,
  deleteGalleryMediaFromFirestore,
  subscribeEncouragementMessages,
  saveEncouragementMessageToFirestore,
  deleteEncouragementMessageFromFirestore,
  subscribeUserGospelDiary,
  saveUserGospelDiaryToFirestore,
  subscribeSharedFiles,
  saveSharedFileToFirestore,
  deleteSharedFileFromFirestore,
  getGlobalStateFromFirestore,
  saveGlobalStateToFirestore,
  subscribeGlobalState,
  updateUserPresence,
  subscribePresence,
  subscribeChildrenMedia,
  saveChildrenMediaToFirestore,
  deleteChildrenMediaFromFirestore,
  subscribeMediaCategories,
  saveMediaCategoriesToFirestore,
  saveManagerRoleToFirestore,
  removeManagerRoleFromFirestore,
  subscribeManagerRoles,
} from '../firebase/firestoreService';

import { INITIAL_DATA } from '../data/initialData.js';
import { speakStarEarned } from '../utils/soundEffects';
import {
  saveLocalFileData,
  deleteLocalFileData,
  saveLocalPostMedia,
  getLocalPostMedia,
  deleteLocalPostMedia,
} from '../utils/fileStorage';

const AppContext = createContext(null);

const STORAGE_KEY = 'star_galaxy_data_v2';
const SESSION_USER_KEY = 'star_galaxy_active_user_id';
const LANG_STORAGE_KEY = 'star_galaxy_lang';

export const OFFICIAL_ROLES = [
  { id: 'MEM', label: 'MEM', fullLabel: 'MEM — Member (Default)', description: 'General Member' },
  { id: 'EVA', label: 'EVA', fullLabel: 'EVA — Evangelist', description: 'Evangelist' },
  { id: 'CW', label: 'CW', fullLabel: 'CW — Co-Worker', description: 'Co-Worker' },
  { id: 'UL', label: 'UL', fullLabel: 'UL — Unit Leader', description: 'Unit Leader' },
  { id: 'GL', label: 'GL', fullLabel: 'GL — Group Leader', description: 'Group Leader' },
  { id: 'PTS', label: 'PTS', fullLabel: 'PTS — Pre-Theological Student', description: 'Pre-Theological Student' },
  { id: 'TS', label: 'TS', fullLabel: 'TS — Theological Student', description: 'Theological Student' },
  { id: 'PBCL', label: 'PBCL', fullLabel: 'PBCL — Pre-Branch Church Leader', description: 'Pre-Branch Church Leader' },
  { id: 'DEA', label: 'DEA', fullLabel: 'DEA — Deacon / Deaconess', description: 'Deacon / Deaconess' },
  { id: '(D) OS', label: '(D) OS', fullLabel: '(D) OS — Deputy Overseer', description: 'Deputy Overseer' },
  { id: 'OS', label: 'OS', fullLabel: 'OS — Overseer', description: 'Overseer' },
  { id: 'ADMIN', label: 'ADMIN', fullLabel: 'ADMIN — Administrator', description: 'System Administrator' },
];

export const OFFICIAL_ROLE_IDS = OFFICIAL_ROLES.map(r => r.id);

export function normalizeRole(role, userId) {
  if (String(userId).toLowerCase() === 'surya11008') return 'ADMIN';
  if (!role) return 'MEM';
  const str = String(role).trim();
  const upper = str.toUpperCase();
  if (upper === 'EVE') return 'EVA';
  if (OFFICIAL_ROLE_IDS.includes(upper)) return upper;
  if (upper === 'MEMBER' || upper === 'USER') return 'MEM';
  if (upper === 'ADMIN') return 'ADMIN';
  if (upper === 'MANAGER') return 'GL';
  if (upper === 'UL') return 'UL';
  return upper;
}

export function setUnifiedSession(user) {
  if (!user) return;
  const uid = user.userId || user.username || user.id;
  const cleanUser = {
    userId: uid,
    id: uid,
    username: uid,
    fullName: user.fullName || user.name || uid,
    name: user.fullName || user.name || uid,
    contact: user.contact || user.phone || user.gmail || '',
    phone: user.contact || user.phone || user.gmail || '',
    role: normalizeRole(user.role, uid),
    status: user.status || 'approved',
    joinedAt: user.registeredAt || user.createdAt || new Date().toISOString()
  };

  try {
    localStorage.setItem('sni_user_session', JSON.stringify(cleanUser));
    localStorage.setItem('sni_current_user', JSON.stringify(cleanUser));
    localStorage.setItem('sni_unified_session', JSON.stringify(cleanUser));
    localStorage.setItem('live_counter_current_user', JSON.stringify(cleanUser));
    localStorage.setItem(SESSION_USER_KEY, uid);
    sessionStorage.setItem('star_galaxy_pin_unlocked', 'true');

    const cookiePayload = encodeURIComponent(JSON.stringify(cleanUser));
    const maxAge = 365 * 24 * 60 * 60;
    document.cookie = `sni_unified_user=${cookiePayload}; Domain=.sni.org.in; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
    document.cookie = `sni_session_active=true; Domain=.sni.org.in; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`;
    document.cookie = `sni_unified_user=${cookiePayload}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    document.cookie = `sni_session_active=true; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch (e) {}
}

export function clearUnifiedSession() {
  try {
    localStorage.removeItem('sni_user_session');
    localStorage.removeItem('sni_current_user');
    localStorage.removeItem('sni_unified_session');
    localStorage.removeItem('live_counter_current_user');
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem('star_galaxy_active_tab');
    localStorage.removeItem('star_galaxy_selected_activity');
    sessionStorage.removeItem('star_galaxy_pin_unlocked');

    document.cookie = `sni_unified_user=; Domain=.sni.org.in; Path=/; Max-Age=0; SameSite=Lax; Secure`;
    document.cookie = `sni_session_active=; Domain=.sni.org.in; Path=/; Max-Age=0; SameSite=Lax; Secure`;
    document.cookie = `sni_unified_user=; Path=/; Max-Age=0; SameSite=Lax`;
    document.cookie = `sni_session_active=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch (e) {}
}

export function getStoredUnifiedUser(userList = []) {
  try {
    const savedUserId = localStorage.getItem(SESSION_USER_KEY);
    if (savedUserId) {
      const found = userList.find(u => 
        u.id === savedUserId || 
        (u.userId && String(u.userId).toLowerCase() === savedUserId.toLowerCase()) || 
        (u.username && String(u.username).toLowerCase() === savedUserId.toLowerCase())
      );
      if (found && found.status === 'approved') return found;
    }

    const stored = localStorage.getItem('sni_user_session') || localStorage.getItem('sni_unified_session') || localStorage.getItem('sni_current_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      const uid = parsed.userId || parsed.id || parsed.username;
      if (uid) {
        const found = userList.find(u => 
          u.id === uid || 
          (u.userId && String(u.userId).toLowerCase() === String(uid).toLowerCase()) || 
          (u.username && String(u.username).toLowerCase() === String(uid).toLowerCase())
        );
        if (found && found.status === 'approved') return found;
        if (parsed.status === 'approved' || parsed.role === 'admin') {
          return {
            id: uid,
            userId: uid,
            username: uid,
            name: parsed.fullName || parsed.name || uid,
            fullName: parsed.fullName || parsed.name || uid,
            role: parsed.role || 'member',
            status: 'approved',
            contact: parsed.contact || parsed.phone || ''
          };
        }
      }
    }

    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (const c of cookies) {
        const [k, v] = c.trim().split('=');
        if (k === 'sni_unified_user' && v) {
          try {
            const u = JSON.parse(decodeURIComponent(v));
            if (u && (u.userId || u.id)) {
              const uid = u.userId || u.id;
              const found = userList.find(x => 
                x.id === uid || 
                (x.userId && String(x.userId).toLowerCase() === String(uid).toLowerCase()) || 
                (x.username && String(x.username).toLowerCase() === String(uid).toLowerCase())
              );
              if (found && found.status === 'approved') return found;
              if (u.status === 'approved' || u.role === 'admin') {
                return {
                  id: uid,
                  userId: uid,
                  username: uid,
                  name: u.fullName || u.name || uid,
                  fullName: u.fullName || u.name || uid,
                  role: u.role || 'member',
                  status: 'approved',
                  contact: u.contact || u.phone || ''
                };
              }
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
  return null;
}

export function normalizeContact(contactStr) {
  if (!contactStr) return '';
  const trimmed = String(contactStr).trim().toLowerCase().replace(/\s+/g, '');
  if (trimmed.includes('@')) {
    return trimmed;
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    return digitsOnly.slice(-10);
  }
  return digitsOnly || trimmed;
}

export function contactsMatch(c1, c2) {
  if (!c1 || !c2) return false;
  const s1 = String(c1).trim().toLowerCase().replace(/\s+/g, '');
  const s2 = String(c2).trim().toLowerCase().replace(/\s+/g, '');
  if (s1 === s2) return true;

  if (s1.includes('@') || s2.includes('@')) {
    return s1 === s2;
  }

  const d1 = s1.replace(/\D/g, '');
  const d2 = s2.replace(/\D/g, '');
  if (d1 && d2) {
    if (d1 === d2) return true;
    const l1 = d1.length >= 10 ? d1.slice(-10) : d1;
    const l2 = d2.length >= 10 ? d2.slice(-10) : d2;
    if (l1 === l2) return true;
    if (d1.length >= 8 && d2.length >= 8 && (d1.endsWith(d2) || d2.endsWith(d1))) {
      return true;
    }
  }

  const n1 = normalizeContact(c1);
  const n2 = normalizeContact(c2);
  return Boolean(n1 && n2 && n1 === n2);
}

export function AppProvider({ children }) {
  // Multi-Language state (Default: 'en', with localStorage persistence)
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && saved !== 'te') return saved;
      // If legacy 'te' was saved, reset to English
      if (saved === 'te') {
        localStorage.removeItem(LANG_STORAGE_KEY);
      }
      return 'en';
    } catch (e) {
      return 'en';
    }
  });

  // Ensure any legacy translation cookies are cleaned up on mount
  useEffect(() => {
    try {
      if (document.cookie && document.cookie.includes('googtrans')) {
        if (document.cookie.includes('/te') || language === 'en') {
          document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';
          document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname + ';';
        }
      }
    } catch (e) {}
  }, [language]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {}
  };

  const t = (key) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict && dict[key] !== undefined) return dict[key];
    if (TRANSLATIONS.en && TRANSLATIONS.en[key] !== undefined) return TRANSLATIONS.en[key];
    return key;
  };

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure Admin user has ID surya11008 and password Suri742766.
        const adminIndex = parsed.users?.findIndex(u => u.role === 'admin' || u.id === 'surya11008');
        if (adminIndex !== -1 && parsed.users) {
          parsed.users[adminIndex].id = 'surya11008';
          parsed.users[adminIndex].username = 'surya11008';
          parsed.users[adminIndex].phone = 'surya11008';
          parsed.users[adminIndex].contact = 'surya11008';
          parsed.users[adminIndex].password = 'Suri742766.';
          parsed.users[adminIndex].name = 'Admin (Surya)';
          parsed.users[adminIndex].status = 'approved';
        } else if (parsed.users) {
          parsed.users.unshift(INITIAL_DATA.users[0]);
        }
        parsed.availableUpdate = { hasUpdate: false, version: '1.0.0' };
        parsed.dismissedUpdatePopup = true;
        if (!parsed.settings) parsed.settings = {};
        if (parsed.settings.autoUserApproval === undefined) {
          try {
            const storedAuto = localStorage.getItem('star_galaxy_auto_user_approval');
            parsed.settings.autoUserApproval = storedAuto !== null ? JSON.parse(storedAuto) : true;
          } catch (e) {
            parsed.settings.autoUserApproval = true;
          }
        }
        if (parsed.newsPosts && Array.isArray(parsed.newsPosts)) {
          parsed.newsPosts.sort((a, b) => {
            const diff = getPostSortTime(b) - getPostSortTime(a);
            if (diff !== 0) return diff;
            return String(b.id || '').localeCompare(String(a.id || ''));
          });
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading saved state:', e);
    }
    if (INITIAL_DATA.newsPosts && Array.isArray(INITIAL_DATA.newsPosts)) {
      INITIAL_DATA.newsPosts.sort((a, b) => {
        const diff = getPostSortTime(b) - getPostSortTime(a);
        if (diff !== 0) return diff;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
    }
    return INITIAL_DATA;
  });

  // Current logged in user (restored automatically from unified SNI session or null)
  const [currentUser, setCurrentUser] = useState(() => {
    return getStoredUnifiedUser(data.users || []);
  });

  // Cross-subdomain SSO & URL parameter session synchronization
  useEffect(() => {
    if (!currentUser) {
      const unified = getStoredUnifiedUser(data.users || []);
      if (unified) {
        setCurrentUser(unified);
        return;
      }
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const ssoUser = urlParams.get('sso_user');
        if (ssoUser) {
          const cleanSso = String(ssoUser).trim().toLowerCase();
          const matched = (data.users || []).find(u => 
            (u.id && u.id.toLowerCase() === cleanSso) ||
            (u.userId && u.userId.toLowerCase() === cleanSso) ||
            (u.username && u.username.toLowerCase() === cleanSso)
          );
          if (matched && matched.status === 'approved') {
            setUnifiedSession(matched);
            setCurrentUser(matched);
          }
        }
      } catch (e) {}
    }
  }, [data.users, currentUser]);

  // Target member being inspected/entered (for Admin/Manager view)
  const [selectedMemberId, setSelectedMemberId] = useState('surya11008');

  // Currently active tab (persisted in localStorage to keep tab strictly stable on any input)
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const saved = localStorage.getItem('star_galaxy_active_tab');
      if (saved && ['activities', 'status', 'more', 'settings', 'admin'].includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'activities';
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('star_galaxy_active_tab', tab);
    } catch (e) {}
  };

  // Global Date Filter for Status & Activities (Default: current Saturday to Friday)
  const [dateRange, setDateRange] = useState(() => {
    const cycle = getSaturdayToFridayWeek();
    return {
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    };
  });

  // PIN security lock state:
  // If currentUser is present, require PIN unlock unless already unlocked in this session
  // or unless user disabled PIN lock in Settings
  const [isPinLocked, setIsPinLockedState] = useState(() => {
    try {
      const savedUserId = localStorage.getItem(SESSION_USER_KEY);
      if (savedUserId) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const user = (parsed.users || []).find(u => u.id === savedUserId);
          if (user && user.pinLockEnabled === false) {
            return false;
          }
        }
        const isUnlocked = sessionStorage.getItem('star_galaxy_pin_unlocked') === 'true';
        return !isUnlocked;
      }
    } catch (e) {}
    return false;
  });

  const setIsPinLocked = (locked) => {
    setIsPinLockedState(locked);
    try {
      if (locked) {
        sessionStorage.removeItem('star_galaxy_pin_unlocked');
      } else {
        sessionStorage.setItem('star_galaxy_pin_unlocked', 'true');
      }
    } catch (e) {}
  };

  // Toggle user Personal PIN Lock ON / OFF
  const updatePinLockSetting = async (enabled) => {
    const isEnabled = Boolean(enabled);
    if (!currentUser) return { success: false, error: 'No active user' };

    const updatedUser = {
      ...currentUser,
      pinLockEnabled: isEnabled,
    };

    setCurrentUser(updatedUser);

    setData(prev => ({
      ...prev,
      users: (prev.users || []).map(u => u.id === currentUser.id ? updatedUser : u),
      settings: {
        ...(prev.settings || {}),
        pinLockEnabled: isEnabled,
      },
    }));

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        parsed.users = (parsed.users || []).map(u => u.id === currentUser.id ? updatedUser : u);
        if (!parsed.settings) parsed.settings = {};
        parsed.settings.pinLockEnabled = isEnabled;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    await saveUserToFirestore(updatedUser);
    setUnifiedSession(updatedUser);
    try {
      const uid = updatedUser.userId || updatedUser.username || updatedUser.id;
      const pwd = updatedUser.password || updatedUser.plainPassword;
      if (uid && pwd) {
        fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(String(uid).toLowerCase().replace(/[^a-z0-9_-]/g, ''))}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, fullName: updatedUser.fullName || updatedUser.name || uid })
        }).catch(() => {});
      }
    } catch (e) {}

    if (!isEnabled) {
      setIsPinLocked(false);
      sessionStorage.setItem('star_galaxy_pin_unlocked', 'true');
    }

    return { success: true, enabled: isEnabled };
  };
  const [showUpdateModal, setShowUpdateModal] = useState(false); // No version update popups
  const [showPendingApprovalsModal, setShowPendingApprovalsModal] = useState(false);

  // 👁️ Track Viewed Notices & News Posts per member so seen items never notify again
  const [viewedNoticeIds, setViewedNoticeIds] = useState(() => {
    try {
      const savedUserId = localStorage.getItem(SESSION_USER_KEY) || 'guest';
      const saved = localStorage.getItem(`star_galaxy_viewed_notices_${savedUserId}`);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set();
  });

  const [viewedNewsIds, setViewedNewsIds] = useState(() => {
    try {
      const savedUserId = localStorage.getItem(SESSION_USER_KEY) || 'guest';
      const saved = localStorage.getItem(`star_galaxy_viewed_news_${savedUserId}`);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set();
  });

  // Re-sync viewed sets when currentUser changes (e.g. on login/logout)
  useEffect(() => {
    if (!currentUser?.id) {
      setViewedNoticeIds(new Set());
      setViewedNewsIds(new Set());
      return;
    }
    try {
      const savedNotices = localStorage.getItem(`star_galaxy_viewed_notices_${currentUser.id}`);
      setViewedNoticeIds(savedNotices ? new Set(JSON.parse(savedNotices)) : new Set());

      const savedNews = localStorage.getItem(`star_galaxy_viewed_news_${currentUser.id}`);
      setViewedNewsIds(savedNews ? new Set(JSON.parse(savedNews)) : new Set());
    } catch (e) {}
  }, [currentUser?.id]);

  const markNoticeAsViewed = (noticeId) => {
    if (!noticeId) return;
    const uId = currentUser?.id || 'guest';
    setViewedNoticeIds(prev => {
      const next = new Set(prev);
      next.add(noticeId);
      try {
        localStorage.setItem(`star_galaxy_viewed_notices_${uId}`, JSON.stringify([...next]));
      } catch (e) {}
      return next;
    });
  };

  const markAllNoticesAsViewed = () => {
    const uId = currentUser?.id || 'guest';
    const allIds = (data.adminNotices || []).map(n => n.id || n._id || n.date).filter(Boolean);
    if (allIds.length === 0) return;
    setViewedNoticeIds(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      try {
        localStorage.setItem(`star_galaxy_viewed_notices_${uId}`, JSON.stringify([...next]));
      } catch (e) {}
      return next;
    });
  };

  const markNewsAsViewed = (newsId) => {
    if (!newsId) return;
    const uId = currentUser?.id || 'guest';
    setViewedNewsIds(prev => {
      const next = new Set(prev);
      next.add(newsId);
      try {
        localStorage.setItem(`star_galaxy_viewed_news_${uId}`, JSON.stringify([...next]));
      } catch (e) {}
      return next;
    });
  };

  const markAllNewsAsViewed = () => {
    const uId = currentUser?.id || 'guest';
    const allIds = (data.newsPosts || []).map(p => p.id || p._id || p.timestamp).filter(Boolean);
    if (allIds.length === 0) return;
    setViewedNewsIds(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      try {
        localStorage.setItem(`star_galaxy_viewed_news_${uId}`, JSON.stringify([...next]));
      } catch (e) {}
      return next;
    });
  };

  // Unviewed lists and counts
  const unviewedNotices = useMemo(() => {
    return (data.adminNotices || []).filter(n => !viewedNoticeIds.has(n.id || n._id || n.date));
  }, [data.adminNotices, viewedNoticeIds]);

  const unviewedNews = useMemo(() => {
    return (data.newsPosts || []).filter(p => !viewedNewsIds.has(p.id || p._id || p.timestamp));
  }, [data.newsPosts, viewedNewsIds]);

  const unreadNoticeCount = unviewedNotices.length;
  const unreadNewsCount = unviewedNews.length;

  // Save changes to localStorage (safely guarded against 5MB quota)
  useEffect(() => {
    try {
      const safeData = {
        ...data,
        sharedFiles: (data.sharedFiles || []).map(f => {
          if (f.fileUrl && typeof f.fileUrl === 'string' && f.fileUrl.startsWith('data:') && f.fileUrl.length > 50000) {
            return { ...f, fileUrl: '', originalUrl: '' };
          }
          return f;
        }),
        newsPosts: (data.newsPosts || []).map(p => {
          const mediaStr = JSON.stringify(p.mediaItems || []);
          if (mediaStr.length > 60000) {
            // Keep first media item preview only for localStorage; full items are persisted in IndexedDB & Firestore chunks
            return {
              ...p,
              mediaItems: (p.mediaItems || []).slice(0, 1),
            };
          }
          return p;
        }),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));
    } catch (e) {
      console.warn('LocalStorage quota or save error (handled):', e);
    }
  }, [data]);

  // Keep currentUser synced with data.users
  useEffect(() => {
    if (currentUser) {
      const updated = data.users.find(u => u.id === currentUser.id);
      if (updated) setCurrentUser(updated);
    }
  }, [data.users]);

  // 🔄 Realtime Central Database Sync via /api/state (With User-Isolated Gospel Diary)
  useEffect(() => {
    let isMounted = true;
    const syncStateFromServer = async () => {
      try {
        const query = currentUser?.id ? `?userId=${encodeURIComponent(currentUser.id)}` : '';
        const res = await fetch(`/api/state${query}`, {
          headers: currentUser?.id ? { 'x-user-id': currentUser.id } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setData(prev => {
              const managerIds = new Set(
                JSON.parse(localStorage.getItem('star_galaxy_manager_user_ids') || '[]')
              );
              const preservedUsers = (json.data.users || []).map(u => {
                const isManager = (u.role === 'manager' || managerIds.has(u.id)) && u.id !== 'surya11008';
                return {
                  ...u,
                  role: u.role === 'admin' || u.id === 'surya11008' ? 'admin' : (isManager ? 'manager' : u.role),
                };
              });

              const prevStr = JSON.stringify({
                users: prev.users,
                activities: prev.activitiesData,
                news: prev.newsPosts,
                messages: prev.encouragementMessages,
                notices: prev.adminNotices,
                gallery: prev.galleryMedia,
                feedback: prev.feedbackList,
                diary: prev.gospelDiary,
              });
              const newStr = JSON.stringify({
                users: preservedUsers,
                activities: json.data.activitiesData,
                news: json.data.newsPosts,
                messages: json.data.encouragementMessages,
                notices: json.data.adminNotices,
                gallery: json.data.galleryMedia,
                feedback: json.data.feedbackList,
                diary: json.data.gospelDiary,
              });
              if (prevStr !== newStr) {
                return {
                  ...json.data,
                  users: preservedUsers,
                  settings: prev.settings,
                  availableUpdate: { hasUpdate: false, version: '1.0.0' },
                  dismissedUpdatePopup: true,
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {}
    };

    syncStateFromServer();
    const interval = setInterval(syncStateFromServer, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  // Realtime Firebase Cloud Firestore Sync (when configured)
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    // 1. Initial hydration from global cloud snapshot if needed
    getGlobalStateFromFirestore().then(cloudState => {
      if (cloudState) {
        setData(prev => {
          const userMap = new Map((prev.users || []).map(u => [u.id, u]));
          const managerIds = new Set(
            JSON.parse(localStorage.getItem('star_galaxy_manager_user_ids') || '[]')
          );
          if (cloudState.users && Array.isArray(cloudState.users)) {
            cloudState.users.forEach(u => {
              const existing = userMap.get(u.id);
              const isManager = (existing?.role === 'manager' || u.role === 'manager' || managerIds.has(u.id)) && u.id !== 'surya11008';
              const role = u.role === 'admin' || u.id === 'surya11008' ? 'admin' : (isManager ? 'manager' : (u.role || existing?.role || 'member'));
              userMap.set(u.id, {
                ...(existing || {}),
                ...u,
                role,
                assignedManagerIds: Array.isArray(u.assignedManagerIds)
                  ? u.assignedManagerIds
                  : (u.assignedManagerId ? [u.assignedManagerId] : (Array.isArray(existing?.assignedManagerIds) ? existing.assignedManagerIds : (existing?.assignedManagerId ? [existing.assignedManagerId] : []))),
                assignedManagerId: u.assignedManagerId || (Array.isArray(u.assignedManagerIds) && u.assignedManagerIds[0]) || existing?.assignedManagerId || '',
                assignedMembers: Array.isArray(u.assignedMembers) && u.assignedMembers.length > 0 ? u.assignedMembers : (existing?.assignedMembers || []),
              });
            });
          }
          return {
            ...prev,
            ...cloudState,
            users: Array.from(userMap.values()),
            activitiesData: { ...prev.activitiesData, ...cloudState.activitiesData },
            adminNotices: cloudState.adminNotices || prev.adminNotices,
            newsPosts: (cloudState.newsPosts || prev.newsPosts || []).slice().sort((a, b) => {
              const diff = getPostSortTime(b) - getPostSortTime(a);
              if (diff !== 0) return diff;
              return String(b.id || '').localeCompare(String(a.id || ''));
            }),
          };
        });
      }
    }).catch(() => {});

    // 2. Realtime collection listeners
    const unsubUsers = subscribeUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        const approvedIds = new Set(
          JSON.parse(localStorage.getItem('star_galaxy_approved_user_ids') || '[]')
        );
        const managerIds = new Set(
          JSON.parse(localStorage.getItem('star_galaxy_manager_user_ids') || '[]')
        );

        setData(prev => {
          const prevMap = new Map((prev.users || []).map(u => [u.id, u]));
          const userMap = new Map();
          // Build from incoming cloud users, ALWAYS preserving approved status, manager status, passwords, and assignments
          cloudUsers.forEach(u => {
            const existing = prevMap.get(u.id);
            const isApproved = (u.id === 'surya11008' || u.role === 'admin' || u.role === 'ADMIN')
              ? true
              : (u.status === 'approved');
            const role = normalizeRole(u.role || existing?.role, u.id);
            const isManager = (['GL', 'UL', 'PTS', 'TS', 'PBCL', 'DEA', '(D) OS', 'OS', 'manager'].includes(role) || (Array.isArray(u.assignedMembers) && u.assignedMembers.length > 0) || managerIds.has(u.id)) && u.id !== 'surya11008';

            if (isManager && !managerIds.has(u.id)) {
              managerIds.add(u.id);
              try {
                localStorage.setItem('star_galaxy_manager_user_ids', JSON.stringify(Array.from(managerIds)));
              } catch (e) {}
            }

            const isContactVerified = (u.id === 'surya11008' || u.role === 'admin' || u.role === 'ADMIN') ? true : (u.contactVerified === true || u.isVerified === true);

            userMap.set(u.id, {
              ...(existing || {}),
              ...u,
              password: u.password || existing?.password || '',
              plainPassword: u.password || existing?.password || '',
              personalPin: u.personalPin !== undefined ? u.personalPin : (existing?.personalPin || ''),
              role,
              assignedManagerIds: Array.isArray(u.assignedManagerIds)
                ? u.assignedManagerIds
                : (u.assignedManagerId ? [u.assignedManagerId] : (Array.isArray(existing?.assignedManagerIds) ? existing.assignedManagerIds : (existing?.assignedManagerId ? [existing.assignedManagerId] : []))),
              assignedManagerId: u.assignedManagerId || (Array.isArray(u.assignedManagerIds) && u.assignedManagerIds[0]) || existing?.assignedManagerId || '',
              assignedMembers: Array.isArray(u.assignedMembers) && u.assignedMembers.length > 0 ? u.assignedMembers : (existing?.assignedMembers || []),
              contactVerified: isContactVerified,
              isVerified: isContactVerified,
              status: isApproved ? 'approved' : (u.status || (isContactVerified ? 'pending' : 'unverified')),
            });
          });

          // Always ensure surya11008 is present
          if (!userMap.has('surya11008')) {
            const admin = prevMap.get('surya11008') || INITIAL_DATA.users[0];
            userMap.set('surya11008', admin);
          }

          return {
            ...prev,
            users: Array.from(userMap.values()),
          };
        });

        // Also keep active currentUser synchronized
        setCurrentUser(curr => {
          if (!curr) return null;
          const fresh = cloudUsers.find(u => u.id === curr.id);
          if (fresh) {
            const role = normalizeRole(fresh.role || curr.role, curr.id);
            const isManager = (['GL', 'UL', 'PTS', 'TS', 'PBCL', 'DEA', '(D) OS', 'OS', 'manager'].includes(role) || (Array.isArray(fresh.assignedMembers) && fresh.assignedMembers.length > 0) || managerIds.has(curr.id)) && curr.id !== 'surya11008';
            const freshMgrIds = Array.isArray(fresh.assignedManagerIds)
              ? fresh.assignedManagerIds
              : (fresh.assignedManagerId ? [fresh.assignedManagerId] : (Array.isArray(curr.assignedManagerIds) ? curr.assignedManagerIds : (curr.assignedManagerId ? [curr.assignedManagerId] : [])));
            return {
              ...curr,
              ...fresh,
              password: fresh.password || curr.password,
              plainPassword: fresh.password || curr.password,
              personalPin: fresh.personalPin !== undefined ? fresh.personalPin : curr.personalPin,
              role,
              assignedManagerIds: freshMgrIds,
              assignedManagerId: fresh.assignedManagerId !== undefined ? fresh.assignedManagerId : (freshMgrIds[0] || curr.assignedManagerId || ''),
              assignedMembers: Array.isArray(fresh.assignedMembers) && fresh.assignedMembers.length > 0 ? fresh.assignedMembers : curr.assignedMembers,
            };
          }
          return curr;
        });
      }
    });

    // 2a. Realtime Dedicated Manager Roles Listener
    const unsubManagers = subscribeManagerRoles((mgrList) => {
      if (mgrList && Array.isArray(mgrList)) {
        const cloudMgrIds = new Set(mgrList.filter(m => m.isManager !== false).map(m => m.id));
        const savedMgrs = new Set(JSON.parse(localStorage.getItem('star_galaxy_manager_user_ids') || '[]'));
        cloudMgrIds.forEach(id => savedMgrs.add(id));
        try {
          localStorage.setItem('star_galaxy_manager_user_ids', JSON.stringify(Array.from(savedMgrs)));
        } catch (e) {}

        setData(prev => ({
          ...prev,
          users: (prev.users || []).map(u => {
            if (cloudMgrIds.has(u.id) && u.id !== 'surya11008') {
              const mgrInfo = mgrList.find(m => m.id === u.id);
              return {
                ...u,
                role: (u.role && u.role !== 'MEM' && u.role !== 'member') ? normalizeRole(u.role, u.id) : (mgrInfo?.role || 'GL'),
                assignedMembers: Array.isArray(mgrInfo?.assignedMembers) && mgrInfo.assignedMembers.length > 0
                  ? mgrInfo.assignedMembers
                  : (u.assignedMembers || []),
              };
            }
            return u;
          }),
        }));

        setCurrentUser(curr => {
          if (!curr) return null;
          if (cloudMgrIds.has(curr.id) && curr.id !== 'surya11008') {
            const mgrInfo = mgrList.find(m => m.id === curr.id);
            return {
              ...curr,
              role: (curr.role && curr.role !== 'MEM' && curr.role !== 'member') ? normalizeRole(curr.role, curr.id) : (mgrInfo?.role || 'GL'),
              assignedMembers: Array.isArray(mgrInfo?.assignedMembers) && mgrInfo.assignedMembers.length > 0
                ? mgrInfo.assignedMembers
                : (curr.assignedMembers || []),
            };
          }
          return curr;
        });
      }
    });

    // 2b. Realtime Pending Registrations Listener (Never miss a single applicant!)
    const unsubPending = subscribePendingRegistrations((pendingList) => {
      const approvedIds = new Set(
        JSON.parse(localStorage.getItem('star_galaxy_approved_user_ids') || '[]')
      );
      setData(prev => {
        const userMap = new Map((prev.users || []).map(u => [u.id, u]));
        const pendingItems = Array.isArray(pendingList) ? pendingList : [];

        pendingItems.forEach(p => {
          if (!p || !p.id) return;
          if (approvedIds.has(p.id) || userMap.get(p.id)?.status === 'approved') {
            // Already approved! Remove from Firestore pending_registrations
            removePendingRegistrationFromFirestore(p.id).catch(() => {});
            return;
          }
          if (p.status === 'unverified') {
            removePendingRegistrationFromFirestore(p.id).catch(() => {});
            return;
          }
          const existing = userMap.get(p.id);
          userMap.set(p.id, {
            ...(existing || {}),
            ...p,
            status: 'pending',
            phoneVerified: true,
            contactVerified: true,
            isVerified: true
          });
        });

        return {
          ...prev,
          users: Array.from(userMap.values()),
        };
      });
    });

    // Clean up local storage: remove approved users from pending queues
    try {
      const approvedIds = new Set(
        JSON.parse(localStorage.getItem('star_galaxy_approved_user_ids') || '[]')
      );
      const savedPending = JSON.parse(localStorage.getItem('star_galaxy_pending_users') || '[]');
      if (Array.isArray(savedPending) && savedPending.length > 0) {
        const remainingPending = savedPending.filter(pu => pu && pu.id && !approvedIds.has(pu.id) && pu.status === 'pending');
        localStorage.setItem('star_galaxy_pending_users', JSON.stringify(remainingPending));
      }
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed.users)) {
          let modified = false;
          parsed.users = parsed.users.map(u => {
            if (u && approvedIds.has(u.id) && u.status !== 'approved') {
              modified = true;
              return { ...u, status: 'approved' };
            }
            return u;
          });
          if (modified) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {}

    const unsubNews = subscribeNewsPosts(async (cloudNews) => {
      if (cloudNews && cloudNews.length > 0) {
        // Hydrate chunked posts or restore local media from IndexedDB
        const resolvedNews = await Promise.all(
          cloudNews.map(async (p) => {
            // First check if this client already has full media in local IndexedDB
            const localMedia = await getLocalPostMedia(p.id);
            if (localMedia && localMedia.length > 0) {
              return { ...p, mediaItems: localMedia };
            }
            // If post was chunked in Firestore, fetch the full chunks
            if (p.isChunked && p.totalChunks > 0) {
              const fullMedia = await loadChunkedPostMedia(p.id, p.totalChunks);
              if (fullMedia && fullMedia.length > 0) {
                saveLocalPostMedia(p.id, fullMedia).catch(() => {});
                return { ...p, mediaItems: fullMedia };
              }
            }
            return p;
          })
        );

        setData(prev => {
          const cloudIds = new Set(resolvedNews.map(p => p.id));
          const localOnly = (prev.newsPosts || []).filter(p => !cloudIds.has(p.id));
          const all = [...resolvedNews, ...localOnly];
          all.sort((a, b) => {
            const diff = getPostSortTime(b) - getPostSortTime(a);
            if (diff !== 0) return diff;
            return String(b.id || '').localeCompare(String(a.id || ''));
          });
          return { ...prev, newsPosts: all };
        });
      }
    });

    const unsubNotices = subscribeAdminNotices((cloudNotices) => {
      if (cloudNotices && cloudNotices.length > 0) {
        setData(prev => ({ ...prev, adminNotices: cloudNotices }));
      }
    });

    const unsubGallery = subscribeGalleryMedia((cloudGallery) => {
      if (cloudGallery && cloudGallery.length > 0) {
        setData(prev => ({ ...prev, galleryMedia: cloudGallery }));
      }
    });

    const unsubMessages = subscribeEncouragementMessages((cloudMsgs) => {
      if (cloudMsgs && cloudMsgs.length > 0) {
        setData(prev => ({ ...prev, encouragementMessages: cloudMsgs }));
      }
    });

    const unsubActivities = subscribeAllActivities((cloudActivities) => {
      if (cloudActivities && Object.keys(cloudActivities).length > 0) {
        setData(prev => ({
          ...prev,
          activitiesData: { ...prev.activitiesData, ...cloudActivities },
        }));
      }
    });

    const unsubSharedFiles = subscribeSharedFiles((cloudFiles) => {
      if (Array.isArray(cloudFiles)) {
        setData(prev => {
          const existingMap = new Map((prev.sharedFiles || []).map(f => [f.id, f]));
          const merged = cloudFiles.map(cf => {
            const local = existingMap.get(cf.id);
            if (local && local.fileUrl && !cf.fileUrl) {
              return { ...cf, fileUrl: local.fileUrl, originalUrl: local.originalUrl || local.fileUrl };
            }
            return cf;
          });
          return { ...prev, sharedFiles: merged };
        });
      }
    });

    const unsubPresence = subscribePresence((presenceMap) => {
      setData(prev => ({ ...prev, presence: presenceMap }));
    });

    const unsubChildrenMedia = subscribeChildrenMedia((cloudChildren) => {
      if (cloudChildren && cloudChildren.length > 0) {
        setData(prev => ({ ...prev, childrenMedia: cloudChildren }));
      }
    });

    const unsubCategories = subscribeMediaCategories((cats) => {
      if (cats && cats.length > 0) {
        setData(prev => ({ ...prev, mediaCategories: cats }));
      }
    });

    const unsubGlobal = subscribeGlobalState((cloudGlobal) => {
      if (cloudGlobal) {
        setData(prev => ({
          ...prev,
          managerPermissions: cloudGlobal.managerPermissions || prev.managerPermissions,
          memberPermissions: cloudGlobal.memberPermissions || prev.memberPermissions,
          settings: {
            ...prev.settings,
            ...(cloudGlobal.settings || {}),
            autoUserApproval: cloudGlobal.settings?.autoUserApproval !== undefined
              ? cloudGlobal.settings.autoUserApproval
              : (prev.settings?.autoUserApproval !== undefined ? prev.settings.autoUserApproval : true),
          },
        }));
      }
    });

    return () => {
      unsubUsers();
      unsubPending();
      unsubNews();
      unsubNotices();
      unsubGallery();
      unsubMessages();
      unsubActivities();
      unsubSharedFiles();
      unsubPresence();
      unsubChildrenMedia();
      unsubCategories();
      unsubGlobal();
    };
  }, []);

  // 🟢 Live Presence Heartbeat for Active Online User Tracking
  useEffect(() => {
    if (!currentUser?.id) return;
    updateUserPresence(currentUser.id);
    const interval = setInterval(() => {
      updateUserPresence(currentUser.id);
    }, 45000);
    const onUserActive = () => {
      updateUserPresence(currentUser.id);
    };
    window.addEventListener('focus', onUserActive);
    window.addEventListener('click', onUserActive);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onUserActive);
      window.removeEventListener('click', onUserActive);
    };
  }, [currentUser?.id]);

  // Realtime Gospel Diary Sync for the active member
  useEffect(() => {
    if (!isFirebaseConfigured() || !currentUser?.id) return;
    const unsubDiary = subscribeUserGospelDiary(currentUser.id, (entries) => {
      if (Array.isArray(entries)) {
        setData(prev => ({
          ...prev,
          gospelDiary: {
            ...prev.gospelDiary,
            [currentUser.id]: entries,
          },
        }));
      }
    });
    return () => unsubDiary();
  }, [currentUser?.id]);

  // 🎨 Realtime Lights (Theme) & Font Engine
  useEffect(() => {
    const settings = data.settings || {};
    const theme = settings.theme || 'light';
    const fontSize = settings.fontSize || 'normal';
    const fontStyle = settings.fontStyle || 'sans';

    // 1. Resolve Lights Mode
    let activeTheme = theme;
    if (theme === 'system') {
      const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = isSystemDark ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', activeTheme);
    document.body.setAttribute('data-theme', activeTheme);

    // 2. Resolve Font Size Scale
    const scaleMap = {
      xs: 0.84,
      small: 0.92,
      normal: 1.0,
      large: 1.10,
      xl: 1.20,
      xxl: 1.32,
      'too large': 1.32,
    };
    const scale = scaleMap[fontSize.toLowerCase()] || 1.0;
    document.documentElement.style.setProperty('--app-font-scale', scale);
    document.documentElement.setAttribute('data-font-size', fontSize.toLowerCase());

    // 3. Resolve Font Style (Typeface)
    document.documentElement.setAttribute('data-font', fontStyle.toLowerCase());
    document.body.setAttribute('data-font', fontStyle.toLowerCase());

    // Listen to system theme changes if 'system' theme is selected
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.body.setAttribute('data-theme', newTheme);
      };
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, [data.settings?.theme, data.settings?.fontSize, data.settings?.fontStyle]);

  // Settings Actions
  const updateSettings = (newSettings) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  };

  const updateAutoUserApproval = async (enabled) => {
    const isEnabled = Boolean(enabled);
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        autoUserApproval: isEnabled,
      },
    }));

    try {
      localStorage.setItem('star_galaxy_auto_user_approval', JSON.stringify(isEnabled));
    } catch (e) {}

    try {
      await saveGlobalStateToFirestore({
        settings: {
          ...(data.settings || {}),
          autoUserApproval: isEnabled,
        },
      });
    } catch (e) {
      console.error('Error saving auto user approval to Firestore:', e);
    }

    return isEnabled;
  };

  const isUserAdmin = (user = currentUser) => {
    if (!user) return false;
    return String(user.id || '').toLowerCase() === 'surya11008' || String(user.role || '').toUpperCase() === 'ADMIN';
  };

  const isUserLeader = (user = currentUser) => {
    if (!user) return false;
    if (isUserAdmin(user)) return true;
    if (Array.isArray(user.assignedMembers) && user.assignedMembers.length > 0) return true;
    const r = String(user.role || '').toUpperCase();
    return ['GL', 'UL', 'PTS', 'TS', 'PBCL', 'DEA', '(D) OS', 'OS', 'MANAGER'].includes(r);
  };

  const switchUser = (userId) => {
    const user = data.users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(SESSION_USER_KEY, user.id);
      if (isUserLeader(user)) {
        const firstAssigned = user.assignedMembers?.[0] || user.id;
        setSelectedMemberId(firstAssigned);
      } else {
        setSelectedMemberId(user.id);
      }
    }
  };

  const canEditMember = (targetMemberId = selectedMemberId) => {
    if (!currentUser) return false;
    // Admin can edit/input for anyone
    if (isUserAdmin(currentUser)) return true;
    // Leader/Manager can edit/input for themselves, or anyone assigned to them
    if (isUserLeader(currentUser)) {
      if (targetMemberId === currentUser.id) return true;
      const assigned = Array.isArray(currentUser.assignedMembers) ? currentUser.assignedMembers : [];
      if (assigned.includes(targetMemberId)) return true;
      const targetUser = (data?.users || []).find(u => u.id === targetMemberId);
      const targetMgrIds = Array.isArray(targetUser?.assignedManagerIds)
        ? targetUser.assignedManagerIds
        : (targetUser?.assignedManagerId ? [targetUser.assignedManagerId] : []);
      if (targetMgrIds.includes(currentUser.id)) return true;
      return false;
    }
    // Regular Member can edit/input ONLY their OWN activities!
    return targetMemberId === currentUser.id;
  };

  // 🛡️ Helper: Check if a user is permitted to modify historical/past records or backdate entries
  // - Admin: ALWAYS allowed
  // - Manager: Default to Today Only; Admin can configure in Admin Tab (Manager Permissions)
  // - Member: Default to Today Only; Admin can configure in Admin Tab (Member Permissions)
  const canUserModifyPastDates = (user = currentUser, targetDate = null) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (targetDate) {
      return isDateAllowedForInput(targetDate, user);
    }

    const checkPerm = (perm) => {
      if (!perm) return false; // Default: Today Only
      if (perm.mode === 'today_only' || perm.allowPastDates === false) return false;
      if (perm.mode === 'allow_past_dates' || perm.allowPastDates === true || perm.mode === 'all_dates') {
        return true;
      }
      if (perm.mode === 'days_limit' || perm.mode === 'custom_range') {
        return true;
      }
      return false;
    };

    if (user.role === 'manager') {
      return checkPerm(data.managerPermissions?.[user.id]);
    }
    if (user.role === 'member') {
      return checkPerm(data.memberPermissions?.[user.id]);
    }
    return false;
  };

  const isDateAllowedForInput = (targetDate, user = currentUser) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const today = formatDate(new Date());

    const checkPerm = (perm) => {
      if (!perm || perm.mode === 'today_only' || perm.allowPastDates === false) {
        return targetDate === today; // Default: Today Only!
      }
      if (perm.mode === 'allow_past_dates' || perm.allowPastDates === true || perm.mode === 'all_dates') {
        return true;
      }
      if (perm.mode === 'days_limit') {
        const maxDays = Number(perm.maxDays) || 7;
        const now = new Date();
        const minDate = new Date(now);
        minDate.setDate(minDate.getDate() - maxDays);
        const minDateStr = formatDate(minDate);
        return targetDate >= minDateStr && targetDate <= today;
      }
      if (perm.mode === 'custom_range') {
        const start = perm.customStartDate || today;
        const end = perm.customEndDate || today;
        return targetDate >= start && targetDate <= end;
      }
      return targetDate === today;
    };

    if (user.role === 'manager') {
      return checkPerm(data.managerPermissions?.[user.id]);
    }
    if (user.role === 'member') {
      return checkPerm(data.memberPermissions?.[user.id]);
    }
    return targetDate === today;
  };

  const isPasswordMatch = (u, cleanPass) => {
    if (!u || cleanPass === undefined || cleanPass === null) return false;
    const p1 = String(u.password || '').trim();
    const p3 = String(u.plainPassword || '').trim();
    return (p1 && p1 === cleanPass) || (p3 && p3 === cleanPass);
  };

  const findUserCandidate = (userList, identifier, cleanPass) => {
    if (!userList || !Array.isArray(userList)) return null;
    const cleanId = String(identifier || '').trim().toLowerCase();
    const noSpaceId = cleanId.replace(/\s+/g, '');

    // 1. Direct or space-trimmed match by username, user ID, or email
    let user = userList.find(u => {
      const uUser = String(u.username || '').trim().toLowerCase();
      const uId = String(u.id || '').trim().toLowerCase();
      const uEmail = String(u.email || '').trim().toLowerCase();
      return uUser === cleanId || uId === cleanId || uEmail === cleanId ||
             (uUser && uUser.replace(/\s+/g, '') === noSpaceId) ||
             (uId && uId.replace(/\s+/g, '') === noSpaceId);
    });

    // 2. If entered Phone or Contact, prioritize user whose password matches!
    if (!user) {
      user = userList.find(u => 
        (contactsMatch(u.phone, cleanId) || contactsMatch(u.contact, cleanId)) &&
        isPasswordMatch(u, cleanPass)
      );
    }

    // 3. Fallback: match any user with that contact
    if (!user) {
      user = userList.find(u => 
        contactsMatch(u.phone, cleanId) || contactsMatch(u.contact, cleanId)
      );
    }

    return user;
  };

  const login = async (identifier, password) => {
    const cleanPass = String(password || '').trim();
    const cleanId = String(identifier || '').trim().toLowerCase();

    // 1. Check special Admin Credentials
    const validAdminIds = ['surya11008', 'admin', 'surya'];
    const validAdminPasswords = [
      'suri742766.', 'surya742766.', 'suri742766', 'surya742766', 'admin'
    ];
    if (validAdminIds.includes(cleanId) && validAdminPasswords.includes(cleanPass.toLowerCase().replace(/\.$/, ''))) {
      let adminUser = (data.users || []).find(u => u.id === 'surya11008' || (u.userId && u.userId.toLowerCase() === 'surya11008'));
      if (!adminUser) {
        adminUser = {
          id: 'surya11008',
          userId: 'surya11008',
          username: 'surya11008',
          name: 'Admin (Surya)',
          fullName: 'Admin (Surya)',
          role: 'admin',
          status: 'approved',
          password: cleanPass,
          plainPassword: cleanPass
        };
      }
      setUnifiedSession(adminUser);
      setCurrentUser(adminUser);
      return { success: true, user: adminUser };
    }

    // 2. Look in local React state first
    let user = findUserCandidate(data.users || [], identifier, cleanPass);

    // 3. If not found or password doesn't match locally, fetch directly from Firestore in real-time!
    if (!user || !isPasswordMatch(user, cleanPass)) {
      try {
        const liveUsers = await getAllUsersFromFirestore();
        if (liveUsers && liveUsers.length > 0) {
          setData(prev => {
            const userMap = new Map((prev.users || []).map(u => [u.id, u]));
            liveUsers.forEach(lu => userMap.set(lu.id, { ...(userMap.get(lu.id) || {}), ...lu }));
            return {
              ...prev,
              users: Array.from(userMap.values()),
            };
          });

          const cloudMatch = findUserCandidate(liveUsers, identifier, cleanPass);
          if (cloudMatch) {
            user = cloudMatch;
          }
        }
      } catch (err) {
        console.warn('Real-time Firestore login check fallback:', err);
      }
    }

    // 4. If still not found, check unified Cloud RTDB!
    if (!user || !isPasswordMatch(user, cleanPass)) {
      try {
        const rtdbKey = encodeURIComponent(cleanId.replace(/[^a-z0-9_-]/g, ''));
        const rtdbRes = await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${rtdbKey}.json`);
        if (rtdbRes.ok) {
          const rtdbUser = await rtdbRes.json();
          if (rtdbUser && (rtdbUser.password === cleanPass || rtdbUser.plainPassword === cleanPass)) {
            const isAdm = cleanId === 'surya11008' || rtdbUser.role === 'admin' || rtdbUser.role === 'ADMIN';
            const isVerified = isAdm ? true : (rtdbUser.contactVerified === true || rtdbUser.isVerified === true);
            const userStatus = isAdm ? 'approved' : (rtdbUser.status || (isVerified ? 'pending' : 'unverified'));
            user = {
              id: rtdbUser.userId || cleanId,
              userId: rtdbUser.userId || cleanId,
              username: rtdbUser.userId || cleanId,
              name: rtdbUser.fullName || rtdbUser.name || cleanId,
              fullName: rtdbUser.fullName || rtdbUser.name || cleanId,
              contact: rtdbUser.contact || rtdbUser.phone || '',
              phone: rtdbUser.phone || rtdbUser.contact || '',
              email: rtdbUser.email || (rtdbUser.contact && rtdbUser.contact.includes('@') ? rtdbUser.contact : ''),
              role: rtdbUser.role || 'MEM',
              status: userStatus,
              contactVerified: isVerified,
              isVerified: isVerified,
              password: cleanPass,
              plainPassword: cleanPass
            };
            // Sync to Firestore for local caching
            saveUserToFirestore(user).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('RTDB login check error:', e);
      }
    }

    if (!user) {
      return { success: false, error: 'No account found with this SNI ID or Contact details. Please verify or click Join to create an account.' };
    }

    if (!isPasswordMatch(user, cleanPass)) {
      return { success: false, error: 'Incorrect SNI Password. Please try again.' };
    }

    const isAdmin = isUserAdmin(user) || String(user.role || '').toUpperCase() === 'ADMIN';

    // Check approval status (Strictly required: only after admin approves can they sign in!)
    if (!isAdmin && user.status !== 'approved') {
      if (user.status === 'rejected') {
        return {
          success: false,
          error: 'This account was rejected by Admin.'
        };
      }
      if (user.status === 'revoked') {
        return {
          success: false,
          error: 'This account access was revoked by Admin.'
        };
      }
      return {
        success: false,
        isPending: true,
        error: '⏳ Waiting for Admin Approval: Your application has been submitted to Admin (info@sni.org.in). Please wait until the Admin approves your account before signing in.'
      };
    }

    // Success: Establish unified session across all SNI domains!
    setUnifiedSession(user);
    setCurrentUser(user);

    // If PIN lock is disabled for user, never lock
    if (user.pinLockEnabled === false) {
      setIsPinLocked(false);
    } else if (user.pinLockEnabled === true && !user.hasSetPersonalPin) {
      setIsPinLocked(true);
    } else {
      setIsPinLocked(false);
    }

    if (user.role === 'member') {
      setSelectedMemberId(user.id);
    } else if (user.role === 'manager') {
      const firstAssigned = user.assignedMembers?.[0] || user.id;
      setSelectedMemberId(firstAssigned);
    } else if (user.role === 'admin') {
      const firstMember = (data.users || []).find(u => u.role === 'member' && u.status === 'approved');
      setSelectedMemberId(firstMember ? firstMember.id : user.id);
    }

    return { success: true, user };
  };

  const sendOfficialVerificationEmail = async (email, password, userId, otp = '') => {
    const FIREBASE_API_KEY = "AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI";
    try {
      let idToken = null;
      const signUpRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password || 'SniUser123.',
          returnSecureToken: true
        })
      });

      if (signUpRes.ok) {
        const data = await signUpRes.json();
        idToken = data.idToken;
      } else {
        const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: password || 'SniUser123.',
            returnSecureToken: true
          })
        });
        if (signInRes.ok) {
          const data = await signInRes.json();
          idToken = data.idToken;
        }
      }

      if (!idToken) return { success: false, error: 'Could not acquire authentication token' };

      const continueUrl = `https://sni.org.in/join?otp=${encodeURIComponent(otp)}&uid=${encodeURIComponent(userId)}`;
      const oobRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'VERIFY_EMAIL',
          idToken: idToken,
          continueUrl: continueUrl
        })
      });

      if (oobRes.ok) {
        return { success: true };
      } else {
        const err = await oobRes.json();
        return { success: false, error: err.error?.message };
      }
    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  };

  const register = async (userData = {}) => {
    const formData = userData || {};
    const fullName = String(formData.fullName || formData.name || '').trim();
    const username = String(formData.username || formData.userId || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const password = String(formData.password || '').trim();
    const nickname = String(formData.nickname || '').trim();
    const moreDetails = String(formData.moreDetails || formData.place || formData.optionalInfo || '').trim();

    if (!fullName || !username || !password) {
      return {
        success: false,
        error: 'Full Name, SNI ID, and SNI Password are required.',
      };
    }

    if (username.length < 3) {
      return {
        success: false,
        error: 'SNI ID must be at least 3 characters long.',
      };
    }

    if (password.length < 4) {
      return {
        success: false,
        error: 'SNI Password must be at least 4 characters long.',
      };
    }

    const cleanUserLower = username;

    // 1. User ID must be unique in local state / Firestore
    const existingUser = (data?.users || []).find(u =>
      (u?.username && String(u.username).toLowerCase() === cleanUserLower) ||
      (u?.id && String(u.id).toLowerCase() === cleanUserLower) ||
      (u?.userId && String(u.userId).toLowerCase() === cleanUserLower)
    );
    if (existingUser) {
      return {
        success: false,
        error: `SNI ID "${username}" is already taken. Please choose another unique SNI ID or Sign In.`,
      };
    }

    // 2. Check RTDB to ensure global uniqueness
    try {
      const checkRes = await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanUserLower)}.json`);
      if (checkRes.ok) {
        const existingRtdb = await checkRes.json();
        if (existingRtdb) {
          return {
            success: false,
            error: `SNI ID "${username}" is already registered across SNI. Please choose another ID or Sign In.`,
          };
        }
      }
    } catch (e) {}

    const isAdm = cleanUserLower === 'surya11008';
    const targetStatus = isAdm ? 'approved' : (userData.status || 'unverified');

    const newUser = {
      id: cleanUserLower,
      userId: cleanUserLower,
      username: cleanUserLower,
      name: fullName,
      fullName: fullName,
      phone: userData.phone || '',
      email: userData.email || '',
      contact: userData.phone || userData.contact || userData.email || '',
      password,
      plainPassword: password,
      place: moreDetails,
      moreDetails,
      nickname,
      role: isAdm ? 'ADMIN' : 'MEM',
      status: targetStatus,
      contactVerified: isAdm ? true : (userData.phoneVerified || false),
      emailVerified: isAdm ? true : (userData.emailVerified || false),
      phoneVerified: isAdm ? true : (userData.phoneVerified || false),
      isVerified: isAdm ? true : (userData.isVerified || false),
      verificationOtp: userData.verificationOtp || '',
      otpExpiresAt: userData.otpExpiresAt || '',
      verificationChannel: userData.verificationChannel || 'whatsapp',
      verificationSentAt: userData.verificationSentAt || new Date().toISOString(),
      personalPin: '',
      hasSetPersonalPin: false,
      pinLockEnabled: false,
      createdAt: formatDate(new Date()),
      registeredAt: new Date().toISOString(),
      adminEmail: 'info@sni.org.in',
    };

    // 1. Save to Firestore users collection
    await saveUserToFirestore(newUser);

    // 2. Dual sync to unified RTDB
    try {
      await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanUserLower)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanUserLower,
          fullName: fullName,
          contact: newUser.contact,
          phone: newUser.phone,
          email: newUser.email,
          password: password,
          role: isAdm ? 'ADMIN' : 'MEM',
          status: targetStatus,
          contactVerified: newUser.contactVerified,
          emailVerified: newUser.emailVerified,
          phoneVerified: newUser.phoneVerified,
          isVerified: newUser.isVerified,
          verificationOtp: newUser.verificationOtp,
          otpExpiresAt: newUser.otpExpiresAt,
          joinedAt: newUser.registeredAt,
          adminEmail: 'info@sni.org.in'
        })
      });
    } catch (e) {
      console.warn('RTDB sync on register error:', e);
    }

    // 3. Forward to pending_registrations if pending
    if (!isAdm && targetStatus === 'pending') {
      try {
        await savePendingRegistrationToFirestore(newUser);
        const FIREBASE_API_KEY = "AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI";
        await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/pending_registrations/${encodeURIComponent(cleanUserLower)}?key=${FIREBASE_API_KEY}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              id: { stringValue: cleanUserLower },
              userId: { stringValue: cleanUserLower },
              username: { stringValue: cleanUserLower },
              name: { stringValue: fullName },
              fullName: { stringValue: fullName },
              phone: { stringValue: newUser.phone || '' },
              contact: { stringValue: newUser.contact || cleanUserLower },
              password: { stringValue: password },
              plainPassword: { stringValue: password },
              role: { stringValue: 'MEM' },
              status: { stringValue: 'pending' },
              contactVerified: { booleanValue: true },
              isVerified: { booleanValue: true },
              createdAt: { stringValue: newUser.createdAt || new Date().toISOString() },
              registeredAt: { stringValue: newUser.registeredAt || new Date().toISOString() },
              adminEmail: { stringValue: 'info@sni.org.in' }
            }
          })
        });
      } catch (e) {
        console.warn('Pending registration forward failed:', e);
      }
    }

    // Optimistically update local React state
    setData(prev => ({
      ...prev,
      users: [...(prev.users || []).filter(u => u.id !== cleanUserLower), newUser],
    }));

    return {
      success: true,
      requiresVerification: false,
      isAutoApproved: isAdm,
      userId: cleanUserLower,
      password,
      message: isAdm
        ? `Welcome, Admin ${fullName}!`
        : `⏳ Waiting for Admin Approval: Your application has been submitted to Admin (info@sni.org.in). Please wait until the Admin approves your account before signing in.`,
      newUser,
    };
  };

  const verifyUserContact = async (userId, token = null) => {
    if (!userId) return { success: false, error: 'User ID required' };
    const cleanId = String(userId).trim().toLowerCase();

    let user = null;
    try {
      const res = await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanId)}.json`);
      if (res.ok) {
        user = await res.json();
      }
    } catch (e) {}

    if (!user) {
      try {
        const fsUsers = await getAllUsersFromFirestore();
        user = fsUsers.find(u => u.id === cleanId || u.userId === cleanId || u.username === cleanId);
      } catch (e) {}
    }

    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const cleanCode = (token || '').trim();
    const savedOtp = String(user.verificationOtp || '').trim();
    const isOtpMatch = cleanCode && savedOtp && cleanCode === savedOtp;

    // Check expiration
    if (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return {
        success: false,
        error: '⚠️ This OTP code has expired. Please click "Resend OTP Code" to get a fresh code.'
      };
    }

    // Verify with Firebase Auth that the email is actually verified (fallback if token is oobCode)
    let isFirebaseEmailVerified = false;
    const FIREBASE_API_KEY = "AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI";
    if (token && !isOtpMatch) {
      try {
        await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oobCode: token })
        });
      } catch (e) {}
    }
    if (!isOtpMatch) {
      try {
        const email = user.email || user.contact;
        const pass = user.password || user.plainPassword || 'SniUser123.';
        const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pass, returnSecureToken: true })
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          const lookupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: authData.idToken })
          });
          if (lookupRes.ok) {
            const lookupData = await lookupRes.json();
            isFirebaseEmailVerified = lookupData.users?.[0]?.emailVerified === true;
          }
        }
      } catch(e) {}
    }

    const isVerifiedNow = isOtpMatch || isFirebaseEmailVerified || cleanId === 'surya11008';
    if (!isVerifiedNow) {
      return {
        success: false,
        error: '❌ Incorrect verification code. Please check and try again.'
      };
    }

    const updatedFields = {
      contactVerified: true,
      emailVerified: true,
      phoneVerified: true,
      isVerified: true,
      verifiedAt: new Date().toISOString(),
      adminEmail: 'info@sni.org.in',
      status: cleanId === 'surya11008' ? 'approved' : 'pending',
    };

    // Sync to RTDB
    try {
      await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanId)}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
    } catch (e) {}

    // Sync to Firestore
    try {
      const existing = (data.users || []).find(u => u.id === cleanId) || {};
      const fullUser = {
        ...existing,
        ...user,
        id: cleanId,
        ...updatedFields
      };
      await saveUserToFirestore(fullUser);
      // ONLY NOW forward to Firestore pending_registrations collection for Admin Approvals
      if (updatedFields.status === 'pending') {
        await savePendingRegistrationToFirestore(fullUser);
        try {
          const FIREBASE_API_KEY = "AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI";
          const phoneVal = user.phone || user.contact || fullUser.phone || '';
          const nameVal = user.name || user.fullName || fullUser.name || cleanId;
          const passVal = user.password || user.plainPassword || fullUser.password || '';
          await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/pending_registrations/${encodeURIComponent(cleanId)}?key=${FIREBASE_API_KEY}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                id: { stringValue: cleanId },
                userId: { stringValue: cleanId },
                username: { stringValue: cleanId },
                name: { stringValue: nameVal },
                fullName: { stringValue: nameVal },
                phone: { stringValue: phoneVal },
                contact: { stringValue: phoneVal },
                password: { stringValue: passVal },
                plainPassword: { stringValue: passVal },
                role: { stringValue: 'MEM' },
                status: { stringValue: 'pending' },
                contactVerified: { booleanValue: true },
                phoneVerified: { booleanValue: true },
                emailVerified: { booleanValue: true },
                isVerified: { booleanValue: true },
                verifiedAt: { stringValue: updatedFields.verifiedAt },
                createdAt: { stringValue: user.createdAt || new Date().toISOString() },
                adminEmail: { stringValue: 'info@sni.org.in' }
              }
            })
          });
        } catch (restErr) {
          console.warn('REST write to pending_registrations warning:', restErr);
        }
      }
    } catch (e) {}

    // Update local state
    setData(prev => ({
      ...prev,
      users: (prev.users || []).map(u => (u.id === cleanId ? { ...u, ...updatedFields } : u)),
    }));

    return { success: true, message: 'Phone number successfully verified! Your application has been submitted to Admin (info@sni.org.in) for approval.' };
  };

  const manualVerifyContact = async (userId) => {
    return await verifyUserContact(userId, null);
  };

  const logout = () => {
    clearUnifiedSession();
    setCurrentUser(null);
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem('star_galaxy_active_tab');
    localStorage.removeItem('star_galaxy_selected_activity');
    // 🔒 Security: Clear in-memory diary state immediately upon logout
    setData(prev => ({
      ...prev,
      gospelDiary: {},
    }));
    setActiveTabState('activities');
  };

  // Change Password
  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    const cleanCurrent = String(currentPassword || '').trim();
    const cleanNew = String(newPassword || '').trim();

    if (!cleanNew || cleanNew.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    if (currentUser.password && currentUser.password !== cleanCurrent) {
      return { success: false, error: 'Current password is incorrect. Please verify and try again.' };
    }

    const updatedUser = {
      ...currentUser,
      password: cleanNew,
      plainPassword: cleanNew,
    };
    delete updatedUser.tempDefaultPassword;

    setCurrentUser(updatedUser);

    setData(prev => ({
      ...prev,
      users: (prev.users || []).map(u => u.id === currentUser.id ? updatedUser : u),
    }));

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        parsed.users = (parsed.users || []).map(u => u.id === currentUser.id ? updatedUser : u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    await saveUserToFirestore(updatedUser);
    setUnifiedSession(updatedUser);
    try {
      const uid = updatedUser.userId || updatedUser.username || updatedUser.id;
      const pwd = updatedUser.password || updatedUser.plainPassword;
      if (uid && pwd) {
        fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(String(uid).toLowerCase().replace(/[^a-z0-9_-]/g, ''))}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, fullName: updatedUser.fullName || updatedUser.name || uid })
        }).catch(() => {});
      }
    } catch (e) {}

    try {
      fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, currentPassword, newPassword: cleanNew }),
      }).catch(() => {});
    } catch (e) {}

    return { success: true, message: 'Password changed and saved successfully!' };
  };

  // User Self-Service Password Reset (with Phone Number or Gmail)
  const resetPasswordWithContact = async (contactIdentifier, newPassword, optionalUserId) => {
    const cleanContact = String(contactIdentifier || '').trim();
    const cleanNewPass = String(newPassword || '').trim();
    const cleanUserId = String(optionalUserId || '').trim().toLowerCase();

    if (!cleanContact) {
      return { success: false, error: 'Please enter your registered Phone number or Gmail.' };
    }
    if (!cleanNewPass || cleanNewPass.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    let allUsers = data?.users || [];
    try {
      const live = await getAllUsersFromFirestore();
      if (live && live.length > 0) {
        const map = new Map(allUsers.map(u => [u.id, u]));
        live.forEach(u => map.set(u.id, { ...(map.get(u.id) || {}), ...u }));
        allUsers = Array.from(map.values());
      }
    } catch (e) {}

    // Match by phone, contact, or email
    let matching = allUsers.filter(u =>
      contactsMatch(u.phone, cleanContact) ||
      contactsMatch(u.contact, cleanContact) ||
      (u.email && contactsMatch(u.email, cleanContact))
    );

    // If no match by contact, check if user provided username or user ID
    if (matching.length === 0) {
      matching = allUsers.filter(u =>
        String(u.username || '').trim().toLowerCase() === cleanContact.toLowerCase() ||
        String(u.id || '').trim().toLowerCase() === cleanContact.toLowerCase()
      );
    }

    if (matching.length === 0) {
      return {
        success: false,
        error: 'No account found matching this Phone number or Gmail. Please verify your details.'
      };
    }

    let targetUser = matching[0];
    if (matching.length > 1 && cleanUserId) {
      const specific = matching.find(u =>
        String(u.username || '').trim().toLowerCase() === cleanUserId ||
        String(u.id || '').trim().toLowerCase() === cleanUserId
      );
      if (specific) {
        targetUser = specific;
      }
    } else if (matching.length > 1 && !cleanUserId) {
      return {
        success: false,
        requiresUserId: true,
        matchingAccounts: matching.map(u => ({ id: u.id, username: u.username, name: u.name })),
        error: `Found ${matching.length} accounts linked to this contact. Please enter your User ID as well.`
      };
    }

    const updatedUser = {
      ...targetUser,
      password: cleanNewPass,
      plainPassword: cleanNewPass,
    };
    delete updatedUser.tempDefaultPassword;

    setData(prev => ({
      ...prev,
      users: (prev.users || []).map(u => u.id === targetUser.id ? updatedUser : u),
    }));

    if (currentUser?.id === targetUser.id) {
      setCurrentUser(prev => ({ ...prev, password: cleanNewPass, plainPassword: cleanNewPass }));
    }

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        parsed.users = (parsed.users || []).map(u => u.id === targetUser.id ? updatedUser : u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    await saveUserToFirestore(updatedUser);
    setUnifiedSession(updatedUser);
    try {
      const uid = updatedUser.userId || updatedUser.username || updatedUser.id;
      const pwd = updatedUser.password || updatedUser.plainPassword;
      if (uid && pwd) {
        fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(String(uid).toLowerCase().replace(/[^a-z0-9_-]/g, ''))}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, fullName: updatedUser.fullName || updatedUser.name || uid })
        }).catch(() => {});
      }
    } catch (e) {}

    return {
      success: true,
      user: targetUser,
      message: `Password for "${targetUser.name}" (${targetUser.username || targetUser.phone}) was successfully reset! You can now log in.`
    };
  };

  // Update Profile (Nickname & details)
  const updateProfile = async (nickname, moreDetails) => {
    if (!currentUser) return { success: false };
    const updatedUser = {
      ...currentUser,
      nickname,
      moreDetails,
      place: moreDetails,
    };
    setCurrentUser(updatedUser);
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === currentUser.id ? updatedUser : u),
    }));

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        parsed.users = (parsed.users || []).map(u => u.id === currentUser.id ? updatedUser : u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    await saveUserToFirestore(updatedUser);
    setUnifiedSession(updatedUser);
    try {
      const uid = updatedUser.userId || updatedUser.username || updatedUser.id;
      const pwd = updatedUser.password || updatedUser.plainPassword;
      if (uid && pwd) {
        fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(String(uid).toLowerCase().replace(/[^a-z0-9_-]/g, ''))}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, fullName: updatedUser.fullName || updatedUser.name || uid })
        }).catch(() => {});
      }
    } catch (e) {}

    try {
      fetch('/api/users/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, nickname, moreDetails }),
      }).catch(() => {});
    } catch (e) {}

    return { success: true };
  };

  // Update or Create Personal PIN
  const updatePersonalPin = async (newPin) => {
    if (!currentUser) return { success: false, error: 'No active user' };
    const cleanPin = String(newPin).trim();
    if (!cleanPin || cleanPin.length < 4 || cleanPin.length > 6) {
      return { success: false, error: 'Personal PIN must be 4 to 6 digits.' };
    }

    const updatedUser = {
      ...currentUser,
      personalPin: cleanPin,
      hasSetPersonalPin: true,
      pinLockEnabled: currentUser.pinLockEnabled !== false,
    };

    setCurrentUser(updatedUser);

    setData(prev => ({
      ...prev,
      users: (prev.users || []).map(u => u.id === currentUser.id ? updatedUser : u),
    }));

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        parsed.users = (parsed.users || []).map(u => u.id === currentUser.id ? updatedUser : u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    await saveUserToFirestore(updatedUser);
    setUnifiedSession(updatedUser);
    try {
      const uid = updatedUser.userId || updatedUser.username || updatedUser.id;
      const pwd = updatedUser.password || updatedUser.plainPassword;
      if (uid && pwd) {
        fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(String(uid).toLowerCase().replace(/[^a-z0-9_-]/g, ''))}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, fullName: updatedUser.fullName || updatedUser.name || uid })
        }).catch(() => {});
      }
    } catch (e) {}

    try {
      fetch('/api/users/update-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, newPin: cleanPin }),
      }).catch(() => {});
    } catch (e) {}

    setIsPinLocked(false);
    sessionStorage.setItem('star_galaxy_pin_unlocked', 'true');
    return { success: true };
  };

  // User Management
  const approveUser = async (userId, targetRole = 'MEM') => {
    let userToSave = null;
    const finalRole = normalizeRole(targetRole, userId) || 'MEM';

    setData(prev => {
      const updated = (prev.users || []).map(u => {
        if (u.id === userId || u.userId === userId || u.username === userId) {
          const mod = {
            ...u,
            status: 'approved',
            role: finalRole || normalizeRole(u.role, userId) || 'MEM',
          };
          userToSave = mod;
          return mod;
        }
        return u;
      });
      return { ...prev, users: updated };
    });

    // 1. Immediately persist to star_galaxy_approved_user_ids in localStorage
    try {
      const approvedIds = JSON.parse(localStorage.getItem('star_galaxy_approved_user_ids') || '[]');
      if (!approvedIds.includes(userId)) {
        approvedIds.push(userId);
        localStorage.setItem('star_galaxy_approved_user_ids', JSON.stringify(approvedIds));
      }
    } catch (e) {}

    // 2. Remove from star_galaxy_pending_users in localStorage
    try {
      const savedPending = JSON.parse(localStorage.getItem('star_galaxy_pending_users') || '[]');
      const filtered = savedPending.filter(u => u.id !== userId && u.userId !== userId);
      localStorage.setItem('star_galaxy_pending_users', JSON.stringify(filtered));
    } catch (e) {}

    // 3. Update STORAGE_KEY immediately in localStorage so reloads keep it approved
    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed.users)) {
          parsed.users = parsed.users.map(u => (u.id === userId || u.userId === userId) ? { ...u, status: 'approved', role: finalRole } : u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {}

    // 4. Update Firestore permanently
    if (userToSave) {
      await saveUserToFirestore(userToSave);
    }
    await markRegistrationApprovedInFirestore(userId);
    await removePendingRegistrationFromFirestore(userId);
    try {
      const FIREBASE_API_KEY = "AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI";
      await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/pending_registrations/${encodeURIComponent(userId)}?key=${FIREBASE_API_KEY}`, {
        method: 'DELETE'
      });
    } catch (e) {}

    // 5. Dual-sync to unified RTDB
    try {
      const cleanUid = String(userToSave?.userId || userToSave?.username || userId).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleanUid) {
        await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanUid)}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'approved',
            role: userToSave?.role || finalRole || 'MEM',
            approvedAt: new Date().toISOString()
          })
        });
      }
    } catch (e) {}

    // 6. Background notification to server API
    try {
      fetch('/api/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    } catch (e) {}

    return { success: true };
  };

  const revokeUser = async (userId) => {
    if (userId === 'surya11008') {
      return { success: false, error: 'Admin account (surya11008) cannot be revoked!' };
    }

    let userToSave = null;
    setData(prev => {
      const updated = (prev.users || []).map(u => {
        if (u.id === userId || u.userId === userId || u.username === userId) {
          const mod = { ...u, status: 'revoked' };
          userToSave = mod;
          return mod;
        }
        return u;
      });
      return { ...prev, users: updated };
    });

    if (userToSave) {
      await saveUserToFirestore(userToSave);
    }

    try {
      const cleanUid = String(userToSave?.userId || userToSave?.username || userId).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleanUid) {
        await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanUid)}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'revoked',
            revokedAt: new Date().toISOString()
          })
        });
      }
    } catch (e) {}

    return { success: true };
  };

  const changeUserRole = async (userId, newRole) => {
    if (userId === 'surya11008' && newRole !== 'ADMIN') {
      return { success: false, error: 'Administrator role for surya11008 cannot be changed.' };
    }
    const normalized = normalizeRole(newRole, userId);
    let userToSave = null;

    setData(prev => {
      const updated = (prev.users || []).map(u => {
        if (u.id === userId || u.userId === userId || u.username === userId) {
          const mod = { ...u, role: normalized };
          userToSave = mod;
          return mod;
        }
        return u;
      });
      return { ...prev, users: updated };
    });

    if (currentUser?.id === userId || currentUser?.userId === userId) {
      setCurrentUser(prev => ({ ...prev, role: normalized }));
    }

    if (userToSave) {
      await saveUserToFirestore(userToSave);
      setUnifiedSession(userToSave);
    }

    try {
      const cleanUid = String(userToSave?.userId || userToSave?.username || userId).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleanUid) {
        await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanUid)}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: normalized,
            updatedAt: new Date().toISOString()
          })
        });
      }
    } catch (e) {}

    return { success: true, role: normalized };
  };

  const rejectUser = async (userId) => {
    const target = (data?.users || []).find(u => u.id === userId || u.userId === userId || u.username === userId);
    const extraIds = target ? [target.id, target.userId, target.username].filter(Boolean) : [];

    await deleteUserFromFirestore(userId, extraIds);
    await deleteUserFromRTDB(userId, extraIds);
    await removePendingRegistrationFromFirestore(userId);
    try {
      const FIREBASE_API_KEY = "AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI";
      await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/pending_registrations/${encodeURIComponent(userId)}?key=${FIREBASE_API_KEY}`, {
        method: 'DELETE'
      });
    } catch (e) {}

    setData(prev => ({
      ...prev,
      users: (prev.users || []).filter(u => u.id !== userId && u.userId !== userId && u.username !== userId),
    }));

    try {
      const savedPending = JSON.parse(localStorage.getItem('star_galaxy_pending_users') || '[]');
      const filtered = savedPending.filter(u => u.id !== userId && u.userId !== userId);
      localStorage.setItem('star_galaxy_pending_users', JSON.stringify(filtered));
    } catch (e) {}

    try {
      fetch('/api/users/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    } catch (e) {}
  };

  // Quick Add & Approve Member by Admin (Instant recovery for any missed registration)
  const quickAddAndApproveMember = async (memberData) => {
    const fullName = (memberData.fullName || memberData.name || '').trim();
    const username = (memberData.username || memberData.userId || '').trim();
    const password = (memberData.password || '').trim() || 'StarPass2026!';
    const contact = (memberData.contact || memberData.phone || '').trim();
    const nickname = (memberData.nickname || '').trim();
    const moreDetails = (memberData.moreDetails || memberData.place || '').trim();

    if (!fullName || !username) {
      return { success: false, error: 'Full Name and User ID are required.' };
    }

    const cleanUserLower = username.toLowerCase();
    const existing = (data?.users || []).find(u =>
      (u.username && u.username.toLowerCase() === cleanUserLower) ||
      (u.id && u.id.toLowerCase() === cleanUserLower)
    );
    if (existing) {
      // If user exists and is pending, approve them!
      if (existing.status !== 'approved') {
        await approveUser(existing.id);
        return { success: true, message: `Member ${existing.name} was approved!`, user: existing };
      }
      return { success: false, error: `User ID "${username}" is already an approved member.` };
    }

    if (contact) {
      const sameContactUsers = (data?.users || []).filter(u =>
        contactsMatch(u.phone, contact) || contactsMatch(u.contact, contact)
      );
      if (sameContactUsers.length >= 10) {
        return {
          success: false,
          error: `Maximum 10 accounts allowed per Phone / Gmail. "${contact}" already has reached the limit of 10 users.`,
        };
      }
    }

    const newUserId = 'usr-' + Date.now();
    const newUser = {
      id: newUserId,
      username,
      name: fullName,
      phone: contact,
      contact,
      password,
      plainPassword: password,
      place: moreDetails,
      moreDetails,
      nickname,
      role: 'MEM',
      status: 'approved', // Directly approved by Admin!
      personalPin: '',
      hasSetPersonalPin: false,
      pinLockEnabled: false,
      createdAt: formatDate(new Date()),
      registeredAt: new Date().toISOString(),
    };

    // Add to approved IDs list
    try {
      const approvedIds = JSON.parse(localStorage.getItem('star_galaxy_approved_user_ids') || '[]');
      if (!approvedIds.includes(newUserId)) {
        approvedIds.push(newUserId);
        localStorage.setItem('star_galaxy_approved_user_ids', JSON.stringify(approvedIds));
      }
    } catch (e) {}

    await saveUserToFirestore(newUser);
    await markRegistrationApprovedInFirestore(newUserId);
    await removePendingRegistrationFromFirestore(newUserId);

    // Save to RTDB
    try {
      const cleanUid = String(username).toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (cleanUid) {
        await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanUid)}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: cleanUid,
            fullName,
            contact,
            password,
            role: 'MEM',
            status: 'approved',
            joinedAt: newUser.registeredAt
          })
        });
      }
    } catch (e) {}

    setData(prev => ({
      ...prev,
      users: [...(prev.users || []).filter(u => u.id !== newUserId), newUser],
    }));

    return { success: true, message: `Member ${fullName} added & approved successfully!`, user: newUser };
  };

  const refreshRegistrations = async () => {
    try {
      const [cloudUsers, cloudPending] = await Promise.all([
        getAllUsersFromFirestore(),
        getPendingRegistrationsFromFirestore(),
      ]);

      const approvedIds = new Set(
        JSON.parse(localStorage.getItem('star_galaxy_approved_user_ids') || '[]')
      );

      setData(prev => {
        const userMap = new Map((prev.users || []).map(u => [u.id, u]));
        cloudUsers.forEach(u => {
          const existing = userMap.get(u.id);
          const isApproved = existing?.status === 'approved' || u.status === 'approved' || approvedIds.has(u.id);
          userMap.set(u.id, { ...(existing || {}), ...u, status: isApproved ? 'approved' : u.status });
        });
        cloudPending.forEach(p => {
          if (approvedIds.has(p.id) || userMap.get(p.id)?.status === 'approved') {
            removePendingRegistrationFromFirestore(p.id).catch(() => {});
            return;
          }
          const existing = userMap.get(p.id);
          userMap.set(p.id, { ...(existing || {}), ...p, status: 'pending' });
        });
        return {
          ...prev,
          users: Array.from(userMap.values()),
        };
      });

      return { success: true, count: cloudPending.length };
    } catch (e) {
      console.error('Failed to refresh registrations:', e);
      return { success: false, error: e.message };
    }
  };

  const deleteUser = async (userId) => {
    if (userId === 'surya11008') {
      return { success: false, error: 'Admin account (surya11008) cannot be deleted!' };
    }

    const target = (data?.users || []).find(u => u.id === userId || u.userId === userId || u.username === userId);
    const extraIds = target ? [target.id, target.userId, target.username].filter(Boolean) : [];

    try {
      fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (e) {}

    // 1. Delete from Firestore
    await deleteUserFromFirestore(userId, extraIds);

    // 2. Delete from RTDB
    await deleteUserFromRTDB(userId, extraIds);

    setData(prev => {
      const updatedUsers = (prev.users || [])
        .filter(u => u.id !== userId && u.userId !== userId && u.username !== userId)
        .map(u => {
          let mod = { ...u };
          if (Array.isArray(mod.assignedMembers) && mod.assignedMembers.includes(userId)) {
            mod.assignedMembers = mod.assignedMembers.filter(mid => mid !== userId);
          }
          if (Array.isArray(mod.assignedManagerIds) && mod.assignedManagerIds.includes(userId)) {
            mod.assignedManagerIds = mod.assignedManagerIds.filter(mid => mid !== userId);
            mod.assignedManagerId = mod.assignedManagerIds[0] || '';
          } else if (mod.assignedManagerId === userId) {
            mod.assignedManagerId = '';
          }
          return mod;
        });

      const updatedActivities = { ...prev.activitiesData };
      delete updatedActivities[userId];

      return {
        ...prev,
        users: updatedUsers,
        activitiesData: updatedActivities,
      };
    });

    try {
      const savedPending = JSON.parse(localStorage.getItem('star_galaxy_pending_users') || '[]');
      const filtered = savedPending.filter(u => u.id !== userId && u.userId !== userId);
      localStorage.setItem('star_galaxy_pending_users', JSON.stringify(filtered));
    } catch (e) {}

    try {
      const approvedIds = JSON.parse(localStorage.getItem('star_galaxy_approved_user_ids') || '[]');
      const filtered = approvedIds.filter(id => id !== userId && !extraIds.includes(id));
      localStorage.setItem('star_galaxy_approved_user_ids', JSON.stringify(filtered));
    } catch (e) {}

    setSelectedMemberId(prevSelected => {
      if (prevSelected === userId) {
        return currentUser?.id || 'surya11008';
      }
      return prevSelected;
    });

    return { success: true };
  };

  // Admin Reset Password (sets custom password or strong temporary password)
  const adminResetPassword = async (userId, customPassword) => {
    const target = (data?.users || []).find(u => u.id === userId);
    if (!target) return { success: false, error: 'User not found' };

    const newPass = String(customPassword || '').trim() || 'StarPass2026!';
    const updatedUser = {
      ...target,
      password: newPass,
      plainPassword: newPass,
    };
    delete updatedUser.tempDefaultPassword;

    setData(prev => ({
      ...prev,
      users: (prev.users || []).map(u => u.id === userId ? updatedUser : u),
    }));

    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, password: newPass, plainPassword: newPass }));
    }

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        parsed.users = (parsed.users || []).map(u => u.id === userId ? updatedUser : u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    await saveUserToFirestore(updatedUser);
    setUnifiedSession(updatedUser);
    try {
      const uid = updatedUser.userId || updatedUser.username || updatedUser.id;
      const pwd = updatedUser.password || updatedUser.plainPassword;
      if (uid && pwd) {
        fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(String(uid).toLowerCase().replace(/[^a-z0-9_-]/g, ''))}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd, fullName: updatedUser.fullName || updatedUser.name || uid })
        }).catch(() => {});
      }
    } catch (e) {}

    try {
      fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPass }),
      }).catch(() => {});
    } catch (e) {}

    return {
      success: true,
      newPassword: newPass,
      message: `Password for "${target.name}" has been set to: "${newPass}"`,
      user: updatedUser,
    };
  };

  const resetPassword = (userId, customPassword) => {
    return adminResetPassword(userId, customPassword);
  };

  // Appoint or Remove Manager Role
  const setManagerRole = async (userId, isManager) => {
    if (userId === 'surya11008') return { success: false, error: 'Admin role cannot be changed' };

    // 1. Immediately update localStorage manager set
    try {
      const savedMgrs = JSON.parse(localStorage.getItem('star_galaxy_manager_user_ids') || '[]');
      const set = new Set(Array.isArray(savedMgrs) ? savedMgrs : []);
      if (isManager) {
        set.add(userId);
      } else {
        set.delete(userId);
      }
      localStorage.setItem('star_galaxy_manager_user_ids', JSON.stringify(Array.from(set)));
    } catch (e) {}

    // 2. Optimistically update local React state
    let userToSave = null;
    setData(prev => {
      const updated = (prev.users || []).map(u => {
        if (u.id === userId) {
          const newRole = isManager 
            ? ((u.role && u.role !== 'MEM' && u.role !== 'member') ? normalizeRole(u.role, u.id) : 'GL')
            : 'MEM';
          const mod = {
            ...u,
            role: newRole,
            assignedMembers: isManager ? (Array.isArray(u.assignedMembers) ? u.assignedMembers : []) : [],
          };
          userToSave = mod;
          return mod;
        }
        return u;
      });
      return { ...prev, users: updated };
    });

    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({
        ...prev,
        role: userToSave?.role || (isManager ? 'GL' : 'MEM'),
        assignedMembers: isManager ? (Array.isArray(prev.assignedMembers) ? prev.assignedMembers : []) : [],
      }));
    }

    // 3. Update localStorage STORAGE_KEY
    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        parsed.users = (parsed.users || []).map(u => u.id === userId ? {
          ...u,
          role: userToSave?.role || (isManager ? 'GL' : 'MEM'),
          assignedMembers: isManager ? (Array.isArray(u.assignedMembers) ? u.assignedMembers : []) : [],
        } : u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    // 4. Save permanently to Firestore users and manager_roles
    if (userToSave) {
      await saveUserToFirestore(userToSave);
      setUnifiedSession(userToSave);
      if (isManager) {
        await saveManagerRoleToFirestore(userId, true, userToSave.assignedMembers || []);
      } else {
        await removeManagerRoleFromFirestore(userId);
      }

      // Dual sync role to RTDB
      try {
        const cleanUid = String(userToSave.userId || userToSave.username || userId).toLowerCase().replace(/[^a-z0-9_-]/g, '');
        if (cleanUid) {
          await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanUid)}.json`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role: userToSave.role,
              updatedAt: new Date().toISOString()
            })
          });
        }
      } catch (e) {}
    }

    try {
      fetch('/api/users/toggle-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isManager }),
      }).catch(() => {});
    } catch (e) {}

    return { success: true };
  };

  // Multi-Manager Assignment System:
  // Allows assigning one user to MULTIPLE managers, and assigning managers to other managers.

  // 1. Add a single manager to a user
  const addManagerToUser = async (userId, managerId) => {
    if (!userId || !managerId || userId === managerId) return { success: false };

    if (managerId) {
      try {
        const savedMgrs = JSON.parse(localStorage.getItem('star_galaxy_manager_user_ids') || '[]');
        const set = new Set(Array.isArray(savedMgrs) ? savedMgrs : []);
        set.add(managerId);
        localStorage.setItem('star_galaxy_manager_user_ids', JSON.stringify(Array.from(set)));
      } catch (e) {}
    }

    const affectedUsers = [];

    setData(prev => {
      const updatedUsers = (prev.users || []).map(u => {
        // 1. The user being assigned to the manager
        if (u.id === userId) {
          const currentMgrs = Array.isArray(u.assignedManagerIds)
            ? u.assignedManagerIds
            : (u.assignedManagerId ? [u.assignedManagerId] : []);
          const updatedMgrs = currentMgrs.includes(managerId) ? currentMgrs : [...currentMgrs, managerId];
          const updatedUser = {
            ...u,
            assignedManagerIds: updatedMgrs,
            assignedManagerId: updatedMgrs[0] || '',
          };
          affectedUsers.push(updatedUser);
          return updatedUser;
        }

        // 2. The manager: add userId to assignedMembers & ensure manager role
        if (u.id === managerId) {
          const currentList = Array.isArray(u.assignedMembers) ? u.assignedMembers : [];
          const updatedList = currentList.includes(userId) ? currentList : [...currentList, userId];
          const updatedMgr = {
            ...u,
            role: u.role === 'admin' ? 'admin' : 'manager',
            assignedMembers: updatedList,
          };
          affectedUsers.push(updatedMgr);
          return updatedMgr;
        }

        return u;
      });

      return { ...prev, users: updatedUsers };
    });

    if (currentUser) {
      const myUpdate = affectedUsers.find(u => u.id === currentUser.id);
      if (myUpdate) {
        setCurrentUser(prev => ({ ...prev, ...myUpdate }));
      }
    }

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        const map = new Map((parsed.users || []).map(u => [u.id, u]));
        affectedUsers.forEach(au => map.set(au.id, { ...(map.get(au.id) || {}), ...au }));
        parsed.users = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    for (const au of affectedUsers) {
      await saveUserToFirestore(au);
      if (au.role === 'manager') {
        await saveManagerRoleToFirestore(au.id, true, au.assignedMembers || []);
      }
    }

    try {
      fetch('/api/users/assign-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: userId, managerId, action: 'add' }),
      }).catch(() => {});
    } catch (e) {}

    return { success: true };
  };

  // 2. Remove a single manager from a user (without removing other managers)
  const removeManagerFromUser = async (userId, managerId) => {
    if (!userId || !managerId) return { success: false };

    const affectedUsers = [];

    setData(prev => {
      const updatedUsers = (prev.users || []).map(u => {
        // 1. The user: remove managerId from assignedManagerIds
        if (u.id === userId) {
          const currentMgrs = Array.isArray(u.assignedManagerIds)
            ? u.assignedManagerIds
            : (u.assignedManagerId ? [u.assignedManagerId] : []);
          const updatedMgrs = currentMgrs.filter(id => id !== managerId);
          const updatedUser = {
            ...u,
            assignedManagerIds: updatedMgrs,
            assignedManagerId: updatedMgrs[0] || '',
          };
          affectedUsers.push(updatedUser);
          return updatedUser;
        }

        // 2. The manager: remove userId from assignedMembers
        if (u.id === managerId) {
          const currentList = Array.isArray(u.assignedMembers) ? u.assignedMembers : [];
          const updatedList = currentList.filter(id => id !== userId);
          const updatedMgr = {
            ...u,
            assignedMembers: updatedList,
          };
          affectedUsers.push(updatedMgr);
          return updatedMgr;
        }

        return u;
      });

      return { ...prev, users: updatedUsers };
    });

    if (currentUser) {
      const myUpdate = affectedUsers.find(u => u.id === currentUser.id);
      if (myUpdate) {
        setCurrentUser(prev => ({ ...prev, ...myUpdate }));
      }
    }

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        const map = new Map((parsed.users || []).map(u => [u.id, u]));
        affectedUsers.forEach(au => map.set(au.id, { ...(map.get(au.id) || {}), ...au }));
        parsed.users = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    for (const au of affectedUsers) {
      await saveUserToFirestore(au);
      if (au.role === 'manager') {
        await saveManagerRoleToFirestore(au.id, true, au.assignedMembers || []);
      }
    }

    try {
      fetch('/api/users/assign-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: userId, managerId, action: 'remove' }),
      }).catch(() => {});
    } catch (e) {}

    return { success: true };
  };

  // 3. Set full list of managers for a user
  const setManagersForUser = async (userId, managerIds = []) => {
    if (!userId) return { success: false };
    const cleanManagerIds = Array.from(new Set(managerIds.filter(id => id && id !== userId)));

    const affectedUsers = [];

    setData(prev => {
      const updatedUsers = (prev.users || []).map(u => {
        // Target user
        if (u.id === userId) {
          const updatedUser = {
            ...u,
            assignedManagerIds: cleanManagerIds,
            assignedManagerId: cleanManagerIds[0] || '',
          };
          affectedUsers.push(updatedUser);
          return updatedUser;
        }

        // Managers in cleanManagerIds: ensure userId is included
        if (cleanManagerIds.includes(u.id)) {
          const currentList = Array.isArray(u.assignedMembers) ? u.assignedMembers : [];
          if (!currentList.includes(userId)) {
            const updatedMgr = {
              ...u,
              role: u.role === 'admin' ? 'admin' : 'manager',
              assignedMembers: [...currentList, userId],
            };
            affectedUsers.push(updatedMgr);
            return updatedMgr;
          }
        }

        // Managers NOT in cleanManagerIds who held userId: remove userId
        if (!cleanManagerIds.includes(u.id) && Array.isArray(u.assignedMembers) && u.assignedMembers.includes(userId)) {
          const updatedMgr = {
            ...u,
            assignedMembers: u.assignedMembers.filter(id => id !== userId),
          };
          affectedUsers.push(updatedMgr);
          return updatedMgr;
        }

        return u;
      });

      return { ...prev, users: updatedUsers };
    });

    if (currentUser) {
      const myUpdate = affectedUsers.find(u => u.id === currentUser.id);
      if (myUpdate) {
        setCurrentUser(prev => ({ ...prev, ...myUpdate }));
      }
    }

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        const map = new Map((parsed.users || []).map(u => [u.id, u]));
        affectedUsers.forEach(au => map.set(au.id, { ...(map.get(au.id) || {}), ...au }));
        parsed.users = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    for (const au of affectedUsers) {
      await saveUserToFirestore(au);
      if (au.role === 'manager') {
        await saveManagerRoleToFirestore(au.id, true, au.assignedMembers || []);
      }
    }

    return { success: true };
  };

  // 4. Set full list of assigned members/users for a manager
  const setMembersForManager = async (managerId, memberIds = []) => {
    if (!managerId) return { success: false };
    const cleanMemberIds = Array.from(new Set(memberIds.filter(id => id && id !== managerId)));

    const affectedUsers = [];

    setData(prev => {
      const updatedUsers = (prev.users || []).map(u => {
        // The manager
        if (u.id === managerId) {
          const updatedMgr = {
            ...u,
            role: u.role === 'admin' ? 'admin' : 'manager',
            assignedMembers: cleanMemberIds,
          };
          affectedUsers.push(updatedMgr);
          return updatedMgr;
        }

        // Users in cleanMemberIds: ensure managerId is in assignedManagerIds
        if (cleanMemberIds.includes(u.id)) {
          const currentMgrs = Array.isArray(u.assignedManagerIds)
            ? u.assignedManagerIds
            : (u.assignedManagerId ? [u.assignedManagerId] : []);
          if (!currentMgrs.includes(managerId)) {
            const updatedMgrs = [...currentMgrs, managerId];
            const updatedUser = {
              ...u,
              assignedManagerIds: updatedMgrs,
              assignedManagerId: updatedMgrs[0] || '',
            };
            affectedUsers.push(updatedUser);
            return updatedUser;
          }
        }

        // Users NOT in cleanMemberIds who had managerId: remove managerId
        if (!cleanMemberIds.includes(u.id)) {
          const currentMgrs = Array.isArray(u.assignedManagerIds)
            ? u.assignedManagerIds
            : (u.assignedManagerId ? [u.assignedManagerId] : []);
          if (currentMgrs.includes(managerId) || u.assignedManagerId === managerId) {
            const updatedMgrs = currentMgrs.filter(id => id !== managerId);
            const updatedUser = {
              ...u,
              assignedManagerIds: updatedMgrs,
              assignedManagerId: updatedMgrs[0] || '',
            };
            affectedUsers.push(updatedUser);
            return updatedUser;
          }
        }

        return u;
      });

      return { ...prev, users: updatedUsers };
    });

    if (currentUser) {
      const myUpdate = affectedUsers.find(u => u.id === currentUser.id);
      if (myUpdate) {
        setCurrentUser(prev => ({ ...prev, ...myUpdate }));
      }
    }

    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        const map = new Map((parsed.users || []).map(u => [u.id, u]));
        affectedUsers.forEach(au => map.set(au.id, { ...(map.get(au.id) || {}), ...au }));
        parsed.users = Array.from(map.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    for (const au of affectedUsers) {
      await saveUserToFirestore(au);
      if (au.role === 'manager') {
        await saveManagerRoleToFirestore(au.id, true, au.assignedMembers || []);
      }
    }

    return { success: true };
  };

  // 5. Backward-compatible assignMemberToManager
  const assignMemberToManager = async (memberId, managerId) => {
    if (!managerId) {
      return await setManagersForUser(memberId, []);
    }
    return await addManagerToUser(memberId, managerId);
  };

  const updateManagerPermission = (managerId, config) => {
    setData(prev => {
      const updatedPermissions = {
        ...(prev.managerPermissions || {}),
        [managerId]: { ...(prev.managerPermissions?.[managerId] || {}), ...config },
      };
      try {
        saveGlobalStateToFirestore?.({ managerPermissions: updatedPermissions });
      } catch (e) {}
      return {
        ...prev,
        managerPermissions: updatedPermissions,
      };
    });
  };

  const updateMemberPermission = (memberId, config) => {
    setData(prev => {
      const updatedPermissions = {
        ...(prev.memberPermissions || {}),
        [memberId]: { ...(prev.memberPermissions?.[memberId] || {}), ...config },
      };
      try {
        saveGlobalStateToFirestore?.({ memberPermissions: updatedPermissions });
      } catch (e) {}
      return {
        ...prev,
        memberPermissions: updatedPermissions,
      };
    });
  };

  const updateAllMembersPermissions = (config) => {
    setData(prev => {
      const updatedPermissions = { ...(prev.memberPermissions || {}) };
      (prev.users || []).forEach(u => {
        if (u.role === 'member') {
          updatedPermissions[u.id] = { ...(updatedPermissions[u.id] || {}), ...config };
        }
      });
      try {
        saveGlobalStateToFirestore?.({ memberPermissions: updatedPermissions });
      } catch (e) {}
      return {
        ...prev,
        memberPermissions: updatedPermissions,
      };
    });
  };

  // Activity Helper for active inspected member
  const getMemberActivity = (memberId = selectedMemberId) => {
    return data.activitiesData[memberId] || {
      simplePreaching: {},
      connections: [],
      fruits: [],
      lostSheep: [],
      preachingMeeting: [],
      worshipArrival: [],
      education: [],
      elohimAcademy: { levelChecks: [], somChecks: [], timestamps: {} },
      preachingAcademy: { bookChecks: [], timestamps: {} },
      newSongAcademy: { songChecks: [], timestamps: {} },
    };
  };

  // Direct Navigation to a Member's specific Activity input screen (for Admin/Manager editing)
  const navigateToMemberActivity = (memberId, activityId) => {
    if (memberId) {
      setSelectedMemberId(memberId);
      try {
        localStorage.setItem('star_galaxy_selected_member', memberId);
      } catch (e) {}
    }
    if (activityId === 'gospelDiary') {
      setActiveTab('more');
      return;
    }
    if (activityId) {
      try {
        localStorage.setItem('star_galaxy_selected_activity', activityId);
      } catch (e) {}
      window.dispatchEvent(
        new CustomEvent('star-galaxy-select-activity', {
          detail: { memberId, activityId },
        })
      );
    }
    setActiveTab('activities');
  };

  const computeOverallStarsFromActivity = (act = {}) => {
    let overallPreachingSum = 0;
    Object.values(act.simplePreaching || {}).forEach(c => {
      overallPreachingSum += Number(c) || 0;
    });
    const simplePreachingStars = starCalc.calculateSimplePreachingStars(overallPreachingSum);

    const allConnections = act.connections || [];
    const connectionsStars = starCalc.calculateTotalConnectionsStars(allConnections);

    const allFruits = act.fruits || [];
    const fruitsStars = starCalc.calculateTotalFruitsStars(allFruits);

    const allSheep = act.lostSheep || [];
    const lostSheepStars = starCalc.calculateTotalLostSheepStars(allSheep);

    const meetings = act.preachingMeeting || [];
    const meetingByWeek = {};
    meetings.forEach(m => {
      if (m.date) {
        const week = getSaturdayToFridayWeek(new Date(m.date));
        const key = week.startDate;
        if (!meetingByWeek[key]) meetingByWeek[key] = [];
        meetingByWeek[key].push(m);
      }
    });
    let preachingMeetingStars = 0;
    const meetingWeeks = Object.values(meetingByWeek);
    if (meetingWeeks.length > 0) {
      meetingWeeks.forEach(wList => {
        preachingMeetingStars += starCalc.calculatePreachingMeetingStars(wList);
      });
    } else if (meetings.length > 0) {
      preachingMeetingStars = starCalc.calculatePreachingMeetingStars(meetings);
    }

    const worship = act.worshipArrival || [];
    const worshipByWeek = {};
    worship.forEach(w => {
      if (w.date) {
        const week = getSaturdayToFridayWeek(new Date(w.date));
        const key = week.startDate;
        if (!worshipByWeek[key]) worshipByWeek[key] = [];
        worshipByWeek[key].push(w);
      }
    });
    let worshipArrivalStars = 0;
    const worshipWeeks = Object.values(worshipByWeek);
    if (worshipWeeks.length > 0) {
      worshipWeeks.forEach(wList => {
        worshipArrivalStars += starCalc.calculateWorshipArrivalStars(wList);
      });
    } else if (worship.length > 0) {
      worshipArrivalStars = starCalc.calculateWorshipArrivalStars(worship);
    }

    const edu = act.education || [];
    const eduByWeek = {};
    edu.forEach(e => {
      if (e.date) {
        const week = getSaturdayToFridayWeek(new Date(e.date));
        const key = week.startDate;
        if (!eduByWeek[key]) eduByWeek[key] = [];
        eduByWeek[key].push(e);
      }
    });
    let educationStars = 0;
    const eduWeeks = Object.values(eduByWeek);
    if (eduWeeks.length > 0) {
      eduWeeks.forEach(eList => {
        educationStars += starCalc.calculateEducationStars(eList);
      });
    } else if (edu.length > 0) {
      educationStars = starCalc.calculateEducationStars(edu);
    }

    const elohimStars = starCalc.calculateElohimAcademyStars(
      act.elohimAcademy?.levelChecks || [],
      act.elohimAcademy?.somChecks || []
    );

    const preachingAcademyStars = starCalc.calculatePreachingAcademyStars(
      act.preachingAcademy?.bookChecks || []
    );

    const newSongAcademyStars = starCalc.calculateNewSongAcademyStars(
      act.newSongAcademy?.songChecks || []
    );

    return (
      simplePreachingStars +
      connectionsStars +
      fruitsStars +
      lostSheepStars +
      preachingMeetingStars +
      worshipArrivalStars +
      educationStars +
      elohimStars +
      preachingAcademyStars +
      newSongAcademyStars
    );
  };

  const updateMemberActivity = (memberId, activityKey, updater) => {
    let diff = 0;

    setData(prev => {
      const currentMemberData = prev.activitiesData[memberId] || {
        simplePreaching: {},
        connections: [],
        fruits: [],
        lostSheep: [],
        preachingMeeting: [],
        worshipArrival: [],
        education: [],
        elohimAcademy: { levelChecks: [], somChecks: [], timestamps: {} },
        preachingAcademy: { bookChecks: [], timestamps: {} },
        newSongAcademy: { songChecks: [], timestamps: {} },
      };

      const updatedVal = typeof updater === 'function' ? updater(currentMemberData[activityKey]) : updater;
      const updatedMemberData = {
        ...currentMemberData,
        [activityKey]: updatedVal,
      };

      // Exact synchronous star difference check!
      const oldTotal = computeOverallStarsFromActivity(currentMemberData);
      const newTotal = computeOverallStarsFromActivity(updatedMemberData);
      diff = newTotal - oldTotal;

      try {
        fetch('/api/activities/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId, activityKey, data: updatedVal }),
        });
      } catch (e) {}

      saveMemberActivitiesToFirestore(memberId, updatedMemberData);

      return {
        ...prev,
        activitiesData: {
          ...prev.activitiesData,
          [memberId]: updatedMemberData,
        },
      };
    });

    // 🌟 If stars increased, immediately speak the selected Star Voice phrase!
    if (diff > 0) {
      speakStarEarned(diff);
    }
  };

  // Calculate Stars summary for a specific member & date range
  const getMemberStarsBreakdown = (memberId = selectedMemberId, customRange = dateRange) => {
    const act = getMemberActivity(memberId);
    const { startDate, endDate } = customRange;

    // 1. Simple Preaching
    let preachingSum = 0;
    Object.entries(act.simplePreaching || {}).forEach(([dStr, count]) => {
      if (dStr >= startDate && dStr <= endDate) {
        preachingSum += Number(count) || 0;
      }
    });
    const simplePreachingStars = starCalc.calculateSimplePreachingStars(preachingSum);

    // 2. Connections
    const activeConnections = (act.connections || []).filter(c => !c.date || (c.date >= startDate && c.date <= endDate));
    const connectionsStars = starCalc.calculateTotalConnectionsStars(activeConnections);

    // 3. Fruits
    const activeFruits = (act.fruits || []).filter(f => !f.date || (f.date >= startDate && f.date <= endDate));
    const fruitsStars = starCalc.calculateTotalFruitsStars(activeFruits);

    // 4. Lost Sheep
    const activeSheep = (act.lostSheep || []).filter(s => !s.date || (s.date >= startDate && s.date <= endDate));
    const lostSheepStars = starCalc.calculateTotalLostSheepStars(activeSheep);

    // 5. Preaching Meeting
    const activeMeetings = (act.preachingMeeting || []).filter(m => m.date >= startDate && m.date <= endDate);
    const preachingMeetingStars = starCalc.calculatePreachingMeetingStars(activeMeetings);
    const preachingOnTimeCount = activeMeetings.filter(m => m.checked && m.onTime).length;
    const preachingLateCount = activeMeetings.filter(m => m.checked && !m.onTime).length;

    // 6. Worship Arrival
    const activeWorship = (act.worshipArrival || []).filter(w => w.date >= startDate && w.date <= endDate);
    const worshipArrivalStars = starCalc.calculateWorshipArrivalStars(activeWorship);
    const worshipOnTimeCount = activeWorship.filter(w => w.checked && w.onTime).length;
    const worshipLateCount = activeWorship.filter(w => w.checked && !w.onTime).length;

    // 7. Education
    const activeEdu = (act.education || []).filter(e => e.date >= startDate && e.date <= endDate);
    const educationStars = starCalc.calculateEducationStars(activeEdu);

    // 8. Elohim Academy (Calculated according to Date Range)
    const elohimRangeData = starCalc.calculateElohimAcademyStarsInRange(
      act.elohimAcademy?.levelChecks || [],
      act.elohimAcademy?.somChecks || [],
      act.elohimAcademy?.timestamps || {},
      startDate,
      endDate
    );
    const elohimStars = elohimRangeData.stars;
    const elohimCount = elohimRangeData.count;

    // 9. Preaching Academy (Calculated according to Date Range)
    const preachingRangeData = starCalc.calculatePreachingAcademyStarsInRange(
      act.preachingAcademy?.bookChecks || [],
      act.preachingAcademy?.timestamps || {},
      startDate,
      endDate
    );
    const preachingAcademyStars = preachingRangeData.stars;
    const preachingAcademyCount = preachingRangeData.count;

    // 10. New Song Academy (Calculated according to Date Range)
    const newSongRangeData = starCalc.calculateNewSongAcademyStarsInRange(
      act.newSongAcademy?.songChecks || [],
      act.newSongAcademy?.timestamps || {},
      startDate,
      endDate
    );
    const newSongAcademyStars = newSongRangeData.stars;
    const newSongAcademyCount = newSongRangeData.count;

    const totalStars =
      simplePreachingStars +
      connectionsStars +
      fruitsStars +
      lostSheepStars +
      preachingMeetingStars +
      worshipArrivalStars +
      educationStars +
      elohimStars +
      preachingAcademyStars +
      newSongAcademyStars;

    return {
      simplePreaching: { stars: simplePreachingStars, count: preachingSum },
      connections: { stars: connectionsStars, count: activeConnections.length },
      fruits: { stars: fruitsStars, count: activeFruits.length },
      lostSheep: { stars: lostSheepStars, count: activeSheep.length },
      preachingMeeting: {
        stars: preachingMeetingStars,
        count: preachingOnTimeCount,
        onTimeCount: preachingOnTimeCount,
        lateCount: preachingLateCount,
        totalChecks: activeMeetings.length,
      },
      worshipArrival: {
        stars: worshipArrivalStars,
        count: worshipOnTimeCount,
        onTimeCount: worshipOnTimeCount,
        lateCount: worshipLateCount,
        totalChecks: activeWorship.length,
      },
      education: { stars: educationStars, count: activeEdu.length },
      elohimAcademy: {
        stars: elohimStars,
        count: elohimCount,
        allTimeCount: (act.elohimAcademy?.levelChecks?.length || 0) + (act.elohimAcademy?.somChecks?.length || 0),
        allTimeStars: starCalc.calculateElohimAcademyStars(act.elohimAcademy?.levelChecks || [], act.elohimAcademy?.somChecks || []),
      },
      preachingAcademy: {
        stars: preachingAcademyStars,
        count: preachingAcademyCount,
        allTimeCount: act.preachingAcademy?.bookChecks?.length || 0,
        allTimeStars: starCalc.calculatePreachingAcademyStars(act.preachingAcademy?.bookChecks || []),
      },
      newSongAcademy: {
        stars: newSongAcademyStars,
        count: newSongAcademyCount,
        allTimeCount: act.newSongAcademy?.songChecks?.length || 0,
        allTimeStars: starCalc.calculateNewSongAcademyStars(act.newSongAcademy?.songChecks || [], act.newSongAcademy?.timestamps || {}),
      },
      totalStars,
    };
  };

  // Calculate Overall Stars summary from the beginning to present (ignoring date filter)
  const getMemberOverallStarsBreakdown = (memberId = selectedMemberId) => {
    const act = getMemberActivity(memberId);

    // 1. Simple Preaching (All-time sum)
    let overallPreachingSum = 0;
    Object.values(act.simplePreaching || {}).forEach(c => {
      overallPreachingSum += Number(c) || 0;
    });
    const simplePreachingStars = starCalc.calculateSimplePreachingStars(overallPreachingSum);

    // 2. Connections (All-time)
    const allConnections = act.connections || [];
    const connectionsStars = starCalc.calculateTotalConnectionsStars(allConnections);

    // 3. Fruits (All-time)
    const allFruits = act.fruits || [];
    const fruitsStars = starCalc.calculateTotalFruitsStars(allFruits);

    // 4. Lost Sheep (All-time)
    const allSheep = act.lostSheep || [];
    const lostSheepStars = starCalc.calculateTotalLostSheepStars(allSheep);

    // 5. Preaching Meeting (All historical weeks calculated)
    const meetings = act.preachingMeeting || [];
    const meetingByWeek = {};
    meetings.forEach(m => {
      if (m.date) {
        const week = getSaturdayToFridayWeek(new Date(m.date));
        const key = week.startDate;
        if (!meetingByWeek[key]) meetingByWeek[key] = [];
        meetingByWeek[key].push(m);
      }
    });
    let preachingMeetingStars = 0;
    const meetingWeeks = Object.values(meetingByWeek);
    if (meetingWeeks.length > 0) {
      meetingWeeks.forEach(wList => {
        preachingMeetingStars += starCalc.calculatePreachingMeetingStars(wList);
      });
    } else if (meetings.length > 0) {
      preachingMeetingStars = starCalc.calculatePreachingMeetingStars(meetings);
    }

    // 6. Worship Arrival (All historical weeks calculated)
    const worship = act.worshipArrival || [];
    const worshipByWeek = {};
    worship.forEach(w => {
      if (w.date) {
        const week = getSaturdayToFridayWeek(new Date(w.date));
        const key = week.startDate;
        if (!worshipByWeek[key]) worshipByWeek[key] = [];
        worshipByWeek[key].push(w);
      }
    });
    let worshipArrivalStars = 0;
    const worshipWeeks = Object.values(worshipByWeek);
    if (worshipWeeks.length > 0) {
      worshipWeeks.forEach(wList => {
        worshipArrivalStars += starCalc.calculateWorshipArrivalStars(wList);
      });
    } else if (worship.length > 0) {
      worshipArrivalStars = starCalc.calculateWorshipArrivalStars(worship);
    }

    // 7. Education (All historical weeks calculated)
    const edu = act.education || [];
    const eduByWeek = {};
    edu.forEach(e => {
      if (e.date) {
        const week = getSaturdayToFridayWeek(new Date(e.date));
        const key = week.startDate;
        if (!eduByWeek[key]) eduByWeek[key] = [];
        eduByWeek[key].push(e);
      }
    });
    let educationStars = 0;
    const eduWeeks = Object.values(eduByWeek);
    if (eduWeeks.length > 0) {
      eduWeeks.forEach(eList => {
        educationStars += starCalc.calculateEducationStars(eList);
      });
    } else if (edu.length > 0) {
      educationStars = starCalc.calculateEducationStars(edu);
    }

    // 8. Elohim Academy (Curriculum from beginning to present)
    const elohimStars = starCalc.calculateElohimAcademyStars(
      act.elohimAcademy?.levelChecks || [],
      act.elohimAcademy?.somChecks || []
    );

    // 9. Preaching Academy (Curriculum from beginning to present)
    const preachingAcademyStars = starCalc.calculatePreachingAcademyStars(
      act.preachingAcademy?.bookChecks || []
    );

    // 10. New Song Academy (Overall across all historical weekly cycles)
    const newSongAcademyStars = starCalc.calculateNewSongAcademyStars(
      act.newSongAcademy?.songChecks || [],
      act.newSongAcademy?.timestamps || {}
    );

    const totalStars =
      simplePreachingStars +
      connectionsStars +
      fruitsStars +
      lostSheepStars +
      preachingMeetingStars +
      worshipArrivalStars +
      educationStars +
      elohimStars +
      preachingAcademyStars +
      newSongAcademyStars;

    return {
      simplePreaching: { stars: simplePreachingStars, count: overallPreachingSum },
      connections: { stars: connectionsStars, count: allConnections.length },
      fruits: { stars: fruitsStars, count: allFruits.length },
      lostSheep: { stars: lostSheepStars, count: allSheep.length },
      preachingMeeting: {
        stars: preachingMeetingStars,
        count: meetings.filter(m => m.checked && m.onTime).length,
        onTimeCount: meetings.filter(m => m.checked && m.onTime).length,
        lateCount: meetings.filter(m => m.checked && !m.onTime).length,
        totalChecks: meetings.filter(m => m.checked).length,
      },
      worshipArrival: {
        stars: worshipArrivalStars,
        count: worship.filter(w => w.checked && w.onTime).length,
        onTimeCount: worship.filter(w => w.checked && w.onTime).length,
        lateCount: worship.filter(w => w.checked && !w.onTime).length,
        totalChecks: worship.filter(w => w.checked).length,
      },
      education: { stars: educationStars, count: new Set(edu.map(e => e.date)).size },
      elohimAcademy: { stars: elohimStars, count: (act.elohimAcademy?.levelChecks?.length || 0) + (act.elohimAcademy?.somChecks?.length || 0) },
      preachingAcademy: { stars: preachingAcademyStars, count: act.preachingAcademy?.bookChecks?.length || 0 },
      newSongAcademy: { stars: newSongAcademyStars, count: act.newSongAcademy?.songChecks?.length || 0 },
      totalStars,
    };
  };

  // Encouragement Messages
  const addEncouragementMessage = (text) => {
    const now = new Date();
    const newMsg = {
      id: 'enc-' + Date.now(),
      senderName: currentUser?.nickname || currentUser?.name || 'Member',
      senderId: currentUser?.id,
      text,
      timestamp: Date.now(),
      createdAtIso: now.toISOString(),
      createdAt: formatDateTime(now),
    };

    try {
      fetch('/api/messages/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg),
      });
    } catch (e) {}

    saveEncouragementMessageToFirestore(newMsg);
    setData(prev => ({
      ...prev,
      encouragementMessages: [newMsg, ...(prev.encouragementMessages || [])],
    }));
  };

  const deleteEncouragementMessage = (id) => {
    try {
      fetch('/api/messages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {}

    deleteEncouragementMessageFromFirestore(id);
    setData(prev => ({
      ...prev,
      encouragementMessages: (prev.encouragementMessages || []).filter(m => m.id !== id),
    }));
  };

  // Notices
  const addAdminNotice = (title, content, priority = 'normal', mediaUrl = null, mediaType = null, mediaItems = []) => {
    const items = Array.isArray(mediaItems) && mediaItems.length > 0
      ? mediaItems
      : (mediaUrl ? [{ url: mediaUrl, type: mediaType || 'image' }] : []);

    const notice = {
      id: 'ntc-' + Date.now(),
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      title,
      content,
      date: formatDate(new Date()),
      priority,
      mediaUrl: mediaUrl || (items[0]?.url || null),
      mediaType: mediaType || (items[0]?.type || null),
      mediaItems: items,
      reactions: {},
      isArchived: false,
    };

    try {
      fetch('/api/notices/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notice),
      });
    } catch (e) {}

    saveAdminNoticeToFirestore(notice);
    setData(prev => ({
      ...prev,
      adminNotices: [notice, ...(prev.adminNotices || [])],
    }));
  };

  const deleteAdminNotice = (id) => {
    try {
      fetch('/api/notices/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {}

    deleteAdminNoticeFromFirestore(id);
    setData(prev => ({
      ...prev,
      adminNotices: (prev.adminNotices || []).filter(n => (n.id || n._id || n.date) !== id),
    }));
  };

  const updateAdminNotice = (updatedNotice) => {
    if (!updatedNotice) return;
    const targetId = updatedNotice.id || updatedNotice._id || updatedNotice.date;

    try {
      fetch('/api/notices/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notice: updatedNotice }),
      });
    } catch (e) {}

    saveAdminNoticeToFirestore(updatedNotice);

    setData(prev => ({
      ...prev,
      adminNotices: (prev.adminNotices || []).map(n =>
        ((n.id || n._id || n.date) === targetId ? { ...n, ...updatedNotice } : n)
      ),
    }));
  };

  // Gallery Media
  const addGalleryMedia = (item) => {
    const items = Array.isArray(item.mediaItems) && item.mediaItems.length > 0
      ? item.mediaItems
      : (item.url ? [{ url: item.url, type: item.type || 'image' }] : []);

    const newId = 'gal-' + Date.now();
    const newMedia = {
      id: newId,
      timestamp: Date.now(),
      title: item.title || 'Media',
      category: item.category || 'Special',
      priority: item.priority || 'normal',
      type: item.type || (items[0]?.type || 'image'),
      url: item.url || (items[0]?.url || ''),
      mediaItems: items,
      reactions: item.reactions || {},
      description: item.description || '',
      realization: item.realization || '',
      realizations: item.realizations || [],
      isArchived: Boolean(item.isArchived),
      date: formatDate(new Date()),
      time: formatTimeOnly(new Date()),
      createdAt: item.createdAt || new Date().toISOString(),
    };

    if (items.length > 0) {
      saveLocalPostMedia(newId, items).catch(() => {});
    }

    saveGalleryMediaToFirestore(newMedia);

    try {
      fetch('/api/gallery/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedia),
      }).catch(() => {});
    } catch (e) {}

    setData(prev => ({
      ...prev,
      galleryMedia: [newMedia, ...(prev.galleryMedia || []).filter(g => (g.id || g._id) !== newId)],
    }));

    return newMedia;
  };

  const updateGalleryMedia = (updatedItem) => {
    const targetId = updatedItem.id || updatedItem._id;
    if (!targetId) return;

    if (Array.isArray(updatedItem.mediaItems) && updatedItem.mediaItems.length > 0) {
      saveLocalPostMedia(targetId, updatedItem.mediaItems).catch(() => {});
    }

    saveGalleryMediaToFirestore(updatedItem);

    try {
      fetch('/api/gallery/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      }).catch(() => {});
    } catch (e) {}

    setData(prev => ({
      ...prev,
      galleryMedia: (prev.galleryMedia || []).map(g =>
        (g.id || g._id) === targetId ? { ...g, ...updatedItem } : g
      ),
    }));
  };

  const deleteGalleryMedia = (id) => {
    deleteGalleryMediaFromFirestore(id);

    try {
      fetch('/api/gallery/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {}

    setData(prev => ({
      ...prev,
      galleryMedia: (prev.galleryMedia || []).filter(g => (g.id !== id && g._id !== id)),
    }));
  };

  // Children Fellowship Media
  const addChildrenMedia = (item) => {
    const items = Array.isArray(item.mediaItems) && item.mediaItems.length > 0
      ? item.mediaItems
      : (item.url ? [{ url: item.url, type: item.type || 'image' }] : []);

    const newChildren = {
      id: 'chm-' + Date.now(),
      timestamp: Date.now(),
      title: item.title || 'Children Activity',
      priority: item.priority || 'normal',
      type: item.type || (items[0]?.type || 'image'),
      url: item.url || (items[0]?.url || ''),
      mediaItems: items,
      reactions: item.reactions || {},
      description: item.description || '',
      realization: item.realization || '',
      realizations: item.realizations || [],
      isArchived: Boolean(item.isArchived),
      date: formatDate(new Date()),
      createdAt: new Date().toISOString(),
    };

    saveChildrenMediaToFirestore(newChildren);

    setData(prev => ({
      ...prev,
      childrenMedia: [newChildren, ...(prev.childrenMedia || [])],
    }));
  };

  const updateChildrenMedia = (updatedItem) => {
    const targetId = updatedItem.id || updatedItem._id;
    if (!targetId) return;

    saveChildrenMediaToFirestore(updatedItem);

    setData(prev => ({
      ...prev,
      childrenMedia: (prev.childrenMedia || []).map(g =>
        ((g.id || g._id) === targetId ? { ...g, ...updatedItem } : g)
      ),
    }));
  };

  const deleteChildrenMedia = (id) => {
    deleteChildrenMediaFromFirestore(id);
    setData(prev => ({
      ...prev,
      childrenMedia: (prev.childrenMedia || []).filter(g => (g.id !== id && g._id !== id)),
    }));
  };

  const toggleChildrenMediaReaction = (mediaId, emoji) => {
    if (!currentUser?.id || !mediaId || !emoji) return;
    const uId = currentUser.id;

    let targetItem = null;
    setData(prev => {
      const updated = (prev.childrenMedia || []).map(item => {
        const iId = item.id || item._id;
        if (iId === mediaId) {
          const reactions = { ...(item.reactions || {}) };
          const userList = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
          if (userList.includes(uId)) {
            reactions[emoji] = userList.filter(id => id !== uId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...userList, uId];
          }
          targetItem = { ...item, reactions };
          return targetItem;
        }
        return item;
      });
      return { ...prev, childrenMedia: updated };
    });

    if (targetItem) {
      saveChildrenMediaToFirestore(targetItem);
    }
  };

  // Media Categories (Special, Children, + Custom Categories)
  const addMediaCategory = async (catName) => {
    if (!catName || !catName.trim()) return;
    const trimmed = catName.trim();
    const current = data.mediaCategories || ['Special', 'Children'];
    if (current.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    const updated = [...current, trimmed];
    setData(prev => ({ ...prev, mediaCategories: updated }));
    await saveMediaCategoriesToFirestore(updated);
  };

  const deleteMediaCategory = async (catName) => {
    if (!catName || catName === 'Special' || catName === 'Children') return;
    const current = data.mediaCategories || ['Special', 'Children'];
    const updated = current.filter(c => c.toLowerCase() !== catName.toLowerCase());
    setData(prev => ({ ...prev, mediaCategories: updated }));
    await saveMediaCategoriesToFirestore(updated);
  };

  // 📁 Shared Files / Google Docs / Videos / Audio Management
  const addSharedFile = async (fileItem) => {
    const fileId = fileItem.id || ('file-' + Date.now());
    const rawUrl = fileItem.fileUrl || fileItem.originalUrl || '';

    // If local base64 data, store in IndexedDB for fast local access
    if (typeof rawUrl === 'string' && rawUrl.startsWith('data:')) {
      await saveLocalFileData(fileId, rawUrl);
    }

    const newFile = {
      id: fileId,
      title: fileItem.title?.trim() || 'Document',
      description: fileItem.description?.trim() || '',
      category: fileItem.category || 'doc',
      fileUrl: rawUrl,
      originalUrl: fileItem.originalUrl || rawUrl,
      assignedTo: Array.isArray(fileItem.assignedTo) && fileItem.assignedTo.length > 0 ? fileItem.assignedTo : ['all'],
      assignedNames: Array.isArray(fileItem.assignedNames) ? fileItem.assignedNames : [],
      createdAt: formatDate(new Date()),
      createdBy: currentUser?.name || 'Admin',
    };

    // Save to Firestore (auto-chunked if large!)
    await saveSharedFileToFirestore(newFile);

    try {
      fetch('/api/files/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFile),
      });
    } catch (e) {}

    setData(prev => ({
      ...prev,
      sharedFiles: [newFile, ...(prev.sharedFiles || []).filter(f => f.id !== fileId)],
    }));
    return newFile;
  };

  const updateSharedFile = async (updatedItem) => {
    const targetId = updatedItem.id;
    if (!targetId) return;

    const rawUrl = updatedItem.fileUrl || updatedItem.originalUrl || '';
    if (typeof rawUrl === 'string' && rawUrl.startsWith('data:')) {
      await saveLocalFileData(targetId, rawUrl);
    }

    await saveSharedFileToFirestore(updatedItem);

    try {
      fetch('/api/files/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
    } catch (e) {}

    setData(prev => ({
      ...prev,
      sharedFiles: (prev.sharedFiles || []).map(f =>
        f.id === targetId ? { ...f, ...updatedItem } : f
      ),
    }));
  };

  const deleteSharedFile = async (fileId) => {
    const item = (data.sharedFiles || []).find(f => f.id === fileId);
    await deleteSharedFileFromFirestore(fileId, item?.totalChunks || 0);
    await deleteLocalFileData(fileId);

    try {
      fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      });
    } catch (e) {}

    setData(prev => ({
      ...prev,
      sharedFiles: (prev.sharedFiles || []).filter(f => f.id !== fileId),
    }));
  };

  // News Posts (Unlimited photos/media with IndexedDB caching + Firestore 400KB chunking)
  const addNewsPost = async (post) => {
    let expiresAt = null;
    const now = new Date();
    if (post.disappearedSetting === '1h') expiresAt = new Date(now.getTime() + 1 * 3600000).toISOString();
    else if (post.disappearedSetting === '6h') expiresAt = new Date(now.getTime() + 6 * 3600000).toISOString();
    else if (post.disappearedSetting === '24h') expiresAt = new Date(now.getTime() + 24 * 3600000).toISOString();
    else if (post.disappearedSetting === '7d') expiresAt = new Date(now.getTime() + 7 * 86400000).toISOString();
    else if (post.customExpiry) expiresAt = new Date(post.customExpiry).toISOString();

    const items = Array.isArray(post.mediaItems) && post.mediaItems.length > 0
      ? post.mediaItems
      : (post.mediaUrl ? [{ url: post.mediaUrl, type: post.mediaType || 'image' }] : []);

    const newPostId = 'post-' + Date.now();

    // 1. Immediately cache all media in IndexedDB so all 20+ photos are stored safely offline
    if (items.length > 0) {
      await saveLocalPostMedia(newPostId, items);
    }

    const newPost = {
      id: newPostId,
      timestamp: Date.now(),
      createdAt: now.toISOString(),
      authorId: currentUser?.id || 'admin',
      authorName: currentUser?.nickname || currentUser?.name || 'Admin',
      title: post.title || '',
      date: formatDate(now),
      time: formatTimeOnly(now),
      place: post.place || '',
      feelingEmoji: post.feelingEmoji || '😊',
      message: post.message,
      mediaUrl: post.mediaUrl || (items[0]?.url || ''),
      mediaType: post.mediaType || (items[0]?.type || 'image'),
      mediaItems: items,
      totalMediaCount: items.length,
      reactions: {},
      disappearedSetting: post.disappearedSetting || '7d',
      expiresAt,
      isExpired: false,
    };

    // 2. Optimistically update local React state right away at the very top (sorted newest first)
    setData(prev => {
      const existing = (prev.newsPosts || []).filter(p => (p.id || p._id) !== newPostId);
      const combined = [newPost, ...existing];
      combined.sort((a, b) => {
        const diff = getPostSortTime(b) - getPostSortTime(a);
        if (diff !== 0) return diff;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
      return {
        ...prev,
        newsPosts: combined,
      };
    });

    // 3. Save to Firestore (auto-chunked into safe post_media_chunks if > 450KB)
    await saveNewsPostToFirestore(newPost);

    try {
      const lightPost = { ...newPost, mediaItems: items.slice(0, 2) };
      fetch('/api/news/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: lightPost }),
      }).catch(() => {});
    } catch (e) {}

    return newPost;
  };

  const deleteNewsPost = async (id) => {
    const post = (data.newsPosts || []).find(p => (p.id || p._id || p.timestamp) === id);
    const totalChunks = post?.totalChunks || 0;

    await deleteLocalPostMedia(id);
    await deleteNewsPostFromFirestore(id, totalChunks);

    try {
      fetch('/api/news/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).catch(() => {});
    } catch (e) {}

    setData(prev => ({
      ...prev,
      newsPosts: (prev.newsPosts || []).filter(p => (p.id || p._id || p.timestamp) !== id),
    }));
  };

  const updateNewsPost = async (updatedPost) => {
    if (!updatedPost) return;
    const targetId = updatedPost.id || updatedPost._id || updatedPost.timestamp;

    const items = Array.isArray(updatedPost.mediaItems) ? updatedPost.mediaItems : [];
    if (items.length > 0) {
      await saveLocalPostMedia(targetId, items);
    }

    setData(prev => ({
      ...prev,
      newsPosts: (prev.newsPosts || []).map(p =>
        ((p.id || p._id || p.timestamp) === targetId ? { ...p, ...updatedPost } : p)
      ),
    }));

    await saveNewsPostToFirestore(updatedPost);

    try {
      const lightPost = { ...updatedPost, mediaItems: items.slice(0, 2) };
      fetch('/api/news/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: lightPost }),
      }).catch(() => {});
    } catch (e) {}
  };

  // Reactions for Notices, Media Gallery, and News Posts
  const toggleNoticeReaction = (noticeId, emoji) => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;

    let targetNotice = null;
    setData(prev => {
      const updatedNotices = (prev.adminNotices || []).map(notice => {
        const nId = notice.id || notice._id || notice.date;
        if (nId === noticeId || notice.id === noticeId) {
          const reactions = { ...(notice.reactions || {}) };
          const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
          if (users.includes(userId)) {
            reactions[emoji] = users.filter(id => id !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...users, userId];
          }
          targetNotice = { ...notice, reactions };
          return targetNotice;
        }
        return notice;
      });
      return { ...prev, adminNotices: updatedNotices };
    });

    if (targetNotice) {
      saveAdminNoticeToFirestore(targetNotice);
    }

    try {
      fetch('/api/reactions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'notice', itemId: noticeId, emoji, userId }),
      });
    } catch (e) {}
  };

  const toggleGalleryReaction = (mediaId, emoji) => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;

    let targetMedia = null;
    setData(prev => {
      const updatedGallery = (prev.galleryMedia || []).map(item => {
        const mId = item.id || item._id;
        if (mId === mediaId || item.id === mediaId) {
          const reactions = { ...(item.reactions || {}) };
          const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
          if (users.includes(userId)) {
            reactions[emoji] = users.filter(id => id !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...users, userId];
          }
          targetMedia = { ...item, reactions };
          return targetMedia;
        }
        return item;
      });
      return { ...prev, galleryMedia: updatedGallery };
    });

    if (targetMedia) {
      saveGalleryMediaToFirestore(targetMedia);
    }

    try {
      fetch('/api/reactions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'gallery', itemId: mediaId, emoji, userId }),
      });
    } catch (e) {}
  };

  const toggleNewsPostReaction = (postId, emoji) => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;

    let targetPost = null;
    setData(prev => {
      const updatedPosts = (prev.newsPosts || []).map(post => {
        const pId = post.id || post._id;
        if (pId === postId || post.id === postId) {
          const reactions = { ...(post.reactions || {}) };
          const users = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
          if (users.includes(userId)) {
            reactions[emoji] = users.filter(id => id !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...users, userId];
          }
          targetPost = { ...post, reactions };
          return targetPost;
        }
        return post;
      });
      return { ...prev, newsPosts: updatedPosts };
    });

    if (targetPost) {
      saveNewsPostToFirestore(targetPost);
    }

    try {
      fetch('/api/reactions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'news', itemId: postId, emoji, userId }),
      });
    } catch (e) {}
  };

  // Feedback & Suggestions
  const addFeedback = (topic, details) => {
    const feedback = {
      id: 'fb-' + Date.now(),
      authorName: currentUser?.name || 'Member',
      authorId: currentUser?.id,
      topic,
      details,
      date: formatDate(new Date()),
      time: formatTimeOnly(new Date()),
    };

    try {
      fetch('/api/feedback/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      });
    } catch (e) {}

    setData(prev => ({
      ...prev,
      feedbackList: [feedback, ...(prev.feedbackList || [])],
    }));
  };

  const deleteFeedback = (id) => {
    try {
      fetch('/api/feedback/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (e) {}

    setData(prev => ({
      ...prev,
      feedbackList: (prev.feedbackList || []).filter(f => f.id !== id),
    }));
  };

  // 📖 Gospel Diary Actions (Strictly User Isolated)
  const saveGospelDiaryEntry = async (entry) => {
    if (!currentUser) return { success: false, error: 'No active user' };
    const entryId = entry.id || ('diary-' + Date.now());
    const fullEntry = {
      ...entry,
      id: entryId,
      userId: currentUser.id,
      authorName: currentUser.name,
      createdAt: entry.createdAt || new Date().toISOString(),
    };

    setData(prev => {
      const userDiary = prev.gospelDiary?.[currentUser.id] || [];
      const existingIdx = userDiary.findIndex(d => d.id === entryId);
      let updatedUserDiary;
      if (existingIdx !== -1) {
        updatedUserDiary = [...userDiary];
        updatedUserDiary[existingIdx] = fullEntry;
      } else {
        updatedUserDiary = [fullEntry, ...userDiary];
      }
      return {
        ...prev,
        gospelDiary: {
          ...prev.gospelDiary,
          [currentUser.id]: updatedUserDiary,
        },
      };
    });

    try {
      await fetch('/api/diary/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, entry: fullEntry }),
      });
    } catch (e) {}

    const curEntries = data.gospelDiary?.[currentUser.id] || [];
    const updatedForCloud = [fullEntry, ...curEntries.filter(d => d.id !== entryId)];
    saveUserGospelDiaryToFirestore(currentUser.id, updatedForCloud);

    return { success: true, entry: fullEntry };
  };

  const deleteGospelDiaryEntry = async (entryId) => {
    if (!currentUser) return;
    setData(prev => {
      const userDiary = prev.gospelDiary?.[currentUser.id] || [];
      return {
        ...prev,
        gospelDiary: {
          ...prev.gospelDiary,
          [currentUser.id]: userDiary.filter(d => d.id !== entryId),
        },
      };
    });

    try {
      await fetch('/api/diary/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, entryId }),
      });
    } catch (e) {}

    const curEntries = data.gospelDiary?.[currentUser.id] || [];
    saveUserGospelDiaryToFirestore(currentUser.id, curEntries.filter(d => d.id !== entryId));
  };

  return (
    <AppContext.Provider
      value={{
        data,
        language,
        setLanguage,
        t,
        currentUser,
        setCurrentUser,
        selectedMemberId,
        setSelectedMemberId,
        activeTab,
        setActiveTab,
        dateRange,
        setDateRange,
        isPinLocked,
        setIsPinLocked,
        updatePinLockSetting,
        showUpdateModal,
        setShowUpdateModal,
        showPendingApprovalsModal,
        setShowPendingApprovalsModal,
        updateSettings,
        updateAutoUserApproval,
        switchUser,
        canEditMember,
        canUserModifyPastDates,
        isDateAllowedForInput,
        login,
        register,
        sendOfficialVerificationEmail,
        verifyUserContact,
        manualVerifyContact,
        logout,
        changePassword,
        resetPasswordWithContact,
        adminResetPassword,
        updateProfile,
        updatePersonalPin,
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
        setManagerRole,
        assignMemberToManager,
        addManagerToUser,
        removeManagerFromUser,
        setManagersForUser,
        setMembersForManager,
        updateManagerPermission,
        updateMemberPermission,
        updateAllMembersPermissions,
        getMemberActivity,
        updateMemberActivity,
        navigateToMemberActivity,
        getMemberStarsBreakdown,
        getMemberOverallStarsBreakdown,
        addEncouragementMessage,
        deleteEncouragementMessage,
        addAdminNotice,
        updateAdminNotice,
        deleteAdminNotice,
        addGalleryMedia,
        updateGalleryMedia,
        deleteGalleryMedia,
        addChildrenMedia,
        updateChildrenMedia,
        deleteChildrenMedia,
        toggleChildrenMediaReaction,
        addMediaCategory,
        deleteMediaCategory,
        addNewsPost,
        updateNewsPost,
        deleteNewsPost,
        toggleNoticeReaction,
        toggleGalleryReaction,
        toggleNewsPostReaction,
        addFeedback,
        deleteFeedback,
        saveGospelDiaryEntry,
        deleteGospelDiaryEntry,
        addSharedFile,
        updateSharedFile,
        deleteSharedFile,
        viewedNoticeIds,
        viewedNewsIds,
        markNoticeAsViewed,
        markAllNoticesAsViewed,
        markNewsAsViewed,
        markAllNewsAsViewed,
        unviewedNotices,
        unviewedNews,
        unreadNoticeCount,
        unreadNewsCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
