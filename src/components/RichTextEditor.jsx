import { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
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
} from 'lucide-react';

export default function RichTextEditor({
  value = '',
  onChange,
  label = 'Content',
  placeholder = 'Type your article here or paste from Google Docs, Word, or web pages...',
  rows = 10,
}) {
  const editorRef = useRef(null);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [htmlSource, setHtmlSource] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [wordCount, setWordCount] = useState(0);

  // Sync incoming value to contentEditable div
  useEffect(() => {
    if (editorRef.current && !showHtmlSource) {
      if (editorRef.current.innerHTML !== value) {
        // If value is plain text without tags, convert newlines to <p>
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

  const calculateStats = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      calculateStats();
    }
  };

  // Execute formatting commands
  const execCmd = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Handle Pasting: Keep rich HTML structure from Google Docs, Word, or websites
  const handlePaste = (e) => {
    // When pasting into contentEditable, browser naturally takes the text/html clipboardData
    // We let it happen naturally and calculate stats immediately after
    setTimeout(() => {
      handleInput();
    }, 10);
  };

  // Insert Table
  const handleInsertTable = () => {
    let tableHtml = '<table style="width:100%; border-collapse: collapse; margin: 1rem 0;"><thead><tr>';
    for (let c = 0; c < tableCols; c++) {
      tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; font-weight: bold;">Header ${c + 1}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        tableHtml += '<td style="border: 1px solid #cbd5e1; padding: 8px;">Cell</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br/></p>';
    execCmd('insertHTML', tableHtml);
    setShowTableModal(false);
  };

  // Insert Link
  const handleInsertLink = () => {
    const url = prompt('Enter link URL (e.g. https://...):');
    if (url) {
      execCmd('createLink', url);
    }
  };

  // Insert Image
  const handleInsertImage = () => {
    const url = prompt('Enter Image URL (e.g. https://...):');
    if (url) {
      execCmd('insertHTML', `<img src="${url}" alt="Embedded Image" style="max-width:100%; border-radius: 12px; margin: 12px 0;" /><p><br/></p>`);
    }
  };

  // Insert Video / Embed Link (YouTube, Vimeo, Google Drive, or <iframe>)
  const handleInsertVideo = () => {
    const input = prompt('Enter Video URL (YouTube, Vimeo) or <iframe> embed code:');
    if (!input) return;
    const trimmed = input.trim();
    if (trimmed.startsWith('<iframe')) {
      execCmd(
        'insertHTML',
        `<div class="responsive-embed-container" style="position:relative; width:100%; aspect-ratio:16/9; margin:1.5rem 0; border-radius:1rem; overflow:hidden;">${trimmed}</div><p><br/></p>`
      );
    } else {
      let embedUrl = trimmed;
      const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch && ytMatch[1]) {
        embedUrl = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
      }
      execCmd(
        'insertHTML',
        `<div class="responsive-embed-container" style="position:relative; width:100%; aspect-ratio:16/9; margin:1.5rem 0; border-radius:1rem; overflow:hidden; box-shadow:0 4px 12px -2px rgba(0,0,0,0.1);"><iframe src="${embedUrl}" style="width:100%; height:100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br/></p>`
      );
    }
  };

  // Insert Blockquote / Callout
  const handleInsertCallout = () => {
    execCmd(
      'insertHTML',
      '<blockquote style="border-left: 4px solid #C59B27; background-color: #fffbeb; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0; font-style: italic; color: #334155;">Quote or Scripture passage here...</blockquote><p><br/></p>'
    );
  };

  // Toggle Source Code
  const handleToggleSource = () => {
    if (showHtmlSource) {
      // Apply source changes
      onChange(htmlSource);
      setShowHtmlSource(false);
    } else {
      setHtmlSource(editorRef.current?.innerHTML || '');
      setShowHtmlSource(true);
    }
  };

  return (
    <div
      className={`border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-xs transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col shadow-2xl' : 'relative'
      }`}
    >
      {/* Editor Header: Title + Features */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#F4B942]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {label}
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            (Supports Google Docs copy-paste with tables, bold, and colors)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleSource}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              showHtmlSource
                ? 'bg-[#F4B942] text-[#071B3B]'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
            title="Toggle HTML Source"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showHtmlSource ? 'Visual Editor' : 'HTML Source'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Formatting & Insert Toolbar */}
      {!showHtmlSource && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 text-slate-700 text-xs">
          {/* Headings */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                execCmd('formatBlock', `<${e.target.value}>`);
                e.target.value = '';
              }
            }}
            className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>Style</option>
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Text Formatting */}
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Bold"
          >
            <Bold className="w-4 h-4 font-bold" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('italic')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('underline')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Color Pickers */}
          <label className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer flex items-center gap-1" title="Text Color">
            <Palette className="w-4 h-4 text-slate-700" />
            <input
              type="color"
              onChange={(e) => execCmd('foreColor', e.target.value)}
              className="w-3.5 h-3.5 border-0 p-0 rounded cursor-pointer opacity-0 absolute"
            />
          </label>
          <label className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer flex items-center gap-1" title="Highlight Color">
            <Highlighter className="w-4 h-4 text-amber-500" />
            <input
              type="color"
              onChange={(e) => execCmd('hiliteColor', e.target.value)}
              className="w-3.5 h-3.5 border-0 p-0 rounded cursor-pointer opacity-0 absolute"
            />
          </label>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Alignment */}
          <button
            type="button"
            onClick={() => execCmd('justifyLeft')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyCenter')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyRight')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('justifyFull')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Lists */}
          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Insert Options (Google Docs Style) */}
          <button
            type="button"
            onClick={() => setShowTableModal(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white transition cursor-pointer font-semibold text-slate-800"
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4 text-indigo-600" />
            <span>Table</span>
          </button>

          <button
            type="button"
            onClick={handleInsertImage}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white transition cursor-pointer font-semibold text-slate-800"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span>Image</span>
          </button>

          <button
            type="button"
            onClick={handleInsertVideo}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white transition cursor-pointer font-semibold text-slate-800"
            title="Insert Video or Embed (YouTube, Vimeo, etc.)"
          >
            <Video className="w-4 h-4 text-rose-600" />
            <span>Video/Embed</span>
          </button>

          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4 text-blue-600" />
          </button>

          <button
            type="button"
            onClick={handleInsertCallout}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Insert Quote / Callout"
          >
            <Quote className="w-4 h-4 text-amber-600" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('insertHorizontalRule')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Horizontal Line"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('removeFormat')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer text-slate-500 hover:text-rose-600"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-300 mx-1"></div>

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => execCmd('undo')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => execCmd('redo')}
            className="p-1.5 hover:bg-white rounded-lg transition cursor-pointer"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor Body */}
      {showHtmlSource ? (
        <textarea
          rows={isFullscreen ? 28 : rows}
          value={htmlSource}
          onChange={(e) => setHtmlSource(e.target.value)}
          className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-50 focus:outline-none flex-1 resize-y"
          placeholder="Raw HTML code..."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          className={`w-full p-4 text-slate-800 text-sm focus:outline-none overflow-y-auto leading-relaxed rich-html-content ${
            isFullscreen ? 'flex-1' : ''
          }`}
          style={{ minHeight: `${rows * 26}px` }}
          data-placeholder={placeholder}
        />
      )}

      {/* Table Insertion Modal Dialog */}
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
                  className="w-full p-2 rounded-xl border border-slate-300"
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
                  className="w-full p-2 rounded-xl border border-slate-300"
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
                className="px-4 py-1.5 rounded-xl bg-[#071B3B] text-[#F4B942] font-bold text-xs uppercase shadow-sm cursor-pointer"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Footer: Word Count */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
        <span>Google Docs-grade rich paste enabled</span>
        <span>{wordCount} words</span>
      </div>
    </div>
  );
}
