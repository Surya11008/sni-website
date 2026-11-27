import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Quote,
  Undo,
  Redo,
  RemoveFormatting,
  Maximize2,
  Minimize2,
  Code,
  ChevronDown,
  Palette,
  Highlighter,
  BookOpen,
  Sparkles,
  X,
  Check,
  Lightbulb,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  CheckSquare,
} from 'lucide-react';

// ==============================================================
// TELUGU & STANDARD FONTS
// ==============================================================
const FONTS = [
  { name: 'Default', family: 'inherit', google: null },
  { name: 'శ్రీ కృష్ణదేవరాయ (Sri Krushnadevaraya)', family: 'Sri Krushnadevaraya', google: 'Sri+Krushnadevaraya' },
  { name: 'నోటో సాన్స్ (Noto Sans Telugu)', family: 'Noto Sans Telugu', google: 'Noto+Sans+Telugu:wght@400;600;700' },
  { name: 'మండలి (Mandali)', family: 'Mandali', google: 'Mandali' },
  { name: 'సురన్న (Suranna)', family: 'Suranna', google: 'Suranna' },
  { name: 'రామభద్ర (Ramabhadra)', family: 'Ramabhadra', google: 'Ramabhadra' },
  { name: 'తెనాలి రామకృష్ణ (Tenali Ramakrishna)', family: 'Tenali Ramakrishna', google: 'Tenali+Ramakrishna' },
  { name: 'గౌతమి (Gautami)', family: 'Gautami, sans-serif', google: null },
  { name: 'Sans-Serif (Modern)', family: 'Inter, system-ui, -apple-system, sans-serif', google: 'Inter:wght@400;600;700' },
  { name: 'Serif (Classic)', family: 'Georgia, Cambria, serif', google: null },
  { name: 'Monospace (Code)', family: 'ui-monospace, monospace', google: null },
];

