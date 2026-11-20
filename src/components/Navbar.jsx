import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_PORTAL_STRUCTURE, mergePortalStructure } from '../config/portalStructure';
import PortalIcon from './PortalIcon';
import {
  Globe,
  LogIn,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronDown,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const { language, toggleLanguage, t, isTelugu } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [portalStructure, setPortalStructure] = useState(DEFAULT_PORTAL_STRUCTURE);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Subscribe to custom pages from Firestore `portal_pages`
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
          console.warn('Using default portal structure, Firestore offline/inaccessible:', error);
          setPortalStructure(DEFAULT_PORTAL_STRUCTURE);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('Error setting up portal_pages listener:', err);
      setPortalStructure(DEFAULT_PORTAL_STRUCTURE);
    }
  }, []);

  // Close dropdown when route changes or user clicks outside
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] font-sans">
      {/* Top micro bar - watv.org inspired institutional notice */}
      <div className="bg-[#0F294A] text-slate-200 text-[11px] py-1.5 px-4 sm:px-8 border-b border-[#0B1E36]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 tracking-wide font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] animate-pulse"></span>
            <span className={isTelugu ? 'font-telugu' : ''}>
              {isTelugu
                ? 'సూపర్ నేచురల్ ఇంటెలిజెన్స్ (SNI)'
                : 'Super Natural Intelligence (SNI)'}
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

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Emblem & Title */}
          <Link to="/" className="flex items-center gap-3.5 group shrink-0">
            <div className="relative w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="Super Natural Intelligence Logo"
                className="w-12 h-12 object-contain drop-shadow-sm"
              />
            </div>

            <div className="flex flex-col">
              <span
                className={`text-lg sm:text-xl font-bold tracking-tight text-[#0F294A] leading-tight ${
                  isTelugu ? 'font-krishna text-2xl' : 'font-serif'
                }`}
              >
                {t('brandName')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C59B27]">
                {t('brandTag')}
              </span>
            </div>
          </Link>

          {/* 8 Main Categories Mega-Menu (Desktop) */}
          <nav
            ref={dropdownRef}
            className="hidden xl:flex items-center gap-1 lg:gap-2.5 relative"
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {portalStructure.map((cat) => {
              const catTitle = isTelugu ? cat.titleTe : cat.titleEn;
              const isOpen = activeDropdown === cat.categorySlug;
              const isCategoryActive = location.pathname.startsWith(`/page/${cat.categorySlug}`);

              return (
                <div key={cat.categorySlug} className="relative">
                  <button
                    onClick={() =>
                      setActiveDropdown(isOpen ? null : cat.categorySlug)
                    }
                    onMouseEnter={() => setActiveDropdown(cat.categorySlug)}
                    className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      isOpen || isCategoryActive
                        ? 'text-[#0F294A] bg-amber-50/80 border-b-2 border-[#C59B27]'
                        : 'text-slate-700 hover:text-[#0F294A] hover:bg-slate-50'
                    } ${isTelugu ? 'font-telugu normal-case text-xs' : ''}`}
                  >
                    <span>{catTitle}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-[#C59B27]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Panel for this category */}
                  {isOpen && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[420px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseEnter={() => setActiveDropdown(cat.categorySlug)}
                    >
                      {/* Dropdown Header */}
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#0F294A] text-[#C59B27] flex items-center justify-center">
                            <PortalIcon name={cat.iconName} className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0F294A]">
                              {catTitle}
                            </div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">
                              {isTelugu ? cat.descriptionTe : cat.descriptionEn}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sub-Pages Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[360px] overflow-y-auto pr-1">
                        {cat.pages.map((page) => {
                          const pageTitle = isTelugu ? page.titleTe : page.titleEn;
                          const pageDesc = isTelugu ? page.descTe : page.descEn;

                          if (page.externalUrl) {
                            return (
                              <a
                                key={page.pageSlug}
                                href={page.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setActiveDropdown(null)}
                                className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group text-left"
                              >
                                <div className="w-6 h-6 rounded-md bg-amber-50 text-[#C59B27] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                  <PortalIcon name={page.iconName} className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#0F294A] flex items-center gap-1">
                                    <span className="truncate">{pageTitle}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#C59B27]" />
                                  </div>
                                  {pageDesc && (
                                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                      {pageDesc}
                                    </p>
                                  )}
                                </div>
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={page.pageSlug}
                              to={`/page/${cat.categorySlug}/${page.pageSlug}`}
                              onClick={() => setActiveDropdown(null)}
                              className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 group text-left"
                            >
                              <div className="w-6 h-6 rounded-md bg-slate-100 text-[#0F294A] group-hover:bg-[#0F294A] group-hover:text-[#C59B27] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                                <PortalIcon name={page.iconName} className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-800 group-hover:text-[#0F294A] flex items-center justify-between">
                                  <span className="truncate">{pageTitle}</span>
                                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-[#C59B27] group-hover:translate-x-0.5 transition-transform" />
                                </div>
                                {pageDesc && (
                                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                    {pageDesc}
                                  </p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Section: Admin, Member/Login */}
          <div className="hidden lg:flex items-center gap-2.5">
            {currentUser ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                {/* Admin Button */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#0F294A] border border-[#C59B27]/40 text-xs font-bold transition shadow-xs"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>{t('navAdmin')}</span>
                  </Link>
                )}

                {/* Dashboard Button */}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 border border-slate-200/80 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0F294A] text-[#C59B27] flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[110px] truncate">
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F294A] hover:bg-[#0B1E36] text-[#C59B27] hover:text-amber-300 text-xs uppercase font-bold tracking-wider transition shadow-sm border border-[#C59B27]/30"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                  {t('navSignIn')}
                </span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex xl:hidden items-center gap-2">
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

      {/* Mobile Drawer Menu with Accordion */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl max-h-[85vh] overflow-y-auto">
          {/* User Status / Login */}
          <div className="pb-3 border-b border-slate-100">
            {currentUser ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0F294A] text-[#C59B27] flex items-center justify-center font-bold">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {userProfile?.displayName || currentUser.email}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {userProfile?.role || 'Member'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 text-[#0F294A] hover:bg-amber-100 rounded-lg text-xs font-bold"
                    >
                      <Shield className="w-4 h-4 text-[#C59B27]" />
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold"
                  >
                    {t('navDashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#0F294A] text-[#C59B27] font-bold text-xs uppercase"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('navSignIn')}</span>
              </Link>
            )}
          </div>

          {/* Quick Home Nav */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-slate-900 hover:text-[#0F294A] py-1.5 px-2 rounded-lg hover:bg-slate-50"
          >
            {isTelugu ? 'ముఖ్య హోమ్ పేజీ' : 'Home'}
          </Link>

          {/* Accordion Categories */}
          <div className="space-y-1">
            {portalStructure.map((cat) => {
              const catTitle = isTelugu ? cat.titleTe : cat.titleEn;
              const isExpanded = mobileExpandedCat === cat.categorySlug;

              return (
                <div key={cat.categorySlug} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() =>
                      setMobileExpandedCat(isExpanded ? null : cat.categorySlug)
                    }
                    className="w-full flex items-center justify-between p-3 bg-slate-50/70 hover:bg-slate-100 text-left font-bold text-xs text-slate-800 transition"
                  >
                    <div className="flex items-center gap-2">
                      <PortalIcon name={cat.iconName} className="w-4 h-4 text-[#C59B27]" />
                      <span className={isTelugu ? 'font-telugu' : ''}>{catTitle}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isExpanded ? 'rotate-180 text-[#C59B27]' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="p-2 bg-white space-y-1 border-t border-slate-100">
                      {cat.pages.map((page) => {
                        const pageTitle = isTelugu ? page.titleTe : page.titleEn;

                        if (page.externalUrl) {
                          return (
                            <a
                              key={page.pageSlug}
                              href={page.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center justify-between p-2 rounded-lg text-xs text-slate-700 hover:bg-amber-50"
                            >
                              <div className="flex items-center gap-2">
                                <PortalIcon name={page.iconName} className="w-3.5 h-3.5 text-[#C59B27]" />
                                <span className={isTelugu ? 'font-telugu' : ''}>{pageTitle}</span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          );
                        }

                        return (
                          <Link
                            key={page.pageSlug}
                            to={`/page/${cat.categorySlug}/${page.pageSlug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-between p-2 rounded-lg text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <PortalIcon name={page.iconName} className="w-3.5 h-3.5 text-[#0F294A]" />
                              <span className={isTelugu ? 'font-telugu' : ''}>{pageTitle}</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
