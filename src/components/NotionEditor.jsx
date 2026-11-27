import { useEffect, useState, useRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { cleanObjectReplacementChars, loadGoogleFont } from '../utils/fontManager';

export default function NotionEditor({
  initialContent = '',
  onChange,
  editable = true,
  placeholder = "Type '/' for commands or start typing...",
  fontFamily = 'Inter',
}) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef(null);

  // Initialize editor
  const editor = useCreateBlockNote({
    domAttributes: {
      editor: {
        class: 'notion-blocknote-editor',
      },
    },
  });

  // Load selected Google Font dynamically
  useEffect(() => {
    if (fontFamily) {
      loadGoogleFont(fontFamily);
    }
  }, [fontFamily]);

  // Clean and prevent [OBJ] characters on paste
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handlePaste = (e) => {
      try {
        const text = e.clipboardData?.getData('text/plain');
        if (text && /[\uFFFC\uFFFD\uFFF0-\uFFFF]/.test(text)) {
          e.preventDefault();
          const cleaned = cleanObjectReplacementChars(text);
          document.execCommand('insertText', false, cleaned);
        }
      } catch {}
    };

    el.addEventListener('paste', handlePaste, true);
    return () => {
      el.removeEventListener('paste', handlePaste, true);
    };
  }, []);

  // Load initial content (HTML or plain text or JSON) into editor, strictly cleaning [OBJ] chars
  useEffect(() => {
    if (!editor || ready) return;

    async function loadContent() {
      const sanitized = cleanObjectReplacementChars(initialContent || '');
      if (!sanitized) {
        setReady(true);
        return;
      }

      try {
        if (sanitized.startsWith('[') && sanitized.endsWith(']')) {
          const blocks = JSON.parse(sanitized);
          editor.replaceBlocks(editor.topLevelBlocks, blocks);
        } else if (/<[a-z][\s\S]*>/i.test(sanitized)) {
          const blocks = await editor.tryParseHTMLToBlocks(sanitized);
          if (blocks && blocks.length > 0) {
            editor.replaceBlocks(editor.topLevelBlocks, blocks);
          }
        } else {
          const blocks = await editor.tryParseMarkdownToBlocks(sanitized);
          if (blocks && blocks.length > 0) {
            editor.replaceBlocks(editor.topLevelBlocks, blocks);
          }
        }
      } catch (e) {
        console.warn('Error parsing initial content into BlockNote:', e);
      } finally {
        setReady(true);
      }
    }

    loadContent();
  }, [editor, initialContent, ready]);

  // Handle onChange: export to HTML and clean [OBJ] characters
  const handleChange = async () => {
    if (!editor || !onChange) return;
    try {
      const html = await editor.blocksToHTMLLossy(editor.topLevelBlocks);
      const cleaned = cleanObjectReplacementChars(html);
      onChange(cleaned);
    } catch (e) {
      console.warn('Error converting blocks to HTML:', e);
    }
  };

  return (
    <div
      ref={containerRef}
      className="notion-editor-wrapper py-2 min-h-[300px]"
      style={{ fontFamily: `'${fontFamily || 'Inter'}', sans-serif` }}
    >
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="light"
      />
    </div>
  );
}
