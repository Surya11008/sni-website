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
import { db, auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePortal } from '../context/PortalContext';
import { formatSlugToTitle } from '../config/portalStructure';
import PortalIcon from '../components/PortalIcon';
import RichTextEditor from '../components/RichTextEditor';
import RichContentRenderer from '../components/RichContentRenderer';
import PhotoGalleryManager from '../components/PhotoGalleryManager';
import AudioSpeakerButton from '../components/AudioSpeakerButton';
import { NotionCover, NotionToolbar, NotionEditor, NotionEmpty, NotionLinkPreview, NotionEmbed, NotionEmbedDrawer } from '../components/notion';
import WATVSubNav from '../components/WATVSubNav';
import OnlineWorshipSection from '../components/OnlineWorshipSection';
import CalendarScheduleHub, {
  getItemDateStr,
  formatReadableDate,
  getGoogleCalendarUrl,
  downloadICSFile,
  EVENT_TYPES,
  RECURRENCE_OPTIONS,
} from '../components/CalendarScheduleHub';
import {
  ChevronRight,
  ChevronLeft,
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
  Table,
  Pin,
  Search,
  Music,
  Download,
  Check,
  Star,
  Globe,
  ChevronDown,
  Paperclip,
  Layers,
  Image as ImageIcon,
  Smile,
  Tag,
  Sparkles,
  Clock,
  MapPin,
  CalendarDays,
  CalendarCheck,
  CalendarPlus,
  Repeat,
  Copy,
  CheckCheck,
  Bell,
  ArrowRight,
} from 'lucide-react';

