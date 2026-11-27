import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_PORTAL_STRUCTURE, mergePortalStructure } from '../config/portalStructure';
import PortalIcon from '../components/PortalIcon';
import RichTextEditor from '../components/RichTextEditor';
import PhotoGalleryManager from '../components/PhotoGalleryManager';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ShieldCheck,
  Megaphone,
  Video,
  FileText,
  Users,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Lock,
  UserCheck,
  FolderTree,
  ExternalLink,
  Eye,
  Pencil,
  X,
  Clock,
  UserX,
  Image as ImageIcon,
  Check,
  KeyRound,
  Globe,
  Sliders,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  Paperclip,
  LayoutGrid,
  List,
  Table,
  Filter,
  Folder,
} from 'lucide-react';

import { cleanObjectReplacementChars } from '../utils/fontManager';

const OFFICIAL_ROLES = [
  { id: 'MEM', name: 'Member (MEM) — Default', nameEn: 'Member (MEM)' },
  { id: 'EVA', name: 'Evangelist (EVA)', nameEn: 'Evangelist (EVA)' },
  { id: 'CW', name: 'Co-Worker (CW)', nameEn: 'Co-Worker (CW)' },
  { id: 'UL', name: 'Unit Leader (UL)', nameEn: 'Unit Leader (UL)' },
  { id: 'GL', name: 'Group Leader (GL)', nameEn: 'Group Leader (GL)' },
  { id: 'PTS', name: 'Pre-Theological Student (PTS)', nameEn: 'Pre-Theological Student (PTS)' },
  { id: 'TS', name: 'Theological Student (TS)', nameEn: 'Theological Student (TS)' },
  { id: 'PBCL', name: 'Pre-Branch Church Leader (PBCL)', nameEn: 'Pre-Branch Church Leader (PBCL)' },
  { id: 'DEA', name: 'Deacon / Deaconess (DEA)', nameEn: 'Deacon / Deaconess (DEA)' },
  { id: '(D) OS', name: 'Deputy Overseer ((D) OS)', nameEn: 'Deputy Overseer ((D) OS)' },
  { id: 'OS', name: 'Overseer (OS)', nameEn: 'Overseer (OS)' },
  { id: 'ADMIN', name: 'Administrator (ADMIN)', nameEn: 'Administrator (ADMIN)' },
];

const DEFAULT_ROLES = OFFICIAL_ROLES;
const RTDB_BASE = 'https://sni-org-in-default-rtdb.firebaseio.com';

