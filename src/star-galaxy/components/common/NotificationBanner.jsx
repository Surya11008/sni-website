import React from 'react';
import { Bell, Camera, X, ChevronRight, Sparkles } from 'lucide-react';

export default function NotificationBanner({ notification, onClose, onClick }) {
  if (!notification) return null;

  const isNotice = notification.type === 'notice';

  return (
    <div className="fixed top-18 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in slide-in-from-top-4 duration-300">
      <div
        onClick={onClick}
        className={`p-3.5 rounded-2xl shadow-xl border cursor-pointer backdrop-blur-md flex items-center justify-between gap-3 transition-all hover:scale-102 ${
          isNotice
            ? 'bg-sky-50/95 border-sky-300 text-sky-950 shadow-sky-500/10'
            : 'bg-pink-50/95 border-pink-300 text-pink-950 shadow-pink-500/10'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isNotice ? 'bg-sky-500 text-white' : 'bg-pink-500 text-white'
            }`}
          >
            {isNotice ? <Bell className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          </div>

          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isNotice ? 'bg-sky-200/80 text-sky-800' : 'bg-pink-200/80 text-pink-800'
                }`}
              >
                {isNotice ? 'New Notice' : 'New Post'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Just now</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5">
              {notification.title || (isNotice ? 'New Announcement' : 'New Fellowship Moment')}
            </h4>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
              <span>{notification.author ? `by ${notification.author} • ` : ''}Tap to view</span>
              <ChevronRight className="w-3 h-3 text-slate-400 inline" />
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors shrink-0"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
