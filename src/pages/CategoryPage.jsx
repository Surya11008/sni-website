import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePortal } from '../context/PortalContext';
import { DEFAULT_PORTAL_STRUCTURE } from '../config/portalStructure';
import PortalIcon from '../components/PortalIcon';
import WATVSubNav from '../components/WATVSubNav';
import AudioSpeakerButton from '../components/AudioSpeakerButton';
import PhotoGalleryManager from '../components/PhotoGalleryManager';
import {
  Calendar,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Plus,
  Play,
  FileText,
  Loader2,
  FolderTree,
  Heart,
  LayoutGrid,
  List,
  AlignJustify,
  Music,
  Download,
  Globe,
} from 'lucide-react';

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { isTelugu, getText, getDesc } = useLanguage();
  const navigate = useNavigate();

  const { portalStructure } = usePortal();
  const [categoryContents, setCategoryContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const isAdmin =
    userProfile?.role === 'admin' ||
    currentUser?.email === 'surya11008@sni.org.in' ||
    currentUser?.email === 'admin@sni.org.in' ||
    currentUser?.email?.startsWith('surya');

  // If home category, redirect to root Welcome
  useEffect(() => {
    if (categorySlug === 'home') {
      navigate('/', { replace: true });
    }
  }, [categorySlug, navigate]);

  // Fetch all contents for this category (matching categorySlug or targetPages)
  useEffect(() => {
    let isMounted = true;
    async function fetchContents() {
      if (!categorySlug) return;
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'page_contents'));
        const items = [];
        snap.forEach((d) => {
          const data = d.data();
          if (data.categorySlug === categorySlug || (Array.isArray(data.targetPages) && data.targetPages.length > 0)) {
            items.push({ id: d.id, ...data });
          }
        });

        // Sort by date or createdAt desc
        items.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds || 0);
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds || 0);
          return timeB - timeA;
        });

        if (isMounted) {
          setCategoryContents(items);
        }
      } catch (err) {
        console.warn('Error fetching category contents:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchContents();
    return () => {
      isMounted = false;
    };
  }, [categorySlug]);

  // Find the category object in structure
  const currentCategory = portalStructure.find(
    (c) => c.categorySlug === categorySlug
  ) || {
    categorySlug,
    titleEn: categorySlug?.toUpperCase(),
    titleTe: categorySlug,
    descriptionEn: 'Explore theological studies, broadcasts, and resources in this section.',
    descriptionTe: 'ఈ విభాగంలో సిద్ధాంత గ్రంథములు, ప్రసంగాలు మరియు సమాచారాన్ని పరిశీలించండి.',
    iconName: 'BookOpen',
    pages: [],
  };

  const categoryTitle = isTelugu ? currentCategory.titleTe : currentCategory.titleEn;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* 1. WATV Subpage Navigation Bar (Image 5) */}
      <WATVSubNav categorySlug={categorySlug} activePageSlug="all" />

      {/* Main Sub-Pages Content Feeds (Last 3 Added Contents with "All ->" button) */}
      <main className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12 pt-3 sm:pt-4 pb-8 space-y-6">
        {/* Clean, Lightweight Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
          <div>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-slate-500 mb-1 flex-wrap">
              <Link to="/" className="hover:text-[#0F294A] transition font-bold text-slate-600">
                <span>Home</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#C59B27] font-bold uppercase">{categoryTitle}</span>
            </nav>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#C59B27] flex items-center justify-center shrink-0">
                <PortalIcon name={currentCategory.iconName || 'BookOpen'} className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h1
                  className={`text-3xl sm:text-5xl font-black text-[#071B3B] tracking-tight ${
                    isTelugu ? 'font-krishna text-3xl sm:text-4xl' : 'font-serif'
                  }`}
                >
                  {categoryTitle}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 italic max-w-xl">
                  "{currentCategory.descriptionEn || 'The family that serves God.'}"
                </p>
              </div>
            </div>
          </div>

          {isAdmin && (
            <Link
              to={currentCategory.pages?.length > 0 ? `/page/${categorySlug}/${currentCategory.pages[0].pageSlug}?new=true` : `/admin`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4B942] hover:bg-amber-400 text-[#071B3B] text-xs font-bold uppercase tracking-wider transition shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Write Note in this Category</span>
            </Link>
          )}
        </div>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-[#C59B27] mb-3" />
            <p className="text-xs font-semibold uppercase tracking-wider">Loading category sections...</p>
          </div>
        ) : currentCategory.pages?.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
            <p className="text-sm font-semibold">No sub-pages configured for this category yet.</p>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F294A] text-[#F4B942] text-xs font-bold"
              >
                + Add Sub-Page in Admin Panel
              </Link>
            )}
          </div>
        ) : (
          currentCategory.pages.map((subPage) => {
            const subTitle = isTelugu ? subPage.titleTe : subPage.titleEn;
            const subPageContents = categoryContents
              .filter(
                (item) =>
                  item.pageSlug === subPage.pageSlug ||
                  (Array.isArray(item.targetPages) && item.targetPages.includes(subPage.pageSlug))
              )
              .slice(0, 3); // Take the last 3 contents added!

            return (
              <section
                key={subPage.pageSlug}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Section Header with View Switcher (Options only, no extra text) and "All ->" */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0F294A] text-[#C59B27] flex items-center justify-center shadow-xs">
                      <PortalIcon name={subPage.iconName} className="w-5 h-5" />
                    </div>
                    <div>
                      <h2
                        className={`text-xl sm:text-2xl font-bold text-[#0F294A] tracking-tight ${
                          isTelugu ? 'font-telugu' : 'font-serif'
                        }`}
                      >
                        {subTitle}
                      </h2>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {subPageContents.length} Recent Updates
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher: ONLY options/icons, NO extra explanation */}
                    <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
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
                        <LayoutGrid className="w-3.5 h-3.5" />
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
                        <List className="w-3.5 h-3.5" />
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
                        <AlignJustify className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Top Right "All ->" Button */}
                    <Link
                      to={`/page/${categorySlug}/${subPage.pageSlug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-[#0F294A] hover:text-[#F4B942] text-[#0F294A] border border-[#C59B27]/40 text-xs font-bold transition shadow-xs group"
                    >
                      <span>All</span>
                      <ArrowRight className="w-4 h-4 text-[#C59B27] group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Content Cards */}
                {subPageContents.length === 0 ? (
                  <div className="py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
                    <p className="text-xs text-slate-400 font-medium">
                      No articles published in {subTitle} yet.
                    </p>
                    {isAdmin && (
                      <Link
                        to={`/page/${categorySlug}/${subPage.pageSlug}?new=true`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C59B27] hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Write Note in this Sub-Page</span>
                      </Link>
                    )}
                  </div>
                ) : viewMode === 'grid' ? (
                  /* GRID VIEW */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
                    {subPageContents.map((item) => {
                      const itemTitle = getText(item, 'title');
                      const itemDesc = getDesc(item);

                      return (
                        <article
                          key={item.id}
                          onClick={() => navigate(`/Home/${categorySlug || 'worship'}/${subPage.pageSlug || item.pageSlug || 'content'}/${item.id}`)}
                          className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:border-[#C59B27]/60"
                        >
                          <div>
                            {/* Card Image */}
                            {item.imageUrl && (
                              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                                <img
                                  src={item.imageUrl}
                                  alt={itemTitle}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                  loading="lazy"
                                />
                                {item.videoUrl && (
                                  <div className="absolute top-2.5 right-2.5 p-1 rounded-md bg-black/70 text-[#F4B942]">
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Card Body */}
                            <div className="p-5">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                                <span className="font-bold text-[#C59B27] uppercase text-[10px] tracking-wider">
                                  {subTitle}
                                </span>
                                {item.createdAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-[#C59B27]" />
                                    <span>
                                      {item.createdAt?.toDate
                                        ? item.createdAt.toDate().toLocaleDateString()
                                        : 'Recent'}
                                    </span>
                                  </span>
                                )}
                              </div>

                              <h3
                                className={`text-base font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors line-clamp-2 leading-snug mb-2 ${
                                  isTelugu ? 'font-telugu' : 'font-serif'
                                }`}
                              >
                                {itemTitle}
                              </h3>

                              <p
                                className={`text-slate-600 text-xs line-clamp-3 leading-relaxed ${
                                  isTelugu ? 'font-telugu' : ''
                                }`}
                              >
                                {itemDesc}
                              </p>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="px-5 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                              {item.audioUrl && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px]">
                                  <Music className="w-2.5 h-2.5" />
                                </span>
                              )}
                              {item.downloadUrl && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px]">
                                  <Download className="w-2.5 h-2.5" />
                                </span>
                              )}
                              {item.fileUrl && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>PDF</span>
                                </span>
                              )}
                              {(item.websiteUrl || item.embedUrl) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold text-[10px]">
                                  <Globe className="w-2.5 h-2.5" />
                                  <span>Website</span>
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] font-bold text-[#C59B27] group-hover:underline flex items-center gap-1">
                              <span>Read Page</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : viewMode === 'list' ? (
                  /* LIST VIEW */
                  <div className="space-y-4">
                    {subPageContents.map((item) => {
                      const itemTitle = getText(item, 'title');
                      const itemDesc = getDesc(item);

                      return (
                        <article
                          key={item.id}
                          onClick={() => navigate(`/Home/${categorySlug || 'worship'}/${subPage.pageSlug || item.pageSlug || 'content'}/${item.id}`)}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 group cursor-pointer hover:border-amber-400"
                        >
                          {item.imageUrl && (
                            <div className="w-full sm:w-44 sm:h-28 aspect-video sm:aspect-auto rounded-xl overflow-hidden shrink-0 bg-slate-100">
                              <img
                                src={item.imageUrl}
                                alt={itemTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="font-bold text-[#C59B27] uppercase text-[10px]">
                                {subTitle}
                              </span>
                              {item.createdAt && (
                                <span className="flex items-center gap-1 text-[11px]">
                                  <Calendar className="w-3 h-3 text-[#C59B27]" />
                                  <span>
                                    {item.createdAt?.toDate
                                      ? item.createdAt.toDate().toLocaleDateString()
                                      : 'Recent'}
                                  </span>
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors truncate">
                              {itemTitle}
                            </h3>

                            <p className="text-slate-600 text-xs line-clamp-2">
                              {itemDesc}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                            <AudioSpeakerButton buttonStyle="icon" text={itemDesc} title={itemTitle} />
                            {((item.likesCount > 0) || (item.likedBy && item.likedBy.length > 0)) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                                <span>{item.likesCount || item.likedBy?.length}</span>
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  /* COMPACT VIEW */
                  <div className="space-y-1.5">
                    {subPageContents.map((item) => {
                      const itemTitle = getText(item, 'title');
                      const itemDesc = getDesc(item);

                      return (
                        <div
                          key={item.id}
                          onClick={() => navigate(`/Home/${categorySlug || 'worship'}/${subPage.pageSlug || item.pageSlug || 'content'}/${item.id}`)}
                          className="flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-amber-50/30 rounded-xl border border-slate-200 hover:border-amber-400 transition group cursor-pointer gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-7 h-7 rounded-lg bg-amber-100/60 text-[#C59B27] flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#071B3B] truncate">
                              {itemTitle}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 text-xs">
                            <AudioSpeakerButton buttonStyle="icon" text={itemDesc} title={itemTitle} />
                            {((item.likesCount > 0) || (item.likedBy && item.likedBy.length > 0)) && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                                <span>{item.likesCount || item.likedBy?.length}</span>
                              </span>
                            )}
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#C59B27] group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}

        {/* 4. Dedicated Photo Gallery for Category */}
        <div className="pt-8 border-t border-slate-200">
          <PhotoGalleryManager
            targetPage={`category_${categorySlug}`}
            sectionTitleEn={`${categoryTitle} Highlights & Photos`}
            sectionTitleTe={`${categoryTitle} ఛాయాచిత్రాలు`}
          />
        </div>
      </main>
    </div>
  );
}
