import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  Image as ImageIcon,
  PlusCircle,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  MessageSquare,
  Send,
  Plus,
  X,
  FolderPlus,
  Smile,
  Sparkles,
  Tag,
} from 'lucide-react';
import EmojiReactionPicker from '../common/EmojiReactionPicker';
import MultiMediaDisplay from '../common/MultiMediaDisplay';
import MultiMediaUploader from '../common/MultiMediaUploader';
import LinkifiedText from '../common/LinkifiedText';
import { formatDate, formatTimeOnly, getPostSortTime } from '../../utils/dateUtils';

export default function MediaManager({ onBack }) {
  const {
    data,
    currentUser,
    addGalleryMedia,
    updateGalleryMedia,
    deleteGalleryMedia,
    toggleGalleryReaction,
    addMediaCategory,
    deleteMediaCategory,
    t,
  } = useApp();

  // Categories: 'Special' (default), 'Children', and any custom categories
  const categories = useMemo(() => {
    const base = ['Special', 'Children'];
    const custom = Array.isArray(data.mediaCategories) ? data.mediaCategories : [];
    const list = [...base];
    custom.forEach(c => {
      if (c && !list.some(existing => existing.toLowerCase() === c.toLowerCase())) {
        list.push(c);
      }
    });
    return list;
  }, [data.mediaCategories]);

  const [selectedCategory, setSelectedCategory] = useState('Special');
  const [activeFilter, setActiveFilter] = useState('active'); // 'active' | 'archived'

  // Add Category modal state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Media Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [mediaCategory, setMediaCategory] = useState('Special');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal'); // 'urgent' | 'medium' | 'normal'
  const [mediaItems, setMediaItems] = useState([]);

  // Realization comment inputs per media item: { [mediaId]: string }
  const [realizationInputs, setRealizationInputs] = useState({});
  const [expandedRealizations, setExpandedRealizations] = useState({});

  // Unified list of all media items:
  // Existing items with no category automatically belong to 'Special'
  // Legacy children items belong to 'Children'
  const allMediaList = useMemo(() => {
    const gallery = (data.galleryMedia || []).map(g => ({
      ...g,
      category: g.category || 'Special',
    }));
    const children = (data.childrenMedia || []).map(c => ({
      ...c,
      category: c.category || 'Children',
    }));

    const combined = [...gallery];
    children.forEach(c => {
      const cId = c.id || c._id;
      if (!combined.some(g => (g.id || g._id) === cId)) {
        combined.push(c);
      }
    });
    return combined;
  }, [data.galleryMedia, data.childrenMedia]);

  // Filtered by Selected Category and Archive Status (Newest at top)
  const displayedMedia = useMemo(() => {
    return allMediaList
      .filter(item => {
        const itemCat = (item.category || 'Special').toLowerCase();
        if (itemCat !== selectedCategory.toLowerCase()) return false;

        const isArchived = Boolean(item.isArchived);
        if (currentUser?.role === 'admin') {
          return activeFilter === 'archived' ? isArchived : !isArchived;
        }
        return !isArchived;
      })
      .sort((a, b) => {
        const diff = getPostSortTime(b) - getPostSortTime(a);
        if (diff !== 0) return diff;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
  }, [allMediaList, selectedCategory, currentUser?.role, activeFilter]);

  // Count items per category (active)
  const categoryCounts = useMemo(() => {
    const counts = {};
    categories.forEach(c => {
      counts[c] = allMediaList.filter(item => {
        const isArchived = Boolean(item.isArchived);
        if (currentUser?.role === 'admin') {
          const matchesArchive = activeFilter === 'archived' ? isArchived : !isArchived;
          return matchesArchive && (item.category || 'Special').toLowerCase() === c.toLowerCase();
        }
        return !isArchived && (item.category || 'Special').toLowerCase() === c.toLowerCase();
      }).length;
    });
    return counts;
  }, [allMediaList, categories, currentUser?.role, activeFilter]);

  const activeTotalCount = useMemo(() => {
    return allMediaList.filter(item => !item.isArchived).length;
  }, [allMediaList]);

  const archivedTotalCount = useMemo(() => {
    return allMediaList.filter(item => Boolean(item.isArchived)).length;
  }, [allMediaList]);

  const handleStartEdit = (item) => {
    const id = item.id || item._id;
    setEditingId(id);
    setTitle(item.title || '');
    setMediaCategory(item.category || 'Special');
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
    if (mediaItems.length === 0 && !title.trim() && !description.trim()) {
      alert('Please add at least one photo, video, link, or description.');
      return;
    }

    const targetCategory = mediaCategory || selectedCategory || 'Special';
    const payload = {
      title: title.trim() || 'Media',
      category: targetCategory,
      description: description.trim(),
      priority,
      url: mediaItems[0]?.url || '',
      type: mediaItems[0]?.type || (mediaItems.length > 0 ? 'image' : 'text'),
      mediaItems,
    };

    if (editingId) {
      const original = allMediaList.find(g => (g.id || g._id) === editingId) || {};
      updateGalleryMedia({
        ...original,
        id: editingId,
        ...payload,
      });
    } else {
      addGalleryMedia(payload);
    }

    // Switch to target category so user immediately sees their newly added item
    setSelectedCategory(targetCategory);
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
    updateGalleryMedia({
      ...item,
      id: targetId,
      isArchived: newArchivedStatus,
    });
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const trimmed = newCategoryName.trim();
    if (addMediaCategory) {
      addMediaCategory(trimmed);
    }
    setSelectedCategory(trimmed);
    setNewCategoryName('');
    setShowAddCategoryModal(false);
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

    updateGalleryMedia({
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
    updateGalleryMedia({
      ...item,
      id: mediaId,
      realizations: updated,
    });
  };

  return (
    <div className="space-y-4 pb-20 pt-1 animate-in fade-in duration-300">
      {/* Top Header with Back Navigation and Title */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-3xl p-4 sm:p-5 text-white shadow-md flex items-center justify-between flex-wrap gap-3">
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
                📷 Media
              </h2>
              <span className="bg-white/25 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                {activeTotalCount}
              </span>
            </div>
            <p className="text-xs text-purple-100 font-bold mt-0.5">
              Special, Children & Fellowship Categories
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
                setMediaCategory(selectedCategory);
                setDescription('');
                setPriority('normal');
                setMediaItems([]);
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white text-purple-700 hover:bg-purple-50 font-black text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('addMedia') || 'Add Media'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 🏷️ CATEGORY SELECTOR TABS + (+) ADD CATEGORY BUTTON */}
      <div className="bg-white rounded-3xl p-3 border-2 border-purple-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-0">
          {categories.map(cat => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const count = categoryCounts[cat] || 0;
            const isChildren = cat.toLowerCase() === 'children';
            const isSpecial = cat.toLowerCase() === 'special';

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${
                  isSelected
                    ? isChildren
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm scale-102'
                      : isSpecial
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm scale-102'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm scale-102'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{isChildren ? '👶' : isSpecial ? '✨' : '📁'}</span>
                <span>{cat}</span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-white/30 text-white' : 'bg-white text-slate-600'
                }`}>
                  {count}
                </span>

                {/* Delete custom category button (Admin only, non-default categories) */}
                {currentUser?.role === 'admin' && !isSpecial && !isChildren && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove category "${cat}"?`)) {
                        deleteMediaCategory(cat);
                        if (selectedCategory === cat) setSelectedCategory('Special');
                      }
                    }}
                    className="ml-1 p-0.5 rounded-full hover:bg-black/20 text-white/80 hover:text-white"
                    title="Delete Category"
                  >
                    <X className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}

          {/* (+) Add Category Button for Admin */}
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setShowAddCategoryModal(true)}
              className="p-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-dashed border-purple-300 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-all active:scale-95"
              title="Add New Category"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Category</span>
            </button>
          )}
        </div>

        {/* Admin Active / Archive filter */}
        {currentUser?.role === 'admin' && (
          <div className="flex items-center gap-1 shrink-0 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeFilter === 'active'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'archived'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Archive className="w-3 h-3" />
              Archive ({archivedTotalCount})
            </button>
          </div>
        )}
      </div>

      {/* Media Cards Feed (Newest at top) */}
      {displayedMedia.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-purple-200 p-6">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-inner text-2xl">
            {selectedCategory.toLowerCase() === 'children' ? '👶' : '📷'}
          </div>
          <p className="text-sm font-black text-slate-700">
            {activeFilter === 'archived'
              ? `No archived items in ${selectedCategory}.`
              : `No media added in ${selectedCategory} yet.`}
          </p>
          <p className="text-xs text-slate-400 font-bold mt-1">
            {currentUser?.role === 'admin'
              ? `Click "+ Add Media" above to upload photos, videos, or embeds to "${selectedCategory}".`
              : 'New photos and videos will appear here.'}
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
            const itemCat = item.category || 'Special';

            return (
              <div
                key={mId}
                className={`bg-white rounded-3xl p-4 sm:p-5 border-2 shadow-xs transition-all ${
                  isArchived
                    ? 'border-amber-300 bg-amber-50/20 opacity-90'
                    : isUrgent
                    ? 'border-red-400 bg-red-50/10'
                    : isFeatured
                    ? 'border-purple-400 bg-purple-50/10'
                    : 'border-purple-200'
                }`}
              >
                {/* Header: Category Badge, Title, Tags & Admin Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-200">
                      <Tag className="w-3 h-3 text-purple-600" />
                      {itemCat}
                    </span>

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
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        Featured ⭐
                      </span>
                    )}
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      <LinkifiedText text={item.title || 'Media'} />
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
                        className="text-purple-600 hover:text-purple-800 p-1.5 rounded-xl hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Edit Media"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this media permanently?')) {
                            deleteGalleryMedia(mId);
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
                  <span>{item.date || 'Fellowship Media'}</span>
                  <span>{item.mediaItems?.length || 1} Media Files</span>
                </div>

                {/* Unified Emoji Reaction Picker */}
                <div className="mt-1">
                  <EmojiReactionPicker
                    reactions={item.reactions}
                    onReact={(emoji) => toggleGalleryReaction(mId, emoji)}
                    currentUser={currentUser}
                  />
                </div>

                {/* 📝 Realization / Notes Section */}
                <div className="mt-3.5 pt-3 border-t-2 border-dashed border-purple-100">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedRealizations(prev => ({ ...prev, [mId]: !prev[mId] }))}
                      className="flex items-center gap-1.5 text-xs font-black text-purple-700 hover:text-purple-900 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Realizations & Notes ({realizations.length})</span>
                    </button>
                    <span className="text-[10px] font-bold text-slate-400">
                      Spiritual Reflections
                    </span>
                  </div>

                  {/* List of Realizations */}
                  {(isExpanded || realizations.length > 0) && (
                    <div className="mt-2.5 space-y-2">
                      {realizations.map(r => (
                        <div
                          key={r.id}
                          className="bg-purple-50/60 rounded-2xl p-2.5 sm:p-3 border border-purple-200 text-xs flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-purple-900">
                                {r.userName}
                              </span>
                              {r.userRole === 'admin' && (
                                <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
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
                      placeholder="Write your spiritual realization / note..."
                      className="flex-1 bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddRealization(item)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
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

      {/* MODAL 1: ADD / EDIT MEDIA (Admin Only) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-purple-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-black text-purple-950 mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              <span>{editingId ? 'Edit Media' : 'Add Fellowship Media'}</span>
            </h3>

            <form onSubmit={handleSaveMedia} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Category *
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMediaCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        mediaCategory.toLowerCase() === cat.toLowerCase()
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fellowship Gathering, Zion Choir, Sabbath Bible Lesson..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  placeholder="Add details, background, or prayer requests..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingId ? 'Update Media' : 'Publish Media'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: (+) ADD NEW CATEGORY (Admin Only) */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border-2 border-purple-300">
            <h3 className="text-sm sm:text-base font-black text-purple-950 mb-2.5 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-purple-600" />
              <span>Create New Media Category</span>
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-3">
              Add custom categories like Youth, Choir, Outreach, Events...
            </p>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <input
                type="text"
                required
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name (e.g. Youth, Choir)..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
