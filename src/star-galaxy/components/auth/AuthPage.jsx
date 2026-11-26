import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { speakWelcomeVoice } from '../../utils/soundEffects';
import {
  Lock,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Mail,
  ArrowLeft,
  Send,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import InstallAppModal from '../common/InstallAppModal';

export default function AuthPage() {
  const { login, register, resetPasswordWithContact } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state (Unified SNI Join fields)
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
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
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      if (modeParam === 'join' || modeParam === 'register') {
        setMode('register');
      }
    } catch (e) {}
  }, []);

  // 1. SIGN IN HANDLER (NO EMAIL / PHONE REQUIRED)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    const cleanId = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanId || !cleanPass) {
      setLoginError('Please enter both SNI ID and SNI Password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await login(cleanId, cleanPass);
      if (res.success) {
        setLoginSuccess(`Welcome, ${res.user?.fullName || res.user?.name || cleanId}! Signing in...`);
        try {
          speakWelcomeVoice();
        } catch (e) {}
      } else {
        setLoginError(res.error || 'Sign in failed. Please verify your credentials.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('An unexpected network error occurred. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. JOIN (REGISTER) HANDLER (NO EMAIL / PHONE REQUIRED)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const cleanFullName = fullName.trim();
    const cleanUserId = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanFullName || !cleanUserId || !cleanPass) {
      setRegError('Please fill in all required fields (Full Name, SNI ID, and Password).');
      return;
    }

    if (cleanUserId.length < 3) {
      setRegError('SNI ID must be at least 3 characters long.');
      return;
    }

    if (cleanPass.length < 4) {
      setRegError('SNI Password must be at least 4 characters long.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setRegError('Passwords do not match! Please check again.');
      return;
    }

    if (!agreeTerms) {
      setRegError('Please agree to the SNI guidelines to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        fullName: cleanFullName,
        name: cleanFullName,
        username: cleanUserId,
        userId: cleanUserId,
        password: cleanPass,
      });

      if (res.success) {
        setFullName('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setMode('login');
        setLoginIdentifier(cleanUserId);
        setLoginPassword('');
        setLoginSuccess('');
        setLoginError('⏳ Waiting for Admin Approval: Your application has been submitted to Admin (info@sni.org.in). Please wait until the Admin approves your account before signing in.');
      } else {
        setRegError(res.error || 'Registration failed. Please check the information and try again.');
      }
    } catch (err) {
      console.error(err);
      setRegError('Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. FORGOT PASSWORD HANDLER
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotContact.trim()) {
      setForgotError('Please enter your registered Gmail address.');
      return;
    }

    if (!forgotNewPassword.trim() || forgotNewPassword.length < 4) {
      setForgotError('New SNI password must be at least 4 characters long.');
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
        setForgotSuccess(res.message || 'Password reset successfully! You can now sign in.');
        if (res.user?.username || res.user?.userId) {
          setLoginIdentifier(res.user.username || res.user.userId);
        }
        setTimeout(() => setMode('login'), 2500);
      } else {
        setForgotError(res.error || 'Failed to reset password. Please check your details.');
      }
    } catch (err) {
      console.error(err);
      setForgotError('Failed to reset password. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100dvh-4rem)] sm:min-h-screen flex items-center justify-center py-4 sm:py-8 md:py-12 px-3 sm:px-6">
      {/* Official SNI Auth Card */}
      <div className="w-full max-w-[460px] bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-amber-300/40 relative overflow-hidden p-5 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Gold Gradient Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#071b3b] via-[#f5c75e] to-[#124b91]" />

        {/* Card Header */}
        <div className="text-center mb-5 sm:mb-6 pt-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#071b3b] to-[#124b91] text-[#f5c75e] border-2 border-[#f5c75e]/60 shadow-md flex items-center justify-center text-xl sm:text-2xl mx-auto mb-2.5 sm:mb-3">
            ✨
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#071b3b] tracking-tight">
            {mode === 'login' ? 'Welcome to SNI' : mode === 'register' ? 'Join SNI' : 'Reset SNI Password'}
          </h1>
          <p className="text-xs sm:text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            {mode === 'login'
              ? 'One account for Star Galaxy and all SNI platforms'
              : mode === 'register'
              ? 'Create your unified account for all SNI websites & apps'
              : 'Enter your registered details to recover your account'}
          </p>
        </div>

        {/* Sign In / Join Mode Switch Tabs (hidden on forgot password) */}
        {mode !== 'forgot' && (
          <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl mb-5 sm:mb-6 border border-slate-200 text-xs sm:text-sm font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
                setLoginSuccess('');
              }}
              className={`flex-1 py-2.5 sm:py-2 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] sm:min-h-[40px] select-none text-xs sm:text-sm font-bold ${
                mode === 'login'
                  ? 'bg-white text-[#071b3b] font-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegError('');
                setRegSuccess('');
              }}
              className={`flex-1 py-2.5 sm:py-2 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] sm:min-h-[40px] select-none text-xs sm:text-sm font-bold ${
                mode === 'register'
                  ? 'bg-white text-[#071b3b] font-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>✨ Join</span>
            </button>
          </div>
        )}

        {/* 1. SIGN IN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {verifySuccessMsg && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{verifySuccessMsg}</span>
              </div>
            )}

            {loginError && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                SNI ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter SNI ID"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition min-h-[48px] sm:min-h-[44px]"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                SNI Password *
              </label>
              <div className="relative flex items-center">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter SNI Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-12 min-h-[48px] sm:min-h-[44px]"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-0 top-0 bottom-0 w-11 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-r-xl transition-colors"
                  title={showLoginPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#124b91] focus:ring-[#124b91] cursor-pointer"
                />
                <span className="font-medium">Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="font-bold text-[#124b91] hover:text-[#071b3b] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 sm:py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#071b3b] via-[#0d2959] to-[#124b91] hover:from-[#0a234c] hover:to-[#175bb3] shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 min-h-[48px]"
            >
              <span>{isLoggingIn ? 'Signing In...' : 'Sign In'}</span>
              {!isLoggingIn && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="text-center pt-2 text-xs sm:text-sm text-slate-500">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegError('');
                  setRegSuccess('');
                }}
                className="font-extrabold text-[#124b91] hover:underline cursor-pointer ml-1"
              >
                Join here
              </button>
            </div>
          </form>
        )}

        {/* 2. JOIN (REGISTRATION) FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {regError && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition min-h-[48px] sm:min-h-[44px]"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                Choose SNI ID *
              </label>
              <input
                type="text"
                required
                placeholder="Enter desired SNI ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition min-h-[48px] sm:min-h-[44px]"
                autoComplete="username"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Unique username for Star Galaxy, Counter, and all SNI tools.
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                Create SNI Password *
              </label>
              <div className="relative flex items-center">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter SNI Password (at least 4 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-12 min-h-[48px] sm:min-h-[44px]"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-0 top-0 bottom-0 w-11 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-r-xl transition-colors"
                  title={showRegPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                Confirm SNI Password *
              </label>
              <div className="relative flex items-center">
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter SNI Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-12 min-h-[48px] sm:min-h-[44px]"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-0 top-0 bottom-0 w-11 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-r-xl transition-colors"
                  title={showRegConfirmPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-600 select-none py-1">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#124b91] focus:ring-[#124b91] shrink-0 cursor-pointer"
                />
                <span className="leading-snug">I agree to the SNI guidelines &amp; community rules</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 sm:py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#071b3b] via-[#124b91] to-[#d97706] hover:brightness-110 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 min-h-[48px]"
            >
              <span>{isSubmitting ? 'Submitting Registration...' : '✨ Submit Registration'}</span>
            </button>

            <div className="text-center pt-1 text-xs sm:text-sm text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                  setLoginSuccess('');
                }}
                className="font-extrabold text-[#124b91] hover:underline cursor-pointer ml-1"
              >
                Sign In here
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            {forgotError && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                Registered Gmail / Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. name@gmail.com"
                value={forgotContact}
                onChange={(e) => setForgotContact(e.target.value)}
                className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition min-h-[48px] sm:min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                SNI ID (Optional, required if multiple accounts)
              </label>
              <input
                type="text"
                placeholder="Enter SNI ID"
                value={forgotUserId}
                onChange={(e) => setForgotUserId(e.target.value)}
                className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition min-h-[48px] sm:min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                New SNI Password *
              </label>
              <div className="relative flex items-center">
                <input
                  type={showForgotPass ? 'text' : 'password'}
                  required
                  placeholder="Enter New SNI Password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-12 min-h-[48px] sm:min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotPass(!showForgotPass)}
                  className="absolute right-0 top-0 bottom-0 w-11 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-r-xl transition-colors"
                >
                  {showForgotPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                Confirm SNI Password *
              </label>
              <div className="relative flex items-center">
                <input
                  type={showForgotConfirmPass ? 'text' : 'password'}
                  required
                  placeholder="Confirm SNI Password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-12 min-h-[48px] sm:min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                  className="absolute right-0 top-0 bottom-0 w-11 h-full flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-r-xl transition-colors"
                >
                  {showForgotConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isResetting}
              className="w-full py-3.5 sm:py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#071b3b] via-[#124b91] to-[#d97706] hover:brightness-110 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 min-h-[48px]"
            >
              <span>{isResetting ? 'Resetting Password...' : 'Reset SNI Password'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#124b91] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