// Curated Notion preset spiritual cover wallpapers
const NOTION_PRESET_COVERS = [
  { name: 'Sacred Sunrise', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80' },
  { name: 'Mountain Dawn', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80' },
  { name: 'Holy Bible', url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1600&q=80' },
  { name: 'Golden Forest Rays', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80' },
  { name: 'Cathedral Stained Glass', url: 'https://images.unsplash.com/photo-1548625361-19597a732a39?w=1600&q=80' },
  { name: 'Calming Ocean Sunset', url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1600&q=80' },
];

const NOTION_EMOJIS = [
  '📖', '✝️', '🕊️', '⛪', '📜', '🎵', '🙏', '🌟',
  '💡', '🛡️', '🌿', '🕯️', '🍞', '👑', '🎺', '❤️',
  '🌈', '⚓', '🔔', '✨', '🔥', '🌾', '☀️'
];

export default function DynamicPage() {
  const { categorySlug, pageSlug } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { isTelugu, getText, getDesc } = useLanguage();
  const { portalStructure, allAvailablePages, getPageInfo } = usePortal();
  const navigate = useNavigate();

  const [pageInfo, setPageInfo] = useState({ category: null, page: null });
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode: 'grid' | 'list' | 'compact'
  const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list' | 'table' | 'compact'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'pinned' | 'video' | 'audio' | 'file' | 'link'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'title'
  const [showEmbedDrawer, setShowEmbedDrawer] = useState(false);

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
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [targetPages, setTargetPages] = useState([]);

  // Notion Page states
  const [icon, setIcon] = useState('📖');
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Collapsible sections for clean, simple writing experience
  const [showMediaAttachments, setShowMediaAttachments] = useState(false);
  const [showMultiPageSelect, setShowMultiPageSelect] = useState(false);

  // Calendar tracking & scheduling states
  const isCalendarPage = ['new-updates', 'events', 'schedule'].includes(pageSlug);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [calendarDateRange, setCalendarDateRange] = useState('all');
  const [calendarEventType, setCalendarEventType] = useState('all');

  // Form Fields for Schedule & Calendar
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState('Worship Service');
  const [eventLocation, setEventLocation] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [showCalendarScheduler, setShowCalendarScheduler] = useState(false);
  const [copiedScheduleId, setCopiedScheduleId] = useState(null);

  const isAdmin = userProfile?.role === 'admin';

  // Load category and page definitions from real-time portalStructure
  useEffect(() => {
    const info = getPageInfo(categorySlug, pageSlug);
    setPageInfo(info);
    setActiveArticle(null);
    setIsFormOpen(false);
    setSelectedCalendarDate(null);
    setCalendarDateRange('all');
    setCalendarEventType('all');
    if (pageSlug === 'schedule') {
      setViewMode('calendar');
    } else if (['new-updates', 'events'].includes(pageSlug)) {
      setViewMode('list');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug, pageSlug, portalStructure]);

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

  // Open Form for Adding New Content (Supports pre-filling date from Calendar)
  const handleOpenAddForm = (initialDateStr = null) => {
    setEditingItem(null);
    setTitle('');
    setDesc('');
    setIcon(pageSlug === 'schedule' ? '🗓️' : pageSlug === 'events' ? '✨' : '📖');
    setImageUrl('');
    setVideoUrl('');
    setAudioUrl('');
    setFileUrl('');
    setDownloadUrl('');
    setWebsiteUrl('');
    setTargetPages([pageSlug]);
    setEventDate(typeof initialDateStr === 'string' ? initialDateStr : '');
    setEventTime('');
    setEventType(pageSlug === 'events' ? 'Sacred Assembly' : 'Worship Service');
    setEventLocation('');
    setRecurrence('none');
    setShowCalendarScheduler(Boolean(initialDateStr) || isCalendarPage);
    setShowMediaAttachments(false);
    setShowMultiPageSelect(false);
    setShowCoverPicker(false);
    setShowIconPicker(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Open Form for Editing Existing Content
  const handleOpenEditForm = (item, e) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setTitle(item.title || item.titleEn || item.titleTe || '');
    setDesc(item.desc || item.content || item.descEn || item.descTe || '');
    setIcon(item.icon || '📖');
    setImageUrl(item.imageUrl || '');
    setVideoUrl(item.videoUrl || '');
    setAudioUrl(item.audioUrl || '');
    setFileUrl(item.fileUrl || '');
    setDownloadUrl(item.downloadUrl || '');
    setWebsiteUrl(item.websiteUrl || item.embedUrl || '');
    setTargetPages(item.targetPages && item.targetPages.length > 0 ? item.targetPages : [item.pageSlug || pageSlug]);
    setEventDate(item.eventDate || item.date || '');
    setEventTime(item.eventTime || item.time || '');
    setEventType(item.eventType || 'Worship Service');
    setEventLocation(item.eventLocation || item.location || '');
    setRecurrence(item.recurrence || 'none');
    setShowCalendarScheduler(Boolean(item.eventDate || item.eventTime || isCalendarPage));
    setShowMediaAttachments(Boolean(item.videoUrl || item.audioUrl || item.fileUrl || item.downloadUrl || item.websiteUrl || item.embedUrl));
    setShowMultiPageSelect(false);
    setShowCoverPicker(false);
    setShowIconPicker(false);
    setIsFormOpen(true);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Toggle Pin to Top
  const handleTogglePin = async (itemId, currentPinned, e) => {
    if (e) e.stopPropagation();
    try {
      const newPinned = !currentPinned;
      setContents((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, isPinned: newPinned } : item))
      );
      await updateDoc(doc(db, 'page_contents', itemId), {
        isPinned: newPinned,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Failed to toggle pin:', err);
    }
  };

  // Handle Embed & Link Preview Insertion from NotionEmbedDrawer
  const handleInsertEmbed = (embed) => {
    if (embed.type === 'video') {
      setVideoUrl(embed.url);
      setShowMediaAttachments(true);
    } else if (embed.type === 'audio') {
      setAudioUrl(embed.url);
      setShowMediaAttachments(true);
    } else if (embed.type === 'pdf') {
      setFileUrl(embed.url);
      setShowMediaAttachments(true);
    } else {
      setWebsiteUrl(embed.url);
      setShowMediaAttachments(true);
    }
    // Also append token into description so it renders inside the body
    const token = embed.type === 'bookmark' ? `\n\n[bookmark](${embed.url})\n\n` : `\n\n[embed](${embed.url})\n\n`;
    setDesc((prev) => (prev ? prev + token : embed.url));
  };

  // Toggle page in targetPages list
  const toggleTargetPage = (slug) => {
    setTargetPages((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Handle Save (Add or Update)
  const handleSaveContent = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
        icon: icon || '📖',
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
        websiteUrl: websiteUrl.trim() || null,
        embedUrl: websiteUrl.trim() || null,
        eventDate: eventDate.trim() || null,
        eventTime: eventTime.trim() || null,
        eventType: eventType || 'Worship Service',
        eventLocation: eventLocation.trim() || null,
        recurrence: recurrence || 'none',
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

  // Copy schedule details
  const handleCopySchedule = (item, e) => {
    if (e) e.stopPropagation();
    const dateStr = getItemDateStr(item) || 'Upcoming';
    const text = [
      `📅 ${item.title || item.titleEn}`,
      item.eventType ? `📌 Type: ${item.eventType}` : '',
      `🗓 Date: ${dateStr}`,
      item.eventTime ? `⏰ Time: ${item.eventTime}` : '',
      item.eventLocation ? `📍 Venue: ${item.eventLocation}` : '',
      item.desc ? `\n${item.desc.replace(/<[^>]*>/g, '').slice(0, 160)}...` : '',
      `\n🔗 ${window.location.origin}/page/${categorySlug}/${pageSlug}`,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopiedScheduleId(item.id);
    setTimeout(() => setCopiedScheduleId(null), 2500);
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

  // Filter and Sort Contents
  const filteredContents = contents.filter((item) => {
    const itemTitle = (item.title || item.titleEn || item.titleTe || '').toLowerCase();
    const itemDesc = (item.desc || item.content || '').toLowerCase();
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch = !term || itemTitle.includes(term) || itemDesc.includes(term);
    if (!matchesSearch) return false;

    if (filterType === 'pinned') return Boolean(item.isPinned);
    if (filterType === 'video') return Boolean(item.videoUrl);
    if (filterType === 'audio') return Boolean(item.audioUrl);
    if (filterType === 'file') return Boolean(item.fileUrl || item.downloadUrl);
    if (filterType === 'link') return Boolean(item.websiteUrl || item.embedUrl);

    // Calendar Date Filtering (for New Updates, Events, Schedule)
    const itemDateStr = getItemDateStr(item);

    if (selectedCalendarDate) {
      if (itemDateStr !== selectedCalendarDate) return false;
    }

    if (calendarDateRange !== 'all' && itemDateStr) {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (calendarDateRange === 'today') {
        if (itemDateStr !== today) return false;
      } else if (calendarDateRange === 'upcoming') {
        if (itemDateStr < today) return false;
      } else if (calendarDateRange === 'past') {
        if (itemDateStr >= today) return false;
      } else if (calendarDateRange === 'this_month') {
        const monthPrefix = today.slice(0, 7);
        if (!itemDateStr.startsWith(monthPrefix)) return false;
      }
    }

    if (calendarEventType !== 'all') {
      if ((item.eventType || 'Worship Service') !== calendarEventType) return false;
    }

    return true;
  });

  const displayContents = [...filteredContents].sort((a, b) => {
    // Pinned always floats to top unless sorting alphabetically
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (sortBy === 'oldest') {
      const tA = a.createdAt?.seconds || 0;
      const tB = b.createdAt?.seconds || 0;
      return tA - tB;
    }
    if (sortBy === 'title') {
      const titleA = (a.title || a.titleEn || '').toLowerCase();
      const titleB = (b.title || b.titleEn || '').toLowerCase();
      return titleA.localeCompare(titleB);
    }
    if (sortBy === 'eventDate') {
      const dsA = getItemDateStr(a) || '9999-99-99';
      const dsB = getItemDateStr(b) || '9999-99-99';
      return dsA.localeCompare(dsB);
    }
    // Default newest
    const tA = a.createdAt?.seconds || 0;
    const tB = b.createdAt?.seconds || 0;
    return tB - tA;
  });

  const { category, page } = pageInfo;
  const categoryTitle = category ? (isTelugu ? category.titleTe : category.titleEn) : (categorySlug ? formatSlugToTitle(categorySlug) : '');
  const pageTitle = (
    page?.title ||
    (page ? (isTelugu ? page.titleTe : page.titleEn) : '') ||
    page?.titleEn ||
    page?.titleTe ||
    formatSlugToTitle(pageSlug) ||
    'Page'
  );

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
      {/* 1. WATV Authentic Subpage Navigation Bar (As seen in Image 1 & 5) */}
      <WATVSubNav categorySlug={categorySlug} activePageSlug={pageSlug} />

      {/* 2. Main Content Area */}
      <main className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 pt-3 sm:pt-4 pb-12 space-y-4">
        {/* Clean, Lightweight Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-xs text-slate-500 mb-0.5 flex-wrap">
              <Link to="/" className="hover:text-[#0F294A] transition flex items-center gap-1 font-bold text-slate-600">
                <span>Home</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <Link to={`/category/${categorySlug}`} className="text-[#C59B27] font-bold uppercase hover:underline">
                {categoryTitle}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-bold">{pageTitle}</span>
            </nav>

            <div className="space-y-1">
              <h1
                className={`text-3xl sm:text-5xl font-black tracking-tight text-[#071B3B] leading-tight ${
                  isTelugu ? 'font-krishna' : 'font-serif'
                }`}
              >
                {pageTitle}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {page?.descEn || "This is to help you meditate day and night on God's words that revive your soul."}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons for Admin */}
          {isAdmin && (
            <div className="shrink-0 flex items-center gap-3">
              <button
                onClick={handleOpenAddForm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Add Content</span>
              </button>
            </div>
          )}
        </div>

        {/* NOTION-STYLE DOCUMENT EDITOR (Matches Notion Architecture) */}
        {isFormOpen && (
          <div className="mb-14 bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            {/* 1. Notion Top Navigation & Action Bar */}
            <div className="px-5 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs select-none">
              <div className="flex items-center gap-2 text-slate-500 font-medium truncate">
                <Link to={`/category/${categorySlug}`} className="hover:text-slate-800 transition">{categoryTitle}</Link>
                <span>/</span>
                <span className="text-slate-900 font-bold truncate">{pageTitle}</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 ml-1">
                  <Sparkles className="w-3 h-3 text-[#C59B27]" />
                  Document Editor
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingItem(null); }}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-200/60 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveContent}
                  disabled={formSubmitting}
                  className="px-5 py-1.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#F4B942]" />
                  <span>{formSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish'}</span>
                </button>
              </div>
            </div>

            {/* Notion Embed & Link Preview Drawer */}
            <NotionEmbedDrawer
              isOpen={showEmbedDrawer}
              onClose={() => setShowEmbedDrawer(false)}
              onInsert={handleInsertEmbed}
            />

            {/* 2. Cover Component (Snippet 2) */}
            <NotionCover
              url={imageUrl}
              onChange={setImageUrl}
              onRemove={() => setImageUrl('')}
              editable={true}
            />

            {/* 3. Toolbar & Document Content (Snippet 2 & 3) */}
            <div className="mx-auto md:max-w-3xl lg:max-w-4xl pb-16">
              <NotionToolbar
                initialData={{ icon, title }}
                onTitleChange={setTitle}
                onIconChange={setIcon}
                pageTitle={pageTitle}
                editable={true}
                onToggleMedia={() => setShowMediaAttachments(!showMediaAttachments)}
                onToggleMultiPage={() => setShowMultiPageSelect(!showMultiPageSelect)}
                onOpenEmbed={() => setShowEmbedDrawer(true)}
                onToggleSchedule={() => setShowCalendarScheduler(!showCalendarScheduler)}
                hasSchedule={Boolean(eventDate || eventTime)}
                targetPagesCount={targetPages.length}
                hasMedia={Boolean(videoUrl || audioUrl || fileUrl || downloadUrl || websiteUrl)}
              />

              {/* Schedule & Calendar Details Drawer */}
              {(showCalendarScheduler || isCalendarPage) && (
                <div className="mx-6 md:mx-12 mt-3 p-5 rounded-3xl bg-gradient-to-br from-amber-50/60 via-white to-slate-50 border border-amber-200/90 shadow-xs space-y-4 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
                    <div className="flex items-center gap-2 font-black text-slate-800">
                      <CalendarDays className="w-4 h-4 text-[#C59B27]" />
                      <span className="text-sm">📅 Schedule & Calendar Details (తేదీ & సమయ పట్టిక)</span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Calendar Integration
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>Event / Schedule Date (తేదీ)</span>
                      </label>
                      <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>Time / Hours (సమయం)</span>
                      </label>
                      <input
                        type="text"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        placeholder="e.g. 10:00 AM - 12:30 PM"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>Category / Event Type</span>
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                      >
                        {EVENT_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.icon} {t.labelEn} ({t.labelTe})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>Venue / Location (స్థలం)</span>
                      </label>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="e.g. Main Fellowship Hall, Upper Room"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-[#C59B27]" />
                        <span>Recurrence (పునరావృతం)</span>
                      </label>
                      <select
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                      >
                        {RECURRENCE_OPTIONS.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Cross-post Drawer */}
              {showMultiPageSelect && (
                <div className="mx-6 md:mx-12 mt-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Cross-post to other pages:</span>
                    <button
                      type="button"
                      onClick={() => setShowMultiPageSelect(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
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
              )}

              {/* Media Attachments Drawer */}
              {showMediaAttachments && (
                <div className="mx-6 md:mx-12 mt-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Attachments & External Links:</span>
                    <button
                      type="button"
                      onClick={() => setShowMediaAttachments(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Video URL (YouTube)</label>
                      <input
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Audio URL (Audio Link)</label>
                      <input
                        type="url"
                        value={audioUrl}
                        onChange={(e) => setAudioUrl(e.target.value)}
                        placeholder="https://example.com/audio.mp3"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Document / PDF Link</label>
                      <input
                        type="url"
                        value={fileUrl}
                        onChange={(e) => setFileUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Download Link</label>
                      <input
                        type="url"
                        value={downloadUrl}
                        onChange={(e) => setDownloadUrl(e.target.value)}
                        placeholder="https://drive.google.com/uc?export=download&id=..."
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        <span>Website URL Embed</span>
                      </label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. BlockNote Notion Block Editor (Snippet 2 & 3) */}
              <div className="px-6 md:px-12 py-2">
                <NotionEditor
                  initialContent={desc}
                  onChange={setDesc}
                  editable={true}
                />
              </div>

              {/* 5. Bottom Notion Action Bar */}
              <div className="mx-6 md:mx-12 pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setIsFormOpen(false); setEditingItem(null); }}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer transition"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveContent}
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#F4B942]" />
                  <span>
                    {formSubmitting
                      ? 'Saving...'
                      : editingItem
                      ? 'Save Changes'
                      : 'Publish Content'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeArticle ? (
          <article className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 md:p-12 lg:p-14 shadow-md w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-200">
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

              </div>

              <h1
                className={`text-2xl sm:text-4xl font-extrabold text-[#071B3B] leading-tight tracking-tight flex items-center gap-3 ${
                  isTelugu ? 'font-krishna text-3xl sm:text-5xl' : 'font-serif'
                }`}
              >
                {activeArticle.icon && (
                  <span className="text-3xl sm:text-5xl select-none shrink-0">{activeArticle.icon}</span>
                )}
                <span>{getText(activeArticle, 'title')}</span>
              </h1>
            </div>

            {/* Sacred Schedule & Calendar Details Banner (If scheduled item) */}
            {(activeArticle.eventDate || activeArticle.eventTime || activeArticle.eventLocation) && (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-50/80 via-white to-slate-50 border-2 border-[#C59B27]/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-0.5 rounded-full bg-[#071B3B] text-[#F4B942] text-[10px] font-black uppercase tracking-wider">
                      📅 Scheduled Service / Event
                    </span>
                    {activeArticle.eventType && (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-bold">
                        {activeArticle.eventType}
                      </span>
                    )}
                    {activeArticle.recurrence && activeArticle.recurrence !== 'none' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                        Repeat: {activeArticle.recurrence.replace('weekly_', '').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-800 font-bold flex-wrap">
                    {activeArticle.eventDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#C59B27]" />
                        <span>{formatReadableDate(activeArticle.eventDate, isTelugu)}</span>
                      </span>
                    )}
                    {activeArticle.eventTime && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#C59B27]" />
                        <span>{activeArticle.eventTime}</span>
                      </span>
                    )}
                    {activeArticle.eventLocation && (
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span>{activeArticle.eventLocation}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <a
                    href={getGoogleCalendarUrl(activeArticle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Add to Google Calendar</span>
                  </a>
                  <button
                    type="button"
                    onClick={(e) => downloadICSFile(activeArticle, e)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>Download .ICS</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCopySchedule(activeArticle, e)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 transition cursor-pointer"
                  >
                    {copiedScheduleId === activeArticle.id ? (
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Copy Schedule</span>
                  </button>
                </div>
              </div>
            )}

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

            {/* Direct Download Button */}
            {activeArticle.downloadUrl && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-[#F4B942] flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#F4B942] text-[#071B3B] flex items-center justify-center shrink-0 shadow-md">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-[#071B3B]">
                      Direct Download Available
                    </h4>
                    <p className="text-xs text-slate-600">
                      Click to download the attached resource instantly
                    </p>
                  </div>
                </div>
                <a
                  href={activeArticle.downloadUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] text-xs font-bold uppercase tracking-wider transition shrink-0 inline-flex items-center gap-2 shadow-md hover:scale-102 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Now</span>
                </a>
              </div>
            )}

            {/* Interactive Website URL Live Embed */}
            {(activeArticle.websiteUrl || activeArticle.embedUrl) && (
              <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-md space-y-0">
                <div className="p-3.5 sm:p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 truncate">
                    <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate max-w-xs sm:max-w-md">{activeArticle.websiteUrl || activeArticle.embedUrl}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      Live Embed
                    </span>
                  </div>
                  <a
                    href={activeArticle.websiteUrl || activeArticle.embedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <div className="w-full h-[560px] sm:h-[720px] md:h-[820px] lg:h-[900px] xl:h-[960px] bg-slate-50 relative">
                  <iframe
                    src={activeArticle.websiteUrl || activeArticle.embedUrl}
                    title="Embedded Website"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    loading="lazy"
                    className="w-full h-full border-0"
                  />
                </div>
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
          <div className="space-y-4">
            {/* Calendar & Schedule Tracking Hub for New Updates, Events & Schedule */}
            {isCalendarPage && (
              <CalendarScheduleHub
                pageSlug={pageSlug}
                pageTitle={pageTitle}
                contents={contents}
                selectedDate={selectedCalendarDate}
                onSelectDate={setSelectedCalendarDate}
                dateRangePreset={calendarDateRange}
                onChangeDatePreset={setCalendarDateRange}
                selectedEventType={calendarEventType}
                onChangeEventType={setCalendarEventType}
                onOpenAddSchedule={(dStr) => handleOpenAddForm(dStr)}
                onOpenArticle={(item) => navigate(`/Home/${categorySlug || 'worship'}/${pageSlug || 'sermons'}/${item.id}`)}
                isAdmin={isAdmin}
                isTelugu={isTelugu}
                viewMode={viewMode}
                onToggleViewMode={setViewMode}
              />
            )}

            {/* Notion-Style Organization Controls: Search, Filter Tabs, Sort, and 5 Views */}
            <div className="space-y-3 border-b border-slate-200 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isTelugu ? 'పేజీలో వెతకండి...' : `Search in ${pageTitle}...`}
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40 transition"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Sort & View Switcher */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none font-semibold cursor-pointer shadow-2xs"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="eventDate">Schedule Date (Earliest First)</option>
                    <option value="title">Alphabetical (A - Z)</option>
                  </select>

                  {/* 5 Views: Calendar, Grid, List, Table, Compact */}
                  <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setViewMode('calendar')}
                      className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                        viewMode === 'calendar'
                          ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Calendar & Timeline View"
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Grid / Gallery View"
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
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        viewMode === 'table'
                          ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Database Table View"
                    >
                      <Table className="w-4 h-4" />
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
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none text-xs">
                {[
                  { key: 'all', label: `All (${contents.length})` },
                  { key: 'pinned', label: '📌 Pinned' },
                  { key: 'video', label: '🎥 Videos' },
                  { key: 'audio', label: '🎵 Audio' },
                  { key: 'file', label: '📄 Documents' },
                  { key: 'link', label: '🔗 Links & Embeds' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterType(tab.key)}
                    className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer border text-xs ${
                      filterType === tab.key
                        ? 'bg-[#071B3B] text-[#F4B942] border-[#071B3B] shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
                {displayContents.length !== contents.length && (
                  <span className="text-[11px] text-slate-400 ml-auto whitespace-nowrap">
                    Showing {displayContents.length} of {contents.length}
                  </span>
                )}
              </div>
            </div>

            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
                {displayContents.map((item) => {
                  const itemTitle = getText(item, 'title');
                  const itemDesc = getDesc(item);

                  return (
                    <article
                      key={item.id}
                      onClick={() => navigate(`/Home/${categorySlug || 'worship'}/${pageSlug || 'sermons'}/${item.id}`)}
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
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#C59B27] uppercase tracking-wider text-[10px]">
                                {pageTitle}
                              </span>
                              {item.isPinned && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-[#071B3B] font-extrabold text-[10px]">
                                  📌 Pinned
                                </span>
                              )}
                            </div>
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
                            className={`text-lg font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors leading-snug mb-2 flex items-center gap-1.5 ${
                              isTelugu ? 'font-telugu' : 'font-serif'
                            }`}
                          >
                            {item.icon && <span className="text-xl select-none shrink-0">{item.icon}</span>}
                            <span>{itemTitle}</span>
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
                          {(item.websiteUrl || item.embedUrl) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                              <Globe className="w-2.5 h-2.5" />
                              <span>Website</span>
                            </span>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleTogglePin(item.id, item.isPinned, e)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                item.isPinned ? 'text-[#C59B27] bg-amber-50' : 'text-slate-400 hover:text-slate-700'
                              }`}
                              title={item.isPinned ? 'Unpin' : 'Pin to top'}
                            >
                              <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-current' : ''}`} />
                            </button>
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
            {/* HERO FEATURED STORY */}
            {viewMode === 'list' && displayContents.length > 0 && !searchTerm && filterType === 'all' && (
              <div
                onClick={() => navigate(`/Home/${categorySlug || 'worship'}/${pageSlug || 'sermons'}/${displayContents[0].id}`)}
                className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition cursor-pointer grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-6 group mb-6"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100">
                  <img
                    src={displayContents[0].imageUrl || "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80"}
                    alt={getText(displayContents[0], 'title')}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col justify-between py-2 space-y-3">
                  <div className="space-y-2">
                    {displayContents[0].isPinned && (
                      <span className="text-xs font-bold text-[#C59B27] uppercase tracking-wider inline-flex items-center gap-1">
                        📌 Pinned Message
                      </span>
                    )}
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-serif text-[#071B3B] group-hover:text-amber-600 transition-colors leading-snug">
                      {getText(displayContents[0], 'title')}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {getDesc(displayContents[0]).replace(/<[^>]*>/g, '')}
                    </p>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 group-hover:text-amber-600 group-hover:underline">
                      <span>Read more</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* WATV EDITORIAL LIST VIEW (Matching Image 1) */}
            {viewMode === 'list' && (
              <div className="divide-y divide-slate-200 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                {displayContents.map((item, idx) => {
                  const itemTitle = getText(item, 'title');
                  const itemDesc = getDesc(item).replace(/<[^>]*>/g, '');

                  return (
                    <article
                      key={item.id}
                      onClick={() => navigate(`/Home/${categorySlug || 'worship'}/${pageSlug || 'sermons'}/${item.id}`)}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-5 hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      {/* Left Thumbnail (Image 1) */}
                      <div className="w-full sm:w-56 md:w-64 aspect-video sm:aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                        <img
                          src={item.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80"}
                          alt={itemTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Right Text (Image 1) */}
                      <div className="flex-1 min-w-0 space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {item.isPinned && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-[#071B3B] font-extrabold text-[10px]">
                                📌 Pinned
                              </span>
                            )}
                            <span className="text-[11px] font-semibold text-slate-400">
                              {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Recent'}
                            </span>
                          </div>

                          <h3 className="text-base sm:text-xl font-bold font-serif text-[#071B3B] group-hover:text-amber-600 transition-colors leading-snug">
                            {itemTitle}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mt-1">
                            {itemDesc}
                          </p>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center justify-between pt-2 text-xs">
                          <div className="flex items-center gap-2 text-[11px]">
                            {item.videoUrl && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold">
                                <Play className="w-2.5 h-2.5" /> Video
                              </span>
                            )}
                            {item.audioUrl && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold">
                                <Music className="w-2.5 h-2.5" /> Audio
                              </span>
                            )}
                            {item.fileUrl && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">
                                <FileText className="w-2.5 h-2.5" /> PDF
                              </span>
                            )}
                            {(item.websiteUrl || item.embedUrl) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                                <Globe className="w-2.5 h-2.5" /> Link
                              </span>
                            )}
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleTogglePin(item.id, item.isPinned, e)}
                                className="p-1 text-slate-400 hover:text-amber-600 rounded"
                                title="Pin"
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditForm(item, e)}
                                className="p-1 text-slate-400 hover:text-amber-600 rounded"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteContent(item.id, e)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* NOTION DATABASE TABLE VIEW */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] select-none">
                      <th className="py-3 px-3 w-10 text-center">Pin</th>
                      <th className="py-3 px-4 min-w-[260px]">Title & Note</th>
                      <th className="py-3 px-3 w-44">Media / Embed</th>
                      <th className="py-3 px-3 w-36">Page</th>
                      <th className="py-3 px-3 w-28">Created</th>
                      {isAdmin && <th className="py-3 px-4 w-24 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayContents.map((item) => {
                      const itemTitle = getText(item, 'title');
                      const itemDesc = getDesc(item);

                      return (
                        <tr
                          key={item.id}
                          onClick={() => navigate(`/Home/${categorySlug || 'worship'}/${pageSlug || 'sermons'}/${item.id}`)}
                          className="hover:bg-amber-50/30 transition cursor-pointer group"
                        >
                          {/* Pin Toggle */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={(e) => handleTogglePin(item.id, item.isPinned, e)}
                                className={`p-1 rounded-md transition cursor-pointer ${
                                  item.isPinned
                                    ? 'text-[#C59B27] bg-amber-50'
                                    : 'text-slate-300 hover:text-slate-600'
                                }`}
                                title={item.isPinned ? 'Unpin from top' : 'Pin to top'}
                              >
                                <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-current' : ''}`} />
                              </button>
                            ) : item.isPinned ? (
                              <span className="text-[#C59B27]" title="Pinned">📌</span>
                            ) : (
                              <span className="text-slate-200">•</span>
                            )}
                          </td>

                          {/* Title with icon & subtitle */}
                          <td className="py-3 px-4 min-w-[260px]">
                            <div className="flex items-center gap-2">
                              <span className="text-base select-none shrink-0">{item.icon || '📖'}</span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                                  {itemTitle}
                                </h4>
                                {itemDesc && (
                                  <p className="text-[11px] text-slate-400 line-clamp-1">
                                    {itemDesc.replace(/<[^>]*>/g, '')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Media Pills */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {item.videoUrl && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold">
                                  <Play className="w-2.5 h-2.5" /> Video
                                </span>
                              )}
                              {item.audioUrl && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                                  <Music className="w-2.5 h-2.5" /> Audio
                                </span>
                              )}
                              {item.fileUrl && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                                  <FileText className="w-2.5 h-2.5" /> PDF
                                </span>
                              )}
                              {(item.websiteUrl || item.embedUrl) && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                                  <Globe className="w-2.5 h-2.5" /> Link
                                </span>
                              )}
                              {!item.videoUrl && !item.audioUrl && !item.fileUrl && !item.websiteUrl && !item.embedUrl && (
                                <span className="text-slate-300 text-[11px]">—</span>
                              )}
                            </div>
                          </td>

                          {/* Page */}
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-[#071B3B] font-semibold text-[10px] truncate max-w-[120px]">
                              {item.pageSlug || pageSlug}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {item.createdAt?.toDate
                              ? item.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Recent'}
                          </td>

                          {/* Admin Actions */}
                          {isAdmin && (
                            <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditForm(item, e)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteContent(item.id, e)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* COMPACT VIEW */}
            {viewMode === 'compact' && (
              <div className="space-y-1.5">
                {displayContents.map((item) => {
                  const itemTitle = getText(item, 'title');
                  const itemDesc = getDesc(item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/Home/${categorySlug || 'worship'}/${pageSlug || 'sermons'}/${item.id}`)}
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
                          {(item.eventDate || item.eventTime) && (
                            <span className="text-[11px] font-semibold text-amber-700 block truncate">
                              📅 {formatReadableDate(item.eventDate, isTelugu)} {item.eventTime ? `• ${item.eventTime}` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={getGoogleCalendarUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                            title="Add to Google Calendar"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => downloadICSFile(item, e)}
                            className="p-1 text-slate-400 hover:text-amber-600 rounded transition cursor-pointer"
                            title="Download .ICS file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

            {/* CALENDAR & TIMELINE AGENDA VIEW */}
            {viewMode === 'calendar' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-[#C59B27]" />
                    <h3 className="text-base sm:text-lg font-black text-[#071B3B]">
                      {selectedCalendarDate
                        ? `Schedules for ${formatReadableDate(selectedCalendarDate, isTelugu)}`
                        : 'Upcoming Schedule Timeline'}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {displayContents.length} {displayContents.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenAddForm(selectedCalendarDate)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Schedule</span>
                    </button>
                  )}
                </div>

                {displayContents.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                      <CalendarDays className="w-7 h-7" />
                    </div>
                    <h4 className="text-base font-bold text-slate-800">
                      {selectedCalendarDate ? 'No schedules found on this date' : 'No upcoming schedules available'}
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {selectedCalendarDate
                        ? `There are no scheduled worship services or events recorded for ${formatReadableDate(selectedCalendarDate, isTelugu)}.`
                        : 'Use the calendar controls above to explore dates or schedule a new service.'}
                    </p>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenAddForm(selectedCalendarDate)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Schedule on this Date</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayContents.map((item) => {
                      const itemTitle = getText(item, 'title');
                      const itemDesc = getDesc(item).replace(/<[^>]*>/g, '');
                      const itemDateStr = getItemDateStr(item);

                      return (
                        <div
                          key={item.id}
                          onClick={() => navigate(`/Home/${categorySlug || 'worship'}/${pageSlug || 'sermons'}/${item.id}`)}
                          className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer hover:-translate-y-1 hover:border-[#C59B27]/60"
                        >
                          <div className="space-y-3">
                            {/* Card Top Pill: Date, Time & Event Type */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              {item.eventType && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/80 text-[10px] font-black uppercase tracking-wider">
                                  <span>📌 {item.eventType}</span>
                                </span>
                              )}
                              {item.isPinned && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-[#071B3B] font-extrabold text-[10px]">
                                  📌 Pinned
                                </span>
                              )}
                            </div>

                            {/* Schedule Date & Time Highlighting */}
                            <div className="p-3 rounded-2xl bg-amber-50/70 border border-[#C59B27]/30 flex items-center justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs font-black text-[#071B3B]">
                                  <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                                  <span>{formatReadableDate(itemDateStr, isTelugu) || 'Schedule Date'}</span>
                                </div>
                                {item.eventTime && (
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                                    <Clock className="w-3 h-3 text-[#C59B27]" />
                                    <span>{item.eventTime}</span>
                                  </div>
                                )}
                              </div>
                              {item.recurrence && item.recurrence !== 'none' && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-amber-200 text-amber-900 shrink-0">
                                  Repeat: {item.recurrence.replace('weekly_', '').toUpperCase()}
                                </span>
                              )}
                            </div>

                            {/* Venue / Location */}
                            {item.eventLocation && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span className="truncate">{item.eventLocation}</span>
                              </div>
                            )}

                            {/* Title & Description */}
                            <h4 className="text-base sm:text-lg font-bold text-[#071B3B] group-hover:text-[#C59B27] transition-colors leading-snug line-clamp-2">
                              {item.icon && <span className="mr-1.5 select-none">{item.icon}</span>}
                              <span>{itemTitle}</span>
                            </h4>

                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                              {itemDesc}
                            </p>
                          </div>

                          {/* Action Footer: Calendar Export & Copy */}
                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={getGoogleCalendarUrl(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[11px] font-bold transition border border-slate-200/80"
                                title="Add to Google Calendar"
                              >
                                <CalendarPlus className="w-3 h-3 text-[#C59B27]" />
                                <span>Google</span>
                              </a>
                              <button
                                type="button"
                                onClick={(e) => downloadICSFile(item, e)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 text-[11px] font-bold transition border border-slate-200/80 cursor-pointer"
                                title="Download .ICS file"
                              >
                                <Download className="w-3 h-3 text-[#C59B27]" />
                                <span>.ICS</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleCopySchedule(item, e)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                                title="Copy Schedule"
                              >
                                {copiedScheduleId === item.id ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {isAdmin && (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEditForm(item, e)}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Edit schedule"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteContent(item.id, e)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Delete schedule"
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
            )}
          </div>
        ) : (
          /* Notion Empty State (Snippet 1) with Calendar integration */
          <div className="space-y-6">
            {isCalendarPage && (
              <CalendarScheduleHub
                pageSlug={pageSlug}
                pageTitle={pageTitle}
                contents={[]}
                selectedDate={selectedCalendarDate}
                onSelectDate={setSelectedCalendarDate}
                dateRangePreset={calendarDateRange}
                onChangeDatePreset={setCalendarDateRange}
                selectedEventType={calendarEventType}
                onChangeEventType={setCalendarEventType}
                onOpenAddSchedule={(dStr) => handleOpenAddForm(dStr)}
                onOpenArticle={() => {}}
                isAdmin={isAdmin}
                isTelugu={isTelugu}
                viewMode={viewMode}
                onToggleViewMode={setViewMode}
              />
            )}
            <NotionEmpty pageTitle={pageTitle} onCreate={handleOpenAddForm} />
          </div>
        )}
      </main>
    </div>
  );
}
