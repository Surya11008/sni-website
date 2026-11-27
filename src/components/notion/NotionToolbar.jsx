import { useState, useRef, useEffect } from 'react';
import {
  Smile,
  X,
  Tag,
  Paperclip,
  Calendar,
  Sparkles,
  Link as LinkIcon,
  Type,
  ChevronDown,
} from 'lucide-react';
import AllEmojisPicker from '../common/AllEmojisPicker';
import FontPickerModal from '../common/FontPickerModal';
import { cleanObjectReplacementChars, loadGoogleFont } from '../../utils/fontManager';

export function NotionToolbar({
  initialData = {},
  onTitleChange,
  onIconChange,
  pageTitle = '',
  editable = true,
  onToggleMedia,
  onToggleMultiPage,
  onOpenEmbed,
  onToggleSchedule,
  hasSchedule = false,
  targetPagesCount = 1,
  hasMedia = false,
  fontFamily = 'Inter',
  onFontChange,
}) {
  const [icon, setIcon] = useState(initialData.icon || '📖');
  const [title, setTitle] = useState(cleanObjectReplacementChars(initialData.title || initialData.titleEn || ''));
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialData.icon) setIcon(initialData.icon);
    if (initialData.title || initialData.titleEn) {
      setTitle(cleanObjectReplacementChars(initialData.title || initialData.titleEn));
    }
  }, [initialData]);

  useEffect(() => {
    if (fontFamily) {
      loadGoogleFont(fontFamily);
    }
  }, [fontFamily]);

  const handleTitleChange = (e) => {
    const val = cleanObjectReplacementChars(e.target.value);
    setTitle(val);
    if (onTitleChange) onTitleChange(val);
  };

  const handleSelectIcon = (em) => {
    setIcon(em);
    setShowIconPicker(false);
    if (onIconChange) onIconChange(em);
  };

  const handleSelectFont = (fName) => {
    if (onFontChange) onFontChange(fName);
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

        {/* All Emojis Picker Popover */}
        {showIconPicker && editable && (
          <div className="absolute left-0 top-full mt-2 z-50">
            <AllEmojisPicker
              selectedEmoji={icon}
              onSelectEmoji={handleSelectIcon}
              onClose={() => setShowIconPicker(false)}
              title="Select Page Icon / Emoji"
            />
          </div>
        )}
      </div>

      {/* Borderless Large Notion Title with selected Font */}
      <div>
        {editable ? (
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            style={{ fontFamily: `'${fontFamily}', sans-serif` }}
            className="w-full text-3xl sm:text-4xl md:text-5xl font-black text-[#071B3B] bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-300 py-1 leading-tight"
          />
        ) : (
          <h1
            style={{ fontFamily: `'${fontFamily}', sans-serif` }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-[#071B3B] leading-tight py-1"
          >
            {title || 'Untitled'}
          </h1>
        )}
      </div>

      {/* Properties Strip */}
      <div className="py-2.5 border-y border-slate-100 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {/* Page Tag */}
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

        {/* Font Selector & Google Fonts Option */}
        <div className="flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-semibold text-slate-500">Font:</span>
          {editable ? (
            <button
              type="button"
              onClick={() => setShowFontPicker(true)}
              className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 text-[#071B3B] font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 border border-slate-200"
              title="Change note font or add from Google Fonts"
            >
              <span style={{ fontFamily: `'${fontFamily}', sans-serif` }}>{fontFamily}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          ) : (
            <span
              className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#071B3B] font-bold text-[11px]"
              style={{ fontFamily: `'${fontFamily}', sans-serif` }}
            >
              {fontFamily}
            </span>
          )}
        </div>

        {/* Schedule */}
        {editable && onToggleSchedule && (
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
            <span className="font-semibold text-slate-500">Schedule:</span>
            <button
              type="button"
              onClick={onToggleSchedule}
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                hasSchedule
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-[#071B3B]'
              }`}
            >
              {hasSchedule ? '📅 Scheduled (Edit)' : '+ Date & Time'}
            </button>
          </div>
        )}

        {/* Media Attachments */}
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

        {/* Embed / Link Preview */}
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

      {/* Font Picker Modal */}
      {showFontPicker && editable && (
        <FontPickerModal
          selectedFont={fontFamily}
          onSelectFont={handleSelectFont}
          onClose={() => setShowFontPicker(false)}
          title="Select Note Font & Google Fonts"
        />
      )}
    </div>
  );
}
