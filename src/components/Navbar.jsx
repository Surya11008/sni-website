import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
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

  // Role permissions filtering
  const [rolePermissions, setRolePermissions] = useState(['*']);

  useEffect(() => {
    const isUserAdmin =
      userProfile?.role === 'admin' ||
      currentUser?.email === 'surya11008@sni.org.in' ||
      currentUser?.email === 'admin@sni.org.in' ||
      currentUser?.email?.startsWith('surya');

    if (isUserAdmin) {
      setRolePermissions(['*']);
      return;
    }

    if (userProfile?.role) {
      getDoc(doc(db, 'roles', userProfile.role))
        .then((snap) => {
          if (snap.exists() && snap.data().allowedCategories) {
            setRolePermissions(snap.data().allowedCategories);
          } else {
            setRolePermissions(['*']);
          }
        })
        .catch(() => setRolePermissions(['*']));
    } else {
      setRolePermissions(['*']);
    }
  }, [userProfile?.role, currentUser?.email]);

  const visibleCategories = portalStructure.filter((cat) => {
    if (!rolePermissions || rolePermissions.includes('*')) return true;
    return rolePermissions.includes(cat.categorySlug);
  });

  return (
    <header className="sticky top-0 z-50 bg-[#071B3B] border-b border-[#132A4A] shadow-[0_4px_25px_rgba(0,0,0,0.3)] font-sans">
      {/* Top micro bar */}
      <div className="bg-[#040E1E] text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 border-b border-[#0C1D36]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 tracking-wide font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F4B942] animate-pulse"></span>
            <span className="font-bold tracking-wider text-[#F4B942] text-xs">SNI</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language toggle pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-[#F4B942] hover:text-[#071B3B] transition-all text-[11px] font-semibold text-slate-200 cursor-pointer"
              title="Switch Language / భాష మార్చండి"
            >
              <Globe className="w-3.5 h-3.5 text-[#F4B942]" />
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
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="SNI Logo"
                className="w-12 h-12 object-contain drop-shadow-sm"
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-2xl sm:text-3xl font-black tracking-wider text-[#F4B942] leading-none font-sans">
                SNI
              </span>
            </div>
          </Link>

          {/* 8 Main Categories Mega-Menu (Desktop - Role Filtered) */}
          <nav
            ref={dropdownRef}
            className="hidden xl:flex items-center gap-1 lg:gap-2.5 relative"
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {visibleCategories.map((cat) => {
              const catTitle = isTelugu ? cat.titleTe : cat.titleEn;
              const isOpen = activeDropdown === cat.categorySlug;
              const isCategoryActive =
                location.pathname.startsWith(`/category/${cat.categorySlug}`) ||
                location.pathname.startsWith(`/page/${cat.categorySlug}`) ||
                (cat.categorySlug === 'home' && location.pathname === '/');

              return (
                <div key={cat.categorySlug} className="relative">
                  <Link
                    to={cat.categorySlug === 'home' ? '/' : `/category/${cat.categorySlug}`}
                    onClick={() => setActiveDropdown(null)}
                    onMouseEnter={() => setActiveDropdown(cat.categorySlug)}
                    className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      isOpen || isCategoryActive
                        ? 'text-[#F4B942] bg-white/15 border-b-2 border-[#F4B942]'
                        : 'text-slate-200 hover:text-[#F4B942] hover:bg-white/5'
                    } ${isTelugu ? 'font-telugu normal-case text-xs' : ''}`}
                  >
                    <span>{catTitle}</span>
                    <ChevronDown
                      className={`w-3 h-3 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-[#F4B942]' : ''
                      }`}
                    />
                  </Link>

                  {/* Dropdown Menu Panel for this category - Compact without extra explanations */}
                  {isOpen && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[280px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseEnter={() => setActiveDropdown(cat.categorySlug)}
                    >
                      {/* Compact Dropdown Header linking to main Category page */}
                      <Link
                        to={cat.categorySlug === 'home' ? '/' : `/category/${cat.categorySlug}`}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center justify-between px-2.5 py-1.5 mb-1.5 border-b border-slate-100 hover:bg-amber-50/70 rounded-lg group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-[#0F294A] text-[#C59B27] flex items-center justify-center">
                            <PortalIcon name={cat.iconName} className="w-3.5 h-3.5" />
                          </div>
                          <div className={`text-xs font-bold text-[#0F294A] truncate group-hover:text-[#C59B27] ${isTelugu ? 'font-telugu' : ''}`}>
                            {catTitle}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#C59B27] flex items-center gap-0.5">
                          <span>{isTelugu ? 'పేజీ' : 'Main'}</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </Link>

                      {/* Compact Sub-Pages List - Close together without bulky descriptions */}
                      <div className="flex flex-col gap-0.5 max-h-[340px] overflow-y-auto">
                        {cat.pages.map((page) => {
                          const pageTitle = isTelugu ? page.titleTe : page.titleEn;

                          if (page.externalUrl) {
                            return (
                              <a
                                key={page.pageSlug}
                                href={page.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setActiveDropdown(null)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-800 transition group text-xs font-medium"
                              >
                                <div className="w-5 h-5 rounded-md bg-amber-50 text-[#C59B27] flex items-center justify-center shrink-0">
                                  <PortalIcon name={page.iconName} className="w-3 h-3" />
                                </div>
                                <span className={`truncate flex-1 ${isTelugu ? 'font-telugu' : ''}`}>{pageTitle}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#C59B27] shrink-0" />
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={page.pageSlug}
                              to={`/page/${cat.categorySlug}/${page.pageSlug}`}
                              onClick={() => setActiveDropdown(null)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-amber-50/70 hover:text-[#0F294A] text-slate-700 transition group text-xs font-medium"
                            >
                              <div className="w-5 h-5 rounded-md bg-slate-100 text-[#0F294A] group-hover:bg-[#0F294A] group-hover:text-[#F4B942] flex items-center justify-center shrink-0 transition-colors">
                                <PortalIcon name={page.iconName} className="w-3 h-3" />
                              </div>
                              <span className={`truncate flex-1 ${isTelugu ? 'font-telugu' : ''}`}>{pageTitle}</span>
                              <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-[#C59B27] group-hover:translate-x-0.5 transition-transform shrink-0" />
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-[#F4B942] border border-[#F4B942]/40 text-xs font-bold transition shadow-xs"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#F4B942]" />
                    <span>{t('navAdmin')}</span>
                  </Link>
                )}

                {/* Dashboard Button */}
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/10 border border-white/15 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-[#F4B942] text-[#071B3B] flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0) : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-slate-200 max-w-[110px] truncate">
                    {userProfile?.displayName || currentUser.email?.split('@')[0]}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition cursor-pointer"
                  title="Sign out / లాగౌట్"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] text-xs uppercase font-bold tracking-wider transition shadow-sm"
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
              className="p-2.5 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu with Accordion */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#132A4A] bg-[#071B3B] px-4 pt-3 pb-6 space-y-2 shadow-xl max-h-[85vh] overflow-y-auto">
          {/* User Status / Login */}
          <div className="pb-3 border-b border-[#132A4A]">
            {currentUser ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0B1E36] border border-[#132A4A]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F4B942] text-[#071B3B] flex items-center justify-center font-bold">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {userProfile?.displayName || currentUser.email}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {userProfile?.role || 'Member'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 text-[#F4B942] hover:bg-white/10 rounded-lg text-xs font-bold"
                    >
                      <Shield className="w-4 h-4 text-[#F4B942]" />
                    </Link>
                  )}
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-slate-200 hover:bg-white/10 rounded-lg text-xs font-bold"
                  >
                    {t('navDashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-rose-400 hover:bg-white/10 rounded-lg cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#F4B942] text-[#071B3B] font-bold text-xs uppercase"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('navSignIn')}</span>
              </Link>
            )}
          </div>

          {/* Quick Welcome Nav */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-slate-200 hover:text-[#F4B942] py-1.5 px-2 rounded-lg hover:bg-white/5"
          >
            {isTelugu ? 'స్వాగతం' : 'Welcome'}
          </Link>

          {/* Accordion Categories - Role Filtered */}
          <div className="space-y-1">
            {visibleCategories.map((cat) => {
              const catTitle = isTelugu ? cat.titleTe : cat.titleEn;
              const isExpanded = mobileExpandedCat === cat.categorySlug;

              return (
                <div key={cat.categorySlug} className="border border-[#132A4A] rounded-xl overflow-hidden bg-[#0B1E36]">
                  <div className="w-full flex items-center justify-between p-2.5 hover:bg-[#0E2542] text-left font-bold text-xs text-slate-200 transition">
                    <Link
                      to={cat.categorySlug === 'home' ? '/' : `/category/${cat.categorySlug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <PortalIcon name={cat.iconName} className="w-4 h-4 text-[#F4B942]" />
                      <span className={isTelugu ? 'font-telugu' : ''}>{catTitle}</span>
                    </Link>
                    <button
                      onClick={() =>
                        setMobileExpandedCat(isExpanded ? null : cat.categorySlug)
                      }
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-180 text-[#F4B942]' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-2 bg-[#040E1E] space-y-1 border-t border-[#132A4A]">
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
                              className="flex items-center justify-between p-2 rounded-lg text-xs text-slate-300 hover:bg-white/10"
                            >
                              <div className="flex items-center gap-2">
                                <PortalIcon name={page.iconName} className="w-3.5 h-3.5 text-[#F4B942]" />
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
                            className="flex items-center justify-between p-2 rounded-lg text-xs text-slate-300 hover:bg-white/10"
                          >
                            <div className="flex items-center gap-2">
                              <PortalIcon name={page.iconName} className="w-3.5 h-3.5 text-[#F4B942]" />
                              <span className={isTelugu ? 'font-telugu' : ''}>{pageTitle}</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
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
