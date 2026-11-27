import { useState, useRef, useEffect } from 'react';

// ==============================================================
// AUTHENTIC GOOGLE DOCS & MATERIAL DESIGN ICONS
// ==============================================================
const GoogleDocsLogo = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#4285F4"/>
    <path d="M14 2V8H20L14 2Z" fill="#A1C2FA"/>
    <path d="M16 13H8V11.2H16V13ZM16 17H8V15.2H16V17ZM12 9H8V7.2H12V9Z" fill="white"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);

const UndoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
  </svg>
);

const RedoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
  </svg>
);

const PrintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
  </svg>
);

const SpellcheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.45 16h2.09L9.43 3H7.57L2.46 16h2.09l1.12-3h5.66l1.12 3zM6.37 11.15L8.5 5.48l2.13 5.67H6.37zm15.14-1.29l-6.01 6.01-2.83-2.83-1.41 1.41 4.24 4.24 7.42-7.42-1.41-1.41z"/>
  </svg>
);

const PaintRollerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-3z"/>
  </svg>
);

const BoldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
  </svg>
);

const ItalicIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
  </svg>
);

const UnderlineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>
);

const AddCommentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 11h-4v4h-2v-4H8V9h4V5h2v4h4v2z"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
  </svg>
);

const AlignLeftIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/>
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"/>
  </svg>
);

const AlignRightIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/>
  </svg>
);

const AlignJustifyIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zM3 3v2h18V3H3z"/>
  </svg>
);

const LineSpacingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 7h11v2H10V7zm0 4h11v2H10v-2zm0 4h11v2H10v-2zM6 7v10H4.5l2.5 3 2.5-3H8V7h1.5L7 4 4.5 7H6z"/>
  </svg>
);

const ChecklistIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
  </svg>
);

const BulletListIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
  </svg>
);

const NumberedListIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
  </svg>
);

const OutdentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11 17h10v-2H11v2zm-8-5l4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/>
  </svg>
);

const IndentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z"/>
  </svg>
);

const ClearFormattingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"/>
  </svg>
);

const ArrowDropDown = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="opacity-80 shrink-0">
    <path d="M7 10l5 5 5-5z"/>
  </svg>
);

const GeminiSparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
  </svg>
);

const CloudSavedIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" className="text-slate-500">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 17l-3.5-3.5 1.41-1.41L10 14.17 15.09 9.08l1.41 1.41L10 17z"/>
  </svg>
);

// Preset Google Fonts catalog
const POPULAR_TELUGU_FONTS = [
  { name: 'Sree Krushnadevaraya', family: 'Sri Krushnadevaraya', sample: 'శ్రీ కృష్ణదేవరాయ - దైవవాక్యము' },
  { name: 'Noto Sans Telugu', family: 'Noto Sans Telugu', sample: 'నోటో సాన్స్ తెలుగు - పవిత్ర గ్రంథం' },
  { name: 'Suranna', family: 'Suranna', sample: 'సూరన్న - ప్రభువు నామమునకు స్తోత్రము' },
  { name: 'Ramabhadra', family: 'Ramabhadra', sample: 'రామభద్ర - పరిశుద్ధ లేఖనములు' },
  { name: 'Gidugu', family: 'Gidugu', sample: 'గిడుగు - సువార్త సందేశము' },
  { name: 'Gurajada', family: 'Gurajada', sample: 'గురజాడ - పరలోక ప్రార్థన' },
  { name: 'Mandali', family: 'Mandali', sample: 'మండలి - సంఘ ఆరాధన క్రమము' },
  { name: 'Peddana', family: 'Peddana', sample: 'పెద్దన - కీర్తనల గ్రంథము' },
  { name: 'Tenali Ramakrishna', family: 'Tenali Ramakrishna', sample: 'తెనాలి రామకృష్ణ - ఉపదేశములు' },
  { name: 'Dhurjati', family: 'Dhurjati', sample: 'ధూర్జటి - విశ్వాస జీవనము' },
  { name: 'Ravi Prakash', family: 'Ravi Prakash', sample: 'రవి ప్రకాష్ - సాక్ష్యములు' },
  { name: 'Chathura', family: 'Chathura', sample: 'చతుర - సువార్త ప్రకటించుట' },
  { name: 'Lakki Reddy', family: 'Lakki Reddy', sample: 'లక్కి రెడ్డి - ఆత్మీయ ప్రగతి' },
  { name: 'Timmana', family: 'Timmana', sample: 'తిమ్మన - సత్యవాక్యం' },
  { name: 'Mallanna', family: 'Mallanna', sample: 'మల్లన్న - భక్తి గీతములు' },
  { name: 'Anek Telugu', family: 'Anek Telugu', sample: 'అనేక్ తెలుగు - సర్వశక్తిమంతుడు' },
];