const TEXT_COLORS = [
  { name: 'Black', value: '#0f172a' },
  { name: 'Slate Gray', value: '#475569' },
  { name: 'SNI Gold', value: '#C59B27' },
  { name: 'Navy Blue', value: '#0F294A' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Emerald Green', value: '#16a34a' },
  { name: 'Crimson Red', value: '#dc2626' },
  { name: 'Purple', value: '#9333ea' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: 'transparent' },
  { name: 'Soft Yellow', value: '#fef08a' },
  { name: 'Soft Amber', value: '#fed7aa' },
  { name: 'Soft Green', value: '#bbf7d0' },
  { name: 'Soft Blue', value: '#bfdbfe' },
  { name: 'Soft Rose', value: '#fecdd3' },
  { name: 'Soft Purple', value: '#e9d5ff' },
];

const FONT_SIZES = [
  { label: 'Small', value: '13px' },
  { label: 'Normal', value: '16px' },
  { label: 'Medium', value: '18px' },
  { label: 'Large', value: '22px' },
  { label: 'Extra Large', value: '28px' },
];

// Notion Slash Command Blocks
const SLASH_BLOCKS = [
  {
    id: 'text',
    label: 'Text',
    desc: 'Just start writing with plain text',
    icon: '📝',
    cmd: (editor) => editor.execFormatBlock('p'),
  },
  {
    id: 'h1',
    label: 'Heading 1',
    desc: 'Big section heading',
    icon: '🔤',
    cmd: (editor) => editor.execFormatBlock('h1'),
  },
  {
    id: 'h2',
    label: 'Heading 2',
    desc: 'Medium section heading',
    icon: '🔤',
    cmd: (editor) => editor.execFormatBlock('h2'),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    desc: 'Small section heading',
    icon: '🔤',
    cmd: (editor) => editor.execFormatBlock('h3'),
  },
  {
    id: 'callout',
    label: 'Callout Box',
    desc: 'Notion callout with icon and colored background',
    icon: '💡',
    cmd: (editor) => editor.insertCallout(),
  },
  {
    id: 'quote',
    label: 'Scripture Quote',
    desc: 'Bible verse or spiritual quote block with gold accent',
    icon: '📖',
    cmd: (editor) => editor.insertScriptureQuote(),
  },
  {
    id: 'bullet',
    label: 'Bulleted List',
    desc: 'Create a simple bulleted list',
    icon: '⏺️',
    cmd: (editor) => editor.execCmd('insertUnorderedList'),
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    desc: 'Create a numbered list (1, 2, 3...)',
    icon: '🔢',
    cmd: (editor) => editor.execCmd('insertOrderedList'),
  },
  {
    id: 'table',
    label: 'Table',
    desc: 'Insert a clean 3x3 table with headers',
    icon: '📊',
    cmd: (editor) => editor.insertTable(),
  },
  {
    id: 'divider',
    label: 'Divider',
    desc: 'Visually divide sections with a clean line',
    icon: '➖',
    cmd: (editor) => editor.insertDivider(),
  },
  {
    id: 'image',
    label: 'Image',
    desc: 'Embed an image with a web URL',
    icon: '🖼️',
    cmd: (editor) => editor.openImageModal(),
  },
  {
    id: 'link',
    label: 'Web Link',
    desc: 'Insert a hyperlink to an article or site',
    icon: '🔗',
    cmd: (editor) => editor.openLinkModal(),
  },
];

function loadGoogleFont(query) {
  if (!query || typeof document === 'undefined') return;
  const id = `gfont-${query.replace(/[^a-zA-Z0-9]/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
  document.head.appendChild(link);
}

export default function RichTextEditor({
  value = '',
  onChange,
  label = 'Content',
  placeholder = "Type '/' for Notion blocks or start writing...",
  rows = 12,
  isNotionStyle = true,
}) {
  const editorRef = useRef(null);

  // States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [htmlSource, setHtmlSource] = useState('');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [selectedFontSize, setSelectedFontSize] = useState('16px');
  const [selectedStyle, setSelectedStyle] = useState('p');

  // Popovers
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  // Active state indicators
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);

  // Notion Floating Selection Bubble
  const [bubbleToolbar, setBubbleToolbar] = useState({ visible: false, x: 0, y: 0 });

  // Notion Slash Command Menu
  const [slashMenu, setSlashMenu] = useState({
    visible: false,
    query: '',
    selectedIndex: 0,
    x: 0,
    y: 0,
  });

  // Modals
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [savedSelectionRange, setSavedSelectionRange] = useState(null);

  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Preload essential fonts
  useEffect(() => {
    FONTS.forEach((f) => {
      if (f.google) loadGoogleFont(f.google);
    });
  }, []);

  // Sync incoming value to editor contentEditable
  useEffect(() => {
    if (!editorRef.current || showHtmlSource) return;

    if (editorRef.current.innerHTML !== value) {
      if (value && !/<[a-z][\s\S]*>/i.test(value)) {
        // Plain text: convert to paragraphs
        const paragraphs = value
          .split('\n\n')
          .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
          .join('');
        editorRef.current.innerHTML = paragraphs;
      } else {
        editorRef.current.innerHTML = value || '';
      }
    }
    updateStats();
  }, [value, showHtmlSource]);

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.editor-dropdown-container') && !e.target.closest('.editor-floating-bubble')) {
        setShowStyleMenu(false);
        setShowFontMenu(false);
        setShowFontSizeMenu(false);
        setShowTextColorMenu(false);
        setShowHighlightMenu(false);
      }
      if (!e.target.closest('.notion-slash-menu')) {
        setSlashMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const updateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  const updateActiveFormatting = useCallback(() => {
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      setIsStrikethrough(document.queryCommandState('strikeThrough'));
      setIsBulletList(document.queryCommandState('insertUnorderedList'));
      setIsNumberedList(document.queryCommandState('insertOrderedList'));
    } catch {}

    // Check Selection for Floating Bubble
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.toString().trim().length > 0 && editorRef.current) {
      try {
        const range = sel.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();
          setBubbleToolbar({
            visible: true,
            x: Math.max(20, Math.min(window.innerWidth - 300, rect.left + rect.width / 2)),
            y: rect.top - 46,
          });
          return;
        }
      } catch {}
    }
    setBubbleToolbar({ visible: false, x: 0, y: 0 });
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      if (onChange) onChange(html);
      updateStats();
      updateActiveFormatting();
    }
  };

  const execCmd = (cmd, val = null) => {
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch {}
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Block format
  const execFormatBlock = (tag) => {
    setSelectedStyle(tag);
    setShowStyleMenu(false);
    execCmd('formatBlock', tag);
  };

  // Font family
  const handleSelectFont = (font) => {
    setSelectedFont(font);
    setShowFontMenu(false);
    if (font.google) loadGoogleFont(font.google);
    execCmd('fontName', font.family);
  };

  // Font size
  const handleSelectFontSize = (size) => {
    setSelectedFontSize(size);
    setShowFontSizeMenu(false);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const span = document.createElement('span');
      span.style.fontSize = size;
      const range = selection.getRangeAt(0);
      try {
        range.surroundContents(span);
      } catch {
        execCmd('fontSize', '3');
      }
      handleInput();
    }
  };

  // Notion Callout Block
  const insertCallout = () => {
    const calloutHtml = `
      <div class="notion-callout" style="display: flex; gap: 12px; align-items: flex-start; background: #fffdf0; border: 1px solid #fef08a; border-radius: 14px; padding: 14px 18px; margin: 16px 0; box-shadow: 0 1px 3px rgba(234, 179, 8, 0.08);">
        <span style="font-size: 1.4rem; line-height: 1; user-select: none;">💡</span>
        <div style="flex: 1; color: #713f12; font-weight: 500;">
          <p style="margin: 0; font-size: 1em;">ముఖ్యమైన సమాచారం లేదా గమనికను ఇక్కడ రాయండి...</p>
        </div>
      </div>
      <p><br/></p>
    `;
    execCmd('insertHTML', calloutHtml);
  };

  // Scripture Quote Block
  const insertScriptureQuote = () => {
    const quoteHtml = `
      <blockquote style="border-left: 4px solid #C59B27; background: #fffdf5; padding: 14px 18px; margin: 16px 0; border-radius: 0 12px 12px 0; font-style: italic; color: #1e293b; box-shadow: 0 1px 3px rgba(197, 155, 39, 0.08);">
        <p style="margin: 0; font-size: 1.05em; font-weight: 500;">“రాయండి లేదా బైబిల్ వాక్యాన్ని ఇక్కడ పేస్ట్ చేయండి...”</p>
      </blockquote>
      <p><br/></p>
    `;
    execCmd('insertHTML', quoteHtml);
  };

  // Clean Table
  const insertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14.5px;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 700; text-align: left; color: #0F294A;">శీర్షిక 1</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 700; text-align: left; color: #0F294A;">శీర్షిక 2</th>
            <th style="border: 1px solid #cbd5e1; padding: 10px 14px; font-weight: 700; text-align: left; color: #0F294A;">శీర్షిక 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px;">వివరణ 1</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px;">వివరణ 2</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px;">వివరణ 3</td>
          </tr>
          <tr style="background: #fbfcfe;">
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px;">వివరణ 4</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px;">వివరణ 5</td>
            <td style="border: 1px solid #e2e8f0; padding: 10px 14px;">వివరణ 6</td>
          </tr>
        </tbody>
      </table>
      <p><br/></p>
    `;
    execCmd('insertHTML', tableHtml);
  };

  // Horizontal Rule
  const insertDivider = () => {
    execCmd('insertHTML', '<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" /><p><br/></p>');
  };

  // Link Dialog
  const openLinkModal = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedSelectionRange(sel.getRangeAt(0));
      setLinkText(sel.toString());
    } else {
      setSavedSelectionRange(null);
      setLinkText('');
    }
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const applyLink = (e) => {
    e.preventDefault();
    if (!linkUrl) return;

    if (savedSelectionRange) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRange);
    }

    const textToDisplay = linkText || linkUrl;
    const finalUrl = linkUrl.startsWith('http://') || linkUrl.startsWith('https://') || linkUrl.startsWith('/')
      ? linkUrl
      : `https://${linkUrl}`;
    const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" style="color: #C59B27; font-weight: 600; text-decoration: underline;">${textToDisplay}</a>`;

    execCmd('insertHTML', linkHtml);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const openImageModal = () => {
    setShowImageModal(true);
  };

  const applyImage = (e) => {
    e.preventDefault();
    if (!imageUrl) return;
    const imgHtml = `<p><img src="${imageUrl}" alt="${imageAlt || 'Article Image'}" style="max-width: 100%; height: auto; border-radius: 12px; margin: 16px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);" /></p><p><br/></p>`;
    execCmd('insertHTML', imgHtml);
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
  };

  // Filtered Slash Blocks
  const filteredBlocks = SLASH_BLOCKS.filter(
    (b) =>
      b.label.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
      b.desc.toLowerCase().includes(slashMenu.query.toLowerCase()) ||
      b.id.toLowerCase().includes(slashMenu.query.toLowerCase())
  );

  const executeSlashBlock = (block) => {
    setSlashMenu({ visible: false, query: '', selectedIndex: 0, x: 0, y: 0 });

    // Remove the typed slash text
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node && node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const slashIdx = text.lastIndexOf('/');
        if (slashIdx !== -1) {
          node.textContent = text.slice(0, slashIdx);
        }
      }
    }

    const editorActions = {
      execFormatBlock,
      insertCallout,
      insertScriptureQuote,
      execCmd,
      insertTable,
      insertDivider,
      openImageModal,
      openLinkModal,
    };
    block.cmd(editorActions);
  };

  // Keyboard navigation & Slash Command detection
  const handleKeyDown = (e) => {
    // If Slash Menu is visible
    if (slashMenu.visible) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenu((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex + 1) % Math.max(1, filteredBlocks.length),
        }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenu((prev) => ({
          ...prev,
          selectedIndex: (prev.selectedIndex - 1 + filteredBlocks.length) % Math.max(1, filteredBlocks.length),
        }));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredBlocks.length > 0) {
          executeSlashBlock(filteredBlocks[slashMenu.selectedIndex] || filteredBlocks[0]);
        }
        return;
      }
      if (e.key === 'Escape') {
        setSlashMenu((prev) => ({ ...prev, visible: false }));
        return;
      }
    }

    // Standard hotkeys (Ctrl+B, Ctrl+I, Ctrl+U, Ctrl+K)
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        execCmd('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        execCmd('italic');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        execCmd('underline');
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        openLinkModal();
      }
    }
  };

  const handleKeyUp = (e) => {
    updateActiveFormatting();

    // Check if user pressed '/' to open Notion Slash Menu
    if (e.key === '/') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSlashMenu({
          visible: true,
          query: '',
          selectedIndex: 0,
          x: Math.min(window.innerWidth - 320, Math.max(20, rect.left)),
          y: rect.bottom + 8,
        });
      }
    } else if (slashMenu.visible) {
      // Update query after slash
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.getRangeAt(0).startContainer;
        if (node && node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          const slashIdx = text.lastIndexOf('/');
          if (slashIdx !== -1) {
            const query = text.slice(slashIdx + 1).trim();
            setSlashMenu((prev) => ({ ...prev, query, selectedIndex: 0 }));
          } else {
            setSlashMenu((prev) => ({ ...prev, visible: false }));
          }
        }
      }
    }
  };

  // HTML Source toggle
  const toggleHtmlSource = () => {
    if (showHtmlSource) {
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlSource;
      }
      if (onChange) onChange(htmlSource);
      setShowHtmlSource(false);
    } else {
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : value;
      setHtmlSource(currentHtml);
      setShowHtmlSource(true);
    }
  };

  const minHeightPx = Math.max(260, (rows || 10) * 28);

  return (
    <div
      className={`transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 flex flex-col justify-center items-center'
          : 'relative w-full'
      }`}
    >
      <div
        className={`w-full bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden flex flex-col transition focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-[#C59B27] ${
          isFullscreen ? 'h-full max-w-6xl shadow-2xl' : ''
        }`}
      >
        {/* ============================================================== */}
        {/* 1. TOP BAR: NOTION MINIMAL HEADER & UTILITIES                  */}
        {/* ============================================================== */}
        <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-xs sm:text-sm">{label}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80">
              <Sparkles className="w-3 h-3 text-[#C59B27]" />
              Notion Writing Canvas
            </span>
            <span className="hidden md:inline text-[11px] text-slate-400">
              (Type <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-700">/</code> for blocks)
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Undo */}
            <button
              type="button"
              onClick={() => execCmd('undo')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={() => execCmd('redo')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-slate-300 mx-1" />

            {/* HTML Source Toggle */}
            <button
              type="button"
              onClick={toggleHtmlSource}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer text-[11px] ${
                showHtmlSource
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Toggle HTML Source View"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{showHtmlSource ? 'Visual Mode' : 'HTML Code'}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Notion Mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. SLICK INTEGRATED TOOLBAR                                    */}
        {/* ============================================================== */}
        {!showHtmlSource && (
          <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center gap-1 flex-wrap text-slate-700 text-xs editor-dropdown-container">
            {/* Style Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowStyleMenu(!showStyleMenu);
                  setShowFontMenu(false);
                  setShowFontSizeMenu(false);
                  setShowTextColorMenu(false);
                  setShowHighlightMenu(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 font-medium transition cursor-pointer text-slate-700"
                title="Heading / Paragraph Block"
              >
                <span>
                  {selectedStyle === 'h1'
                    ? 'Heading 1'
                    : selectedStyle === 'h2'
                    ? 'Heading 2'
                    : selectedStyle === 'h3'
                    ? 'Heading 3'
                    : selectedStyle === 'blockquote'
                    ? 'Scripture Quote'
                    : 'Text'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showStyleMenu && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => execFormatBlock('p')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-normal"
                  >
                    📝 Text (Paragraph)
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormatBlock('h1')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-sm font-bold text-slate-900"
                  >
                    🔤 Heading 1 (Large)
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormatBlock('h2')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-bold text-slate-800"
                  >
                    🔤 Heading 2 (Medium)
                  </button>
                  <button
                    type="button"
                    onClick={() => execFormatBlock('h3')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                  >
                    🔤 Heading 3 (Small)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      insertCallout();
                      setShowStyleMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50/60 text-xs font-medium text-amber-800 border-t border-slate-100"
                  >
                    💡 Notion Callout Box
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      insertScriptureQuote();
                      setShowStyleMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50/60 text-xs italic text-amber-900"
                  >
                    📖 Scripture / Bible Quote
                  </button>
                </div>
              )}
            </div>

            {/* Font Family Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowFontMenu(!showFontMenu);
                  setShowStyleMenu(false);
                  setShowFontSizeMenu(false);
                  setShowTextColorMenu(false);
                  setShowHighlightMenu(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 font-medium transition cursor-pointer text-slate-700 max-w-[150px] truncate"
                title="Telugu & Latin Fonts"
              >
                <span className="truncate">{selectedFont.name.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showFontMenu && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Telugu & Latin Fonts
                  </div>
                  {FONTS.map((font) => (
                    <button
                      key={font.name}
                      type="button"
                      onClick={() => handleSelectFont(font)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-amber-50/70 text-xs flex items-center justify-between ${
                        selectedFont.name === font.name ? 'font-bold text-[#C59B27] bg-amber-50/40' : 'text-slate-700'
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      <span className="truncate">{font.name}</span>
                      {selectedFont.name === font.name && <Check className="w-3.5 h-3.5 text-[#C59B27]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

            {/* BOLD */}
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className={`p-1.5 rounded-lg transition cursor-pointer font-bold ${
                isBold ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* ITALIC */}
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isItalic ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* UNDERLINE */}
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isUnderline ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>

            {/* STRIKETHROUGH */}
            <button
              type="button"
              onClick={() => execCmd('strikeThrough')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isStrikethrough ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

            {/* TEXT COLOR */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowTextColorMenu(!showTextColorMenu);
                  setShowHighlightMenu(false);
                  setShowStyleMenu(false);
                  setShowFontMenu(false);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer text-slate-700"
                title="Text Color"
              >
                <Palette className="w-4 h-4 text-slate-700" />
              </button>

              {showTextColorMenu && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Text Color</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          execCmd('foreColor', c.value);
                          setShowTextColorMenu(false);
                        }}
                        className="w-7 h-7 rounded-lg border border-slate-300 transition hover:scale-110 flex items-center justify-center cursor-pointer"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* HIGHLIGHT COLOR */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowHighlightMenu(!showHighlightMenu);
                  setShowTextColorMenu(false);
                  setShowStyleMenu(false);
                  setShowFontMenu(false);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer text-slate-700"
                title="Highlight Background"
              >
                <Highlighter className="w-4 h-4 text-amber-600" />
              </button>

              {showHighlightMenu && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Highlight Color</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          execCmd('hiliteColor', c.value);
                          setShowHighlightMenu(false);
                        }}
                        className="w-7 h-7 rounded-lg border border-slate-300 transition hover:scale-110 flex items-center justify-center cursor-pointer text-[10px] font-bold text-slate-600"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      >
                        {c.value === 'transparent' ? '✕' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

            {/* LISTS */}
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isBulletList ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Bulleted List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isNumberedList ? 'bg-amber-100 text-amber-900' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

            {/* NOTION CALLOUT BUTTON */}
            <button
              type="button"
              onClick={insertCallout}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-amber-50 text-amber-900 font-medium transition cursor-pointer text-xs"
              title="Insert Notion Callout Box"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Callout</span>
            </button>

            {/* SCRIPTURE QUOTE BUTTON */}
            <button
              type="button"
              onClick={insertScriptureQuote}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50/80 hover:bg-amber-100 text-amber-900 font-semibold border border-amber-200/80 transition cursor-pointer text-xs"
              title="Insert Scripture Verse / Quote Box"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>వాక్యం</span>
            </button>

            {/* INSERTS: LINK, IMAGE, TABLE, HR */}
            <button
              type="button"
              onClick={openLinkModal}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Insert Link (Ctrl+K)"
            >
              <LinkIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={openImageModal}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={insertTable}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Insert Table"
            >
              <TableIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={insertDivider}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Insert Divider Line"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

            {/* CLEAR FORMATTING */}
            <button
              type="button"
              onClick={() => execCmd('removeFormat')}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Clear Formatting"
            >
              <RemoveFormatting className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* 3. WRITING CANVAS OR HTML SOURCE VIEW                          */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-8" style={{ minHeight: `${minHeightPx}px` }}>
          {showHtmlSource ? (
            <textarea
              value={htmlSource}
              onChange={(e) => {
                setHtmlSource(e.target.value);
                if (onChange) onChange(e.target.value);
              }}
              className="w-full h-full min-h-[300px] p-4 font-mono text-xs sm:text-sm bg-slate-900 text-emerald-400 rounded-xl focus:outline-none resize-y border border-slate-700 leading-relaxed"
              placeholder="<!-- Write or paste clean HTML code here -->"
              spellCheck="false"
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onKeyUp={handleKeyUp}
              onMouseUp={updateActiveFormatting}
              onKeyDown={handleKeyDown}
              data-placeholder={placeholder}
              className="rich-html-content outline-none text-slate-800 text-base sm:text-lg leading-relaxed selection:bg-amber-200/80 min-h-full max-w-4xl mx-auto"
              style={{
                minHeight: `${minHeightPx - 60}px`,
                fontFamily: selectedFont.family !== 'inherit' ? selectedFont.family : undefined,
              }}
              spellCheck="true"
            />
          )}
        </div>

        {/* ============================================================== */}
        {/* 4. FOOTER STATUS BAR                                           */}
        {/* ============================================================== */}
        <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-slate-700 font-bold">{wordCount}</strong> words
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-700 font-bold">{charCount}</strong> characters
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              ~{Math.max(1, Math.ceil(wordCount / 200))} min read
            </span>
          </div>

          <div className="flex items-center gap-2 text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. NOTION FLOATING SELECTION BUBBLE TOOLBAR                    */}
      {/* ============================================================== */}
      {bubbleToolbar.visible && (
        <div
          className="fixed z-50 editor-floating-bubble -translate-x-1/2 flex items-center gap-0.5 bg-[#0f172a] text-white px-2 py-1.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-100"
          style={{ left: `${bubbleToolbar.x}px`, top: `${bubbleToolbar.y}px` }}
        >
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className={`p-1.5 rounded-lg hover:bg-slate-800 transition ${isBold ? 'text-[#C59B27] font-bold' : 'text-white'}`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className={`p-1.5 rounded-lg hover:bg-slate-800 transition ${isItalic ? 'text-[#C59B27]' : 'text-white'}`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className={`p-1.5 rounded-lg hover:bg-slate-800 transition ${isUnderline ? 'text-[#C59B27]' : 'text-white'}`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className={`p-1.5 rounded-lg hover:bg-slate-800 transition ${isStrikethrough ? 'text-[#C59B27]' : 'text-white'}`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={openLinkModal}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-white transition"
            title="Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={insertScriptureQuote}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 transition"
            title="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={insertCallout}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-yellow-300 transition"
            title="Notion Callout"
          >
            <Lightbulb className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. NOTION SLASH COMMAND (/) MENU                               */}
      {/* ============================================================== */}
      {slashMenu.visible && (
        <div
          className="fixed z-50 notion-slash-menu w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto"
          style={{ left: `${slashMenu.x}px`, top: `${slashMenu.y}px` }}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between border-b border-slate-100">
            <span>Basic Notion Blocks</span>
            <span className="font-mono text-slate-400">Esc to close</span>
          </div>

          <div className="py-1">
            {filteredBlocks.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">No blocks match your search</div>
            ) : (
              filteredBlocks.map((block, idx) => {
                const isSelected = idx === slashMenu.selectedIndex;
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => executeSlashBlock(block)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected ? 'bg-amber-50 text-[#071B3B]' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-sm shrink-0">
                      {block.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-none mb-1">{block.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{block.desc}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. LINK MODAL                                                  */}
      {/* ============================================================== */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#C59B27]" />
                Insert Hyperlink
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={applyLink} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Web URL *</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-[#C59B27]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Text (Optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-[#C59B27]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#C59B27] hover:bg-amber-600 text-white shadow-xs transition cursor-pointer"
                >
                  Insert Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. IMAGE MODAL                                                 */}
      {/* ============================================================== */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#C59B27]" />
                Insert Image
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={applyImage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL *</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-[#C59B27]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Image Description (Alt Text)</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Photo caption or description..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-[#C59B27]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#C59B27] hover:bg-amber-600 text-white shadow-xs transition cursor-pointer"
                >
                  Insert Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
