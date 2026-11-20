import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_PORTAL_STRUCTURE, mergePortalStructure } from '../config/portalStructure';
import PortalIcon from '../components/PortalIcon';
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
} from 'lucide-react';

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const { currentUser, userProfile } = useAuth();
  const { isTelugu, getText, getDesc } = useLanguage();
  const navigate = useNavigate();

  const [portalStructure, setPortalStructure] = useState(DEFAULT_PORTAL_STRUCTURE);
  const [categoryContents, setCategoryContents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Load custom portal pages from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'portal_pages'),
        (snapshot) => {
          const customPages = [];
          snapshot.forEach((doc) => {
            customPages.push({ id: doc.id, ...doc.data() });
          });
          setPortalStructure(mergePortalStructure(customPages));
        },
        (error) => {
          console.warn('Using default portal structure:', error);
          setPortalStructure(DEFAULT_PORTAL_STRUCTURE);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('Error setting up portal_pages listener:', err);
      setPortalStructure(DEFAULT_PORTAL_STRUCTURE);
    }
  }, []);

  // Fetch all contents for this category
  useEffect(() => {
    let isMounted = true;
    async function fetchContents() {
      if (!categorySlug) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'page_contents'),
          where('categorySlug', '==', categorySlug)
        );
        const snap = await getDocs(q);
        const items = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() }));

        // Sort by date or createdAt desc
        items.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
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
  const categoryDesc = isTelugu ? currentCategory.descriptionTe : currentCategory.descriptionEn;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* 1. Category Hero Banner */}
      <section className="bg-gradient-to-r from-[#071B3B] via-[#0F294A] to-[#122847] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#1A3860]">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
            <Link to="/" className="hover:text-[#F4B942] transition">
              {isTelugu ? 'స్వాగతం' : 'Welcome'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[#F4B942] font-bold">{categoryTitle}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#040E1E] text-[#F4B942] border border-[#F4B942]/40 flex items-center justify-center shrink-0 shadow-lg">
                <PortalIcon name={currentCategory.iconName || 'BookOpen'} className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#F4B942]">
                  <span>SNI Ministry Directory</span>
                </div>
                <h1
                  className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight ${
                    isTelugu ? 'font-krishna text-4xl sm:text-5xl' : 'font-serif'
                  }`}
                >
                  {categoryTitle}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {categoryDesc}
                </p>
              </div>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4B942] hover:bg-amber-400 text-[#071B3B] text-xs font-bold uppercase tracking-wider transition shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Page or Content</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Sub-Pages Content Feeds (Last 3 Added Contents with "All ->" button) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-14">
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
              .filter((item) => item.pageSlug === subPage.pageSlug)
              .slice(0, 3); // Take the last 3 contents added!

            return (
              <section
                key={subPage.pageSlug}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Section Header with "All ->" Arrow Button on top right */}
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

                  {/* Top Right "All ->" Button */}
                  <Link
                    to={`/page/${categorySlug}/${subPage.pageSlug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-[#0F294A] hover:text-[#F4B942] text-[#0F294A] border border-[#C59B27]/40 text-xs font-bold transition shadow-xs group"
                  >
                    <span>{isTelugu ? 'అన్నీ చూడండి' : 'All'}</span>
                    <ArrowRight className="w-4 h-4 text-[#C59B27] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* Last 3 Added Content Cards */}
                {subPageContents.length === 0 ? (
                  <div className="py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
                    <p className="text-xs text-slate-400 font-medium">
                      {isTelugu
                        ? 'ఈ సబ్‌పేజీలో ఇంకా ఆర్టికల్స్ ప్రచురించబడలేదు.'
                        : `No articles published in ${subTitle} yet.`}
                    </p>
                    {isAdmin && (
                      <Link
                        to={`/page/${categorySlug}/${subPage.pageSlug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C59B27] hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Content to this Sub-Page</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subPageContents.map((item) => {
                      const itemTitle = getText(item, 'title');
                      const itemDesc = getDesc(item);

                      return (
                        <article
                          key={item.id}
                          onClick={() => navigate(`/content/${item.id}`)}
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

                          {/* Card Footer: Audio Speaker + Read Story Link */}
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
                              {item.fileUrl && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>PDF</span>
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
