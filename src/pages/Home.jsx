import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PhotoGalleryManager from '../components/PhotoGalleryManager';
import AudioSpeakerButton from '../components/AudioSpeakerButton';
import {
  Calendar,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Bell,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

// Editorial fallback announcements for the New Updates & Schedule feed
const DEFAULT_UPDATES = [
  {
    id: 'upd-1',
    titleEn: 'Annual General Assembly & Sacred Feast Convocations Announced',
    titleTe: 'వార్షిక సర్వసభ్య సమావేశం & పవిత్ర పండుగల కూటముల ప్రకటన',
    descEn: 'All branches, pastoral workers, and fellowship members worldwide are invited to participate in the upcoming sacred feast assemblies. Review the updated solemn assembly schedule and theological guidelines.',
    descTe: 'సమస్త సమాజాల సభ్యులకు ప్రేమతో ఆహ్వానం. రాబోవు పవిత్ర పండుగల కూటముల తేదీలు మరియు ప్రాంతీయ సమావేశ మార్గదర్శకాలు విడుదల చేయబడ్డాయి. పూర్తి సమాచారాన్ని పరిశీలించండి.',
    date: '2026-11-20',
    category: 'New Updates',
    pageSlug: 'new-updates',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'upd-2',
    titleEn: 'Worldwide Bible Preaching Seminar & Doctrine Workshops',
    titleTe: 'సార్వత్రిక బైబిల్ ప్రకటనా సదస్సు & సిద్ధాంత తరగతులు',
    descEn: 'Special educational sessions focusing on the New Covenant gospel truths, biblical prophecies, and theological doctrine for all ministerial workers.',
    descTe: 'నూతన నిబంధన సువార్త సత్యాలు, ప్రవచనాలు మరియు లేఖనాల సిద్ధాంతాలపై ప్రత్యేక ఆత్మీయ అధ్యయన తరగతులు ప్రారంభం కానున్నవి.',
    date: '2026-11-15',
    category: 'Events',
    pageSlug: 'events',
    imageUrl: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'upd-3',
    titleEn: 'Sacred Sabbath Worship & Assembly Prayer Watch Schedule',
    titleTe: 'విశ్రాంతి దిన పవిత్ర ఆరాధన & ప్రార్థనల సమయ పట్టిక',
    descEn: 'Review the updated Sabbath timetable, choir rehearsals, and prayer watch schedule for the third quarter across all regional assembly sanctuaries.',
    descTe: 'విశ్రాంతి దిన ప్రార్థనల సమయాలు, గానబృంద సాధన మరియు కూటముల సమగ్ర దినచర్య పట్టిక ప్రచురించబడింది.',
    date: '2026-11-10',
    category: 'Schedule',
    pageSlug: 'schedule',
    imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function Home() {
  const { currentUser } = useAuth();
  const { t, getText, getDesc, isTelugu } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [updates, setUpdates] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch dynamic updates from Firestore
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Try to query page_contents where categorySlug == 'home'
        const q = query(
          collection(db, 'page_contents'),
          where('categorySlug', '==', 'home'),
          limit(6)
        );
        const snap = await getDocs(q);
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));

        if (docs.length === 0) {
          // Fallback to announcements collection if page_contents is empty
          const qAnn = query(collection(db, 'announcements'), orderBy('date', 'desc'), limit(6));
          const snapAnn = await getDocs(qAnn);
          snapAnn.forEach((d) => docs.push({ id: d.id, ...d.data() }));
        }

        if (isMounted) {
          setUpdates(docs.length > 0 ? docs : DEFAULT_UPDATES);
        }
      } catch (err) {
        console.warn('Could not query dynamic updates, using fallback:', err);
        if (isMounted) setUpdates(DEFAULT_UPDATES);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredUpdates =
    activeTab === 'all'
      ? updates
      : updates.filter((u) => (u.pageSlug || u.category || '').toLowerCase().includes(activeTab));

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900 selection:bg-[#C59B27] selection:text-[#0F294A] font-sans">
      {/* 1. FULL-WIDTH CINEMATIC HERO BANNER (watv.org style: h-[520px]) */}
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
            {/* Sub-Badge */}
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
              <span className="text-white drop-shadow-sm">{t('heroTitle')}</span>
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
              <button
                onClick={() => handleScrollTo('updates-section')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#C59B27] hover:bg-amber-400 text-[#0F294A] font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                  {isTelugu ? 'తాజా సమాచారం & షెడ్యూల్' : 'New Updates & Schedule'}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleScrollTo('photos-section')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-white/40 text-white hover:bg-white/10 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm cursor-pointer group"
              >
                <ImageIcon className="w-4 h-4 text-[#F4B942]" />
                <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                  {isTelugu ? 'ఛాయాచిత్రాలు & విశేషాలు' : 'Photo Gallery'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC PHOTO SHOWCASE & VISUAL GALLERY (Admin editable) */}
      <div id="photos-section" className="bg-white border-b border-slate-200">
        <PhotoGalleryManager
          targetPage="home"
          sectionTitleEn="Featured Photos & Visual Gallery"
          sectionTitleTe="ముఖ్య ఛాయాచిత్రాలు & విశేషాలు"
        />
      </div>

      {/* 3. DYNAMIC 'NEW UPDATES & SCHEDULE' HIGHLIGHT FEED (watv.org editorial layout) */}
      <section id="updates-section" className="py-20 bg-[#F8FAFC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-[#C59B27] text-xs font-bold uppercase tracking-widest mb-1.5">
                <span className="w-2 h-0.5 bg-[#C59B27]"></span>
                <span>General Assembly Communications</span>
              </div>
              <h2
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F294A] tracking-tight ${
                  isTelugu ? 'font-krishna text-3xl sm:text-4xl' : 'font-serif'
                }`}
              >
                {isTelugu ? 'నూతన తాజా సమాచారం & సమయ పట్టిక' : 'New Updates, Events & Schedule'}
              </h2>
              <p className={`text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl ${isTelugu ? 'font-telugu' : ''}`}>
                {isTelugu
                  ? 'ప్రధాన కార్యాలయం నుండి విడుదలయ్యే అధికారిక ప్రకటనలు, సమావేశాలు మరియు పండుగల సమాచారం.'
                  : 'Active bulletins, holy feast schedules, and official notices from the central administration.'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="mt-4 md:mt-0 flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', labelEn: 'All Highlights', labelTe: 'అన్నీ' },
                { id: 'update', labelEn: 'New Updates', labelTe: 'తాజా సమాచారం' },
                { id: 'event', labelEn: 'Events', labelTe: 'కార్యక్రమాలు' },
                { id: 'schedule', labelEn: 'Schedule', labelTe: 'సమయ పట్టిక' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-[#0F294A] text-[#C59B27] shadow-sm'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span className={isTelugu ? 'font-telugu' : ''}>
                    {isTelugu ? tab.labelTe : tab.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* IN-PAGE FULL ARTICLE READER (No Popup!) */}
          {selectedItem ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg space-y-6 animate-in fade-in duration-200">
              {/* Back to List Button */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-[#C59B27]" />
                  <span>{isTelugu ? '← వార్తల జాబితాకు తిరిగి వెళ్ళండి' : '← Back to All Announcements'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <AudioSpeakerButton
                    text={getDesc(selectedItem)}
                    title={getText(selectedItem, 'title')}
                  />
                  <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-[#C59B27] border border-[#C59B27]/40 rounded-lg">
                    {selectedItem.category || selectedItem.pageSlug || 'Notice'}
                  </span>
                </div>
              </div>

              {/* Title & Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>{selectedItem.date || 'Official Update'}</span>
                </div>
                <h3
                  className={`text-2xl sm:text-3xl font-bold text-[#0F294A] leading-tight ${
                    isTelugu ? 'font-telugu' : 'font-serif'
                  }`}
                >
                  {getText(selectedItem, 'title')}
                </h3>
              </div>

              {/* Image Banner */}
              {selectedItem.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-[460px] bg-slate-100 shadow-xs">
                  <img
                    src={selectedItem.imageUrl}
                    alt={getText(selectedItem, 'title')}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Body Content */}
              <div
                className={`text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line py-2 ${
                  isTelugu ? 'font-telugu leading-loose' : ''
                }`}
              >
                {getDesc(selectedItem)}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between pt-6 border-t border-slate-100 gap-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  {isTelugu ? '← జాబితాకు వెళ్ళండి' : '← Back to List'}
                </button>

                {selectedItem.pageSlug && (
                  <Link
                    to={`/page/home/${selectedItem.pageSlug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F294A] hover:text-[#C59B27]"
                  >
                    <span>Go to Section Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredUpdates.map((item) => {
                const title = getText(item, 'title');
                const desc = getDesc(item);

                return (
                  <article
                    key={item.id}
                    onClick={() => navigate(`/content/${item.id}`)}
                    className="group bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* 16:9 Aspect Cover Image */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={
                            item.imageUrl ||
                            'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80'
                          }
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute top-3 left-3 bg-[#0F294A]/90 backdrop-blur-sm text-[#C59B27] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border border-[#C59B27]/30 shadow-xs">
                          {item.category || item.pageSlug || 'Update'}
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-2">
                          <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                          <span>{item.date || 'Active Notice'}</span>
                        </div>

                        <h3
                          className={`text-lg font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors line-clamp-2 leading-snug ${
                            isTelugu ? 'font-telugu leading-snug' : 'font-serif'
                          }`}
                        >
                          {title}
                        </h3>

                        <p
                          className={`text-slate-600 text-xs sm:text-sm mt-2 line-clamp-3 leading-relaxed ${
                            isTelugu ? 'font-telugu' : ''
                          }`}
                        >
                          {desc}
                        </p>
                      </div>
                    </div>

                    <div className="px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors gap-2">
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <AudioSpeakerButton
                          buttonStyle="icon"
                          text={desc}
                          title={title}
                        />
                        <span className={isTelugu ? 'font-telugu' : ''}>
                          {isTelugu ? 'వివరాలు' : 'Read Details'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
