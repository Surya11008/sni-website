import { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Eye,
  Edit3,
  HelpCircle,
} from 'lucide-react';
import RichContentRenderer from './RichContentRenderer';

export default function RichTextEditor({
  value = '',
  onChange,
  label = 'Content',
  placeholder = 'Write detailed article content, sermon notes, circulars, or instructions...',
  isTelugu = false,
  rows = 8,
}) {
  const [tab, setTab] = useState('write'); // 'write' or 'preview'
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef(null);

  // Insert formatting wrapper or prefix at cursor selection
  const insertFormat = (before, after = '', defaultPlaceholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end) || defaultPlaceholder;

    const newText =
      currentText.substring(0, start) +
      before +
      selected +
      after +
      currentText.substring(end);

    onChange(newText);

    // Restore focus & selection
    setTimeout(() => {
      textarea.focus();
      const newCursor = start + before.length + selected.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const insertLinePrefix = (prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentText = textarea.value;

    // Find the start of the current line
    const lineStart = currentText.lastIndexOf('\n', start - 1) + 1;
    const newText =
      currentText.substring(0, lineStart) +
      prefix +
      currentText.substring(lineStart);

    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  return (
    <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white focus-within:border-[#C59B27] focus-within:ring-2 focus-within:ring-amber-500/20 transition-all shadow-xs">
      {/* Editor Header: Label + Write / Preview Switcher */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border-b border-slate-200">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <span>{label}</span>
        </label>

        <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              tab === 'write'
                ? 'bg-white text-[#0F294A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
              tab === 'preview'
                ? 'bg-white text-[#0F294A] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      {/* Formatting Toolbar (Active when tab is 'write') */}
      {tab === 'write' && (
        <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 bg-slate-100/70 border-b border-slate-200 text-slate-700 text-xs">
          <button
            type="button"
            onClick={() => insertFormat('**', '**', 'bold text')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer"
            title="Bold (**text**)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('*', '*', 'italic text')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer"
            title="Italic (*text*)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('==', '==', 'highlighted text')}
            className="p-1.5 hover:bg-amber-100 hover:text-amber-800 rounded transition cursor-pointer"
            title="Gold Highlight (==text==)"
          >
            <Highlighter className="w-4 h-4 text-[#C59B27]" />
          </button>

          <span className="w-px h-4 bg-slate-300 mx-1"></span>

          <button
            type="button"
            onClick={() => insertLinePrefix('# ')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer font-bold"
            title="Main Heading (# Heading)"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('## ')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer font-bold"
            title="Sub Heading (## Subheading)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('> ')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer"
            title="Quote / Verse Box (> verse text)"
          >
            <Quote className="w-4 h-4 text-[#C59B27]" />
          </button>

          <span className="w-px h-4 bg-slate-300 mx-1"></span>

          <button
            type="button"
            onClick={() => insertLinePrefix('- ')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer"
            title="Bullet List (- item)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('1. ')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer"
            title="Numbered List (1. item)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertLinePrefix('---\n')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer"
            title="Divider Line (---)"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-slate-300 mx-1"></span>

          <button
            type="button"
            onClick={() => insertFormat('[', '](https://example.com)', 'Link Title')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer"
            title="Insert Link [text](url)"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormat('![Image caption](', ')', 'https://images.unsplash.com/...')}
            className="p-1.5 hover:bg-white hover:text-[#0F294A] rounded transition cursor-pointer"
            title="Insert Image ![caption](url)"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-1 text-slate-400 hover:text-slate-700 transition"
              title="Formatting tips"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Formatting Help Dropdown */}
      {showHelp && (
        <div className="p-3 bg-amber-50/90 border-b border-amber-200 text-xs text-slate-800 space-y-1">
          <p className="font-bold text-[#0F294A]">💡 Formatting Shortcuts:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
            <div><code>**Bold Text**</code></div>
            <div><code>*Italic Text*</code></div>
            <div><code>==Gold Highlight==</code></div>
            <div><code># Main Heading</code></div>
            <div><code>## Sub Heading</code></div>
            <div><code>&gt; Quote / Scripture</code></div>
            <div><code>- Bullet Point</code></div>
            <div><code>[Link](https://...)</code></div>
          </div>
        </div>
      )}

      {/* Editor Body */}
      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`w-full p-4 text-xs sm:text-sm text-slate-900 focus:outline-none resize-y leading-relaxed font-sans ${
            isTelugu ? 'font-telugu leading-loose' : ''
          }`}
        />
      ) : (
        <div className="p-6 min-h-[220px] bg-slate-50/50">
          {value.trim() ? (
            <RichContentRenderer content={value} isTelugu={isTelugu} />
          ) : (
            <div className="text-slate-400 italic text-xs py-8 text-center">
              Nothing to preview yet. Switch to "Write" and enter your text.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
