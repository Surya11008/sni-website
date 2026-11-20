import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Clock, ShieldAlert, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function PendingApprovalView() {
  const { currentUser, userProfile, logout } = useAuth();
  const { isTelugu } = useLanguage();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
        {/* Animated Status Icon */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-[#0F294A] text-[#F4B942] flex items-center justify-center shadow-lg border border-[#C59B27]/40">
            <Clock className="w-8 h-8 animate-spin duration-3000" />
          </div>
        </div>

        {/* Status Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#C59B27] border border-[#C59B27]/40 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>{isTelugu ? 'ఆమోదం కోసం నిరీక్షణ' : 'Pending Approval'}</span>
          </span>

          <h2
            className={`text-2xl font-bold text-[#0F294A] tracking-tight ${
              isTelugu ? 'font-telugu' : 'font-serif'
            }`}
          >
            {isTelugu ? 'మీ ఖాతా పరిశీలనలో ఉంది' : 'Account Pending Admin Approval'}
          </h2>

          <p className={`text-slate-600 text-xs sm:text-sm leading-relaxed ${isTelugu ? 'font-telugu' : ''}`}>
            {isTelugu
              ? 'మీ నమోదు విజయవంతంగా నమోదైంది. వెబ్‌సైట్‌ను ఉపయోగించడానికి అడ్మిన్ ఆమోదం మరియు మీ రోల్ (Role) కేటాయించడం అవసరం. అడ్మిన్ ఆమోదించిన వెంటనే మీకు యాక్సెస్ లభిస్తుంది.'
              : 'Your account is registered. An administrator must approve your account and assign your ministerial role before you can access the website.'}
          </p>
        </div>

        {/* User Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500">
            <span>Name:</span>
            <span className="font-bold text-slate-800">{userProfile?.displayName || currentUser?.displayName || 'User'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>Registered Email:</span>
            <span className="font-mono text-slate-800 font-semibold truncate max-w-[200px]">{currentUser?.email}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500">
            <span>Current Status:</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold uppercase text-[10px]">
              {userProfile?.status || 'Pending Review'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isTelugu ? 'స్టేటస్ రీఫ్రెష్ చేయండి' : 'Check Status'}</span>
          </button>

          <button
            onClick={() => logout()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isTelugu ? 'లాగ్ అవుట్' : 'Log Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
