import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Globe,
  LogIn,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  User,
  Award,
  ClipboardCheck,
  BookOpen,
  Video,
  Search,
  ExternalLink,
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const { language, toggleLanguage, t, isTelugu } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [appsDropdownOpen, setAppsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleScrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    setAppsDropdownOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* watv.org style top micro bar */}
      <div className="bg-[#0F294A] text-slate-200 text-[11px] py-1.5 px-4 sm:px-8 border-b border-[#0B1E36]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 tracking-wide font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] animate-pulse"></span>
            <span className={isTelugu ? 'font-telugu' : ''}>
              {isTelugu
                ? 'పరిశుద్ధ సత్య మార్గం • దేవుని సంఘ సమాఖ్య అధికారిక పోర్టల్'
                : 'Spiritual Nature of India • Official Global Assembly Portal'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language toggle pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-[#C59B27] hover:text-[#0F294A] transition-all text-[11px] font-semibold text-slate-200 cursor-pointer"
              title="Switch Language / భాష మార్చండి"
            >
              <Globe className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>{language === 'en' ? 'తెలుగు' : 'English'}</span>
              <span className="text-[9px] px-1 bg-white/20 rounded font-mono">
                {language.toUpperCase()}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Emblem & Seal - watv.org inspired emblem */}
          <Link to="/" className="flex items-center gap-3.5 group shrink-0">
            {/* Elegant Circular Emblem */}
            <div className="relative w-12 h-12 rounded-full bg-[#0F294A] border-2 border-[#C59B27] flex items-center justify-center text-[#C59B27] shadow-md group-hover:scale-105 transition-transform">
              <span className="font-serif font-black text-lg tracking-tighter">SNI</span>
              <div className="absolute -inset-0.5 rounded-full border border-[#C59B27]/40 pointer-events-none"></div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xl font-bold tracking-tight text-[#0F294A] ${
                    isTelugu ? 'font-krishna text-2xl' : 'font-serif'
                  }`}
                >
                  {t('brandName')}
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C59B27]">
                {t('brandTag')}
              </span>
            </div>
          </Link>

          {/* Centered Navigation Links (Editorial watv.org style) */}
          <nav className="hidden lg:flex items-center gap-7">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-[13px] uppercase tracking-wider font-semibold py-2 transition-colors relative ${
                  isActive && location.hash === ''
                    ? 'text-[#0F294A] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#C59B27]'
                    : 'text-slate-600 hover:text-[#0F294A]'
                } ${isTelugu ? 'font-telugu tracking-normal normal-case' : ''}`
              }
            >
              {t('navHome')}
            </NavLink>

            <button
              onClick={() => handleScrollToSection('news-section')}
              className={`text-[13px] uppercase tracking-wider font-semibold py-2 text-slate-600 hover:text-[#0F294A] transition-colors cursor-pointer ${
                isTelugu ? 'font-telugu tracking-normal normal-case' : ''
              }`}
            >
              {t('navNewsEvents')}
            </button>

            <button
              onClick={() => handleScrollToSection('media-section')}
              className={`text-[13px] uppercase tracking-wider font-semibold py-2 text-slate-600 hover:text-[#0F294A] transition-colors cursor-pointer ${
                isTelugu ? 'font-telugu tracking-normal normal-case' : ''
              }`}
            >
              {t('navMediaVideos')}
            </button>

            {/* Ecosystem Apps Dropdown */}
            <div className="relative">
              <button
                onClick={() => setAppsDropdownOpen(!appsDropdownOpen)}
                onMouseEnter={() => setAppsDropdownOpen(true)}
                className={`inline-flex items-center gap-1 text-[13px] uppercase tracking-wider font-semibold py-2 text-slate-600 hover:text-[#0F294A] transition-colors cursor-pointer ${
                  isTelugu ? 'font-telugu tracking-normal normal-case' : ''
                }`}
              >
                <span>{t('navEcosystemApps')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${appsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {appsDropdownOpen && (
                <div
                  onMouseLeave={() => setAppsDropdownOpen(false)}
                  className="absolute left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Integrated Ministry Apps
                  </div>
                  <a
                    href="https://eva.sni.org.in"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-slate-800 text-xs font-semibold group transition"
                  >
                    <Award className="w-4 h-4 text-[#C59B27]" />
                    <span className="flex-1">Eva Portal (eva.sni.org.in)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                  </a>
                  <a
                    href="/evaluation/"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-slate-800 text-xs font-semibold group transition"
                  >
                    <ClipboardCheck className="w-4 h-4 text-[#0F294A]" />
                    <span>Evaluation System</span>
                  </a>
                  <a
                    href="/diary.html"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-slate-800 text-xs font-semibold group transition"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Gospel Diary</span>
                  </a>
                  <a
                    href="/videos.html"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-slate-800 text-xs font-semibold group transition"
                  >
                    <Video className="w-4 h-4 text-rose-600" />
                    <span>Videos Library</span>
                  </a>
                  <a
                    href="/wordsearch.html"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-slate-800 text-xs font-semibold group transition"
                  >
                    <Search className="w-4 h-4 text-violet-600" />
                    <span>Word Search</span>
                  </a>
                </div>
              )}
            </div>

            {/* Member Portal Link */}
            <NavLink
              to={currentUser ? '/dashboard' : '/login'}
              className={({ isActive }) =>
                `text-[13px] uppercase tracking-wider font-semibold py-2 transition-colors relative ${
                  isActive
                    ? 'text-[#0F294A] font-bold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#C59B27]'
                    : 'text-slate-600 hover:text-[#0F294A]'
                } ${isTelugu ? 'font-telugu tracking-normal normal-case' : ''}`
              }
            >
              {t('navMemberPortal')}
            </NavLink>
          </nav>

          {/* Right Section: Admin Badge, User Profile / Sign In */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                {/* Admin Badge */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#0F294A] border border-[#C59B27]/40 text-xs font-bold transition shadow-xs"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>{t('navAdmin')}</span>
                  </Link>
                )}

                {/* Member Avatar / Pill */}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 border border-slate-200/80 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0F294A] text-[#C59B27] flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                    {userProfile?.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Sign out / లాగౌట్"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F294A] hover:bg-[#0B1E36] text-[#C59B27] hover:text-amber-300 text-xs uppercase font-bold tracking-wider transition shadow-sm border border-[#C59B27]/30"
              >
                <LogIn className="w-4 h-4" />
                <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                  {t('navSignIn')}
                </span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:text-[#0F294A] hover:bg-slate-100 transition focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-5 pt-4 pb-6 space-y-3 shadow-xl">
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-bold text-slate-800 hover:text-[#0F294A] py-2"
          >
            {t('navHome')}
          </NavLink>

          <button
            onClick={() => handleScrollToSection('news-section')}
            className="block w-full text-left text-base font-bold text-slate-800 hover:text-[#0F294A] py-2 cursor-pointer"
          >
            {t('navNewsEvents')}
          </button>

          <button
            onClick={() => handleScrollToSection('media-section')}
            className="block w-full text-left text-base font-bold text-slate-800 hover:text-[#0F294A] py-2 cursor-pointer"
          >
            {t('navMediaVideos')}
          </button>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t('navEcosystemApps')}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="https://eva.sni.org.in"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-slate-50 font-semibold text-slate-800 flex items-center justify-between"
              >
                <span>Eva Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a href="/evaluation/" className="p-2.5 rounded-xl bg-slate-50 font-semibold text-slate-800">
                Evaluation
              </a>
              <a href="/diary.html" className="p-2.5 rounded-xl bg-slate-50 font-semibold text-slate-800">
                Gospel Diary
              </a>
              <a href="/videos.html" className="p-2.5 rounded-xl bg-slate-50 font-semibold text-slate-800">
                Videos Library
              </a>
              <a href="/wordsearch.html" className="p-2.5 rounded-xl bg-slate-50 font-semibold text-slate-800 col-span-2">
                Scripture Word Search
              </a>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F294A] text-[#C59B27] flex items-center justify-center font-bold">
                      {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {userProfile?.displayName || currentUser.email}
                      </div>
                      <div className="text-xs text-slate-500 uppercase font-semibold">
                        {userProfile?.role || 'member'}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs"
                    >
                      Admin
                    </Link>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 text-center rounded-xl bg-[#0F294A] text-[#C59B27] font-bold text-xs"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-3 text-center rounded-xl bg-[#0F294A] text-[#C59B27] font-bold text-sm"
              >
                {t('navSignIn')}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
