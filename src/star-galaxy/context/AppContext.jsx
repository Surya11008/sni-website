import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getSaturdayToFridayWeek, formatDate, formatDateTime, formatTimeOnly, getPostSortTime } from '../utils/dateUtils';
import * as starCalc from '../utils/starCalculations';
import { TRANSLATIONS } from '../utils/translations';
import { isFirebaseConfigured, auth } from '../firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import {
  subscribeUsers,
  saveUserToFirestore,
  deleteUserFromFirestore,
  savePendingRegistrationToFirestore,
  subscribePendingRegistrations,
  removePendingRegistrationFromFirestore,
  markRegistrationApprovedInFirestore,
  getPendingRegistrationsFromFirestore,
  getAllUsersFromFirestore,
  subscribeUserActivities,
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

export function AppProvider({ children, initialUser }) {
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

  // Helper to extract active authenticated user from SNI (initialUser prop, Firebase Auth, or unified localStorage)
  const getActiveSniUser = (propUser) => {
    if (propUser && (propUser.uid || propUser.id || propUser.email)) {
      return propUser;
    }
    try {
      if (auth?.currentUser) {
        return {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName,
        };
      }
    } catch (e) {}

    const stored =
      localStorage.getItem('sni_user_session') ||
      localStorage.getItem('sni_unified_session') ||
      localStorage.getItem('sni_current_user') ||
      localStorage.getItem('sni_temp_session');

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.uid || parsed.userId || parsed.id || parsed.email)) {
          return {
            uid: parsed.uid || parsed.userId || parsed.id,
            email: parsed.email,
            displayName: parsed.displayName || parsed.fullName || parsed.username,
            role: parsed.role,
            status: parsed.status,
          };
        }
      } catch (e) {}
    }
    return null;
  };

  // Helper to resolve or automatically create approved Star Galaxy user matching SNI login
  const resolveStarGalaxyUser = (sniUser, usersList = []) => {
    if (!sniUser) return null;

    const email = (sniUser.email || '').toLowerCase().trim();
    const rawId = sniUser.uid || sniUser.id || sniUser.userId || (email ? email.split('@')[0] : 'user');
    const uid = String(rawId);
    const username = sniUser.username || (email ? email.split('@')[0] : uid);
    const displayName =
      sniUser.displayName ||
      sniUser.fullName ||
      sniUser.name ||
      username ||
      'Member';

    const isAdmin =
      sniUser.role === 'admin' ||
      email === 'surya11008@sni.org.in' ||
      email === 'admin@sni.org.in' ||
      email.startsWith('surya') ||
      uid.toLowerCase() === 'surya11008';

    // 1. If Admin, always map to canonical surya11008 admin account in Star Galaxy
    if (isAdmin) {
      const adminIndex = usersList.findIndex(u => u.id === 'surya11008' || u.role === 'admin');
      if (adminIndex !== -1) {
        return {
          ...usersList[adminIndex],
          id: 'surya11008',
          role: 'admin',
          status: 'approved',
          name: displayName.includes('Surya') || displayName.includes('Admin') ? displayName : `Admin (${displayName})`,
        };
      }
    }

    // 2. Look for matching existing user in Star Galaxy
    const existing = usersList.find(
      u =>
        String(u.id) === uid ||
        (email && u.contact && u.contact.toLowerCase() === email) ||
        (email && u.email && u.email.toLowerCase() === email) ||
        (username && u.username && u.username.toLowerCase() === username.toLowerCase())
    );

    if (existing) {
      return {
        ...existing,
        id: existing.id || uid,
        name: displayName || existing.name,
        role: isAdmin ? 'admin' : (sniUser.role || existing.role || 'member'),
        status: 'approved',
        hasSetPersonalPin: true,
      };
    }

    // 3. New user - auto-create approved Star Galaxy user profile
    return {
      id: uid,
      username: username,
      name: displayName,
      nickname: displayName.split(' ')[0] || displayName,
      contact: email || sniUser.phone || username,
      email: email,
      phone: sniUser.phone || '',
      role: isAdmin ? 'admin' : (sniUser.role || 'member'),
      status: 'approved',
      hasSetPersonalPin: true,
      pin: '1234',
      personalPin: '1234',
      place: sniUser.place || 'Assembly Sanctuary',
      moreDetails: sniUser.ministryRole || 'SNI Assembly Member',
      createdAt: sniUser.createdAt || new Date().toISOString().split('T')[0],
    };
  };

  // Current logged in user (SNI login is main & master authority!)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const activeSni = getActiveSniUser(initialUser);
      if (activeSni) {
        const resolved = resolveStarGalaxyUser(activeSni, data.users || []);
        if (resolved) {
          localStorage.setItem(SESSION_USER_KEY, resolved.id);
          sessionStorage.setItem('star_galaxy_pin_unlocked', 'true');
          return resolved;
        }
      }

      const savedUserId = localStorage.getItem(SESSION_USER_KEY);
      if (savedUserId) {
        const found = (data.users || []).find(u => String(u.id) === String(savedUserId));
        if (found && found.status === 'approved') return found;
      }
    } catch (e) {
      console.warn('Error initializing Star Galaxy user from SNI session:', e);
    }

    return null;
  });

  // Strict Unified Session Sync: whenever SNI user logs in, changes, or mounts,
  // ensure Star Galaxy ALWAYS mirrors that exact logged in user!
  useEffect(() => {
    const activeSni = getActiveSniUser(initialUser);
    if (activeSni) {
      const resolved = resolveStarGalaxyUser(activeSni, data.users || []);
      if (resolved) {
        const isDifferentUser = !currentUser || String(currentUser.id) !== String(resolved.id);
        const needsRoleOrStatusUpdate =
          currentUser &&
          (currentUser.role !== resolved.role || currentUser.status !== 'approved');

        if (isDifferentUser || needsRoleOrStatusUpdate) {
          setCurrentUser(resolved);
          localStorage.setItem(SESSION_USER_KEY, resolved.id);
          sessionStorage.setItem('star_galaxy_pin_unlocked', 'true');
          setIsPinLocked(false);
          setSelectedMemberId(resolved.id);

          // If this user was newly synthesized and doesn't exist in data.users, append and persist
          const exists = (data.users || []).some(u => String(u.id) === String(resolved.id));
          if (!exists) {
            setData(prev => {
              const updatedUsers = [...(prev.users || []), resolved];
              try {
                const rawLocal = localStorage.getItem(STORAGE_KEY);
                const parsed = rawLocal ? JSON.parse(rawLocal) : {};
                parsed.users = updatedUsers;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
              } catch (e) {}
              return { ...prev, users: updatedUsers };
            });
            saveUserToFirestore(resolved).catch(() => {});
          }
        }
      }
    } else if (!initialUser && !localStorage.getItem('sni_user_session') && !localStorage.getItem('sni_unified_session')) {
      // If SNI has logged out completely, clear Star Galaxy currentUser as well
      if (currentUser) {
        setCurrentUser(null);
        localStorage.removeItem(SESSION_USER_KEY);
      }
    }
  }, [initialUser, data.users, currentUser]);

  // Target member being inspected/entered (strictly locks to active currentUser's own personal ID)
  const [selectedMemberId, setSelectedMemberId] = useState(() => {
    try {
      const activeSni = getActiveSniUser(initialUser);
      if (activeSni) {
        const resolved = resolveStarGalaxyUser(activeSni, data.users || []);
        if (resolved?.id) return resolved.id;
      }
      const savedUserId = localStorage.getItem(SESSION_USER_KEY);
      if (savedUserId) return savedUserId;
    } catch (e) {}
    return 'user';
  });

  // Ensure selectedMemberId STRICTLY tracks currentUser's own personal world at all times
  useEffect(() => {
    if (currentUser?.id) {
      setSelectedMemberId(currentUser.id);
    }
  }, [currentUser?.id]);

  // Currently active tab (persisted in localStorage to keep tab strictly stable on any input)
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      const saved = localStorage.getItem('star_galaxy_active_tab');
      if (saved && ['activities', 'status', 'settings', 'admin'].includes(saved)) {
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
          const userMap = new Map((prev.users || []).map(u => [u.id, u]));
          // Merge incoming cloud users, ALWAYS preserving approved status, manager status, passwords, and assignments
          cloudUsers.forEach(u => {
            const existing = userMap.get(u.id);
            const isApproved = existing?.status === 'approved' || u.status === 'approved' || approvedIds.has(u.id);
            const isManager = (u.role === 'manager' || existing?.role === 'manager' || managerIds.has(u.id)) && u.id !== 'surya11008';
            const role = u.role === 'admin' || u.id === 'surya11008' ? 'admin' : (isManager ? 'manager' : (u.role || existing?.role || 'member'));

            if (isManager && !managerIds.has(u.id)) {
              managerIds.add(u.id);
              try {
                localStorage.setItem('star_galaxy_manager_user_ids', JSON.stringify(Array.from(managerIds)));
              } catch (e) {}
            }

            userMap.set(u.id, {
              ...(existing || {}),
              ...u,
              password: u.password || existing?.password || '',
              plainPassword: u.password || existing?.password || '',
              personalPin: u.personalPin !== undefined ? u.personalPin : (existing?.personalPin || ''),
              role,
              assignedManagerId: u.assignedManagerId !== undefined ? u.assignedManagerId : existing?.assignedManagerId,
              assignedMembers: Array.isArray(u.assignedMembers) && u.assignedMembers.length > 0 ? u.assignedMembers : (existing?.assignedMembers || []),
              status: isApproved ? 'approved' : u.status,
            });
          });
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
            const isManager = (fresh.role === 'manager' || curr.role === 'manager' || managerIds.has(curr.id)) && curr.id !== 'surya11008';
            const role = curr.role === 'admin' || curr.id === 'surya11008' ? 'admin' : (isManager ? 'manager' : (fresh.role || curr.role || 'member'));
            return {
              ...curr,
              ...fresh,
              password: fresh.password || curr.password,
              plainPassword: fresh.password || curr.password,
              personalPin: fresh.personalPin !== undefined ? fresh.personalPin : curr.personalPin,
              role,
              assignedManagerId: fresh.assignedManagerId !== undefined ? fresh.assignedManagerId : curr.assignedManagerId,
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
                role: 'manager',
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
              role: 'manager',
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
          if (approvedIds.has(p.id) || userMap.get(p.id)?.status === 'approved') {
            // Already approved! Remove from Firestore pending_registrations
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

  // Realtime Gospel Diary Sync for the active member (User-Isolated)
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

  // Realtime User-Isolated Activities Sync (100% Confidential to Active Member)
  useEffect(() => {
    if (!isFirebaseConfigured() || !currentUser?.id) return;
    const unsubUserActivities = subscribeUserActivities(currentUser.id, (cloudData) => {
      if (cloudData) {
        setData(prev => ({
          ...prev,
          activitiesData: {
            ...prev.activitiesData,
            [currentUser.id]: cloudData,
          },
        }));
        try {
          localStorage.setItem(`star_galaxy_activities_${currentUser.id}`, JSON.stringify(cloudData));
        } catch (e) {}
      }
    });
    return () => unsubUserActivities();
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

  const switchUser = (userId) => {
    const user = data.users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(SESSION_USER_KEY, user.id);
      if (user.role === 'member') {
        setSelectedMemberId(user.id);
      } else if (user.role === 'manager') {
        const firstAssigned = user.assignedMembers?.[0] || user.id;
        setSelectedMemberId(firstAssigned);
      }
    }
  };

  const canEditMember = (targetMemberId = selectedMemberId) => {
    if (!currentUser) return false;
    // Admin can edit/input for anyone
    if (currentUser.role === 'admin') return true;
    // Manager can edit/input ONLY for their assigned members or themselves
    if (currentUser.role === 'manager') {
      return targetMemberId === currentUser.id || (currentUser.assignedMembers && currentUser.assignedMembers.includes(targetMemberId));
    }
    // Regular Member can edit/input ONLY their OWN activities!
    if (currentUser.role === 'member') {
      return targetMemberId === currentUser.id;
    }
    return false;
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

    // 1. Look in local React state first
    let user = findUserCandidate(data.users || [], identifier, cleanPass);

    // 2. If not found or password doesn't match locally, fetch directly from Firestore in real-time!
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

    if (!user) {
      return { success: false, error: t('loginFailedNoAccount') || 'No account found with this ID or Contact details. Please verify and try again.' };
    }

    if (!isPasswordMatch(user, cleanPass)) {
      return { success: false, error: t('loginFailedIncorrectPass') || 'Incorrect password. Please try again.' };
    }

    // Check approval status
    if (user.status === 'pending' || user.status === 'waiting') {
      return {
        success: false,
        isPending: true,
        error: t('loginPendingNotice') || 'Your account is pending Admin approval. You will be able to log in once approved by Admin.'
      };
    }

    if (user.status === 'rejected') {
      return {
        success: false,
        error: t('loginRejectedNotice') || 'This account was rejected by Admin.'
      };
    }

    // Success
    setCurrentUser(user);
    localStorage.setItem(SESSION_USER_KEY, user.id);
    sessionStorage.setItem('star_galaxy_pin_unlocked', 'true');

    // Also synchronize unified SNI session
    try {
      const sniSession = {
        userId: user.id,
        uid: user.id,
        email: user.email || user.contact || `${user.id}@sni.org.in`,
        displayName: user.name || user.username || user.id,
        fullName: user.name || user.username || user.id,
        role: user.role || 'member',
        status: user.status || 'approved',
      };
      localStorage.setItem('sni_user_session', JSON.stringify(sniSession));
      localStorage.setItem('sni_unified_session', JSON.stringify(sniSession));
      localStorage.setItem('sni_current_user', JSON.stringify(sniSession));
      if (user.role === 'admin') {
        localStorage.setItem('sni_admin_active', 'true');
        sessionStorage.setItem('sni_admin_active', 'true');
      }
      const cookiePayload = encodeURIComponent(JSON.stringify(sniSession));
      const maxAge = 365 * 24 * 60 * 60;
      document.cookie = `sni_unified_user=${cookiePayload}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
      document.cookie = `sni_session_active=true; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    } catch (e) {}

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

  const register = async (formData) => {
    const fullName = (formData.fullName || formData.name || '').trim();
    const username = (formData.username || formData.userId || '').trim();
    const password = (formData.password || '').trim();
    const contact = (formData.contact || formData.phone || '').trim();
    const nickname = (formData.nickname || '').trim();
    const moreDetails = (formData.moreDetails || formData.place || formData.optionalInfo || '').trim();

    if (!fullName || !username || !password || !contact) {
      return {
        success: false,
        error: 'Full Name, User ID, Password, and Phone or Gmail are required.',
      };
    }

    const cleanUserLower = username.toLowerCase();

    // 1. User ID must be unique
    const existingUser = (data?.users || []).find(u =>
      (u.username && u.username.toLowerCase() === cleanUserLower) ||
      (u.id && u.id.toLowerCase() === cleanUserLower)
    );
    if (existingUser) {
      return {
        success: false,
        error: `User ID "${username}" is already taken. Please choose another unique User ID.`,
      };
    }

    // 2. Same Phone or Gmail allowed up to MAX 10 accounts!
    const sameContactUsers = (data?.users || []).filter(u =>
      contactsMatch(u.phone, contact) || contactsMatch(u.contact, contact)
    );

    if (sameContactUsers.length >= 10) {
      return {
        success: false,
        error: `Maximum 10 accounts allowed per Phone / Gmail. This Phone/Gmail "${contact}" already has reached the limit of 10 registered users.`,
      };
    }

    const newUserId = 'usr-' + Date.now();
    const isAutoApproval = data?.settings?.autoUserApproval !== false;
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
      role: 'member',
      status: isAutoApproval ? 'approved' : 'pending',
      personalPin: '',
      hasSetPersonalPin: false,
      pinLockEnabled: false,
      createdAt: formatDate(new Date()),
      registeredAt: new Date().toISOString(),
    };

    if (isAutoApproval) {
      // ⚡ AUTO APPROVAL IS ON: Instant Cloud & State approval
      await markRegistrationApprovedInFirestore(newUserId);
      await saveUserToFirestore(newUser);

      // Optimistically update local React state
      setData(prev => ({
        ...prev,
        users: [...(prev.users || []).filter(u => u.id !== newUserId), newUser],
      }));

      // Backup to localStorage approved queue
      try {
        const savedApproved = JSON.parse(localStorage.getItem('star_galaxy_approved_user_ids') || '[]');
        if (!savedApproved.includes(newUserId)) {
          savedApproved.push(newUserId);
          localStorage.setItem('star_galaxy_approved_user_ids', JSON.stringify(savedApproved));
        }
      } catch (e) {}

      // Background notification
      try {
        fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser),
        }).catch(() => {});
      } catch (e) {}

      return {
        success: true,
        isAutoApproved: true,
        message: 'Registration successful! Your account is automatically approved. You can now log in to Star Galaxy!',
        newUser,
      };
    } else {
      // 🔒 AUTO APPROVAL IS OFF: Save as Pending for Admin Approval
      await savePendingRegistrationToFirestore(newUser);

      // Optimistically update local React state with status: 'pending'
      setData(prev => ({
        ...prev,
        users: [...(prev.users || []).filter(u => u.id !== newUserId), newUser],
      }));

      // Backup to localStorage pending queue
      try {
        const savedPending = JSON.parse(localStorage.getItem('star_galaxy_pending_users') || '[]');
        savedPending.push(newUser);
        localStorage.setItem('star_galaxy_pending_users', JSON.stringify(savedPending));
      } catch (e) {}

      // Background notification
      try {
        fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser),
        }).catch(() => {});
      } catch (e) {}

      return {
        success: true,
        isAutoApproved: false,
        message: 'Registration submitted successfully! Your account is pending Admin approval. You will be able to log in once approved by Admin.',
        newUser,
      };
    }
  };

  const logout = async () => {
    // 1. Reset Star Galaxy in-memory & local state
    setCurrentUser(null);
    localStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem('star_galaxy_active_tab');
    localStorage.removeItem('star_galaxy_selected_activity');
    localStorage.removeItem('star_galaxy_pin_unlocked');
    sessionStorage.removeItem('star_galaxy_pin_unlocked');
    setData(prev => ({
      ...prev,
      gospelDiary: {},
    }));
    setActiveTabState('activities');

    // 2. Clear ALL SNI website auth & session tokens
    // User requirement: "star galaxy lo logout chesthe motham SNI logout avvali"
    localStorage.removeItem('sni_temp_session');
    localStorage.removeItem('sni_user_session');
    localStorage.removeItem('sni_current_user');
    localStorage.removeItem('sni_unified_session');
    localStorage.removeItem('sni_admin_active');
    sessionStorage.removeItem('sni_admin_active');
    localStorage.removeItem('live_counter_current_user');
    localStorage.removeItem('wlh_current_user');
    sessionStorage.removeItem('l_support_session_active');
    localStorage.removeItem('word_search_current_user');
    localStorage.removeItem('word_search_admin_auth');

    try {
      document.cookie = 'sni_unified_user=; Domain=.sni.org.in; Path=/; Max-Age=0; SameSite=Lax; Secure';
      document.cookie = 'sni_session_active=; Domain=.sni.org.in; Path=/; Max-Age=0; SameSite=Lax; Secure';
      document.cookie = 'sni_unified_user=; Path=/; Max-Age=0; SameSite=Lax';
      document.cookie = 'sni_session_active=; Path=/; Max-Age=0; SameSite=Lax';
    } catch (e) {}

    // 3. Sign out of Firebase Auth completely
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('Firebase signOut error from Star Galaxy:', e);
    }

    // 4. Redirect to main SNI sign in page
    window.location.href = '/auth.html';
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
  const approveUser = async (userId) => {
    let userToSave = null;
    setData(prev => {
      const updated = prev.users.map(u => u.id === userId ? { ...u, status: 'approved' } : u);
      userToSave = updated.find(u => u.id === userId);
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
      const filtered = savedPending.filter(u => u.id !== userId);
      localStorage.setItem('star_galaxy_pending_users', JSON.stringify(filtered));
    } catch (e) {}

    // 3. Update STORAGE_KEY immediately in localStorage so reloads keep it approved
    try {
      const rawLocal = localStorage.getItem(STORAGE_KEY);
      if (rawLocal) {
        const parsed = JSON.parse(rawLocal);
        if (Array.isArray(parsed.users)) {
          parsed.users = parsed.users.map(u => u.id === userId ? { ...u, status: 'approved' } : u);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {}

    // 4. Update Firestore permanently
    if (userToSave) {
      await saveUserToFirestore({ ...userToSave, status: 'approved' });
    }
    await markRegistrationApprovedInFirestore(userId);
    await removePendingRegistrationFromFirestore(userId);

    // 5. Background notification to server API
    try {
      fetch('/api/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    } catch (e) {}
  };

  const rejectUser = async (userId) => {
    await deleteUserFromFirestore(userId);
    await removePendingRegistrationFromFirestore(userId);

    setData(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId),
    }));

    try {
      const savedPending = JSON.parse(localStorage.getItem('star_galaxy_pending_users') || '[]');
      const filtered = savedPending.filter(u => u.id !== userId);
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
      role: 'member',
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

  const deleteUser = (userId) => {
    if (userId === 'surya11008') {
      return { success: false, error: 'Admin account (surya11008) cannot be deleted!' };
    }

    try {
      fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch (e) {}

    deleteUserFromFirestore(userId);

    setData(prev => {
      const updatedUsers = prev.users
        .filter(u => u.id !== userId)
        .map(u => {
          if (u.role === 'manager' && Array.isArray(u.assignedMembers)) {
            return {
              ...u,
              assignedMembers: u.assignedMembers.filter(mid => mid !== userId),
            };
          }
          return u;
        });

      const updatedActivities = { ...prev.activitiesData };
      delete updatedActivities[userId];

      return {
        ...prev,
        users: updatedUsers,
        activitiesData: updatedActivities,
      };
    });

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
          const mod = {
            ...u,
            role: isManager ? 'manager' : 'member',
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
        role: isManager ? 'manager' : 'member',
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
          role: isManager ? 'manager' : 'member',
          assignedMembers: isManager ? (Array.isArray(u.assignedMembers) ? u.assignedMembers : []) : [],
        } : u);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {}

    // 4. Save permanently to Firestore users and manager_roles
    if (userToSave) {
      await saveUserToFirestore(userToSave);
      if (isManager) {
        await saveManagerRoleToFirestore(userId, true, userToSave.assignedMembers || []);
      } else {
        await removeManagerRoleFromFirestore(userId);
      }
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

  // Assign Member to Manager (Bidirectional: updates member & manager records in Firestore)
  const assignMemberToManager = async (memberId, managerId) => {
    // Ensure managerId is added to manager IDs set
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
        // 1. The member being assigned or unassigned
        if (u.id === memberId) {
          const updatedMember = { ...u, assignedManagerId: managerId || '' };
          affectedUsers.push(updatedMember);
          return updatedMember;
        }

        // 2. The new manager: add memberId to assignedMembers & ensure role is manager
        if (managerId && u.id === managerId) {
          const currentList = Array.isArray(u.assignedMembers) ? u.assignedMembers : [];
          const updatedList = currentList.includes(memberId) ? currentList : [...currentList, memberId];
          const updatedMgr = { ...u, role: 'manager', assignedMembers: updatedList };
          affectedUsers.push(updatedMgr);
          return updatedMgr;
        }

        // 3. Any previous manager that held memberId: remove memberId
        if (u.role === 'manager' && u.id !== managerId && Array.isArray(u.assignedMembers) && u.assignedMembers.includes(memberId)) {
          const filtered = u.assignedMembers.filter(id => id !== memberId);
          const updatedPrevMgr = { ...u, assignedMembers: filtered };
          affectedUsers.push(updatedPrevMgr);
          return updatedPrevMgr;
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

    // Save all affected users permanently to Firestore
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
        body: JSON.stringify({ memberId, managerId }),
      }).catch(() => {});
    } catch (e) {}

    return { success: true };
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

  // Activity Helper for active member (strictly 100% User-Isolated to personal account)
  const getMemberActivity = (memberId = currentUser?.id) => {
    const id = memberId || currentUser?.id || 'user';
    if (data.activitiesData && data.activitiesData[id]) {
      return data.activitiesData[id];
    }
    try {
      const saved = localStorage.getItem(`star_galaxy_activities_${id}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
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

  const updateMemberActivity = (memberId = currentUser?.id, activityKey, updater) => {
    const id = memberId || currentUser?.id;
    if (!id) return;
    let diff = 0;

    setData(prev => {
      const currentMemberData = prev.activitiesData[id] || getMemberActivity(id);

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
        localStorage.setItem(`star_galaxy_activities_${id}`, JSON.stringify(updatedMemberData));
      } catch (e) {}

      saveMemberActivitiesToFirestore(id, updatedMemberData);

      return {
        ...prev,
        activitiesData: {
          ...prev.activitiesData,
          [id]: updatedMemberData,
        },
      };
    });

    // 🌟 If stars increased, immediately speak the selected Star Voice phrase!
    if (diff > 0) {
      speakStarEarned(diff);
    }
  };

  // Calculate Stars summary for a specific member & date range (strictly defaults to current user's personal world)
  const getMemberStarsBreakdown = (memberId = currentUser?.id, customRange = dateRange) => {
    const act = getMemberActivity(memberId || currentUser?.id);
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

  // Calculate Overall Stars summary from the beginning to present (strictly defaults to current user's personal world)
  const getMemberOverallStarsBreakdown = (memberId = currentUser?.id) => {
    const act = getMemberActivity(memberId || currentUser?.id);

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
        logout,
        changePassword,
        resetPasswordWithContact,
        adminResetPassword,
        updateProfile,
        updatePersonalPin,
        approveUser,
        rejectUser,
        quickAddAndApproveMember,
        refreshRegistrations,
        deleteUser,
        resetPassword,
        setManagerRole,
        assignMemberToManager,
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
