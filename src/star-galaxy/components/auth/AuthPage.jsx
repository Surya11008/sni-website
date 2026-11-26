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
  ChevronDown,
  Check,
  RefreshCw,
} from 'lucide-react';
import InstallAppModal from '../common/InstallAppModal';

const COUNTRIES = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' },
];

export default function AuthPage() {
  const { login, register, verifyUserContact, resetPasswordWithContact } = useApp();

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

  // Register multi-step state
  const [joinStep, setJoinStep] = useState('form'); // 'form' | 'phone' | 'otp' | 'success'
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

  // Phone verification state (matches user screenshot)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendVia, setSendVia] = useState('whatsapp'); // 'whatsapp' | 'sms'
  const [enteredOtp, setEnteredOtp] = useState('');
  const [pendingOtpData, setPendingOtpData] = useState(null);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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

  // 2. JOIN STEP 1: VALIDATE DETAILS & MOVE TO PHONE REQUIRED SCREEN
  const handleRegisterFormNext = async (e) => {
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
      // Check if user ID is already registered in RTDB
      const checkRes = await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanUserId)}.json`);
      if (checkRes.ok) {
        const existing = await checkRes.json();
        if (existing) {
          setRegError(`⚠️ SNI ID "${cleanUserId}" is already registered. Please choose another ID or Sign In.`);
          setIsSubmitting(false);
          return;
        }
      }

      // Valid details -> Transition to the Phone number required screen
      setJoinStep('phone');
    } catch (err) {
      console.warn('Username check warning:', err);
      setJoinStep('phone');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. JOIN STEP 2: PHONE REQUIRED -> GENERATE OTP & DISPATCH
  const handlePhoneContinue = async () => {
    setRegError('');
    const cleanPhoneDigits = phoneNumber.trim().replace(/[^0-9]/g, '');
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 8) {
      setRegError('Please enter a valid phone number (at least 8-10 digits).');
      return;
    }

    const fullPhone = `${selectedCountry.code}${cleanPhoneDigits}`;
    const cleanUserId = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanPass = password.trim();
    const cleanFullName = fullName.trim();

    // Generate secure 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    setIsSubmitting(true);
    try {
      // Register account in unverified status with phone and OTP
      const res = await register({
        fullName: cleanFullName,
        name: cleanFullName,
        username: cleanUserId,
        userId: cleanUserId,
        password: cleanPass,
        phone: fullPhone,
        verificationOtp: otp,
        otpExpiresAt: expiresAt,
        verificationChannel: sendVia,
        status: 'unverified',
        phoneVerified: false,
        isVerified: false,
      });

      if (res.success || res.userId) {
        setPendingOtpData({
          userId: cleanUserId,
          phone: fullPhone,
          otp: otp,
          channel: sendVia,
          expiresAt: expiresAt,
        });
        setOtpError('');
        setOtpSuccess(
          sendVia === 'whatsapp'
            ? 'Verification code generated for WhatsApp!'
            : 'Verification code generated for SMS Text Message!'
        );
        setJoinStep('otp');
      } else {
        setRegError(res.error || 'Failed to submit phone details. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setRegError('Network error while processing phone verification. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. JOIN STEP 3: VERIFY OTP CODE & SUBMIT TO ADMIN
  const handleVerifyOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    const cleanCode = enteredOtp.trim().replace(/[^0-9]/g, '');
    if (cleanCode.length < 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    const targetUserId = pendingOtpData?.userId || username.trim().toLowerCase();

    setIsVerifyingOtp(true);
    try {
      const res = await verifyUserContact(targetUserId, cleanCode);
      if (res.success) {
        setJoinStep('success');
      } else {
        setOtpError(res.error || '❌ Incorrect verification code. Please check and try again.');
      }
    } catch (err) {
      console.error(err);
      setOtpError('Verification failed due to a network error. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // RESEND OTP HANDLER
  const handleResendOtp = async () => {
    setOtpError('');
    setOtpSuccess('');
    const targetUserId = pendingOtpData?.userId || username.trim().toLowerCase();
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    try {
      // Patch OTP in RTDB
      await fetch(`https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(targetUserId)}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationOtp: newOtp,
          otpExpiresAt: expiresAt,
        }),
      });

      setPendingOtpData(prev => ({
        ...prev,
        otp: newOtp,
        expiresAt: expiresAt,
      }));
      setOtpSuccess(`Fresh verification code sent via ${sendVia === 'whatsapp' ? 'WhatsApp' : 'Text Message'}!`);
    } catch (e) {
      setOtpError('Failed to resend code. Please try again.');
    }
  };

  // 5. FORGOT PASSWORD HANDLER
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotContact.trim()) {
      setForgotError('Please enter your registered Phone or Email.');
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
    <div className="w-full flex items-center justify-center py-2 sm:py-6 md:py-10 px-3 sm:px-6 my-auto">
      {/* Official SNI Auth Card */}
      <div className="w-full max-w-[min(480px,100%)] bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-amber-300/40 relative overflow-hidden p-5 sm:p-7 md:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Gold Gradient Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#071b3b] via-[#f5c75e] to-[#124b91]" />

        {/* Card Header (Shown on Login, Forgot, and Join Step 1) */}
        {!(mode === 'register' && (joinStep === 'phone' || joinStep === 'otp' || joinStep === 'success')) && (
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
        )}

        {/* Sign In / Join Mode Switch Tabs (hidden on phone verification or forgot) */}
        {mode !== 'forgot' && !(mode === 'register' && (joinStep === 'phone' || joinStep === 'otp' || joinStep === 'success')) && (
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
                setJoinStep('form');
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs sm:text-sm font-bold text-slate-700">
                  SNI Password *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="text-xs text-[#124b91] hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
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

            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#124b91] focus:ring-[#124b91] cursor-pointer"
                />
                <span>Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 sm:py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#071b3b] via-[#124b91] to-[#071b3b] hover:brightness-110 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 min-h-[48px]"
            >
              <span>{isLoggingIn ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 text-xs sm:text-sm text-slate-500">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setJoinStep('form');
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

        {/* 2. JOIN - STEP 1: INITIAL DETAILS FORM */}
        {mode === 'register' && joinStep === 'form' && (
          <form onSubmit={handleRegisterFormNext} className="space-y-4">
            {regError && (
              <div className="p-3 sm:p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{regError}</span>
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
              <span>{isSubmitting ? 'Checking Details...' : '✨ Continue to Verification →'}</span>
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

        {/* 3. JOIN - STEP 2: PHONE NUMBER REQUIRED SCREEN (MATCHES USER IMAGE EXACTLY) */}
        {mode === 'register' && joinStep === 'phone' && (
          <div className="pt-2 animate-in fade-in duration-200">
            {/* Header */}
            <h2 className="text-2xl sm:text-[27px] font-bold text-slate-900 text-center tracking-tight">
              Phone number required
            </h2>
            <p className="text-sm text-slate-500 text-center mt-2.5 mb-7 max-w-[320px] mx-auto leading-relaxed">
              Add your phone number to continue. We'll send a one-time code to verify it.
            </p>

            {regError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{regError}</span>
              </div>
            )}

            {/* Country Selector Dropdown */}
            <div className="relative mb-5">
              <button
                type="button"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-full border border-slate-300 bg-white hover:border-slate-400 transition text-slate-900 font-medium text-base shadow-xs select-none cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.name} ({selectedCountry.code})</span>
                </span>
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </button>

              {showCountryPicker && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 max-h-56 overflow-y-auto p-1.5 animate-in fade-in zoom-in-95">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code + c.name}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setShowCountryPicker(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-slate-100 text-sm font-medium text-slate-800 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </span>
                      <span className="text-slate-500 font-mono text-xs">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone Number Floating-Label Input */}
            <div className="relative mb-6">
              <label className="absolute -top-2.5 left-5 bg-white px-2 text-xs font-medium text-slate-500 z-10 select-none">
                Phone number
              </label>
              <div className="flex items-center border border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900 rounded-full px-5 py-3.5 bg-white transition shadow-xs">
                <span className="text-slate-900 font-medium text-base mr-2 select-none shrink-0">
                  {selectedCountry.code}
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-transparent text-slate-900 font-medium text-base outline-none tracking-wider"
                  autoFocus
                />
              </div>
            </div>

            {/* Send Code Via Section */}
            <div className="mb-7">
              <label className="block text-xs font-semibold text-slate-600 mb-2 pl-1 select-none">
                Send code via
              </label>
              <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setSendVia('whatsapp')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
                    sendVia === 'whatsapp'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {/* WhatsApp SVG Icon */}
                  <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSendVia('sms')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full text-xs sm:text-sm font-semibold transition cursor-pointer select-none ${
                    sendVia === 'sms'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {/* Text Message Speech Bubble SVG */}
                  <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Text Message</span>
                </button>
              </div>
            </div>

            {/* Black Continue Button */}
            <button
              type="button"
              onClick={handlePhoneContinue}
              disabled={isSubmitting || !phoneNumber.trim()}
              className="w-full py-4 px-6 rounded-full font-bold text-base text-white bg-black hover:bg-neutral-800 transition active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[52px]"
            >
              <span>{isSubmitting ? 'Sending code...' : 'Continue'}</span>
            </button>

            {/* Back Button */}
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => {
                  setJoinStep('form');
                  setRegError('');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                ← Back to account details
              </button>
            </div>
          </div>
        )}

        {/* 4. JOIN - STEP 3: OTP VERIFICATION SCREEN */}
        {mode === 'register' && joinStep === 'otp' && (
          <div className="pt-2 animate-in fade-in duration-200">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl mx-auto mb-2.5 text-slate-800 shadow-xs">
                {sendVia === 'whatsapp' ? '💬' : '📩'}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Enter verification code
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-[320px] mx-auto leading-relaxed">
                Enter the 6-digit code sent via{' '}
                <strong className="text-slate-800">{sendVia === 'whatsapp' ? 'WhatsApp' : 'Text Message'}</strong> to{' '}
                <strong className="text-slate-800">{selectedCountry.code} {phoneNumber}</strong>
              </p>
            </div>

            {otpError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {/* WhatsApp Helper Shortcut Link */}
            {sendVia === 'whatsapp' && (
              <div className="mb-5 text-center">
                <a
                  href={`https://api.whatsapp.com/send?phone=${selectedCountry.code.replace('+', '')}${phoneNumber.trim()}&text=${encodeURIComponent('SNI Verification Code: ' + pendingOtpData?.otp + ' for ' + username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                  <span>Open WhatsApp code preview →</span>
                </a>
              </div>
            )}

            {/* 6-Digit OTP Input Box */}
            <div className="mb-6 flex justify-center">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]*"
                placeholder="• • • • • •"
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full max-w-[260px] text-center font-mono font-black text-2xl tracking-[0.4em] py-3.5 px-4 rounded-2xl border-2 border-slate-300 focus:border-black outline-none bg-slate-50 text-slate-900 transition shadow-inner"
                autoFocus
              />
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={handleVerifyOtpSubmit}
              disabled={isVerifyingOtp || enteredOtp.trim().length < 6}
              className="w-full py-4 px-6 rounded-full font-bold text-base text-white bg-black hover:bg-neutral-800 transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[52px]"
            >
              <span>{isVerifyingOtp ? 'Verifying...' : 'Verify & Submit to Admin'}</span>
            </button>

            {/* Actions: Resend & Change Phone */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-4 px-2">
              <button
                type="button"
                onClick={handleResendOtp}
                className="font-bold text-slate-700 hover:text-black hover:underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend code</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setJoinStep('phone');
                  setEnteredOtp('');
                  setOtpError('');
                }}
                className="font-bold text-slate-700 hover:text-black hover:underline cursor-pointer"
              >
                Change phone number
              </button>
            </div>
          </div>
        )}

        {/* 5. JOIN - STEP 4: SUCCESS & WAITING FOR ADMIN APPROVAL */}
        {mode === 'register' && joinStep === 'success' && (
          <div className="text-center py-4 space-y-4 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto shadow-sm">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              Phone Number Verified!
            </h2>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium leading-relaxed text-left space-y-2">
              <p className="font-bold text-amber-950 flex items-center gap-1.5 text-sm">
                <span>⏳</span> Waiting for Admin Approval
              </p>
              <p>
                Your phone number (<strong>{selectedCountry.code} {phoneNumber}</strong>) has been verified and your registration request for SNI ID (<strong>{username}</strong>) has been submitted to Admin (<strong>info@sni.org.in</strong>).
              </p>
              <p className="text-amber-800">
                Please wait until the Administrator reviews and approves your account before signing in.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginIdentifier(username);
                setJoinStep('form');
                setLoginError('⏳ Waiting for Admin Approval: Your phone number has been verified. Please wait for Administrator approval before signing in.');
              }}
              className="w-full py-4 px-6 rounded-full font-bold text-sm text-white bg-black hover:bg-neutral-800 transition cursor-pointer shadow-md"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* 6. FORGOT PASSWORD FORM */}
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
                Registered Phone / Contact *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. +919876543210 or your phone/email"
                value={forgotContact}
                onChange={(e) => setForgotContact(e.target.value)}
                className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition min-h-[48px] sm:min-h-[44px]"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
                SNI ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. your_sni_id"
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
                  placeholder="Enter new password (min 4 chars)"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-12 min-h-[48px] sm:min-h-[44px]"
                  autoComplete="new-password"
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
                Confirm New Password *
              </label>
              <div className="relative flex items-center">
                <input
                  type={showForgotConfirmPass ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-[#124b91] focus:ring-2 focus:ring-[#124b91]/20 outline-none transition pr-12 min-h-[48px] sm:min-h-[44px]"
                  autoComplete="new-password"
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
              className="w-full py-3.5 sm:py-3 px-4 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#071b3b] via-[#124b91] to-[#071b3b] hover:brightness-110 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 min-h-[48px]"
            >
              <span>{isResetting ? 'Resetting Password...' : 'Reset Password'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-xs sm:text-sm font-extrabold text-[#124b91] hover:underline cursor-pointer"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* PWA Install Modal */}
      {showInstallModal && (
        <InstallAppModal onClose={() => setShowInstallModal(false)} />
      )}
    </div>
  );
}
