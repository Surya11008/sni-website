import React from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar } from 'lucide-react';

export default function CompactDateFilter() {
  const { dateRange, setDateRange } = useApp();

  return (
    <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl px-2.5 py-1.5 shadow-2xs transition-all">
      <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
      <input
        type="date"
        value={dateRange.startDate}
        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
        className="bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 cursor-pointer w-[105px]"
        title="Start Date"
      />
      <span className="text-slate-400 font-bold text-xs">→</span>
      <input
        type="date"
        value={dateRange.endDate}
        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
        className="bg-transparent border-0 p-0 text-xs font-bold text-slate-800 focus:ring-0 cursor-pointer w-[105px]"
        title="End Date"
      />
    </div>
  );
}