export default function AdminPanel() {
  const { currentUser, userProfile } = useAuth();
  const { t, isTelugu } = useLanguage();

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (['users', 'pages', 'contents', 'photos', 'announcements', 'studio', 'roles'].includes(tabParam)) {
        return tabParam;
      }
      const savedTab = localStorage.getItem('sni_admin_active_tab');
      if (['users', 'pages', 'contents', 'photos', 'announcements', 'studio', 'roles'].includes(savedTab)) {
        return savedTab;
      }
    } catch {}
    return 'users';
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem('sni_admin_active_tab', tabId);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  };
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // 1. Users & Approvals State
  const [usersList, setUsersList] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // 2. Roles State
  const [rolesList, setRolesList] = useState(DEFAULT_ROLES);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [newRole, setNewRole] = useState({
    id: '',
    name: '',
    description: '',
    allowedCategories: ['home', 'worship', 'bible-truth'],
  });

  // 3. Pages State
  const [customPagesList, setCustomPagesList] = useState([]);
  const [newPage, setNewPage] = useState({
    categorySlug: 'home',
    customCategoryTitle: '',
    title: '',
    titleTe: '',
    pageSlug: '',
    desc: '',
    externalUrl: '',
    iconName: 'FileText',
  });

  // Dynamic portal structure combining default hierarchy + custom Firestore pages
  const fullPortalStructure = useMemo(
    () => mergePortalStructure(customPagesList),
    [customPagesList]
  );

  // Complete Portal Navigation Organization states
  const [pageSearchTerm, setPageSearchTerm] = useState('');
  const [pageCategoryFilter, setPageCategoryFilter] = useState('all');
  const [pageViewMode, setPageViewMode] = useState('grouped'); // 'grouped' | 'cards' | 'table'
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [isAddSubPageModalOpen, setIsAddSubPageModalOpen] = useState(false);
  const [editingPageModal, setEditingPageModal] = useState(null); // page object or null
  const [pageEditForm, setPageEditForm] = useState({
    titleEn: '',
    titleTe: '',
    descEn: '',
    externalUrl: '',
    iconName: 'FileText',
  });

  const handleOpenAddSubPageModal = (catSlug = 'home') => {
    setNewPage({
      categorySlug: catSlug || 'home',
      customCategoryTitle: '',
      title: '',
      titleTe: '',
      pageSlug: '',
      desc: '',
      externalUrl: '',
      iconName: 'FileText',
    });
    setIsAddSubPageModalOpen(true);
  };

  // Total pages count across all categories
  const totalPagesCount = useMemo(() => {
    return fullPortalStructure.reduce((acc, cat) => acc + (cat.pages?.length || 0), 0);
  }, [fullPortalStructure]);

  // Filtered categories and pages for the Complete Page Architecture View
  const filteredPortalCategories = useMemo(() => {
    const search = pageSearchTerm.trim().toLowerCase();

    return fullPortalStructure.map((cat) => {
      // Category filter check
      if (pageCategoryFilter !== 'all') {
        if (pageCategoryFilter === 'custom') {
          const hasCustom = cat.pages?.some((p) => p.isCustom);
          if (!hasCustom) return null;
        } else if (cat.categorySlug !== pageCategoryFilter) {
          return null;
        }
      }

      // Filter pages by search
      const matchingPages = (cat.pages || []).filter((p) => {
        if (pageCategoryFilter === 'custom' && !p.isCustom) return false;
        if (!search) return true;
        const matchTitle = (p.titleEn || p.title || '').toLowerCase().includes(search);
        const matchTitleTe = (p.titleTe || '').toLowerCase().includes(search);
        const matchSlug = (p.pageSlug || '').toLowerCase().includes(search);
        const matchCat = (cat.titleEn || cat.categorySlug || '').toLowerCase().includes(search);
        return matchTitle || matchTitleTe || matchSlug || matchCat;
      });

      if (matchingPages.length === 0 && search && !(cat.titleEn || '').toLowerCase().includes(search)) {
        return null;
      }

      return {
        ...cat,
        pages: matchingPages,
      };
    }).filter(Boolean);
  }, [fullPortalStructure, pageSearchTerm, pageCategoryFilter]);

  // Flattened list of all filtered pages for grid / table view
  const allFilteredPages = useMemo(() => {
    return filteredPortalCategories.flatMap((cat) =>
      cat.pages.map((p) => ({
        ...p,
        categorySlug: cat.categorySlug,
        categoryTitleEn: cat.titleEn,
        categoryTitleTe: cat.titleTe,
      }))
    );
  }, [filteredPortalCategories]);

  // Search & Accordion expansion state for role permissions modal
  const [rolePermSearch, setRolePermSearch] = useState('');
  const [roleExpandedCats, setRoleExpandedCats] = useState({});

  // 4. Articles & Contents State
  const [contentsList, setContentsList] = useState([]);
  const [contentCategoryFilter, setContentCategoryFilter] = useState('all');
  const [editingContent, setEditingContent] = useState(null);
  const [isContentFormOpen, setIsContentFormOpen] = useState(false);
  const [adminShowMedia, setAdminShowMedia] = useState(false);
  const [newContent, setNewContent] = useState({
    categorySlug: 'worship',
    pageSlug: 'sermons',
    targetPages: ['sermons'],
    title: '',
    desc: '',
    imageUrl: '',
    videoUrl: '',
    audioUrl: '',
    fileUrl: '',
    downloadUrl: '',
    websiteUrl: '',
  });

  // 5. Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    desc: '',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Show transient feedback message
  const showFeedback = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  // Fetch Users from both Firestore and Realtime Database (RTDB)
  const fetchUsers = useCallback(async () => {
    try {
      const userMap = new Map();

      // 1. Fetch from Firestore users
      try {
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach((d) => {
          userMap.set(d.id, { id: d.id, ...d.data() });
        });
      } catch (e) {
        console.warn('Error fetching Firestore users:', e);
      }

      // 1b. Fetch from Firestore pending_registrations collection (SDK)
      try {
        const pSnap = await getDocs(collection(db, 'pending_registrations'));
        pSnap.forEach((d) => {
          const p = d.data() || {};
          const existing = userMap.get(d.id) || {};
          const isAdm = d.id === 'surya11008';
          userMap.set(d.id, {
            ...existing,
            ...p,
            id: d.id,
            userId: p.userId || p.username || d.id,
            displayName: p.fullName || p.name || existing.displayName || d.id,
            phone: p.phone || existing.phone || p.contact || '',
            contact: p.contact || p.phone || existing.contact || '',
            email: p.email || existing.email || '',
            status: isAdm ? 'approved' : (existing.status === 'approved' ? 'approved' : 'pending'),
            phoneVerified: true,
            contactVerified: true,
            isVerified: true,
            fromPendingColl: true,
          });
        });
      } catch (e) {
        console.warn('Error fetching Firestore pending_registrations:', e);
      }

      // 1c. Fetch from Firestore pending_registrations collection (REST API fallback)
      try {
        const pRes = await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/pending_registrations?key=AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI`);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.documents && Array.isArray(pData.documents)) {
            pData.documents.forEach((docItem) => {
              const docId = docItem.name.split('/').pop();
              if (!docId) return;
              const f = docItem.fields || {};
              const existing = userMap.get(docId) || {};
              const isAdm = docId === 'surya11008';
              const pStatus = f.status?.stringValue || 'pending';
              const phoneVal = f.phone?.stringValue || f.contact?.stringValue || existing.phone || '';
              const nameVal = f.fullName?.stringValue || f.name?.stringValue || existing.displayName || docId;
              userMap.set(docId, {
                ...existing,
                id: docId,
                userId: f.userId?.stringValue || docId,
                displayName: nameVal,
                phone: phoneVal,
                contact: f.contact?.stringValue || phoneVal,
                email: f.email?.stringValue || existing.email || '',
                password: f.password?.stringValue || f.plainPassword?.stringValue || existing.password || '',
                status: isAdm ? 'approved' : (existing.status === 'approved' ? 'approved' : pStatus),
                phoneVerified: true,
                contactVerified: true,
                isVerified: true,
                createdAt: f.createdAt?.stringValue || f.registeredAt?.stringValue || existing.createdAt || '',
                fromPendingColl: true,
              });
            });
          }
        }
      } catch (e) {
        console.warn('Error fetching REST pending_registrations:', e);
      }

      // 2. Fetch from Realtime Database (where auth.html registrations land)
      try {
        const res = await fetch(`${RTDB_BASE}/users.json`);
        if (res.ok) {
          const rtdbData = await res.json();
          if (rtdbData && typeof rtdbData === 'object') {
            Object.keys(rtdbData).forEach((key) => {
              const u = rtdbData[key];
              if (!u) return;
              const existing = userMap.get(key) || {};
              const isAdm = key === 'surya11008' || u.role === 'admin' || u.role === 'ADMIN' || existing.role === 'admin' || existing.role === 'ADMIN';
              const isVerified = isAdm ? true : (u.isVerified === true || u.phoneVerified === true || u.contactVerified === true || u.emailVerified === true);
              const userStatus = isAdm ? 'approved' : (u.status || existing.status || 'unverified');
              userMap.set(key, {
                ...existing,
                ...u,
                id: key,
                userId: u.userId || key,
                displayName: u.fullName || u.displayName || existing.displayName || existing.fullName || key,
                email: u.email || existing.email || (u.contact && u.contact.includes('@') ? u.contact : ''),
                phone: u.phone || existing.phone || (u.contact && !u.contact.includes('@') ? u.contact : ''),
                password: u.password || existing.password || '',
                role: u.role || existing.role || 'MEM',
                status: userStatus,
                contactVerified: isVerified,
                isVerified: isVerified,
                createdAt: u.joinedAt || existing.createdAt || existing.joinedAt || '',
                fromRtdb: true,
              });
            });
          }
        }
      } catch (e) {
        console.warn('Error fetching RTDB users:', e);
      }

      let items = Array.from(userMap.values());

      if (items.length === 0 && currentUser) {
        items.push({
          id: currentUser.uid,
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: userProfile?.displayName || 'Admin',
          role: 'admin',
          status: 'approved',
          createdAt: new Date().toISOString(),
        });
      }
      setUsersList(items);
    } catch (err) {
      console.warn('Error fetching users:', err);
    }
  }, [currentUser, userProfile]);

  // Fetch Custom Roles & Merge with Official Roles
  const fetchRoles = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'roles'));
      // Clone official roles as starting baseline
      const items = OFFICIAL_ROLES.map((r) => ({ ...r, allowedCategories: ['*'] }));

      snap.forEach((d) => {
        const data = d.data();
        const docId = d.id;
        // Match case-insensitively with official roles
        const existingIdx = items.findIndex(
          (r) => r.id.toLowerCase() === docId.toLowerCase()
        );
        if (existingIdx >= 0) {
          items[existingIdx] = {
            ...items[existingIdx],
            ...data,
            id: items[existingIdx].id, // preserve canonical uppercase id like MEM
          };
        } else {
          // If custom role created by admin
          const customIdx = items.findIndex(
            (r) => r.id.toLowerCase() === docId.toLowerCase()
          );
          if (customIdx >= 0) {
            items[customIdx] = { ...items[customIdx], ...data };
          } else {
            items.push({ id: docId, ...data });
          }
        }
      });
      setRolesList(items);
    } catch (err) {
      console.warn('Error fetching roles:', err);
      setRolesList(OFFICIAL_ROLES);
    }
  }, []);

  // Fetch Custom Pages
  const fetchPages = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'portal_pages'));
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setCustomPagesList(items);
    } catch (err) {
      console.warn('Error fetching portal_pages:', err);
    }
  }, []);

  // Fetch Page Contents
  const fetchContents = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'page_contents'));
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setContentsList(items);
    } catch (err) {
      console.warn('Error fetching page_contents:', err);
    }
  }, []);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const q = query(collection(db, 'announcements'), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setAnnouncements(items);
    } catch (err) {
      console.warn('Error fetching announcements:', err);
    }
  }, []);

  // Initial load + Realtime Firestore Listener on users collection
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPages();
    fetchContents();
    fetchAnnouncements();

    // Live two-way sync: listen to Firestore users changes
    const unsub = onSnapshot(collection(db, 'users'), () => {
      fetchUsers();
    }, (err) => console.warn('Firestore live listener error:', err));

    return () => unsub();
  }, [fetchUsers, fetchRoles, fetchPages, fetchContents, fetchAnnouncements]);

  // ----------------------------------------------------
  // USER APPROVAL & ROLE HANDLERS
  // ----------------------------------------------------
  const handleApproveUser = async (userId, targetRole = 'MEM') => {
    setUpdatingUserId(userId);
    try {
      const target = usersList.find(u => u.id === userId || u.userId === userId || u.username === userId);
      const cleanIds = new Set([userId, target?.id, target?.userId, target?.username].filter(Boolean));

      // 1. Update Firestore (SDK + REST Fallback)
      for (const id of cleanIds) {
        try {
          await setDoc(
            doc(db, 'users', id),
            {
              status: 'approved',
              role: targetRole,
              approvedAt: serverTimestamp(),
              approvedBy: currentUser?.email || 'admin',
            },
            { merge: true }
          );
        } catch (sdkErr) {
          console.warn('Firestore SDK update error, attempting REST fallback:', sdkErr);
          try {
            await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/users/${encodeURIComponent(id)}?updateMask.fieldPaths=status&updateMask.fieldPaths=role&updateMask.fieldPaths=approvedAt&updateMask.fieldPaths=approvedBy&key=AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: {
                  status: { stringValue: 'approved' },
                  role: { stringValue: targetRole },
                  approvedAt: { stringValue: new Date().toISOString() },
                  approvedBy: { stringValue: currentUser?.email || 'admin' }
                }
              })
            });
          } catch (restErr) {
            console.warn('Firestore REST fallback error:', restErr);
          }
        }
      }

      // 2. Dual-sync to RTDB for all matching IDs
      for (const id of cleanIds) {
        try {
          const cleanKey = String(id).toLowerCase().replace(/[^a-z0-9_-]/g, '');
          if (cleanKey) {
            await fetch(`${RTDB_BASE}/users/${encodeURIComponent(cleanKey)}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'approved',
                role: targetRole,
                approvedAt: new Date().toISOString(),
                approvedBy: currentUser?.email || 'admin',
              }),
            });
          }
        } catch (e) {
          console.warn('Error syncing approval to RTDB:', e);
        }
      }

      // 3. Remove from pending registrations in Firestore if present
      for (const id of cleanIds) {
        try {
          await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/pending_registrations/${encodeURIComponent(id)}?key=AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI`, {
            method: 'DELETE'
          });
        } catch (e) {}
      }

      showFeedback('success', 'User account approved successfully!');
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to approve user: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleManualVerifyContact = async (userId) => {
    setUpdatingUserId(userId);
    try {
      const target = usersList.find(u => u.id === userId || u.userId === userId || u.username === userId);
      const cleanIds = new Set([userId, target?.id, target?.userId, target?.username].filter(Boolean));

      for (const id of cleanIds) {
        try {
          await setDoc(
            doc(db, 'users', id),
            {
              contactVerified: true,
              isVerified: true,
              status: 'pending', // Contact verified, now moves to Admin Pending Approval queue!
              verifiedAt: serverTimestamp(),
              verifiedBy: currentUser?.email || 'admin',
            },
            { merge: true }
          );
        } catch (sdkErr) {
          try {
            await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/users/${encodeURIComponent(id)}?updateMask.fieldPaths=contactVerified&updateMask.fieldPaths=isVerified&updateMask.fieldPaths=status&updateMask.fieldPaths=verifiedAt&key=AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fields: {
                  contactVerified: { booleanValue: true },
                  isVerified: { booleanValue: true },
                  status: { stringValue: 'pending' },
                  verifiedAt: { stringValue: new Date().toISOString() }
                }
              })
            });
          } catch (e) {}
        }

        try {
          const cleanKey = String(id).toLowerCase().replace(/[^a-z0-9_-]/g, '');
          if (cleanKey) {
            await fetch(`${RTDB_BASE}/users/${encodeURIComponent(cleanKey)}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contactVerified: true,
                isVerified: true,
                status: 'pending',
                verifiedAt: new Date().toISOString(),
                verifiedBy: currentUser?.email || 'admin',
              }),
            });
          }
        } catch (e) {
          console.warn('Error syncing verify to RTDB:', e);
        }
      }

      showFeedback('success', `Contact for user "${userId}" verified! Now in pending approval queue.`);
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to verify contact: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user registration?')) return;
    setUpdatingUserId(userId);
    try {
      const target = usersList.find(u => u.id === userId || u.userId === userId || u.username === userId);
      const cleanIds = new Set([userId, target?.id, target?.userId, target?.username].filter(Boolean));

      for (const id of cleanIds) {
        try {
          await setDoc(
            doc(db, 'users', id),
            {
              status: 'rejected',
              rejectedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {}

        try {
          const cleanKey = String(id).toLowerCase().replace(/[^a-z0-9_-]/g, '');
          if (cleanKey) {
            await fetch(`${RTDB_BASE}/users/${encodeURIComponent(cleanKey)}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'rejected',
                rejectedAt: new Date().toISOString(),
              }),
            });
          }
        } catch (e) {
          console.warn('Error syncing rejection to RTDB:', e);
        }
      }

      showFeedback('success', 'User status set to rejected.');
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to update user: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRevokeUser = async (userId) => {
    if (!window.confirm('Are you sure you want to revoke this user account? They will lose access to the portal.')) return;
    setUpdatingUserId(userId);
    try {
      const target = usersList.find(u => u.id === userId || u.userId === userId || u.username === userId);
      const cleanIds = new Set([userId, target?.id, target?.userId, target?.username].filter(Boolean));

      for (const id of cleanIds) {
        try {
          await setDoc(
            doc(db, 'users', id),
            {
              status: 'revoked',
              revokedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {}

        try {
          const cleanKey = String(id).toLowerCase().replace(/[^a-z0-9_-]/g, '');
          if (cleanKey) {
            await fetch(`${RTDB_BASE}/users/${encodeURIComponent(cleanKey)}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'revoked',
                revokedAt: new Date().toISOString(),
              }),
            });
          }
        } catch (e) {
          console.warn('Error syncing revocation to RTDB:', e);
        }
      }

      showFeedback('success', 'User access revoked.');
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to revoke user: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleResetTempPassword = async (userId, userEmail) => {
    if (!window.confirm(`Reset temporary password for ${userEmail || 'this user'}? It will be set to "123456" valid for exactly 3 hours.`)) return;
    setUpdatingUserId(userId);
    try {
      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const target = usersList.find(u => u.id === userId || u.userId === userId || u.username === userId);
      const cleanIds = new Set([userId, target?.id, target?.userId, target?.username].filter(Boolean));

      for (const id of cleanIds) {
        try {
          await setDoc(
            doc(db, 'users', id),
            {
              tempPassword: '123456',
              tempPasswordExpiresAt: expiresAt,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {}

        try {
          const cleanKey = String(id).toLowerCase().replace(/[^a-z0-9_-]/g, '');
          if (cleanKey) {
            await fetch(`${RTDB_BASE}/users/${encodeURIComponent(cleanKey)}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tempPassword: '123456',
                tempPasswordExpiresAt: expiresAt,
              }),
            });
          }
        } catch (e) {
          console.warn('Error syncing temp password to RTDB:', e);
        }
      }

      showFeedback('success', `Temporary password "123456" enabled for 3 hours (expires at ${new Date(expiresAt).toLocaleTimeString()}).`);
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to set temporary password: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const target = usersList.find(u => u.id === userId || u.userId === userId || u.username === userId);
      const cleanIds = new Set([userId, target?.id, target?.userId, target?.username].filter(Boolean));

      for (const id of cleanIds) {
        try {
          await setDoc(
            doc(db, 'users', id),
            {
              role: newRole,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {}

        try {
          const cleanKey = String(id).toLowerCase().replace(/[^a-z0-9_-]/g, '');
          if (cleanKey) {
            await fetch(`${RTDB_BASE}/users/${encodeURIComponent(cleanKey)}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                role: newRole,
                updatedAt: new Date().toISOString(),
              }),
            });
          }
        } catch (e) {
          console.warn('Error syncing role change to RTDB:', e);
        }
      }

      showFeedback('success', `User role updated to ${newRole}`);
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to change role: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user record from database? This cannot be undone.')) return;
    setUpdatingUserId(userId);
    try {
      const target = usersList.find(u => u.id === userId || u.userId === userId || u.username === userId);
      const cleanIds = new Set([userId, target?.id, target?.userId, target?.username].filter(Boolean));

      for (const id of cleanIds) {
        // Delete from Firestore via SDK
        try {
          await deleteDoc(doc(db, 'users', id));
        } catch (e) {
          try {
            await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/users/${encodeURIComponent(id)}?key=AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI`, {
              method: 'DELETE'
            });
          } catch (err2) {}
        }

        // Delete from pending registrations in Firestore
        try {
          await fetch(`https://firestore.googleapis.com/v1/projects/sni-org-in/databases/(default)/documents/pending_registrations/${encodeURIComponent(id)}?key=AIzaSyB0ZL4r72-G6XCapKvjA-cbOWJbjC9dNuI`, {
            method: 'DELETE'
          });
        } catch (e) {}

        // Delete from RTDB
        try {
          const cleanKey = String(id).toLowerCase().replace(/[^a-z0-9_-]/g, '');
          if (cleanKey) {
            await fetch(`${RTDB_BASE}/users/${encodeURIComponent(cleanKey)}.json`, {
              method: 'DELETE',
            });
          }
        } catch (e) {
          console.warn('Error deleting user from RTDB:', e);
        }
      }

      showFeedback('success', 'User removed from all databases.');
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to delete user: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleOpenAddRole = () => {
    setEditingRoleId(null);
    setNewRole({
      id: '',
      name: '',
      description: '',
      allowedCategories: ['home', 'worship', 'bible-truth'],
    });
    setRolePermSearch('');
    const map = {};
    fullPortalStructure.forEach((c) => {
      map[c.categorySlug] = true;
    });
    setRoleExpandedCats(map);
    setIsAddRoleOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRoleId(role.id);
    const existingAllowed = Array.isArray(role.allowedCategories)
      ? role.allowedCategories
      : ['*'];
    setNewRole({
      id: role.id,
      name: role.nameEn || role.name || role.id,
      description: role.description || '',
      allowedCategories: existingAllowed,
    });
    setRolePermSearch('');
    const map = {};
    fullPortalStructure.forEach((c) => {
      map[c.categorySlug] = true;
    });
    setRoleExpandedCats(map);
    setIsAddRoleOpen(true);
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Are you sure you want to remove role "${role.nameEn || role.name || role.id}"?`)) return;
    try {
      await deleteDoc(doc(db, 'roles', role.id));
      setRolesList((prev) => prev.filter((r) => r.id !== role.id));
      showFeedback('success', `Role "${role.nameEn || role.name}" removed successfully.`);
    } catch (err) {
      setRolesList((prev) => prev.filter((r) => r.id !== role.id));
      showFeedback('success', `Role removed from active configuration.`);
    }
  };

  // Add / Edit Ministerial Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    const cleanName = newRole.name.trim();
    if (!cleanName) {
      alert('Please provide a Role Title.');
      return;
    }

    const autoSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
    const canonicalRoleId = (editingRoleId || newRole.id || autoSlug || ('role_' + Date.now())).trim();

    try {
      const allowed = Array.isArray(newRole.allowedCategories) ? newRole.allowedCategories : ['*'];
      const payload = {
        id: canonicalRoleId,
        name: cleanName,
        nameEn: cleanName,
        description: newRole.description.trim(),
        allowedCategories: allowed,
        updatedAt: serverTimestamp(),
      };

      // Save to canonical ID (e.g. 'MEM')
      await setDoc(doc(db, 'roles', canonicalRoleId), payload, { merge: true });
      // Also save to lowercase and uppercase variants to prevent any case mismatch across auth/session
      if (canonicalRoleId.toLowerCase() !== canonicalRoleId) {
        await setDoc(doc(db, 'roles', canonicalRoleId.toLowerCase()), payload, { merge: true });
      }
      if (canonicalRoleId.toUpperCase() !== canonicalRoleId) {
        await setDoc(doc(db, 'roles', canonicalRoleId.toUpperCase()), payload, { merge: true });
      }

      showFeedback('success', `Role "${cleanName}" permissions saved successfully!`);
      setIsAddRoleOpen(false);
      setEditingRoleId(null);
      setNewRole({
        id: '',
        name: '',
        description: '',
        allowedCategories: ['*'],
      });
      await fetchRoles();
    } catch (err) {
      showFeedback('error', 'Failed to save role: ' + err.message);
    }
  };

  // ----------------------------------------------------
  // ROLE PERMISSIONS & SUB-PAGE SELECTION HELPERS
  // ----------------------------------------------------
  const isMasterAllSelected = newRole.allowedCategories?.includes('*');

  // Helper to expand all portal categories and page slugs into an explicit list
  const getAllPortalIdentifiers = () => {
    const list = [];
    fullPortalStructure.forEach((c) => {
      list.push(c.categorySlug);
      (c.pages || []).forEach((p) => {
        list.push(p.pageSlug);
        list.push(`${c.categorySlug}/${p.pageSlug}`);
      });
    });
    return Array.from(new Set(list));
  };

  // Check if a category is considered fully selected
  const isCategoryFullySelected = (cat) => {
    if (isMasterAllSelected) return true;
    if (newRole.allowedCategories?.includes(cat.categorySlug)) return true;
    if (!cat.pages || cat.pages.length === 0) return false;
    return cat.pages.every(
      (p) =>
        newRole.allowedCategories?.includes(p.pageSlug) ||
        newRole.allowedCategories?.includes(`${cat.categorySlug}/${p.pageSlug}`)
    );
  };

  // Check if a specific sub-page is selected
  const isPageSelected = (cat, page) => {
    if (isMasterAllSelected) return true;
    if (newRole.allowedCategories?.includes(cat.categorySlug)) return true;
    return (
      newRole.allowedCategories?.includes(page.pageSlug) ||
      newRole.allowedCategories?.includes(`${cat.categorySlug}/${page.pageSlug}`)
    );
  };

  // Count how many sub-pages of a category are selected
  const getCategorySelectedCount = (cat) => {
    if (isMasterAllSelected || newRole.allowedCategories?.includes(cat.categorySlug)) {
      return cat.pages?.length || 0;
    }
    return (
      cat.pages?.filter(
        (p) =>
          newRole.allowedCategories?.includes(p.pageSlug) ||
          newRole.allowedCategories?.includes(`${cat.categorySlug}/${p.pageSlug}`)
      ).length || 0
    );
  };

  // Toggle master "Full Access (All Pages & Contents)"
  const handleToggleMasterAll = (checked) => {
    if (checked) {
      setNewRole((prev) => ({ ...prev, allowedCategories: ['*'] }));
    } else {
      setNewRole((prev) => ({ ...prev, allowedCategories: [] }));
    }
  };

  // Toggle all pages within a single category
  const handleToggleCategory = (cat, checked) => {
    const catSlug = cat.categorySlug;
    const pageSlugs = cat.pages ? cat.pages.map((p) => p.pageSlug) : [];
    const comboSlugs = cat.pages ? cat.pages.map((p) => `${catSlug}/${p.pageSlug}`) : [];
    const allCatIdentifiers = new Set([catSlug, ...pageSlugs, ...comboSlugs]);

    setNewRole((prev) => {
      let current = (prev.allowedCategories || []);
      // If master all '*' was active, expand into all portal slugs first!
      if (current.includes('*')) {
        current = getAllPortalIdentifiers();
      }

      if (checked) {
        current = Array.from(new Set([...current, catSlug, ...pageSlugs, ...comboSlugs]));
      } else {
        current = current.filter((x) => !allCatIdentifiers.has(x) && x !== '*');
      }

      // Check if all categories are now selected; if so, condense back to ['*']
      const allSelected = fullPortalStructure.every((c) => current.includes(c.categorySlug));
      if (allSelected) {
        return { ...prev, allowedCategories: ['*'] };
      }

      return {
        ...prev,
        allowedCategories: Array.from(new Set(current)),
      };
    });
  };

  // Toggle individual sub-page
  const handleTogglePage = (cat, page, checked) => {
    const catSlug = cat.categorySlug;
    const pageSlug = page.pageSlug;
    const comboSlug = `${catSlug}/${pageSlug}`;

    setNewRole((prev) => {
      let current = (prev.allowedCategories || []);
      // If master all '*' was active, expand into all portal slugs first!
      if (current.includes('*')) {
        current = getAllPortalIdentifiers();
      }

      // If category-level slug was present and we uncheck one subpage, remove catSlug and keep remaining pages
      if (!checked && current.includes(catSlug)) {
        current = current.filter((x) => x !== catSlug);
        const otherPages = (cat.pages || []).filter((p) => p.pageSlug !== pageSlug);
        otherPages.forEach((p) => {
          current.push(p.pageSlug);
          current.push(`${catSlug}/${p.pageSlug}`);
        });
      }

      if (checked) {
        current = Array.from(new Set([...current, pageSlug, comboSlug]));
        // If all pages of this category are now checked, also add category slug
        const allCatPagesSelected = (cat.pages || []).every(
          (p) => current.includes(p.pageSlug) || current.includes(`${catSlug}/${p.pageSlug}`)
        );
        if (allCatPagesSelected) {
          current.push(catSlug);
        }
      } else {
        current = current.filter((x) => x !== pageSlug && x !== comboSlug && x !== catSlug && x !== '*');
      }

      // Check if all categories are now selected; if so, condense to ['*']
      const allSelected = fullPortalStructure.every((c) => current.includes(c.categorySlug));
      if (allSelected) {
        return { ...prev, allowedCategories: ['*'] };
      }

      return {
        ...prev,
        allowedCategories: Array.from(new Set(current)),
      };
    });
  };

  // Expand / collapse all categories
  const handleExpandAllCats = (expand) => {
    const map = {};
    fullPortalStructure.forEach((c) => {
      map[c.categorySlug] = expand;
    });
    setRoleExpandedCats(map);
  };

  const handleSelectAllPages = () => {
    handleToggleMasterAll(true);
  };

  const handleClearAllPages = () => {
    handleToggleMasterAll(false);
  };

  const toggleExpandCategory = (catSlug) => {
    setRoleExpandedCats((prev) => ({
      ...prev,
      [catSlug]: prev[catSlug] === false ? true : false,
    }));
  };

  // Filter categories and sub-pages by search query
  const filteredPortalStructure = useMemo(() => {
    if (!rolePermSearch.trim()) return fullPortalStructure;
    const q = rolePermSearch.trim().toLowerCase();
    return fullPortalStructure
      .map((cat) => {
        const catTitleEn = (cat.titleEn || '').toLowerCase();
        const catTitleTe = (cat.titleTe || '').toLowerCase();
        const catSlug = (cat.categorySlug || '').toLowerCase();
        const catMatch = catTitleEn.includes(q) || catTitleTe.includes(q) || catSlug.includes(q);

        const matchedPages = (cat.pages || []).filter((p) => {
          const pTitleEn = (p.titleEn || '').toLowerCase();
          const pTitleTe = (p.titleTe || '').toLowerCase();
          const pSlug = (p.pageSlug || '').toLowerCase();
          return pTitleEn.includes(q) || pTitleTe.includes(q) || pSlug.includes(q);
        });

        if (catMatch || matchedPages.length > 0) {
          return {
            ...cat,
            pages: catMatch ? cat.pages : matchedPages,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [fullPortalStructure, rolePermSearch]);

  // ----------------------------------------------------
  // PAGE MANAGEMENT HANDLERS
  // ----------------------------------------------------
  const handleAddPage = async (e) => {
    e.preventDefault();
    if (!newPage.title.trim()) {
      alert('Please provide a page title.');
      return;
    }

    setLoading(true);
    try {
      const cleanTitle = newPage.title.trim();
      const cleanTitleTe = (newPage.titleTe || '').trim() || cleanTitle;
      const generatedSlug =
        newPage.pageSlug.trim() ||
        cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload = {
        categorySlug: newPage.categorySlug,
        pageSlug: generatedSlug,
        title: cleanTitle,
        titleEn: cleanTitle,
        titleTe: cleanTitleTe,
        desc: newPage.desc.trim(),
        descEn: newPage.desc.trim(),
        descTe: newPage.desc.trim(),
        externalUrl: newPage.externalUrl.trim() || null,
        iconName: newPage.iconName.trim() || 'FileText',
        createdAt: serverTimestamp(),
      };

      if (newPage.categorySlug === 'custom') {
        const catName = newPage.customCategoryTitle.trim() || 'Custom';
        payload.customCategorySlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        payload.customCategoryTitle = catName;
        payload.customCategoryTitleEn = catName;
        payload.customCategoryTitleTe = catName;
      }

      await addDoc(collection(db, 'portal_pages'), payload);
      showFeedback('success', `Page "${cleanTitle}" added to ${newPage.categorySlug.toUpperCase()} navigation!`);
      const targetCat = newPage.categorySlug === 'custom' ? (payload.customCategorySlug || 'more') : newPage.categorySlug;
      setNewPage({
        categorySlug: targetCat,
        customCategoryTitle: '',
        title: '',
        titleTe: '',
        pageSlug: '',
        desc: '',
        externalUrl: '',
        iconName: 'FileText',
      });
      setIsAddSubPageModalOpen(false);
      await fetchPages();
      setPageCategoryFilter(targetCat);
      setCollapsedCategories((prev) => ({ ...prev, [targetCat]: false }));
    } catch (err) {
      showFeedback('error', 'Failed to add page: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditPage = (page, cat) => {
    setEditingPageModal({
      ...page,
      categorySlug: cat?.categorySlug || page.categorySlug || 'home',
      categoryTitle: cat?.titleEn || page.categorySlug,
    });
    setPageEditForm({
      titleEn: page.titleEn || page.title || '',
      titleTe: page.titleTe || '',
      descEn: page.descEn || page.desc || '',
      externalUrl: page.externalUrl || '',
      iconName: page.iconName || 'FileText',
    });
  };

  const handleSavePageEdit = async (e) => {
    e.preventDefault();
    if (!editingPageModal) return;
    if (!pageEditForm.titleEn.trim()) {
      alert('Please enter a page title.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        categorySlug: editingPageModal.categorySlug,
        pageSlug: editingPageModal.pageSlug,
        title: pageEditForm.titleEn.trim(),
        titleEn: pageEditForm.titleEn.trim(),
        titleTe: pageEditForm.titleTe.trim() || pageEditForm.titleEn.trim(),
        desc: pageEditForm.descEn.trim(),
        descEn: pageEditForm.descEn.trim(),
        descTe: pageEditForm.descEn.trim(),
        externalUrl: pageEditForm.externalUrl.trim() || null,
        iconName: pageEditForm.iconName.trim() || 'FileText',
        updatedAt: serverTimestamp(),
      };

      if (editingPageModal.id) {
        await updateDoc(doc(db, 'portal_pages', editingPageModal.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'portal_pages'), payload);
      }

      showFeedback('success', `Page "${pageEditForm.titleEn}" updated successfully!`);
      setEditingPageModal(null);
      setIsAddSubPageModalOpen(false);
      await fetchPages();
    } catch (err) {
      showFeedback('error', 'Failed to update page: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Delete this page from navigation?')) return;
    try {
      await deleteDoc(doc(db, 'portal_pages', pageId));
      showFeedback('success', 'Page deleted from navigation.');
      setIsAddSubPageModalOpen(false);
      await fetchPages();
    } catch (err) {
      showFeedback('error', 'Failed to delete page: ' + err.message);
    }
  };

  // ----------------------------------------------------
  // ARTICLE & CONTENT HANDLERS
  // ----------------------------------------------------
  const handleSaveContent = async (e) => {
    e.preventDefault();
    if (!newContent.title.trim()) {
      alert('Please provide a title for the content.');
      return;
    }

    setLoading(true);
    try {
      const cleanTitle = cleanObjectReplacementChars(newContent.title.trim());
      const cleanDesc = cleanObjectReplacementChars(newContent.desc.trim());
      const payload = {
        categorySlug: newContent.categorySlug,
        pageSlug: newContent.pageSlug,
        targetPages: Array.isArray(newContent.targetPages) && newContent.targetPages.length > 0 ? newContent.targetPages : [newContent.pageSlug],
        title: cleanTitle,
        titleEn: cleanTitle,
        titleTe: cleanTitle,
        desc: cleanDesc,
        descEn: cleanDesc,
        descTe: cleanDesc,
        imageUrl: newContent.imageUrl.trim() || null,
        videoUrl: newContent.videoUrl.trim() || null,
        audioUrl: newContent.audioUrl.trim() || null,
        fileUrl: newContent.fileUrl.trim() || null,
        downloadUrl: newContent.downloadUrl.trim() || null,
        websiteUrl: newContent.websiteUrl?.trim() || null,
        embedUrl: newContent.websiteUrl?.trim() || null,
        updatedAt: serverTimestamp(),
      };

      if (editingContent?.id) {
        await updateDoc(doc(db, 'page_contents', editingContent.id), payload);
        showFeedback('success', 'Article updated successfully!');
      } else {
        payload.createdAt = serverTimestamp();
        payload.authorEmail = currentUser?.email || 'admin@sni.org.in';
        await addDoc(collection(db, 'page_contents'), payload);
        showFeedback('success', 'Article published successfully!');
      }

      setIsContentFormOpen(false);
      setEditingContent(null);
      setNewContent({
        categorySlug: 'worship',
        pageSlug: 'sermons',
        targetPages: ['sermons'],
        title: '',
        desc: '',
        imageUrl: '',
        videoUrl: '',
        audioUrl: '',
        fileUrl: '',
        downloadUrl: '',
        websiteUrl: '',
      });
      await fetchContents();
    } catch (err) {
      showFeedback('error', 'Failed to save content: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditContentClick = (item) => {
    setEditingContent(item);
    setNewContent({
      categorySlug: item.categorySlug || 'worship',
      pageSlug: item.pageSlug || 'sermons',
      targetPages: item.targetPages || [item.pageSlug || 'sermons'],
      title: item.title || item.titleEn || item.titleTe || '',
      desc: item.desc || item.content || item.descEn || item.descTe || '',
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      audioUrl: item.audioUrl || '',
      fileUrl: item.fileUrl || '',
      downloadUrl: item.downloadUrl || '',
      websiteUrl: item.websiteUrl || item.embedUrl || '',
    });
    setAdminShowMedia(Boolean(item.imageUrl || item.videoUrl || item.audioUrl || item.fileUrl || item.downloadUrl || item.websiteUrl || item.embedUrl));
    setIsContentFormOpen(true);
  };

  const handleDeleteContentItem = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await deleteDoc(doc(db, 'page_contents', contentId));
      showFeedback('success', 'Article removed.');
      await fetchContents();
    } catch (err) {
      showFeedback('error', 'Failed to delete article: ' + err.message);
    }
  };

  // ----------------------------------------------------
  // ANNOUNCEMENTS HANDLERS
  // ----------------------------------------------------
  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim()) {
      alert('Please provide an announcement title.');
      return;
    }

    setLoading(true);
    try {
      const cleanTitle = newAnnouncement.title.trim();
      const cleanDesc = newAnnouncement.desc.trim();
      const payload = {
        title: cleanTitle,
        titleEn: cleanTitle,
        titleTe: cleanTitle,
        desc: cleanDesc,
        descEn: cleanDesc,
        descTe: cleanDesc,
        imageUrl: newAnnouncement.imageUrl.trim() || null,
        date: newAnnouncement.date || new Date().toISOString().split('T')[0],
        category: 'New Updates',
        updatedAt: serverTimestamp(),
      };

      if (editingAnnouncementId) {
        await updateDoc(doc(db, 'announcements', editingAnnouncementId), payload);
        showFeedback('success', 'Announcement updated successfully!');
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'announcements'), payload);
        showFeedback('success', 'Announcement published successfully!');
      }

      setEditingAnnouncementId(null);
      setNewAnnouncement({
        title: '',
        desc: '',
        imageUrl: '',
        date: new Date().toISOString().split('T')[0],
      });
      await fetchAnnouncements();
    } catch (err) {
      showFeedback('error', 'Failed to save announcement: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      showFeedback('success', 'Announcement removed.');
      await fetchAnnouncements();
    } catch (err) {
      showFeedback('error', 'Failed to delete: ' + err.message);
    }
  };

  // Filtered users
  const isUserPending = (u) => {
    const isUserAdmin = u.role === 'admin' || (u.email && u.email.startsWith('surya')) || (u.id && String(u.id).startsWith('surya'));
    if (isUserAdmin) return false;
    if (u.status === 'approved' || u.status === 'revoked' || u.status === 'rejected' || u.status === 'unverified') return false;
    const isContactVerified = u.isVerified === true || u.phoneVerified === true || u.contactVerified === true || u.emailVerified === true;
    const hasValidContact = (u.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u.email)) ||
                            (u.phone && String(u.phone).trim().length >= 8) ||
                            (u.contact && String(u.contact).trim().length >= 2) ||
                            (u.userId && String(u.userId).trim().length >= 2) ||
                            (u.id && String(u.id).trim().length >= 2);
    return hasValidContact && isContactVerified && (u.status === 'pending' || u.status === 'waiting' || u.status === 'awaiting_approval');
  };

  const isUserUnverified = (u) => {
    const isUserAdmin = u.role === 'admin' || (u.email && u.email.startsWith('surya')) || (u.id && String(u.id).startsWith('surya'));
    if (isUserAdmin) return false;
    if (u.status === 'approved' || u.status === 'revoked' || u.status === 'rejected') return false;
    const isContactVerified = u.isVerified === true || u.phoneVerified === true || u.contactVerified === true || u.emailVerified === true;
    return !isContactVerified || u.status === 'unverified' || u.status === 'awaiting_verification';
  };

  const isUserApproved = (u) => {
    const isUserAdmin = u.role === 'admin' || (u.email && u.email.startsWith('surya')) || (u.id && String(u.id).startsWith('surya'));
    return isUserAdmin || u.status === 'approved';
  };

  const pendingUsersCount = usersList.filter(isUserPending).length;
  const unverifiedUsersCount = usersList.filter(isUserUnverified).length;
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.displayName || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.id || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.phone || '').toLowerCase().includes(userSearchTerm.toLowerCase());

    if (userStatusFilter === 'pending') return matchesSearch && isUserPending(u);
    if (userStatusFilter === 'unverified') return matchesSearch && isUserUnverified(u);
    if (userStatusFilter === 'approved') return matchesSearch && isUserApproved(u);
    return matchesSearch;
  });

  // Filtered contents
  const filteredContents = contentsList.filter((item) => {
    if (contentCategoryFilter === 'all') return true;
    return item.categorySlug === contentCategoryFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-24 selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* 1. Top Header Banner */}
      <section className="bg-gradient-to-r from-[#071B3B] via-[#0F294A] to-[#122847] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#1A3860]">
        <div className="w-full max-w-[1720px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#F4B942] border border-[#F4B942]/40 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrative Central Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-serif">
              Administration & Governance
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Approve new users, assign ministerial roles, manage website navigation, publish rich articles, manage photo galleries, and post announcements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20"
            >
              <Eye className="w-4 h-4 text-[#F4B942]" />
              <span>View Public Website</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Main Navigation Tabs */}
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 -mt-8">
        <div className="bg-[#040E1E] border border-[#132A4A] rounded-2xl p-2 shadow-2xl flex items-center gap-2 overflow-x-auto">
          {/* Tab 1: Users & Approvals */}
          <button
            onClick={() => handleTabChange('users')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Approvals</span>
            {pendingUsersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] animate-pulse">
                {pendingUsersCount} pending
              </span>
            )}
          </button>

          {/* Tab 2: Pages & Menus */}
          <button
            onClick={() => handleTabChange('pages')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'pages'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Categories & Pages</span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">
              {customPagesList.length}
            </span>
          </button>

          {/* Tab 3: Articles & Contents */}
          <button
            onClick={() => handleTabChange('contents')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'contents'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Articles & Content</span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">
              {contentsList.length}
            </span>
          </button>

          {/* Tab 4: Photo Gallery & Banners */}
          <button
            onClick={() => handleTabChange('photos')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'photos'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photos & Banners</span>
          </button>

          {/* Tab 5: Announcements */}
          <button
            onClick={() => handleTabChange('announcements')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'announcements'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Announcements</span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">
              {announcements.length}
            </span>
          </button>

          {/* Tab 6: SNI Studio */}
          <button
            onClick={() => handleTabChange('studio')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'studio'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Studio</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-[#F4B942] text-[10px] font-mono font-bold border border-amber-400/30">
              PRO
            </span>
          </button>

          {/* Tab 7: Role Management */}
          <button
            onClick={() => handleTabChange('roles')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'roles'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Role</span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">
              {rolesList.length}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Feedback Banner */}
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 mt-6">
        {statusMessage.text && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold border animate-in fade-in duration-150 ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* 4. Tab Panels */}
      <main className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 mt-6">
        {/* ======================================================== */}
        {/* TAB 1: USERS & APPROVALS                                 */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Top Toolbar: Filters & Search */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: `All Users (${usersList.length})` },
                  { id: 'pending', label: `Pending Approvals (${pendingUsersCount})` },
                  { id: 'unverified', label: `Awaiting Verification (${unverifiedUsersCount})` },
                  { id: 'approved', label: 'Approved Members' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setUserStatusFilter(f.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      userStatusFilter === f.id
                        ? 'bg-[#0F294A] text-[#F4B942] shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0F294A]">
                    Registered User Accounts & Approvals
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click "Approve" to activate a user account and select their ministerial role.
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
                  className="p-2 text-slate-500 hover:text-[#0F294A] hover:bg-slate-100 rounded-xl transition"
                  title="Refresh User List"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Full Name & ID</th>
                      <th className="py-3 px-4">Contact (Email / Phone)</th>
                      <th className="py-3 px-4">Approval Status</th>
                      <th className="py-3 px-4">Ministerial Role</th>
                        <th className="py-3 px-4">Password</th>
                      <th className="py-3 px-4">Temp Pass (123456 - 3h)</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                          No users found matching current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isUserAdmin = u.role === 'admin' || (u.email && u.email.startsWith('surya')) || (u.id && String(u.id).startsWith('surya'));
                        const isApproved = isUserApproved(u);
                        const isRevoked = u.status === 'revoked';
                        const isRejected = u.status === 'rejected';
                        const isPending = isUserPending(u);

                        const isTempPassActive =
                          u.tempPassword === '123456' &&
                          u.tempPasswordExpiresAt &&
                          new Date(u.tempPasswordExpiresAt) > new Date();

                        return (
                          <tr key={u.id} className="hover:bg-slate-50 transition">
                            {/* Full Name & User ID */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#0F294A] text-[#F4B942] font-bold flex items-center justify-center shrink-0 text-xs">
                                  {(u.displayName || u.email || 'U')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">
                                    {u.displayName || 'Unnamed User'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono truncate">
                                    ID: {u.id || u.userId}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact: Email & Phone */}
                            <td className="py-4 px-4">
                              <div className="text-xs text-slate-800 font-medium truncate">
                                {u.phone || u.contact || u.email || 'No contact'}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {u.email && u.phone ? `Email: ${u.email}` : ''}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                {u.phoneVerified || (u.phone && (u.contactVerified || u.isVerified)) ? (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Phone Verified</span>
                                  </span>
                                ) : u.emailVerified || u.role === 'admin' || u.role === 'ADMIN' ? (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Verified</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold" title="Applicant must verify their phone or email before approval">
                                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Unverified</span>
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Approval Status */}
                            <td className="py-4 px-4">
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Approved</span>
                                </span>
                              ) : isRevoked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">
                                  <UserX className="w-3 h-3 text-rose-600" />
                                  <span>Revoked</span>
                                </span>
                              ) : isRejected ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">
                                  <X className="w-3 h-3 text-rose-500" />
                                  <span>Rejected</span>
                                </span>
                              ) : (!u.contactVerified && !u.isVerified) ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-[10px] font-bold uppercase tracking-wider">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>Awaiting Verification</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Approval</span>
                                </span>
                              )}
                            </td>

                            {/* Role Selector */}
                            <td className="py-4 px-4">
                              <select
                                value={u.role || ''}
                                onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                disabled={updatingUserId === u.id}
                                className="p-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                              >
                                <option value="" disabled>Select Role</option>
                                {rolesList.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.nameEn || r.name || r.id}
                                  </option>
                                ))}
                                {u.role && !rolesList.find((r) => r.id === u.role) && (
                                  <option value={u.role}>
                                    {u.role}
                                  </option>
                                )}
                              </select>
                            </td>

                            {/* Password */}
                            <td className="py-4 px-4 font-mono text-xs text-slate-700">
                              {u.password || '—'}
                            </td>

                            {/* Temporary Password Status */}
                            <td className="py-4 px-4">
                              {isTempPassActive ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px]">
                                    <Lock className="w-3 h-3 text-amber-600" />
                                    <span>123456</span>
                                  </span>
                                  <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                    Expires {new Date(u.tempPasswordExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">Regular</span>
                              )}
                            </td>

                            {/* Actions: Approve / Revoke / Reset Temp Pass (3h) / Delete */}
                            <td className="py-4 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {!isApproved && (
                                  <button
                                    onClick={() => handleApproveUser(u.id, u.role || 'member')}
                                    disabled={updatingUserId === u.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition cursor-pointer"
                                    title="Approve User"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Approve</span>
                                  </button>
                                )}

                                {isApproved && !isUserAdmin && (
                                  <button
                                    onClick={() => handleRevokeUser(u.id)}
                                    disabled={updatingUserId === u.id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition cursor-pointer"
                                    title="Revoke access"
                                  >
                                    <UserX className="w-3 h-3 text-rose-600" />
                                    <span>Revoke</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => handleResetTempPassword(u.id, u.email)}
                                  disabled={updatingUserId === u.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-300 transition cursor-pointer"
                                  title="Reset password to 123456 valid for 3 hours"
                                >
                                  <KeyRound className="w-3 h-3 text-amber-600" />
                                  <span>Reset 123456 (3h)</span>
                                </button>

                                {!isUserAdmin && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Delete User Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: COMPLETE PORTAL PAGES & NAVIGATION ARCHITECTURE   */}
        {/* ======================================================== */}
        {activeTab === 'pages' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Create Sub-Page Form */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm self-start">
                <h2 className="text-base font-bold text-[#0F294A] mb-1 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#C59B27]" />
                  <span>Add New Sub-Page to Menu</span>
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  Create a new sub-page under any category. It instantly appears across navigation menus, subnav bars, and at <code className="bg-slate-100 px-1 py-0.5 rounded text-[#071B3B]">/page/:category/:slug</code>.
                </p>

                <form onSubmit={handleAddPage} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Select Target Category *
                    </label>
                    <select
                      value={newPage.categorySlug}
                      onChange={(e) => setNewPage({ ...newPage, categorySlug: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-xs"
                    >
                      <option value="home">Home</option>
                      <option value="worship">Worship</option>
                      <option value="bible-truth">Bible & Truth</option>
                      <option value="family">Family & Faith</option>
                      <option value="grow">Grow</option>
                      <option value="go-come">Go & Come</option>
                      <option value="program">Program</option>
                      <option value="more">More</option>
                      <option value="custom">+ Create Brand New Category</option>
                    </select>
                  </div>

                  {newPage.categorySlug === 'custom' && (
                    <div className="p-3 rounded-2xl bg-amber-50/70 border border-[#C59B27]/40 space-y-2">
                      <label className="block font-bold text-slate-700">
                        New Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPage.customCategoryTitle}
                        onChange={(e) =>
                          setNewPage({ ...newPage, customCategoryTitle: e.target.value })
                        }
                        placeholder="e.g. Fellowship"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Page Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPage.title}
                      onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                      placeholder="e.g. New Song Festival"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Page URL Slug (optional)
                    </label>
                    <input
                      type="text"
                      value={newPage.pageSlug}
                      onChange={(e) => setNewPage({ ...newPage, pageSlug: e.target.value })}
                      placeholder="e.g. new-song-festival"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      URL: /page/{newPage.categorySlug}/{newPage.pageSlug || newPage.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'slug'}
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      rows={2}
                      value={newPage.desc}
                      onChange={(e) => setNewPage({ ...newPage, desc: e.target.value })}
                      placeholder="Brief description of this section..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      External Link URL (optional)
                    </label>
                    <input
                      type="url"
                      value={newPage.externalUrl}
                      onChange={(e) => setNewPage({ ...newPage, externalUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold uppercase tracking-wider text-xs shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{loading ? 'Adding Page...' : 'Publish Page to Menu'}</span>
                  </button>
                </form>
              </div>

              {/* Complete Portal Pages Architecture Section */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
                  {/* Top Bar with Title, Total Count, and Refresh */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#0F294A]">
                          All Portal Navigation Pages
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[#0F294A] text-xs font-extrabold">
                          {totalPagesCount} Pages
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage, organize, edit and inspect all official system pages and custom navigation subpages.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {/* View mode toggle */}
                      <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPageViewMode('grouped')}
                          className={`p-1.5 rounded-lg transition ${
                            pageViewMode === 'grouped' ? 'bg-white shadow-xs text-[#071B3B]' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Grouped by Category"
                        >
                          <FolderTree className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageViewMode('cards')}
                          className={`p-1.5 rounded-lg transition ${
                            pageViewMode === 'cards' ? 'bg-white shadow-xs text-[#071B3B]' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Grid Cards"
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPageViewMode('table')}
                          className={`p-1.5 rounded-lg transition ${
                            pageViewMode === 'table' ? 'bg-white shadow-xs text-[#071B3B]' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Compact Table"
                        >
                          <Table className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={fetchPages}
                        className="p-2 rounded-xl text-slate-500 hover:text-[#0F294A] hover:bg-slate-100 border border-slate-200 transition"
                        title="Reload Pages"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={pageSearchTerm}
                      onChange={(e) => setPageSearchTerm(e.target.value)}
                      placeholder="Search any page by title, slug, or category..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-slate-50/50"
                    />
                    {pageSearchTerm && (
                      <button
                        onClick={() => setPageSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none text-xs border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPageCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                        pageCategoryFilter === 'all'
                          ? 'bg-[#071B3B] text-[#F4B942] shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({totalPagesCount})
                    </button>
                    {fullPortalStructure.map((cat) => {
                      const count = cat.pages?.length || 0;
                      const isActive = pageCategoryFilter === cat.categorySlug;
                      return (
                        <button
                          key={cat.categorySlug}
                          type="button"
                          onClick={() => setPageCategoryFilter(cat.categorySlug)}
                          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-[#071B3B] text-[#F4B942] shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>{cat.titleEn}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setPageCategoryFilter('custom')}
                      className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        pageCategoryFilter === 'custom'
                          ? 'bg-[#071B3B] text-[#F4B942] shadow-xs'
                          : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      <span>Custom Pages</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-bold">
                        {customPagesList.length}
                      </span>
                    </button>
                  </div>

                  {/* 1. VIEW MODE: GROUPED BY CATEGORY (Accordion) */}
                  {pageViewMode === 'grouped' && (
                    <div className="space-y-4">
                      {filteredPortalCategories.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          No pages matched your search query.
                        </div>
                      ) : (
                        filteredPortalCategories.map((cat) => {
                          const isCollapsed = Boolean(collapsedCategories[cat.categorySlug]);
                          const catPages = cat.pages || [];

                          return (
                            <div
                              key={cat.categorySlug}
                              className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-2xs"
                            >
                              {/* Category Accordion Header */}
                              <div
                                onClick={() =>
                                  setCollapsedCategories((prev) => ({
                                    ...prev,
                                    [cat.categorySlug]: !prev[cat.categorySlug],
                                  }))
                                }
                                className="px-4 py-3 bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-between cursor-pointer border-b border-slate-200/80"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-[#0F294A] text-[#F4B942] flex items-center justify-center font-bold text-xs shadow-xs">
                                    {cat.titleEn.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold text-[#0F294A]">
                                        {cat.titleEn}
                                      </h4>
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold font-mono">
                                        /{cat.categorySlug}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAddSubPageModal(cat.categorySlug);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] text-[11px] font-bold shadow-xs transition cursor-pointer"
                                    title={`Add new page under ${cat.titleEn}`}
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>+ Add Page</span>
                                  </button>
                                  <Link
                                    to={`/category/${cat.categorySlug}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] font-bold text-[#C59B27] hover:underline flex items-center gap-1 mr-1"
                                    title="Open Category Overview"
                                  >
                                    <span>Category Page</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                    {catPages.length} {catPages.length === 1 ? 'Page' : 'Pages'}
                                  </span>
                                  {isCollapsed ? (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </div>

                              {/* Category Subpages Grid */}
                              {!isCollapsed && (
                                <div className="p-3 bg-white">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {catPages.map((p) => {
                                      // Count articles in this page
                                      const articleCount = contentsList.filter(
                                        (c) =>
                                          c.pageSlug === p.pageSlug ||
                                          (Array.isArray(c.targetPages) && c.targetPages.includes(p.pageSlug))
                                      ).length;

                                      return (
                                        <div
                                          key={p.pageSlug}
                                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#C59B27]/60 hover:shadow-sm transition flex items-start justify-between gap-3 group"
                                        >
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                Page
                                              </span>
                                              <span className="text-[10px] font-mono text-slate-400">
                                                /page/{cat.categorySlug}/{p.pageSlug}
                                              </span>
                                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white text-slate-600 border border-slate-200">
                                                {articleCount} {articleCount === 1 ? 'Article' : 'Articles'}
                                              </span>
                                            </div>

                                            <h5 className="text-xs font-bold text-slate-900 mt-1 truncate">
                                              {p.titleEn || p.title}
                                            </h5>

                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                              <Link
                                                to={`/page/${cat.categorySlug}/${p.pageSlug}`}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F294A] hover:text-[#C59B27] hover:underline"
                                              >
                                                <span>Open Page</span>
                                                <ExternalLink className="w-3 h-3 text-[#C59B27]" />
                                              </Link>
                                              <Link
                                                to={`/page/${cat.categorySlug}/${p.pageSlug}?new=true`}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 transition"
                                              >
                                                <Plus className="w-3 h-3 text-[#C59B27]" />
                                                <span>+ Write Note</span>
                                              </Link>
                                              <button
                                                type="button"
                                                onClick={() => handleOpenAddSubPageModal(cat.categorySlug)}
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition cursor-pointer"
                                                title={`Add new page under ${cat.titleEn}`}
                                              >
                                                <Plus className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                                <span>+ Add Page</span>
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleOpenEditPage(p, cat)}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                                              >
                                                <Pencil className="w-3 h-3" />
                                                <span>Edit</span>
                                              </button>
                                            </div>
                                          </div>

                                          {p.isCustom && (
                                            <button
                                              onClick={() => handleDeletePage(p.id)}
                                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                              title="Delete Custom Page"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {/* Quick Card to Add New Page inside this category */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddSubPageModal(cat.categorySlug)}
                                      className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#F4B942] bg-slate-50/60 hover:bg-amber-50/40 transition flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0F294A] cursor-pointer min-h-[85px] group"
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="w-4 h-4 stroke-[3]" />
                                      </div>
                                      <span>+ Add New Sub-Page in {cat.titleEn}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 2. VIEW MODE: GRID CARDS */}
                  {pageViewMode === 'cards' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {allFilteredPages.map((p) => {
                        const articleCount = contentsList.filter(
                          (c) =>
                            c.pageSlug === p.pageSlug ||
                            (Array.isArray(c.targetPages) && c.targetPages.includes(p.pageSlug))
                        ).length;

                        return (
                          <div
                            key={`${p.categorySlug}-${p.pageSlug}`}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#C59B27] hover:bg-white transition flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-[#0F294A]">
                                  {p.categoryTitleEn || p.categorySlug}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  Page
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {p.titleEn || p.title}
                              </h5>
                              <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                                /page/{p.categorySlug}/{p.pageSlug}
                              </p>
                              <div className="mt-1.5">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 font-semibold">
                                  {articleCount} {articleCount === 1 ? 'Article' : 'Articles'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                              <Link
                                to={`/page/${p.categorySlug}/${p.pageSlug}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C59B27] hover:underline"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddSubPageModal(p.categorySlug)}
                                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 cursor-pointer"
                                  title={`Add new page under ${p.categoryTitleEn || p.categorySlug}`}
                                >
                                  <Plus className="w-2.5 h-2.5 stroke-[3]" />
                                  <span>+ Page</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditPage(p, { categorySlug: p.categorySlug, titleEn: p.categoryTitleEn })}
                                  className="p-1 text-slate-400 hover:text-slate-800"
                                  title="Edit Page"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                {p.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePage(p.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600"
                                    title="Delete Page"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. VIEW MODE: COMPACT TABLE */}
                  {pageViewMode === 'table' && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Page Title</th>
                            <th className="py-2.5 px-3">URL Slug</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Articles</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {allFilteredPages.map((p) => {
                            const articleCount = contentsList.filter(
                              (c) =>
                                c.pageSlug === p.pageSlug ||
                                (Array.isArray(c.targetPages) && c.targetPages.includes(p.pageSlug))
                            ).length;

                            return (
                              <tr key={`${p.categorySlug}-${p.pageSlug}`} className="hover:bg-slate-50 transition">
                                <td className="py-2.5 px-3 font-semibold text-slate-700">
                                  {p.categoryTitleEn || p.categorySlug}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                  <span>{p.titleEn || p.title}</span>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                                  /page/{p.categorySlug}/{p.pageSlug}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                    Page
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-semibold">
                                  {articleCount}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddSubPageModal(p.categorySlug)}
                                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                                      title={`Add new page under ${p.categoryTitleEn || p.categorySlug}`}
                                    >
                                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                    </button>
                                    <Link
                                      to={`/page/${p.categorySlug}/${p.pageSlug}`}
                                      className="p-1 text-slate-400 hover:text-[#C59B27]"
                                      title="Open Page"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditPage(p, { categorySlug: p.categorySlug, titleEn: p.categoryTitleEn })}
                                      className="p-1 text-slate-400 hover:text-slate-800"
                                      title="Edit Page"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    {p.isCustom && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePage(p.id)}
                                        className="p-1 text-slate-400 hover:text-rose-600"
                                        title="Delete Page"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* EDIT PAGE DETAILS MODAL */}
            {editingPageModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-[#0F294A] flex items-center justify-center font-bold">
                        <Pencil className="w-4 h-4 text-[#C59B27]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Edit Page Details
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          /page/{editingPageModal.categorySlug}/{editingPageModal.pageSlug}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingPageModal(null)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSavePageEdit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Page Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={pageEditForm.titleEn}
                        onChange={(e) => setPageEditForm({ ...pageEditForm, titleEn: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={pageEditForm.descEn}
                        onChange={(e) => setPageEditForm({ ...pageEditForm, descEn: e.target.value })}
                        placeholder="Page description / subtitle..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        External Link URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={pageEditForm.externalUrl}
                        onChange={(e) => setPageEditForm({ ...pageEditForm, externalUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setEditingPageModal(null)}
                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm"
                      >
                        {loading ? 'Saving...' : 'Save & Update Page'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ADD NEW NAVIGATION PAGE MODAL */}
            {isAddSubPageModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-[#0F294A] flex items-center justify-center font-bold">
                        <Plus className="w-4 h-4 text-[#C59B27] stroke-[3]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Add New Sub-Page to Menu
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono">
                          /page/{newPage.categorySlug}/{newPage.pageSlug || 'new-slug'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddSubPageModalOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddPage} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Target Category *
                      </label>
                      <select
                        value={newPage.categorySlug}
                        onChange={(e) => setNewPage({ ...newPage, categorySlug: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-xs"
                      >
                        <option value="home">Home</option>
                        <option value="worship">Worship</option>
                        <option value="bible-truth">Bible & Truth</option>
                        <option value="family">Family & Faith</option>
                        <option value="grow">Grow</option>
                        <option value="go-come">Go & Come</option>
                        <option value="program">Program</option>
                        <option value="more">More</option>
                        <option value="custom">+ Create Brand New Category</option>
                      </select>
                    </div>

                    {newPage.categorySlug === 'custom' && (
                      <div className="p-3 rounded-2xl bg-amber-50/70 border border-[#C59B27]/40 space-y-2">
                        <label className="block font-bold text-slate-700">
                          New Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={newPage.customCategoryTitle}
                          onChange={(e) =>
                            setNewPage({ ...newPage, customCategoryTitle: e.target.value })
                          }
                          placeholder="e.g. Fellowship"
                          className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Page Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPage.title}
                        onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                        placeholder="e.g. Youth Fellowship, Testimonies..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Page URL Slug (optional)
                      </label>
                      <input
                        type="text"
                        value={newPage.pageSlug}
                        onChange={(e) => setNewPage({ ...newPage, pageSlug: e.target.value })}
                        placeholder="e.g. youth-fellowship"
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        URL: /page/{newPage.categorySlug}/{newPage.pageSlug || newPage.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'slug'}
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        rows={2}
                        value={newPage.desc}
                        onChange={(e) => setNewPage({ ...newPage, desc: e.target.value })}
                        placeholder="Brief description of this section..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        External Link URL (optional)
                      </label>
                      <input
                        type="url"
                        value={newPage.externalUrl}
                        onChange={(e) => setNewPage({ ...newPage, externalUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsAddSubPageModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-5 py-2 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{loading ? 'Adding Page...' : 'Publish Page to Menu'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ARTICLES & PAGE CONTENTS (with RichTextEditor)     */}
        {/* ======================================================== */}
        {activeTab === 'contents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Filter by Category:</span>
                <select
                  value={contentCategoryFilter}
                  onChange={(e) => setContentCategoryFilter(e.target.value)}
                  className="p-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="home">Home</option>
                  <option value="worship">Worship</option>
                  <option value="bible-truth">Truth</option>
                  <option value="family">Family</option>
                  <option value="grow">Grow</option>
                  <option value="go-come">Go & Come</option>
                  <option value="program">Program</option>
                  <option value="more">More</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setEditingContent(null);
                  setNewContent({
                    categorySlug: 'worship',
                    pageSlug: 'sermons',
                    targetPages: ['sermons'],
                    title: '',
                    desc: '',
                    imageUrl: '',
                    videoUrl: '',
                    audioUrl: '',
                    fileUrl: '',
                    downloadUrl: '',
                    websiteUrl: '',
                  });
                  setAdminShowMedia(false);
                  setIsContentFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Write New Article</span>
              </button>
            </div>

            {/* Notion Document Editor Launcher */}
            {isContentFormOpen && (
              <div className="bg-gradient-to-br from-white via-amber-50/20 to-slate-50 rounded-3xl border border-[#C59B27]/60 p-6 sm:p-8 shadow-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#0F294A] text-[#F4B942] flex items-center justify-center font-black text-lg shadow-sm">
                      📝
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F294A]">
                        {editingContent ? 'Edit Note / Article in Notion Document Editor' : 'Write New Note / Article (Notion Editor)'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Select any target page across the portal to open the modern Notion-style document editor with full rich text, calendar tracking, media embeds, and custom emojis.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsContentFormOpen(false); setEditingContent(null); }}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {editingContent ? (
                  <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C59B27]">
                          {editingContent.categorySlug} / {editingContent.pageSlug}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {editingContent.title || editingContent.titleEn || 'Selected Article'}
                        </h4>
                      </div>
                      <Link
                        to={`/Home/${editingContent.categorySlug || 'worship'}/${editingContent.pageSlug || 'sermons'}/${editingContent.id}?edit=true`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] text-xs font-bold uppercase tracking-wider transition shadow-sm"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>Open in Notion Document Editor →</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Page Selector Form */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-xs">
                          1. Select Category *
                        </label>
                        <select
                          value={newContent.categorySlug}
                          onChange={(e) => {
                            const newCat = e.target.value;
                            const targetCatObj = fullPortalStructure.find((c) => c.categorySlug === newCat);
                            const firstSub = targetCatObj?.pages?.[0]?.pageSlug || 'new-updates';
                            setNewContent({ ...newContent, categorySlug: newCat, pageSlug: firstSub });
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                        >
                          {fullPortalStructure.map((cat) => (
                            <option key={cat.categorySlug} value={cat.categorySlug}>
                              {cat.titleEn}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-xs">
                          2. Select Sub-Page *
                        </label>
                        <select
                          value={newContent.pageSlug}
                          onChange={(e) => setNewContent({ ...newContent, pageSlug: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                        >
                          {(fullPortalStructure.find((c) => c.categorySlug === newContent.categorySlug)?.pages || []).map((p) => (
                            <option key={p.pageSlug} value={p.pageSlug}>
                              {p.titleEn || p.title} ({p.pageSlug})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Link
                          to={`/page/${newContent.categorySlug || 'home'}/${newContent.pageSlug || 'new-updates'}?new=true`}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Open Notion Document Editor →</span>
                        </Link>
                      </div>
                    </div>

                    {/* Quick Launch Cards */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>Quick Write by Section:</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                        {[
                          { title: 'New Updates', cat: 'home', page: 'new-updates', icon: '📢' },
                          { title: 'Events', cat: 'home', page: 'events', icon: '🎉' },
                          { title: 'Schedule', cat: 'home', page: 'schedule', icon: '📅' },
                          { title: 'Sermons', cat: 'worship', page: 'sermons', icon: '📖' },
                          { title: 'Songs & Praise', cat: 'worship', page: 'songs', icon: '🎵' },
                          { title: 'Youth & Faith', cat: 'family', page: 'youth', icon: '🌱' },
                        ].map((q) => (
                          <Link
                            key={q.page}
                            to={`/page/${q.cat}/${q.page}?new=true`}
                            className="p-3 bg-white hover:bg-amber-50/50 rounded-2xl border border-slate-200 hover:border-[#C59B27] transition flex flex-col items-center text-center shadow-2xs group"
                          >
                            <span className="text-2xl mb-1 group-hover:scale-110 transition">{q.icon}</span>
                            <span className="text-xs font-bold text-slate-800 group-hover:text-[#0F294A]">{q.title}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">Write Note →</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContents.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition flex flex-col justify-between"
                >
                  <div>
                    {item.imageUrl && (
                      <div className="aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={item.imageUrl}
                          alt={item.title || item.titleEn || 'Article'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#C59B27] mb-1">
                        <span>{item.categorySlug} / {item.pageSlug}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                        {item.title || item.titleEn || item.titleTe}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                        {item.desc || item.content || item.descEn || item.descTe}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <Link
                      to={`/page/${item.categorySlug}/${item.pageSlug}`}
                      className="inline-flex items-center gap-1 font-bold text-[#C59B27] hover:underline text-[11px]"
                    >
                      <span>View In Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <Link
                        to={`/Home/${item.categorySlug || 'worship'}/${item.pageSlug || 'sermons'}/${item.id}?edit=true`}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition inline-flex items-center"
                        title="Edit in Notion Document Editor"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteContentItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PHOTO GALLERY & BANNERS (Dedicated Photo Manager)  */}
        {/* ======================================================== */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 flex-wrap gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#0F294A] flex items-center gap-2 mb-1">
                    <ImageIcon className="w-5 h-5 text-[#C59B27]" />
                    <span>Home Page Photos & Visual Showcase</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Photos added here automatically display in the Visual Gallery section on the Home page.
                  </p>
                </div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F294A] text-[#F4B942] font-bold text-xs hover:bg-[#071B3B] transition shadow-xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Home Hero Background & Content</span>
                </Link>
              </div>

              <PhotoGalleryManager
                targetPage="home"
                sectionTitleEn="Home Page Featured Photos"
                sectionTitleTe=""
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: ANNOUNCEMENTS & BULLETINS                         */}
        {/* ======================================================== */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Announcement Form */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0F294A] mb-1 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#C59B27]" />
                <span>{editingAnnouncementId ? 'Edit Announcement' : 'Post Announcement'}</span>
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Displays in the "New Updates & Schedule" feed on the Welcome page.
              </p>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    placeholder="Announcement Title"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                {/* Single Unified Rich Description */}
                <RichTextEditor
                  label="Description (Rich Text Editor)"
                  value={newAnnouncement.desc}
                  onChange={(val) => setNewAnnouncement({ ...newAnnouncement, desc: val })}
                  rows={5}
                />

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newAnnouncement.imageUrl}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newAnnouncement.date}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {editingAnnouncementId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAnnouncementId(null);
                        setNewAnnouncement({
                          title: '',
                          desc: '',
                          imageUrl: '',
                          date: new Date().toISOString().split('T')[0],
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold uppercase tracking-wider text-xs shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingAnnouncementId ? 'Update Notice' : 'Publish Notice'}
                  </button>
                </div>
              </form>
            </div>

            {/* Announcements List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
                <h3 className="text-base font-bold text-[#0F294A] mb-4">
                  Active Announcements ({announcements.length})
                </h3>

                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-[#C59B27] uppercase">
                          {a.date || 'Update'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                          {a.title || a.titleEn || a.titleTe}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {a.desc || a.descEn || a.descTe}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingAnnouncementId(a.id);
                            setNewAnnouncement({
                              title: a.title || a.titleEn || a.titleTe || '',
                              desc: a.desc || a.descEn || a.descTe || '',
                              imageUrl: a.imageUrl || '',
                              date: a.date || new Date().toISOString().split('T')[0],
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: SNI DEVELOPER STUDIO                          */}
        {/* ==================================================== */}
        {activeTab === 'studio' && (
          <div className="space-y-4">
            {/* Studio Header Toolbar */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#060a14] border border-[#18233f] flex items-center justify-center text-[#F4B942] shadow-sm">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#0F294A]">SNI Developer Studio</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                      Live Connected
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cards, Notices, Arrivals, Users, Site Text & Ecosystem Manager
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const iframe = document.getElementById('sni-studio-iframe');
                    if (iframe) iframe.src = iframe.src;
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  title="Reload Studio View"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reload</span>
                </button>
                <a
                  href="/studio.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] shadow-sm transition cursor-pointer"
                  title="Open in a separate browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Fullscreen</span>
                </a>
              </div>
            </div>

            {/* Embedded Studio Frame */}
            <div className="bg-[#060a14] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <iframe
                id="sni-studio-iframe"
                src="/studio.html"
                title="SNI Developer Studio"
                className="w-full h-[88vh] border-0"
                allow="clipboard-write; fullscreen"
              />
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: MINISTERIAL ROLE MANAGEMENT                   */}
        {/* ==================================================== */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#0F294A] flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#C59B27]" />
                  <span>Configured Ministerial Roles & Page Permissions</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage ministerial roles and configure category/sub-page permissions. Users can be assigned to any of these roles in the Users tab.
                </p>
              </div>

              <button
                onClick={handleOpenAddRole}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Role</span>
              </button>
            </div>

            {/* Custom Roles Grid */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rolesList.length === 0 ? (
                  <div className="col-span-full py-12 px-4 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-300">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="w-6 h-6 text-[#C59B27]" />
                    </div>
                    <h4 className="text-sm font-bold text-[#0F294A]">No Roles Configured Yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      All previous roles have been cleared. Click <span className="font-semibold text-[#0F294A]">"+ Add Role"</span> above to create your new ministerial roles.
                    </p>
                  </div>
                ) : (
                  rolesList.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#C59B27]/50 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[#0F294A] uppercase tracking-wider">
                            {r.nameEn || r.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-100 text-[#0F294A] font-bold">
                            {r.id}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mb-2">
                          {r.description || 'Custom ministerial role'}
                        </p>
                        <div className="text-[10px] text-slate-500 font-medium mt-1">
                          <span className="font-bold text-slate-700">Access: </span>
                          {r.allowedCategories?.includes('*') ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[9px]">
                              ALL PAGES & CONTENTS (*)
                            </span>
                          ) : r.allowedCategories && r.allowedCategories.length > 0 ? (
                            <span className="text-slate-600">
                              {Array.from(new Set(r.allowedCategories.map((x) => x.split('/').pop()))).slice(0, 5).join(', ')}
                              {Array.from(new Set(r.allowedCategories.map((x) => x.split('/').pop()))).length > 5 && (
                                <span className="text-amber-700 font-bold">
                                  {' '}+{Array.from(new Set(r.allowedCategories.map((x) => x.split('/').pop()))).length - 5} more
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No pages assigned</span>
                          )}
                        </div>
                      </div>

                      {/* Role Edit & Remove Actions */}
                      <div className="flex items-center justify-between pt-2.5 mt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRole(r)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-[#0F294A] px-2 py-1 rounded-md hover:bg-slate-200/60 transition cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-[#C59B27]" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(r)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-700 px-2 py-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal: Add / Edit Ministerial Role */}
            {isAddRoleOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                <div className="bg-white rounded-3xl max-w-2xl sm:max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
                  {/* Modal Top Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                    <h3 className="text-base font-bold text-[#0F294A] flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-[#C59B27]" />
                      <span>{editingRoleId ? 'Edit Ministerial Role' : 'Create New Ministerial Role'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddRoleOpen(false);
                        setEditingRoleId(null);
                      }}
                      className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateRole} className="flex flex-col flex-1 overflow-hidden text-xs">
                    {/* Scrollable Form Body */}
                    <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Role Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={newRole.name}
                          onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                          placeholder="e.g. Choir Ministry, Deacon, Sunday School Teacher"
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Role Description
                        </label>
                        <textarea
                          rows={2}
                          value={newRole.description}
                          onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                          placeholder="Responsibilities and purpose of this ministerial role..."
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>

                      {/* 🌟 Granular Permissions: Categories & All Sub-Pages Selection */}
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <div>
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                            <label className="block font-bold text-slate-800 text-xs sm:text-sm">
                              Permitted Categories, Sub-Pages & Contents:
                            </label>
                            <span className="text-[11px] text-slate-500">
                              {isMasterAllSelected
                                ? 'Full Access Granted to All Pages & Contents'
                                : `${newRole.allowedCategories?.length || 0} items permitted`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Select individual sub-pages, entire categories, or grant unrestricted Full Access.
                          </p>
                        </div>

                        {/* 👑 Master Option: Full Access (All Categories, Sub-Pages & Contents) */}
                        <div
                          className={`p-3 sm:p-4 rounded-2xl border-2 transition flex items-center justify-between gap-3 cursor-pointer ${
                            isMasterAllSelected
                              ? 'bg-amber-50/90 border-[#C59B27] shadow-xs'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => handleToggleMasterAll(!isMasterAllSelected)}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isMasterAllSelected}
                              onChange={(e) => handleToggleMasterAll(e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded text-[#0F294A] focus:ring-amber-500 cursor-pointer"
                            />
                            <div>
                              <div className="font-extrabold text-xs text-[#071B3B] flex items-center gap-2 flex-wrap">
                                <span>Full Access (All Categories, Pages & Contents)</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4B942] text-[#071B3B] font-bold">
                                  ALL ACCESS (*)
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Members with this role can view and access every category, sub-page, and published content across the entire website.
                              </p>
                            </div>
                          </div>
                          <Sparkles className={`w-5 h-5 shrink-0 ${isMasterAllSelected ? 'text-[#C59B27]' : 'text-slate-300'}`} />
                        </div>

                        {/* Toolbar: Search Sub-Pages & Quick Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
                          <div className="relative flex-1 min-w-[200px]">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={rolePermSearch}
                              onChange={(e) => setRolePermSearch(e.target.value)}
                              placeholder="Search sub-pages or categories (e.g. sermons, diary)..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                            <button
                              type="button"
                              onClick={handleSelectAllPages}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={handleClearAllPages}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                            >
                              Clear All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExpandAllCats(true)}
                              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 font-semibold transition cursor-pointer"
                            >
                              Expand All
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExpandAllCats(false)}
                              className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 font-semibold transition cursor-pointer"
                            >
                              Collapse All
                            </button>
                          </div>
                        </div>

                        {/* Categories Accordion with All Sub-Pages Checkboxes */}
                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {filteredPortalStructure.map((cat) => {
                            const isFullySelected = isCategoryFullySelected(cat);
                            const selectedCount = getCategorySelectedCount(cat);
                            const totalCount = cat.pages ? cat.pages.length : 0;
                            const isExpanded = roleExpandedCats[cat.categorySlug] !== false;

                            return (
                              <div
                                key={cat.categorySlug}
                                className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
                              >
                                {/* Category Header Bar */}
                                <div className="p-3 bg-slate-50/90 hover:bg-slate-100 flex items-center justify-between gap-3 select-none">
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isFullySelected}
                                      onChange={(e) => handleToggleCategory(cat, e.target.checked)}
                                      className="w-4 h-4 rounded text-[#0F294A] focus:ring-amber-500 cursor-pointer"
                                    />
                                    <div
                                      className="flex items-center gap-2 flex-1 cursor-pointer truncate"
                                      onClick={() => toggleExpandCategory(cat.categorySlug)}
                                    >
                                      <div className="w-6 h-6 rounded-lg bg-[#0F294A] text-[#F4B942] flex items-center justify-center shrink-0">
                                        <PortalIcon name={cat.iconName} className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="font-extrabold text-xs text-slate-800 truncate">
                                        {cat.titleEn}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        isFullySelected
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : selectedCount > 0
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-slate-200 text-slate-600'
                                      }`}
                                    >
                                      {isFullySelected ? `All (${totalCount})` : `${selectedCount} / ${totalCount}`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandCategory(cat.categorySlug)}
                                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
                                    >
                                      <ChevronDown
                                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      />
                                    </button>
                                  </div>
                                </div>

                                {/* Sub-Pages Grid */}
                                {isExpanded && cat.pages && cat.pages.length > 0 && (
                                  <div className="p-3 bg-white border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {cat.pages.map((p) => {
                                      const isPChecked = isPageSelected(cat, p);
                                      return (
                                        <label
                                          key={p.pageSlug}
                                          className={`flex items-start gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                                            isPChecked
                                              ? 'bg-amber-50/80 border-[#C59B27]/50 text-[#071B3B] font-bold shadow-2xs'
                                              : 'bg-slate-50/60 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isPChecked}
                                            onChange={(e) => handleTogglePage(cat, p, e.target.checked)}
                                            className="mt-0.5 rounded text-[#0F294A] focus:ring-amber-500 cursor-pointer"
                                          />
                                          <div className="min-w-0 flex-1">
                                            <div className="truncate font-semibold flex items-center gap-1.5">
                                              <PortalIcon name={p.iconName} className="w-3 h-3 text-slate-400 shrink-0" />
                                              <span className="truncate">{p.titleEn}</span>
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-mono truncate">
                                              {p.pageSlug}
                                            </div>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Fixed Action Footer */}
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50/80">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddRoleOpen(false);
                          setEditingRoleId(null);
                        }}
                        className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 font-bold text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold uppercase tracking-wider text-xs transition shadow-md cursor-pointer"
                      >
                        {editingRoleId ? 'Update Role' : 'Save Role'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
