import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Globe, Check, Search, Languages, Sparkles } from 'lucide-react';
import { LANGUAGES } from '../../utils/translations';

export default function LanguageSwitcher({ variant = 'default', showTranslateBadge = false }) {
  const { language, setLanguage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const handleSelectLang = (code) => {
    setLanguage(code);
    setIsOpen(false);

    // Apply real-time translation across all page contents via Google Translate engine
    try {
      if (code === 'en') {
        document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        document.cookie = `googtrans=; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        const select = document.querySelector('.goog-te-combo');
        if (select) {
          select.value = 'en';
          select.dispatchEvent(new Event('change'));
        }
      } else {
        const gCode = code === 'zh-CN' ? 'zh-CN' : code;
        document.cookie = `googtrans=/en/${gCode}; path=/;`;
        document.cookie = `googtrans=/en/${gCode}; path=/; domain=.${window.location.hostname};`;
        const select = document.querySelector('.goog-te-combo');
        if (select) {
          select.value = gCode;
          select.dispatchEvent(new Event('change'));
        }
      }
    } catch (e) {}
  };

  const filtered = LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
          variant === 'dark'
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200'
        }`}
        title="Language"
      >
        <Globe className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
        <span className="text-xs">{activeLang.flag}</span>
        <span className="hidden sm:inline font-semibold">{activeLang.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-indigo-600" />
              <span>Language</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              {LANGUAGES.length} Languages
            </span>
          </div>

          {/* Search Box */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language..."
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-400 font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-400 font-medium">No language found</p>
            ) : (
              filtered.map(lang => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelectLang(lang.code)}
                    className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-extrabold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <div>
                        <span className="block font-bold leading-tight">{lang.name}</span>
                        <span className="block text-[10px] text-slate-400 leading-none">{lang.nativeName}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
