import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Smile,
  PlusCircle,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import EmojiReactionPicker from '../common/EmojiReactionPicker';
import MultiMediaDisplay from '../common/MultiMediaDisplay';
import MultiMediaUploader from '../common/MultiMediaUploader';
import LinkifiedText from '../common/LinkifiedText';
import { formatDate, formatTimeOnly } from '../../utils/dateUtils';

export default function ChildrenMediaManager({ onBack }) {
  const {
    data,
    currentUser,
    addChildrenMedia,
    updateChildrenMedia,
    deleteChildrenMedia,
    toggleChildrenMediaReaction,
    t,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('active'); // 'active' | 'archived'
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal'); // 'urgent' | 'medium' | 'normal'
  const [mediaItems, setMediaItems] = useState([]);

  // Realization comment inputs per media item: { [mediaId]: string }
  const [realizationInputs, setRealizationInputs] = useState({});
  const [expandedRealizations, setExpandedRealizations] = useState({});

  const childrenList = data.childrenMedia || [];

  const getMediaSortTime = (item) => {
    if (!item) return 0;
    if (typeof item.timestamp === 'number') return item.timestamp;
    if (item.timestamp?.seconds) return item.timestamp.seconds * 1000;
    if (typeof item.timestamp === 'string') {
      const t = new Date(item.timestamp).getTime();
      if (!isNaN(t)) return t;
    }
    if (item.createdAt) {
      const t = new Date(item.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (typeof item.id === 'string' && item.id.startsWith('chm-')) {
      const num = parseInt(item.id.replace('chm-', ''), 10);
      if (!isNaN(num) && num > 1600000000000) return num;
    }
    if (item.date) {
      const t = new Date(item.date).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  // Filtered and sorted: Newest at top, oldest at bottom
  const displayedMedia = useMemo(() => {
    return [...childrenList]
      .filter(item => {
        const isArchived = Boolean(item.isArchived);
        if (currentUser?.role === 'admin') {
          return activeFilter === 'archived' ? isArchived : !isArchived;
        }
        // Members only see non-archived items
        return !isArchived;
      })
      .sort((a, b) => getMediaSortTime(b) - getMediaSortTime(a));
  }, [childrenList, currentUser?.role, activeFilter]);

  const activeCount = useMemo(() => {
    return childrenList.filter(item => !item.isArchived).length;
  }, [childrenList]);

  const archivedCount = useMemo(() => {
    return childrenList.filter(item => Boolean(item.isArchived)).length;
  }, [childrenList]);

  const handleStartEdit = (item) => {
    const id = item.id || item._id;
    setEditingId(id);
    setTitle(item.title || '');
    setDescription(item.description || '');
    setPriority(item.priority || 'normal');
    setMediaItems(
      item.mediaItems && item.mediaItems.length > 0
        ? item.mediaItems
        : (item.url ? [{ url: item.url, type: item.type || 'image' }] : [])
    );
    setShowModal(true);
  };

  const handleSaveMedia = (e) => {
    e.preventDefault();
    if (mediaItems.length === 0) {
      alert('Please add at least one photo, video, or link.');
      return;
    }

    const payload = {
      title: title.trim() || 'Children Activity',
      description: description.trim(),
      priority,
      url: mediaItems[0]?.url || '',
      type: mediaItems[0]?.type || 'image',
      mediaItems,
    };

    if (editingId) {
      const original = childrenList.find(g => (g.id || g._id) === editingId) || {};
      updateChildrenMedia({
        ...original,
        id: editingId,
        ...payload,
      });
    } else {
      addChildrenMedia(payload);
    }

    setEditingId(null);
    setTitle('');
    setDescription('');
    setPriority('normal');
    setMediaItems([]);
    setShowModal(false);
  };

  const handleToggleArchive = (item) => {
    if (currentUser?.role !== 'admin') return;
    const targetId = item.id || item._id;
    const newArchivedStatus = !item.isArchived;
    updateChildrenMedia({
      ...item,
      id: targetId,
      isArchived: newArchivedStatus,
    });
  };

  const handleAddRealization = (item) => {
    const mediaId = item.id || item._id;
    const text = (realizationInputs[mediaId] || '').trim();
    if (!text) return;

    const newRealization = {
      id: 'rz-' + Date.now(),
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.nickname || currentUser?.name || 'Member',
      userRole: currentUser?.role || 'member',
      text,
      createdAt: new Date().toISOString(),
      date: formatDate(new Date()),
      time: formatTimeOnly(new Date()),
    };

    const existingRealizations = Array.isArray(item.realizations) ? item.realizations : [];
    const updatedRealizations = [...existingRealizations, newRealization];

    updateChildrenMedia({
      ...item,
      id: mediaId,
      realizations: updatedRealizations,
    });

    setRealizationInputs(prev => ({ ...prev, [mediaId]: '' }));
    setExpandedRealizations(prev => ({ ...prev, [mediaId]: true }));
  };

  const handleDeleteRealization = (item, realizationId) => {
    const mediaId = item.id || item._id;
    const existing = Array.isArray(item.realizations) ? item.realizations : [];
    const updated = existing.filter(r => r.id !== realizationId);
    updateChildrenMedia({
      ...item,
      id: mediaId,
      realizations: updated,
    });
  };

  return (
    <div className="space-y-4 pb-20 pt-1 animate-in fade-in duration-300">
      {/* Top Header with Back Navigation and Title */}
      <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 rounded-3xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-xs transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Back to More"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-xl font-black tracking-wide">
                👶 Children
              </h2>
              <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                {activeCount}
              </span>
            </div>
            <p className="text-xs text-teal-100 font-bold mt-0.5">
              Children Fellowship Photos, Bible Lessons & Takeaways
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setTitle('');
                setDescription('');
                setPriority('normal');
                setMediaItems([]);
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-teal-700 hover:bg-teal-50 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Children Media</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Archive Filter Tabs (Admin Only) */}
      {currentUser?.role === 'admin' && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-2 border border-teal-200 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeFilter === 'active'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('archived')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'archived'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              Archived ({archivedCount})
            </button>
          </div>
          <span className="text-[11px] font-bold text-slate-400 pr-2">
            Admin View
          </span>
        </div>
      )}

      {/* Children Media Cards Feed (Newest at top) */}
      {displayedMedia.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-teal-200 p-6">
          <div className="w-16 h-16 rounded-3xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Smile className="w-8 h-8" />
          </div>
          <p className="text-sm font-black text-slate-700">
            {activeFilter === 'archived' ? 'No archived children media found.' : 'No children media added yet.'}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-1">
            {currentUser?.role === 'admin'
              ? 'Click "+ Add Children Media" above to upload photos, videos, or songs.'
              : 'Children fellowship photos and videos will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedMedia.map(item => {
            const mId = item.id || item._id;
            const isUrgent = item.priority === 'urgent' || item.priority === 'high';
            const isFeatured = item.priority === 'medium';
            const isArchived = Boolean(item.isArchived);
            const realizations = Array.isArray(item.realizations) ? item.realizations : [];
            const isExpanded = Boolean(expandedRealizations[mId]);

            return (
              <div
                key={mId}
                className={`bg-white rounded-3xl p-4 sm:p-5 border-2 shadow-xs transition-all ${
                  isArchived
                    ? 'border-amber-300 bg-amber-50/20 opacity-90'
                    : isUrgent
                    ? 'border-red-400 bg-red-50/10'
                    : isFeatured
                    ? 'border-teal-400 bg-teal-50/10'
                    : 'border-teal-200'
                }`}
              >
                {/* Header: Title, Tags & Admin Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isArchived && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        Archived
                      </span>
                    )}
                    {isUrgent && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        Urgent 🚨
                      </span>
                    )}
                    {isFeatured && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        Featured ⭐
                      </span>
                    )}
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      <LinkifiedText text={item.title || 'Children Activity'} />
                    </h3>
                  </div>

                  {currentUser?.role === 'admin' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(item)}
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
                        onClick={() => handleStartEdit(item)}
                        className="text-teal-600 hover:text-teal-800 p-1.5 rounded-xl hover:bg-teal-50 transition-colors cursor-pointer"
                        title="Edit Media"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this children media permanently?')) {
                            deleteChildrenMedia(mId);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Media"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                {item.description && (
                  <LinkifiedText
                    as="p"
                    text={item.description}
                    className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed mt-2 whitespace-pre-wrap"
                  />
                )}

                {/* Multi-Media Display */}
                {(item.mediaItems?.length > 0 || item.url) && (
                  <div className="mt-3.5">
                    <MultiMediaDisplay
                      mediaItems={item.mediaItems}
                      singleUrl={item.url}
                      singleType={item.type}
                      title={item.title}
                    />
                  </div>
                )}

                <div className="text-[11px] text-slate-400 font-bold mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span>{item.date || 'Children Fellowship'}</span>
                  <span>{item.mediaItems?.length || 1} Media Files</span>
                </div>

                {/* Unified Emoji Reaction Picker */}
                <div className="mt-1">
                  <EmojiReactionPicker
                    reactions={item.reactions}
                    onReact={(emoji) => toggleChildrenMediaReaction(mId, emoji)}
                    currentUser={currentUser}
                  />
                </div>

                {/* 📝 Realization / Notes Section */}
                <div className="mt-3.5 pt-3 border-t-2 border-dashed border-teal-100">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedRealizations(prev => ({ ...prev, [mId]: !prev[mId] }))}
                      className="flex items-center gap-1.5 text-xs font-black text-teal-700 hover:text-teal-900 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Realizations & Notes ({realizations.length})</span>
                    </button>
                    <span className="text-[10px] font-bold text-slate-400">
                      Children Lessons & Reflections
                    </span>
                  </div>

                  {/* List of Realizations */}
                  {(isExpanded || realizations.length > 0) && (
                    <div className="mt-2.5 space-y-2">
                      {realizations.map(r => (
                        <div
                          key={r.id}
                          className="bg-teal-50/60 rounded-2xl p-2.5 sm:p-3 border border-teal-200 text-xs flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-teal-900">
                                {r.userName}
                              </span>
                              {r.userRole === 'admin' && (
                                <span className="bg-teal-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                                  Admin
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-bold">
                                • {r.date} {r.time}
                              </span>
                            </div>
                            {(currentUser?.role === 'admin' || currentUser?.id === r.userId) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteRealization(item, r.id)}
                                className="text-red-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                                title="Delete note"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-slate-800 font-semibold mt-1 whitespace-pre-wrap leading-relaxed">
                            <LinkifiedText text={r.text} />
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Write Realization Input */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="text"
                      value={realizationInputs[mId] || ''}
                      onChange={(e) => setRealizationInputs(prev => ({ ...prev, [mId]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRealization(item);
                        }
                      }}
                      placeholder="Write your spiritual realization / note for children..."
                      className="flex-1 bg-white border border-teal-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddRealization(item)}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Children Media Modal (Admin Only) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-teal-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-black text-teal-950 mb-3 flex items-center gap-2">
              <Smile className="w-5 h-5 text-teal-600" />
              <span>{editingId ? 'Edit Children Media' : 'Add Children Media'}</span>
            </h3>

            <form onSubmit={handleSaveMedia} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Children Bible Study, Sabbath Memory Verses..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Featured ⭐</option>
                  <option value="urgent">Urgent 🚨</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Description / Context
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Add details, Bible story, or questions for children..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Photos, Videos or Links
                </label>
                <MultiMediaUploader
                  mediaItems={mediaItems}
                  setMediaItems={setMediaItems}
                  onChange={setMediaItems}
                  maxItems={50}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingId ? 'Update Media' : 'Publish Media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
