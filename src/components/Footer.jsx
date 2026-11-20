import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { launchEcosystemApp } from '../utils/sso';
import {
  Award,
  ClipboardCheck,
  BookOpen,
  Video,
  Search,
  ExternalLink,
  Shield,
  Lock,
  Globe,
  ChevronRight,
} from 'lucide-react';

export default function Footer() {
  const { currentUser, userProfile } = useAuth();
  const { t, isTelugu, language, toggleLanguage } = useLanguage();

  const ecosystemLinks = [
    {
      name: 'Eva',
      url: 'https://eva.sni.org.in',
      icon: Award,
      badge: 'eva.sni.org.in',
      isExternal: true,
    },
    {
      name: 'Evaluation',
      url: '/evaluation/',
      icon: ClipboardCheck,
      badge: 'System',
      isExternal: false,
    },
    {
      name: 'Gospel Diary',
      url: '/diary.html',
      icon: BookOpen,
      badge: 'Diary',
      isExternal: false,
    },
    {
      name: 'Videos Library',
      url: '/videos.html',
      icon: Video,
      badge: 'Media',
      isExternal: false,
    },
    {
      name: 'Word Search',
      url: '/wordsearch.html',
      icon: Search,
      badge: 'Study',
      isExternal: false,
    },
  ];

  return (
    <footer className="bg-[#0B1E36] text-slate-300 border-t border-[#132A4A] selection:bg-[#C59B27] selection:text-[#0F294A]">
      {/* Structured Multi-Column Institutional Footer */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Column 1: Organization Seal & Mission (Spans 2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="Super Natural Intelligence"
                className="w-12 h-12 object-contain"
              />
              <div className="flex flex-col justify-center">
                <span className="text-2xl font-black tracking-tight text-[#F4B942] leading-none font-sans">
                  SNI
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.2em] text-white/95 uppercase leading-none mt-1">
                  {isTelugu ? 'సూపర్ నేచురల్ ఇంటెలిజెన్స్' : 'SUPER NATURAL INTELLIGENCE'}
                </span>
              </div>
            </div>

            {t('footerDesc') ? (
              <p
                className={`text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md ${
                  isTelugu ? 'font-telugu leading-loose' : ''
                }`}
              >
                {t('footerDesc')}
              </p>
            ) : null}
          </div>

          {/* Column 2: Categories Navigation */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-[#1A3860] pb-2 text-[#C59B27]">
              {isTelugu ? 'విభాగాలు' : 'Categories'}
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition">
                  {t('navHome')}
                </Link>
              </li>
              <li>
                <Link to="/page/worship/sermons" className="hover:text-white transition">
                  {isTelugu ? 'ఆరాధన & ప్రసంగాలు' : 'Worship & Sermons'}
                </Link>
              </li>
              <li>
                <Link to="/page/bible-truth/father" className="hover:text-white transition">
                  {isTelugu ? 'సత్యం' : 'Truth'}
                </Link>
              </li>
              <li>
                <Link to="/page/family/love" className="hover:text-white transition">
                  {isTelugu ? 'ఆత్మీయ కుటుంబం' : 'Family & Unity'}
                </Link>
              </li>
              <li>
                <Link to="/page/program/diary" className="hover:text-white transition">
                  {isTelugu ? 'సువార్త కార్యక్రమాలు' : 'Programs & Diary'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Ministry Tools */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-[#1A3860] pb-2 text-[#C59B27]">
              Web Ecosystem
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="https://eva.sni.org.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition flex items-center gap-1.5"
                >
                  <span>Eva (eva.sni.org.in)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a href="/evaluation/" className="hover:text-white transition">
                  Evaluation System
                </a>
              </li>
              <li>
                <a href="/diary.html" className="hover:text-white transition">
                  Gospel Diary (సువార్త డైరీ)
                </a>
              </li>
              <li>
                <a href="/videos.html" className="hover:text-white transition">
                  Videos & Sermon Archive
                </a>
              </li>
              <li>
                <a href="/wordsearch.html" className="hover:text-white transition">
                  Scripture Word Search
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Institutional Governance */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-[#1A3860] pb-2 text-[#C59B27]">
              Security & Access
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Firestore RBAC</span>
              </li>
              <li>
                <span className="text-slate-400">Firebase Auth TLS 1.3</span>
              </li>
              <li>
                <span className="text-slate-400">Sacred Feasts Calendar</span>
              </li>
              <li>
                <span className="text-slate-400">Member Verification Policy</span>
              </li>
              <li className="pt-2">
                <button
                  onClick={toggleLanguage}
                  className="inline-flex items-center gap-1.5 text-xs text-[#C59B27] hover:underline cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    Language: {language === 'en' ? 'English (Switch to తెలుగు)' : 'తెలుగు (Switch to English)'}
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Exact Match to Photo 2 */}
        <div className="mt-12 pt-8 border-t border-[#132A4A] flex items-center justify-center text-xs text-slate-400">
          <p className="text-center text-slate-300 tracking-wide">
            © 2026 Preaching Counter. All Rights Reserved. • Powered by{' '}
            <span className="text-[#F4B942] font-semibold">SNI Network</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
