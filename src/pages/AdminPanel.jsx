import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

const DEFAULT_ROLES = [
  {
    id: 'admin',
    nameEn: 'Administrator',
    nameTe: 'ప్రధాన అధికారి (Admin)',
    description: 'Full access to all pages, content editing, user approvals, and settings.',
    allowedCategories: ['*'],
  },
  {
    id: 'pastor',
    nameEn: 'Pastor / Minister',
    nameTe: 'కాపరి / సేవకుడు',
    description: 'Access to worship, truth, sermon materials, and family guidance.',
    allowedCategories: ['worship', 'bible-truth', 'family', 'grow', 'program'],
  },
  {
    id: 'worker',
    nameEn: 'Gospel Worker',
    nameTe: 'సువార్త సేవకుడు',
    description: 'Access to gospel activities, outreach, and preaching guides.',
    allowedCategories: ['bible-truth', 'go-come', 'program', 'grow'],
  },
  {
    id: 'member',
    nameEn: 'General Member',
    nameTe: 'సాధారణ సభ్యుడు',
    description: 'Standard access to general assembly announcements and studies.',
    allowedCategories: ['home', 'worship', 'bible-truth', 'family'],
  },
];

export default function AdminPanel() {
  const { currentUser, userProfile } = useAuth();
  const { t, isTelugu } = useLanguage();

  const [activeTab, setActiveTab] = useState('users'); // 'users', 'pages', 'contents', 'photos', 'announcements'
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
  const [newRole, setNewRole] = useState({
    id: '',
    nameEn: '',
    nameTe: '',
    description: '',
    allowedCategories: ['home', 'worship', 'bible-truth'],
  });

  // 3. Pages State
  const [customPagesList, setCustomPagesList] = useState([]);
  const [newPage, setNewPage] = useState({
    categorySlug: 'home',
    customCategoryTitleEn: '',
    customCategoryTitleTe: '',
    titleEn: '',
    titleTe: '',
    pageSlug: '',
    descEn: '',
    descTe: '',
    externalUrl: '',
    iconName: 'FileText',
  });

  // 4. Articles & Contents State
  const [contentsList, setContentsList] = useState([]);
  const [contentCategoryFilter, setContentCategoryFilter] = useState('all');
  const [editingContent, setEditingContent] = useState(null);
  const [isContentFormOpen, setIsContentFormOpen] = useState(false);
  const [newContent, setNewContent] = useState({
    categorySlug: 'worship',
    pageSlug: 'sermons',
    titleEn: '',
    titleTe: '',
    descEn: '',
    descTe: '',
    imageUrl: '',
    videoUrl: '',
    fileUrl: '',
  });

  // 5. Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    titleEn: '',
    titleTe: '',
    descEn: '',
    descTe: '',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Show transient feedback message
  const showFeedback = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

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

  // Fetch Custom Roles
  const fetchRoles = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'roles'));
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

      if (items.length > 0) {
        // Merge with defaults
        const merged = [...DEFAULT_ROLES];
        items.forEach((customR) => {
          if (!merged.find((r) => r.id === customR.id)) {
            merged.push(customR);
          }
        });
        setRolesList(merged);
      } else {
        setRolesList(DEFAULT_ROLES);
      }
    } catch (err) {
      console.warn('Error fetching roles:', err);
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

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchPages();
    fetchContents();
    fetchAnnouncements();
  }, [fetchUsers, fetchRoles, fetchPages, fetchContents, fetchAnnouncements]);

  // ----------------------------------------------------
  // USER APPROVAL & ROLE HANDLERS
  // ----------------------------------------------------
  const handleApproveUser = async (userId, targetRole = 'member') => {
    setUpdatingUserId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'approved',
        role: targetRole,
        approvedAt: serverTimestamp(),
        approvedBy: currentUser?.email || 'admin',
      });
      showFeedback('success', 'User account approved successfully!');
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to approve user: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user registration?')) return;
    setUpdatingUserId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
      });
      showFeedback('success', 'User status set to rejected.');
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to update user: ' + err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp(),
      });
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
    try {
      await deleteDoc(doc(db, 'users', userId));
      showFeedback('success', 'User removed.');
      await fetchUsers();
    } catch (err) {
      showFeedback('error', 'Failed to delete user: ' + err.message);
    }
  };

  // Add New Custom Role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    const roleId = newRole.id.trim().toLowerCase().replace(/\s+/g, '_');
    if (!roleId || !newRole.nameEn.trim()) {
      alert('Please provide a Role ID and English Name.');
      return;
    }

    try {
      const payload = {
        id: roleId,
        nameEn: newRole.nameEn.trim(),
        nameTe: newRole.nameTe.trim() || newRole.nameEn.trim(),
        description: newRole.description.trim(),
        allowedCategories: newRole.allowedCategories,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'roles', roleId), payload);
      showFeedback('success', `Role "${newRole.nameEn}" created successfully!`);
      setIsAddRoleOpen(false);
      setNewRole({
        id: '',
        nameEn: '',
        nameTe: '',
        description: '',
        allowedCategories: ['home', 'worship', 'bible-truth'],
      });
      await fetchRoles();
    } catch (err) {
      showFeedback('error', 'Failed to create role: ' + err.message);
    }
  };

  // ----------------------------------------------------
  // PAGE MANAGEMENT HANDLERS
  // ----------------------------------------------------
  const handleAddPage = async (e) => {
    e.preventDefault();
    if (!newPage.titleEn.trim()) {
      alert('Please provide a page title in English.');
      return;
    }

    setLoading(true);
    try {
      const generatedSlug =
        newPage.pageSlug.trim() ||
        newPage.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload = {
        categorySlug: newPage.categorySlug,
        pageSlug: generatedSlug,
        titleEn: newPage.titleEn.trim(),
        titleTe: newPage.titleTe.trim() || newPage.titleEn.trim(),
        descEn: newPage.descEn.trim(),
        descTe: newPage.descTe.trim() || newPage.descEn.trim(),
        externalUrl: newPage.externalUrl.trim() || null,
        iconName: newPage.iconName.trim() || 'FileText',
        createdAt: serverTimestamp(),
      };

      if (newPage.categorySlug === 'custom') {
        payload.customCategorySlug = newPage.customCategoryTitleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        payload.customCategoryTitleEn = newPage.customCategoryTitleEn.trim();
        payload.customCategoryTitleTe = newPage.customCategoryTitleTe.trim() || newPage.customCategoryTitleEn.trim();
      }

      await addDoc(collection(db, 'portal_pages'), payload);
      showFeedback('success', `Page "${newPage.titleEn}" added to navigation!`);
      setNewPage({
        categorySlug: 'home',
        customCategoryTitleEn: '',
        customCategoryTitleTe: '',
        titleEn: '',
        titleTe: '',
        pageSlug: '',
        descEn: '',
        descTe: '',
        externalUrl: '',
        iconName: 'FileText',
      });
      await fetchPages();
    } catch (err) {
      showFeedback('error', 'Failed to add page: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (!window.confirm('Delete this page from navigation?')) return;
    try {
      await deleteDoc(doc(db, 'portal_pages', pageId));
      showFeedback('success', 'Page deleted from navigation.');
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
    if (!newContent.titleEn.trim() && !newContent.titleTe.trim()) {
      alert('Please provide a title in English or Telugu.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        categorySlug: newContent.categorySlug,
        pageSlug: newContent.pageSlug,
        titleEn: newContent.titleEn.trim(),
        titleTe: newContent.titleTe.trim() || newContent.titleEn.trim(),
        descEn: newContent.descEn.trim(),
        descTe: newContent.descTe.trim() || newContent.descEn.trim(),
        imageUrl: newContent.imageUrl.trim() || null,
        videoUrl: newContent.videoUrl.trim() || null,
        fileUrl: newContent.fileUrl.trim() || null,
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
        titleEn: '',
        titleTe: '',
        descEn: '',
        descTe: '',
        imageUrl: '',
        videoUrl: '',
        fileUrl: '',
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
      titleEn: item.titleEn || item.title || '',
      titleTe: item.titleTe || '',
      descEn: item.descEn || item.desc || item.content || '',
      descTe: item.descTe || '',
      imageUrl: item.imageUrl || '',
      videoUrl: item.videoUrl || '',
      fileUrl: item.fileUrl || '',
    });
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
    if (!newAnnouncement.titleEn.trim() && !newAnnouncement.titleTe.trim()) {
      alert('Please provide a title in English or Telugu.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        titleEn: newAnnouncement.titleEn.trim(),
        titleTe: newAnnouncement.titleTe.trim() || newAnnouncement.titleEn.trim(),
        descEn: newAnnouncement.descEn.trim(),
        descTe: newAnnouncement.descTe.trim() || newAnnouncement.descEn.trim(),
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
        titleEn: '',
        titleTe: '',
        descEn: '',
        descTe: '',
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
  const pendingUsersCount = usersList.filter((u) => u.status === 'pending').length;
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.displayName || '').toLowerCase().includes(userSearchTerm.toLowerCase());

    if (userStatusFilter === 'pending') return matchesSearch && u.status === 'pending';
    if (userStatusFilter === 'approved') return matchesSearch && (u.status === 'approved' || u.role === 'admin');
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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#F4B942] border border-[#F4B942]/40 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrative Central Console</span>
            </div>
            <h1
              className={`text-3xl sm:text-4xl font-extrabold text-white tracking-tight ${
                isTelugu ? 'font-krishna text-4xl' : 'font-serif'
              }`}
            >
              {isTelugu ? 'అడ్మిన్ డాష్‌బోర్డ్' : 'Administration & Governance'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              {isTelugu
                ? 'యూజర్ల ఆమోదం, రోల్స్ కేటాయింపు, పేజీలు, కంటెంట్, ఫోటో గ్యాలరీ మరియు అధికారిక ప్రకటనల పూర్తి నియంత్రణ.'
                : 'Approve new users, assign ministerial roles, manage website navigation, publish rich articles, manage photo galleries, and post announcements.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20"
            >
              <Eye className="w-4 h-4 text-[#F4B942]" />
              <span>{isTelugu ? 'సైట్‌ను చూడండి' : 'View Public Website'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Main Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-[#040E1E] border border-[#132A4A] rounded-2xl p-2 shadow-2xl flex items-center gap-2 overflow-x-auto">
          {/* Tab 1: Users & Approvals */}
          <button
            onClick={() => setActiveTab('users')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'users'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isTelugu ? 'యూజర్లు & ఆమోదం' : 'Users & Approvals'}</span>
            {pendingUsersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] animate-pulse">
                {pendingUsersCount} pending
              </span>
            )}
          </button>

          {/* Tab 2: Pages & Menus */}
          <button
            onClick={() => setActiveTab('pages')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'pages'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>{isTelugu ? 'పేజీలు & మెనూలు' : 'Categories & Pages'}</span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">
              {customPagesList.length}
            </span>
          </button>

          {/* Tab 3: Articles & Contents */}
          <button
            onClick={() => setActiveTab('contents')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'contents'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isTelugu ? 'కంటెంట్ & ఆర్టికల్స్' : 'Articles & Content'}</span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">
              {contentsList.length}
            </span>
          </button>

          {/* Tab 4: Photo Gallery & Banners */}
          <button
            onClick={() => setActiveTab('photos')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'photos'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>{isTelugu ? 'ఫొటోలు & బ్యానర్లు' : 'Photos & Banners'}</span>
          </button>

          {/* Tab 5: Announcements */}
          <button
            onClick={() => setActiveTab('announcements')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'announcements'
                ? 'bg-[#F4B942] text-[#071B3B] shadow-md'
                : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>{isTelugu ? 'ప్రకటనలు' : 'Announcements'}</span>
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">
              {announcements.length}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Feedback Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ======================================================== */}
        {/* TAB 1: USERS & APPROVALS (with Roles & + Add Role)       */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* Top Toolbar: Filters, Search & + Add Role Button */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: `All Users (${usersList.length})` },
                  { id: 'pending', label: `Pending Approvals (${pendingUsersCount})` },
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

                <button
                  onClick={() => setIsAddRoleOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>+ Add New Role</span>
                </button>
              </div>
            </div>

            {/* Custom Roles Manager Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-[#0F294A] flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-[#C59B27]" />
                    <span>Configured Ministerial Roles & Page Permissions</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a role for each user below. Admin role grants full access; other roles see only their permitted categories.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddRoleOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#0F294A] border border-[#C59B27]/40 text-xs font-bold transition"
                >
                  + Add Role
                </button>
              </div>

              {/* Roles Chips */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {rolesList.map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#C59B27]/50 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#0F294A] uppercase tracking-wider">
                        {r.nameEn}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-100 text-[#0F294A] font-bold">
                        {r.id}
                      </span>
                    </div>
                    {r.nameTe && (
                      <div className="text-[11px] font-telugu text-slate-600 mb-1">
                        {r.nameTe}
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 line-clamp-2 mb-2">
                      {r.description || 'Custom ministerial role'}
                    </p>
                    <div className="text-[9px] font-mono text-slate-400">
                      Access: {r.allowedCategories?.includes('*') ? 'ALL PAGES (*)' : r.allowedCategories?.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal: Add New Role */}
            {isAddRoleOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-[#0F294A] flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-[#C59B27]" />
                      <span>Create New Ministerial Role</span>
                    </h3>
                    <button
                      onClick={() => setIsAddRoleOpen(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Role Identifier (slug, e.g. "choir", "deacon", "teacher") *
                      </label>
                      <input
                        type="text"
                        required
                        value={newRole.id}
                        onChange={(e) => setNewRole({ ...newRole, id: e.target.value })}
                        placeholder="e.g. choir"
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Role Title (English) *
                        </label>
                        <input
                          type="text"
                          required
                          value={newRole.nameEn}
                          onChange={(e) => setNewRole({ ...newRole, nameEn: e.target.value })}
                          placeholder="e.g. Choir Ministry"
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 font-telugu">
                          Role Title (Telugu - తెలుగు)
                        </label>
                        <input
                          type="text"
                          value={newRole.nameTe}
                          onChange={(e) => setNewRole({ ...newRole, nameTe: e.target.value })}
                          placeholder="ఉదా: గానబృందం"
                          className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-telugu"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Role Description
                      </label>
                      <textarea
                        rows={2}
                        value={newRole.description}
                        onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                        placeholder="Responsibilities and purpose of this role..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    {/* Permissions: Checkboxes for allowed categories */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-2">
                        Permitted Categories & Pages for this Role:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        {[
                          { id: '*', label: 'Full Access (All)' },
                          { id: 'home', label: 'Welcome' },
                          { id: 'worship', label: 'Worship' },
                          { id: 'bible-truth', label: 'Truth' },
                          { id: 'family', label: 'Family' },
                          { id: 'grow', label: 'Grow' },
                          { id: 'go-come', label: 'Go & Come' },
                          { id: 'program', label: 'Program' },
                          { id: 'more', label: 'More' },
                        ].map((cat) => {
                          const isChecked = newRole.allowedCategories.includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (cat.id === '*') {
                                    setNewRole({
                                      ...newRole,
                                      allowedCategories: e.target.checked ? ['*'] : ['home'],
                                    });
                                  } else {
                                    const next = e.target.checked
                                      ? [...newRole.allowedCategories.filter((x) => x !== '*'), cat.id]
                                      : newRole.allowedCategories.filter((x) => x !== cat.id);
                                    setNewRole({ ...newRole, allowedCategories: next });
                                  }
                                }}
                                className="rounded text-[#0F294A] focus:ring-amber-500"
                              />
                              <span>{cat.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsAddRoleOpen(false)}
                        className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold uppercase tracking-wider"
                      >
                        Save Role
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
                      <th className="py-3 px-6">User / Email</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Ministerial Role</th>
                      <th className="py-3 px-4">Registered On</th>
                      <th className="py-3 px-6 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                          No users found matching current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isUserAdmin = u.role === 'admin' || u.email?.startsWith('surya');
                        const isApproved = isUserAdmin || u.status === 'approved';
                        const isPending = !isApproved && u.status !== 'rejected';
                        const isRejected = u.status === 'rejected';

                        return (
                          <tr key={u.id} className="hover:bg-slate-50 transition">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#0F294A] text-[#F4B942] font-bold flex items-center justify-center shrink-0 text-xs">
                                  {(u.displayName || u.email || 'U')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">
                                    {u.displayName || 'Unnamed User'}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono truncate">
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              {isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Approved</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Approval</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">
                                  <UserX className="w-3 h-3 text-rose-600" />
                                  <span>Rejected</span>
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4">
                              <select
                                value={u.role || 'member'}
                                onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                                disabled={updatingUserId === u.id}
                                className="p-1.5 rounded-lg border border-slate-300 bg-white font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                              >
                                {rolesList.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.nameEn} ({r.id})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-4 px-4 text-[11px] text-slate-500">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isPending ? (
                                  <>
                                    <button
                                      onClick={() => handleApproveUser(u.id, u.role || 'member')}
                                      disabled={updatingUserId === u.id}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                                      title="Approve Account"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectUser(u.id)}
                                      disabled={updatingUserId === u.id}
                                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                                      title="Reject Registration"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleApproveUser(u.id, u.role || 'member')}
                                    disabled={updatingUserId === u.id}
                                    className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 text-[11px] font-semibold"
                                  >
                                    Re-Approve
                                  </button>
                                )}

                                {!isUserAdmin && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                    title="Delete User"
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
        {/* TAB 2: CATEGORIES & PAGES (Custom Sub-Pages Builder)     */}
        {/* ======================================================== */}
        {activeTab === 'pages' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Sub-Page Form */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
              <h2 className="text-base font-bold text-[#0F294A] mb-1 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#C59B27]" />
                <span>Add New Sub-Page to Menu</span>
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Create a new sub-page under any of the 8 main categories. It instantly becomes accessible at /page/:categorySlug/:pageSlug.
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
                    <option value="home">Welcome (స్వాగతం)</option>
                    <option value="worship">Worship (ఆరాధన)</option>
                    <option value="bible-truth">Truth (సత్యం)</option>
                    <option value="family">Family (ఆత్మీయ కుటుంబం)</option>
                    <option value="grow">Grow (ఆత్మీయ ఎదుగుదల)</option>
                    <option value="go-come">Go & Come (సువార్త సేవ & గమ్యం)</option>
                    <option value="program">Program (కార్యక్రమాలు)</option>
                    <option value="more">More (మరిన్ని విభాగాలు)</option>
                    <option value="custom">+ Create Brand New Category</option>
                  </select>
                </div>

                {newPage.categorySlug === 'custom' && (
                  <div className="space-y-3 p-3 rounded-2xl bg-amber-50/70 border border-[#C59B27]/40">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        New Category Name (English) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPage.customCategoryTitleEn}
                        onChange={(e) =>
                          setNewPage({ ...newPage, customCategoryTitleEn: e.target.value })
                        }
                        placeholder="e.g. Fellowship"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 font-telugu">
                        New Category Name (Telugu)
                      </label>
                      <input
                        type="text"
                        value={newPage.customCategoryTitleTe}
                        onChange={(e) =>
                          setNewPage({ ...newPage, customCategoryTitleTe: e.target.value })
                        }
                        placeholder="విభాగం పేరు (తెలుగులో)"
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white font-telugu"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Page Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPage.titleEn}
                    onChange={(e) => setNewPage({ ...newPage, titleEn: e.target.value })}
                    placeholder="e.g. Doctrine Studies"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-telugu">
                    Page Title (Telugu - తెలుగు)
                  </label>
                  <input
                    type="text"
                    value={newPage.titleTe}
                    onChange={(e) => setNewPage({ ...newPage, titleTe: e.target.value })}
                    placeholder="పేజీ శీర్షిక (తెలుగులో)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-telugu"
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
                    placeholder="e.g. doctrine-studies"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
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
                  className="w-full py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold uppercase tracking-wider text-xs shadow-md transition disabled:opacity-50"
                >
                  {loading ? 'Adding Page...' : '+ Publish Page to Menu'}
                </button>
              </form>
            </div>

            {/* Custom Pages List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <h3 className="text-base font-bold text-[#0F294A]">
                    Custom Created Navigation Pages ({customPagesList.length})
                  </h3>
                  <button
                    onClick={fetchPages}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {customPagesList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No custom pages created yet. The default structure is in effect.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customPagesList.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 group hover:border-[#C59B27]/60 transition"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-[#0F294A]">
                            {p.categorySlug}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                            {p.titleEn}
                          </h4>
                          {p.titleTe && (
                            <p className="text-[11px] font-telugu text-slate-600 truncate">
                              {p.titleTe}
                            </p>
                          )}
                          <Link
                            to={`/page/${p.categorySlug}/${p.pageSlug}`}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C59B27] hover:underline mt-2"
                          >
                            <span>Open Page</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>

                        <button
                          onClick={() => handleDeletePage(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
                  <option value="home">Welcome</option>
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
                    titleEn: '',
                    titleTe: '',
                    descEn: '',
                    descTe: '',
                    imageUrl: '',
                    videoUrl: '',
                    fileUrl: '',
                  });
                  setIsContentFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Write New Article</span>
              </button>
            </div>

            {/* In-Place Article Create / Edit Form */}
            {isContentFormOpen && (
              <div className="bg-white rounded-3xl border border-[#C59B27]/50 p-6 sm:p-8 shadow-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <h3 className="text-base font-bold text-[#0F294A] flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-[#C59B27]" />
                    <span>{editingContent ? 'Edit Article' : 'Compose New Article'}</span>
                  </h3>
                  <button
                    onClick={() => { setIsContentFormOpen(false); setEditingContent(null); }}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveContent} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Category Slug *
                      </label>
                      <select
                        value={newContent.categorySlug}
                        onChange={(e) => setNewContent({ ...newContent, categorySlug: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                      >
                        <option value="home">home (Welcome)</option>
                        <option value="worship">worship</option>
                        <option value="bible-truth">bible-truth (Truth)</option>
                        <option value="family">family</option>
                        <option value="grow">grow</option>
                        <option value="go-come">go-come</option>
                        <option value="program">program</option>
                        <option value="more">more</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Page Slug *
                      </label>
                      <input
                        type="text"
                        required
                        value={newContent.pageSlug}
                        onChange={(e) => setNewContent({ ...newContent, pageSlug: e.target.value })}
                        placeholder="e.g. sermons, father, baptism..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Article Title (English) *
                      </label>
                      <input
                        type="text"
                        value={newContent.titleEn}
                        onChange={(e) => setNewContent({ ...newContent, titleEn: e.target.value })}
                        placeholder="Article Headline"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 font-telugu">
                        Article Title (Telugu - తెలుగు)
                      </label>
                      <input
                        type="text"
                        value={newContent.titleTe}
                        onChange={(e) => setNewContent({ ...newContent, titleTe: e.target.value })}
                        placeholder="వార్త లేదా సందేశ శీర్షిక"
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-telugu"
                      />
                    </div>
                  </div>

                  {/* Rich Text Editor: English */}
                  <RichTextEditor
                    label="Article Body Content (English) - Supports Headings, Bold, Lists, Quotes"
                    value={newContent.descEn}
                    onChange={(val) => setNewContent({ ...newContent, descEn: val })}
                    rows={6}
                  />

                  {/* Rich Text Editor: Telugu */}
                  <RichTextEditor
                    label="Article Body Content (Telugu - తెలుగు)"
                    value={newContent.descTe}
                    onChange={(val) => setNewContent({ ...newContent, descTe: val })}
                    isTelugu={true}
                    rows={6}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                      <input
                        type="url"
                        value={newContent.imageUrl}
                        onChange={(e) => setNewContent({ ...newContent, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash..."
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Video URL (YouTube)</label>
                      <input
                        type="url"
                        value={newContent.videoUrl}
                        onChange={(e) => setNewContent({ ...newContent, videoUrl: e.target.value })}
                        placeholder="https://youtube.com/..."
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">File / PDF URL</label>
                      <input
                        type="url"
                        value={newContent.fileUrl}
                        onChange={(e) => setNewContent({ ...newContent, fileUrl: e.target.value })}
                        placeholder="https://drive.google..."
                        className="w-full p-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setIsContentFormOpen(false); setEditingContent(null); }}
                      className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold uppercase tracking-wider shadow-md disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : editingContent ? 'Update Article' : 'Publish Article'}
                    </button>
                  </div>
                </form>
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
                          alt={item.titleEn}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#C59B27] mb-1">
                        <span>{item.categorySlug} / {item.pageSlug}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                        {item.titleEn || item.titleTe}
                      </h4>
                      {item.titleTe && item.titleEn && (
                        <p className="text-xs font-telugu text-slate-600 truncate mt-0.5">
                          {item.titleTe}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                        {item.descEn || item.descTe}
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
                      <button
                        onClick={() => handleEditContentClick(item)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Edit Article"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteContentItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
              <h3 className="text-base font-bold text-[#0F294A] flex items-center gap-2 mb-1">
                <ImageIcon className="w-5 h-5 text-[#C59B27]" />
                <span>Home Page Photos & Visual Showcase</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Photos added here automatically display in the Visual Gallery section on the Welcome page.
              </p>

              <PhotoGalleryManager
                targetPage="home"
                sectionTitleEn="Welcome Page Featured Photos"
                sectionTitleTe="స్వాగత పేజీ విశేష ఛాయాచిత్రాలు"
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
                  <label className="block font-bold text-slate-700 mb-1">Title (English) *</label>
                  <input
                    type="text"
                    value={newAnnouncement.titleEn}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, titleEn: e.target.value })}
                    placeholder="Announcement Title"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-telugu">Title (Telugu)</label>
                  <input
                    type="text"
                    value={newAnnouncement.titleTe}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, titleTe: e.target.value })}
                    placeholder="ప్రకటన శీర్షిక (తెలుగు)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-telugu"
                  />
                </div>

                {/* Rich Description */}
                <RichTextEditor
                  label="Description (English)"
                  value={newAnnouncement.descEn}
                  onChange={(val) => setNewAnnouncement({ ...newAnnouncement, descEn: val })}
                  rows={4}
                />

                <RichTextEditor
                  label="Description (Telugu - తెలుగు)"
                  value={newAnnouncement.descTe}
                  onChange={(val) => setNewAnnouncement({ ...newAnnouncement, descTe: val })}
                  isTelugu={true}
                  rows={4}
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
                          titleEn: '',
                          titleTe: '',
                          descEn: '',
                          descTe: '',
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
                          {a.titleEn || a.titleTe}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {a.descEn || a.descTe}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingAnnouncementId(a.id);
                            setNewAnnouncement({
                              titleEn: a.titleEn || a.title || '',
                              titleTe: a.titleTe || '',
                              descEn: a.descEn || a.desc || '',
                              descTe: a.descTe || '',
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
      </main>
    </div>
  );
}
