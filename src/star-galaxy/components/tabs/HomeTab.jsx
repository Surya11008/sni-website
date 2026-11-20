import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Send,
  Trash2,
  Pencil,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Archive,
  RotateCcw,
  History,
  X,
  Clock,
} from 'lucide-react';
import EmojiReactionPicker from '../common/EmojiReactionPicker';
import MultiMediaDisplay from '../common/MultiMediaDisplay';
import MultiMediaUploader from '../common/MultiMediaUploader';
import LinkifiedText from '../common/LinkifiedText';

export default function HomeTab() {
  const {
    data,
    currentUser,
    addEncouragementMessage,
    deleteEncouragementMessage,
    addAdminNotice,
    updateAdminNotice,
    deleteAdminNotice,
    toggleNoticeReaction,
    markAllNoticesAsViewed,
    t,
  } = useApp();

  const [messageInput, setMessageInput] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Dedicated Notice Page state (like Activity Tab)
  const [isNoticesOpen, setIsNoticesOpen] = useState(false);
  const [activeNoticeFilter, setActiveNoticeFilter] = useState('active'); // 'active' | 'archived'

  // Notice modal state for Admin
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState('normal'); // 'urgent' | 'medium' | 'normal'
  const [noticeMediaItems, setNoticeMediaItems] = useState([]);

  const encouragementList = data.encouragementMessages || [];
  const noticeList = data.adminNotices || [];

  const getMessageTime = (msg) => {
    if (!msg) return 0;
    if (typeof msg.timestamp === 'number') return msg.timestamp;
    if (msg.timestamp?.seconds) return msg.timestamp.seconds * 1000;
    if (msg.createdAtIso) {
      const t = new Date(msg.createdAtIso).getTime();
      if (!isNaN(t)) return t;
    }
    if (typeof msg.id === 'string' && msg.id.startsWith('enc-')) {
      const num = parseInt(msg.id.replace('enc-', ''), 10);
      if (!isNaN(num) && num > 1600000000000) return num;
    }
    if (msg.createdAt) {
      const t = new Date(msg.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Active messages posted within 24 hours
  const activeEncouragementList = useMemo(() => {
    return encouragementList.filter(msg => {
      const t = getMessageTime(msg);
      return (now - t) <= TWENTY_FOUR_HOURS_MS;
    });
  }, [encouragementList]);

  // History messages older than 24 hours
  const historyEncouragementList = useMemo(() => {
    return encouragementList
      .filter(msg => {
        const t = getMessageTime(msg);
        return (now - t) > TWENTY_FOUR_HOURS_MS;
      })
      .sort((a, b) => getMessageTime(b) - getMessageTime(a));
  }, [encouragementList]);

  const getNoticeSortTime = (n) => {
    if (!n) return 0;
    if (typeof n.timestamp === 'number') return n.timestamp;
    if (n.timestamp?.seconds) return n.timestamp.seconds * 1000;
    if (typeof n.timestamp === 'string') {
      const t = new Date(n.timestamp).getTime();
      if (!isNaN(t)) return t;
    }
    if (n.createdAt) {
      const t = new Date(n.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (typeof n.id === 'string' && n.id.startsWith('ntc-')) {
      const num = parseInt(n.id.replace('ntc-', ''), 10);
      if (!isNaN(num) && num > 1600000000000) return num;
    }
    if (n.date) {
      const t = new Date(n.date).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  // Filtered and sorted notices (Newest first)
  const displayedNotices = useMemo(() => {
    return [...noticeList]
      .filter(n => {
        const isArchived = Boolean(n.isArchived);
        if (currentUser?.role === 'admin') {
          return activeNoticeFilter === 'archived' ? isArchived : !isArchived;
        }
        return !isArchived;
      })
      .sort((a, b) => getNoticeSortTime(b) - getNoticeSortTime(a));
  }, [noticeList, currentUser?.role, activeNoticeFilter]);

  const activeNoticeCount = useMemo(() => {
    return noticeList.filter(n => !n.isArchived).length;
  }, [noticeList]);

  const archivedNoticeCount = useMemo(() => {
    return noticeList.filter(n => Boolean(n.isArchived)).length;
  }, [noticeList]);

  // Mark notices viewed when viewing notices page
  useEffect(() => {
    if (isNoticesOpen && noticeList.length > 0) {
      markAllNoticesAsViewed();
    }
  }, [isNoticesOpen, noticeList.length]);

  // Smooth Auto-slide for active encouragement messages (within 24 hours)
  useEffect(() => {
    if (activeEncouragementList.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % activeEncouragementList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeEncouragementList.length]);

  useEffect(() => {
    if (activeSlide >= activeEncouragementList.length && activeEncouragementList.length > 0) {
      setActiveSlide(0);
    }
  }, [activeEncouragementList.length, activeSlide]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    addEncouragementMessage(messageInput.trim());
    setMessageInput('');
  };

  const handleStartEditNotice = (notice) => {
    const id = notice.id || notice._id || notice.date;
    setEditingNoticeId(id);
    setNoticeTitle(notice.title || '');
    setNoticeContent(notice.content || '');
    setNoticePriority(notice.priority || 'normal');
    setNoticeMediaItems(
      notice.mediaItems && notice.mediaItems.length > 0
        ? notice.mediaItems
        : (notice.mediaUrl ? [{ url: notice.mediaUrl, type: notice.mediaType || 'image' }] : [])
    );
    setShowNoticeModal(true);
  };

  const handleSaveNotice = (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    if (editingNoticeId) {
      const original = noticeList.find(n => (n.id || n._id || n.date) === editingNoticeId) || {};
      updateAdminNotice({
        ...original,
        id: editingNoticeId,
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        priority: noticePriority,
        mediaItems: noticeMediaItems,
        mediaUrl: noticeMediaItems[0]?.url || null,
        mediaType: noticeMediaItems[0]?.type || null,
      });
    } else {
      addAdminNotice(
        noticeTitle.trim(),
        noticeContent.trim(),
        noticePriority,
        noticeMediaItems[0]?.url || null,
        noticeMediaItems[0]?.type || null,
        noticeMediaItems
      );
    }

    setEditingNoticeId(null);
    setNoticeTitle('');
    setNoticeContent('');
    setNoticePriority('normal');
    setNoticeMediaItems([]);
    setShowNoticeModal(false);
  };

  const handleToggleArchiveNotice = (notice) => {
    if (currentUser?.role !== 'admin') return;
    const targetId = notice.id || notice._id || notice.date;
    const newArchived = !notice.isArchived;
    updateAdminNotice({
      ...notice,
      id: targetId,
      isArchived: newArchived,
    });
  };

  // 📖 DEDICATED FULL-PAGE VIEW FOR NOTICES (LIKE ACTIVITY TAB)
  if (isNoticesOpen) {
    return (
      <div className="space-y-4 pb-20 pt-1 animate-in fade-in duration-300">
        {/* Top Header with Back Navigation and Title */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 rounded-3xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsNoticesOpen(false)}
              className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-wide">
                  📢 {t('notice') || 'Notice'}
                </h2>
                <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                  {activeNoticeCount}
                </span>
              </div>
              <p className="text-xs text-sky-100 font-bold mt-0.5">
                Important Zion Announcements & Updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setEditingNoticeId(null);
                  setNoticeTitle('');
                  setNoticeContent('');
                  setNoticePriority('normal');
                  setNoticeMediaItems([]);
                  setShowNoticeModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-sky-700 hover:bg-sky-50 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('addNotice') || 'Add Notice'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Archive Filter Tabs (Admin Only) */}
        {currentUser?.role === 'admin' && (
          <div className="flex items-center justify-between bg-white rounded-2xl p-2 border border-sky-200 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveNoticeFilter('active')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeNoticeFilter === 'active'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Active ({activeNoticeCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveNoticeFilter('archived')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                  activeNoticeFilter === 'archived'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                Archived ({archivedNoticeCount})
              </button>
            </div>
            <span className="text-[11px] font-bold text-slate-400 pr-2">
              Admin View
            </span>
          </div>
        )}

        {/* Notices Cards Feed (Newest at top) */}
        {displayedNotices.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold text-slate-500 bg-white rounded-3xl border-2 border-dashed border-sky-300 p-6">
            <Bell className="w-12 h-12 text-sky-200 mx-auto mb-2" />
            <p className="text-sm font-black text-slate-700">
              {activeNoticeFilter === 'archived' ? 'No archived notices found.' : (t('noNotices') || 'No notices posted yet.')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedNotices.map(notice => {
              const nId = notice.id || notice._id || notice.date;
              const isUrgent = notice.priority === 'urgent' || notice.priority === 'high';
              const isImportant = notice.priority === 'medium';
              const isArchived = Boolean(notice.isArchived);

              return (
                <div
                  key={nId}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border-2 shadow-xs transition-all ${
                    isArchived
                      ? 'border-amber-300 bg-amber-50/20 opacity-90'
                      : isUrgent
                      ? 'border-red-400 bg-red-50/20'
                      : isImportant
                      ? 'border-amber-400 bg-amber-50/20'
                      : 'border-sky-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isArchived && (
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                          Archived
                        </span>
                      )}
                      {isUrgent && (
                        <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                          {t('priorityUrgent') || 'Urgent 🚨'}
                        </span>
                      )}
                      {isImportant && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                          {t('priorityMedium') || 'Important ⚠️'}
                        </span>
                      )}
                      <h3 className="text-sm sm:text-base font-black text-slate-900">
                        <LinkifiedText text={notice.title} />
                      </h3>
                    </div>

                    {currentUser?.role === 'admin' && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleArchiveNotice(notice)}
                          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                            isArchived
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                              : 'hover:bg-amber-50 text-amber-600'
                          }`}
                          title={isArchived ? 'Unarchive (Restore to members)' : 'Archive (Hide from members)'}
                        >
                          {isArchived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditNotice(notice)}
                          className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Notice (Admin)"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAdminNotice(nId)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <LinkifiedText
                    as="p"
                    text={notice.content}
                    className="text-xs sm:text-sm text-slate-800 leading-relaxed mt-2.5 font-semibold whitespace-pre-wrap"
                  />

                  {/* Attached Multi-Media */}
                  {(notice.mediaItems?.length > 0 || notice.mediaUrl) && (
                    <div className="mt-3.5">
                      <MultiMediaDisplay
                        mediaItems={notice.mediaItems}
                        singleUrl={notice.mediaUrl}
                        singleType={notice.mediaType}
                        title={notice.title}
                      />
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 font-bold mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span>{t('postedOn') || 'Posted on'}: {notice.date}</span>
                  </div>

                  {/* Unified Emoji Reaction Picker */}
                  <EmojiReactionPicker
                    reactions={notice.reactions}
                    onReact={(emoji) => toggleNoticeReaction(nId, emoji)}
                    currentUser={currentUser}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: ADD / EDIT NOTICE */}
        {showNoticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-sky-300 max-h-[90vh] overflow-y-auto">
              <h3 className="text-base sm:text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <Bell className="w-5 h-5" />
                </div>
                <span>{editingNoticeId ? 'Edit Notice' : (t('addNotice') || 'Add Notice')}</span>
              </h3>

              <form onSubmit={handleSaveNotice} className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="Notice headline..."
                    className="w-full px-4 py-2.5 text-xs border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Content *</label>
                  <textarea
                    required
                    rows={3}
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    placeholder="Announcement details..."
                    className="w-full px-4 py-2.5 text-xs border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'urgent', label: t('priorityUrgent') || 'Urgent 🚨', color: 'bg-red-600 text-white' },
                      { id: 'medium', label: t('priorityMedium') || 'Important ⚠️', color: 'bg-amber-500 text-white' },
                      { id: 'normal', label: t('priorityNormal') || 'General ℹ️', color: 'bg-sky-600 text-white' },
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNoticePriority(p.id)}
                        className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                          noticePriority === p.id ? `${p.color} shadow-sm scale-102` : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <MultiMediaUploader
                    mediaItems={noticeMediaItems}
                    setMediaItems={setNoticeMediaItems}
                    onChange={setNoticeMediaItems}
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNoticeModal(false);
                      setEditingNoticeId(null);
                      setNoticeTitle('');
                      setNoticeContent('');
                      setNoticeMediaItems([]);
                    }}
                    className="flex-1 py-3 text-xs font-bold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs font-black bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {editingNoticeId ? 'Save Changes' : 'Publish Notice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 🏡 MAIN HOME TAB VIEW
  const latestNotice = displayedNotices[0];

  return (
    <div className="space-y-5 pb-20 pt-1 animate-in fade-in duration-300">
      {/* 1. 🌟 TOP: ENCOURAGEMENT MESSAGES (WITH 24H AUTO-EXPIRY TO HISTORY & NEW ROYAL VIOLET THEME) */}
      <section className="bg-gradient-to-r from-violet-200/70 via-purple-100/80 to-indigo-200/70 rounded-3xl p-4 sm:p-5 border-2 border-violet-300 shadow-sm overflow-hidden">
        {/* Top Header Row with Title and Small History Button */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-violet-200/80">
          <div className="flex items-center gap-1.5 text-xs font-black text-violet-950 uppercase tracking-wide">
            <span>🕊️ Encouragement</span>
            {activeEncouragementList.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600 text-white font-black shadow-2xs">
                {activeEncouragementList.length} Active (24h)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-violet-800 hover:text-violet-950 border border-violet-300 text-[11px] font-black flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="View Encouragement History (Messages older than 24h)"
          >
            <History className="w-3.5 h-3.5 text-violet-600" />
            <span>History ({historyEncouragementList.length})</span>
          </button>
        </div>

        {activeEncouragementList.length > 0 ? (
          <div className="relative overflow-hidden rounded-2xl bg-white/95 border-2 border-violet-200 shadow-xs">
            <div
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {activeEncouragementList.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className="w-full shrink-0 p-4 sm:p-5 min-h-[96px] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 italic leading-relaxed">
                      "<LinkifiedText text={msg.text} />"
                    </p>
                    {currentUser?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => deleteEncouragementMessage(msg.id)}
                        title="Admin Delete"
                        className="text-red-400 hover:text-red-600 p-1 shrink-0 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 font-bold">
                    <span className="text-violet-900 font-black">~ {msg.senderName}</span>
                    <span className="text-slate-400">{msg.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>

            {activeEncouragementList.length > 1 && (
              <div className="px-4 py-2 bg-gradient-to-r from-violet-100/90 to-purple-100/90 border-t border-violet-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {activeEncouragementList.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeSlide === i ? 'w-7 bg-violet-600' : 'w-2 bg-violet-300 hover:bg-violet-400'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveSlide(prev => (prev - 1 + activeEncouragementList.length) % activeEncouragementList.length)}
                    className="p-1.5 rounded-full bg-white text-slate-700 hover:bg-violet-200 border border-violet-300 transition-colors shadow-2xs cursor-pointer"
                    aria-label="Previous message"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSlide(prev => (prev + 1) % activeEncouragementList.length)}
                    className="p-1.5 rounded-full bg-white text-slate-700 hover:bg-violet-200 border border-violet-300 transition-colors shadow-2xs cursor-pointer"
                    aria-label="Next message"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-5 text-xs text-violet-900 font-bold italic bg-white/80 rounded-2xl border-2 border-dashed border-violet-300 px-3">
            <p>No new messages in the last 24 hours. Be the first to share an encouraging word!</p>
            {historyEncouragementList.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHistoryModal(true)}
                className="mt-2 inline-flex items-center gap-1 text-violet-700 hover:text-violet-950 font-black text-[11px] underline cursor-pointer"
              >
                <History className="w-3 h-3" />
                <span>View {historyEncouragementList.length} past messages in History</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="mt-3.5 flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={t('sharePlaceholder') || 'Share an encouraging message with brethren...'}
            className="flex-1 bg-white border-2 border-violet-300 rounded-2xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold placeholder-slate-400 shadow-2xs"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('send') || 'Send'}</span>
          </button>
        </form>
      </section>

      {/* 📜 MODAL: ENCOURAGEMENT HISTORY (Messages older than 24h) */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-violet-300 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-violet-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Encouragement History
                  </h3>
                  <span className="text-[11px] font-bold text-violet-700">
                    {historyEncouragementList.length} Past Messages (Older than 24 hours)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 my-2">
              {historyEncouragementList.length === 0 ? (
                <div className="text-center py-10 text-xs font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No past messages yet. Messages older than 24 hours will automatically be archived here.
                </div>
              ) : (
                historyEncouragementList.map((msg, idx) => (
                  <div
                    key={msg.id || idx}
                    className="p-3.5 bg-violet-50/50 hover:bg-violet-50 rounded-2xl border border-violet-200/80 transition-all text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-800 italic leading-relaxed">
                        "<LinkifiedText text={msg.text} />"
                      </p>
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => deleteEncouragementMessage(msg.id)}
                          title="Admin Delete"
                          className="text-red-400 hover:text-red-600 p-1 shrink-0 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-2 pt-1.5 border-t border-violet-100">
                      <span className="text-violet-900 font-black">~ {msg.senderName}</span>
                      <span>{msg.createdAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 📢 NOTICES ENTRY CARD (OPENS PAGE LIKE ACTIVITY TAB) */}
      <section
        onClick={() => setIsNoticesOpen(true)}
        className="bg-gradient-to-br from-sky-100/95 via-blue-50/80 to-indigo-100/95 rounded-3xl p-5 border-2 border-sky-300 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group active:scale-98"
      >
        <div className="flex items-center justify-between pb-3 border-b-2 border-sky-200/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md group-hover:scale-105 transition-transform">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-wide uppercase">
                  {t('notice') || 'Notice'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-600 text-white text-xs font-black shadow-2xs">
                  {activeNoticeCount}
                </span>
              </div>
              <p className="text-[11px] font-bold text-sky-800">
                Click to open dedicated Notices Page
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-black text-sky-700 group-hover:text-sky-900 transition-colors">
            <span>Open</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Latest Notice Preview Snippet */}
        {latestNotice ? (
          <div className="mt-3.5 bg-white/90 rounded-2xl p-3.5 border border-sky-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              {latestNotice.priority === 'urgent' && (
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-black uppercase">
                  Urgent 🚨
                </span>
              )}
              {latestNotice.priority === 'medium' && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase">
                  Important ⚠️
                </span>
              )}
              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                {latestNotice.title}
              </h4>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2 mt-1 font-semibold">
              {latestNotice.content}
            </p>
            <div className="text-[10px] text-slate-400 font-bold mt-2 pt-1 border-t border-slate-100 flex items-center justify-between">
              <span>Latest • {latestNotice.date}</span>
              <span className="text-sky-600 font-black">View all notices →</span>
            </div>
          </div>
        ) : (
          <p className="text-xs font-bold text-slate-500 mt-3 italic text-center py-2">
            {t('noNotices') || 'No notices posted yet.'}
          </p>
        )}
      </section>
    </div>
  );
}