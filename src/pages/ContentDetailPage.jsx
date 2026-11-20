import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RichTextEditor from '../components/RichTextEditor';
import RichContentRenderer from '../components/RichContentRenderer';
import AudioSpeakerButton from '../components/AudioSpeakerButton';
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
} from 'lucide-react';

export default function ContentDetailPage() {
  const { contentId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { isTelugu, getText, getDesc } = useLanguage();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [titleEn, setTitleEn] = useState('');
  const [titleTe, setTitleTe] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descTe, setDescTe] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [fileUrl, setFileUrl] = useState('');
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
            setTitleEn(data.titleEn || data.title || '');
            setTitleTe(data.titleTe || '');
            setDescEn(data.descEn || data.desc || data.content || '');
            setDescTe(data.descTe || '');
            setImageUrl(data.imageUrl || '');
            setVideoUrl(data.videoUrl || '');
            setFileUrl(data.fileUrl || '');
          }
        } else {
          // Check announcements collection as fallback
          const annRef = doc(db, 'announcements', contentId);
          const annSnap = await getDoc(annRef);
          if (annSnap.exists()) {
            const data = { id: annSnap.id, ...annSnap.data(), categorySlug: 'home', pageSlug: 'announcements' };
            if (isMounted) {
              setArticle(data);
              setTitleEn(data.titleEn || data.title || '');
              setTitleTe(data.titleTe || '');
              setDescEn(data.descEn || data.desc || '');
              setDescTe(data.descTe || '');
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
    if (!titleEn.trim() && !titleTe.trim()) {
      alert('Please provide a title in English or Telugu.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        titleEn: titleEn.trim(),
        titleTe: titleTe.trim() || titleEn.trim(),
        descEn: descEn.trim(),
        descTe: descTe.trim() || descEn.trim(),
        imageUrl: imageUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
        fileUrl: fileUrl.trim() || null,
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
  const backUrl = article.pageSlug
    ? `/page/${article.categorySlug || 'worship'}/${article.pageSlug}`
    : article.categorySlug
    ? `/category/${article.categorySlug}`
    : '/';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* Top Banner Navigation Header */}
      <section className="bg-gradient-to-r from-[#071B3B] via-[#0F294A] to-[#122847] text-white pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#1A3860]">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Breadcrumb Links */}
          <nav className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
            <Link to="/" className="hover:text-[#F4B942] transition">
              {isTelugu ? 'స్వాగతం' : 'Welcome'}
            </Link>
            {article.categorySlug && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <Link
                  to={`/category/${article.categorySlug}`}
                  className="hover:text-[#F4B942] uppercase font-bold text-[#F4B942] transition"
                >
                  {article.categorySlug}
                </Link>
              </>
            )}
            {article.pageSlug && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                <Link
                  to={`/page/${article.categorySlug}/${article.pageSlug}`}
                  className="hover:text-[#F4B942] capitalize font-medium text-slate-200 transition"
                >
                  {article.pageSlug}
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
            <Link
              to={backUrl}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10"
            >
              <ArrowLeft className="w-4 h-4 text-[#F4B942]" />
              <span>{isTelugu ? '← వెనుకకు వెళ్ళండి' : '← Back'}</span>
            </Link>

            <div className="flex items-center gap-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Title (English)</label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 font-telugu">Title (Telugu)</label>
                  <input
                    type="text"
                    value={titleTe}
                    onChange={(e) => setTitleTe(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-telugu"
                  />
                </div>
              </div>

              <RichTextEditor
                label="Article Body (English)"
                value={descEn}
                onChange={setDescEn}
                rows={6}
              />

              <RichTextEditor
                label="Article Body (Telugu - తెలుగు)"
                value={descTe}
                onChange={setDescTe}
                isTelugu={true}
                rows={6}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Video URL (YouTube)</label>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">File / PDF URL</label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
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

              {article.authorEmail && (
                <span className="text-slate-400 text-xs">
                  • Published by {article.authorEmail.split('@')[0]}
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

          {/* Rich Content Body */}
          <div className="pt-2">
            <RichContentRenderer
              content={articleDesc}
              isTelugu={isTelugu}
              className="text-base sm:text-lg"
            />
          </div>

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

          {/* Bottom Bar: Back Navigation and Social Share */}
          <div className="pt-8 border-t border-slate-100 flex items-center justify-between gap-4">
            <Link
              to={backUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#C59B27]" />
              <span>{isTelugu ? '← పేజీ జాబితాకు తిరిగి వెళ్ళండి' : '← Back to Sub-Page'}</span>
            </Link>

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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#C59B27]" />
              <span>Share Page</span>
            </button>
          </div>
        </article>
      </main>
    </div>
  );
}