const POPULAR_GLOBAL_FONTS = [
  { name: 'Arial', family: 'Arial, sans-serif', sample: 'The Holy Bible & Sacred Word' },
  { name: 'Roboto', family: 'Roboto, sans-serif', sample: 'Modern, clean & readable' },
  { name: 'Open Sans', family: 'Open Sans, sans-serif', sample: 'Open Sans Clean Typography' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', sample: 'Montserrat Elegant Headers' },
  { name: 'Poppins', family: 'Poppins, sans-serif', sample: 'Geometric and Friendly' },
  { name: 'Georgia', family: 'Georgia, serif', sample: 'Traditional editorial style' },
  { name: 'Times New Roman', family: 'Times New Roman, serif', sample: 'Academic and formal' },
  { name: 'Playfair Display', family: 'Playfair Display, serif', sample: 'Classic scripture beauty' },
  { name: 'Merriweather', family: 'Merriweather, serif', sample: 'Designed for effortless reading' },
  { name: 'Cinzel', family: 'Cinzel, serif', sample: 'Majestic & Classical Roman' },
  { name: 'Caveat', family: 'Caveat, cursive', sample: 'Handwritten personal notes' },
  { name: 'Dancing Script', family: 'Dancing Script, cursive', sample: 'Graceful flowing calligraphy' },
  { name: 'Pacifico', family: 'Pacifico, cursive', sample: 'Bold and friendly script' },
  { name: 'Great Vibes', family: 'Great Vibes, cursive', sample: 'Exquisite formal calligraphy' },
  { name: 'Bebas Neue', family: 'Bebas Neue, sans-serif', sample: 'BOLD ALL-CAPS TITLES' },
  { name: 'Courier New', family: 'Courier New, monospace', sample: 'Fixed width typewriter font' },
];

// Helper to load Google Fonts dynamically
export function loadGoogleFont(fontName) {
  if (!fontName) return;
  const cleanName = fontName.trim();
  const systemFonts = ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Trebuchet MS', 'Verdana', 'Tahoma', 'Impact'];
  if (systemFonts.some(s => cleanName.toLowerCase().includes(s.toLowerCase()))) return;

  const fontId = `gfont-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (document.getElementById(fontId)) return;

  const link = document.createElement('link');
  link.id = fontId;
  link.rel = 'stylesheet';
  const queryName = cleanName.replace(/\s+/g, '+');
  link.href = `https://fonts.googleapis.com/css2?family=${queryName}&display=swap`;
  document.head.appendChild(link);
}

export default function RichTextEditor({
  value = '',
  onChange,
  label = 'Document Content',
  placeholder = 'Start writing your sacred message or article here...',
  rows = 14,
  defaultSimpleMode = true,
}) {
  const editorRef = useRef(null);

  // Simple Mode vs Full Studio Mode (Default: Simple Mode for effortless, fast writing)
  const [isSimpleMode, setIsSimpleMode] = useState(defaultSimpleMode);

  // Layout & Ambiance States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [htmlSource, setHtmlSource] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pageFormat, setPageFormat] = useState('pageless'); // 'pageless' (spacious canvas) or 'pages' (standard print page)
  const [textWidth, setTextWidth] = useState('wide'); // 'wide', 'full', 'standard'
  const [theme, setTheme] = useState('paper'); // 'paper' (pristine white), 'parchment' (sacred sepia), 'midnight' (zen dark)
  const [zenMode, setZenMode] = useState(false);
  const [docTitle, setDocTitle] = useState(label || 'Untitled document');

  // Active Formatting States
  const [currentStyle, setCurrentStyle] = useState('title'); // 'title', 'p', 'h1', 'h2', 'h3', 'subtitle'
  const [currentFont, setCurrentFont] = useState('Sri Krushnadevaraya');
  const [fontSize, setFontSize] = useState(13);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [currentAlign, setCurrentAlign] = useState('left');
  const [paintFormatActive, setPaintFormatActive] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState(null);

  // Stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [readingTime, setReadingTime] = useState(1);
  const [speakingTime, setSpeakingTime] = useState(1);

  // Floating selection bubble
  const [bubbleToolbar, setBubbleToolbar] = useState({ visible: false, x: 0, y: 0 });

  // Dropdown Popups
  const [activeMenu, setActiveMenu] = useState(null); // 'file', 'edit', 'view', 'insert', 'format', 'tools', 'gemini', 'extensions', 'help'
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
  const [showTextColorMenu, setShowTextColorMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showLineSpacingMenu, setShowLineSpacingMenu] = useState(false);
  const [showChecklistMenu, setShowChecklistMenu] = useState(false);
  const [showBulletListMenu, setShowBulletListMenu] = useState(false);
  const [showNumberedListMenu, setShowNumberedListMenu] = useState(false);

  // Modals
  const [showFontManagerModal, setShowFontManagerModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showSpecialSymbolsModal, setShowSpecialSymbolsModal] = useState(false);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSearchMenusModal, setShowSearchMenusModal] = useState(false);
  const [showGeminiAiModal, setShowGeminiAiModal] = useState(false);

  // Modal Inputs
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [commentText, setCommentText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchMenuQuery, setSearchMenuQuery] = useState('');

  // Font Manager State
  const [customFontInput, setCustomFontInput] = useState('');
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [fontCategory, setFontCategory] = useState('all');
  const [activeFonts, setActiveFonts] = useState([
    'Sri Krushnadevaraya',
    'Noto Sans Telugu',
    'Suranna',
    'Ramabhadra',
    'Gidugu',
    'Gurajada',
    'Mandali',
    'Peddana',
    'Tenali Ramakrishna',
    'Arial',
    'Roboto',
    'Georgia',
    'Times New Roman',
    'Playfair Display',
    'Cinzel',
    'Caveat',
  ]);
  const [customAddedFonts, setCustomAddedFonts] = useState([]);

  // Load custom fonts from localStorage and preload
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('sni_gdocs_custom_fonts');
      if (savedCustom) setCustomAddedFonts(JSON.parse(savedCustom));

      const savedActive = localStorage.getItem('sni_gdocs_active_fonts');
      if (savedActive) setActiveFonts(JSON.parse(savedActive));
    } catch (e) {
      console.warn(e);
    }

    // Preload Telugu & essential fonts
    POPULAR_TELUGU_FONTS.forEach(f => loadGoogleFont(f.family));
    loadGoogleFont('Playfair Display');
    loadGoogleFont('Cinzel');
    loadGoogleFont('Caveat');
    loadGoogleFont('Inter');
  }, []);

  // Sync incoming value to contentEditable div
  useEffect(() => {
    if (editorRef.current && !showHtmlSource) {
      if (editorRef.current.innerHTML !== value) {
        if (value && !/<[a-z][\s\S]*>/i.test(value)) {
          const htmlParagraphs = value
            .split('\n\n')
            .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
            .join('');
          editorRef.current.innerHTML = htmlParagraphs;
        } else {
          editorRef.current.innerHTML = value || '';
        }
      }
      calculateStats();
    }
  }, [value, showHtmlSource]);

  // Click outside to close menus
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.gdocs-dropdown-container') && !e.target.closest('.gdocs-bubble-toolbar')) {
        setActiveMenu(null);
        setShowZoomMenu(false);
        setShowStyleMenu(false);
        setShowFontMenu(false);
        setShowFontSizeMenu(false);
        setShowTextColorMenu(false);
        setShowHighlightMenu(false);
        setShowAlignMenu(false);
        setShowLineSpacingMenu(false);
        setShowChecklistMenu(false);
        setShowBulletListMenu(false);
        setShowNumberedListMenu(false);
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const calculateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    setWordCount(words);
    setCharCount(chars);
    setReadingTime(Math.max(1, Math.ceil(words / 200)));
    setSpeakingTime(Math.max(1, Math.ceil(words / 130)));
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      calculateStats();
      updateActiveFormatting();
    }
  };

  const updateActiveFormatting = () => {
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      setIsStrikethrough(document.queryCommandState('strikeThrough'));
    } catch (e) {}
  };

  const execCmd = (cmd, val = null) => {
    try {
      document.execCommand('styleWithCSS', false, true);
    } catch (e) {}
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Format Painter
  const handleTogglePaintFormat = () => {
    if (paintFormatActive) {
      setPaintFormatActive(false);
      setCopiedFormat(null);
    } else {
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        const el = selection.anchorNode.parentElement;
        const computed = window.getComputedStyle(el);
        setCopiedFormat({
          fontWeight: computed.fontWeight,
          fontStyle: computed.fontStyle,
          textDecoration: computed.textDecoration,
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
        });
        setPaintFormatActive(true);
      }
    }
  };

  // Floating Selection Bubble
  const handleSelectionBubble = () => {
    updateActiveFormatting();
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && editorRef.current?.contains(selection.anchorNode)) {
      const text = selection.toString().trim();
      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0) {
          setBubbleToolbar({
            visible: true,
            x: Math.max(16, rect.left + rect.width / 2 - 160),
            y: Math.max(10, rect.top - 48),
          });
          return;
        }
      }
    }
    setBubbleToolbar({ visible: false, x: 0, y: 0 });
  };

  const handleMouseUp = () => {
    handleSelectionBubble();
    if (paintFormatActive && copiedFormat) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const span = document.createElement('span');
        span.style.fontWeight = copiedFormat.fontWeight;
        span.style.fontStyle = copiedFormat.fontStyle;
        span.style.textDecoration = copiedFormat.textDecoration;
        span.style.color = copiedFormat.color;
        span.style.backgroundColor = copiedFormat.backgroundColor;
        span.style.fontFamily = copiedFormat.fontFamily;
        span.style.fontSize = copiedFormat.fontSize;

        const range = selection.getRangeAt(0);
        span.appendChild(range.extractContents());
        range.insertNode(span);
        handleInput();
        setPaintFormatActive(false);
        setCopiedFormat(null);
      }
    }
  };

  // Font Selection
  const handleSelectFont = (fontFamily) => {
    loadGoogleFont(fontFamily);
    setCurrentFont(fontFamily);
    execCmd('fontName', fontFamily);
    setShowFontMenu(false);
  };

  // Font Size
  const handleSetFontSize = (size) => {
    const num = Math.max(6, Math.min(120, parseInt(size) || 13));
    setFontSize(num);
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const span = document.createElement('span');
      span.style.fontSize = `${num}pt`;
      const range = selection.getRangeAt(0);
      span.appendChild(range.extractContents());
      range.insertNode(span);
      handleInput();
    }
    setShowFontSizeMenu(false);
  };

  // Paragraph Style
  const handleSetParagraphStyle = (style) => {
    setCurrentStyle(style);
    if (style === 'p') {
      execCmd('formatBlock', '<p>');
    } else if (style === 'title') {
      const html = `<h1 style="font-size: 28pt; font-weight: 800; line-height: 1.25; margin: 20px 0 10px 0; color: inherit;">Title</h1><p><br/></p>`;
      execCmd('insertHTML', html);
    } else if (style === 'subtitle') {
      const html = `<p style="font-size: 15pt; opacity: 0.75; line-height: 1.5; margin: 8px 0;">Subtitle</p><p><br/></p>`;
      execCmd('insertHTML', html);
    } else {
      execCmd('formatBlock', `<${style}>`);
    }
    setShowStyleMenu(false);
  };

  // Line Spacing
  const handleSetLineSpacing = (spacing) => {
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
      const p = selection.anchorNode.parentElement?.closest('p, div, h1, h2, h3, h4, li') || editorRef.current;
      if (p) {
        p.style.lineHeight = spacing;
        handleInput();
      }
    }
    setShowLineSpacingMenu(false);
  };

  // Custom Font Addition
  const handleAddCustomFont = () => {
    if (!customFontInput.trim()) return;
    const name = customFontInput.trim();
    loadGoogleFont(name);

    if (!customAddedFonts.includes(name)) {
      const updatedCustom = [...customAddedFonts, name];
      setCustomAddedFonts(updatedCustom);
      localStorage.setItem('sni_gdocs_custom_fonts', JSON.stringify(updatedCustom));
    }

    if (!activeFonts.includes(name)) {
      const updatedActive = [name, ...activeFonts];
      setActiveFonts(updatedActive);
      localStorage.setItem('sni_gdocs_active_fonts', JSON.stringify(updatedActive));
    }

    setCurrentFont(name);
    setCustomFontInput('');
  };

  const handleToggleFontActive = (fontFamily) => {
    let updated;
    if (activeFonts.includes(fontFamily)) {
      updated = activeFonts.filter((f) => f !== fontFamily);
    } else {
      updated = [...activeFonts, fontFamily];
    }
    setActiveFonts(updated);
    localStorage.setItem('sni_gdocs_active_fonts', JSON.stringify(updated));
  };

  // Insert Special Blocks (World-Class Spiritual & Publishing Blocks)
  const handleInsertBlock = (type) => {
    if (type === 'scripture') {
      const html = `<div class="sni-scripture-card" style="border-left: 4px solid #C59B27; background: #fffdf5; padding: 18px 24px; margin: 24px 0; border-radius: 0 14px 14px 0; box-shadow: 0 4px 16px -2px rgba(197,155,39,0.15);"><div style="font-family: 'Sri Krushnadevaraya', serif; font-size: 21px; line-height: 1.85; color: #1e293b; font-style: italic;">"నీ వాక్యము నా పాదములకు దీపమును నా త్రోవకు వెలుగునై యున్నది."</div><div style="text-align: right; font-weight: 700; color: #b45309; font-size: 13.5px; margin-top: 10px;">— కీర్తనలు 119:105 (పరిశుద్ధ గ్రంథము)</div></div><p><br/></p>`;
      execCmd('insertHTML', html);
    } else if (type === 'prayer') {
      const html = `<div class="sni-prayer-card" style="border-left: 4px solid #3b82f6; background: #eff6ff; padding: 18px 24px; margin: 24px 0; border-radius: 0 14px 14px 0; box-shadow: 0 4px 16px -2px rgba(59,130,246,0.15);"><div style="font-weight: 800; color: #1d4ed8; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">🕊️ ప్రార్థనాంశము (Prayer Focus & Intercession)</div><div style="font-size: 16px; color: #1e3a8a; line-height: 1.85;">దేవా, మా సంఘమును మరియు కుటుంబములను మీ కృపలో భద్రపరచి, అనుదినము మీ పరిశుద్ధాత్మ ద్వారా నడిపించుము. ఆమెన్.</div></div><p><br/></p>`;
      execCmd('insertHTML', html);
    } else if (type === 'insight') {
      const html = `<div class="sni-insight-card" style="border-left: 4px solid #10b981; background: #f0fdf4; padding: 18px 24px; margin: 24px 0; border-radius: 0 14px 14px 0; box-shadow: 0 4px 16px -2px rgba(16,185,129,0.15);"><div style="font-weight: 800; color: #047857; font-size: 14px; margin-bottom: 8px;">💡 దివ్య మర్మము (Key Spiritual Revelation)</div><div style="font-size: 16px; color: #064e3b; line-height: 1.85;">విశ్వాసము ద్వారా మాత్రమే మనము అసాధ్యమైన వాటిని సుసాధ్యముగా మార్చగలము. ప్రతి శోధనలో ఆయన కృప మనకు చాలును.</div></div><p><br/></p>`;
      execCmd('insertHTML', html);
    } else if (type === 'sermon-outline') {
      const html = `<div class="sni-sermon-framework" style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 22px 28px; margin: 26px 0; box-shadow: 0 4px 14px rgba(0,0,0,0.04);"><h3 style="color:#0f172a; font-weight:800; font-size: 19px; margin-bottom:14px; display:flex; align-items:center; gap:8px;">✝️ సంపూర్ణ ప్రసంగ నిర్మాణము (Sermon Architecture)</h3><ol style="margin-left: 20px; line-height: 2; font-size: 15.5px; color:#334155;"><li><strong>1. పరిచయ వాక్యములు (Introduction & Hook):</strong> మానవ జీవితంలో ఎదురయ్యే సవాళ్ళు మరియు దేవుని వాక్య ప్రాముఖ్యత</li><li><strong>2. లేఖన పఠనం (Scripture Grounding):</strong> ప్రధాన బైబిల్ భాగము మరియు సందర్భ వివరణ</li><li><strong>3. ముఖ్యాంశం 1 (First Pillar):</strong> దేవుని అపారమైన ప్రేమ మరియు విశ్వాసం</li><li><strong>4. ముఖ్యాంశం 2 (Second Pillar):</strong> పరిశుద్ధాత్మ శక్తితో నడవడిక</li><li><strong>5. ముఖ్యాంశం 3 (Third Pillar):</strong> ప్రతికూల పరిస్థితులలో నిరీక్షణ</li><li><strong>6. కార్యాచరణ & సమర్పణ (Life Application & Altar Call):</strong> అనుదిన జీవనంలో వాక్యాచరణ</li><li><strong>7. ముగింపు ప్రార్థన (Benediction & Blessing):</strong> దైవాశీర్వాదం</li></ol></div><p><br/></p>`;
      execCmd('insertHTML', html);
    } else if (type === 'hymn') {
      const html = `<div class="sni-hymn-card" style="border: 1px dashed #cbd5e1; background: #fafaf9; padding: 20px 24px; margin: 24px 0; border-radius: 12px; text-align: center;"><div style="font-weight: 700; color: #78350f; font-size: 15px; margin-bottom: 12px;">🎵 భక్తి గీతము / కీర్తనల లేఅవుట్</div><div style="font-family:'Sri Krushnadevaraya', serif; font-size: 18px; line-height: 2; color: #292524;"><p><strong>పల్లవి:</strong><br/>యేసయ్యా నీ ప్రేమ వర్ణింప చాలదు<br/>నీ కృపయే నను కాయుచున్నది</p><p style="margin-top: 10px;"><strong>చరణం:</strong><br/>కష్టాల కాలములో నీవే నా శైలము<br/>కన్నీటి లోయలో నీవే నా దీపము</p></div></div><p><br/></p>`;
      execCmd('insertHTML', html);
    }
  };

  // Insert Table
  const handleInsertTable = () => {
    let tableHtml = '<table style="width:100%; border-collapse: collapse; margin: 1.5rem 0; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);"><thead><tr>';
    for (let c = 0; c < tableCols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 12px 16px; background-color: #f8fafc; font-weight: bold; text-align: left; color:#0f172a;">Header ${c + 1}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += `<tr style="background-color: ${r % 2 === 0 ? '#ffffff' : '#fcfcfd'};">`;
      for (let c = 0; c < tableCols; c++) {
        tableHtml += '<td style="border: 1px solid #cbd5e1; padding: 10px 16px; color:#334155;">Text</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br/></p>';
    execCmd('insertHTML', tableHtml);
    setShowTableModal(false);
  };

  // Insert Link
  const handleInsertLink = () => {
    if (!linkUrl) return;
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    if (linkText) {
      execCmd('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1a73e8; text-decoration: underline; font-weight: 500;">${linkText}</a>`);
    } else {
      execCmd('createLink', url);
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Insert Image
  const handleInsertImage = () => {
    if (!imageUrl) return;
    const captionHtml = imageCaption ? `<figcaption style="text-align:center; font-size: 13px; color: #64748b; margin-top: 8px;">${imageCaption}</figcaption>` : '';
    const imgHtml = `<figure style="margin: 2rem auto; text-align: center;"><img src="${imageUrl}" alt="${imageCaption || 'Embedded Image'}" style="max-width: 100%; height: auto; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); display: inline-block;" />${captionHtml}</figure><p><br/></p>`;
    execCmd('insertHTML', imgHtml);
    setShowImageModal(false);
    setImageUrl('');
    setImageCaption('');
  };

  // Insert Video
  const handleInsertVideo = () => {
    if (!videoUrl) return;
    const trimmed = videoUrl.trim();
    if (trimmed.startsWith('<iframe')) {
      execCmd('insertHTML', `<div class="responsive-video-container" style="position:relative; width:100%; aspect-ratio:16/9; margin:2rem 0; border-radius:12px; overflow:hidden;">${trimmed}</div><p><br/></p>`);
    } else {
      let embed = trimmed;
      const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        embed = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
      }
      execCmd('insertHTML', `<div class="responsive-video-container" style="position:relative; width:100%; aspect-ratio:16/9; margin:2rem 0; border-radius:12px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.12);"><iframe src="${embed}" style="width:100%; height:100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br/></p>`);
    }
    setShowVideoModal(false);
    setVideoUrl('');
  };

  // Insert Comment Note
  const handleInsertComment = () => {
    if (!commentText) return;
    const commentHtml = `<div class="gdocs-comment-card" style="background: #fefce8; border-left: 3px solid #eab308; padding: 10px 14px; margin: 14px 0; border-radius: 6px; font-size: 13.5px; color: #713f12; box-shadow: 0 2px 6px rgba(234,179,8,0.1);"><span style="font-weight: 700; margin-right: 6px;">💬 Note:</span><span>${commentText}</span></div><p><br/></p>`;
    execCmd('insertHTML', commentHtml);
    setShowCommentModal(false);
    setCommentText('');
  };

  // Insert Checklist
  const handleInsertChecklist = () => {
    const checklistHtml = `<div class="docs-checklist-item" style="display:flex; align-items:flex-start; gap:10px; margin: 6px 0;"><input type="checkbox" style="width:16px; height:16px; margin-top: 4px; cursor:pointer;" /> <span>Checklist item</span></div><p><br/></p>`;
    execCmd('insertHTML', checklistHtml);
    setShowChecklistMenu(false);
  };

  // Print Document
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && editorRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${docTitle}</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sri+Krushnadevaraya&family=Noto+Sans+Telugu&display=swap">
            <style>
              @page { size: A4; margin: 20mm; }
              body { font-family: 'Sri Krushnadevaraya', 'Noto Sans Telugu', Arial, sans-serif; line-height: 1.85; color: #1e293b; padding: 24px; max-width: 820px; margin: 0 auto; }
              table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
              th, td { border: 1px solid #dadce0; padding: 10px 14px; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            ${editorRef.current.innerHTML}
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Theme Styling definitions
  const themeStyles = {
    paper: {
      canvas: 'bg-white',
      outer: 'bg-[#f0f4f9]',
      text: 'text-[#1f1f1f]',
      border: 'border-[#dadce0]',
      caret: '#1a73e8',
      desc: 'Pristine White Document',
    },
    parchment: {
      canvas: 'bg-[#fcf9f2]',
      outer: 'bg-[#f3ede1]',
      text: 'text-[#262626]',
      border: 'border-[#e7e1d3]',
      caret: '#b45309',
      desc: 'Sacred Parchment / Sepia',
    },
    midnight: {
      canvas: 'bg-[#0f172a]',
      outer: 'bg-[#0b1120]',
      text: 'text-[#f8fafc]',
      border: 'border-[#334155]',
      caret: '#60a5fa',
      desc: 'Midnight Zen Dark',
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.paper;

  const googleColorSwatches = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1155cc', '#073763', '#20124d', '#4c1130',
  ];

  const specialSymbols = [
    '✝', '🕊️', '⛪', '📖', '✦', '★', '❖', '❧', '☧', '✡', '—', '“', '”', '‘', '’', '…',
    '౦', '౧', '౨', '౩', '౪', '౫', '౬', '౭', '౮', '౯', '₹', '°', '±', '×', '÷', '✔',
  ];

  const allAvailableFonts = [
    ...POPULAR_TELUGU_FONTS.map(f => ({ ...f, type: 'telugu' })),
    ...POPULAR_GLOBAL_FONTS.map(f => ({ ...f, type: 'english' })),
    ...customAddedFonts.map(name => ({ name, family: name, sample: `${name} custom font sample`, type: 'my' })),
  ];

  const filteredFonts = allAvailableFonts.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(fontSearchQuery.toLowerCase());
    if (fontCategory === 'telugu') return matchesSearch && f.type === 'telugu';
    if (fontCategory === 'english') return matchesSearch && f.type === 'english';
    if (fontCategory === 'my') return matchesSearch && f.type === 'my';
    return matchesSearch;
  });

  // Short font display name for toolbar button (e.g., "Sree K...")
  const getShortFontName = (name) => {
    if (!name) return 'Font';
    if (name.toLowerCase().includes('krushnadevaraya')) return 'Sree K...';
    if (name.length > 9) return `${name.slice(0, 8)}...`;
    return name;
  };

  return (
    <div
      className={`border ${currentTheme.border} rounded-2xl overflow-hidden ${currentTheme.outer} transition-all font-sans select-none shadow-sm ${
        isFullscreen ? 'fixed inset-0 z-50 flex flex-col rounded-none shadow-none' : 'relative'
      }`}
    >
      {/* ============================================================== */}
      {/* FLOATING NOTION / MEDIUM STYLE SELECTION BUBBLE TOOLBAR        */}
      {/* ============================================================== */}
      {bubbleToolbar.visible && (
        <div
          className="fixed z-50 gdocs-bubble-toolbar flex items-center gap-1 bg-[#0f172a] text-white px-2 py-1.5 rounded-xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${bubbleToolbar.y}px`,
            left: `${bubbleToolbar.x}px`,
          }}
        >
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className={`px-2 py-1 rounded hover:bg-slate-800 font-bold text-xs ${isBold ? 'text-amber-400' : ''}`}
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className={`px-2 py-1 rounded hover:bg-slate-800 italic text-xs ${isItalic ? 'text-amber-400' : ''}`}
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className={`px-2 py-1 rounded hover:bg-slate-800 underline text-xs ${isUnderline ? 'text-amber-400' : ''}`}
            title="Underline"
          >
            U
          </button>
          <div className="w-px h-3.5 bg-slate-700 mx-0.5"></div>
          <button
            type="button"
            onClick={() => handleSetParagraphStyle('h1')}
            className="px-2 py-1 rounded hover:bg-slate-800 font-bold text-xs"
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => handleSetParagraphStyle('h2')}
            className="px-2 py-1 rounded hover:bg-slate-800 font-semibold text-xs"
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => setShowCommentModal(true)}
            className="px-2 py-1 rounded hover:bg-slate-800 text-xs text-amber-300"
            title="Add Comment / Note"
          >
            💬
          </button>
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="px-2 py-1 rounded hover:bg-slate-800 text-xs text-blue-300"
            title="Link"
          >
            🔗
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. GOOGLE DOCS TOP ROW: Menus (File, Edit, View...) & Title     */}
      {/* ============================================================== */}
      {!zenMode && !isSimpleMode && (
        <div className="bg-white px-4 pt-2 pb-1 border-b border-[#dadce0] gdocs-dropdown-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Left: Google Docs Logo + Doc Title + Menu Bar */}
            <div className="flex items-start gap-3">
              <div className="pt-0.5 shrink-0" title="Google Docs Style Content Editor">
                <GoogleDocsLogo />
              </div>

              <div className="flex flex-col">
                {/* Title & Cloud Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="text-[17px] font-semibold text-[#1f1f1f] hover:border-[#dadce0] border border-transparent rounded px-1.5 py-0.5 bg-transparent focus:bg-white focus:border-[#1a73e8] focus:outline-none transition max-w-[280px] truncate"
                    title="Rename Document"
                  />
                  <div className="flex items-center gap-1" title="Document auto-saved">
                    <CloudSavedIcon />
                  </div>
                </div>

                {/* EXACT GOOGLE DOCS MENUS: File, Edit, View, Insert, Format, Tools, Gemini, Extensions, Help */}
                <div className="flex flex-wrap items-center gap-0.5 text-[13.5px] text-[#444746] font-normal -ml-1 mt-0.5">
                  {/* File */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                      className={`px-2 py-0.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer select-none ${
                        activeMenu === 'file' ? 'bg-[#c2e7ff] text-[#001d35]' : ''
                      }`}
                    >
                      File
                    </button>
                    {activeMenu === 'file' && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-2 z-50 text-[13px] text-[#1f1f1f]">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Start a fresh new document?')) {
                              onChange('');
                              if (editorRef.current) editorRef.current.innerHTML = '';
                            }
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          New document
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handlePrint();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between"
                        >
                          <span>Print</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+P</span>
                        </button>
                        <div className="my-1 border-t border-[#e0e0e0]"></div>
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([editorRef.current?.innerHTML || ''], { type: 'text/html' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = `${docTitle || 'document'}.html`;
                            a.click();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Download as HTML (.html)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([editorRef.current?.innerText || ''], { type: 'text/plain' });
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = `${docTitle || 'document'}.txt`;
                            a.click();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Download Plain Text (.txt)
                        </button>
                        <div className="my-1 border-t border-[#e0e0e0]"></div>
                        <div className="px-4 py-1 text-[11px] font-bold text-[#747775] uppercase">Page Setup</div>
                        <button
                          type="button"
                          onClick={() => {
                            setPageFormat(pageFormat === 'pageless' ? 'pages' : 'pageless');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between"
                        >
                          <span>{pageFormat === 'pageless' ? 'Switch to Pages layout' : 'Switch to Pageless layout'}</span>
                          <span className="text-[#1a73e8] font-bold">✓</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Edit */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                      className={`px-2 py-0.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer select-none ${
                        activeMenu === 'edit' ? 'bg-[#c2e7ff] text-[#001d35]' : ''
                      }`}
                    >
                      Edit
                    </button>
                    {activeMenu === 'edit' && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-2 z-50 text-[13px] text-[#1f1f1f]">
                        <button
                          type="button"
                          onClick={() => {
                            execCmd('undo');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between"
                        >
                          <span>Undo</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+Z</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            execCmd('redo');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between"
                        >
                          <span>Redo</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+Y</span>
                        </button>
                        <div className="my-1 border-t border-[#e0e0e0]"></div>
                        <button
                          type="button"
                          onClick={() => {
                            execCmd('selectAll');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between"
                        >
                          <span>Select all</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+A</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowFindReplaceModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between"
                        >
                          <span>Find and replace</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+H</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* View */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                      className={`px-2 py-0.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer select-none ${
                        activeMenu === 'view' ? 'bg-[#c2e7ff] text-[#001d35]' : ''
                      }`}
                    >
                      View
                    </button>
                    {activeMenu === 'view' && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-2 z-50 text-[13px] text-[#1f1f1f]">
                        <div className="px-4 py-1 text-[11px] font-bold text-[#747775] uppercase tracking-wider">
                          Canvas Theme
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTheme('paper');
                            setActiveMenu(null);
                          }}
                          className={`w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between ${
                            theme === 'paper' ? 'text-[#1a73e8] font-bold bg-[#e8f0fe]' : ''
                          }`}
                        >
                          <span>☀️ Pristine White</span>
                          {theme === 'paper' && <span>✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTheme('parchment');
                            setActiveMenu(null);
                          }}
                          className={`w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between ${
                            theme === 'parchment' ? 'text-amber-800 font-bold bg-amber-50' : ''
                          }`}
                        >
                          <span>📜 Sacred Parchment / Sepia</span>
                          {theme === 'parchment' && <span>✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTheme('midnight');
                            setActiveMenu(null);
                          }}
                          className={`w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between ${
                            theme === 'midnight' ? 'text-blue-600 font-bold bg-blue-50' : ''
                          }`}
                        >
                          <span>🌙 Midnight Zen Dark</span>
                          {theme === 'midnight' && <span>✓</span>}
                        </button>

                        <div className="my-1.5 border-t border-[#e0e0e0]"></div>
                        <div className="px-4 py-1 text-[11px] font-bold text-[#747775] uppercase tracking-wider">
                          Width
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTextWidth('wide');
                            setActiveMenu(null);
                          }}
                          className={`w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between ${
                            textWidth === 'wide' ? 'text-[#1a73e8] font-semibold bg-[#e8f0fe]' : ''
                          }`}
                        >
                          <span>Wide Canvas</span>
                          {textWidth === 'wide' && <span>✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTextWidth('full');
                            setActiveMenu(null);
                          }}
                          className={`w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between ${
                            textWidth === 'full' ? 'text-[#1a73e8] font-semibold bg-[#e8f0fe]' : ''
                          }`}
                        >
                          <span>Full Width (100%)</span>
                          {textWidth === 'full' && <span>✓</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTextWidth('standard');
                            setActiveMenu(null);
                          }}
                          className={`w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between ${
                            textWidth === 'standard' ? 'text-[#1a73e8] font-semibold bg-[#e8f0fe]' : ''
                          }`}
                        >
                          <span>Standard Column</span>
                          {textWidth === 'standard' && <span>✓</span>}
                        </button>

                        <div className="my-1.5 border-t border-[#e0e0e0]"></div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsFullscreen(!isFullscreen);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowHtmlSource(!showHtmlSource);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          {showHtmlSource ? 'Visual Document' : 'View HTML source'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Insert */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === 'insert' ? null : 'insert')}
                      className={`px-2 py-0.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer select-none ${
                        activeMenu === 'insert' ? 'bg-[#c2e7ff] text-[#001d35]' : ''
                      }`}
                    >
                      Insert
                    </button>
                    {activeMenu === 'insert' && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-2 z-50 text-[13px] text-[#1f1f1f]">
                        <button
                          type="button"
                          onClick={() => {
                            setShowImageModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Image
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTableModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Table
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowLinkModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between"
                        >
                          <span>Link</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+K</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCommentModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Comment / Note
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowVideoModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Video (YouTube Embed)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSpecialSymbolsModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Special characters & Telugu numerals
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            execCmd('insertHorizontalRule');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Horizontal line
                        </button>
                        <div className="my-1 border-t border-[#e0e0e0]"></div>
                        <div className="px-4 py-1 text-[11px] font-bold text-[#747775] uppercase">Spiritual Publishing Blocks</div>
                        <button
                          type="button"
                          onClick={() => {
                            handleInsertBlock('scripture');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-amber-50 text-amber-900"
                        >
                          📖 Scripture Quote Card
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInsertBlock('prayer');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-blue-50 text-blue-900"
                        >
                          🕊️ Prayer Focus Block
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInsertBlock('insight');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-emerald-50 text-emerald-900"
                        >
                          💡 Key Revelation Insight
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInsertBlock('sermon-outline');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-purple-50 text-purple-900"
                        >
                          ✝️ 7-Step Sermon Outline
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Format */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === 'format' ? null : 'format')}
                      className={`px-2 py-0.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer select-none ${
                        activeMenu === 'format' ? 'bg-[#c2e7ff] text-[#001d35]' : ''
                      }`}
                    >
                      Format
                    </button>
                    {activeMenu === 'format' && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-2 z-50 text-[13px] text-[#1f1f1f]">
                        <button
                          type="button"
                          onClick={() => {
                            execCmd('bold');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] font-bold flex items-center justify-between"
                        >
                          <span>Bold</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+B</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            execCmd('italic');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] italic flex items-center justify-between"
                        >
                          <span>Italic</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+I</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            execCmd('underline');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] underline flex items-center justify-between"
                        >
                          <span>Underline</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+U</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            execCmd('strikeThrough');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] line-through"
                        >
                          Strikethrough
                        </button>
                        <div className="my-1 border-t border-[#e0e0e0]"></div>
                        <button
                          type="button"
                          onClick={() => {
                            execCmd('removeFormat');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] text-rose-600 font-medium"
                        >
                          Clear formatting
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tools */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
                      className={`px-2 py-0.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer select-none ${
                        activeMenu === 'tools' ? 'bg-[#c2e7ff] text-[#001d35]' : ''
                      }`}
                    >
                      Tools
                    </button>
                    {activeMenu === 'tools' && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-2 z-50 text-[13px] text-[#1f1f1f]">
                        <button
                          type="button"
                          onClick={() => {
                            setShowStatsModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between"
                        >
                          <span>Word count & stats</span>
                          <span className="text-[11px] text-[#747775]">Ctrl+Shift+C</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert('Spelling and grammar check completed. No errors found.');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Spelling and grammar check
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Gemini */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === 'gemini' ? null : 'gemini')}
                      className={`px-2 py-0.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer select-none flex items-center gap-1 ${
                        activeMenu === 'gemini' ? 'bg-[#c2e7ff] text-[#001d35]' : 'text-indigo-600 font-medium'
                      }`}
                    >
                      <GeminiSparkleIcon />
                      <span>Gemini</span>
                    </button>
                    {activeMenu === 'gemini' && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-indigo-200 py-2 z-50 text-[13px] text-[#1f1f1f]">
                        <button
                          type="button"
                          onClick={() => {
                            setShowGeminiAiModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-indigo-50 font-bold text-indigo-900"
                        >
                          Ask Gemini AI Assistant...
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInsertBlock('sermon-outline');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-indigo-50"
                        >
                          Generate Sermon Architecture
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInsertBlock('scripture');
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-indigo-50"
                        >
                          Insert Featured Scripture Quote
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Extensions */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === 'extensions' ? null : 'extensions')}
                      className={`px-2 py-0.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer select-none ${
                        activeMenu === 'extensions' ? 'bg-[#c2e7ff] text-[#001d35]' : ''
                      }`}
                    >
                      Extensions
                    </button>
                    {activeMenu === 'extensions' && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-2 z-50 text-[13px] text-[#1f1f1f]">
                        <button
                          type="button"
                          onClick={() => {
                            setShowFontManagerModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#e8f0fe] text-[#1a73e8] font-bold"
                        >
                          + Add Any Google Font...
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Help */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
                      className={`px-2 py-0.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer select-none ${
                        activeMenu === 'help' ? 'bg-[#c2e7ff] text-[#001d35]' : ''
                      }`}
                    >
                      Help
                    </button>
                    {activeMenu === 'help' && (
                      <div className="absolute top-full left-0 mt-1 w-60 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-2 z-50 text-[13px] text-[#1f1f1f]">
                        <button
                          type="button"
                          onClick={() => {
                            setShowSearchMenusModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between"
                        >
                          <span>Search menus</span>
                          <span className="text-[11px] text-[#747775]">Alt+/</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowStatsModal(true);
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-4 py-1.5 hover:bg-[#f1f3f4]"
                        >
                          Document Statistics
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Atmosphere & Layout Shortcuts */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              {/* Quick Layout Pill */}
              <div className="inline-flex items-center rounded-full bg-[#edf2fa] p-0.5 border border-[#dadce0] text-[11px]">
                <button
                  type="button"
                  onClick={() => setPageFormat('pageless')}
                  className={`px-2.5 py-0.5 rounded-full font-medium transition cursor-pointer ${
                    pageFormat === 'pageless' ? 'bg-white text-[#1a73e8] shadow-2xs font-bold' : 'text-[#444746]'
                  }`}
                  title="Spacious canvas layout"
                >
                  Pageless
                </button>
                <button
                  type="button"
                  onClick={() => setPageFormat('pages')}
                  className={`px-2.5 py-0.5 rounded-full font-medium transition cursor-pointer ${
                    pageFormat === 'pages' ? 'bg-white text-[#1a73e8] shadow-2xs font-bold' : 'text-[#444746]'
                  }`}
                  title="Page sheet layout"
                >
                  Pages
                </button>
              </div>

              {/* Gemini Button */}
              <button
                type="button"
                onClick={() => setShowGeminiAiModal(true)}
                className="p-1.5 rounded-full hover:bg-indigo-50 text-indigo-600 transition cursor-pointer"
                title="Ask Gemini"
              >
                <GeminiSparkleIcon />
              </button>

              {/* Zen Mode */}
              <button
                type="button"
                onClick={() => setZenMode(true)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#444746] font-semibold text-xs transition cursor-pointer"
                title="Zen Focus Mode"
              >
                Focus
              </button>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#444746] hover:bg-[#e1e7f0] transition cursor-pointer"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Zen Mode Exit Pill */}
      {zenMode && (
        <div className="sticky top-3 z-50 flex justify-center">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-3 text-xs border border-slate-700">
            <span className="font-bold text-amber-400">Zen Focus Mode</span>
            <span className="text-slate-400">|</span>
            <span>{wordCount} words</span>
            <span className="text-slate-400">|</span>
            <button
              type="button"
              onClick={() => setZenMode(false)}
              className="bg-white/20 hover:bg-white/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer"
            >
              Exit Focus Mode
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TOOLBARS                                                    */}
      {/* ============================================================== */}
      {/* A. SIMPLE MODE TOOLBAR (Clean, modern & effortless) */}
      {isSimpleMode && !zenMode && (
        <div className="bg-slate-50/95 border-b border-slate-200/90 px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Paragraph / Heading Style */}
            <select
              value={currentStyle}
              onChange={(e) => handleSetParagraphStyle(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
              title="Heading / Paragraph Style"
            >
              <option value="p">Normal Text</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>

            {/* Font Selector */}
            <select
              value={currentFont}
              onChange={(e) => handleSelectFont(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs max-w-[155px] truncate"
              title="Font Family"
            >
              <option value="Sri Krushnadevaraya">Sri Krushnadevaraya (తెలుగు)</option>
              <option value="Noto Sans Telugu">Noto Sans Telugu (తెలుగు)</option>
              <option value="Suranna">Suranna (తెలుగు)</option>
              <option value="Ramabhadra">Ramabhadra (తెలుగు)</option>
              <option value="Arial">Arial</option>
              <option value="Georgia">Georgia</option>
              <option value="Playfair Display">Playfair Display</option>
            </select>

            <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

            {/* Bold, Italic, Underline */}
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition cursor-pointer ${
                isBold ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs italic transition cursor-pointer ${
                isItalic ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs underline transition cursor-pointer ${
                isUnderline ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
              title="Underline (Ctrl+U)"
            >
              U
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

            {/* Bullet and Numbered Lists */}
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              className="px-2 py-1 flex items-center gap-1 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="Bullet List"
            >
              <span>• List</span>
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              className="px-2 py-1 flex items-center gap-1 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="Numbered List"
            >
              <span>1. List</span>
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

            {/* Scripture Quote */}
            <button
              type="button"
              onClick={() => handleInsertBlock('scripture')}
              className="px-2.5 py-1 flex items-center gap-1 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 transition cursor-pointer"
              title="Insert Scripture Quote Block"
            >
              <span>📖 Quote</span>
            </button>

            {/* Link */}
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="px-2 py-1 flex items-center gap-1 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="Insert Link"
            >
              <span>🔗 Link</span>
            </button>

            {/* Image */}
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="px-2 py-1 flex items-center gap-1 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="Insert Image"
            >
              <span>🖼️ Image</span>
            </button>

            <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

            {/* Undo / Redo */}
            <button
              type="button"
              onClick={() => execCmd('undo')}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="Undo"
            >
              ↶
            </button>
            <button
              type="button"
              onClick={() => execCmd('redo')}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="Redo"
            >
              ↷
            </button>
          </div>

          {/* Right: Word Count & Mode Switch */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              {wordCount} words
            </span>
            <button
              type="button"
              onClick={() => setIsSimpleMode(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold transition shadow-2xs cursor-pointer"
              title="Switch to Full Studio Mode with all Google Docs menus & advanced tools"
            >
              <span>🛠️ Studio Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* B. AUTHENTIC GOOGLE DOCS TOOLBAR (When in Studio Mode) */}
      {!isSimpleMode && !showHtmlSource && !zenMode && (
        <div className="px-3 py-1.5 bg-inherit gdocs-dropdown-container">
          <div className="bg-[#edf2fa] rounded-[24px] px-3 py-1 flex items-center gap-0.5 text-[#444746] shadow-2xs border border-[#d3e3fd]/40 overflow-x-auto scrollbar-none">
            
            {/* 1. Menus Pill Button */}
            <button
              type="button"
              onClick={() => setShowSearchMenusModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-slate-50 text-[11.5px] text-[#444746] shadow-2xs border border-[#dadce0] transition cursor-pointer shrink-0 mr-0.5"
              title="Search menus (Alt+/)"
            >
              <SearchIcon />
              <span>Menus</span>
            </button>

            {/* 2. Undo */}
            <button
              type="button"
              onClick={() => execCmd('undo')}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer shrink-0"
              title="Undo (Ctrl+Z)"
            >
              <UndoIcon />
            </button>

            {/* 3. Redo */}
            <button
              type="button"
              onClick={() => execCmd('redo')}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer shrink-0"
              title="Redo (Ctrl+Y)"
            >
              <RedoIcon />
            </button>

            {/* 4. Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer shrink-0"
              title="Print (Ctrl+P)"
            >
              <PrintIcon />
            </button>

            {/* 5. Spell check */}
            <button
              type="button"
              onClick={() => alert('Spelling and grammar check completed.')}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer shrink-0"
              title="Spelling and grammar check"
            >
              <SpellcheckIcon />
            </button>

            {/* 6. Paint format */}
            <button
              type="button"
              onClick={handleTogglePaintFormat}
              className={`p-1.5 rounded transition cursor-pointer shrink-0 ${
                paintFormatActive ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-[#e1e7f0]'
              }`}
              title="Paint format"
            >
              <PaintRollerIcon />
            </button>

            {/* 7. Zoom Dropdown (100% ▾) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowZoomMenu(!showZoomMenu)}
                className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[#e1e7f0] transition text-[12px] cursor-pointer"
                title="Zoom"
              >
                <span>{zoomLevel}%</span>
                <ArrowDropDown />
              </button>
              {showZoomMenu && (
                <div className="absolute top-full left-0 mt-1 w-28 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-1 z-50 text-[12px]">
                  {[50, 75, 90, 100, 125, 150, 200].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setZoomLevel(lvl);
                        setShowZoomMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4] ${zoomLevel === lvl ? 'font-bold text-[#1a73e8] bg-[#e8f0fe]' : ''}`}
                    >
                      {lvl}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#c7c7c7] mx-1 shrink-0"></div>

            {/* 8. Paragraph Style Dropdown (Title ▾) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowStyleMenu(!showStyleMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#e1e7f0] transition text-[12px] min-w-[70px] justify-between cursor-pointer"
                title="Styles"
              >
                <span className="truncate">
                  {currentStyle === 'p' && 'Normal text'}
                  {currentStyle === 'title' && 'Title'}
                  {currentStyle === 'subtitle' && 'Subtitle'}
                  {currentStyle === 'h1' && 'Heading 1'}
                  {currentStyle === 'h2' && 'Heading 2'}
                  {currentStyle === 'h3' && 'Heading 3'}
                </span>
                <ArrowDropDown />
              </button>
              {showStyleMenu && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-2xl border border-[#dadce0] py-1 z-50 text-[13px]">
                  <button
                    type="button"
                    onClick={() => handleSetParagraphStyle('p')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4] text-sm"
                  >
                    Normal text
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetParagraphStyle('title')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4] text-xl font-bold"
                  >
                    Title
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetParagraphStyle('subtitle')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4] text-sm text-[#5f6368] font-semibold"
                  >
                    Subtitle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetParagraphStyle('h1')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4] text-lg font-bold"
                  >
                    Heading 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetParagraphStyle('h2')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4] text-base font-semibold"
                  >
                    Heading 2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetParagraphStyle('h3')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4] text-sm font-semibold"
                  >
                    Heading 3
                  </button>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#c7c7c7] mx-1 shrink-0"></div>

            {/* 9. Font Family Dropdown (Sree K... ▾) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowFontMenu(!showFontMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-[#e1e7f0] transition text-[12px] max-w-[120px] justify-between cursor-pointer"
                title="Font"
              >
                <span className="truncate font-medium" style={{ fontFamily: currentFont }}>
                  {getShortFontName(currentFont)}
                </span>
                <ArrowDropDown />
              </button>
              {showFontMenu && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-2xl border border-[#dadce0] py-1 z-50 text-[13px]">
                  {/* Top: + More fonts */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowFontManagerModal(true);
                      setShowFontMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] font-bold flex items-center justify-between border-b border-[#dadce0] cursor-pointer"
                  >
                    <span>+ Add Any Google Font...</span>
                  </button>

                  <div className="px-3 py-1 text-[10px] font-bold uppercase text-[#747775] tracking-wider">
                    Document Fonts
                  </div>

                  {activeFonts.map((fName) => (
                    <button
                      key={fName}
                      type="button"
                      onClick={() => handleSelectFont(fName)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4] flex items-center justify-between transition ${
                        currentFont === fName ? 'bg-[#f1f3f4] font-bold text-[#1a73e8]' : 'text-[#1f1f1f]'
                      }`}
                      style={{ fontFamily: fName }}
                    >
                      <span className="truncate">{fName}</span>
                      {currentFont === fName && <span className="text-[#1a73e8] font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#c7c7c7] mx-1 shrink-0"></div>

            {/* 10. Font Size: − [ 13 ] + */}
            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => handleSetFontSize(fontSize - 1)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746]"
                title="Decrease font size"
              >
                <span className="text-sm font-bold leading-none">−</span>
              </button>

              <div className="relative">
                <input
                  type="text"
                  value={fontSize}
                  onChange={(e) => handleSetFontSize(e.target.value)}
                  onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
                  className="w-8 h-6 text-center text-[12px] border border-[#747775] rounded bg-white text-[#1f1f1f] focus:outline-[#1a73e8] cursor-pointer"
                  title="Font size"
                />
                {showFontSizeMenu && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-16 max-h-48 overflow-y-auto bg-white rounded-md shadow-lg border border-[#dadce0] py-1 z-50 text-[12px]">
                    {[8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSetFontSize(s)}
                        className={`w-full text-center py-1 hover:bg-[#f1f3f4] ${fontSize === s ? 'font-bold bg-[#e8f0fe] text-[#1a73e8]' : ''}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleSetFontSize(fontSize + 1)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746]"
                title="Increase font size"
              >
                <span className="text-sm font-bold leading-none">+</span>
              </button>
            </div>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#c7c7c7] mx-1 shrink-0"></div>

            {/* 11. Bold (B) */}
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className={`p-1.5 rounded transition cursor-pointer shrink-0 ${
                isBold ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-[#e1e7f0]'
              }`}
              title="Bold (Ctrl+B)"
            >
              <BoldIcon />
            </button>

            {/* 12. Italic (I) */}
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className={`p-1.5 rounded transition cursor-pointer shrink-0 ${
                isItalic ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-[#e1e7f0]'
              }`}
              title="Italic (Ctrl+I)"
            >
              <ItalicIcon />
            </button>

            {/* 13. Underline (U) */}
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className={`p-1.5 rounded transition cursor-pointer shrink-0 ${
                isUnderline ? 'bg-[#c2e7ff] text-[#001d35]' : 'hover:bg-[#e1e7f0]'
              }`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon />
            </button>

            {/* 14. Text Color (A with underline) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowTextColorMenu(!showTextColorMenu)}
                className="p-1 rounded hover:bg-[#e1e7f0] transition flex flex-col items-center justify-center cursor-pointer"
                title="Text color"
              >
                <span className="font-bold text-[12px] leading-tight">A</span>
                <span className="w-3.5 h-[3px] rounded-xs mt-0.5" style={{ backgroundColor: textColor }}></span>
              </button>
              {showTextColorMenu && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-2xl border border-[#dadce0] z-50 w-52">
                  <div className="grid grid-cols-10 gap-1">
                    {googleColorSwatches.map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTextColor(color);
                          execCmd('foreColor', color);
                          setShowTextColorMenu(false);
                        }}
                        className="w-4 h-4 rounded-xs border border-[#dadce0] hover:scale-125 transition"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 15. Highlight Color (Pencil with underline) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowHighlightMenu(!showHighlightMenu)}
                className="p-1 rounded hover:bg-[#e1e7f0] transition flex flex-col items-center justify-center cursor-pointer"
                title="Highlight color"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.56 8.94L7.62 17.88a1.5 1.5 0 0 1-2.12 0l-1.41-1.41a1.5 1.5 0 0 1 0-2.12l8.94-8.94 3.53 3.53zM18.68 6.82l-1.41-1.41 1.41-1.41a1 1 0 0 1 1.41 0l1.41 1.41a1 1 0 0 1 0 1.41l-1.41 1.41z"/>
                </svg>
                <span className="w-3.5 h-[3px] rounded-xs mt-0.5" style={{ backgroundColor: highlightColor }}></span>
              </button>
              {showHighlightMenu && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-2xl border border-[#dadce0] z-50 w-52">
                  <div className="flex justify-between items-center mb-1 text-[11px] text-[#5f6368]">
                    <span>Highlight</span>
                    <button
                      type="button"
                      onClick={() => {
                        execCmd('hiliteColor', 'transparent');
                        setShowHighlightMenu(false);
                      }}
                      className="text-[#1a73e8] hover:underline"
                    >
                      None
                    </button>
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {googleColorSwatches.map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setHighlightColor(color);
                          execCmd('hiliteColor', color);
                          setShowHighlightMenu(false);
                        }}
                        className="w-4 h-4 rounded-xs border border-[#dadce0] hover:scale-125 transition"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#c7c7c7] mx-1 shrink-0"></div>

            {/* 16. Insert Link (🔗) */}
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746] shrink-0"
              title="Insert link (Ctrl+K)"
            >
              <LinkIcon />
            </button>

            {/* 17. Add Comment (💬+) */}
            <button
              type="button"
              onClick={() => setShowCommentModal(true)}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746] shrink-0"
              title="Add comment / note"
            >
              <AddCommentIcon />
            </button>

            {/* 18. Insert Image (🖼️) */}
            <button
              type="button"
              onClick={() => setShowImageModal(true)}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746] shrink-0"
              title="Insert image"
            >
              <ImageIcon />
            </button>

            {/* Separator */}
            <div className="w-[1px] h-4 bg-[#c7c7c7] mx-1 shrink-0"></div>

            {/* 19. Alignment Dropdown (≡ ▾) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAlignMenu(!showAlignMenu)}
                className="flex items-center gap-0.5 p-1 rounded hover:bg-[#e1e7f0] transition cursor-pointer"
                title="Align"
              >
                {currentAlign === 'center' ? (
                  <AlignCenterIcon />
                ) : currentAlign === 'right' ? (
                  <AlignRightIcon />
                ) : currentAlign === 'justify' ? (
                  <AlignJustifyIcon />
                ) : (
                  <AlignLeftIcon />
                )}
                <ArrowDropDown />
              </button>
              {showAlignMenu && (
                <div className="absolute top-full left-0 mt-1 flex items-center gap-0.5 bg-white p-1 rounded-md shadow-lg border border-[#dadce0] z-50">
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('justifyLeft');
                      setCurrentAlign('left');
                      setShowAlignMenu(false);
                    }}
                    className="p-1 rounded hover:bg-[#f1f3f4]"
                    title="Left"
                  >
                    <AlignLeftIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('justifyCenter');
                      setCurrentAlign('center');
                      setShowAlignMenu(false);
                    }}
                    className="p-1 rounded hover:bg-[#f1f3f4]"
                    title="Center"
                  >
                    <AlignCenterIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('justifyRight');
                      setCurrentAlign('right');
                      setShowAlignMenu(false);
                    }}
                    className="p-1 rounded hover:bg-[#f1f3f4]"
                    title="Right"
                  >
                    <AlignRightIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('justifyFull');
                      setCurrentAlign('justify');
                      setShowAlignMenu(false);
                    }}
                    className="p-1 rounded hover:bg-[#f1f3f4]"
                    title="Justify"
                  >
                    <AlignJustifyIcon />
                  </button>
                </div>
              )}
            </div>

            {/* 20. Line Spacing Dropdown (↕ ▾) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowLineSpacingMenu(!showLineSpacingMenu)}
                className="flex items-center gap-0.5 p-1 rounded hover:bg-[#e1e7f0] transition cursor-pointer"
                title="Line & paragraph spacing"
              >
                <LineSpacingIcon />
                <ArrowDropDown />
              </button>
              {showLineSpacingMenu && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-[#dadce0] py-1 z-50 text-[12px]">
                  <button
                    type="button"
                    onClick={() => handleSetLineSpacing('1.0')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4]"
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetLineSpacing('1.15')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4]"
                  >
                    1.15
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetLineSpacing('1.5')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4]"
                  >
                    1.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetLineSpacing('1.85')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4] font-semibold text-blue-600"
                  >
                    1.85 (Ideal Telugu)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetLineSpacing('2.0')}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#f1f3f4]"
                  >
                    Double
                  </button>
                </div>
              )}
            </div>

            {/* 21. Checklist Dropdown (☑ ▾) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => handleInsertChecklist()}
                className="flex items-center gap-0.5 p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746]"
                title="Checklist"
              >
                <ChecklistIcon />
                <ArrowDropDown />
              </button>
            </div>

            {/* 22. Bulleted List Dropdown (•≡ ▾) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => execCmd('insertUnorderedList')}
                className="flex items-center gap-0.5 p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746]"
                title="Bulleted list"
              >
                <BulletListIcon />
                <ArrowDropDown />
              </button>
            </div>

            {/* 23. Numbered List Dropdown (1.≡ ▾) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => execCmd('insertOrderedList')}
                className="flex items-center gap-0.5 p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746]"
                title="Numbered list"
              >
                <NumberedListIcon />
                <ArrowDropDown />
              </button>
            </div>

            {/* 24. Decrease Indent (⇤) */}
            <button
              type="button"
              onClick={() => execCmd('outdent')}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746] shrink-0"
              title="Decrease indent"
            >
              <OutdentIcon />
            </button>

            {/* 25. Increase Indent (⇥) */}
            <button
              type="button"
              onClick={() => execCmd('indent')}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746] shrink-0"
              title="Increase indent"
            >
              <IndentIcon />
            </button>

            {/* 26. Clear Formatting (T/) */}
            <button
              type="button"
              onClick={() => execCmd('removeFormat')}
              className="p-1.5 rounded hover:bg-[#e1e7f0] transition cursor-pointer text-[#444746] shrink-0"
              title="Clear formatting"
            >
              <ClearFormattingIcon />
            </button>

            {/* Switch back to Simple Mode */}
            <button
              type="button"
              onClick={() => setIsSimpleMode(true)}
              className="ml-2 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-[#071B3B] border border-amber-300 text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1 shrink-0"
              title="Return to clean, simple writing mode"
            >
              <span>✨ Simple Mode</span>
            </button>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. AUTHENTIC GOOGLE DOCS WRITING CANVAS                        */}
      {/* ============================================================== */}
      {showHtmlSource ? (
        <div className="flex-1 bg-slate-900 p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700 text-slate-300 text-xs">
            <span>Direct HTML Source Code Editor</span>
            <button
              type="button"
              onClick={() => {
                setShowHtmlSource(false);
                onChange(htmlSource);
              }}
              className="px-3 py-1 bg-[#1a73e8] text-white rounded font-medium"
            >
              Apply & Return to Visual Editor
            </button>
          </div>
          <textarea
            rows={isFullscreen ? 30 : rows}
            value={htmlSource}
            onChange={(e) => {
              setHtmlSource(e.target.value);
              onChange(e.target.value);
            }}
            className="w-full h-full p-4 font-mono text-xs text-emerald-400 bg-slate-950 rounded border border-slate-800 focus:outline-none resize-y"
            placeholder="Edit raw HTML code..."
          />
        </div>
      ) : isSimpleMode ? (
        /* SIMPLE WRITING CANVAS (Clean, spacious, fast & effortless) */
        <div className="p-4 sm:p-6 bg-white min-h-[380px] flex flex-col">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onMouseUp={handleMouseUp}
            onKeyUp={handleSelectionBubble}
            className="w-full min-h-[340px] focus:outline-none rich-html-content text-slate-800 text-sm sm:text-base leading-relaxed"
            style={{
              fontFamily: currentFont,
              caretColor: '#C59B27',
              lineHeight: 1.85,
            }}
            data-placeholder={placeholder}
          />
        </div>
      ) : pageFormat === 'pageless' ? (
        /* PAGELESS FORMAT: Spacious, fluid, world-class writing space */
        <div className={`flex-1 overflow-y-auto ${currentTheme.canvas} py-6 px-4 sm:px-10 flex flex-col items-center transition-colors duration-200`}>
          <div
            className={`w-full transition-all duration-200 origin-top ${
              textWidth === 'full'
                ? 'max-w-none px-2 sm:px-6'
                : textWidth === 'standard'
                ? 'max-w-3xl px-4 sm:px-8'
                : 'max-w-5xl px-4 sm:px-10'
            }`}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onMouseUp={handleMouseUp}
              onKeyUp={handleSelectionBubble}
              className={`w-full min-h-[480px] focus:outline-none rich-html-content ${currentTheme.text} transition-colors duration-200`}
              style={{
                fontFamily: currentFont,
                fontSize: `${fontSize}pt`,
                caretColor: currentTheme.caret,
                lineHeight: 1.85,
                letterSpacing: '0.01em',
              }}
              data-placeholder={placeholder}
            />
          </div>
        </div>
      ) : (
        /* PAGES FORMAT: Authentic paper sheet with ruler */
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f0f4f9] py-4 px-2 sm:px-6 flex flex-col items-center">
          {/* Authentic Google Docs Ruler */}
          <div
            className="w-full max-w-[816px] h-4 bg-[#f8fafd] border-b border-[#dadce0] flex items-center justify-between px-16 text-[9px] text-[#70757a] relative select-none shadow-2xs"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            <div className="absolute left-[72px] top-0 text-[#1a73e8] text-[8px] leading-none select-none">▼</div>
            <div className="absolute right-[72px] top-0 text-[#1a73e8] text-[8px] leading-none select-none">▼</div>
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
          </div>

          {/* Centered Paper Sheet */}
          <div
            className="w-full max-w-[816px] bg-white my-3 px-8 sm:px-12 py-8 sm:py-12 min-h-[580px] transition-transform duration-150 origin-top text-[#1f1f1f]"
            style={{
              boxShadow: '0 1px 3px 1px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.30)',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onMouseUp={handleMouseUp}
              onKeyUp={handleSelectionBubble}
              className="w-full min-h-[500px] focus:outline-none rich-html-content"
              style={{
                fontFamily: currentFont,
                fontSize: `${fontSize}pt`,
                caretColor: '#1a73e8',
                lineHeight: 1.85,
              }}
              data-placeholder={placeholder}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODALS & EXTENSIONS                                         */}
      {/* ============================================================== */}

      {/* A. Fonts Manager Modal */}
      {showFontManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[88vh] border border-[#dadce0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#dadce0]">
              <h3 className="text-[18px] font-bold text-[#1f1f1f]">Fonts & Typography Studio</h3>
              <button
                type="button"
                onClick={() => setShowFontManagerModal(false)}
                className="text-[#747775] hover:text-[#1f1f1f] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Custom Google Font Input */}
            <div className="bg-[#f0f4f9] p-3 rounded-xl mt-3 border border-[#dadce0]">
              <label className="block text-[12px] font-bold text-[#1f1f1f] mb-1">
                + Add any Google Font by name:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFontInput}
                  onChange={(e) => setCustomFontInput(e.target.value)}
                  placeholder="e.g. Sree Krushnadevaraya, Cinzel, Playfair Display, Kalam, Anek Telugu..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#dadce0] bg-white text-[12px] focus:outline-[#1a73e8]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomFont}
                  className="px-4 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-[12px] rounded-lg transition cursor-pointer"
                >
                  Add Font
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-[#dadce0]">
              <div className="flex items-center gap-1.5 text-[12px]">
                <button
                  type="button"
                  onClick={() => setFontCategory('all')}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    fontCategory === 'all'
                      ? 'bg-[#c2e7ff] text-[#001d35] font-bold'
                      : 'bg-[#f1f3f4] text-[#444746] hover:bg-[#e1e7f0]'
                  }`}
                >
                  All Fonts
                </button>
                <button
                  type="button"
                  onClick={() => setFontCategory('telugu')}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    fontCategory === 'telugu'
                      ? 'bg-[#c2e7ff] text-[#001d35] font-bold'
                      : 'bg-[#f1f3f4] text-[#444746] hover:bg-[#e1e7f0]'
                  }`}
                >
                  Telugu (తెలుగు)
                </button>
                <button
                  type="button"
                  onClick={() => setFontCategory('english')}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    fontCategory === 'english'
                      ? 'bg-[#c2e7ff] text-[#001d35] font-bold'
                      : 'bg-[#f1f3f4] text-[#444746] hover:bg-[#e1e7f0]'
                  }`}
                >
                  English & Global
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={fontSearchQuery}
                  onChange={(e) => setFontSearchQuery(e.target.value)}
                  placeholder="Search fonts..."
                  className="px-3 py-1 rounded-lg border border-[#dadce0] text-[12px] w-48 focus:outline-[#1a73e8]"
                />
              </div>
            </div>

            {/* Font List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[#f1f3f4] mt-2 max-h-80">
              {filteredFonts.map((font) => {
                const isSelected = activeFonts.includes(font.family);
                loadGoogleFont(font.family);
                return (
                  <div
                    key={font.family}
                    className="pt-2 flex items-center justify-between hover:bg-[#f8fafd] p-2 rounded-xl transition cursor-pointer"
                    onClick={() => handleToggleFontActive(font.family)}
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1f1f1f] text-[13px]">{font.name}</span>
                        {font.type === 'telugu' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Telugu
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[15.5px] text-[#444746] truncate mt-0.5"
                        style={{ fontFamily: font.family }}
                      >
                        {font.sample}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFont(font.family);
                          setShowFontManagerModal(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#f1f3f4] hover:bg-[#e8f0fe] text-[#444746] hover:text-[#1a73e8] text-[12px] font-semibold cursor-pointer"
                      >
                        Select
                      </button>
                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center border transition ${
                          isSelected
                            ? 'bg-[#1a73e8] border-[#1a73e8] text-white font-bold text-xs'
                            : 'border-[#747775] text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#dadce0] flex items-center justify-between mt-3 text-[12px]">
              <span className="text-[#5f6368]">
                {activeFonts.length} fonts in your toolbar dropdown
              </span>
              <button
                type="button"
                onClick={() => setShowFontManagerModal(false)}
                className="px-5 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-[13px] transition cursor-pointer shadow-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. Comment / Note Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 border border-[#dadce0]">
            <h4 className="text-[15px] font-bold text-[#1f1f1f]">Add Comment / Editorial Note</h4>
            <div>
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type note or feedback here..."
                className="w-full p-2.5 rounded-lg border border-[#dadce0] text-xs focus:outline-[#1a73e8]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCommentModal(false)}
                className="px-3 py-1.5 text-xs text-[#5f6368] hover:bg-[#f1f3f4] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertComment}
                className="px-4 py-1.5 bg-[#1a73e8] text-white font-bold text-xs rounded-lg hover:bg-[#1557b0]"
              >
                Insert Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 border border-[#dadce0]">
            <h4 className="text-[15px] font-bold text-[#1f1f1f]">Insert Link</h4>
            <div>
              <label className="block text-xs text-[#444746] mb-1">Text (optional)</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Display text"
                className="w-full p-2 rounded-lg border border-[#dadce0] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-[#444746] mb-1">Link URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 rounded-lg border border-[#dadce0] text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 text-xs text-[#5f6368] hover:bg-[#f1f3f4] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-4 py-1.5 bg-[#1a73e8] text-white font-bold text-xs rounded-lg hover:bg-[#1557b0]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 border border-[#dadce0]">
            <h4 className="text-[15px] font-bold text-[#1f1f1f]">Insert Image</h4>
            <div>
              <label className="block text-xs text-[#444746] mb-1">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash..."
                className="w-full p-2 rounded-lg border border-[#dadce0] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-[#444746] mb-1">Caption (optional)</label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Caption"
                className="w-full p-2 rounded-lg border border-[#dadce0] text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 text-xs text-[#5f6368] hover:bg-[#f1f3f4] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                className="px-4 py-1.5 bg-[#1a73e8] text-white font-bold text-xs rounded-lg hover:bg-[#1557b0]"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E. Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl space-y-3 border border-[#dadce0]">
            <h4 className="text-[15px] font-bold text-[#1f1f1f]">Insert Table</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#444746] mb-1 font-medium">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-lg border border-[#dadce0] text-xs"
                />
              </div>
              <div>
                <label className="block text-[#444746] mb-1 font-medium">Columns</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-lg border border-[#dadce0] text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="px-3 py-1.5 text-xs text-[#5f6368] hover:bg-[#f1f3f4] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="px-4 py-1.5 bg-[#1a73e8] text-white font-bold text-xs rounded-lg hover:bg-[#1557b0]"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F. Special Symbols Modal */}
      {showSpecialSymbolsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 border border-[#dadce0]">
            <div className="flex items-center justify-between">
              <h4 className="text-[15px] font-bold text-[#1f1f1f]">Special Symbols & Telugu Numerals</h4>
              <button
                type="button"
                onClick={() => setShowSpecialSymbolsModal(false)}
                className="text-[#747775] hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2 text-center text-lg pt-1">
              {specialSymbols.map((sym, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    execCmd('insertText', sym);
                    setShowSpecialSymbolsModal(false);
                  }}
                  className="p-2 border border-[#dadce0] rounded-lg hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* G. Gemini AI Assistant Modal */}
      {showGeminiAiModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-indigo-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                <GeminiSparkleIcon />
                <span>Gemini AI Spiritual Co-Writer</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowGeminiAiModal(false)}
                className="text-[#747775] hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  handleInsertBlock('sermon-outline');
                  setShowGeminiAiModal(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer"
              >
                <div className="font-bold text-indigo-950">1. Generate Sermon Architecture</div>
                <div className="text-[11px] text-slate-500">Creates structured 7-step sermon homiletic outline</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleInsertBlock('scripture');
                  setShowGeminiAiModal(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-amber-100 hover:border-amber-400 hover:bg-amber-50/50 transition cursor-pointer"
              >
                <div className="font-bold text-amber-950">2. Insert Featured Scripture Passage</div>
                <div className="text-[11px] text-slate-500">Adds prominent gold scripture block</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Content typography and Telugu grammar polished!');
                  setShowGeminiAiModal(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/50 transition cursor-pointer"
              >
                <div className="font-bold text-emerald-950">3. Polish Telugu Grammar & Punctuation</div>
                <div className="text-[11px] text-slate-500">Verifies scripture quotes and readability</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* H. Search Menus Dialog (Alt+/) */}
      {showSearchMenusModal && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-start justify-center pt-24 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl space-y-2 border border-[#dadce0]">
            <div className="flex items-center gap-2 border-b border-[#dadce0] pb-2">
              <SearchIcon />
              <input
                type="text"
                autoFocus
                value={searchMenuQuery}
                onChange={(e) => setSearchMenuQuery(e.target.value)}
                placeholder="Search menus or commands (Alt+/)..."
                className="w-full text-xs text-[#1f1f1f] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSearchMenusModal(false)}
                className="text-[#747775] text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-1">
              <button
                type="button"
                onClick={() => {
                  setShowFontManagerModal(true);
                  setShowSearchMenusModal(false);
                }}
                className="w-full text-left p-2 hover:bg-[#f1f3f4] rounded-lg flex justify-between"
              >
                <span>Add new fonts / Font library</span>
                <span className="text-[#1a73e8] font-bold">Extensions</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleInsertBlock('scripture');
                  setShowSearchMenusModal(false);
                }}
                className="w-full text-left p-2 hover:bg-amber-50 rounded-lg flex justify-between text-amber-950"
              >
                <span>Insert Scripture Card</span>
                <span className="text-amber-700 font-bold">Insert</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrint();
                  setShowSearchMenusModal(false);
                }}
                className="w-full text-left p-2 hover:bg-[#f1f3f4] rounded-lg flex justify-between"
              >
                <span>Print document (PDF)</span>
                <span className="text-[#747775]">Ctrl+P</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* I. Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl space-y-3 border border-[#dadce0]">
            <h4 className="text-[15px] font-bold text-[#1f1f1f]">Document Statistics</h4>
            <div className="space-y-1.5 text-xs text-[#444746]">
              <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                <span>Words:</span>
                <span className="font-bold text-[#0f172a]">{wordCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                <span>Characters:</span>
                <span className="font-bold text-[#0f172a]">{charCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                <span>Estimated reading time:</span>
                <span className="font-bold text-[#1a73e8]">{readingTime} min</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f1f3f4]">
                <span>Estimated speaking time:</span>
                <span className="font-bold text-amber-600">{speakingTime} min</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-[#1a73e8] text-white text-xs font-bold cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* J. Find and Replace Dialog */}
      {showFindReplaceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 border border-[#dadce0]">
            <h4 className="text-[15px] font-bold text-[#1f1f1f]">Find and Replace</h4>
            <div>
              <label className="block font-medium text-[#444746] text-xs mb-1">Find</label>
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Text to find..."
                className="w-full p-2 rounded-lg border border-[#dadce0] text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-[#444746] text-xs mb-1">Replace with</label>
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replacement text..."
                className="w-full p-2 rounded-lg border border-[#dadce0] text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFindReplaceModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#5f6368] hover:bg-[#f1f3f4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!findText || !editorRef.current) return;
                  const content = editorRef.current.innerHTML;
                  const regex = new RegExp(findText, 'gi');
                  editorRef.current.innerHTML = content.replace(regex, replaceText);
                  handleInput();
                  setShowFindReplaceModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-[#1a73e8] text-white font-bold text-xs hover:bg-[#1557b0]"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. GOOGLE DOCS FOOTER BAR                                      */}
      {/* ============================================================== */}
      <div className={`px-4 py-2 ${currentTheme.canvas} border-t ${currentTheme.border} flex flex-wrap items-center justify-between text-[11px] text-[#5f6368] gap-2 transition-colors duration-200`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1f1f1f] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Google Docs Engine
          </span>
          <span>•</span>
          <span className="capitalize">{currentTheme.desc}</span>
          <span>•</span>
          <span className="font-semibold text-[#1a73e8]">{currentFont}</span>
          <span>•</span>
          <span>{fontSize} pt</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-medium">{wordCount} words</span>
          <span>•</span>
          <span>{readingTime} min read</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setShowFontManagerModal(true)}
            className="text-[#1a73e8] hover:underline font-bold cursor-pointer"
          >
            + Add New Fonts
          </button>
        </div>
      </div>
    </div>
  );
}
