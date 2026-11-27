import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RichTextEditor from '../components/RichTextEditor';
import RichContentRenderer from '../components/RichContentRenderer';
import AudioSpeakerButton from '../components/AudioSpeakerButton';
import { NotionCover, NotionToolbar, NotionEditor, NotionLinkPreview, NotionEmbedDrawer } from '../components/notion';
import WATVSubNav from '../components/WATVSubNav';
import { DEFAULT_PORTAL_STRUCTURE } from '../config/portalStructure';
import {
  Calendar,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Play,
  FileText,
  Share2,
  Pencil,
  Trash2,
  Clock,
  User,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Heart,
  Sparkles,
  Check,
  X,
  MessageSquare,
  Send,
  MessageCircle,
  Music,
  Download,
  Globe,
  ChevronDown,
  Paperclip,
} from 'lucide-react';

export default function ContentDetailPage() {
  const { contentId, categorySlug: paramCategorySlug, pageSlug: paramPageSlug } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { isTelugu, getText, getDesc } = useLanguage();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [sourceCollection, setSourceCollection] = useState('page_contents');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comments & Fellowship state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState([]);

  // Admin edit form state - Unified Single Language Input
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [showEditMedia, setShowEditMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);

  // Notion Editor states for Edit mode
  const [icon, setIcon] = useState('📖');
  const [targetPages, setTargetPages] = useState([]);
  const [showMediaAttachments, setShowMediaAttachments] = useState(false);
  const [showMultiPageSelect, setShowMultiPageSelect] = useState(false);
  const [showEmbedDrawer, setShowEmbedDrawer] = useState(false);

  // Flattened available pages
  const allAvailablePages = DEFAULT_PORTAL_STRUCTURE.flatMap((cat) =>
    cat.pages.map((p) => ({
      pageSlug: p.pageSlug,
      title: p.titleEn,
      categorySlug: cat.categorySlug,
      categoryTitle: cat.titleEn,
    }))
  );

  const isAdmin =
    userProfile?.role === 'admin' ||
    currentUser?.email === 'surya11008@sni.org.in' ||
    currentUser?.email === 'admin@sni.org.in' ||
    currentUser?.email?.startsWith('surya');

  // Fetch article by ID
  useEffect(() => {
    let isMounted = true;
    async function loadArticle() {
      if (!contentId) return;
      setLoading(true);
      setError('');
      try {
        const docRef = doc(db, 'page_contents', contentId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          if (isMounted) {
            setArticle(data);
            setSourceCollection('page_contents');
            setTitle(data.title || data.titleEn || data.titleTe || '');
            setDesc(data.desc || data.content || data.descEn || data.descTe || '');
            setIcon(data.icon || '📖');
            setImageUrl(data.imageUrl || '');
            setVideoUrl(data.videoUrl || '');
            setAudioUrl(data.audioUrl || '');
            setFileUrl(data.fileUrl || '');
            setDownloadUrl(data.downloadUrl || '');
            setWebsiteUrl(data.websiteUrl || data.embedUrl || '');
            setTargetPages(data.targetPages && data.targetPages.length > 0 ? data.targetPages : [data.pageSlug || paramPageSlug]);

            // Keep address bar in clean semantic format: sni.org.in/Home/Worship/Sermons/:contentId
            const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
            const cat = cap(data.categorySlug || paramCategorySlug || 'worship');
            const page = cap(data.pageSlug || paramPageSlug || 'sermons');
            const desiredUrl = `/Home/${cat}/${page}/${data.id}`;
            if (window.location.pathname !== desiredUrl) {
              window.history.replaceState(null, '', desiredUrl);
            }
          }
        } else {
          // Check announcements collection as fallback
          const annRef = doc(db, 'announcements', contentId);
          const annSnap = await getDoc(annRef);
          if (annSnap.exists()) {
            const data = { id: annSnap.id, ...annSnap.data(), categorySlug: 'home', pageSlug: 'announcements' };
            if (isMounted) {
              setArticle(data);
              setSourceCollection('announcements');
              setTitle(data.title || data.titleEn || data.titleTe || '');
              setDesc(data.desc || data.content || data.descEn || data.descTe || '');
              setImageUrl(data.imageUrl || '');
            }
          } else {
            if (isMounted) setError('The requested article could not be found.');
          }
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        if (isMounted) setError('Failed to load content: ' + err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadArticle();
    return () => {
      isMounted = false;
    };
  }, [contentId]);

  // Fetch related posts from same category or page
  useEffect(() => {
    async function fetchRelated() {
      if (!article?.pageSlug && !article?.categorySlug) return;
      try {
        const snap = await getDocs(collection(db, 'page_contents'));
        const items = [];
        snap.forEach((d) => {
          if (d.id !== contentId) {
            const data = d.data();
            const samePage = data.pageSlug === article.pageSlug;
            const sameCat = data.categorySlug === article.categorySlug;
            if (samePage || sameCat) {
              items.push({ id: d.id, ...data });
            }
          }
        });
        setRelatedPosts(items.slice(0, 3));
      } catch (e) {
        console.warn('Error fetching related posts:', e);
      }
    }
    fetchRelated();
  }, [article, contentId]);

  // Real-time listener for comments on this content
  useEffect(() => {
    if (!contentId) return;
    try {
      const commentsRef = collection(db, sourceCollection, contentId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const items = [];
          snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
          setComments(items);
        },
        (err) => {
          console.warn('Comments query with index failed, using fallback:', err);
          const unsubFallback = onSnapshot(
            collection(db, sourceCollection, contentId, 'comments'),
            (snapshot) => {
              const items = [];
              snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
              items.sort((a, b) => {
                const tA = a.createdAt?.seconds || 0;
                const tB = b.createdAt?.seconds || 0;
                return tB - tA;
              });
              setComments(items);
            }
          );
          return () => unsubFallback();
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Error setting up comments listener:', e);
    }
  }, [contentId, sourceCollection]);

  // Likes calculation and toggle handler
  const userKey = currentUser?.email || currentUser?.uid || '';
  const likedByList = Array.isArray(article?.likedBy) ? article.likedBy : [];
  const isLiked = userKey ? likedByList.includes(userKey) : false;
  const likesCount =
    typeof article?.likesCount === 'number'
      ? article.likesCount
      : likedByList.length;

  const handleToggleLike = async () => {
    if (!currentUser) {
      window.location.href = '/signin';
      return;
    }
    const currentlyLiked = isLiked;
    const newLikedBy = currentlyLiked
      ? likedByList.filter((k) => k !== userKey)
      : [...likedByList, userKey];
    const newCount = newLikedBy.length;

    // Optimistic UI state update
    setArticle((prev) => ({
      ...prev,
      likedBy: newLikedBy,
      likesCount: newCount,
    }));

    // Trigger floating hearts animation when liked
    if (!currentlyLiked) {
      const newHearts = Array.from({ length: 6 }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        x: (Math.random() - 0.5) * 50,
        delay: i * 0.08,
      }));
      setFloatingHearts((prev) => [...prev, ...newHearts]);
      setTimeout(() => {
        setFloatingHearts((prev) => prev.filter((h) => !newHearts.some((nh) => nh.id === h.id)));
      }, 1200);
    }

    try {
      const docRef = doc(db, sourceCollection, contentId);
      await updateDoc(docRef, {
        likedBy: currentlyLiked ? arrayRemove(userKey) : arrayUnion(userKey),
        likesCount: newCount,
      });
    } catch (err) {
      console.warn('Could not sync like to server:', err);
    }
  };

  // Add Comment handler
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!currentUser) {
      window.location.href = '/signin';
      return;
    }

    setSubmittingComment(true);
    try {
      const commentPayload = {
        contentId,
        authorName:
          userProfile?.displayName ||
          currentUser?.displayName ||
          currentUser.email?.split('@')[0] ||
          'Member',
        authorEmail: currentUser.email || '',
        authorRole: userProfile?.role || 'member',
        text: commentText.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, sourceCollection, contentId, 'comments'), commentPayload);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment: ' + err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment handler
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteDoc(doc(db, sourceCollection, contentId, 'comments', commentId));
    } catch (err) {
      alert('Failed to delete comment: ' + err.message);
    }
  };

  // Extract YouTube embed
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  // Toggle page in targetPages list
  const toggleTargetPage = (slug) => {
    setTargetPages((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
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
    const token = embed.type === 'bookmark' ? `\n\n[bookmark](${embed.url})\n\n` : `\n\n[embed](${embed.url})\n\n`;
    setDesc((prev) => (prev ? prev + token : embed.url));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please provide a title for the content.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        titleEn: title.trim(),
        titleTe: title.trim(),
        desc: desc.trim(),
        descEn: desc.trim(),
        descTe: desc.trim(),
        icon: icon || '📖',
        targetPages: targetPages.length > 0 ? targetPages : [article.pageSlug || paramPageSlug],
        imageUrl: imageUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
        audioUrl: audioUrl.trim() || null,
        fileUrl: fileUrl.trim() || null,
        downloadUrl: downloadUrl.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        embedUrl: websiteUrl.trim() || null,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'page_contents', contentId), payload);
      setArticle((prev) => ({ ...prev, ...payload }));
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update article: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this article completely? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'page_contents', contentId));
      if (article.categorySlug && article.pageSlug) {
        navigate(`/page/${article.categorySlug}/${article.pageSlug}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-[#C59B27] mb-3" />
        <p className="text-xs uppercase tracking-wider font-semibold">Loading content page...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[60vh] max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Content Not Found</h2>
        <p className="text-xs text-slate-600">{error || 'This article may have been moved or removed.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F294A] text-[#F4B942] font-bold text-xs uppercase tracking-wider shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Welcome</span>
        </Link>
      </div>
    );
  }

  const articleTitle = getText(article, 'title');
  const articleDesc = getDesc(article);
  const currentCategorySlug = article?.categorySlug || paramCategorySlug || 'worship';
  const currentCategory = DEFAULT_PORTAL_STRUCTURE.find(
    (c) => c.categorySlug === currentCategorySlug
  ) || {
    categorySlug: currentCategorySlug,
    titleEn: currentCategorySlug.toUpperCase(),
    titleTe: currentCategorySlug,
    pages: [],
  };
  const categoryTitle = isTelugu ? currentCategory.titleTe : currentCategory.titleEn;
  const subPages = currentCategory.pages || [];
  const currentSubpage = subPages.find((p) => p.pageSlug === article?.pageSlug) || {
    pageSlug: article?.pageSlug || paramPageSlug || 'sermons',
    titleEn: (article?.pageSlug || paramPageSlug || 'sermons').toUpperCase(),
    titleTe: article?.pageSlug || paramPageSlug || 'sermons',
  };
  const subPageTitle = isTelugu ? currentSubpage.titleTe : currentSubpage.titleEn;

  const backUrl = article.pageSlug
    ? `/page/${currentCategorySlug}/${article.pageSlug}`
    : article.categorySlug
    ? `/category/${article.categorySlug}`
    : '/';

  return (
    <div className="min-h-screen bg-white font-sans pb-24 selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* 1. Subpage Navigation Bar (As seen in Image 1 & 5) */}
      <WATVSubNav
        categorySlug={currentCategorySlug}
        activePageSlug={article?.pageSlug || paramPageSlug}
      />

      {/* 2. Panoramic Nature/Mountain Hero Banner (As seen in Image 2) */}
      <div className="relative w-full h-[320px] sm:h-[420px] md:h-[480px] bg-slate-950 overflow-hidden">
        <img
          src={article.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2000&q=85"}
          alt={articleTitle}
          className="w-full h-full object-cover object-center brightness-90 filter"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/30 flex flex-col items-center justify-center text-center p-6 sm:p-12">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#F4B942] mb-3 drop-shadow">
            {subPageTitle || article.pageSlug || 'Sermons'}
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white max-w-4xl leading-tight tracking-tight font-serif drop-shadow-md">
            {articleTitle}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-300 mt-4 drop-shadow font-medium">
            <span>{article.viewsCount || '9,000'} views</span>
            <span>•</span>
            <span>
              {article.createdAt?.toDate
                ? article.createdAt.toDate().toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Recent'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Centered Editorial Reading Container (As seen in Image 2) */}
      <main className="w-full max-w-[800px] mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Audio Bar & Share Tool (Image 2) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            {article.audioUrl ? (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('article-audio-player');
                  if (el) el.paused ? el.play() : el.pause();
                }}
                className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-amber-600 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current text-slate-900" />
                <span>Listen 47:31</span>
                <audio id="article-audio-player" src={article.audioUrl} className="hidden" />
              </button>
            ) : (
              <AudioSpeakerButton text={articleDesc} title={articleTitle} />
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Heart Like */}
            <div className="relative">
              <button
                onClick={handleToggleLike}
                className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-rose-600 transition cursor-pointer"
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
                <span>{likesCount}</span>
              </button>
              {floatingHearts.map((h) => (
                <span
                  key={h.id}
                  className="absolute top-0 left-1/2 -translate-x-1/2 animate-float-heart text-rose-500 text-base select-none"
                  style={{
                    '--tw-translate-x': `${h.x}px`,
                    animationDelay: `${h.delay}s`,
                  }}
                >
                  ❤️
                </span>
              ))}
            </div>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: articleTitle, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Page link copied!');
                }
              }}
              className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {isAdmin && (
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-1 text-[#C59B27] font-bold hover:underline"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NOTION-STYLE DOCUMENT EDITOR FOR EDIT MODE (Matching User's Screenshot) */}
        {isEditing && (
          <div className="mb-14 bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            {/* 1. Notion Top Navigation & Action Bar */}
            <div className="px-5 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs select-none">
              <div className="flex items-center gap-2 text-slate-500 font-medium truncate">
                <Link to={`/category/${currentCategorySlug}`} className="hover:text-slate-800 transition">{categoryTitle}</Link>
                <span>/</span>
                <span className="text-slate-900 font-bold truncate">{subPageTitle}</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80 ml-1">
                  <Sparkles className="w-3 h-3 text-[#C59B27]" />
                  Notion Document (Edit Mode)
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-200/60 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={submitting}
                  className="px-5 py-1.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#F4B942]" />
                  <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
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
                pageTitle={subPageTitle}
                editable={true}
                onToggleMedia={() => setShowMediaAttachments(!showMediaAttachments)}
                onToggleMultiPage={() => setShowMultiPageSelect(!showMultiPageSelect)}
                onOpenEmbed={() => setShowEmbedDrawer(true)}
                targetPagesCount={targetPages.length}
                hasMedia={Boolean(videoUrl || audioUrl || fileUrl || downloadUrl || websiteUrl)}
              />

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

              {/* 4. BlockNote Notion Block Editor */}
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
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Discard
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 text-[#F4B942]" />
                    <span>{submitting ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Player (if attached) */}
        {article.videoUrl && (
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-md my-4">
            {getYouTubeEmbedUrl(article.videoUrl) ? (
              <div className="aspect-video w-full">
                <iframe
                  src={getYouTubeEmbedUrl(article.videoUrl)}
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
                  href={article.videoUrl}
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

        {/* Interactive Web URL / Rich Link Preview & Live Embed */}
        {(article.websiteUrl || article.embedUrl) && (
          <div className="space-y-4 my-4">
            <NotionLinkPreview
              url={article.websiteUrl || article.embedUrl}
              title={articleTitle}
              description={articleDesc}
              imageUrl={article.imageUrl}
            />

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-md space-y-0">
              <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-3 text-xs font-bold text-slate-700">
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="truncate max-w-sm">{article.websiteUrl || article.embedUrl}</span>
                </div>
                <a
                  href={article.websiteUrl || article.embedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#071B3B] hover:underline shrink-0"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="w-full h-[500px] bg-slate-50 relative">
                <iframe
                  src={article.websiteUrl || article.embedUrl}
                  title="Embedded Website"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  loading="lazy"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* File Attachment / Direct Download */}
        {(article.fileUrl || article.downloadUrl) && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-[#C59B27]/40 flex items-center justify-between gap-4 my-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#071B3B] text-[#F4B942] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#071B3B]">
                  Official Study Document / Attachment
                </h4>
                <p className="text-[10px] text-slate-500 truncate max-w-xs">
                  {article.fileUrl || article.downloadUrl}
                </p>
              </div>
            </div>
            <a
              href={article.downloadUrl || article.fileUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-[#071B3B] text-[#F4B942] text-xs font-bold hover:bg-[#0F294A] transition shrink-0 inline-flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        )}

        {/* 4. Reading Article Body (Images 2 & 3) */}
        <article className="pt-2 text-slate-800 font-serif leading-relaxed sm:leading-loose text-base sm:text-lg">
          <RichContentRenderer
            content={articleDesc}
            isTelugu={isTelugu}
            className="text-base sm:text-lg"
          />
        </article>

        {/* 5. Social Share & Centered Back Navigation (Image 3) */}
        <div className="pt-10 border-t border-slate-200 flex flex-col items-center gap-6">
          {/* Social icons: Facebook, X, Telegram, WhatsApp, Copy Link */}
          <div className="flex items-center gap-3 text-slate-500">
            <button
              type="button"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 hover:text-blue-600 flex items-center justify-center text-xs font-bold transition"
              title="Facebook"
            >
              f
            </button>
            <button
              type="button"
              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(articleTitle)}`, '_blank')}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 hover:text-black flex items-center justify-center text-xs font-bold transition"
              title="X"
            >
              𝕏
            </button>
            <button
              type="button"
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(articleTitle)}`, '_blank')}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 hover:text-sky-500 flex items-center justify-center text-xs transition"
              title="Telegram"
            >
              ✈️
            </button>
            <button
              type="button"
              onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(articleTitle + ' ' + window.location.href)}`, '_blank')}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 hover:text-emerald-600 flex items-center justify-center text-xs transition"
              title="WhatsApp"
            >
              💬
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 hover:text-amber-600 flex items-center justify-center text-xs transition"
              title="Copy link"
            >
              🔗
            </button>
          </div>

          {/* Centered Back Button (Image 3) */}
          <Link
            to={backUrl}
            className="inline-flex items-center gap-2 px-8 py-2 rounded-full border border-slate-300 hover:border-slate-800 text-slate-800 font-bold text-xs uppercase tracking-wider transition bg-white shadow-2xs hover:bg-slate-50"
          >
            <span>≡ Back</span>
          </Link>
        </div>

        {/* 6. Related Posts (3-column cards - As seen in Image 3) */}
        {relatedPosts.length > 0 && (
          <div className="pt-10 border-t border-slate-200 mt-10 space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#071B3B]">
              Related posts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => navigate(`/Home/${currentCategorySlug}/${post.pageSlug || article.pageSlug || 'sermons'}/${post.id}`)}
                  className="group cursor-pointer space-y-2.5 text-left"
                >
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={post.imageUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug font-serif">
                    {post.title || post.titleEn}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-sans">
                    {post.desc ? post.desc.replace(/<[^>]*>/g, '') : ''}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* 7. Comments Section */}
        <section className="bg-slate-50/80 rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-5 mt-10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#C59B27]" />
            <h3 className="text-sm font-bold text-slate-800">Comments ({comments.length})</h3>
          </div>

          <form onSubmit={handlePostComment} className="space-y-2.5">
            <textarea
              rows={3}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your reflection or comment..."
              className="w-full p-3 rounded-2xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-5 py-2 rounded-xl bg-[#071B3B] text-[#F4B942] text-xs font-bold uppercase disabled:opacity-50"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          {comments.length > 0 && (
            <div className="space-y-2.5 pt-2">
              {comments.map((c) => (
                <div key={c.id} className="p-3.5 bg-white rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{c.authorName}</span>
                    <span className="text-[10px] text-slate-400">
                      {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}