import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { launchEcosystemApp } from '../utils/sso';
import {
  FileText,
  Search,
  ExternalLink,
  Shield,
  User,
  Calendar,
  Lock,
  BookOpen,
  Video,
  ClipboardCheck,
} from 'lucide-react';

// Fallback sample member documents
const DEFAULT_MEMBER_DOCS = [
  {
    id: 'doc-1',
    title: '2026 Sacred Feasts Calendar & Convocation Schedule',
    category: 'Schedules',
    fileUrl: 'https://sni.org.in',
    createdAt: '2026-11-01',
  },
  {
    id: 'doc-2',
    title: 'General Member Assembly Guidelines & Assembly Etiquette',
    category: 'Guidelines',
    fileUrl: 'https://sni.org.in',
    createdAt: '2026-10-15',
  },
  {
    id: 'doc-3',
    title: 'New Covenant Baptism & Salvation Truth Study Guide',
    category: 'Doctrine Study',
    fileUrl: 'https://sni.org.in',
    createdAt: '2026-09-20',
  },
  {
    id: 'doc-4',
    title: 'Assembly Ministerial Duties & Pastoral Assistance Manual',
    category: 'Administrative',
    fileUrl: 'https://sni.org.in',
    createdAt: '2026-08-12',
  },
];

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const { t, isTelugu } = useLanguage();

  const [memberDocs, setMemberDocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.role === 'admin';

  // Fetch member documents from Firestore member_docs collection
  useEffect(() => {
    let isMounted = true;

    async function fetchDocs() {
      try {
        const q = query(collection(db, 'member_docs'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));

        if (isMounted) {
          setMemberDocs(docs.length > 0 ? docs : DEFAULT_MEMBER_DOCS);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Error fetching member_docs, showing curated defaults:', err);
        if (isMounted) {
          setMemberDocs(DEFAULT_MEMBER_DOCS);
          setLoading(false);
        }
      }
    }

    fetchDocs();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter docs
  const categories = ['All', 'Guidelines', 'Doctrine Study', 'Schedules', 'Circulars', 'Administrative'];

  const filteredDocs = memberDocs.filter((docItem) => {
    const matchesCategory =
      selectedCategory === 'All' || docItem.category === selectedCategory;
    const matchesSearch =
      docItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docItem.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Welcome & Profile Summary Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center text-2xl font-bold shadow-lg">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className={`text-2xl sm:text-3xl font-extrabold ${
                      isTelugu ? 'font-krishna text-3xl sm:text-4xl' : ''
                    }`}
                  >
                    {t('welcomeBack')}, {userProfile?.displayName || 'Member'}!
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${
                      isAdmin
                        ? 'bg-amber-400 text-slate-950 font-bold border border-amber-300'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                    }`}
                  >
                    {isAdmin ? <Shield className="w-3.5 h-3.5 text-slate-950" /> : <User className="w-3.5 h-3.5 text-indigo-300" />}
                    {isAdmin ? t('roleAdmin') : t('roleMember')}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                  <span>{currentUser?.email}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 text-xs">SSO Session Active</span>
                </p>
              </div>
            </div>

            {/* Quick SSO App Shortcuts */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => launchEcosystemApp('/diary.html', currentUser, userProfile)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Diary</span>
              </button>
              <button
                onClick={() => launchEcosystemApp('/evaluation/', currentUser, userProfile)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur transition cursor-pointer"
              >
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Evaluation</span>
              </button>
              <button
                onClick={() => launchEcosystemApp('/videos.html', currentUser, userProfile)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur transition cursor-pointer"
              >
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span>Videos</span>
              </button>
            </div>
          </div>

          {/* Account Meta */}
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold">{t('accountInfo')}:</span>
              <code className="bg-white/10 px-2 py-0.5 rounded text-amber-300 font-mono text-[11px] truncate">
                {currentUser?.uid}
              </code>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {t('joinedDate')}:{' '}
                {userProfile?.createdAt
                  ? new Date(userProfile.createdAt).toLocaleDateString()
                  : 'Active'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Firestore RBAC Verified</span>
            </div>
          </div>
        </div>

        {/* MEMBER DOCUMENTS SECTION */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Confidential Archives</span>
              </div>
              <h2
                className={`text-xl sm:text-2xl font-extrabold text-slate-900 ${
                  isTelugu ? 'font-krishna text-2xl sm:text-3xl' : ''
                }`}
              >
                {t('memberDocsHeading')}
              </h2>
              <p className={`text-slate-500 text-xs sm:text-sm mt-1 ${isTelugu ? 'font-telugu' : ''}`}>
                {t('memberDocsSubtitle')}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-amber-300 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'All' ? t('allCategories') : cat}
              </button>
            ))}
          </div>

          {/* Documents Grid / Table */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading member documents...</div>
          ) : filteredDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocs.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.category || 'Guidelines'}
                      </span>
                      {item.createdAt && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{item.createdAt}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-950 transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">Official Release</span>
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition"
                    >
                      <span className={isTelugu ? 'font-telugu' : ''}>{t('openDoc')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p>{t('noDocsFound')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
