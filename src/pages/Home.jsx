import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { launchEcosystemApp } from '../utils/sso';
import {
  Calendar,
  Play,
  ArrowRight,
  ShieldCheck,
  Video,
  BookOpen,
  ClipboardCheck,
  Award,
  Search,
  ExternalLink,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

// Editorial fallback announcements inspired by watv.org
const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'sample-1',
    titleEn: 'Annual General Assembly & Sacred Feast Convocations Announced',
    titleTe: 'వార్షిక సర్వసభ్య సమావేశం & పవిత్ర పండుగల కూటముల ప్రకటన',
    descEn: 'All branches, pastoral workers, and fellowship members worldwide are invited to participate in the upcoming sacred feast assemblies. Review the updated solemn assembly schedule and theological guidelines.',
    descTe: 'సమస్త సమాజాల సభ్యులకు ప్రేమతో ఆహ్వానం. రాబోవు పవిత్ర పండుగల కూటముల తేదీలు మరియు ప్రాంతీయ సమావేశ మార్గదర్శకాలు విడుదల చేయబడ్డాయి. పూర్తి సమాచారాన్ని పరిశీలించండి.',
    date: '2026-11-20',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
    category: 'Assembly Notice',
  },
  {
    id: 'sample-2',
    titleEn: 'Spiritual Education & Bible Doctrine Training Seminars',
    titleTe: 'ఆత్మీయ శిక్షణ & సత్య వాక్య సిద్ధాంత తరగతుల నిర్వహణ',
    descEn: 'Special educational sessions focusing on the New Covenant gospel truths, biblical prophecies, and theological doctrine for all ministerial workers and active members.',
    descTe: 'నూతన నిబంధన సువార్త సత్యాలు, ప్రవచనాలు మరియు లేఖనాల సిద్ధాంతాలపై ప్రత్యేక ఆత్మీయ అధ్యయన తరగతులు ప్రారంభం కానున్నవి.',
    date: '2026-11-15',
    imageUrl: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80',
    category: 'Education',
  },
  {
    id: 'sample-3',
    titleEn: 'Worldwide Preaching Mission & Charity Outreach Reports',
    titleTe: 'సార్వత్రిక సువార్త ప్రకటనా కార్యం & సేవా కార్యక్రమాల నివేదిక',
    descEn: 'Summary report of humanitarian outreach, charitable medical relief initiatives, and missionary expeditions conducted across regional fellowship centers over the past quarter.',
    descTe: 'గత త్రైమాసికంలో వివిధ ప్రాంతాలలో నిర్వహించిన స్వచ్ఛంద సేవా కార్యక్రమాలు మరియు సువార్త సేవ యొక్క సమగ్ర నివేదిక ప్రచురించబడింది.',
    date: '2026-11-10',
    imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
    category: 'Mission Report',
  },
];

// Editorial fallback media items
const DEFAULT_MEDIA = [
  {
    id: 'media-1',
    titleEn: 'The Mystery of the Kingdom of Heaven & The New Covenant',
    titleTe: 'పరలోక రాజ్య మర్మము & నూతన నిబంధన సత్యము',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=1000&q=80',
    duration: '42:15',
    category: 'Sermon Broadcast',
  },
  {
    id: 'media-2',
    titleEn: 'Sacred Hymns & Choral Praise Collection - Vol. 12',
    titleTe: 'పవిత్ర స్తుతి గీతాలు & గాన బృంద ఆరాధన సంకలనం',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
    duration: '28:40',
    category: 'Choral Praises',
  },
  {
    id: 'media-3',
    titleEn: 'Prophetic Fulfillment: The Feasts of God throughout Biblical History',
    titleTe: 'ప్రవచనాల నెరవేర్పు: బైబిల్ చరిత్రలో దేవుని పండుగలు',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?auto=format&fit=crop&w=1000&q=80',
    duration: '35:20',
    category: 'Bible Doctrine',
  },
];

