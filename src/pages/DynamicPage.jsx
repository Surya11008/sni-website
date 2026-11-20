import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_PORTAL_STRUCTURE, findPageInfo } from '../config/portalStructure';
import PortalIcon from '../components/PortalIcon';
import RichTextEditor from '../components/RichTextEditor';
import RichContentRenderer from '../components/RichContentRenderer';
import PhotoGalleryManager from '../components/PhotoGalleryManager';
import AudioSpeakerButton from '../components/AudioSpeakerButton';
import {
  ChevronRight,
  Plus,
  X,
  Calendar,
  Trash2,
  FileText,
  Play,
  Share2,
  ArrowLeft,
  Pencil,
  CheckCircle2,
  Heart,
  ExternalLink,
  BookOpen,
  LayoutGrid,
  List,
  AlignJustify,
  Music,
  Download,
  Check,
} from 'lucide-react';

export default function DynamicPage() {
  const { categorySlug, pageSlug } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { isTelugu, getText, getDesc } = useLanguage();
  const navigate = useNavigate();

  const [pageInfo, setPageInfo] = useState({ category: null, page: null });
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'grid' | 'list' | 'compact'
  const [viewMode, setViewMode] = useState('grid');

  // In-Page Article View state (NO popup)
  const [activeArticle, setActiveArticle] = useState(null);

  // In-Page Add / Edit Form state (NO popup)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if new, or item object
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form Fields - Unified Single Language Input
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [targetPages, setTargetPages] = useState([]);

  // Flattened list of all portal subpages for multi-page assignment
  const allAvailablePages = DEFAULT_PORTAL_STRUCTURE.flatMap((cat) =>
    cat.pages.map((p) => ({
      pageSlug: p.pageSlug,
      title: p.titleEn,
      categorySlug: cat.categorySlug,
      categoryTitle: cat.titleEn,
    }))
  );

  const isAdmin = userProfile?.role === 'admin';

  // Load category and page definitions
  useEffect(() => {
    const info = findPageInfo(DEFAULT_PORTAL_STRUCTURE, categorySlug, pageSlug);
    setPageInfo(info);
    setActiveArticle(null);
    setIsFormOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug, pageSlug]);

  // Load page contents from Firestore `page_contents` (checking both pageSlug & targetPages)
  const fetchPageContents = async () => {
    setLoading(true);
    try {
      // Query all page_contents and filter for matching pageSlug or targetPages
      const snapshot = await getDocs(collection(db, 'page_contents'));
      const items = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const matchesSlug = data.pageSlug === pageSlug;
        const matchesTargetPages = Array.isArray(data.targetPages) && data.targetPages.includes(pageSlug);
        if (matchesSlug || matchesTargetPages) {
          items.push({ id: d.id, ...data });
        }
      });

      // Sort client-side by createdAt descending
      items.sort((a, b) => {
        const tA = a.createdAt?.seconds || 0;
        const tB = b.createdAt?.seconds || 0;
        return tB - tA;
      });

      setContents(items);
    } catch (err) {
      console.warn('Error fetching contents:', err);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pageSlug) {
      fetchPageContents();
    }
  }, [pageSlug]);

  // Open Form for Adding New Content
  const handleOpenAddForm = () => {
    setEditingItem(null);
    setTitle('');
    setDesc('');
    setImageUrl('');
    setVideoUrl('');
    setAudioUrl('');
    setFileUrl('');
    setDownloadUrl('');
    setTargetPages([pageSlug]);
    setIsFormOpen(true);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Open Form for Editing Existing Content
  const handleOpenEditForm = (item, e) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setTitle(item.title || item.titleEn || item.titleTe || '');
    setDesc(item.desc || item.content || item.descEn || item.descTe || '');
    setImageUrl(item.imageUrl || '');
    setVideoUrl(item.videoUrl || '');
    setAudioUrl(item.audioUrl || '');
    setFileUrl(item.fileUrl || '');
    setDownloadUrl(item.downloadUrl || '');
    setTargetPages(item.targetPages && item.targetPages.length > 0 ? item.targetPages : [item.pageSlug || pageSlug]);
    setIsFormOpen(true);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Toggle page in targetPages list
  const toggleTargetPage = (slug) => {
    setTargetPages((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Handle Save (Add or Update)
  const handleSaveContent = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a title for the content.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        categorySlug: categorySlug || '',
        pageSlug: pageSlug || '',
        targetPages: targetPages.length > 0 ? targetPages : [pageSlug],
        title: title.trim(),
        titleEn: title.trim(),
        titleTe: title.trim(),
        desc: desc.trim(),
        descEn: desc.trim(),
        descTe: desc.trim(),
        imageUrl: imageUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
        audioUrl: audioUrl.trim() || null,
        fileUrl: fileUrl.trim() || null,
        downloadUrl: downloadUrl.trim() || null,
        updatedAt: serverTimestamp(),
      };

      if (editingItem?.id) {
        // UPDATE existing document
        await updateDoc(doc(db, 'page_contents', editingItem.id), payload);
        const updatedItem = { ...editingItem, ...payload };
        if (activeArticle?.id === editingItem.id) {
          setActiveArticle(updatedItem);
        }
      } else {
        // CREATE new document
        payload.createdAt = serverTimestamp();
        payload.authorEmail = currentUser?.email || 'admin@sni.org.in';
        await addDoc(collection(db, 'page_contents'), payload);
      }

      // Reset and close in-page editor
      setIsFormOpen(false);
      setEditingItem(null);
      await fetchPageContents();
    } catch (err) {
      console.error('Failed to save page content:', err);
      alert('Failed to save content: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle deleting content by Admin
  const handleDeleteContent = async (contentId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this content item? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'page_contents', contentId));
      setContents((prev) => prev.filter((item) => item.id !== contentId));
      if (activeArticle?.id === contentId) {
        setActiveArticle(null);
      }
    } catch (err) {
      console.error('Failed to delete content:', err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const { category, page } = pageInfo;
  const categoryTitle = category ? (isTelugu ? category.titleTe : category.titleEn) : categorySlug;
  const pageTitle = page ? (isTelugu ? page.titleTe : page.titleEn) : pageSlug;
  const pageDesc = page ? (isTelugu ? page.descTe : page.descEn) : '';

  // Helper to extract YouTube video ID for responsive embed
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* 1. Cinematic Header Banner */}
      <section className="bg-gradient-to-r from-[#071B3B] via-[#0F294A] to-[#14294A] text-white pt-10 pb-14 px-4 sm:px-6 lg:px-8 border-b border-[#1A3860]">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-300 mb-6 flex-wrap">
            <Link to="/" className="hover:text-[#F4B942] transition flex items-center gap-1">
              <span>Welcome</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[#F4B942] font-semibold">{categoryTitle}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-white font-bold">{pageTitle}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#F4B942] border border-[#F4B942]/40 text-xs font-semibold uppercase tracking-wider">
                <PortalIcon name={page?.iconName || 'FileText'} className="w-3.5 h-3.5 text-[#F4B942]" />
                <span>{categoryTitle}</span>
              </div>

              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight ${
                  isTelugu ? 'font-krishna' : 'font-serif'
                }`}
              >
                {pageTitle}
              </h1>
            </div>

            {/* Quick Action Buttons for Admin */}
            {isAdmin && (
              <div className="shrink-0 flex items-center gap-3">
                <button
                  onClick={handleOpenAddForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] text-xs font-bold uppercase tracking-wider transition shadow-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Add Content to This Page</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* IN-PAGE ADD / EDIT FORM (No Popup!) */}
        {isFormOpen && (
          <div className="mb-12 bg-white rounded-3xl border-2 border-[#F4B942]/50 p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#071B3B] text-[#F4B942] flex items-center justify-center font-bold">
                  {editingItem ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#071B3B]">
                    {editingItem ? `Edit Content: "${getText(editingItem, 'title')}"` : `Add New Content to "${pageTitle}"`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Use full rich-text tools, headings, blockquotes, images, and videos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingItem(null); }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContent} className="space-y-6">
              {/* Single Unified Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter content title..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-amber-500/20 font-medium"
                  required
                />
              </div>

              {/* Single Unified Rich Content Editor */}
              <RichTextEditor
                label="Content (Google Docs Styled WYSIWYG Editor)"
                value={desc}
                onChange={setDesc}
                placeholder="Write or paste your article content here. Formatting, tables, font styles, colors, and lists are preserved natively..."
                rows={9}
              />

              {/* Multiple Pages Connection Selector */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                <label className="block text-xs font-bold text-[#071B3B] mb-1">
                  Connect to Multiple Pages
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Select which pages this content should appear on:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
                  {allAvailablePages.map((p) => {
                    const isSelected = targetPages.includes(p.pageSlug);
                    return (
                      <button
                        key={`${p.categorySlug}-${p.pageSlug}`}
                        type="button"
                        onClick={() => toggleTargetPage(p.pageSlug)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                          isSelected
                            ? 'bg-[#071B3B] text-[#F4B942] border-[#071B3B] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-[#F4B942]" />}
                        <span>{p.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Media & URL Attachments: Image, Video, Audio, Document, Download */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Image Cover URL (optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Video URL (YouTube or Direct Link)
                  </label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Audio URL (YouTube or Direct Link)
                  </label>
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://example.com/audio.mp3"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Document / File URL (PDF, Drive)
                  </label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or /docs/..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Direct Download URL (Instant download link)
                  </label>
                  <input
                    type="url"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://drive.google.com/uc?export=download&id=..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingItem(null); }}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Saving...'
                    : editingItem
                    ? 'Save Changes'
                    : 'Publish Content'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* IN-PAGE FULL ARTICLE READER VIEW (No Popup!) */}
        {activeArticle ? (
          <article className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-12 shadow-md max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
            {/* Top Bar: Back Button & Admin Controls */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 gap-4 flex-wrap">
              <button
                onClick={() => { setActiveArticle(null); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#C59B27]" />
                <span>{isTelugu ? '← అన్ని ఆర్టికల్స్ జాబితాకు వెళ్ళండి' : `← Back to ${pageTitle}`}</span>
              </button>

              <div className="flex items-center gap-2.5">
                <AudioSpeakerButton
                  text={getDesc(activeArticle)}
                  title={getText(activeArticle, 'title')}
                />

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleOpenEditForm(activeArticle, e)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#0F294A] border border-[#C59B27]/40 text-xs font-bold transition cursor-pointer shadow-xs"
                      title="Edit this article"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>Edit Content</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteContent(activeArticle.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Delete this article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Article Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="px-3 py-1 rounded-full bg-amber-50 text-[#C59B27] border border-[#C59B27]/40 font-bold uppercase text-[10px] tracking-wider">
                  {pageTitle}
                </span>
                {activeArticle.createdAt && (
                  <span className="flex items-center gap-1 text-slate-500 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {activeArticle.createdAt?.toDate
                        ? activeArticle.createdAt.toDate().toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Recent'}
                    </span>
                  </span>
                )}
                {activeArticle.authorEmail && (
                  <span className="text-slate-400 text-xs hidden sm:inline">
                    • By {activeArticle.authorEmail.split('@')[0]}
                  </span>
                )}
              </div>

              <h1
                className={`text-2xl sm:text-4xl font-extrabold text-[#071B3B] leading-tight tracking-tight ${
                  isTelugu ? 'font-krishna text-3xl sm:text-5xl' : 'font-serif'
                }`}
              >
                {getText(activeArticle, 'title')}
              </h1>
            </div>

            {/* Main Featured Image Banner (if available) */}
            {activeArticle.imageUrl && (
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md">
                <img
                  src={activeArticle.imageUrl}
                  alt={getText(activeArticle, 'title')}
                  className="w-full max-h-[520px] object-cover"
                />
              </div>
            )}

            {/* Responsive Video Embed Player (if available) */}
            {activeArticle.videoUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-md">
                {getYouTubeEmbedUrl(activeArticle.videoUrl) ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={getYouTubeEmbedUrl(activeArticle.videoUrl)}
                      title="Video Broadcast"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Play className="w-5 h-5 text-[#F4B942]" />
                      <span className="text-xs font-semibold">Video Broadcast Available</span>
                    </div>
                    <a
                      href={activeArticle.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-1.5 rounded-lg bg-[#F4B942] text-[#071B3B] text-xs font-bold hover:bg-amber-400 transition"
                    >
                      Watch Video
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Article Rich Content Body */}
            <div className="pt-2">
              <RichContentRenderer
                content={getDesc(activeArticle)}
                isTelugu={isTelugu}
                className="text-base sm:text-lg"
              />
            </div>

            {/* File / Resource Attachment Box */}
            {activeArticle.fileUrl && (
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-[#C59B27]/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#071B3B] text-[#F4B942] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#071B3B]">
                      Official Attachment / Study Material
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate max-w-sm">
                      {activeArticle.fileUrl}
                    </p>
                  </div>
                </div>
                <a
                  href={activeArticle.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#071B3B] text-[#F4B942] text-xs font-bold hover:bg-[#0F294A] transition shrink-0 inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Bottom Navigation */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => { setActiveArticle(null); window.scrollTo({ top: 300, behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#C59B27]" />
                <span>{isTelugu ? '← జాబితాకు తిరిగి వెళ్ళండి' : `← Back to ${pageTitle}`}</span>
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: getText(activeArticle, 'title'),
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Page link copied to clipboard!');
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </article>
        ) : loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                <div className="h-40 bg-slate-100 rounded-xl"></div>
                <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                <div className="h-16 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : contents.length > 0 ? (
          /* Cards Grid: clicking any card opens the article in-page */
          <div className="space-y-6">
            {/* Header with Multiple View Options (Only buttons, no extra explanation) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C59B27]"></span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {contents.length} {contents.length === 1 ? 'Article' : 'Articles'}
                </span>
              </div>

              {/* View Switcher: ONLY options/icons, NO extra explanation */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'compact'
                      ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Compact View"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contents.map((item) => {
                  const itemTitle = getText(item, 'title');
                  const itemDesc = getDesc(item);

                  return (
                    <article
                      key={item.id}
                      onClick={() => navigate(`/content/${item.id}`)}
                      className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 hover:border-[#C59B27]/60"
                    >
                      <div>
                        {item.imageUrl && (
                          <div className="aspect-video w-full overflow-hidden bg-slate-100">
                            <img
                              src={item.imageUrl}
                              alt={itemTitle}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        <div className="p-6">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span className="font-semibold text-[#C59B27] uppercase tracking-wider text-[10px]">
                              {pageTitle}
                            </span>
                            {item.createdAt && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {item.createdAt?.toDate
                                    ? item.createdAt.toDate().toLocaleDateString()
                                    : 'Recent'}
                                </span>
                              </span>
                            )}
                          </div>

                          <h3
                            className={`text-lg font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors leading-snug mb-2 ${
                              isTelugu ? 'font-telugu' : 'font-serif'
                            }`}
                          >
                            {itemTitle}
                          </h3>

                          <p
                            className={`text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3 ${
                              isTelugu ? 'font-telugu' : ''
                            }`}
                          >
                            {itemDesc}
                          </p>
                        </div>
                      </div>

                      {/* Actions / Attachments / Audio / Edit */}
                      <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <AudioSpeakerButton
                            buttonStyle="icon"
                            text={itemDesc}
                            title={itemTitle}
                          />
                          {((item.likesCount > 0) || (item.likedBy && item.likedBy.length > 0)) && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                              <span>{item.likesCount || item.likedBy?.length}</span>
                            </span>
                          )}
                          {item.videoUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold text-[10px]">
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Video</span>
                            </span>
                          )}
                          {item.audioUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px]">
                              <Music className="w-2.5 h-2.5" />
                              <span>Audio</span>
                            </span>
                          )}
                          {item.fileUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                              <FileText className="w-2.5 h-2.5" />
                              <span>PDF</span>
                            </span>
                          )}
                          {item.downloadUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                              <Download className="w-2.5 h-2.5" />
                              <span>Download</span>
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleOpenEditForm(item, e)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Edit this item"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteContent(item.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Delete this item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {contents.map((item) => {
                  const itemTitle = getText(item, 'title');
                  const itemDesc = getDesc(item);

                  return (
                    <article
                      key={item.id}
                      onClick={() => navigate(`/content/${item.id}`)}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 group cursor-pointer hover:border-amber-400"
                    >
                      {item.imageUrl && (
                        <div className="w-full sm:w-48 sm:h-32 aspect-video sm:aspect-auto rounded-xl overflow-hidden shrink-0 bg-slate-100">
                          <img
                            src={item.imageUrl}
                            alt={itemTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="font-bold text-[#C59B27] uppercase text-[10px]">
                            {pageTitle}
                          </span>
                          {item.createdAt && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {item.createdAt?.toDate
                                  ? item.createdAt.toDate().toLocaleDateString()
                                  : 'Recent'}
                              </span>
                            </span>
                          )}
                          {((item.likesCount > 0) || (item.likedBy && item.likedBy.length > 0)) && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                              <span>{item.likesCount || item.likedBy?.length}</span>
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-[#071B3B] group-hover:text-[#C59B27] transition-colors truncate">
                          {itemTitle}
                        </h3>

                        <p className="text-slate-600 text-xs sm:text-sm line-clamp-2">
                          {itemDesc}
                        </p>

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <AudioSpeakerButton buttonStyle="icon" text={itemDesc} title={itemTitle} />
                          {item.videoUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold text-[10px]">
                              <Play className="w-2.5 h-2.5" />
                              <span>Video</span>
                            </span>
                          )}
                          {item.audioUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px]">
                              <Music className="w-2.5 h-2.5" />
                              <span>Audio</span>
                            </span>
                          )}
                          {item.downloadUrl && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                              <Download className="w-2.5 h-2.5" />
                              <span>Download</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex sm:flex-col items-center gap-1 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenEditForm(item, e)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteContent(item.id, e)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* COMPACT VIEW */}
            {viewMode === 'compact' && (
              <div className="space-y-1.5">
                {contents.map((item) => {
                  const itemTitle = getText(item, 'title');
                  const itemDesc = getDesc(item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/content/${item.id}`)}
                      className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 transition group cursor-pointer gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-[#C59B27] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#071B3B] truncate">
                            {itemTitle}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        <AudioSpeakerButton buttonStyle="icon" text={itemDesc} title={itemTitle} />
                        {((item.likesCount > 0) || (item.likedBy && item.likedBy.length > 0)) && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                            <span>{item.likesCount || item.likedBy?.length}</span>
                          </span>
                        )}
                        {item.createdAt && (
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                          </span>
                        )}
                        {isAdmin && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleOpenEditForm(item, e)}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteContent(item.id, e)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Editorial Default Welcome if no user-submitted content exists yet */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#0F294A] text-[#F4B942] flex items-center justify-center shrink-0 shadow-sm">
                <PortalIcon name={page?.iconName || 'BookOpen'} className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-[#C59B27] tracking-wider">
                  {categoryTitle}
                </span>
                <h2
                  className={`text-2xl sm:text-3xl font-bold text-[#0F294A] ${
                    isTelugu ? 'font-krishna' : 'font-serif'
                  }`}
                >
                  {pageTitle}
                </h2>
              </div>
            </div>

            <div
              className={`text-slate-700 text-sm sm:text-base leading-relaxed space-y-3 ${
                isTelugu ? 'font-telugu leading-loose' : ''
              }`}
            >
              <p>
                {isTelugu
                  ? `దేవుని సంఘ సమాఖ్య ${categoryTitle} విభాగంలోని "${pageTitle}" పేజీకి స్వాగతం.`
                  : `Welcome to the official "${pageTitle}" section within ${categoryTitle}.`}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#0F294A] hover:text-[#C59B27] transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Welcome</span>
              </Link>

              {isAdmin && (
                <button
                  onClick={handleOpenAddForm}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] border border-[#F4B942]/40 text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#F4B942]" />
                  <span>+ Add Content to This Page</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Page Photo Gallery & Visual Media (Admin editable) */}
        <div className="pt-10 border-t border-slate-200 mt-12">
          <PhotoGalleryManager
            targetPage={`${categorySlug}_${pageSlug}`}
            sectionTitleEn={`${pageTitle} Photo Gallery`}
            sectionTitleTe={`${pageTitle} చిత్రమాలిక`}
          />
        </div>
      </main>
    </div>
  );
}
