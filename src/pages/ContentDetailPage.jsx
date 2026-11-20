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
  MessageSquare,
  Send,
  MessageCircle,
  Music,
  Download,
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
  const [submitting, setSubmitting] = useState(false);

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
            setImageUrl(data.imageUrl || '');
            setVideoUrl(data.videoUrl || '');
            setAudioUrl(data.audioUrl || '');
            setFileUrl(data.fileUrl || '');
            setDownloadUrl(data.downloadUrl || '');

            // Keep address bar in clean semantic format: sni.org.in/Home/:category/:page/:contentId
            const cat = data.categorySlug || paramCategorySlug || 'worship';
            const page = data.pageSlug || paramPageSlug || 'sermons';
            const desiredUrl = `/Home/${cat}/${page}/${data.id}`;
            if (window.location.pathname !== desiredUrl && !window.location.pathname.toLowerCase().startsWith('/home/')) {
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
      window.location.href = '/auth.html';
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
      window.location.href = '/auth.html';
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
        imageUrl: imageUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
        audioUrl: audioUrl.trim() || null,
        fileUrl: fileUrl.trim() || null,
        downloadUrl: downloadUrl.trim() || null,
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
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* Top Banner Navigation Header */}
      <section className="bg-gradient-to-r from-[#071B3B] via-[#0F294A] to-[#122847] text-white pt-8 pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#1A3860]">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Breadcrumb Links: Home > Category > Page > Content Title */}
          <nav className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
            <Link to="/" className="hover:text-[#F4B942] transition font-bold text-white">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <Link
              to={`/category/${currentCategorySlug}`}
              className="hover:text-[#F4B942] uppercase font-bold text-[#F4B942] transition"
            >
              {categoryTitle}
            </Link>
            {article.pageSlug && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <Link
                  to={`/page/${currentCategorySlug}/${article.pageSlug}`}
                  className="hover:text-[#F4B942] capitalize font-medium text-slate-200 transition"
                >
                  {subPageTitle}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[#F4B942] font-bold truncate max-w-xs">{articleTitle}</span>
          </nav>

          <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
            <Link
              to={backUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10"
            >
              <ArrowLeft className="w-4 h-4 text-[#F4B942]" />
              <span>← Back</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Heart Symbol / Like Button with Live Count and Floating Hearts */}
              <div className="relative">
                <button
                  onClick={handleToggleLike}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isLiked
                      ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15'
                  }`}
                  title={isLiked ? 'Liked' : 'Like'}
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-transform ${
                      isLiked ? 'fill-current text-white scale-110' : 'text-rose-400'
                    }`}
                  />
                  <span>{likesCount}</span>
                </button>
                {floatingHearts.map((h) => (
                  <span
                    key={h.id}
                    className="absolute top-0 left-1/2 -translate-x-1/2 animate-float-heart text-rose-500 text-sm select-none"
                    style={{
                      '--tw-translate-x': `${h.x}px`,
                      animationDelay: `${h.delay}s`,
                    }}
                  >
                    ❤️
                  </span>
                ))}
              </div>

              <AudioSpeakerButton text={articleDesc} title={articleTitle} />

              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#071B3B] text-xs font-bold transition cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition cursor-pointer"
                    title="Delete Article"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2nd Header: Subpage Navigation Bar for this Category */}
      {subPages.length > 0 && (
        <div className="bg-[#0A2244] border-b border-[#1A3860] sticky top-[65px] z-40 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
            <Link
              to={`/category/${currentCategorySlug}`}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition shrink-0"
            >
              {isTelugu ? 'అన్ని' : 'All'}
            </Link>
            {subPages.map((sp) => {
              const isCurrent = sp.pageSlug === article?.pageSlug;
              return (
                <Link
                  key={sp.pageSlug}
                  to={`/page/${currentCategorySlug}/${sp.pageSlug}`}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition shrink-0 ${
                    isCurrent
                      ? 'bg-[#C59B27] text-[#071B3B] shadow-md ring-1 ring-[#C59B27]'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isTelugu ? sp.titleTe : sp.titleEn}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Admin In-Page Edit Drawer */}
        {isEditing && (
          <div className="mb-8 p-6 rounded-3xl bg-white border border-[#C59B27]/50 shadow-2xl animate-in fade-in duration-200">
            <h3 className="text-base font-bold text-[#0F294A] mb-4 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#C59B27]" />
              <span>Edit Article Details</span>
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              {/* Single Unified Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>

              {/* Single Unified Rich Content Editor */}
              <RichTextEditor
                label="Content (Rich Text Editor)"
                value={desc}
                onChange={setDesc}
                rows={8}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Image Cover URL (optional)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Video URL (YouTube or Direct Link)</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Audio URL (YouTube or Direct Link)</label>
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="https://example.com/audio.mp3"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Document / File URL (PDF, Drive link)</label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://example.com/document.pdf"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Direct Download URL (Instant download link)</label>
                  <input
                    type="url"
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    placeholder="https://drive.google.com/uc?export=download&id=..."
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold uppercase tracking-wider shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* The Dedicated Full Page Article View */}
        <article className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-12 shadow-xl space-y-8 animate-in fade-in duration-200">
          {/* Header Metadata */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              {article.pageSlug && (
                <span className="px-3 py-1 rounded-full bg-amber-50 text-[#C59B27] border border-[#C59B27]/40 font-bold uppercase text-[10px] tracking-wider">
                  {article.pageSlug}
                </span>
              )}

              {article.createdAt && (
                <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>
                    {article.createdAt?.toDate
                      ? article.createdAt.toDate().toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Recent'}
                  </span>
                </span>
              )}
            </div>

            {/* Main Headline */}
            <h1
              className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#071B3B] leading-tight tracking-tight ${
                isTelugu ? 'font-krishna text-3xl sm:text-5xl' : 'font-serif'
              }`}
            >
              {articleTitle}
            </h1>
          </div>

          {/* Featured Cover Image */}
          {article.imageUrl && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md max-h-[540px] bg-slate-100">
              <img
                src={article.imageUrl}
                alt={articleTitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Video Player */}
          {article.videoUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-md">
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

          {/* Audio Player */}
          {article.audioUrl && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#071B3B] to-[#0F294A] text-white border border-[#1A3860] shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-[#F4B942] flex items-center justify-center">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">Audio Stream</h4>
                    <p className="text-[10px] text-slate-300">Listen to attached audio broadcast</p>
                  </div>
                </div>
              </div>
              {getYouTubeEmbedUrl(article.audioUrl) ? (
                <div className="aspect-video w-full max-h-48 rounded-xl overflow-hidden">
                  <iframe
                    src={getYouTubeEmbedUrl(article.audioUrl)}
                    title="Audio Broadcast"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <audio
                  controls
                  className="w-full h-10 rounded-lg outline-none"
                  src={article.audioUrl}
                  preload="metadata"
                >
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          )}

          {/* Rich Content Body */}
          <div className="pt-2">
            <RichContentRenderer
              content={articleDesc}
              isTelugu={isTelugu}
              className="text-base sm:text-lg"
            />
          </div>

          {/* Direct Download Button (Prominently displayed) */}
          {article.downloadUrl && (
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
                href={article.downloadUrl}
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

          {/* File Attachment Card */}
          {article.fileUrl && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-[#C59B27]/40 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#071B3B] text-[#F4B942] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#071B3B]">
                    Official Study Attachment / PDF
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate max-w-sm">
                    {article.fileUrl}
                  </p>
                </div>
              </div>
              <a
                href={article.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-[#071B3B] text-[#F4B942] text-xs font-bold hover:bg-[#0F294A] transition shrink-0 inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Download Resource</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Bottom Bar: Back Navigation, Heart Like, and Social Share */}
          <div className="pt-8 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <Link
              to={backUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#C59B27]" />
              <span>← Back to Page</span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Heart Symbol / Like Button: ONLY count, floating hearts animation */}
              <div className="relative">
                <button
                  onClick={handleToggleLike}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition cursor-pointer shadow-xs border ${
                    isLiked
                      ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100 scale-105'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-rose-300'
                  }`}
                  title={isLiked ? 'Liked' : 'Like'}
                >
                  <Heart
                    className={`w-4 h-4 transition-transform ${
                      isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400 group-hover:text-rose-500'
                    }`}
                  />
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
                    navigator.share({
                      title: articleTitle,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Page link copied to clipboard!');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-[#C59B27]" />
                <span>Share</span>
              </button>
            </div>
            </div>
          </article>

          {/* ======================================================== */}
          {/* COMMENTS SECTION                                         */}
          {/* ======================================================== */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6 mt-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#C59B27] flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#C59B27]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#071B3B]">
                    Comments ({comments.length})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Share your thoughts, reflections, or questions on this content.
                  </p>
                </div>
              </div>
            </div>

            {/* New Comment Input Box */}
            <form onSubmit={handlePostComment} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0F294A] text-[#F4B942] flex items-center justify-center font-bold text-xs uppercase shrink-0 mt-1 shadow-xs">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : (currentUser?.email?.charAt(0).toUpperCase() || 'U')}
                </div>
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write your comment or reflection here..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-[#C59B27] transition"
                    required
                  />
                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingComment ? 'Submitting...' : 'Post Comment'}</span>
                    </button>
                  </div>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-3">
            {comments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                <MessageCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium">
                  No comments yet. Be the first to share your reflection!
                </p>
              </div>
            ) : (
              comments.map((c) => {
                const isAuthorOrAdmin = isAdmin || (currentUser && c.authorEmail === currentUser.email);
                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#C59B27]/20 text-[#071B3B] font-bold text-xs flex items-center justify-center">
                          {c.authorName ? c.authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{c.authorName}</span>
                            {c.authorRole && c.authorRole !== 'member' && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider">
                                {c.authorRole}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : 'Recent'}
                          </span>
                        </div>
                      </div>

                      {isAuthorOrAdmin && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-10 whitespace-pre-wrap">
                      {c.text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
