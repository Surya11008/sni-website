import { useState, useRef, useEffect } from 'react';
import { Smile, X, Tag, Paperclip, Calendar, Sparkles, Link as LinkIcon } from 'lucide-react';

const NOTION_EMOJIS = [
  '📖', '✝️', '🕊️', '⛪', '📜', '🎵', '🙏', '🌟',
  '💡', '🛡️', '🌿', '🕯️', '🍞', '👑', '🎺', '❤️',
  '🌈', '⚓', '🔔', '✨', '🔥', '🌾', '🕊', '☀️'
];

export function NotionToolbar({
  initialData = {},
  onTitleChange,
  onIconChange,
  pageTitle = '',
  editable = true,
  onToggleMedia,
  onToggleMultiPage,
  onOpenEmbed,
  targetPagesCount = 1,
  hasMedia = false,
}) {
  const [icon, setIcon] = useState(initialData.icon || '📖');
  const [title, setTitle] = useState(initialData.title || initialData.titleEn || '');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialData.icon) setIcon(initialData.icon);
    if (initialData.title || initialData.titleEn) {
      setTitle(initialData.title || initialData.titleEn);
    }
  }, [initialData]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (onTitleChange) onTitleChange(val);
  };

  const handleSelectIcon = (em) => {
    setIcon(em);
    setShowIconPicker(false);
    if (onIconChange) onIconChange(em);
  };

  return (
    <div className="pl-6 md:pl-12 pr-6 md:pr-12 pt-4 pb-2 space-y-3">
      {/* Icon Badge */}
      <div className="relative inline-block z-20">
        {editable ? (
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-xl border-4 border-white flex items-center justify-center text-3xl sm:text-4xl cursor-pointer hover:scale-105 transition select-none"
            title="Change icon"
          >
            <span>{icon}</span>
          </button>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-slate-100 flex items-center justify-center text-3xl">
            {icon}
          </div>
        )}

        {/* Emoji Picker Popover */}
        {showIconPicker && editable && (
          <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-40 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Choose Notion Icon</span>
              <button
                type="button"
                onClick={() => setShowIconPicker(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {NOTION_EMOJIS.map((em, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectIcon(em)}
                  className={`w-9 h-9 rounded-xl hover:bg-amber-50 flex items-center justify-center text-xl transition cursor-pointer ${
                    icon === em ? 'bg-amber-100 ring-2 ring-[#C59B27]' : ''
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Borderless Large Notion Title */}
      <div>
        {editable ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="w-full text-3xl sm:text-4xl md:text-5xl font-black text-[#071B3B] bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-300 py-1 leading-tight"
          />
        ) : (
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#071B3B] leading-tight py-1">
            {title || 'Untitled'}
          </h1>
        )}
      </div>

      {/* Properties Strip */}
      <div className="py-2.5 border-y border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-500">Page:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#071B3B] font-bold">
            {pageTitle || 'General'}
          </span>
          {editable && onToggleMultiPage && (
            <button
              type="button"
              onClick={onToggleMultiPage}
              className="text-[11px] font-semibold text-[#C59B27] hover:underline cursor-pointer ml-1"
            >
              {targetPagesCount > 1 ? `(${targetPagesCount} pages)` : '+ Cross-post'}
            </button>
          )}
        </div>

        {editable && onToggleMedia && (
          <div className="flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Media:</span>
            <button
              type="button"
              onClick={onToggleMedia}
              className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[#071B3B] font-bold text-[11px] transition cursor-pointer flex items-center gap-1"
            >
              {hasMedia ? 'Attached (View)' : '+ Attach Media'}
            </button>
          </div>
        )}

        {editable && onOpenEmbed && (
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <button
              type="button"
              onClick={onOpenEmbed}
              className="px-2.5 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-[#071B3B] border border-[#C59B27]/40 font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <LinkIcon className="w-3 h-3 text-[#C59B27]" />
              <span>+ Embed / Link Preview</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto text-[11px] text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
