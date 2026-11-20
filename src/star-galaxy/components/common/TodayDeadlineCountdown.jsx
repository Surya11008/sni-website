import React, { useState, useEffect } from 'react';
import { Clock, Sparkles } from 'lucide-react';

export default function TodayDeadlineCountdown({ variant = 'compact' }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining());

  function getTimeRemaining() {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const diff = Math.max(0, endOfDay.getTime() - now.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      isClosed: diff <= 0,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 p-[1.5px] rounded-2xl shadow-sm animate-pulse-slow">
        <div className="bg-white/95 rounded-[14px] px-3.5 py-1.5 flex items-center justify-between text-xs font-bold text-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-sm animate-bounce">⏳</span>
            <span className="text-slate-600 font-semibold">Today's Input Closes in:</span>
            <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
              {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
            </span>
          </div>
          <span className="text-[10px] text-purple-700 font-extrabold uppercase bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 hidden sm:inline">
            Daily Close: 11:59:59 PM
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-50 to-rose-50 border border-rose-200 shadow-2xs text-[11px] font-bold text-slate-800">
      <Clock className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" />
      <span className="text-slate-500 font-semibold hidden sm:inline">Today Closes in:</span>
      <span className="font-mono font-black text-rose-600 tracking-wider">
        {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
      </span>
      <span className="text-[9px] text-rose-700 bg-rose-100/70 px-1.5 py-0.2 rounded font-black">
        11:59:59 PM
      </span>
    </div>
  );
}
