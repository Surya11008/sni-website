import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { speakWelcomeVoice } from '../../utils/soundEffects';
import {
  Lock,
  Phone,
  KeyRound,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  LogIn,
  Clock,
  ArrowRight,
  HelpCircle,
  FileText,
  Eye,
  EyeOff,
  Smartphone,
  Download,
} from 'lucide-react';
import LanguageSwitcher from '../common/LanguageSwitcher';
import InstallAppModal from '../common/InstallAppModal';

export default function AuthPage() {
  const { login, register, resetPasswordWithContact, t, data } = useApp();

  const isAutoApproval = data?.settings?.autoUserApproval !== false;

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleOpenInstall = async () => {
    if (window.deferredPWAInstallPrompt) {
      try {
        window.deferredPWAInstallPrompt.prompt();
        const choice = await window.deferredPWAInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          window.deferredPWAInstallPrompt = null;
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setShowInstallModal(true);
  };

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isPendingNotice, setIsPendingNotice] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state (6 required inputs as requested + password confirmation)
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [contact, setContact] = useState('');
  const [nickname, setNickname] = useState('');
  const [moreDetails, setMoreDetails] = useState('');

  const [regSuccess, setRegSuccess] = useState('');
  const [regError, setRegError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password form state
  const [forgotContact, setForgotContact] = useState('');
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [matchingAccounts, setMatchingAccounts] = useState([]);
  const [isResetting, setIsResetting] = useState(false);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setMatchingAccounts([]);

    if (!forgotContact.trim()) {
      setForgotError('Please enter your registered Phone Number or Gmail.');
      return;
    }

    if (!forgotNewPassword.trim() || forgotNewPassword.length < 4) {
      setForgotError('New password must be at least 4 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match. Please re-enter the same password in both fields.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await resetPasswordWithContact(forgotContact.trim(), forgotNewPassword.trim(), forgotUserId.trim());
      if (res.success) {
        setForgotSuccess(res.message);
        if (res.user?.username || res.user?.phone) {
          setLoginIdentifier(res.user.username || res.user.phone);
        }
      } else {
        setForgotError(res.error || 'Failed to reset password');
        if (res.requiresUserId && Array.isArray(res.matchingAccounts)) {
          setMatchingAccounts(res.matchingAccounts);
        }
      }
    } catch (err) {
      setForgotError('An error occurred during password reset. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsPendingNotice(false);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError(t('loginErrorTitle') || 'Please enter User ID / Phone and Password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await login(loginIdentifier, loginPassword);
      if (!res.success) {
        setLoginError(res.error);
        if (res.isPending) {
          setIsPendingNotice(true);
        }
      } else {
        try {
          sessionStorage.setItem('star_galaxy_welcome_spoken', 'true');
          speakWelcomeVoice();
        } catch (e) {}
      }
    } catch (err) {
      setLoginError('Login error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!fullName.trim() || !username.trim() || !password.trim() || !contact.trim()) {
      setRegError(t('requiredFieldsMissing') || 'Full Name, User ID, Password, and Phone or Gmail are required.');
      return;
    }

    if (password !== confirmPassword) {
      setRegError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        username: username.trim(),
        password: password.trim(),
        contact: contact.trim(),
        nickname: nickname.trim(),
        moreDetails: moreDetails.trim(),
      });

      if (res.success) {
        setRegSuccess(res.message);
        setFullName('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setContact('');
        setNickname('');
        setMoreDetails('');
      } else {
        setRegError(res.error);
      }
    } catch (err) {
      setRegError('An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 flex items-center justify-center p-3 sm:p-6 lg:p-10 select-none relative overflow-hidden">
      {/* Cute Floating Cosmic & Spiritual Stickers in Background */}
      <div className="absolute top-8 left-8 text-3xl animate-cute-float opacity-80 pointer-events-none">⭐</div>
      <div className="absolute bottom-10 left-12 text-3xl animate-cute-wiggle opacity-80 pointer-events-none">📖</div>
      <div className="absolute top-12 right-16 text-3xl animate-cute-wiggle opacity-80 pointer-events-none">🍇</div>
      <div className="absolute bottom-12 right-12 text-3xl animate-cute-float opacity-80 pointer-events-none">🐑</div>
      <div className="absolute top-1/2 left-4 text-2xl animate-cute-float opacity-70 pointer-events-none">🎶</div>
      <div className="absolute top-1/3 right-6 text-2xl animate-cute-wiggle opacity-70 pointer-events-none">✨</div>

      {/* Universal Container: Cute Colorful Rainbow Gradient Border */}
      <div className="w-full max-w-md lg:max-w-5xl p-1 bg-gradient-to-r from-pink-500 via-purple-500 via-indigo-500 to-cyan-400 rounded-3xl shadow-2xl cute-glow-border relative z-10">
        <div className="w-full bg-white rounded-[22px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
          {/* Top-Right Language Switcher on Auth Screen */}
          <div className="absolute top-4 right-4 z-30">
            <LanguageSwitcher variant="default" />
          </div>

          {/* 💻 LEFT HERO PANEL (Visible on Desktop / PC screens) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-sky-950 via-indigo-950 to-purple-950 text-white p-8 flex-col justify-between relative overflow-hidden">
            {/* Subtle cosmic background glow */}
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Banner: ONE SINGLE LINE, NO "WELCOME TO" */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 whitespace-nowrap">
                <span className="text-2xl sm:text-3xl animate-cute-wiggle inline-block">⭐</span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent uppercase whitespace-nowrap leading-none drop-shadow-md">
                  {t('starGalaxy') || 'STAR GALAXY'}
                </h2>
                <span className="text-2xl sm:text-3xl animate-cute-wiggle inline-block">⭐</span>
              </div>
              <p className="text-xs text-sky-200/90 font-medium">
                {t('portalSubtitle') || 'Weekly Status & Spiritual Academies Portal'}
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-indigo-100 italic leading-relaxed">
                {t('danielVerse') || '"Those who are wise will shine like the brightness of the heavens, and those who lead many to righteousness, like the stars for ever and ever."'}
                <span className="block mt-1 font-bold text-amber-300 not-italic text-right">
                  {t('danielCite') || '— Daniel 12:3'}
                </span>
              </div>
            </div>

            {/* Core Highlights List with cute animations */}
            <div className="space-y-3 my-6 relative z-10 text-xs">
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-300/40 transition-all">
                <span className="text-lg animate-cute-wiggle inline-block">⭐</span>
                <div>
                  <strong className="block text-amber-200 font-bold">
                    {t('highlight1Title') || '10 Spiritual Academies'}
                  </strong>
                  <span className="text-[11px] text-slate-300">
                    {t('highlight1Sub') || 'Accurate star calculation rules'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-sky-300/40 transition-all">
                <span className="text-lg animate-cute-wiggle inline-block">📅</span>
                <div>
                  <strong className="block text-sky-200 font-bold">
                    {t('highlight2Title') || 'Saturday to Friday Cycle'}
                  </strong>
                  <span className="text-[11px] text-slate-300">
                    {t('highlight2Sub') || 'Standard weekly reporting period'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-300/40 transition-all">
                <span className="text-lg animate-cute-wiggle inline-block">🛡️</span>
                <div>
                  <strong className="block text-purple-200 font-bold">
                    {t('highlight3Title') || 'Personal Data Protection'}
                  </strong>
                  <span className="text-[11px] text-slate-300">
                    {t('highlight3Sub') || 'Members input own records, Admin oversees'}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Install App Card */}
            <div className="relative z-10 my-2">
              <button
                type="button"
                onClick={handleOpenInstall}
                className="w-full p-3 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 text-left transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <strong className="block text-xs font-bold text-white leading-tight">
                      Install Star Galaxy App on Phone
                    </strong>
                    <span className="text-[10px] text-sky-200">
                      Download & use on mobile home screen
                    </span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-amber-300 shrink-0" />
              </button>
            </div>

            {/* Footer note */}
            <div className="relative z-10 pt-4 border-t border-white/10 text-[11px] text-slate-400">
              {t('securePortal') || 'Star Galaxy Protected Portal • Approved Members Only'}
            </div>
          </div>

          {/* 📱 / 💻 RIGHT INTERACTIVE PANEL (Login / Register Card) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center relative">
            {/* Top Mobile Welcome Banner: ONE SINGLE LINE, NO "WELCOME TO" */}
            <div className="text-center mb-6 lg:mb-4 pr-12 lg:pr-0">
              <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                <span className="text-2xl sm:text-3xl animate-cute-wiggle inline-block">⭐</span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-wider bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent uppercase whitespace-nowrap leading-none drop-shadow-xs">
                  {t('starGalaxy') || 'STAR GALAXY'}
                </h1>
                <span className="text-2xl sm:text-3xl animate-cute-wiggle inline-block">⭐</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1.5">
                {t('portalSubtitle') || 'Weekly Status & Spiritual Academies Portal'}
              </p>
            </div>

            {/* 📲 Install Star Galaxy App on Phone Banner */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleOpenInstall}
                className="w-full p-3 bg-gradient-to-r from-purple-900 via-indigo-900 to-sky-900 hover:from-purple-800 hover:to-sky-800 text-white rounded-2xl flex items-center justify-between shadow-md border-2 border-indigo-400/40 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer group"
                title="Install Star Galaxy App on Phone"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-300/30 flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5 leading-tight">
                      <span>Install Star Galaxy App on Phone</span>
                      <span className="text-[10px] bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-md font-black uppercase shadow-xs">
                        Free
                      </span>
                    </h4>
                    <p className="text-[10px] text-sky-200 mt-0.5 font-medium leading-tight">
                      Download & use like an app on your phone
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0">
                  <Download className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                  <span className="hidden xs:inline">Install</span>
                </div>
              </button>
            </div>

            {/* 🔗 SNI Main Unified Account Login Button */}
            <div className="mb-4">
              <a
                href="/auth.html"
                className="w-full p-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-700 hover:brightness-110 text-white rounded-2xl flex items-center justify-between shadow-md border border-blue-400/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-300/40 flex items-center justify-center font-bold text-sm shrink-0">
                    ✨
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5 leading-tight">
                      <span>Sign In with SNI Master Account</span>
                      <span className="text-[9px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded font-black uppercase">
                        Main
                      </span>
                    </h4>
                    <p className="text-[10px] text-blue-100 mt-0.5 font-medium leading-tight">
                      Single login for SNI Website & Star Galaxy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white/10 border border-white/20 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 shrink-0">
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </a>
            </div>

            {/* Tab Switcher: Login vs Register */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-5 text-xs font-bold border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                  setIsPendingNotice(false);
                }}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'login'
                    ? 'bg-white text-indigo-700 shadow-sm scale-101 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{t('login') || 'Login'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegError('');
                  setRegSuccess('');
                }}
                className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'register'
                    ? 'bg-white text-indigo-700 shadow-sm scale-101 font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>{t('createId') || 'Create ID'}</span>
              </button>
            </div>

            {/* MODE 1: LOGIN */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                      isPendingNotice
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}
                  >
                    {isPendingNotice ? (
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className="block font-bold">
                        {isPendingNotice ? (t('pendingNoticeTitle') || '👑 Admin Approval Required:') : (t('loginErrorTitle') || 'Login Failed:')}
                      </strong>
                      <span>{loginError}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Enter SNI ID *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter SNI ID"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Enter SNI Password *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                    >
                      {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showLoginPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter SNI Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                  <div className="flex items-center justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotError('');
                        setForgotSuccess('');
                        setMatchingAccounts([]);
                        if (loginIdentifier.trim()) {
                          setForgotContact(loginIdentifier.trim());
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] hover:scale-[1.01] flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-75"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('loggingIn') || 'Logging in...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('loginBtn') || 'Login to Star Galaxy'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center text-[11px] text-slate-400">
                  {isAutoApproval
                    ? '✨ Instant Auto Approval active: You can log in immediately after creating your ID!'
                    : (t('approvalNoticeText') || 'Note: After registration, Admin approval is required before logging in.')}
                </div>
              </form>
            )}

            {/* MODE 2: REGISTER / CREATE ID (All 6 Input Fields Requested) */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {regSuccess && (
                  <div className={`p-3.5 rounded-2xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 ${
                    regSuccess.includes('pending') || regSuccess.includes('Pending')
                      ? 'bg-amber-50 border border-amber-300 text-amber-900'
                      : 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                  }`}>
                    {regSuccess.includes('pending') || regSuccess.includes('Pending') ? (
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <strong className="block font-bold">
                        {regSuccess.includes('pending') || regSuccess.includes('Pending')
                          ? 'Application Submitted (Pending Admin Approval)'
                          : (t('regSuccessMessage') || 'Registration successful!')}
                      </strong>
                      <span>{regSuccess}</span>
                      {!regSuccess.includes('pending') && !regSuccess.includes('Pending') && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setRegSuccess('');
                          }}
                          className="mt-2.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <span>👉 Go to Login</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {regError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-xs font-semibold text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* 1. Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('fullName') || 'Full Name'} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('fullNamePlaceholder') || 'Enter your full name'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                </div>

                {/* 2. User ID */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Enter SNI ID *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter SNI ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                </div>

                {/* 3. Password & Confirm Password (2 times for confirmation + Eye symbol) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Enter SNI Password *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 font-semibold"
                      >
                        {showRegPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showRegPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter SNI Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Confirm SNI Password *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 font-semibold"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showRegConfirmPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm SNI Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                    />
                  </div>
                </div>

                {/* 4. Phone or Gmail */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('phoneOrGmail') || 'Phone or Gmail'} *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('phoneOrGmailPlaceholder') || 'e.g. 9876543210 or name@gmail.com'}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                  <p className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center gap-1">
                    <span>✨</span>
                    <span>{t('phoneOrGmailHint') || 'Up to 10 accounts allowed with the same Phone or Gmail'}</span>
                  </p>
                </div>

                {/* 5. Nick Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('nickName') || 'Nick Name'}</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t('nickNamePlaceholder') || 'e.g. David Star'}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {/* 6. More Details */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('moreDetails') || 'More Details'}</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t('moreDetailsPlaceholder') || 'Zion place, region or additional info'}
                    value={moreDetails}
                    onChange={(e) => setMoreDetails(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] hover:scale-[1.01] flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <span>{isSubmitting ? (t('creatingBtn') || 'Creating Account...') : (t('createAccountBtn') || 'Create Account')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center text-[11px] text-slate-400">
                  {t('approvalNoticeText') || 'Note: After registration, Admin approval is required before logging in.'}
                </div>
              </form>
            )}

            {/* MODE 3: FORGOT / RESET PASSWORD WITH PHONE NUMBER OR GMAIL */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5 animate-in fade-in duration-200">
                <div className="text-center pb-1">
                  <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-2 font-bold shadow-xs">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-800">
                    Reset Account Password
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Enter your registered Phone Number or Gmail to set a new password.
                  </p>
                </div>

                {forgotSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-semibold text-emerald-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold">Password Reset Successful!</strong>
                      <span>{forgotSuccess}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setForgotSuccess('');
                          setForgotError('');
                        }}
                        className="mt-2.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <span>👉 Proceed to Login</span>
                      </button>
                    </div>
                  </div>
                )}

                {forgotError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl text-xs font-semibold text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{forgotError}</span>
                      {matchingAccounts.length > 0 && (
                        <div className="mt-2 p-2 bg-white rounded-xl border border-rose-200 text-[11px]">
                          <span className="font-bold text-slate-700 block mb-1">Click your account or enter your User ID:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {matchingAccounts.map(acc => (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => setForgotUserId(acc.username || acc.id)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 cursor-pointer text-[10px]"
                              >
                                {acc.name} ({acc.username || acc.id})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 1. Phone or Gmail */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Registered Phone or Gmail *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210 or yourname@gmail.com"
                    value={forgotContact}
                    onChange={(e) => setForgotContact(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                </div>

                {/* 2. User ID (Optional unless multiple accounts) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Enter SNI ID (Optional, required if multiple accounts)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter SNI ID"
                    value={forgotUserId}
                    onChange={(e) => setForgotUserId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                </div>

                {/* 3. New Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Enter SNI Password *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPass(!showForgotPass)}
                        className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 font-semibold"
                      >
                        {showForgotPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showForgotPass ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showForgotPass ? 'text' : 'password'}
                      required
                      placeholder="Enter SNI Password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Confirm SNI Password *</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                        className="text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 font-semibold"
                      >
                        {showForgotConfirmPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showForgotConfirmPass ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showForgotConfirmPass ? 'text' : 'password'}
                      required
                      placeholder="Confirm SNI Password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] hover:scale-[1.01] flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-75"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Resetting Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password & Update</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 📲 Install Star Galaxy App on Phone Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
