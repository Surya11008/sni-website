import React, { useState, useEffect, useMemo } from 'react';
import {
  Type,
  Search,
  Plus,
  Check,
  Trash2,
  X,
  ExternalLink,
  Sparkles,
  Globe,
} from 'lucide-react';
import {
  getAllAvailableFonts,
  loadGoogleFont,
  saveCustomFont,
  removeCustomFont,
} from '../../utils/fontManager';

export default function FontPickerModal({
  selectedFont = 'Inter',
  onSelectFont,
  onClose,
  title = 'Select Note Font',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newFontInput, setNewFontInput] = useState('');
  const [fontList, setFontList] = useState(() => getAllAvailableFonts());
  const [addFeedback, setAddFeedback] = useState(null);

  // Load preview fonts for visible fonts
  useEffect(() => {
    fontList.forEach((f) => loadGoogleFont(f.name));
  }, [fontList]);

  // Filtered fonts
  const filteredFonts = useMemo(() => {
    return fontList.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory =
        selectedCategory === 'All' ||
        f.category === selectedCategory ||
        (selectedCategory === 'Custom' && f.isCustom);
      return matchSearch && matchCategory;
    });
  }, [fontList, searchTerm, selectedCategory]);

  // Handle adding custom Google Font
  const handleAddCustomFont = (e) => {
    e?.preventDefault();
    if (!newFontInput.trim()) return;

    const added = saveCustomFont(newFontInput.trim());
    if (added) {
      setFontList(getAllAvailableFonts());
      onSelectFont(added.name);
      setAddFeedback({ type: 'success', text: `"${added.name}" added and applied successfully!` });
      setNewFontInput('');
      setTimeout(() => setAddFeedback(null), 3000);
    } else {
      setAddFeedback({ type: 'error', text: 'Could not parse font name. Please check spelling.' });
      setTimeout(() => setAddFeedback(null), 3000);
    }
  };

  const handleDeleteCustom = (e, fontName) => {
    e.stopPropagation();
    removeCustomFont(fontName);
    setFontList(getAllAvailableFonts());
    if (selectedFont === fontName) {
      onSelectFont('Inter');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-amber-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F294A] text-[#F4B942] flex items-center justify-center font-bold text-sm shadow-xs">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F294A]">{title}</h3>
              <p className="text-xs text-slate-500">
                Choose typography for this note or add any font from Google Fonts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add from Google Fonts Bar */}
        <div className="p-4 bg-amber-50/60 border-b border-amber-200/80">
          <form onSubmit={handleAddCustomFont} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>Add Any Font from Google Fonts:</span>
              </label>
              <a
                href="https://fonts.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-amber-800 hover:underline flex items-center gap-1"
              >
                <span>Browse fonts.google.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newFontInput}
                onChange={(e) => setNewFontInput(e.target.value)}
                placeholder="Type Google Font name (e.g. Oswald, Dancing Script, Lora) or paste link..."
                className="flex-1 p-2.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="submit"
                disabled={!newFontInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Font</span>
              </button>
            </div>
            {addFeedback && (
              <p
                className={`text-xs font-semibold ${
                  addFeedback.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {addFeedback.text}
              </p>
            )}
          </form>
        </div>

        {/* Search & Category Pills */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search fonts by name, style, or language..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 text-xs">
            {['All', 'Sans-Serif', 'Serif', 'Handwriting', 'Telugu', 'Custom'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0F294A] text-[#F4B942] shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'Custom' ? '⭐ Custom Added' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Font List Cards */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 divide-y divide-slate-100">
          {filteredFonts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No fonts matched your search. You can add it directly above using the Google Fonts adder!
            </div>
          ) : (
            filteredFonts.map((f) => {
              const isSelected = selectedFont.toLowerCase() === f.name.toLowerCase();

              return (
                <div
                  key={f.name}
                  onClick={() => {
                    loadGoogleFont(f.name);
                    onSelectFont(f.name);
                    onClose();
                  }}
                  className={`pt-2.5 first:pt-0 p-3 rounded-2xl transition cursor-pointer flex items-center justify-between gap-4 group ${
                    isSelected
                      ? 'bg-amber-50/90 border border-amber-300 shadow-2xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-[#0F294A]">
                        {f.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                        {f.category}
                      </span>
                      {f.isCustom && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                          Custom
                        </span>
                      )}
                    </div>
                    {/* Live Font Sample */}
                    <p
                      className="text-base sm:text-lg text-slate-800 truncate"
                      style={{ fontFamily: `'${f.name}', sans-serif` }}
                    >
                      {f.sample || 'The truth and light of God'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {f.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustom(e, f.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove font from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isSelected && (
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Active font: <strong className="text-slate-800">{selectedFont}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 font-bold text-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
