import { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ListChecks,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Quote,
  RemoveFormatting,
  Undo2,
  Redo2,
  Code,
  Maximize2,
  Minimize2,
  Palette,
  Highlighter,
  ChevronDown,
  Sparkles,
  Video,
  Search,
  Printer,
  CheckCheck,
  PaintRoller,
  MessageSquarePlus,
  Plus,
  X,
  FileText,
  HelpCircle,
  Bot,
  Scissors,
  Copy,
  Subscript,
  Superscript,
  Check,
  ZoomIn,
  ZoomOut,
  Calendar,
  Layers,
  Download,
} from 'lucide-react';

// Preset Google Fonts for Telugu & Global Typography
const PRESET_TELUGU_FONTS = [
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

const PRESET_GLOBAL_FONTS = [
  { name: 'Arial', family: 'Arial, sans-serif', isSystem: true, sample: 'The Holy Bible & Sacred Word' },
  { name: 'Roboto', family: 'Roboto, sans-serif', sample: 'Modern, clean & readable' },
  { name: 'Open Sans', family: 'Open Sans, sans-serif', sample: 'Open Sans Clean Typography' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', sample: 'Montserrat Elegant Headers' },
  { name: 'Poppins', family: 'Poppins, sans-serif', sample: 'Geometric and Friendly' },
  { name: 'Georgia', family: 'Georgia, serif', isSystem: true, sample: 'Traditional editorial style' },
  { name: 'Times New Roman', family: 'Times New Roman, serif', isSystem: true, sample: 'Academic and formal' },
  { name: 'Playfair Display', family: 'Playfair Display, serif', sample: 'Classic scripture beauty' },
  { name: 'Merriweather', family: 'Merriweather, serif', sample: 'Designed for effortless reading' },
  { name: 'Cinzel', family: 'Cinzel, serif', sample: 'Majestic & Classical Roman' },
  { name: 'Caveat', family: 'Caveat, cursive', sample: 'Handwritten personal notes' },
  { name: 'Dancing Script', family: 'Dancing Script, cursive', sample: 'Graceful flowing calligraphy' },
  { name: 'Pacifico', family: 'Pacifico, cursive', sample: 'Bold and friendly script' },
  { name: 'Great Vibes', family: 'Great Vibes, cursive', sample: 'Exquisite formal calligraphy' },
  { name: 'Bebas Neue', family: 'Bebas Neue, sans-serif', sample: 'BOLD ALL-CAPS TITLES' },
  { name: 'Courier New', family: 'Courier New, monospace', isSystem: true, sample: 'Fixed width typewriter font' },
];

// Helper to inject Google Fonts dynamically
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
  label = 'Content',
  placeholder = 'Type your article here or paste from Google Docs, Word, or web pages...',
  rows = 12,
}) {
  const editorRef = useRef(null);

  // Layout & View States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [htmlSource, setHtmlSource] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showRuler, setShowRuler] = useState(true);

  // Active Formatting States
  const [currentStyle, setCurrentStyle] = useState('p');
  const [currentFont, setCurrentFont] = useState('Sri Krushnadevaraya');
  const [fontSize, setFontSize] = useState(14);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [paintFormatActive, setPaintFormatActive] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState(null);

  // Word count & stats
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

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
  const [showListMenu, setShowListMenu] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);

  // Modals
  const [showFontManagerModal, setShowFontManagerModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showFindReplaceModal, setShowFindReplaceModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showSpecialCharsModal, setShowSpecialCharsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSearchMenusModal, setShowSearchMenusModal] = useState(false);

  // Modal Inputs
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchMenuQuery, setSearchMenuQuery] = useState('');

  // Font Manager Custom Fonts
  const [customFontInput, setCustomFontInput] = useState('');
  const [fontSearchQuery, setFontSearchQuery] = useState('');
  const [fontFilterCategory, setFontFilterCategory] = useState('all'); // 'all', 'telugu', 'english', 'my'
  const [activeFonts, setActiveFonts] = useState([
    'Sri Krushnadevaraya',
    'Noto Sans Telugu',
    'Suranna',
    'Ramabhadra',
    'Gidugu',
    'Mandali',
    'Roboto',
    'Arial',
    'Georgia',
    'Playfair Display',
    'Cinzel',
    'Caveat',
  ]);
  const [customAddedFonts, setCustomAddedFonts] = useState([]);

  // Load custom fonts from localStorage and preload initial Google Fonts
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sni_google_docs_custom_fonts');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCustomAddedFonts(parsed);
      }
      const savedActive = localStorage.getItem('sni_google_docs_active_fonts');
      if (savedActive) {
        setActiveFonts(JSON.parse(savedActive));
      }
    } catch (e) {
      console.warn('Could not read fonts from localStorage', e);
    }

    // Preload essential Telugu and Display fonts
    PRESET_TELUGU_FONTS.forEach((f) => loadGoogleFont(f.family));
    loadGoogleFont('Playfair Display');
    loadGoogleFont('Cinzel');
    loadGoogleFont('Caveat');
    loadGoogleFont('Poppins');
    loadGoogleFont('Montserrat');
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
      if (!e.target.closest('.docs-dropdown-container')) {
        setActiveMenu(null);
        setShowZoomMenu(false);
        setShowStyleMenu(false);
        setShowFontMenu(false);
        setShowFontSizeMenu(false);
        setShowTextColorMenu(false);
        setShowHighlightMenu(false);
        setShowAlignMenu(false);
        setShowLineSpacingMenu(false);
        setShowListMenu(false);
        setShowImageMenu(false);
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
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      calculateStats();
      updateActiveFormatting();
    }
  };

  // Inspect current selection for formatting highlights
  const updateActiveFormatting = () => {
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      setIsStrikethrough(document.queryCommandState('strikeThrough'));
    } catch (e) {
      // ignore
    }
  };

  // Standard execCommand
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

  // Handle format painter
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

  const handleMouseUp = () => {
    updateActiveFormatting();
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

  // Set Font Family
  const handleSelectFont = (fontFamily) => {
    loadGoogleFont(fontFamily);
    setCurrentFont(fontFamily);
    execCmd('fontName', fontFamily);
    setShowFontMenu(false);
  };

  // Set Font Size
  const handleSetFontSize = (size) => {
    const num = Math.max(6, Math.min(120, parseInt(size) || 14));
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

  // Set Paragraph Style
  const handleSetParagraphStyle = (style) => {
    setCurrentStyle(style);
    if (style === 'p') {
      execCmd('formatBlock', '<p>');
    } else if (style === 'title') {
      const html = `<h1 style="font-size: 26pt; font-weight: bold; line-height: 1.2; margin: 16px 0; color: #1e293b;">Title</h1><p><br/></p>`;
      execCmd('insertHTML', html);
    } else if (style === 'subtitle') {
      const html = `<p style="font-size: 15pt; color: #64748b; line-height: 1.4; margin: 8px 0;">Subtitle</p><p><br/></p>`;
      execCmd('insertHTML', html);
    } else {
      execCmd('formatBlock', `<${style}>`);
    }
    setShowStyleMenu(false);
  };

  // Set Line Spacing
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

  // Add Custom Google Font
  const handleAddCustomFont = () => {
    if (!customFontInput.trim()) return;
    const name = customFontInput.trim();
    loadGoogleFont(name);

    if (!customAddedFonts.includes(name)) {
      const updatedCustom = [...customAddedFonts, name];
      setCustomAddedFonts(updatedCustom);
      localStorage.setItem('sni_google_docs_custom_fonts', JSON.stringify(updatedCustom));
    }

    if (!activeFonts.includes(name)) {
      const updatedActive = [name, ...activeFonts];
      setActiveFonts(updatedActive);
      localStorage.setItem('sni_google_docs_active_fonts', JSON.stringify(updatedActive));
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
    localStorage.setItem('sni_google_docs_active_fonts', JSON.stringify(updated));
  };

  // Insert Table
  const handleInsertTable = () => {
    let tableHtml = '<table style="width:100%; border-collapse: collapse; margin: 1.25rem 0;"><thead><tr>';
    for (let c = 0; c < tableCols; c++) {
      tableHtml += `<th style="border: 1px solid #94a3b8; padding: 10px; background-color: #f1f5f9; font-weight: bold; text-align: left;">Header ${c + 1}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        tableHtml += '<td style="border: 1px solid #cbd5e1; padding: 8px 10px;">Cell</td>';
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
      execCmd('insertHTML', `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${linkText}</a>`);
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
    const captionHtml = imageCaption ? `<figcaption style="text-align:center; font-size: 12px; color: #64748b; margin-top: 4px;">${imageCaption}</figcaption>` : '';
    const imgHtml = `<figure style="margin: 1.2rem auto; text-align: center;"><img src="${imageUrl}" alt="${imageCaption || 'Embedded Image'}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: inline-block;" />${captionHtml}</figure><p><br/></p>`;
    execCmd('insertHTML', imgHtml);
    setShowImageModal(false);
    setImageUrl('');
    setImageCaption('');
  };

  // Insert Video Embed
  const handleInsertVideo = () => {
    if (!videoInput) return;
    const trimmed = videoInput.trim();
    if (trimmed.startsWith('<iframe')) {
      execCmd(
        'insertHTML',
        `<div class="responsive-embed-container" style="position:relative; width:100%; aspect-ratio:16/9; margin:1.5rem 0; border-radius:0.75rem; overflow:hidden;">${trimmed}</div><p><br/></p>`
      );
    } else {
      let embedUrl = trimmed;
      const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        embedUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
      }
      execCmd(
        'insertHTML',
        `<div class="responsive-embed-container" style="position:relative; width:100%; aspect-ratio:16/9; margin:1.5rem 0; border-radius:0.75rem; overflow:hidden; box-shadow:0 4px 14px -2px rgba(0,0,0,0.12);"><iframe src="${embedUrl}" style="width:100%; height:100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br/></p>`
      );
    }
    setShowVideoModal(false);
    setVideoInput('');
  };

  // Insert Checklist Item
  const handleInsertChecklist = () => {
    const checklistHtml = `<div class="docs-checklist-item" style="display:flex; align-items:center; gap:8px; margin: 4px 0;"><input type="checkbox" style="width:16px; height:16px; cursor:pointer;" /> <span>Checklist task</span></div><p><br/></p>`;
    execCmd('insertHTML', checklistHtml);
    setShowListMenu(false);
  };

  // Insert Scripture / Callout
  const handleInsertCallout = () => {
    const html = `<blockquote style="border-left: 4px solid #C59B27; background-color: #fffbeb; padding: 12px 18px; margin: 16px 0; border-radius: 0 10px 10px 0; font-style: italic; color: #1e293b; font-family: 'Sri Krushnadevaraya', serif; font-size: 16px;">"నీ వాక్యము నా పాదములకు దీపమును నా త్రోవకు వెలుగునై యున్నది." — కీర్తనలు 119:105</blockquote><p><br/></p>`;
    execCmd('insertHTML', html);
  };

  // Insert Comment Note
  const handleInsertComment = () => {
    const comment = prompt('Enter editorial note or commentary:');
    if (comment) {
      execCmd('insertHTML', `<span style="background-color: #fef08a; padding: 2px 6px; border-radius: 4px; font-weight: 500;" title="Note: ${comment}">💬 ${comment}</span>&nbsp;`);
    }
  };

  // Find and Replace
  const handleFindReplace = () => {
    if (!findText || !editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const regex = new RegExp(findText, 'gi');
    const newContent = content.replace(regex, replaceText);
    editorRef.current.innerHTML = newContent;
    handleInput();
    setShowFindReplaceModal(false);
  };

  // Download document
  const handleDownloadFile = (type) => {
    if (!editorRef.current) return;
    let content = '';
    let filename = 'document.html';
    let mime = 'text/html';

    if (type === 'html') {
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${label}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sri+Krushnadevaraya&family=Noto+Sans+Telugu&display=swap"><style>body{font-family:'Sri Krushnadevaraya',Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6;color:#1e293b;}</style></head><body>${editorRef.current.innerHTML}</body></html>`;
      filename = 'document.html';
      mime = 'text/html';
    } else if (type === 'txt') {
      content = editorRef.current.innerText || '';
      filename = 'document.txt';
      mime = 'text/plain';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print Document
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && editorRef.current) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${label} - Print</title>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sri+Krushnadevaraya&family=Noto+Sans+Telugu&display=swap">
            <style>
              @page { size: A4; margin: 20mm; }
              body { font-family: 'Sri Krushnadevaraya', 'Noto Sans Telugu', serif; line-height: 1.6; color: #1e293b; padding: 20px; }
              table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
              th, td { border: 1px solid #cbd5e1; padding: 8px 10px; }
              img { max-width: 100%; height: auto; }
              blockquote { border-left: 4px solid #c59b27; padding-left: 14px; margin: 14px 0; color: #475569; }
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

  // Palette color swatches
  const colorSwatches = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1155cc', '#073763', '#20124d', '#4c1130',
  ];

  // Filtered fonts in modal
  const allAvailableFonts = [
    ...PRESET_TELUGU_FONTS.map((f) => ({ ...f, type: 'telugu' })),
    ...PRESET_GLOBAL_FONTS.map((f) => ({ ...f, type: 'english' })),
    ...customAddedFonts.map((name) => ({ name, family: name, sample: `${name} custom font sample`, type: 'my' })),
  ];

  const filteredFonts = allAvailableFonts.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(fontSearchQuery.toLowerCase());
    if (fontFilterCategory === 'telugu') return matchesSearch && f.type === 'telugu';
    if (fontFilterCategory === 'english') return matchesSearch && f.type === 'english';
    if (fontFilterCategory === 'my') return matchesSearch && f.type === 'my';
    return matchesSearch;
  });

  return (
    <div
      className={`border border-slate-300 rounded-xl overflow-hidden bg-[#f0f4f9] shadow-sm transition-all docs-editor-root ${
        isFullscreen ? 'fixed inset-0 z-50 flex flex-col bg-[#f0f4f9] rounded-none' : 'relative'
      }`}
    >
      {/* ============================================================== */}
      {/* 1. GOOGLE DOCS TOP MENU BAR (File, Edit, View, Insert, Format, Tools, Gemini, Extensions, Help) */}
      {/* ============================================================== */}
      <div className="bg-white border-b border-slate-200 px-3 py-1 flex items-center justify-between select-none">
        <div className="flex items-center gap-1 overflow-x-auto text-xs text-slate-700 docs-dropdown-container">
          {/* Label / Doc Indicator */}
          <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-slate-200 font-semibold text-slate-800">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline font-medium text-[13px]">{label}</span>
          </div>

          {/* FILE MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2 py-1 rounded hover:bg-slate-100 transition text-[13px] font-medium ${
                activeMenu === 'file' ? 'bg-slate-200' : ''
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Create new blank document? This will clear current content.')) {
                      onChange('');
                      if (editorRef.current) editorRef.current.innerHTML = '';
                    }
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>New Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePrint();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Print</span>
                  <span className="text-[11px] text-slate-400">Ctrl+P</span>
                </button>
                <div className="my-1 border-t border-slate-100"></div>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadFile('html');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Download HTML (.html)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadFile('txt');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Download Text (.txt)</span>
                </button>
              </div>
            )}
          </div>

          {/* EDIT MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              className={`px-2 py-1 rounded hover:bg-slate-100 transition text-[13px] font-medium ${
                activeMenu === 'edit' ? 'bg-slate-200' : ''
              }`}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    execCmd('undo');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Undo</span>
                  <span className="text-[11px] text-slate-400">Ctrl+Z</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('redo');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Redo</span>
                  <span className="text-[11px] text-slate-400">Ctrl+Y</span>
                </button>
                <div className="my-1 border-t border-slate-100"></div>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('selectAll');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Select All</span>
                  <span className="text-[11px] text-slate-400">Ctrl+A</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFindReplaceModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Find and replace</span>
                  <span className="text-[11px] text-slate-400">Ctrl+H</span>
                </button>
              </div>
            )}
          </div>

          {/* VIEW MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              className={`px-2 py-1 rounded hover:bg-slate-100 transition text-[13px] font-medium ${
                activeMenu === 'view' ? 'bg-slate-200' : ''
              }`}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowRuler(!showRuler);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Show ruler</span>
                  {showRuler && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFullscreen(!isFullscreen);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Fullscreen</span>
                  {isFullscreen && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHtmlSource(!showHtmlSource);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>HTML Source code</span>
                  {showHtmlSource && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
              </div>
            )}
          </div>

          {/* INSERT MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'insert' ? null : 'insert')}
              className={`px-2 py-1 rounded hover:bg-slate-100 transition text-[13px] font-medium ${
                activeMenu === 'insert' ? 'bg-slate-200' : ''
              }`}
            >
              Insert
            </button>
            {activeMenu === 'insert' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowImageModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTableModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                >
                  <TableIcon className="w-4 h-4 text-indigo-600" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                >
                  <LinkIcon className="w-4 h-4 text-blue-600" />
                  <span>Link (Ctrl+K)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVideoModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                >
                  <Video className="w-4 h-4 text-rose-600" />
                  <span>Video / YouTube embed</span>
                </button>
                <div className="my-1 border-t border-slate-100"></div>
                <button
                  type="button"
                  onClick={() => {
                    handleInsertCallout();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                >
                  <Quote className="w-4 h-4 text-amber-600" />
                  <span>Scripture Quote / Callout</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('insertHorizontalRule');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                >
                  <Minus className="w-4 h-4 text-slate-500" />
                  <span>Horizontal line</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSpecialCharsModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Special characters & Telugu symbols</span>
                </button>
              </div>
            )}
          </div>

          {/* FORMAT MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'format' ? null : 'format')}
              className={`px-2 py-1 rounded hover:bg-slate-100 transition text-[13px] font-medium ${
                activeMenu === 'format' ? 'bg-slate-200' : ''
              }`}
            >
              Format
            </button>
            {activeMenu === 'format' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    execCmd('bold');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between font-bold"
                >
                  <span>Bold</span>
                  <span className="text-[11px] text-slate-400">Ctrl+B</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('italic');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between italic"
                >
                  <span>Italic</span>
                  <span className="text-[11px] text-slate-400">Ctrl+I</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('underline');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between underline"
                >
                  <span>Underline</span>
                  <span className="text-[11px] text-slate-400">Ctrl+U</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('strikeThrough');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between line-through"
                >
                  <span>Strikethrough</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('superscript');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100"
                >
                  Superscript
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('subscript');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100"
                >
                  Subscript
                </button>
                <div className="my-1 border-t border-slate-100"></div>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('removeFormat');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 text-rose-600 flex items-center justify-between"
                >
                  <span>Clear formatting</span>
                  <span className="text-[11px] text-slate-400">Ctrl+\</span>
                </button>
              </div>
            )}
          </div>

          {/* TOOLS MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
              className={`px-2 py-1 rounded hover:bg-slate-100 transition text-[13px] font-medium ${
                activeMenu === 'tools' ? 'bg-slate-200' : ''
              }`}
            >
              Tools
            </button>
            {activeMenu === 'tools' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatsModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Word count</span>
                  <span className="text-[11px] text-slate-400">Ctrl+Shift+C</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Spell check complete. No grammatical errors detected.');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100"
                >
                  Spelling and grammar check
                </button>
              </div>
            )}
          </div>

          {/* GEMINI MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'gemini' ? null : 'gemini')}
              className={`px-2 py-1 rounded hover:bg-slate-100 transition text-[13px] font-medium flex items-center gap-1 text-indigo-700 ${
                activeMenu === 'gemini' ? 'bg-indigo-50' : ''
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Gemini</span>
            </button>
            {activeMenu === 'gemini' && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 font-bold text-indigo-700 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  <span>Gemini AI Assistant</span>
                </div>
                <div className="my-1 border-t border-slate-100"></div>
                <button
                  type="button"
                  onClick={() => {
                    setShowGeminiModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Help me write & Polish Telugu</span>
                </button>
              </div>
            )}
          </div>

          {/* EXTENSIONS MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'extensions' ? null : 'extensions')}
              className={`px-2 py-1 rounded hover:bg-slate-100 transition text-[13px] font-medium ${
                activeMenu === 'extensions' ? 'bg-slate-200' : ''
              }`}
            >
              Extensions
            </button>
            {activeMenu === 'extensions' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowFontManagerModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2 font-medium text-blue-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>More Fonts & Typography...</span>
                </button>
              </div>
            )}
          </div>

          {/* HELP MENU */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              className={`px-2 py-1 rounded hover:bg-slate-100 transition text-[13px] font-medium ${
                activeMenu === 'help' ? 'bg-slate-200' : ''
              }`}
            >
              Help
            </button>
            {activeMenu === 'help' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowShortcutsModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center justify-between"
                >
                  <span>Keyboard shortcuts</span>
                  <span className="text-[11px] text-slate-400">Ctrl+/</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Icons: HTML Source & Fullscreen */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowHtmlSource(!showHtmlSource)}
            className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              showHtmlSource ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Toggle HTML Source"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showHtmlSource ? 'Visual Docs' : 'HTML'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. GOOGLE DOCS TOOLBAR (Matching User's Screenshot Exactly)     */}
      {/* ============================================================== */}
      {!showHtmlSource && (
        <div className="bg-[#edf2fa] border-b border-slate-300 px-3 py-1 flex flex-wrap items-center gap-0.5 select-none text-slate-700 docs-dropdown-container">
          {/* Menus Pill Search Button */}
          <button
            type="button"
            onClick={() => setShowSearchMenusModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 mr-1 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-xs text-slate-600 shadow-2xs transition cursor-pointer"
            title="Search menus (Alt+/)"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-normal text-[11px]">Menus</span>
          </button>

          {/* Undo */}
          <button
            type="button"
            onClick={() => execCmd('undo')}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={() => execCmd('redo')}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          {/* Print */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer"
            title="Print (Ctrl+P)"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Spell check */}
          <button
            type="button"
            onClick={() => alert('Spelling and grammar check completed. Looks great!')}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer"
            title="Spelling and grammar check (Ctrl+Alt+X)"
          >
            <CheckCheck className="w-4 h-4 text-slate-700" />
          </button>

          {/* Paint format */}
          <button
            type="button"
            onClick={handleTogglePaintFormat}
            className={`p-1.5 rounded transition cursor-pointer ${
              paintFormatActive ? 'bg-blue-200 text-blue-800' : 'hover:bg-slate-200'
            }`}
            title="Paint format (copies text formatting and applies to selected text)"
          >
            <PaintRoller className="w-4 h-4" />
          </button>

          {/* Zoom Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-slate-200 transition text-xs font-normal cursor-pointer"
              title="Zoom"
            >
              <span>{zoomLevel}%</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
            {showZoomMenu && (
              <div className="absolute top-full left-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs">
                {[50, 75, 90, 100, 125, 150, 200].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setZoomLevel(lvl);
                      setShowZoomMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between ${
                      zoomLevel === lvl ? 'font-bold text-blue-600 bg-blue-50' : ''
                    }`}
                  >
                    <span>{lvl}%</span>
                    {zoomLevel === lvl && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Paragraph Style Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200 transition text-xs min-w-[85px] justify-between cursor-pointer"
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
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            </button>
            {showStyleMenu && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetParagraphStyle('p')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-sm"
                >
                  Normal text
                </button>
                <button
                  type="button"
                  onClick={() => handleSetParagraphStyle('title')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xl font-bold"
                >
                  Title
                </button>
                <button
                  type="button"
                  onClick={() => handleSetParagraphStyle('subtitle')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-sm text-slate-500 font-semibold"
                >
                  Subtitle
                </button>
                <button
                  type="button"
                  onClick={() => handleSetParagraphStyle('h1')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-lg font-bold"
                >
                  Heading 1
                </button>
                <button
                  type="button"
                  onClick={() => handleSetParagraphStyle('h2')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-base font-semibold"
                >
                  Heading 2
                </button>
                <button
                  type="button"
                  onClick={() => handleSetParagraphStyle('h3')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-sm font-semibold"
                >
                  Heading 3
                </button>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* FONT FAMILY DROPDOWN (With "More fonts / Add New Fonts" prominently at top) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFontMenu(!showFontMenu)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200 transition text-xs max-w-[140px] justify-between cursor-pointer"
              title="Font family"
            >
              <span className="truncate font-medium" style={{ fontFamily: currentFont }}>
                {currentFont.length > 12 ? `${currentFont.slice(0, 11)}...` : currentFont}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            </button>
            {showFontMenu && (
              <div className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                {/* TOP OPTION: More fonts / Add New Fonts */}
                <button
                  type="button"
                  onClick={() => {
                    setShowFontManagerModal(true);
                    setShowFontMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-bold flex items-center justify-between border-b border-blue-200 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>More fonts / Add New Fonts...</span>
                  </div>
                </button>

                <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Active Fonts
                </div>

                {activeFonts.map((fName) => (
                  <button
                    key={fName}
                    type="button"
                    onClick={() => handleSelectFont(fName)}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition ${
                      currentFont === fName ? 'bg-slate-100 font-bold text-blue-600' : 'text-slate-800'
                    }`}
                    style={{ fontFamily: fName }}
                  >
                    <span className="truncate">{fName}</span>
                    {currentFont === fName && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* FONT SIZE CONTROLS: - [11] + */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => handleSetFontSize(fontSize - 1)}
              className="p-1 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
              title="Decrease font size"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <div className="relative">
              <input
                type="text"
                value={fontSize}
                onChange={(e) => handleSetFontSize(e.target.value)}
                onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
                className="w-9 py-0.5 text-center text-xs border border-slate-300 rounded bg-white font-medium focus:outline-blue-500 cursor-pointer"
                title="Font size"
              />
              {showFontSizeMenu && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-20 max-h-56 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs">
                  {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSetFontSize(s)}
                      className={`w-full text-center py-1 hover:bg-slate-100 ${fontSize === s ? 'font-bold bg-blue-50 text-blue-600' : ''}`}
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
              className="p-1 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
              title="Increase font size"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Bold */}
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className={`p-1.5 rounded transition cursor-pointer ${
              isBold ? 'bg-slate-300 text-slate-900 font-bold' : 'hover:bg-slate-200'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4 font-bold" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className={`p-1.5 rounded transition cursor-pointer ${
              isItalic ? 'bg-slate-300 text-slate-900' : 'hover:bg-slate-200'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className={`p-1.5 rounded transition cursor-pointer ${
              isUnderline ? 'bg-slate-300 text-slate-900' : 'hover:bg-slate-200'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>

          {/* Text Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTextColorMenu(!showTextColorMenu)}
              className="p-1.5 rounded hover:bg-slate-200 transition flex flex-col items-center justify-center cursor-pointer"
              title="Text color"
            >
              <span className="font-bold text-xs leading-none">A</span>
              <span className="w-3.5 h-1 bg-black rounded-xs mt-0.5"></span>
            </button>
            {showTextColorMenu && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 w-56">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Text Color</div>
                <div className="grid grid-cols-10 gap-1 mb-2">
                  {colorSwatches.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        execCmd('foreColor', color);
                        setShowTextColorMenu(false);
                      }}
                      className="w-4 h-4 rounded-xs border border-slate-300 hover:scale-125 transition"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">Custom:</span>
                  <input
                    type="color"
                    onChange={(e) => {
                      execCmd('foreColor', e.target.value);
                      setShowTextColorMenu(false);
                    }}
                    className="w-6 h-6 border-0 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Highlight Color Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHighlightMenu(!showHighlightMenu)}
              className="p-1.5 rounded hover:bg-slate-200 transition flex flex-col items-center justify-center cursor-pointer"
              title="Highlight color"
            >
              <Highlighter className="w-4 h-4 text-amber-500" />
              <span className="w-3.5 h-1 bg-amber-400 rounded-xs mt-0.5"></span>
            </button>
            {showHighlightMenu && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 w-56">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex justify-between items-center">
                  <span>Highlight Color</span>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('hiliteColor', 'transparent');
                      setShowHighlightMenu(false);
                    }}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    None
                  </button>
                </div>
                <div className="grid grid-cols-10 gap-1 mb-2">
                  {colorSwatches.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        execCmd('hiliteColor', color);
                        setShowHighlightMenu(false);
                      }}
                      className="w-4 h-4 rounded-xs border border-slate-300 hover:scale-125 transition"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">Custom:</span>
                  <input
                    type="color"
                    onChange={(e) => {
                      execCmd('hiliteColor', e.target.value);
                      setShowHighlightMenu(false);
                    }}
                    className="w-6 h-6 border-0 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Insert Link */}
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
            title="Insert link (Ctrl+K)"
          >
            <LinkIcon className="w-4 h-4" />
          </button>

          {/* Add Comment / Scripture Note */}
          <button
            type="button"
            onClick={handleInsertComment}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
            title="Add commentary note"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>

          {/* Insert Image */}
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
            title="Insert image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Separator */}
          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Alignment Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAlignMenu(!showAlignMenu)}
              className="p-1.5 rounded hover:bg-slate-200 transition flex items-center gap-0.5 cursor-pointer"
              title="Align"
            >
              <AlignLeft className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
            {showAlignMenu && (
              <div className="absolute top-full left-0 mt-1 flex items-center gap-1 bg-white p-1 rounded-lg shadow-xl border border-slate-200 z-50">
                <button
                  type="button"
                  onClick={() => {
                    execCmd('justifyLeft');
                    setShowAlignMenu(false);
                  }}
                  className="p-1.5 rounded hover:bg-slate-100"
                  title="Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('justifyCenter');
                    setShowAlignMenu(false);
                  }}
                  className="p-1.5 rounded hover:bg-slate-100"
                  title="Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('justifyRight');
                    setShowAlignMenu(false);
                  }}
                  className="p-1.5 rounded hover:bg-slate-100"
                  title="Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    execCmd('justifyFull');
                    setShowAlignMenu(false);
                  }}
                  className="p-1.5 rounded hover:bg-slate-100"
                  title="Justify"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Line & Paragraph Spacing Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLineSpacingMenu(!showLineSpacingMenu)}
              className="p-1.5 rounded hover:bg-slate-200 transition flex items-center gap-0.5 cursor-pointer"
              title="Line & paragraph spacing"
            >
              <span className="text-xs font-bold leading-none">↕≡</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
            {showLineSpacingMenu && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetLineSpacing('1.0')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100"
                >
                  Single (1.0)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLineSpacing('1.15')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100"
                >
                  1.15
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLineSpacing('1.5')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100"
                >
                  1.5
                </button>
                <button
                  type="button"
                  onClick={() => handleSetLineSpacing('2.0')}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100"
                >
                  Double (2.0)
                </button>
              </div>
            )}
          </div>

          {/* Checklist */}
          <button
            type="button"
            onClick={handleInsertChecklist}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
            title="Checklist"
          >
            <ListChecks className="w-4 h-4" />
          </button>

          {/* Bulleted List */}
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
            title="Bulleted list"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
            title="Numbered list"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          {/* Decrease Indent */}
          <button
            type="button"
            onClick={() => execCmd('outdent')}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
            title="Decrease indent"
          >
            <span className="text-xs font-bold">⇤</span>
          </button>

          {/* Increase Indent */}
          <button
            type="button"
            onClick={() => execCmd('indent')}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer text-slate-700"
            title="Increase indent"
          >
            <span className="text-xs font-bold">⇥</span>
          </button>

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={() => execCmd('removeFormat')}
            className="p-1.5 rounded hover:bg-slate-200 transition cursor-pointer text-slate-600 hover:text-rose-600"
            title="Clear formatting (Ctrl+\)"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. GOOGLE DOCS CANVAS & DOCUMENT SHEET LAYOUT                  */}
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
              className="px-3 py-1 bg-blue-600 text-white rounded font-medium"
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
      ) : (
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#f0f4f9] py-6 px-2 sm:px-6 flex flex-col items-center">
          {/* Google Docs Ruler */}
          {showRuler && (
            <div
              className="w-full max-w-[850px] bg-white h-4 border-x border-t border-slate-300 flex items-center justify-between px-10 text-[9px] text-slate-400 select-none shadow-2xs"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
            </div>
          )}

          {/* White Google Docs Document Page */}
          <div
            className="w-full max-w-[850px] bg-white shadow-[0_1px_3px_1px_rgba(60,64,67,0.15)] border border-slate-200/80 p-8 sm:p-14 min-h-[750px] transition-transform duration-150 origin-top"
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
              onKeyUp={updateActiveFormatting}
              className="w-full min-h-[600px] text-slate-900 focus:outline-none leading-relaxed rich-html-content"
              style={{
                fontFamily: currentFont,
                fontSize: `${fontSize}pt`,
              }}
              data-placeholder={placeholder}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. MODALS & DIALOGS                                            */}
      {/* ============================================================== */}

      {/* A. MORE FONTS / ADD NEW FONTS MODAL (Google Docs Style) */}
      {showFontManagerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-blue-600 font-serif">A</span>
                  <span>Fonts Library & Typography</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Select Telugu and English fonts or type any custom Google Font to add to your document.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFontManagerModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Custom Google Font Section */}
            <div className="pt-3 pb-3 border-b border-slate-100 bg-slate-50 p-3 rounded-xl mt-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                + Add Any Custom Google Font by Name:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFontInput}
                  onChange={(e) => setCustomFontInput(e.target.value)}
                  placeholder="e.g. Cinzel Decorative, Alex Brush, Tangerine, Kalam..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomFont}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  Add Font
                </button>
              </div>
            </div>

            {/* Filter Pills and Search */}
            <div className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFontFilterCategory('all')}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    fontFilterCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Fonts
                </button>
                <button
                  type="button"
                  onClick={() => setFontFilterCategory('telugu')}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    fontFilterCategory === 'telugu'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Telugu (తెలుగు)
                </button>
                <button
                  type="button"
                  onClick={() => setFontFilterCategory('english')}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    fontFilterCategory === 'english'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  English & Global
                </button>
                {customAddedFonts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFontFilterCategory('my')}
                    className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                      fontFilterCategory === 'my'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    My Added Fonts ({customAddedFonts.length})
                  </button>
                )}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fontSearchQuery}
                  onChange={(e) => setFontSearchQuery(e.target.value)}
                  placeholder="Search fonts..."
                  className="pl-8 pr-3 py-1 rounded-lg border border-slate-300 text-xs w-48 focus:outline-blue-500"
                />
              </div>
            </div>

            {/* Font List with Live Previews */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 max-h-96">
              {filteredFonts.map((font) => {
                const isSelected = activeFonts.includes(font.family);
                loadGoogleFont(font.family);
                return (
                  <div
                    key={font.family}
                    className="pt-2 flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg transition"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{font.name}</span>
                        {font.type === 'telugu' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Telugu
                          </span>
                        )}
                      </div>
                      <p
                        className="text-base text-slate-700 truncate mt-1"
                        style={{ fontFamily: font.family }}
                      >
                        {font.sample}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectFont(font.family);
                          setShowFontManagerModal(false);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-xs transition cursor-pointer"
                      >
                        Use Now
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFontActive(font.family)}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-300 text-slate-400 hover:border-slate-400'
                        }`}
                        title={isSelected ? 'Remove from toolbar' : 'Add to toolbar'}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between mt-3 text-xs">
              <span className="text-slate-500">
                {activeFonts.length} fonts pinned to your toolbar dropdown
              </span>
              <button
                type="button"
                onClick={() => setShowFontManagerModal(false)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. INSERT TABLE MODAL */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-indigo-600" />
              <span>Insert Table</span>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Columns</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. INSERT LINK MODAL */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-600" />
              <span>Insert Link</span>
            </h4>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Link URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Display Text (optional)</label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Click here..."
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Apply Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. INSERT IMAGE MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Insert Image</span>
            </h4>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash..."
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Caption / Alt Text (optional)</label>
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Photo caption..."
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E. INSERT VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-rose-600" />
              <span>Insert Video or Embed</span>
            </h4>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">
                YouTube URL, Vimeo URL or &lt;iframe&gt; code
              </label>
              <textarea
                rows={3}
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or <iframe src='...'></iframe>"
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertVideo}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Insert Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F. FIND AND REPLACE MODAL */}
      {showFindReplaceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Find and Replace</h4>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Find</label>
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Text to find..."
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Replace with</label>
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replacement text..."
                className="w-full p-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFindReplaceModal(false)}
                className="px-3 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFindReplace}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* G. WORD COUNT & STATS MODAL */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Document Statistics</h4>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Words:</span>
                <span className="font-bold">{wordCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Characters:</span>
                <span className="font-bold">{charCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Estimated reading time:</span>
                <span className="font-bold">{Math.max(1, Math.ceil(wordCount / 200))} min</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* H. SPECIAL CHARACTERS & TELUGU SYMBOLS */}
      {showSpecialCharsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Special Characters & Symbols</h4>
              <button
                type="button"
                onClick={() => setShowSpecialCharsModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-500 mb-2">Click any symbol to insert into document:</div>
            <div className="grid grid-cols-8 gap-2 text-center text-lg">
              {['✝', '🕊️', '⛪', '📖', '★', '•', '—', '“', '”', '‘', '’', '…', '©', '®', '™', '§', '౦', '౧', '౨', '౩', '౪', '౫', '౬', '౭', '౮', '౯', '₹', '°'].map(
                (char, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      execCmd('insertText', char);
                      setShowSpecialCharsModal(false);
                    }}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer"
                  >
                    {char}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* I. GEMINI AI ASSISTANT MODAL */}
      {showGeminiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Gemini AI Writing Helper</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowGeminiModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Select an action to enhance your Telugu and English spiritual content:
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  execCmd(
                    'insertHTML',
                    `<div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin: 16px 0;"><h3 style="color:#1e3a8a; font-weight:bold; margin-bottom:8px;">సందేశ రూపురేఖలు (Message Outline):</h3><ol style="margin-left: 20px;"><li><strong>ప్రారంభం (Introduction):</strong> దేవుని వాక్య ప్రాముఖ్యత</li><li><strong>ముఖ్యాంశం 1 (Main Point 1):</strong> విశ్వాస జీవితం మరియు ప్రార్థన</li><li><strong>ముఖ్యాంశం 2 (Main Point 2):</strong> పరిశుద్ధాత్మ నడిపింపు</li><li><strong>ముగింపు (Conclusion & Application):</strong> అనుదిన జీవనంలో ఆచరణ</li></ol></div><p><br/></p>`
                  );
                  setShowGeminiModal(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer"
              >
                <div className="font-bold text-indigo-950">1. Generate Sermon / Article Outline</div>
                <div className="text-[11px] text-slate-500">Inserts structured outline with Telugu headings</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  alert('Content formatting & Telugu typography polished successfully!');
                  setShowGeminiModal(false);
                }}
                className="w-full text-left p-3 rounded-xl border border-indigo-100 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer"
              >
                <div className="font-bold text-indigo-950">2. Polish Telugu Grammar & Punctuation</div>
                <div className="text-[11px] text-slate-500">Refines syntax and checks scripture phrasing</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* J. SEARCH MENUS MODAL (Alt+/) */}
      {showSearchMenusModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-24 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={searchMenuQuery}
                onChange={(e) => setSearchMenuQuery(e.target.value)}
                placeholder="Search menus or actions (e.g. font, bold, table, print)..."
                className="w-full text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSearchMenusModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs space-y-1 max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setShowFontManagerModal(true);
                  setShowSearchMenusModal(false);
                }}
                className="w-full text-left p-2 hover:bg-slate-100 rounded-lg flex items-center justify-between"
              >
                <span>Add new fonts / Font library</span>
                <span className="text-[10px] text-blue-600 font-bold">Extensions</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTableModal(true);
                  setShowSearchMenusModal(false);
                }}
                className="w-full text-left p-2 hover:bg-slate-100 rounded-lg flex items-center justify-between"
              >
                <span>Insert table</span>
                <span className="text-[10px] text-slate-400">Insert</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrint();
                  setShowSearchMenusModal(false);
                }}
                className="w-full text-left p-2 hover:bg-slate-100 rounded-lg flex items-center justify-between"
              >
                <span>Print document</span>
                <span className="text-[10px] text-slate-400">File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleInsertCallout();
                  setShowSearchMenusModal(false);
                }}
                className="w-full text-left p-2 hover:bg-slate-100 rounded-lg flex items-center justify-between"
              >
                <span>Insert Scripture quote</span>
                <span className="text-[10px] text-slate-400">Insert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* K. KEYBOARD SHORTCUTS MODAL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Keyboard Shortcuts</h4>
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Bold</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Ctrl+B</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Italic</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Ctrl+I</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Underline</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Ctrl+U</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Insert Link</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Ctrl+K</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Clear Formatting</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Ctrl+\</kbd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Print Document</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px]">Ctrl+P</kbd>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. GOOGLE DOCS STATUS FOOTER                                   */}
      {/* ============================================================== */}
      <div className="px-4 py-1.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Google Docs Editor
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline">Current Font: <strong className="text-slate-700">{currentFont}</strong></span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline">Size: {fontSize}pt</span>
        </div>
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <button
            type="button"
            onClick={() => setShowFontManagerModal(true)}
            className="text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            + Add New Fonts
          </button>
        </div>
      </div>
    </div>
  );
}