export default function Home() {
  const { currentUser, userProfile } = useAuth();
  const { t, getText, getDesc, isTelugu } = useLanguage();

  const [announcements, setAnnouncements] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Fetch Firestore announcements and media
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // Announcements
      try {
        const q = query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(6));
        const snap = await getDocs(q);
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
        if (isMounted) {
          setAnnouncements(docs.length > 0 ? docs : DEFAULT_ANNOUNCEMENTS);
        }
      } catch (err) {
        console.warn('Could not query announcements from Firestore, using default:', err);
        if (isMounted) setAnnouncements(DEFAULT_ANNOUNCEMENTS);
      }

      // Media
      try {
        const q = query(collection(db, 'media'), limit(6));
        const snap = await getDocs(q);
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
        if (isMounted) {
          setMediaList(docs.length > 0 ? docs : DEFAULT_MEDIA);
        }
      } catch (err) {
        console.warn('Could not query media from Firestore, using default:', err);
        if (isMounted) setMediaList(DEFAULT_MEDIA);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Organization web application ecosystem cards
  const ecosystemApps = [
    {
      nameEn: 'Eva Management Portal',
      nameTe: 'ఎవా మూల్యాంకన పోర్టల్',
      url: 'https://eva.sni.org.in',
      descEn: 'Centralized evaluation, institutional metrics, and performance analytics.',
      descTe: 'కేంద్ర మూల్యాంకనం, ఫలితాల విశ్లేషణ మరియు సమాఖ్య నిర్వహణ పోర్టల్.',
      icon: Award,
      badge: 'eva.sni.org.in',
      isExternal: true,
    },
    {
      nameEn: 'Evaluation System',
      nameTe: 'మూల్యాంకన విభాగం',
      url: '/evaluation/',
      descEn: 'Interactive member examinations, questionnaire submissions, and progress tracking.',
      descTe: 'సభ్యుల ప్రశ్నావళి, వ్యక్తిగత పురోగతి మరియు ఆత్మీయ పరీక్షల విభాగం.',
      icon: ClipboardCheck,
      badge: 'Evaluation',
      isExternal: false,
    },
    {
      nameEn: 'Gospel Diary',
      nameTe: 'సువార్త డైరీ',
      url: '/diary.html',
      descEn: 'Daily spiritual reflection, prayer recordings, ministry logging, and soul-winning records.',
      descTe: 'రోజువారీ ప్రార్థనల సమాచారం, సువార్త సేవ మరియు ఆత్మీయ డైరీ రికార్డులు.',
      icon: BookOpen,
      badge: 'Diary',
      isExternal: false,
    },
    {
      nameEn: 'Videos & Sermon Archive',
      nameTe: 'వీడియో & ప్రసంగాల లైబ్రరీ',
      url: '/videos.html',
      descEn: 'Comprehensive high-definition archive of sermons, feast hymns, and educational videos.',
      descTe: 'ఆత్మీయ ఉపదేశాలు, పండుగల ప్రసంగాలు మరియు భక్తి గీతాల వీడియో ఆర్కైవ్.',
      icon: Video,
      badge: 'Videos',
      isExternal: false,
    },
    {
      nameEn: 'Scripture Word Search',
      nameTe: 'లేఖనాల పద శోధన',
      url: '/wordsearch.html',
      descEn: 'Engaging interactive biblical word puzzle and scripture learning challenges.',
      descTe: 'బైబిల్ పదాల అన్వేషణ, లేఖనాల క్రీడ మరియు ఆత్మీయ అధ్యయన సాధనం.',
      icon: Search,
      badge: 'Word Search',
      isExternal: false,
    },
  ];

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900 selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* 1. FULL-WIDTH CINEMATIC HERO BANNER (watv.org style: h-[520px], full bleed, editorial elegance) */}
      <section className="relative w-full h-[520px] overflow-hidden flex items-center bg-[#0F294A]">
        {/* High-Resolution Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100 hover:scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=2000&q=85')`,
          }}
        ></div>

        {/* Sophisticated Dark Gradient Overlay (watv.org editorial grade) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F294A]/95 via-[#0F294A]/75 to-[#0F294A]/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F294A]/90 via-transparent to-black/30"></div>

        {/* Hero Content Container */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl text-left text-white space-y-5">
            {/* Elegant Sub-Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-[#C59B27]/50 text-[#C59B27] text-xs font-semibold uppercase tracking-widest shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] animate-ping"></span>
              <span className={isTelugu ? 'font-telugu' : ''}>{t('heroBadge')}</span>
            </div>

            {/* Inspirational Headline */}
            <h1
              className={`text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] ${
                isTelugu ? 'font-krishna text-4xl sm:text-6xl lg:text-7xl leading-tight' : 'font-serif'
              }`}
            >
              <span className="text-white drop-shadow-sm">
                {t('heroTitle')}
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-slate-200 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-normal ${
                isTelugu ? 'font-telugu leading-relaxed text-slate-100' : ''
              }`}
            >
              {t('heroSubtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-4">
              {/* Bordered 'Explore More' CTA button */}
              <button
                onClick={() => handleScrollTo('news-section')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-[#C59B27] text-[#C59B27] hover:bg-[#C59B27] hover:text-[#0F294A] font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer group"
              >
                <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                  {t('heroBtnExplore')}
                </span>
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={() => handleScrollTo('media-section')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm border border-white/20 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current text-[#C59B27]" />
                <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                  {t('heroBtnMedia')}
                </span>
              </button>

              {currentUser ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C59B27] hover:bg-amber-400 text-[#0F294A] font-bold text-xs sm:text-sm uppercase tracking-wider transition shadow-md"
                >
                  <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                    {t('heroBtnPortal')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C59B27] hover:bg-amber-400 text-[#0F294A] font-bold text-xs sm:text-sm uppercase tracking-wider transition shadow-md"
                >
                  <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                    {t('heroBtnPortal')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL NEWS GRID (watv.org style: 3-column magazine layout, 16:9 images, subtle hover zoom, no heavy borders) */}
      <section id="news-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-[#C59B27] text-xs font-bold uppercase tracking-widest mb-1.5">
              <span className="w-2 h-0.5 bg-[#C59B27]"></span>
              <span>General Assembly News</span>
            </div>
            <h2
              className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F294A] tracking-tight ${
                isTelugu ? 'font-krishna text-3xl sm:text-4xl' : 'font-serif'
              }`}
            >
              {t('announcementsTitle')}
            </h2>
            <p className={`text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl ${isTelugu ? 'font-telugu' : ''}`}>
              {t('announcementsSubtitle')}
            </p>
          </div>

          {userProfile?.role === 'admin' && (
            <Link
              to="/admin"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 text-xs font-bold text-[#0F294A] hover:text-[#C59B27] bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 transition"
            >
              <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
              <span>Admin: Manage News</span>
            </Link>
          )}
        </div>

        {/* 3-Column Magazine-Style Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {announcements.map((item) => {
            const title = getText(item, 'title');
            const desc = getDesc(item);

            return (
              <article
                key={item.id}
                onClick={() => setSelectedAnnouncement(item)}
                className="group flex flex-col justify-between cursor-pointer bg-transparent transition-all duration-300"
              >
                <div>
                  {/* 16:9 Aspect-Ratio Cover Image with Subtle Scale-105 Zoom */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm mb-4">
                    <img
                      src={
                        item.imageUrl ||
                        'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80'
                      }
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    {/* Category Pill Badge */}
                    <div className="absolute top-3 left-3 bg-[#0F294A]/90 backdrop-blur-sm text-[#C59B27] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-[#C59B27]/30 shadow-xs">
                      {item.category || 'Announcement'}
                    </div>
                  </div>

                  {/* Date Metadata */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-2">
                    <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>{item.date || 'Notice'}</span>
                  </div>

                  {/* Title (Editorial font) */}
                  <h3
                    className={`text-lg font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors line-clamp-2 leading-snug ${
                      isTelugu ? 'font-telugu leading-snug' : 'font-serif'
                    }`}
                  >
                    {title}
                  </h3>

                  {/* Clean Excerpt (no heavy borders) */}
                  <p
                    className={`text-slate-600 text-xs sm:text-sm mt-2 line-clamp-3 leading-relaxed font-normal ${
                      isTelugu ? 'font-telugu' : ''
                    }`}
                  >
                    {desc}
                  </p>
                </div>

                {/* Read Full Story Text Action */}
                <div className="mt-5 pt-3 flex items-center gap-1.5 text-xs font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors">
                  <span className={isTelugu ? 'font-telugu' : ''}>{t('readMore')}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 3. DARK-THEMED MEDIA & VIDEOS SHOWCASE (watv.org style: full-width deep-navy #0F294A section) */}
      <section id="media-section" className="py-20 bg-[#0F294A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-4 border-b border-[#1A3860]">
            <div>
              <div className="flex items-center gap-2 text-[#C59B27] text-xs font-bold uppercase tracking-widest mb-1.5">
                <span className="w-2 h-0.5 bg-[#C59B27]"></span>
                <span>Sacred Broadcasts & Choral Hymns</span>
              </div>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white ${
                  isTelugu ? 'font-krishna text-3xl sm:text-4xl' : 'font-serif'
                }`}
              >
                {t('mediaTitle')}
              </h2>
              <p className={`text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl ${isTelugu ? 'font-telugu' : ''}`}>
                {t('mediaSubtitle')}
              </p>
            </div>

            <button
              onClick={() => launchEcosystemApp('/videos.html', currentUser, userProfile)}
              className="mt-4 md:mt-0 inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#C59B27] hover:bg-[#C59B27] text-[#C59B27] hover:text-[#0F294A] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                {isTelugu ? 'మొత్తం వీడియో లైబ్రరీ' : 'Full Sermon Video Archive'}
              </span>
            </button>
          </div>

          {/* Sleek Video Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mediaList.map((item) => {
              const title = getText(item, 'title');

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedVideo(item)}
                  className="group bg-[#0B1E36] rounded-2xl overflow-hidden border border-[#1A3860] hover:border-[#C59B27]/60 shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  {/* 16:9 Thumbnail with Gold Circular Play Overlay */}
                  <div className="relative aspect-video w-full bg-black overflow-hidden">
                    <img
                      src={
                        item.thumbnailUrl ||
                        'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=1000&q=80'
                      }
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    />

                    {/* Gradient shade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                    {/* Circular Gold Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-[#C59B27] text-[#0F294A] flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-amber-300 transition-all duration-300">
                        <Play className="w-6 h-6 fill-current translate-x-0.5" />
                      </div>
                    </div>

                    {/* Duration badge */}
                    {item.duration && (
                      <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[11px] font-mono px-2 py-0.5 rounded">
                        {item.duration}
                      </div>
                    )}
                  </div>

                  {/* Information */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-[#C59B27] tracking-wider mb-1.5">
                        {item.category || 'Sermon Media'}
                      </div>
                      <h3
                        className={`text-base font-bold text-white group-hover:text-[#C59B27] transition-colors line-clamp-2 leading-snug ${
                          isTelugu ? 'font-telugu' : 'font-serif'
                        }`}
                      >
                        {title}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1A3860] flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-[#C59B27] font-semibold">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className={isTelugu ? 'font-telugu' : ''}>{t('watchVideo')}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. ECOSYSTEM APPS SHOWCASE (watv.org clean presentation) */}
      <section id="apps-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-[#C59B27] text-xs font-bold uppercase tracking-widest mb-1.5">
            <span className="w-2 h-0.5 bg-[#C59B27]"></span>
            <span>Single Sign-On Architecture</span>
            <span className="w-2 h-0.5 bg-[#C59B27]"></span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F294A] tracking-tight ${
              isTelugu ? 'font-krishna text-3xl sm:text-4xl' : 'font-serif'
            }`}
          >
            {t('appsTitle')}
          </h2>
          <p className={`text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed ${isTelugu ? 'font-telugu' : ''}`}>
            {t('appsSubtitle')}
          </p>
        </div>

        {/* 5 App Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ecosystemApps.map((app) => {
            const AppIcon = app.icon;
            const appName = isTelugu ? app.nameTe : app.nameEn;
            const appDesc = isTelugu ? app.descTe : app.descEn;

            return (
              <div
                key={app.badge}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F294A] text-[#C59B27] border border-[#C59B27]/30 flex items-center justify-center shadow-xs">
                      <AppIcon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {app.badge}
                    </span>
                  </div>

                  <h3
                    className={`text-base font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors ${
                      isTelugu ? 'font-telugu' : 'font-serif'
                    }`}
                  >
                    {appName}
                  </h3>
                  <p
                    className={`text-slate-600 text-xs sm:text-sm mt-2 leading-relaxed ${
                      isTelugu ? 'font-telugu' : ''
                    }`}
                  >
                    {appDesc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => launchEcosystemApp(app.url, currentUser, userProfile)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#0B1E36] text-[#C59B27] font-bold text-xs transition shadow-xs cursor-pointer"
                  >
                    <span className={isTelugu ? 'font-telugu' : ''}>{t('launchApp')}</span>
                    {app.isExternal ? <ExternalLink className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ANNOUNCEMENT DETAIL MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F294A]/80 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-[#C59B27] border border-[#C59B27]/40 rounded-lg">
                {selectedAnnouncement.date || 'Notice'}
              </span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedAnnouncement.imageUrl && (
              <img
                src={selectedAnnouncement.imageUrl}
                alt=""
                className="w-full h-64 object-cover rounded-2xl mb-6 shadow-xs"
              />
            )}

            <h3
              className={`text-xl sm:text-2xl font-bold text-[#0F294A] mb-4 ${
                isTelugu ? 'font-telugu' : 'font-serif'
              }`}
            >
              {getText(selectedAnnouncement, 'title')}
            </h3>

            <div
              className={`text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-8 ${
                isTelugu ? 'font-telugu leading-loose' : ''
              }`}
            >
              {getDesc(selectedAnnouncement)}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-6 py-2.5 rounded-xl bg-[#0F294A] text-white font-bold text-xs sm:text-sm hover:bg-[#0B1E36] transition cursor-pointer"
              >
                {t('closeModal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO MODAL PLAYER */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 sm:p-6">
          <div className="bg-[#0F294A] rounded-3xl max-w-3xl w-full border border-[#1A3860] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1A3860] text-white">
              <h3 className={`text-base font-bold text-[#C59B27] truncate ${isTelugu ? 'font-telugu' : 'font-serif'}`}>
                {getText(selectedVideo, 'title')}
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="Close video player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden mb-4 shadow-inner flex items-center justify-center">
              {selectedVideo.videoUrl?.includes('youtube.com') || selectedVideo.videoUrl?.includes('youtu.be') ? (
                <iframe
                  src={
                    selectedVideo.videoUrl.includes('embed')
                      ? selectedVideo.videoUrl
                      : `https://www.youtube.com/embed/${selectedVideo.videoUrl.split('v=')[1]?.split('&')[0] || ''}`
                  }
                  title={getText(selectedVideo, 'title')}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-center p-6 text-slate-300">
                  <Play className="w-12 h-12 text-[#C59B27] mx-auto mb-3" />
                  <p className="text-sm font-semibold mb-4">Direct Media Stream Link Available</p>
                  <a
                    href={selectedVideo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C59B27] text-[#0F294A] font-bold text-xs"
                  >
                    <span>Open in Media Player</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedVideo(null)}
                className="px-5 py-2 rounded-xl bg-white/10 text-slate-200 hover:text-white font-bold text-xs cursor-pointer"
              >
                {t('closeModal')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
