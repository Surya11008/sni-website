import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
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
} from 'lucide-react';

export default function AdminPanel() {
  const { currentUser, userProfile } = useAuth();
  const { t, isTelugu } = useLanguage();

  const [activeTab, setActiveTab] = useState('announcements'); // announcements, media, docs, users
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Announcements state
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    titleEn: '',
    titleTe: '',
    descEn: '',
    descTe: '',
    imageUrl: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Media state
  const [mediaList, setMediaList] = useState([]);
  const [newMedia, setNewMedia] = useState({
    titleEn: '',
    titleTe: '',
    videoUrl: '',
    thumbnailUrl: '',
  });

  // Member Docs state
  const [docsList, setDocsList] = useState([]);
  const [newDocItem, setNewDocItem] = useState({
    title: '',
    fileUrl: '',
    category: 'Guidelines',
  });

  // Users state
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);

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

  // Fetch Media
  const fetchMedia = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'media'));
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setMediaList(items);
    } catch (err) {
      console.warn('Error fetching media:', err);
    }
  }, []);

  // Fetch Member Docs
  const fetchMemberDocs = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'member_docs'));
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setDocsList(items);
    } catch (err) {
      console.warn('Error fetching member_docs:', err);
    }
  }, []);

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
        });
      }
      setUsersList(items);
    } catch (err) {
      console.warn('Error fetching users:', err);
    }
  }, [currentUser, userProfile]);

  // Load active tab data
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (ignore) return;
      setLoading(true);
      if (activeTab === 'announcements') await fetchAnnouncements();
      if (activeTab === 'media') await fetchMedia();
      if (activeTab === 'docs') await fetchMemberDocs();
      if (activeTab === 'users') await fetchUsers();
      if (!ignore) setLoading(false);
    }
    load();
    return () => {
      ignore = true;
    };
  }, [activeTab, fetchAnnouncements, fetchMedia, fetchMemberDocs, fetchUsers]);

  // ADD Announcement
  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.titleEn && !newAnnouncement.titleTe) return;
    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        createdAt: new Date().toISOString(),
      });
      setNewAnnouncement({
        titleEn: '',
        titleTe: '',
        descEn: '',
        descTe: '',
        imageUrl: '',
        date: new Date().toISOString().split('T')[0],
      });
      await fetchAnnouncements();
      setStatusMessage({ type: 'success', text: 'Announcement published successfully!' });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Failed to add announcement: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  // DELETE Announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      setStatusMessage({ type: 'success', text: 'Announcement deleted.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // ADD Media
  const handleAddMedia = async (e) => {
    e.preventDefault();
    if (!newMedia.videoUrl) return;
    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      await addDoc(collection(db, 'media'), {
        ...newMedia,
        createdAt: new Date().toISOString(),
      });
      setNewMedia({ titleEn: '', titleTe: '', videoUrl: '', thumbnailUrl: '' });
      await fetchMedia();
      setStatusMessage({ type: 'success', text: 'Media item added successfully!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // DELETE Media
  const handleDeleteMedia = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'media', id));
      setMediaList((prev) => prev.filter((item) => item.id !== id));
      setStatusMessage({ type: 'success', text: 'Media item removed.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // ADD Member Document
  const handleAddDoc = async (e) => {
    e.preventDefault();
    if (!newDocItem.title || !newDocItem.fileUrl) return;
    setLoading(true);
    setStatusMessage({ type: '', text: '' });

    try {
      await addDoc(collection(db, 'member_docs'), {
        ...newDocItem,
        createdAt: new Date().toISOString(),
      });
      setNewDocItem({ title: '', fileUrl: '', category: 'Guidelines' });
      await fetchMemberDocs();
      setStatusMessage({ type: 'success', text: 'Member document saved successfully!' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // DELETE Member Document
  const handleDeleteDoc = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, 'member_docs', id));
      setDocsList((prev) => prev.filter((item) => item.id !== id));
      setStatusMessage({ type: 'success', text: 'Document removed from member resources.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // TOGGLE User Role
  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setUpdatingUserId(userId);
    setStatusMessage({ type: '', text: '' });

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setStatusMessage({
        type: 'success',
        text: `Role successfully updated to ${newRole.toUpperCase()}!`,
      });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-1.5 border border-amber-400/30">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Security Level</span>
                </div>
                <h1
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    isTelugu ? 'font-krishna text-3xl sm:text-4xl' : ''
                  }`}
                >
                  {t('adminTitle')}
                </h1>
                <p className={`text-slate-300 text-xs sm:text-sm mt-1 ${isTelugu ? 'font-telugu' : ''}`}>
                  {t('adminSubtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (activeTab === 'announcements') fetchAnnouncements();
                if (activeTab === 'media') fetchMedia();
                if (activeTab === 'docs') fetchMemberDocs();
                if (activeTab === 'users') fetchUsers();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur border border-white/15 transition self-start sm:self-center cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'announcements'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span className={isTelugu ? 'font-telugu' : ''}>{t('tabAnnouncements')}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px]">
                {announcements.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Video className="w-4 h-4" />
              <span className={isTelugu ? 'font-telugu' : ''}>{t('tabMedia')}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px]">
                {mediaList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'docs'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className={isTelugu ? 'font-telugu' : ''}>{t('tabDocs')}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px]">
                {docsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className={isTelugu ? 'font-telugu' : ''}>{t('tabUsers')}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px]">
                {usersList.length}
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Message Banner */}
        {statusMessage.text && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* TAB 1: ANNOUNCEMENTS MANAGER */}
        {activeTab === 'announcements' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                <span className={isTelugu ? 'font-telugu' : ''}>{t('addNew')}</span>
              </h2>

              <form onSubmit={handleAddAnnouncement} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('titleEn')}</label>
                  <input
                    type="text"
                    required
                    value={newAnnouncement.titleEn}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, titleEn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="General Assembly Convocations"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 font-telugu">{t('titleTe')}</label>
                  <input
                    type="text"
                    value={newAnnouncement.titleTe}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, titleTe: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-telugu"
                    placeholder="సర్వసభ్య సమావేశం వివరాలు"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('descEn')}</label>
                  <textarea
                    rows={3}
                    value={newAnnouncement.descEn}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, descEn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Details about time, location and guidelines..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 font-telugu">{t('descTe')}</label>
                  <textarea
                    rows={3}
                    value={newAnnouncement.descTe}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, descTe: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-telugu"
                    placeholder="సమావేశ సమయము, వేదిక మరియు మార్గదర్శకాలు..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('dateLabel')}</label>
                  <input
                    type="date"
                    required
                    value={newAnnouncement.date}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('imageUrl')}</label>
                  <input
                    type="url"
                    value={newAnnouncement.imageUrl}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className={isTelugu ? 'font-telugu' : ''}>{t('publishBtn')}</span>
                </button>
              </form>
            </div>

            {/* List Table */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Active Firestore Announcements ({announcements.length})
              </h2>

              <div className="space-y-3">
                {announcements.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-4 hover:bg-slate-100/60 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                          {item.date}
                        </span>
                        {item.imageUrl && (
                          <span className="text-[10px] text-slate-500 font-medium">[Image attached]</span>
                        )}
                      </div>
                      <div className="font-bold text-sm text-slate-900">
                        {item.titleEn || item.titleTe}
                      </div>
                      {item.titleTe && item.titleTe !== item.titleEn && (
                        <div className="text-xs text-slate-600 font-telugu mt-0.5">
                          {item.titleTe}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {item.descEn || item.descTe}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(item.id)}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 transition shrink-0 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA MANAGER */}
        {activeTab === 'media' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Media Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                <span className={isTelugu ? 'font-telugu' : ''}>{t('addNew')}</span>
              </h2>

              <form onSubmit={handleAddMedia} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('titleEn')}</label>
                  <input
                    type="text"
                    required
                    value={newMedia.titleEn}
                    onChange={(e) => setNewMedia({ ...newMedia, titleEn: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none"
                    placeholder="Sermon: The Mystery of Heaven"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 font-telugu">{t('titleTe')}</label>
                  <input
                    type="text"
                    value={newMedia.titleTe}
                    onChange={(e) => setNewMedia({ ...newMedia, titleTe: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-telugu"
                    placeholder="పరలోక రాజ్య మర్మము"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('videoUrl')}</label>
                  <input
                    type="url"
                    required
                    value={newMedia.videoUrl}
                    onChange={(e) => setNewMedia({ ...newMedia, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('thumbnailUrl')}</label>
                  <input
                    type="url"
                    value={newMedia.thumbnailUrl}
                    onChange={(e) => setNewMedia({ ...newMedia, thumbnailUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className={isTelugu ? 'font-telugu' : ''}>{t('publishBtn')}</span>
                </button>
              </form>
            </div>

            {/* Media List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Active Media Broadcasts ({mediaList.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900">{item.titleEn}</div>
                      {item.titleTe && (
                        <div className="text-xs text-slate-600 font-telugu mt-0.5">{item.titleTe}</div>
                      )}
                      <code className="block text-[10px] text-slate-500 font-mono truncate mt-2">
                        {item.videoUrl}
                      </code>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <a
                        href={item.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        Preview Video
                      </a>
                      <button
                        onClick={() => handleDeleteMedia(item.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEMBER DOCS MANAGER */}
        {activeTab === 'docs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Doc Form */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span className={isTelugu ? 'font-telugu' : ''}>{t('addNew')}</span>
              </h2>

              <form onSubmit={handleAddDoc} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('docTitle')}</label>
                  <input
                    type="text"
                    required
                    value={newDocItem.title}
                    onChange={(e) => setNewDocItem({ ...newDocItem, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    placeholder="e.g. 2026 Feast Observance Schedule"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('category')}</label>
                  <select
                    value={newDocItem.category}
                    onChange={(e) => setNewDocItem({ ...newDocItem, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Guidelines">Guidelines</option>
                    <option value="Doctrine Study">Doctrine Study</option>
                    <option value="Schedules">Schedules</option>
                    <option value="Circulars">Circulars</option>
                    <option value="Administrative">Administrative</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('fileUrl')}</label>
                  <input
                    type="url"
                    required
                    value={newDocItem.fileUrl}
                    onChange={(e) => setNewDocItem({ ...newDocItem, fileUrl: e.target.value })}
                    placeholder="https://drive.google.com/... or https://..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className={isTelugu ? 'font-telugu' : ''}>{t('publishBtn')}</span>
                </button>
              </form>
            </div>

            {/* Docs List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
              <h2 className="text-base font-bold text-slate-900 mb-4">
                Member Documents in Firestore ({docsList.length})
              </h2>

              <div className="space-y-3">
                {docsList.map((docItem) => (
                  <div
                    key={docItem.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {docItem.category || 'Guidelines'}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-slate-900">{docItem.title}</div>
                      <code className="text-[11px] text-slate-500 font-mono truncate block max-w-md">
                        {docItem.fileUrl}
                      </code>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={docItem.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100"
                      >
                        Open
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(docItem.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USERS ROLES MANAGER */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>Personnel Roles Directory ({usersList.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Promote or demote member privileges in Firestore <code className="bg-slate-100 px-1 py-0.5 rounded">users</code> collection.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">UID</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isUserAdmin = user.role === 'admin';
                    const isSelf = user.uid === currentUser?.uid;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {user.displayName || 'No name'}
                          {isSelf && <span className="ml-1 text-[10px] text-slate-400">(You)</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{user.email || '—'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 uppercase tracking-wide font-bold text-[10px] px-2.5 py-1 rounded-full ${
                              isUserAdmin
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {isUserAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {user.role || 'member'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-[11px] font-mono text-slate-500 bg-slate-50 px-1 py-0.5 rounded">
                            {user.uid ? user.uid.substring(0, 10) + '...' : user.id}
                          </code>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleUserRole(user.id, user.role)}
                            disabled={updatingUserId === user.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                              isUserAdmin
                                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                                : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            {updatingUserId === user.id
                              ? 'Saving...'
                              : isUserAdmin
                              ? t('demoteBtn')
                              : t('promoteBtn')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
