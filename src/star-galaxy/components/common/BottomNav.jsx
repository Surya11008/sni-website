import React from 'react';
import { useApp } from '../../context/AppContext';
import { Target, BarChart3, MoreHorizontal, Settings, ShieldCheck } from 'lucide-react';

export default function BottomNav() {
  const { activeTab, setActiveTab, currentUser, t } = useApp();

  const tabs = [
    { id: 'activities', label: t('navActivities') || 'Activities', icon: Target, color: 'text-slate-600', activeBg: 'bg-[#071B3B] text-[#F4B942] border border-[#F4B942]/30 shadow-sm font-black' },
    { id: 'status', label: t('navStatus') || 'Status', icon: BarChart3, color: 'text-slate-600', activeBg: 'bg-[#071B3B] text-[#F4B942] border border-[#F4B942]/30 shadow-sm font-black' },
    { id: 'more', label: t('navMore') || 'More', icon: MoreHorizontal, color: 'text-slate-600', activeBg: 'bg-[#071B3B] text-[#F4B942] border border-[#F4B942]/30 shadow-sm font-black' },
    { id: 'settings', label: t('navSettings') || 'Settings', icon: Settings, color: 'text-slate-600', activeBg: 'bg-[#071B3B] text-[#F4B942] border border-[#F4B942]/30 shadow-sm font-black' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 max-w-lg mx-auto shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
                isActive ? `${tab.activeBg} font-bold scale-105` : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? '' : 'stroke-[1.75]'}`} />
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Admin Tab Shortcut if logged in as Admin */}
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
              activeTab === 'admin' ? 'bg-[#071B3B] text-[#F4B942] border border-[#F4B942]/40 font-black scale-105 shadow-xs' : 'text-[#071B3B] hover:text-[#C59B27]'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[11px] mt-0.5 tracking-tight font-medium">
              {t('navAdmin') || 'Admin'}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
