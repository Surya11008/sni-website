import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck, LogOut, Sparkles } from 'lucide-react';

export default function PinLockModal() {
  const { isPinLocked, setIsPinLocked, currentUser, updatePersonalPin, logout, t } = useApp();

  // Mode: if user hasn't set custom personal PIN yet, show setup mode ('setup'), else unlock mode ('unlock')
  const needsPinSetup = currentUser && (!currentUser.hasSetPersonalPin || !currentUser.personalPin);

  // Setup form state (asks 2 times for confirmation)
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showSetupPin, setShowSetupPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [setupError, setSetupError] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Unlock mode state
  const [inputPin, setInputPin] = useState('');
  const [showInputPin, setShowInputPin] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  if (!isPinLocked || !currentUser || currentUser.pinLockEnabled === false) return null;

  // Handle Setup Submit (2 times confirmation)
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    setSetupError('');

    const cleanPin = setupPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      setSetupError('Personal PIN must be 4 to 6 digits.');
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setSetupError('PINs do not match. Please re-enter the same PIN in both fields.');
      return;
    }

    setIsSavingPin(true);
    try {
      const res = await updatePersonalPin(cleanPin);
      if (!res.success) {
        setSetupError(res.error || 'Failed to save PIN');
      } else {
        setSetupPin('');
        setConfirmPin('');
      }
    } catch (err) {
      setSetupError('An error occurred. Please try again.');
    } finally {
      setIsSavingPin(false);
    }
  };

  // Handle Digit click on keypad
  const handleKeypadDigit = (digit) => {
    if (needsPinSetup) {
      // In setup mode, fill setupPin first, or confirmPin if focused
      if (setupPin.length < 6) {
        setSetupPin(prev => prev + digit);
      }
    } else {
      if (inputPin.length < 6) {
        const next = inputPin + digit;
        setInputPin(next);
        setUnlockError('');

        // Instant verify if matches expected personal PIN
        if (next === currentUser.personalPin) {
          setIsPinLocked(false);
          setInputPin('');
        }
      }
    }
  };

  // Handle Unlock Submit
  const handleUnlockSubmit = (e) => {
    if (e) e.preventDefault();
    setUnlockError('');

    if (inputPin.trim() === currentUser.personalPin) {
      setIsPinLocked(false);
      setInputPin('');
    } else {
      setUnlockError('Incorrect Personal PIN. Please try again.');
      setInputPin('');
    }
  };

  const handleKeypadDelete = () => {
    if (needsPinSetup) {
      setSetupPin(prev => prev.slice(0, -1));
    } else {
      setInputPin(prev => prev.slice(0, -1));
      setUnlockError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border-4 border-amber-300 relative overflow-hidden">
        {/* Background glow decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-200/40 rounded-full blur-2xl pointer-events-none" />

        {/* Security Badge Icon */}
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-200 border-2 border-amber-400 text-amber-900 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-amber-500/20">
          <ShieldCheck className="w-9 h-9" />
        </div>

        {/* ========================================================
            CASE A: FIRST TIME SETUP — CREATE PERSONAL PIN (2 TIMES)
           ======================================================== */}
        {needsPinSetup ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Create Personal PIN</span>
              </h2>
              <p className="text-xs font-bold text-indigo-700 mt-0.5">
                Personal Security PIN
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                All members must set a Personal PIN for account security. Enter 2 times for confirmation.
              </p>
            </div>

            {setupError && (
              <div className="p-2.5 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200 flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}

            <form onSubmit={handleSetupSubmit} className="space-y-3 text-left">
              {/* 1. New PIN */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1">
                  <span>1. New Personal PIN (4-6 digits) *</span>
                  <button
                    type="button"
                    onClick={() => setShowSetupPin(!showSetupPin)}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                  >
                    {showSetupPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showSetupPin ? 'Hide' : 'Show'}</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showSetupPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="Enter 4-6 digit PIN"
                    value={setupPin}
                    onChange={(e) => setSetupPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3.5 py-2.5 text-center tracking-widest text-base font-black border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-200 font-mono"
                  />
                </div>
              </div>

              {/* 2. Confirm PIN */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1">
                  <span>2. Confirm Same PIN *</span>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                  >
                    {showConfirmPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showConfirmPin ? 'Hide' : 'Show'}</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    required
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="Re-enter same PIN to confirm"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3.5 py-2.5 text-center tracking-widest text-base font-black border-2 border-amber-200 rounded-xl focus:border-amber-400 focus:ring-2 focus:ring-amber-200 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingPin || setupPin.length < 4 || confirmPin.length < 4}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
              >
                {isSavingPin ? 'Saving PIN...' : 'Save Personal PIN & Unlock ✓'}
              </button>
            </form>
          </div>
        ) : (
          /* ========================================================
             CASE B: REOPEN / RETURN — ENTER PERSONAL PIN TO UNLOCK
             ======================================================== */
          <div className="space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-800">
                Enter Personal PIN
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Personal PIN for <strong className="text-sky-700">{currentUser.name}</strong>
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                ID: {currentUser.username || currentUser.id}
              </p>
            </div>

            {/* PIN Dots Display */}
            <div className="flex justify-center items-center gap-2.5 my-3">
              {[0, 1, 2, 3, 4, 5].slice(0, Math.max(4, currentUser.personalPin?.length || 4)).map(idx => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    inputPin.length > idx
                      ? 'bg-amber-500 border-amber-600 scale-125 shadow-xs'
                      : 'bg-slate-100 border-slate-300'
                  }`}
                />
              ))}
            </div>

            {/* Direct Input Field with Show/Hide toggle */}
            <form onSubmit={handleUnlockSubmit} className="relative">
              <input
                type={showInputPin ? 'text' : 'password'}
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
                autoFocus
                placeholder="Enter Personal PIN"
                value={inputPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setInputPin(val);
                  setUnlockError('');
                  if (val === currentUser.personalPin) {
                    setIsPinLocked(false);
                    setInputPin('');
                  }
                }}
                className="w-full px-4 py-2.5 text-center tracking-widest text-lg font-black border-2 border-slate-200 rounded-2xl focus:border-amber-400 focus:ring-2 focus:ring-amber-200 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowInputPin(!showInputPin)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                title={showInputPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showInputPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </form>

            {unlockError && (
              <p className="text-xs text-rose-600 font-bold flex items-center justify-center gap-1 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{unlockError}</span>
              </p>
            )}

            {/* On-screen Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[230px] mx-auto pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadDigit(String(num))}
                  className="w-16 h-12 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-slate-800 font-black text-lg active:scale-95 transition-all shadow-2xs"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleUnlockSubmit}
                disabled={inputPin.length < 4}
                className="w-16 h-12 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs active:scale-95 transition-all border border-emerald-200 disabled:opacity-40"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => handleKeypadDigit('0')}
                className="w-16 h-12 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-slate-800 font-black text-lg active:scale-95 transition-all shadow-2xs"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadDelete}
                className="w-16 h-12 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs active:scale-95 transition-all border border-rose-200"
              >
                ⌫
              </button>
            </div>

            {/* Switch Account / Login with Password option */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Switch Account / Login with ID & Password</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
