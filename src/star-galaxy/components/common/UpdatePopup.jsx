import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, ArrowUpCircle } from 'lucide-react';
import LinkifiedText from './LinkifiedText';

export default function UpdatePopup() {
  const { data, showUpdateModal, dismissUpdatePopup, applyAppUpdate } = useApp();

  if (!showUpdateModal || !data.availableUpdate.hasUpdate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-amber-300 relative overflow-hidden">
        {/* Decorative corner stars */}
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-100 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-sky-100 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🎉</span>
            <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-amber-300">
              NEW UPDATE
            </span>
          </div>
          <button
            onClick={dismissUpdatePopup}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-800">
          Star Galaxy New Version Available!
        </h3>
        <p className="text-xs text-indigo-600 font-semibold mt-0.5">
          Version {data.availableUpdate.version} • Released {data.availableUpdate.releaseDate}
        </p>

        <div className="my-4 p-3 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs text-slate-700 leading-relaxed">
          <p className="font-semibold text-amber-900 mb-1">
            <LinkifiedText text={data.availableUpdate.title} />
          </p>
          <LinkifiedText as="p" text={data.availableUpdate.details} />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={applyAppUpdate}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Update Now
          </button>
          <button
            onClick={dismissUpdatePopup}
            className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-2xl text-xs transition-colors"
          >
            Close ✕
          </button>
        </div>
      </div>
    </div>
  );
}
