import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
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
import {
  ChevronRight,
  PlusCircle,
  X,
  Calendar,
  Trash2,
  FileText,
  Play,
  Share2,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';

export default function DynamicPage() {
  const { categorySlug, pageSlug } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { isTelugu, getText, getDesc } = useLanguage();

  const [pageInfo, setPageInfo] = useState({ category: null, page: null });
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Admin add content modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newTitleTe, setNewTitleTe] = useState('');
  const [newDescEn, setNewDescEn] = useState('');
  const [newDescTe, setNewDescTe] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');

  const isAdmin = userProfile?.role === 'admin';

  // Load category and page definitions
  useEffect(() => {
    const info = findPageInfo(DEFAULT_PORTAL_STRUCTURE, categorySlug, pageSlug);
    setPageInfo(info);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug, pageSlug]);

  // Load page contents from Firestore `page_contents`
  const fetchPageContents = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'page_contents'),
        where('pageSlug', '==', pageSlug),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const items = [];
      snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setContents(items);
    } catch (err) {
      console.warn('Could not load page_contents with index, trying simple query:', err);
      try {
        const qSimple = query(
          collection(db, 'page_contents'),
          where('pageSlug', '==', pageSlug)
        );
        const snapshot = await getDocs(qSimple);
        const items = [];
        snapshot.forEach((d) => items.push({ id: d.id, ...d.data() }));
        setContents(items);
      } catch (e) {
        console.warn('Error fetching contents:', e);
        setContents([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pageSlug) {
      fetchPageContents();
    }
  }, [pageSlug]);

  // Handle adding new content by Admin
  const handleAddContent = async (e) => {
    e.preventDefault();
    if (!newTitleEn && !newTitleTe) {
      alert('Please provide a title in English or Telugu.');
      return;
    }

    setFormSubmitting(true);
    try {
      await addDoc(collection(db, 'page_contents'), {
        categorySlug: categorySlug || '',
        pageSlug: pageSlug || '',
        titleEn: newTitleEn.trim(),
        titleTe: newTitleTe.trim() || newTitleEn.trim(),
        descEn: newDescEn.trim(),
        descTe: newDescTe.trim() || newDescEn.trim(),
        imageUrl: newImageUrl.trim() || null,
        videoUrl: newVideoUrl.trim() || null,
        fileUrl: newFileUrl.trim() || null,
        createdAt: serverTimestamp(),
        authorEmail: currentUser?.email || 'admin@sni.org.in',
      });

      // Reset form & close
      setNewTitleEn('');
      setNewTitleTe('');
      setNewDescEn('');
      setNewDescTe('');
      setNewImageUrl('');
      setNewVideoUrl('');
      setNewFileUrl('');
      setIsModalOpen(false);

      // Refresh list
      fetchPageContents();
    } catch (err) {
      console.error('Failed to add page content:', err);
      alert('Failed to save content: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle deleting content by Admin
  const handleDeleteContent = async (contentId) => {
    if (!window.confirm('Are you sure you want to delete this content item?')) return;
    try {
      await deleteDoc(doc(db, 'page_contents', contentId));
      setContents((prev) => prev.filter((item) => item.id !== contentId));
    } catch (err) {
      console.error('Failed to delete content:', err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const { category, page } = pageInfo;
  const categoryTitle = category ? (isTelugu ? category.titleTe : category.titleEn) : categorySlug;
  const pageTitle = page ? (isTelugu ? page.titleTe : page.titleEn) : pageSlug;
  const pageDesc = page ? (isTelugu ? page.descTe : page.descEn) : '';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 font-sans selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* Editorial Header Banner */}
      <section className="relative bg-[#0F294A] text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-[#1A3860]">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-300 mb-6 flex-wrap">
            <Link to="/" className="hover:text-[#C59B27] transition flex items-center gap-1">
              <span>{isTelugu ? 'స్వాగతం' : 'Welcome'}</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[#C59B27] font-semibold">{categoryTitle}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-white font-bold">{pageTitle}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C59B27] border border-[#C59B27]/40 text-xs font-semibold uppercase tracking-wider">
                <PortalIcon name={page?.iconName || 'FileText'} className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>{categoryTitle}</span>
              </div>

              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight ${
                  isTelugu ? 'font-krishna' : 'font-serif'
                }`}
              >
                {pageTitle}
              </h1>

              {pageDesc && (
                <p
                  className={`text-slate-300 text-sm sm:text-base leading-relaxed ${
                    isTelugu ? 'font-telugu' : ''
                  }`}
                >
                  {pageDesc}
                </p>
              )}
            </div>

            {/* Admin Quick Action Button */}
            {isAdmin && (
              <div className="shrink-0">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C59B27] hover:bg-amber-400 text-[#0F294A] font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Content to This Page</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-3 border-[#C59B27] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Loading content for {pageTitle}...</span>
          </div>
        ) : contents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((item) => {
              const itemTitle = getText(item, 'title');
              const itemDesc = getDesc(item);

              return (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
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
                        className={`text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line line-clamp-4 ${
                          isTelugu ? 'font-telugu' : ''
                        }`}
                      >
                        {itemDesc}
                      </p>
                    </div>
                  </div>

                  {/* Actions / Attachments */}
                  <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {item.videoUrl && (
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-semibold text-[11px] hover:bg-rose-100 transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Video</span>
                        </a>
                      )}
                      {item.fileUrl && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px] hover:bg-blue-100 transition"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Resource</span>
                        </a>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteContent(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Editorial Default Welcome for this sub-page if no user-submitted content exists yet */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-sm max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#0F294A] text-[#C59B27] flex items-center justify-center shrink-0 shadow-sm">
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
              className={`text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 ${
                isTelugu ? 'font-telugu leading-loose' : ''
              }`}
            >
              <p>
                {isTelugu
                  ? `దేవుని సంఘ సమాఖ్య ${categoryTitle} విభాగంలోని "${pageTitle}" పేజీకి స్వాగతం. ఈ విభాగం ద్వారా దైవిక క్రమములు, సిద్ధాంత గ్రంథములు మరియు ఆత్మీయ మార్గదర్శకాలను క్రమబద్ధంగా అందించడం జరుగుతుంది.`
                  : `Welcome to the official "${pageTitle}" section within the ${categoryTitle} directory of Super Natural Intelligence (SNI). This repository organizes sacred orders, theological teachings, and administrative records for all ministerial workers and fellowship members.`}
              </p>

              {pageDesc && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-[#C59B27]/30 text-[#0F294A] text-xs sm:text-sm font-medium">
                  {pageDesc}
                </div>
              )}

              <p className="text-slate-500 text-xs sm:text-sm">
                {isTelugu
                  ? 'అడ్మిన్ అధికారులు ఈ పేజీకి సంబంధించిన నూతన ఆర్టికల్స్, పత్రాలు, వీడియోలు లేదా ఫైళ్ళను నేరుగా ఇక్కడే "+ Add Content to This Page" బటన్ ద్వారా ప్రచురించవచ్చు.'
                  : 'Authorized administrators can publish official articles, media broadcasts, lesson sheets, and circulars directly into this page using the "+ Add Content to This Page" button above.'}
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#0F294A] hover:text-[#C59B27] transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isTelugu ? 'ముఖ్య పేజీకి తిరిగి వెళ్ళండి' : 'Return to Welcome'}</span>
              </Link>

              {isAdmin && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#0B1E36] text-[#C59B27] font-bold text-xs uppercase tracking-wider transition shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish First Content Block</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Admin Add Content Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/80 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C59B27]">
                  Publish Content to
                </span>
                <h3 className="text-xl font-bold text-[#0F294A]">
                  {categoryTitle} &gt; {pageTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Title (English) *
                </label>
                <input
                  type="text"
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  placeholder="Enter title in English"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Title (Telugu)
                </label>
                <input
                  type="text"
                  value={newTitleTe}
                  onChange={(e) => setNewTitleTe(e.target.value)}
                  placeholder="శీర్షిక (తెలుగులో)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#C59B27] font-telugu"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Body (English)
                </label>
                <textarea
                  rows="3"
                  value={newDescEn}
                  onChange={(e) => setNewDescEn(e.target.value)}
                  placeholder="Detailed content, scriptures, or circular text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#C59B27]"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Body (Telugu)
                </label>
                <textarea
                  rows="3"
                  value={newDescTe}
                  onChange={(e) => setNewDescTe(e.target.value)}
                  placeholder="సారాంశం లేదా వాక్యాలు (తెలుగులో)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#C59B27] font-telugu"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Image URL (optional)
                  </label>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Video URL (optional)
                  </label>
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="YouTube / Video link"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Downloadable Document / File URL (optional)
                </label>
                <input
                  type="url"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  placeholder="Drive / PDF Link"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#0B1E36] text-[#C59B27] font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Publish to Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
