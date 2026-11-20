import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  KeyRound,
  Lock,
  Share2,
  MessageSquare,
  Sun,
  ShieldCheck,
  Star,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Bell,
  Mic,
  Music,
  Play,
  Type,
  Moon,
  Palette,
  Check,
  Clock,
  Smartphone,
  Download,
} from 'lucide-react';
import InstallAppModal from '../common/InstallAppModal';
import {
  CLICK_SOUND_THEMES,
  STAR_SOUND_THEMES,
  NOTIFICATION_THEMES,
  STAR_VOICE_TYPES,
  getSoundSettings,
  saveSoundSettings,
  playCuteClick,
  playStarEarnSound,
  speakStarEarned,
  speakWelcomeVoice,
  playNotificationSound,
} from '../../utils/soundEffects';

export default function SettingsTab() {
  const {
    currentUser,
    data,
    updateSettings,
    setIsPinLocked,
    updatePersonalPin,
    updatePinLockSetting,
    changePassword,
    updateProfile,
    updateAutoUserApproval,
    addFeedback,
    t,
  } = useApp();

  const autoApprovalEnabled = data?.settings?.autoUserApproval !== false;
  const isPinLockActive = currentUser?.pinLockEnabled !== false;

  const [copiedToast, setCopiedToast] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  });

  const handleOpenInstall = async () => {
    if (window.deferredPWAInstallPrompt) {
      try {
        window.deferredPWAInstallPrompt.prompt();
        const choice = await window.deferredPWAInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          window.deferredPWAInstallPrompt = null;
          setIsStandalone(true);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setShowInstallModal(true);
  };

  // Sound & Voice Settings state
  const [soundSettings, setSoundSettings] = useState(() => getSoundSettings());

  const updateSound = (key, val) => {
    const updated = { ...soundSettings, [key]: val };
    setSoundSettings(updated);
    saveSoundSettings(updated);
  };

  // Profile & Password Change Form state
  const [nicknameInput, setNicknameInput] = useState(currentUser?.nickname || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  // Personal PIN update state
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinError, setPinError] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);

  // Feedback form state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [enquiryTopic, setEnquiryTopic] = useState('');
  const [enquiryDetails, setEnquiryDetails] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Star Galaxy Weekly Status',
        text: 'Join Star Galaxy to track weekly status, academy progress, and shine together!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handleChangePasswordAndProfile = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    // If nickname changed
    if (nicknameInput !== currentUser.nickname) {
      await updateProfile(nicknameInput.trim(), currentUser.moreDetails);
    }

    // If password fields are filled
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword) {
        setPassError('Please enter both current password and new password.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPassError('New password and confirm password do not match.');
        return;
      }
      if (newPassword.length < 4) {
        setPassError('Password must be at least 4 characters long.');
        return;
      }

      setIsUpdatingPass(true);
      try {
        const res = await changePassword(currentPassword, newPassword);
        if (res.success) {
          setPassSuccess('Password and Profile updated successfully!');
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setPassError(res.error || 'Failed to change password');
        }
      } catch (err) {
        setPassError('An error occurred. Please try again.');
      } finally {
        setIsUpdatingPass(false);
      }
    } else {
      setPassSuccess('Nickname updated successfully!');
    }

    setTimeout(() => {
      setPassSuccess('');
      setPassError('');
    }, 4000);
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    setPinSuccess('');
    setPinError('');

    const cleanPin = newPinInput.trim();
    const cleanConfirm = confirmPinInput.trim();

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setPinError('Personal PIN must be 4 to 6 digits.');
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setPinError('PINs do not match. Please re-enter the same PIN in both fields.');
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await updatePersonalPin(cleanPin);
      if (res.success) {
        setPinSuccess('Personal PIN updated successfully!');
        setNewPinInput('');
        setConfirmPinInput('');
      } else {
        setPinError(res.error || 'Failed to update PIN');
      }
    } catch (err) {
      setPinError('An error occurred. Please try again.');
    } finally {
      setIsUpdatingPin(false);
      setTimeout(() => {
        setPinSuccess('');
        setPinError('');
      }, 4000);
    }
  };

  const handleTogglePinLock = async () => {
    const nextState = !isPinLockActive;
    await updatePinLockSetting(nextState);
    if (nextState) {
      setPinSuccess('Personal PIN Lock turned ON.');
    } else {
      setPinSuccess('Personal PIN Lock turned OFF. App will not ask for PIN.');
    }
    setTimeout(() => {
      setPinSuccess('');
    }, 4000);
  };

  const handleSendEnquiry = (e) => {
    e.preventDefault();
    if (!enquiryTopic.trim() || !enquiryDetails.trim()) return;

    addFeedback(enquiryTopic.trim(), enquiryDetails.trim());
    setFeedbackSuccess('Thank you! Your feedback has been sent to Admin.');
    setEnquiryTopic('');
    setEnquiryDetails('');

    setTimeout(() => {
      setFeedbackSuccess('');
      setShowFeedbackModal(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-24 pt-2 animate-in fade-in duration-300">
      {/* Settings Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl p-5 sm:p-6 text-white shadow-lg flex items-center justify-between gap-4 border border-indigo-900/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide">
                Settings & Preferences
              </h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                Passwords, Personal PIN, Sounds, Star Voices, Lights & Fonts
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPinLocked(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/50 px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
        >
          <Lock className="w-4 h-4" />
          <span>Lock App</span>
        </button>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Passwords, Nickname & Security */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. Change Password & Nickname Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-base shadow-2xs">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{currentUser.name}</h4>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: <strong>{currentUser.username || currentUser.id}</strong> • {currentUser.contact || currentUser.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Success and Error Alerts */}
            {passSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}
            {passError && (
              <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            {/* Password & Nickname Form */}
            <form onSubmit={handleChangePasswordAndProfile} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Nick Name</span>
                </label>
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder="e.g. David Star"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>Change Account Password</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPass ? 'Hide' : 'Show'}</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPass}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                {isUpdatingPass ? 'Updating...' : 'Save Nickname & Password'}
              </button>
            </form>
          </div>

          {/* 2. Personal PIN Security Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                    Personal PIN Security
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isPinLockActive 
                      ? (currentUser.hasSetPersonalPin ? 'Personal PIN protection is ON ✓' : 'PIN is ON (Setup your PIN below)')
                      : 'Personal PIN protection is OFF (No PIN required)'}
                  </p>
                </div>
              </div>

              {isPinLockActive && (
                <button
                  type="button"
                  onClick={() => setIsPinLocked(true)}
                  className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                  title="Lock App Now"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock</span>
                </button>
              )}
            </div>

            {/* Dedicated Personal PIN Lock ON / OFF Switch */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">Personal PIN Lock</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    isPinLockActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isPinLockActive ? 'ON' : 'OFF'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  {isPinLockActive
                    ? 'Active: PIN protection is enabled for your account.'
                    : 'Disabled: App will never prompt for a Personal PIN.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleTogglePinLock}
                className={`w-14 h-8 rounded-full transition-colors relative p-1 shrink-0 cursor-pointer shadow-inner ${
                  isPinLockActive ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
                title={isPinLockActive ? 'Turn OFF PIN Lock' : 'Turn ON PIN Lock'}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                  isPinLockActive ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {pinSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pinSuccess}</span>
              </div>
            )}
            {pinError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePin} className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  <span>Change Personal PIN</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPinInput(!showPinInput)}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  {showPinInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPinInput ? 'Hide' : 'Show'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type={showPinInput ? 'text' : 'password'}
                  required
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="New PIN (4-6 digits)"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 font-semibold font-mono"
                />
                <input
                  type={showPinInput ? 'text' : 'password'}
                  required
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Confirm New PIN"
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 font-semibold font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPin || newPinInput.length < 4 || confirmPinInput.length < 4}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
              >
                {isUpdatingPin ? 'Saving PIN...' : 'Save Personal PIN'}
              </button>
            </form>
          </div>

          {/* 3. Lights (Display Mode) & Fonts Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Lights & Font Preferences</span>
              </h4>
              <span className="text-[10px] uppercase font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                Live App Styling
              </span>
            </div>

            {/* Display Mode (Lights) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center justify-between">
                <span>Lights Mode (Theme)</span>
                <span className="text-[10px] text-slate-400 capitalize">Active: {data.settings.theme || 'light'}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'light', label: 'Light ☀️', desc: 'Day Crisp' },
                  { key: 'dark', label: 'Dark 🌙', desc: 'Midnight Slate' },
                  { key: 'galaxy', label: 'Galaxy 🌌', desc: 'Cosmic Star' },
                  { key: 'warm', label: 'Warm 🕯️', desc: 'Eye Comfort' },
                  { key: 'system', label: 'System ⚙️', desc: 'Device Auto' },
                ].map(m => {
                  const isSelected = (data.settings.theme || 'light') === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => updateSettings({ theme: m.key })}
                      className={`p-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md scale-102'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{m.label}</span>
                      <span className={`text-[9px] font-semibold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {m.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Style / Typeface */}
            <div className="pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Font Style (Typeface)</span>
                </span>
                <span className="text-[10px] text-slate-400 capitalize">Active: {data.settings.fontStyle || 'sans'}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'sans', name: 'Modern Sans', preview: 'Plus Jakarta', fontClass: 'font-sans' },
                  { key: 'outfit', name: 'Bold Outfit', preview: 'Outfit Trendy', fontClass: 'font-sans' },
                  { key: 'rounded', name: 'Rounded Cute', preview: 'Quicksand Soft', fontClass: 'font-sans' },
                  { key: 'serif', name: 'Classic Serif', preview: 'Merriweather', fontClass: 'font-serif' },
                  { key: 'mono', name: 'Tech Mono', preview: 'JetBrains Code', fontClass: 'font-mono' },
                  { key: 'system', name: 'System Clean', preview: 'Native Clean', fontClass: 'font-sans' },
                ].map(f => {
                  const isSelected = (data.settings.fontStyle || 'sans') === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => updateSettings({ fontStyle: f.key })}
                      className={`p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white shadow-md scale-102'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-extrabold">{f.name}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                        {f.preview}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div className="pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Font Size Scale</span>
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Size: {data.settings.fontSize || 'normal'}</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { key: 'xs', label: 'XS (84%)' },
                  { key: 'small', label: 'Small (92%)' },
                  { key: 'normal', label: 'Normal (100%)' },
                  { key: 'large', label: 'Large (110%)' },
                  { key: 'xl', label: 'XL (120%)' },
                  { key: 'xxl', label: 'XXL (132%)' },
                ].map(sz => {
                  const isSelected = (data.settings.fontSize || 'normal') === sz.key;
                  return (
                    <button
                      key={sz.key}
                      type="button"
                      onClick={() => updateSettings({ fontSize: sz.key })}
                      className={`py-2 px-1 text-xs rounded-xl font-black transition-all cursor-pointer text-center border ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs scale-102'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sz.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sounds & Star Voices, Share App & Feedback */}
        <div className="lg:col-span-6 space-y-5">
          {/* 4. Sounds & Star Voice Settings Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {soundSettings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                    Sounds & Voices
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Click sounds, star voices, welcome greeting & notice alerts
                  </p>
                </div>
              </div>

              {/* Master Sound Switch */}
              <button
                type="button"
                onClick={() => updateSound('soundEnabled', !soundSettings.soundEnabled)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                  soundSettings.soundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
                title="Master Sound Toggle"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    soundSettings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* ⭐ Star Voice Section (3 Types as requested!) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-600 fill-amber-400" />
                  <div>
                    <span className="text-xs font-black text-slate-800 block">
                      Star Earn Voice (3 Types)
                    </span>
                    <span className="text-[10px] text-amber-900">
                      Voice speaks as soon as stars are earned
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!soundSettings.soundEnabled}
                  onClick={() => updateSound('starVoiceEnabled', !soundSettings.starVoiceEnabled)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer disabled:opacity-40 ${
                    soundSettings.soundEnabled && soundSettings.starVoiceEnabled ? 'bg-amber-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                      soundSettings.soundEnabled && soundSettings.starVoiceEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* 3 Voice Types Selection */}
              <div className="space-y-1.5 pt-1">
                {STAR_VOICE_TYPES.map(vt => (
                  <div
                    key={vt.id}
                    onClick={() => {
                      if (soundSettings.soundEnabled) {
                        updateSound('starVoiceType', vt.id);
                        speakStarEarned(2, vt.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      soundSettings.starVoiceType === vt.id
                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-black shadow-2xs'
                        : 'bg-white border-amber-200/80 text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{vt.name}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{vt.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        speakStarEarned(2, vt.id);
                      }}
                      className="px-2 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 text-amber-900 text-[10px] font-black flex items-center gap-1 shrink-0"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Test</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Star Sound Themes */}
              <div className="pt-2 border-t border-amber-200/60">
                <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1.5">
                  Star Chime Theme:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STAR_SOUND_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        updateSound('starSoundTheme', theme.id);
                        playStarEarnSound(theme.id);
                      }}
                      className={`p-1.5 rounded-xl text-[11px] font-bold truncate border transition-all text-center flex items-center justify-between px-2.5 cursor-pointer ${
                        soundSettings.starSoundTheme === theme.id
                          ? 'bg-amber-200 border-amber-400 text-amber-950 font-black'
                          : 'bg-white border-amber-200 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      <span className="truncate">{theme.name}</span>
                      <Play className="w-2.5 h-2.5 fill-current opacity-70" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Click Sounds & Themes */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Button Click Sound</span>
                </div>
                <button
                  type="button"
                  disabled={!soundSettings.soundEnabled}
                  onClick={() => updateSound('clickSoundEnabled', !soundSettings.clickSoundEnabled)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer disabled:opacity-40 ${
                    soundSettings.soundEnabled && soundSettings.clickSoundEnabled ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                      soundSettings.soundEnabled && soundSettings.clickSoundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {CLICK_SOUND_THEMES.map(theme => (
                  <div
                    key={theme.id}
                    onClick={() => {
                      if (soundSettings.soundEnabled) {
                        updateSound('clickSoundTheme', theme.id);
                        playCuteClick(theme.id);
                      }
                    }}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer border transition-all ${
                      soundSettings.clickSoundTheme === theme.id
                        ? 'bg-indigo-100/70 border-indigo-300 text-indigo-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{theme.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playCuteClick(theme.id);
                      }}
                      className="w-5 h-5 rounded-md bg-indigo-50 hover:bg-indigo-200 text-indigo-700 flex items-center justify-center shrink-0"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 🗣️ Welcome Voice Greeting Card (Restored as requested!) */}
            <div className="p-3 rounded-2xl bg-pink-50/80 border border-pink-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-pink-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Welcome Voice Greeting
                    </span>
                    <span className="text-[10px] text-pink-800">
                      "Welcome to the Star Galaxy" on opening
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!soundSettings.soundEnabled}
                  onClick={() => updateSound('welcomeVoiceEnabled', !soundSettings.welcomeVoiceEnabled)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer disabled:opacity-40 ${
                    soundSettings.soundEnabled && soundSettings.welcomeVoiceEnabled ? 'bg-pink-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                      soundSettings.soundEnabled && soundSettings.welcomeVoiceEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Notification Alerts */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Notice & Post Alerts</span>
                    <span className="text-[10px] text-slate-500">Alerts only for new notices and posts</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!soundSettings.soundEnabled}
                  onClick={() => updateSound('notificationAlertsEnabled', !soundSettings.notificationAlertsEnabled)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer disabled:opacity-40 ${
                    soundSettings.soundEnabled && soundSettings.notificationAlertsEnabled ? 'bg-sky-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform duration-200 ${
                      soundSettings.soundEnabled && soundSettings.notificationAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {NOTIFICATION_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      updateSound('notificationTheme', theme.id);
                      playNotificationSound(theme.id);
                    }}
                    className={`p-1.5 rounded-xl text-[11px] font-bold truncate border transition-all text-center cursor-pointer ${
                      soundSettings.notificationTheme === theme.id
                        ? 'bg-sky-100 border-sky-400 text-sky-950 font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Audio Test Buttons */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                Test Audio:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => playCuteClick()}
                  className="px-2 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 border border-indigo-100 cursor-pointer"
                >
                  <span>🎵 Click</span>
                </button>
                <button
                  type="button"
                  onClick={() => speakStarEarned(2)}
                  className="px-2 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 border border-amber-200 cursor-pointer"
                >
                  <span>🌟 Star Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => speakWelcomeVoice()}
                  className="px-2 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 border border-pink-200 cursor-pointer"
                >
                  <span>🗣️ Welcome</span>
                </button>
                <button
                  type="button"
                  onClick={() => playNotificationSound()}
                  className="px-2 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 border border-sky-200 cursor-pointer"
                >
                  <span>🔔 Bell</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5. Admin Security & Auto Approval Controls (Admin Only) */}
          {currentUser?.role === 'admin' && (
            <div className="p-5 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border-2 border-purple-200 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xs shrink-0 ${
                  autoApprovalEnabled ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {autoApprovalEnabled ? <Sparkles className="w-5 h-5 animate-pulse" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-extrabold text-xs sm:text-sm text-slate-800">
                      Auto New User Approval
                    </h5>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      autoApprovalEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {autoApprovalEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {autoApprovalEnabled
                      ? 'New member accounts are approved automatically for instant access.'
                      : 'New registrations require manual Admin approval before login.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const nextVal = !autoApprovalEnabled;
                  if (updateAutoUserApproval) await updateAutoUserApproval(nextVal);
                }}
                className={`relative inline-flex h-9 w-20 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out shadow-inner ${
                  autoApprovalEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                title="Toggle Auto Approval"
              >
                <span
                  className={`pointer-events-none inline-block h-8 w-10 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-black ${
                    autoApprovalEnabled ? 'translate-x-9 text-emerald-700' : 'translate-x-0 text-slate-500'
                  }`}
                >
                  {autoApprovalEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          )}

          {/* 📲 Install Star Galaxy App on Phone Card */}
          <div className="p-5 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl border border-indigo-400/40 shadow-md space-y-3.5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-lg shrink-0 shadow-inner">
                  <Smartphone className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h5 className="font-extrabold text-xs sm:text-sm text-white">
                      Install Star Galaxy App on Phone
                    </h5>
                    {isStandalone ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                        Installed ✓
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-amber-950">
                        Available
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-sky-200 mt-0.5 leading-snug">
                    {isStandalone
                      ? 'You are running Star Galaxy as an installed standalone app.'
                      : 'Download and use directly on your mobile home screen with instant access.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-0.5 relative z-10">
              <button
                type="button"
                onClick={handleOpenInstall}
                className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black text-xs rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-950" />
                <span>{isStandalone ? 'View App Installation Details' : 'Install Star Galaxy App on Phone'}</span>
              </button>
            </div>
          </div>

          {/* 6. Share App & Feedback Cards */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleShareApp}
              className="p-5 bg-white hover:bg-sky-50 border border-slate-200 rounded-3xl text-left transition-colors relative shadow-2xs group cursor-pointer"
            >
              <Share2 className="w-6 h-6 text-sky-600 mb-2 group-hover:scale-110 transition-transform" />
              <h5 className="font-bold text-xs sm:text-sm text-slate-800">Share App</h5>
              <p className="text-[10px] text-slate-400">Share link with brethren</p>
              {copiedToast && (
                <span className="absolute top-2 right-2 text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded-md font-bold">
                  Link Copied!
                </span>
              )}
            </button>

            <button
              onClick={() => setShowFeedbackModal(true)}
              className="p-5 bg-white hover:bg-purple-50 border border-slate-200 rounded-3xl text-left transition-colors shadow-2xs group cursor-pointer"
            >
              <MessageSquare className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <h5 className="font-bold text-xs sm:text-sm text-slate-800">Feedback & Enquiry</h5>
              <p className="text-[10px] text-slate-400">Send suggestion to Admin</p>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-purple-200">
            <h3 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span>Feedback & Suggestions</span>
            </h3>

            {feedbackSuccess ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSendEnquiry} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Topic *</label>
                  <input
                    type="text"
                    required
                    value={enquiryTopic}
                    onChange={(e) => setEnquiryTopic(e.target.value)}
                    placeholder="e.g. Star Calculation or App Feature"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Details *</label>
                  <textarea
                    required
                    rows={3}
                    value={enquiryDetails}
                    onChange={(e) => setEnquiryDetails(e.target.value)}
                    placeholder="Write your suggestions for the Admin..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-700 shadow-xs cursor-pointer"
                  >
                    Submit to Admin
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* 📲 Install Star Galaxy App on Phone Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </div>
  );
}
