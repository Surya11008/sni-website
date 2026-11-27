import { useState, useEffect } from 'react';
import { Play, Music, List, ArrowRight, MessageSquare, Check, Sparkles } from 'lucide-react';

export default function OnlineWorshipSection({ onStartWorship }) {
  const [selectedMode, setSelectedMode] = useState('pray-on-my-own');
  const [currentDateStr, setCurrentDateStr] = useState('');
  const [activeStep, setActiveStep] = useState(null); // When started

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) + ' ' + now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    setCurrentDateStr(formatted);
  }, []);

  const modes = [
    {
      id: 'fully-automatic',
      title: 'Fully Automatic',
      icon: Play,
      desc: 'All parts of the worship service proceed automatically.',
      default: false,
    },
    {
      id: 'pray-on-my-own',
      title: 'Pray on My Own',
      badge: 'Default',
      icon: Sparkles,
      desc: 'All steps except prayer proceed automatically and you pray on your own.',
      default: true,
    },
    {
      id: 'without-new-songs',
      title: 'Without New Songs',
      icon: Music,
      desc: 'New Songs are skipped, and you pray on your own.',
      default: false,
    },
    {
      id: 'manual',
      title: 'Manual',
      icon: List,
      desc: 'Worship by moving through each step yourself at your own pace.',
      default: false,
    },
  ];

  const handleStart = (modeId) => {
    setSelectedMode(modeId);
    if (onStartWorship) {
      onStartWorship(modeId);
    } else {
      setActiveStep(`Worship service initiated in ${modeId} mode.`);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 via-sky-50 to-white border border-sky-100 p-8 sm:p-14 text-center my-6 shadow-sm">
      {/* Decorative Cloud Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#071B3B] tracking-tight">
              The Church of God Online Worship
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#C59B27] font-bold text-[10px] uppercase border border-[#C59B27]/40">
              Beta
            </span>
          </div>

          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/90 shadow-2xs border border-sky-100 text-xs font-semibold text-slate-600">
              {currentDateStr || 'Friday, November 27, 2026'}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#0F294A] pt-2">
            How would you like to worship?
          </h3>
        </div>

        {/* 4 Cards Grid (Matching Image 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <div
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`rounded-2xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-[#3b5998] text-white border-[#3b5998] shadow-lg scale-102'
                    : 'bg-white text-slate-800 border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-sky-50 text-[#3b5998]'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    {mode.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {mode.badge}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold mb-1.5">{mode.title}</h4>
                  <p
                    className={`text-xs leading-relaxed ${
                      isSelected ? 'text-sky-100' : 'text-slate-500'
                    }`}
                  >
                    {mode.desc}
                  </p>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStart(mode.id);
                    }}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold transition group ${
                      isSelected ? 'text-white hover:underline' : 'text-[#3b5998] hover:underline'
                    }`}
                  >
                    <span>Start</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feedback text */}
        <div className="pt-2 text-xs text-slate-500">
          <span>Did you have any difficulties while worshiping? </span>
          <a
            href="mailto:contact@sni.org.in"
            className="font-bold text-[#3b5998] hover:underline ml-1"
          >
            Share Feedback
          </a>
        </div>

        {activeStep && (
          <div className="p-3 bg-white/90 border border-sky-200 rounded-xl text-xs text-sky-900 font-bold inline-block">
            {activeStep}
          </div>
        )}
      </div>
    </div>
  );
}
