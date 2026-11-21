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
  Phone,
  Mail,
  ArrowLeft,
  Send,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import InstallAppModal from '../common/InstallAppModal';

export default function AuthPage() {
  const { login, register, resetPasswordWithContact, verifyUserContact } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showInstallModal, setShowInstallModal] = useState(false);

  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyModalData, setVerifyModalData] = useState(null);
  const [verifySuccessMsg, setVerifySuccessMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [modalOtpInput, setModalOtpInput] = useState('');
  const [modalOtpError, setModalOtpError] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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
  const [contact, setContact] = useState('');
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

  // URL Parameter check for Verification mode (?mode=verify&uid=...&token=...)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const modeParam = urlParams.get('mode');
      const uidParam = urlParams.get('uid');
      const tokenParam = urlParams.get('token');
      const otpParam = urlParams.get('otp');
      const codeParam = tokenParam || otpParam;

      if (modeParam === 'verify' && uidParam) {
        (async () => {
          setLoginError('');
          const res = await verifyUserContact(uidParam, codeParam);
          if (res?.success) {
            setVerifySuccessMsg(`🎉 Email verified successfully for ${uidParam}! Your application has been submitted to Admin for approval. You will be able to sign in once approved.`);
            setMode('login');
            setLoginIdentifier(uidParam);
          } else {
            setLoginError(res?.error || 'Verification failed. Please contact SNI Admin.');
          }
        })();
      } else if (modeParam === 'join' || modeParam === 'register') {
        setMode('register');
      }
    } catch (e) {}
  }, [verifyUserContact]);

  // 1. SIGN IN HANDLER
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
      } else if (res.isUnverified) {
        const u = res.unverifiedUser || {};
        const emailAddress = u.email || u.contact || '';
        const token = u.verificationToken || ('sni_v_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36));
        const otp = u.verificationOtp || '';
        const verifyUrl = `https://sni.org.in/auth.html?mode=verify&uid=${encodeURIComponent(u.id || cleanId)}&token=${encodeURIComponent(token)}&otp=${encodeURIComponent(otp)}`;
        setModalOtpInput('');
        setModalOtpError('');
        setVerifyModalData({
          userId: u.id || cleanId,
          fullName: u.fullName || u.name || cleanId,
          contact: emailAddress,
          email: emailAddress,
          verifyUrl,
          token,
          otp,
          isLoginBlock: true,
        });
        setShowVerifyModal(true);
        setLoginError(res.error || 'Gmail verification required before sign in.');
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

  // 2. JOIN (REGISTER) HANDLER - STRICTLY EMAIL ONLY
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    const cleanFullName = fullName.trim();
    const cleanUserId = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanContact = contact.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanFullName || !cleanUserId || !cleanPass || !cleanContact) {
      setRegError('Please fill in all required fields (Full Name, SNI ID, Gmail address, and Password).');
      return;
    }

    if (!cleanContact.includes('@') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact)) {
      setRegError('Please enter a valid Gmail / Email address (e.g. name@gmail.com).');
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
        contact: cleanContact,
        email: cleanContact,
        password: cleanPass,
      });

      if (res.success) {
        setRegSuccess(res.message || `Welcome to SNI, ${cleanFullName}! Verification link generated.`);
        setModalOtpInput('');
        setModalOtpError('');
        setVerifyModalData({
          userId: cleanUserId,
          fullName: cleanFullName,
          contact: cleanContact,
          email: cleanContact,
          verifyUrl: res.verifyUrl,
          token: res.verifyToken,
          otp: res.verifyOtp,
          isLoginBlock: false,
        });
        setShowVerifyModal(true);
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

  const handleVerifyOtpInModal = async () => {
    if (!verifyModalData?.userId) return;
    const cleanCode = modalOtpInput.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setModalOtpError('Please enter all 6 digits of the verification code.');
      return;
    }
    setIsVerifyingOtp(true);
    setModalOtpError('');
    try {
      const res = await verifyUserContact(verifyModalData.userId, cleanCode);
      if (res?.success) {
        setShowVerifyModal(false);
        setVerifySuccessMsg(`🎉 Email verified successfully for ${verifyModalData.userId}! Your application has been submitted to Admin. Status: Waiting for Admin Approval. You will be able to sign in once an administrator approves your account.`);
        setMode('login');
        setLoginIdentifier(verifyModalData.userId);
      } else {
        setModalOtpError(res?.error || 'Invalid OTP code. Please check your Gmail or retry.');
      }
    } catch (e) {
      setModalOtpError('Verification failed. Please retry.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleVerifyNowInModal = async () => {
    if (!verifyModalData?.userId) return;
    const res = await verifyUserContact(verifyModalData.userId, verifyModalData.token || verifyModalData.otp);
    if (res?.success) {
      setShowVerifyModal(false);
      setVerifySuccessMsg(`🎉 Email verified successfully for ${verifyModalData.userId}! Your application has been submitted to Admin. Status: Waiting for Admin Approval. You will be able to sign in once an administrator approves your account.`);
      setMode('login');
      setLoginIdentifier(verifyModalData.userId);
    } else {
      alert(res?.error || 'Failed to verify account.');
    }
  };

  // 3. FORGOT PASSWORD HANDLER
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotContact.trim()) {
      setForgotError('Please enter your registered Phone Number or Gmail.');
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
    <div className="w-full flex items-center justify-center py-6 px-4 sm:px-6">
      {/* Official SNI Auth Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-300/40 relative overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Gold Gradient Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#071b3b] via-[#f5c75e] to-[#124b91]" />

        {/* Card Header */}
        <div className="text-center mb-6 pt-1">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#071b3b] to-[#124b91] text-[#f5c75e] border-2 border-[#f5c75e]/60 shadow-md flex items-center justify-center text-2xl mx-auto mb-3">
            ✨
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#071b3b]">
            {mode === 'login' ? 'Welcome to SNI' : mode === 'register' ? 'Join SNI' : 'Reset SNI Password'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {mode === 'login'
              ? 'One account for Star Galaxy and all SNI platforms'
              : mode === 'register'
              ? 'Create your unified account for all SNI websites & apps'
              : 'Enter your registered details to recover your account'}
          </p>
        </div>

        {/* Sign In / Join Mode Switch Tabs (hidden on forgot password) */}
        {mode !== 'forgot' && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
                setLoginSuccess('');
              }}
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
              className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{verifySuccessMsg}</span>
              </div>
            )}

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SNI ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter SNI ID"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SNI Password *
              </label>
              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter SNI Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 font-semibold text-xs focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs font-semibold cursor-pointer"
                  title={showLoginPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#124b91] focus:ring-[#124b91]"
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
              className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#071b3b] via-[#0d2959] to-[#124b91] hover:from-[#0a234c] hover:to-[#175bb3] shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <span>{isLoggingIn ? 'Signing In...' : 'Sign In'}</span>
              {!isLoggingIn && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="text-center pt-2 text-xs text-slate-500">
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
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {regError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Choose SNI ID *
              </label>
              <input
                type="text"
                required
                placeholder="Enter desired SNI ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition"
                autoComplete="username"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Unique username for Star Galaxy, Counter, and all SNI tools.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Gmail / Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. name@gmail.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition"
                autoComplete="email"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                An official verification link and 6-digit OTP will be sent to this Gmail address.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Create SNI Password *
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter SNI Password (at least 4 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                  title={showRegPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm SNI Password *
              </label>
              <div className="relative">
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter SNI Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                  title={showRegConfirmPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded border-slate-300 text-[#124b91] focus:ring-[#124b91]"
                />
                <span>I agree to the SNI guidelines & community rules</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#071b3b] via-[#124b91] to-[#d97706] hover:brightness-110 shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
            >
              <span>{isSubmitting ? 'Submitting Registration...' : '✨ Submit Registration'}</span>
            </button>

            <div className="text-center pt-1 text-xs text-slate-500">
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
          <form onSubmit={handleForgotSubmit} className="space-y-3.5">
            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Gmail / Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. name@gmail.com"
                value={forgotContact}
                onChange={(e) => setForgotContact(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SNI ID (Optional, required if multiple accounts)
              </label>
              <input
                type="text"
                placeholder="Enter SNI ID"
                value={forgotUserId}
                onChange={(e) => setForgotUserId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New SNI Password *
              </label>
              <div className="relative">
                <input
                  type={showForgotPass ? 'text' : 'password'}
                  required
                  placeholder="Enter New SNI Password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotPass(!showForgotPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                >
                  {showForgotPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm SNI Password *
              </label>
              <div className="relative">
                <input
                  type={showForgotConfirmPass ? 'text' : 'password'}
                  required
                  placeholder="Confirm SNI Password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
                >
                  {showForgotConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isResetting}
              className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#071b3b] via-[#124b91] to-[#d97706] hover:brightness-110 shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
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
                className="inline-flex items-center gap-1 text-xs font-bold text-[#124b91] hover:underline cursor-pointer"
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

      {/* 📩 SNI Account Email Verification Modal */}
      {showVerifyModal && verifyModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
              📩
            </div>
            <h3 className="text-lg font-black text-slate-800">
              {verifyModalData.isLoginBlock ? 'Gmail Verification Required' : 'Official Verification Link & OTP Ready'}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {verifyModalData.isLoginBlock
                ? <>Your SNI account <strong>{verifyModalData.userId}</strong> requires Gmail verification for:</>
                : <>An official verification email with a link and OTP has been sent to:</>}
              <br />
              <span className="inline-block mt-1 font-mono font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-lg border border-slate-200">
                {verifyModalData.contact}
              </span>
            </p>

            {/* OTP Entry Section */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                🔑 Enter 6-Digit Verification Code (OTP)
              </label>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={modalOtpInput}
                  onChange={(e) => {
                    setModalOtpInput(e.target.value.replace(/[^0-9]/g, ''));
                    setModalOtpError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleVerifyOtpInModal();
                    }
                  }}
                  className="w-36 text-center text-lg font-black tracking-widest py-2 px-3 rounded-xl border-2 border-slate-300 focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none bg-white text-slate-900"
                />
                <button
                  type="button"
                  disabled={isVerifyingOtp || modalOtpInput.length < 6}
                  onClick={handleVerifyOtpInModal}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#071b3b] to-[#124b91] text-[#f5c75e] font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
              {modalOtpError && (
                <p className="text-xs font-bold text-rose-600 mt-2">{modalOtpError}</p>
              )}
            </div>

            <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold text-left">
              ⚠️ <strong>Notice</strong>: Verify your email by clicking the link in your Gmail or entering the OTP above. Your application will only be forwarded to the Admin after verification.
            </div>

            <div className="mt-4 space-y-2.5">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <Mail className="w-4 h-4" />
                <span>Open Gmail Inbox</span>
              </a>
              <button
                type="button"
                onClick={handleVerifyNowInModal}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Click to Verify Account Now</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(verifyModalData.verifyUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Verification Link Copied!' : 'Copy Verification Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Dismiss &amp; Continue to Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
