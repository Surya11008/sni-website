import React, { useState, useEffect } from 'react';
import {
  X,
  FolderPlus,
  Smile,
  Sparkles,
  ChevronRight,
  FileText,
  Tv,
  Music,
  BookOpen,
  Calendar,
  Layers,
  Check,
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AllEmojisPicker from './AllEmojisPicker';

const PRESET_ICONS = [
  'FileText',
  'Tv',
  'Music',
  'BookOpen',
  'Calendar',
  'Scroll',
  'Flame',
  'Sparkles',
  'SunMedium',
  'Layers',
  'Video',
  'HeartHandshake',
  'Folder',
];

export default function AddSubpageModal({
  isOpen = false,
  onClose,
  categorySlug = '',
  categoryTitle = '',
  parentPageSlug = '',
  parentPageTitle = '',
  onSuccess,
}) {
  const [title, setTitle] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [desc, setDesc] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [iconName, setIconName] = useState('FileText');
  const [iconEmoji, setIconEmoji] = useState('📖');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate slug from title
  useEffect(() => {
    if (!isSlugCustomized && title) {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setPageSlug(generated);
    }
  }, [title, isSlugCustomized]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the subpage.');
      return;
    }

    const cleanTitle = title.trim();
    const cleanSlug = (pageSlug || cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

    if (!cleanSlug) {
      setError('Please provide a valid URL slug.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        categorySlug: categorySlug || 'worship',
        parentPageSlug: parentPageSlug || null,
        pageSlug: cleanSlug,
        title: cleanTitle,
        titleEn: cleanTitle,
        titleTe: (titleTe || '').trim() || cleanTitle,
        desc: desc.trim(),
        descEn: desc.trim(),
        descTe: desc.trim(),
        iconName: iconName || 'FileText',
        iconEmoji: iconEmoji || '📖',
        isCustom: true,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'portal_pages'), payload);
      if (onSuccess) {
        onSuccess({ id: docRef.id, ...payload });
      }
      onClose();
    } catch (err) {
      console.error('Error creating subpage in portal_pages:', err);
      setError('Failed to create subpage: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#071B3B] text-[#F4B942] flex items-center justify-center shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#071B3B]">
                Create New Subpage
              </h3>
              <p className="text-xs text-slate-500">
                Adding subpage under <b>{parentPageTitle || 'this page'}</b>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hierarchy Breadcrumb Preview */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 flex-wrap">
          <span>Home</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-[#C59B27] uppercase">{categoryTitle || categorySlug}</span>
          {parentPageTitle && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-700">{parentPageTitle}</span>
            </>
          )}
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-[#071B3B] font-bold">
            {title.trim() || 'New Subpage'}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs">
              {error}
            </div>
          )}

          {/* Subpage Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Subpage Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Sermons, Youth Conference 2026, Fasting Prayer"
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Icon & Emoji Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Subpage Icon / Emoji
            </label>
            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:border-amber-400 flex items-center justify-center text-xl hover:scale-105 transition cursor-pointer shrink-0 shadow-2xs"
                title="Choose Emoji"
              >
                {iconEmoji || '📖'}
              </button>

              {/* Preset Icon choices */}
              <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none flex-1">
                {['📖', '📺', '🕊️', '📜', '🌾', '🕯️', '🎶', '🌟', '📁', '✨', '⚡'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setIconEmoji(em)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition cursor-pointer border ${
                      iconEmoji === em
                        ? 'bg-amber-100 border-amber-400 scale-105'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>

              {showEmojiPicker && (
                <div className="absolute left-0 top-full mt-2 z-50">
                  <AllEmojisPicker
                    selectedEmoji={iconEmoji}
                    onSelectEmoji={(em) => {
                      setIconEmoji(em);
                      setShowEmojiPicker(false);
                    }}
                    onClose={() => setShowEmojiPicker(false)}
                    title="Select Subpage Emoji"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Subpage Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description of notes and articles in this subpage..."
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* URL Slug */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">
                URL Slug (Unique Link Identifier)
              </label>
              {!isSlugCustomized && (
                <span className="text-[10px] text-slate-400">Auto-generated</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl border border-slate-200 bg-slate-50">
              <span className="text-slate-400 font-mono text-[11px]">
                /Home/{categorySlug}/
              </span>
              <input
                type="text"
                required
                value={pageSlug}
                onChange={(e) => {
                  setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''));
                  setIsSlugCustomized(true);
                }}
                placeholder="subpage-slug"
                className="flex-1 bg-transparent border-none font-mono text-[11px] font-bold text-[#071B3B] focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-[#F4B942]" />
              <span>{submitting ? 'Creating Subpage...' : 'Create Subpage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
