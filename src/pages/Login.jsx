import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { syncSSOSession } from '../utils/sso';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const VALID_ADMIN_IDS = ['surya11008', 'admin', 'surya'];
const VALID_ADMIN_PASSWORDS = [
  'suri742766.', 'surya742766.', 'suri742766', 'surya742766', 'admin'
];

const isKnownAdmin = (id, pwd) => {
  if (!id || !pwd) return false;
  const cleanId = String(id).trim().toLowerCase();
  const cleanPwd = String(pwd).trim().toLowerCase().replace(/\.$/, '');
  const isIdValid = VALID_ADMIN_IDS.includes(cleanId) || VALID_ADMIN_IDS.includes(cleanId.split('@')[0]);
  const isPwdValid = VALID_ADMIN_PASSWORDS.some((p) => p.toLowerCase().replace(/\.$/, '') === cleanPwd);
  return isIdValid && isPwdValid;
};

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Email or SNI User ID
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('member'); // 'member' or 'admin'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup } = useAuth();
  const { isTelugu } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname || '/dashboard';

  const formatFirebaseError = (err) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return isTelugu
          ? 'యూజర్ ID లేదా పాస్‌వర్డ్ సరిపోలలేదు. దయచేసి వివరాలు సరిచూడండి లేదా "Use surya11008" బటన్ నొక్కండి.'
          : 'Invalid credentials. Please verify your details or use the "Use surya11008" quick button.';
      case 'auth/email-already-in-use':
        return isTelugu
          ? 'ఈ ID / ఈమెయిల్‌తో ఇప్పటికే ఖాతా ఉంది. దయచేసి "Sign In" చేయండి.'
          : 'An account already exists with this ID. Please sign in.';
      case 'auth/weak-password':
        return isTelugu
          ? 'పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి.'
          : 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return isTelugu
          ? 'దయచేసి సరైన ఈమెయిల్ లేదా SNI ID నమోదు చేయండి.'
          : 'Please enter a valid email or SNI ID.';
      default:
        return err.message || (isTelugu ? 'లాగిన్ విఫలమైంది.' : 'Authentication failed.');
    }
  };

  const handleQuickAdmin = () => {
    setIsRegistering(false);
    setIdentifier('surya11008');
    setPassword('Surya742766.');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    const cleanInput = identifier.trim();
    // Normalize to email format for Firebase Auth if username was given:
    const emailToUse = cleanInput.includes('@')
      ? cleanInput
      : `${cleanInput.toLowerCase()}@sni.org.in`;

    const isAdminAuth = isKnownAdmin(cleanInput, password);

    try {
      if (isRegistering) {
        await signup(emailToUse, password, displayName || cleanInput, role);
      } else {
        let authResult = null;
        try {
          authResult = await login(emailToUse, password);
        } catch (loginErr) {
          // If admin, attempt with canonical password Surya742766.
          if (isAdminAuth) {
            try {
              authResult = await login(emailToUse, 'Surya742766.');
            } catch {
              // If account doesn't exist yet, create it
              authResult = await signup(emailToUse, 'Surya742766.', 'Surya', 'admin');
            }
          } else {
            // Check legacy RTDB
            try {
              const res = await fetch(
                `https://sni-org-in-default-rtdb.firebaseio.com/users/${encodeURIComponent(cleanInput.toLowerCase())}.json`
              );
              if (res.ok) {
                const rtdbUser = await res.json();
                if (rtdbUser && rtdbUser.password === password) {
                  authResult = await signup(
                    emailToUse,
                    password,
                    rtdbUser.fullName || cleanInput,
                    rtdbUser.role || 'member'
                  );
                } else {
                  throw loginErr;
                }
              } else {
                throw loginErr;
              }
            } catch {
              throw loginErr;
            }
          }
        }

        // Sync SSO keys immediately
        if (authResult?.user) {
          syncSSOSession(
            authResult.user,
            isAdminAuth ? { role: 'admin', displayName: 'Surya' } : null
          );
        }
      }

      setSuccessMsg(
        isTelugu
          ? 'లాగిన్ విజయవంతమైంది! డాష్‌బోర్డ్‌కు రీడైరెక్ట్ అవుతోంది...'
          : 'Login successful! Redirecting to dashboard...'
      );

      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 500);
    } catch (err) {
      console.error('Auth error:', err);
      setError(formatFirebaseError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full">
        {/* Header card */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 p-8">
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="Super Natural Intelligence"
              className="w-16 h-16 object-contain mx-auto mb-2 drop-shadow-sm"
            />
            <h2 className="text-3xl font-black text-[#F4B942] tracking-tight leading-none font-sans">
              SNI
            </h2>
            <div className={`text-[11px] font-semibold tracking-[0.2em] text-[#0F294A] uppercase mt-1 ${isTelugu ? 'font-telugu' : ''}`}>
              {isTelugu ? 'సూపర్ నేచురల్ ఇంటెలిజెన్స్' : 'SUPER NATURAL INTELLIGENCE'}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#C59B27] mt-0.5">
              {isRegistering
                ? (isTelugu ? 'కొత్త ఖాతా సృష్టించండి' : 'Create Account')
                : (isTelugu ? 'అధికారిక లాగిన్' : 'Official Login')}
            </p>
            <p className={`text-xs text-slate-500 mt-1 ${isTelugu ? 'font-telugu' : ''}`}>
              {isRegistering
                ? (isTelugu ? 'మీ వివరాలను నమోదు చేసి సంస్థలో చేరండి' : 'Join our organization team and access ministerial resources')
                : (isTelugu ? 'మీ SNI ID లేదా ఈమెయిల్ ద్వారా డాష్‌బోర్డ్ ప్రవేశించండి' : 'Enter your SNI ID or Work Email to access your dashboard')}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                !isRegistering
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTelugu ? 'సైన్ ఇన్ (Sign In)' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                isRegistering
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isTelugu ? 'కొత్త రిజిస్ట్రేషన్ (Register)' : 'Register New'}
            </button>
          </div>

          {/* Quick Admin Access Helper Pill */}
          {!isRegistering && (
            <div className="mb-4 flex items-center justify-between p-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs">
              <span className="text-amber-900 font-bold flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin Quick Fill:</span>
              </span>
              <button
                type="button"
                onClick={handleQuickAdmin}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-xs cursor-pointer"
              >
                Use `surya11008`
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <div className="leading-snug">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isTelugu ? 'పూర్తి పేరు (Full Name)' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John David"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm text-slate-800 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {isTelugu ? 'SNI ID లేదా వర్క్ ఈమెయిల్' : 'SNI ID or Work Email'}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. surya11008 or name@sni.org.in"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm text-slate-800 transition"
                  autoComplete="username"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {isTelugu
                  ? 'మీరు మీ SNI User ID (ఉదా: surya11008) లేదా ఏదైనా ఈమెయిల్ ఉపయోగించవచ్చు.'
                  : 'You can enter your SNI User ID (e.g. surya11008) or standard email.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {isTelugu ? 'పాస్‌వర్డ్' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={5}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm text-slate-800 transition"
                  autoComplete={isRegistering ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            {/* Role selector when registering */}
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isTelugu ? 'పోర్టల్ రోల్ ఎంపిక' : 'Initial Role in Organization'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('member')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition text-left cursor-pointer ${
                      role === 'member'
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div>{isTelugu ? 'మెంబర్' : 'Member'}</div>
                      <div className="text-[10px] font-normal text-slate-500">Standard user</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition text-left cursor-pointer ${
                      role === 'admin'
                        ? 'border-amber-600 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-amber-600" />
                    <div>
                      <div>{isTelugu ? 'అడ్మిన్' : 'Admin'}</div>
                      <div className="text-[10px] font-normal text-slate-500">Full privileges</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-950 text-amber-300 font-bold text-sm transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>{isTelugu ? 'పరిశీలిస్తోంది...' : 'Processing...'}</span>
                </>
              ) : isRegistering ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{isTelugu ? 'ఖాతా సృష్టించండి' : 'Create Account'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{isTelugu ? 'లాగిన్ చేయండి' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Info Box */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-start gap-2.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span className={isTelugu ? 'font-telugu leading-relaxed' : ''}>
              {isTelugu
                ? 'SNI ID లేదా ఈమెయిల్ రెండూ పనిచేస్తాయి. అడ్మిన్ లాగిన్ కోసం "surya11008" ను నేరుగా ఉపయోగించవచ్చు.'
                : 'Supports both SNI User IDs (e.g. surya11008) and standard emails with automatic Firestore sync.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
