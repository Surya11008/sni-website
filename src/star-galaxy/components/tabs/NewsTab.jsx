import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Camera,
  Download,
  Trash2,
  Pencil,
  Clock,
  MapPin,
  ShieldAlert,
  Archive,
  RotateCcw,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';
import EmojiReactionPicker from '../common/EmojiReactionPicker';
import MultiMediaDisplay from '../common/MultiMediaDisplay';
import MultiMediaUploader from '../common/MultiMediaUploader';
import LinkifiedText from '../common/LinkifiedText';
import { getPostSortTime } from '../../utils/dateUtils';

export default function NewsTab() {
  const {
    data,
    currentUser,
    addNewsPost,
    updateNewsPost,
    deleteNewsPost,
    toggleNewsPostReaction,
    markAllNewsAsViewed,
    t,
  } = useApp();

  // 👁️ When viewing News tab, mark all current posts as viewed so notification never repeats
  useEffect(() => {
    if ((data.newsPosts || []).length > 0) {
      markAllNewsAsViewed();
    }
  }, [data.newsPosts?.length]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [showAdminArchive, setShowAdminArchive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateSortOrder, setDateSortOrder] = useState('newest'); // 'newest': New date up, old date down

  // Post Form State
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [message, setMessage] = useState('');
  const [postMediaItems, setPostMediaItems] = useState([]); // Photos, videos, audios, docs
  const [feelingEmoji, setFeelingEmoji] = useState('😊');
  const [disappearedSetting, setDisappearedSetting] = useState('7d');
  const [customExpiry, setCustomExpiry] = useState('');

  const emojiOptions = ['😊', '🙏', '🎉', '❤️', '🌟', '🙌', '🔥', '😇', '🥳', '🥰', '🕊️', '💐'];

  const handleStartEditPost = (post) => {
    const id = post.id || post._id || post.timestamp;
    setEditingPostId(id);
    setTitle(post.title || '');
    setPlace(post.place || '');
    setMessage(post.message || '');
    setFeelingEmoji(post.feelingEmoji || '😊');
    setDisappearedSetting(post.disappearedSetting || '7d');
    setCustomExpiry(post.customExpiry || '');
    setPostMediaItems(
      post.mediaItems && post.mediaItems.length > 0
        ? post.mediaItems
        : (post.mediaUrl ? [{ url: post.mediaUrl, type: post.mediaType || 'image' }] : [])
    );
    setShowCreateModal(true);
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!message.trim() && postMediaItems.length === 0) return;

    setIsSubmitting(true);
    try {
      if (editingPostId) {
        const original = (data.newsPosts || []).find(p => (p.id || p._id || p.timestamp) === editingPostId) || {};
        await updateNewsPost({
          ...original,
          id: editingPostId,
          title: title.trim(),
          place: place.trim(),
          message: message.trim(),
          mediaItems: postMediaItems,
          mediaUrl: postMediaItems[0]?.url || '',
          mediaType: postMediaItems[0]?.type || 'image',
          feelingEmoji,
          disappearedSetting,
          customExpiry: customExpiry || null,
        });
      } else {
        await addNewsPost({
          title: title.trim(),
          place: place.trim(),
          message: message.trim(),
          mediaItems: postMediaItems,
          mediaUrl: postMediaItems[0]?.url || '',
          mediaType: postMediaItems[0]?.type || 'image',
          feelingEmoji,
          disappearedSetting,
          customExpiry: customExpiry || null,
        });
      }

      setEditingPostId(null);
      setTitle('');
      setPlace('');
      setMessage('');
      setPostMediaItems([]);
      setFeelingEmoji('😊');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error publishing news post:', err);
      alert('Could not complete publishing. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleArchivePost = async (post) => {
    if (currentUser?.role !== 'admin') return;
    const targetId = post.id || post._id || post.timestamp;
    const newArchived = !post.isArchived;
    await updateNewsPost({
      ...post,
      id: targetId,
      isArchived: newArchived,
    });
  };

  const visiblePosts = useMemo(() => {
    const now = new Date();
    return (data.newsPosts || [])
      .filter(post => {
        const isArchived = Boolean(post.isArchived);
        const isExpired = post.expiresAt && new Date(post.expiresAt) <= now;

        if (currentUser?.role === 'admin') {
          if (showAdminArchive) {
            return isArchived || isExpired;
          }
          return !isArchived && !isExpired;
        }

        // Regular members never see archived or expired posts
        if (isArchived || isExpired) return false;
        return true;
      })
      .sort((a, b) => {
        const timeA = getPostSortTime(a);
        const timeB = getPostSortTime(b);
        const diff = dateSortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
        if (diff !== 0) return diff;
        return dateSortOrder === 'oldest'
          ? String(a.id || '').localeCompare(String(b.id || ''))
          : String(b.id || '').localeCompare(String(a.id || ''));
      });
  }, [data.newsPosts, currentUser?.role, showAdminArchive, dateSortOrder]);

  const handleDownload = (post) => {
    if (currentUser?.role !== 'admin') {
      alert('Security Policy: Only Admin has permission to download media from News Tab.');
      return;
    }
    const targetUrl = post.mediaItems?.[0]?.url || post.mediaUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4 pb-20 pt-2 select-none animate-in fade-in duration-300">
      {/* Header with Share News Button & Clean Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <span>📰 News & Moments</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-black">
              {visiblePosts.length} Posts
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Sorting Button: New Date Up (Default) / Old Date Down */}
          <button
            type="button"
            onClick={() => setDateSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              dateSortOrder === 'newest'
                ? 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title="Sort posts by Date (New date up / Old date down)"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{dateSortOrder === 'newest' ? 'Date: New ↑' : 'Date: Old ↑'}</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setShowAdminArchive(!showAdminArchive)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showAdminArchive ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              }`}
              title="Toggle View Expired Posts"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showAdminArchive ? 'All + Expired' : 'Archive'}</span>
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Post News</span>
          </button>
        </div>
      </div>

      {/* Quick Post News Bar at Top */}
      <div
        onClick={() => {
          setEditingPostId(null);
          setTitle('');
          setPlace('');
          setMessage('');
          setPostMediaItems([]);
          setFeelingEmoji('😊');
          setShowCreateModal(true);
        }}
        className="bg-white rounded-2xl p-3 sm:p-4 border border-pink-100 hover:border-pink-300 shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
          <Camera className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-700">Share News, Photos or Testimony</p>
          <p className="text-[11px] text-slate-400 truncate">Post updates, blessings, or fellowship moments...</p>
        </div>
        <button
          type="button"
          className="shrink-0 px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          Post News
        </button>
      </div>

      {/* News Feed Grid: Wide 2-columns on PC, 1-column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visiblePosts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-pink-200 text-slate-400">
            <Camera className="w-12 h-12 text-pink-200 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-600">No news posts shared yet.</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to share photos, videos, or fellowship updates!</p>
          </div>
        ) : (
          visiblePosts.map(post => {
            const hasMedia = (post.mediaItems?.length > 0) || Boolean(post.mediaUrl);

            return (
              <article
                key={post.id}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:border-pink-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Author Info Header */}
                  <div className="p-3.5 flex items-center justify-between bg-slate-50/70 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                        {post.feelingEmoji || '😊'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{post.authorName}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {post.place && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-pink-500" />
                              {post.place}
                            </span>
                          )}
                          <span className="font-semibold text-slate-500">{post.date}{post.time ? ` • ${post.time}` : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleToggleArchivePost(post)}
                          className={`p-1 rounded-lg transition-colors cursor-pointer ${
                            post.isArchived
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                              : 'hover:bg-amber-50 text-amber-600'
                          }`}
                          title={post.isArchived ? 'Unarchive (Restore to members)' : 'Archive (Hide from members)'}
                        >
                          {post.isArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      {currentUser?.role === 'admin' && hasMedia && (
                        <button
                          type="button"
                          onClick={() => handleDownload(post)}
                          title="Download media (Admin Only)"
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(currentUser?.role === 'admin' || post.authorId === currentUser?.id) && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditPost(post)}
                            title="Edit post"
                            className="p-1 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteNewsPost(post.id || post._id || post.timestamp)}
                            title="Delete post"
                            className="p-1 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Multi-Media Display: 1 to 10 photos/videos with protected watermark & lightbox */}
                  {hasMedia && (
                    <MultiMediaDisplay
                      mediaItems={post.mediaItems}
                      singleUrl={post.mediaUrl}
                      singleType={post.mediaType}
                      title={post.title || 'News media'}
                      showWatermark={true}
                    />
                  )}

                  {/* Post Content */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {post.isArchived && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase">
                          Archived
                        </span>
                      )}
                      {post.title && (
                        <h3 className="font-bold text-sm text-slate-800">
                          <LinkifiedText text={post.title} />
                        </h3>
                      )}
                    </div>
                    <LinkifiedText
                      as="p"
                      text={post.message}
                      className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-wrap"
                    />
                  </div>
                </div>

                <div>
                  {/* Emoji Reaction Bar for All Brethren */}
                  <div className="px-4 pb-2">
                    <EmojiReactionPicker
                      reactions={post.reactions}
                      onReact={(emoji) => toggleNewsPostReaction(post.id, emoji)}
                      currentUser={currentUser}
                    />
                  </div>

                  {/* Disappearing Time Setting Info */}
                  <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      Disappearing: <strong className="text-slate-600 uppercase">{post.disappearedSetting}</strong>
                    </span>
                    {post.expiresAt && (
                      <span>Expires: {new Date(post.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Modal: Create News Post (with Multi-Media Upload up to 10 Photos & Videos) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-slate-800 mb-3.5 flex items-center gap-2">
              <Camera className="w-5 h-5 text-pink-500" />
              <span>{editingPostId ? 'Edit Fellowship Moment' : (t('shareMoment') || 'Share News & Moments')}</span>
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Title (Optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Outreach Blessing in Ameerpet"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-400 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Place / Location</label>
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. Zion Fellowship Hall"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Feeling / Emoji:</span>
                    <span className="text-sm">{feelingEmoji}</span>
                  </label>
                  <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                    {emojiOptions.map(emoji => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setFeelingEmoji(emoji)}
                        className={`text-sm p-1 rounded-lg transition-transform cursor-pointer ${
                          feelingEmoji === emoji ? 'bg-pink-100 scale-120 border border-pink-300' : 'hover:scale-110'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={feelingEmoji}
                    onChange={(e) => setFeelingEmoji(e.target.value)}
                    placeholder="Or type/paste any keyboard emoji..."
                    className="w-full mt-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-pink-300"
                  />
                </div>
              </div>

              {/* Photos & Videos & Embeds Upload (Unlimited) */}
              <div>
                <MultiMediaUploader
                  mediaItems={postMediaItems}
                  setMediaItems={setPostMediaItems}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Message / Description *</label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share details of the blessing..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-400 font-medium"
                />
              </div>

              {/* Disappearing Time Setting */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Disappearing Time</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { key: '1h', label: '1 hour' },
                    { key: '6h', label: '6 hours' },
                    { key: '24h', label: '24 hours' },
                    { key: '7d', label: '7 days' },
                  ].map(p => (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() => setDisappearedSetting(p.key)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        disappearedSetting === p.key
                          ? 'bg-pink-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPostId(null);
                    setTitle('');
                    setPlace('');
                    setMessage('');
                    setPostMediaItems([]);
                    setFeelingEmoji('😊');
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>
                        {editingPostId
                          ? 'Saving Changes...'
                          : `Publishing ${postMediaItems.length > 0 ? `(${postMediaItems.length} items)...` : '...'}`}
                      </span>
                    </>
                  ) : (
                    <span>{editingPostId ? 'Save Changes' : 'Publish Post'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
