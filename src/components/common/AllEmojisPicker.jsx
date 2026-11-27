import React, { useState, useMemo } from 'react';
import { Search, X, Smile, Sparkles, Check } from 'lucide-react';

export const EMOJI_CATEGORIES = {
  'Faith & Sacred': [
    '📖', '✝️', '🕊️', '⛪', '📜', '🎵', '🙏', '🌟', '💡', '🛡️',
    '🌿', '🕯️', '🍞', '👑', '🎺', '❤️', '🌈', '⚓', '🔔', '✨',
    '🔥', '🌾', '☀️', '🍇', '🤲', '📯', '🕊', '✝', '🪔', '🤍',
    '🏛️', '🩸', '🍷', '🐟', '🐑', '🦁', '🕎', '👼', '⛪', '🛐'
  ],
  'Smileys & Emotions': [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐',
    '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
    '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤠', '🥳', '😎',
    '🤓', '🧐', '🥺', '😳', '🤯', '😭', '😱', '🥱', '😴', '💖'
  ],
  'People & Gestures': [
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
    '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎',
    '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
    '✍️', '💅', '🤳', '🧑', '👧', '🧒', '👦', '👩', '👨', '👴',
    '👵', '🧓', '👶', '🤱', '🤰', '🗣️', '👤', '👥', '🫂', '🕺'
  ],
  'Nature & Animals': [
    '🌱', '🌿', '☘️', '🍀', '🪴', '🍃', '🍂', '🍁', '🌾', '🌺',
    '🌻', '🌹', '🥀', '🌷', '🌼', '🌸', '💐', '🌲', '🌳', '🌴',
    '🌵', '🌊', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️',
    '🌩️', '🌨️', '❄️', '☃️', '🌬️', '🌈', '⚡', '🌟', '⭐', '🌠',
    '🕊️', '🦅', '🦆', '🦉', '🐝', '🦋', '🦁', '🐑', '🐐', '🐟',
    '🐬', '🐳', '🐎', '🦌', '🐮', '🕊', '🌿', '🌱', '🌾', '🌴'
  ],
  'Food & Fellowship': [
    '🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🍎', '🍏', '🍐',
    '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍞',
    '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍯', '🥛', '☕', '🍵',
    '🧃', '🥤', '🍷', '🍽️', '🥣', '🥗', '🥘', '🍲', '🍿', '🧁'
  ],
  'Celebration & Activities': [
    '🎉', '🎊', '🎈', '🎁', '🎂', '🏆', '🥇', '🥈', '🥉', '🏅',
    '🎖️', '🎗️', '🎫', '🎟️', '🎪', '🎨', '🎬', '🎤', '🎧', '🎼',
    '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '⚽', '🏀', '🎯',
    '🎪', '🕯️', '🪔', '🏮', '🎆', '🎇', '✨', '🌟', '💫', '🪄'
  ],
  'Objects & Symbols': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '✡️', '🕎', '🛐', '🔯', '🔔', '📣', '📢', '💬', '💭',
    '🏷️', '📌', '📍', '📎', '🔒', '🔑', '📅', '📆', '🗓️', '📇',
    '📈', '📊', '📋', '📁', '📂', '📄', '📝', '✏️', '✒️', '🔍'
  ]
};

export default function AllEmojisPicker({
  selectedEmoji = '',
  onSelectEmoji = () => {},
  onClose = () => {},
  title = 'Select Icon / Emoji'
}) {
  const [activeCategory, setActiveCategory] = useState('Faith & Sacred');
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');

  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      if (activeCategory === 'All') {
        const all = [];
        Object.values(EMOJI_CATEGORIES).forEach((list) => all.push(...list));
        return Array.from(new Set(all));
      }
      return EMOJI_CATEGORIES[activeCategory] || [];
    }

    // When searching, search across all categories
    const all = [];
    Object.entries(EMOJI_CATEGORIES).forEach(([cat, list]) => {
      list.forEach((em) => {
        if (cat.toLowerCase().includes(q) || em.includes(q)) {
          all.push(em);
        }
      });
    });
    // If no match found by category name, return all emojis that match direct input or general set
    if (all.length === 0) {
      const allUnique = Array.from(new Set(Object.values(EMOJI_CATEGORIES).flat()));
      return allUnique.filter((em) => em.includes(q));
    }
    return Array.from(new Set(all));
  }, [activeCategory, searchQuery]);

  const handleApplyCustom = (e) => {
    if (e) e.preventDefault();
    if (!customInput.trim()) return;
    onSelectEmoji(customInput.trim());
    onClose();
  };

  return (
    <div className="w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-bold">
            <Smile className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 leading-tight">{title}</h4>
            <p className="text-[10px] text-slate-400">Choose from categories or paste any emoji</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search emojis..."
          className="w-full pl-8.5 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40 transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none text-[11px]">
          {['All', ...Object.keys(EMOJI_CATEGORIES)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-semibold transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#071B3B] text-[#F4B942] shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-7 sm:grid-cols-8 gap-1.5 max-h-[220px]">
        {filteredEmojis.map((em, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelectEmoji(em);
              onClose();
            }}
            className={`w-9 h-9 rounded-xl hover:bg-amber-50 flex items-center justify-center text-xl transition cursor-pointer hover:scale-115 active:scale-95 ${
              selectedEmoji === em ? 'bg-amber-100 ring-2 ring-[#C59B27]' : ''
            }`}
            title={em}
          >
            {em}
          </button>
        ))}
      </div>

      {/* Custom Emoji / Keyboard Input Footer */}
      <form onSubmit={handleApplyCustom} className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Paste or type any emoji..."
          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C59B27]/40 transition"
        />
        <button
          type="submit"
          disabled={!customInput.trim()}
          className="px-3 py-1.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] disabled:opacity-40 text-[#F4B942] font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply</span>
        </button>
      </form>
    </div>
  );
}
