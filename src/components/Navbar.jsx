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
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, userProfile, updateUserPassword, logout } = useAuth();
  const { language, toggleLanguage, t, isTelugu } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [portalStructure, setPortalStructure] = useState(DEFAULT_PORTAL_STRUCTURE);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);

  // User Dropdown & Change Password Modal states
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

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
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);
      await logout();
      window.location.href = '/signin';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      await updateUserPassword(newPassword);
      setPasswordSuccess('Password successfully updated!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Password update failed:', err);
      setPasswordError(err.message || 'Failed to update password. Please re-login and try again.');
    } finally {
      setPasswordLoading(false);
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

  const isCategoryPermitted = (cat) => {
    if (!rolePermissions || rolePermissions.includes('*')) return true;
    if (rolePermissions.includes(cat.categorySlug)) return true;
    return cat.pages?.some(
      (p) =>
        rolePermissions.includes(p.pageSlug) ||
        rolePermissions.includes(`${cat.categorySlug}/${p.pageSlug}`)
    );
  };

  const isPagePermitted = (catSlug, page) => {
    if (!rolePermissions || rolePermissions.includes('*')) return true;
    if (rolePermissions.includes(catSlug)) return true;
    return (
      rolePermissions.includes(page.pageSlug) ||
      rolePermissions.includes(`${catSlug}/${page.pageSlug}`)
    );
  };

  const visibleCategories = portalStructure.filter(isCategoryPermitted);

  return (
    <header className="sticky top-0 z-50 bg-[#071B3B] border-b border-[#132A4A] shadow-[0_4px_25px_rgba(0,0,0,0.3)] font-sans">
      {/* Main Sleek & Compact Navbar Bar */}
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-4">
          {/* Brand Emblem & Title on the Far Left */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="SNI Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm"
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-[#F4B942] leading-none font-sans">
                SNI
              </span>
            </div>
          </Link>

          {/* Spacer to push pages header towards right side leaving good gap from SNI */}
          <div className="flex-1" />

          {/* Main Categories Menu sitting closer together on the right side */}
          <nav
            ref={dropdownRef}
            className="hidden xl:flex items-center gap-1 relative"
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {visibleCategories.map((cat) => {
              const catTitle = isTelugu ? cat.titleTe : cat.titleEn;
              const isOpen = activeDropdown === cat.categorySlug;
              const isCategoryActive =
                location.pathname.startsWith(`/category/${cat.categorySlug}`) ||
                location.pathname.startsWith(`/page/${cat.categorySlug}`) ||
                location.pathname.toLowerCase().startsWith(`/home/${cat.categorySlug.toLowerCase()}`) ||
                (cat.categorySlug === 'home' && (location.pathname === '/' || location.pathname.toLowerCase() === '/home'));

              return (
                <div
                  key={cat.categorySlug}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(cat.categorySlug)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    to={cat.categorySlug === 'home' ? '/' : `/category/${cat.categorySlug}`}
                    onClick={() => setActiveDropdown(null)}
                    onMouseEnter={() => setActiveDropdown(cat.categorySlug)}
                    className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
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
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 pt-1.5 w-[280px] z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* Invisible hover bridge ensuring the cursor never disconnects across frames */}
                      <div className="absolute -top-3 inset-x-0 h-4 bg-transparent" />

                      {/* Little top pointer arrow connecting button directly to dropdown card */}
                      <div className="w-3 h-3 bg-white rotate-45 border-t border-l border-slate-200/90 mx-auto -mb-1.5 relative z-20 shadow-xs" />

                      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 relative z-10">
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
                          <span>Main</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </Link>

                      {/* Compact Sub-Pages List - Close together without bulky descriptions */}
                      <div className="flex flex-col gap-0.5 max-h-[340px] overflow-y-auto">
                        {cat.pages.filter((page) => isPagePermitted(cat.categorySlug, page)).map((page) => {
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
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Section: Admin, Member/Login */}
          <div className="hidden lg:flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                {/* Admin Button */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-[#F4B942] border border-[#F4B942]/40 text-xs font-bold transition shadow-xs"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#F4B942]" />
                    <span>{t('navAdmin')}</span>
                  </Link>
                )}

                {/* User Profile Menu Button (No direct dashboard redirect) */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-white/10 border border-white/15 transition cursor-pointer text-left"
                    title="User account settings"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#F4B942] text-[#071B3B] flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {userProfile?.displayName ? userProfile.displayName.charAt(0) : <User className="w-3 h-3" />}
                    </div>
                    <span className="text-xs font-bold text-slate-200 max-w-[110px] truncate">
                      {userProfile?.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${userMenuOpen ? 'rotate-180 text-[#F4B942]' : ''}`} />
                  </button>

                  {/* User Dropdown Menu: Only Change Password & Logout */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <div className="text-xs font-bold text-[#071B3B] truncate">
                          {userProfile?.displayName || 'User'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {currentUser.email}
                        </div>
                        <div className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 uppercase tracking-wider">
                          {userProfile?.role || 'Member'}
                        </div>
                      </div>

                      <div className="pt-1.5 space-y-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            setPasswordModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#071B3B] hover:bg-slate-100 rounded-xl transition text-left cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-amber-600" />
                          <span>Change Password</span>
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <a
                href="/signin"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] text-xs uppercase font-bold tracking-wider transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                  {t('navSignIn')}
                </span>
              </a>
            )}

            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 hover:text-[#F4B942] text-xs font-semibold transition cursor-pointer shadow-xs ml-1"
              title={language === 'te' ? 'Switch to English' : 'తెలుగులోకి మార్చండి'}
            >
              <Globe className="w-3.5 h-3.5 text-[#F4B942]" />
              <span className={language === 'te' ? 'font-telugu font-bold text-amber-300' : 'font-bold'}>
                {language === 'te' ? 'తెలుగు' : 'English'}
              </span>
            </button>
          </div>

          {/* Mobile Menu Actions & Hamburger */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 text-slate-200 hover:text-white border border-white/15 text-xs font-medium cursor-pointer"
              title={language === 'te' ? 'Switch to English' : 'తెలుగు'}
            >
              <Globe className="w-3.5 h-3.5 text-[#F4B942]" />
              <span className={language === 'te' ? 'font-telugu font-bold text-amber-300' : 'font-bold'}>
                {language === 'te' ? 'తె' : 'EN'}
              </span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition focus:outline-none cursor-pointer"
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
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setPasswordModalOpen(true);
                    }}
                    className="p-2 text-slate-200 hover:bg-white/10 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    title="Change Password"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Password</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-rose-400 hover:bg-white/10 rounded-lg cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <a
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#F4B942] text-[#071B3B] font-bold text-xs uppercase"
              >
                <LogIn className="w-4 h-4" />
                <span>{t('navSignIn')}</span>
              </a>
            )}
          </div>

          {/* Mobile Language Switcher Row */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#F4B942]" />
              <span className="font-semibold">{isTelugu ? 'భాష ఎంపిక' : 'Language'}</span>
            </div>
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 rounded-lg bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] font-bold text-xs transition cursor-pointer"
            >
              {language === 'te' ? 'తెలుగు (Switch to EN)' : 'English (తెలుగులోకి)'}
            </button>
          </div>

          {/* Quick Home Nav */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-slate-200 hover:text-[#F4B942] py-1.5 px-2 rounded-lg hover:bg-white/5"
          >
            {isTelugu ? 'స్వాగతం' : 'Home'}
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
                      {cat.pages.filter((page) => isPagePermitted(cat.categorySlug, page)).map((page) => {
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

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0B1E36] border border-[#1E3A5F] rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setPasswordModalOpen(false);
                setPasswordError('');
                setPasswordSuccess('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-[#F4B942] flex items-center justify-center border border-[#F4B942]/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Change Password</h3>
                <p className="text-xs text-slate-400">Set a new secure password for your account</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#071324] border border-[#1A3353] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#F4B942]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#071324] border border-[#1A3353] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#F4B942]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/10 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] transition shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
