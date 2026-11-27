import { useEffect, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

export default function NotionEditor({
  initialContent = '',
  onChange,
  editable = true,
  placeholder = "Type '/' for commands or start typing...",
}) {
  const [initialBlocks, setInitialBlocks] = useState(undefined);
  const [ready, setReady] = useState(false);

  // Initialize editor
  const editor = useCreateBlockNote({
    domAttributes: {
      editor: {
        class: 'notion-blocknote-editor',
      },
    },
  });

  // Load initial content (HTML or plain text or JSON) into editor
  useEffect(() => {
    if (!editor || ready) return;

    async function loadContent() {
      if (!initialContent) {
        setReady(true);
        return;
      }

      try {
        if (initialContent.startsWith('[') && initialContent.endsWith(']')) {
          const blocks = JSON.parse(initialContent);
          editor.replaceBlocks(editor.topLevelBlocks, blocks);
        } else if (/<[a-z][\s\S]*>/i.test(initialContent)) {
          const blocks = await editor.tryParseHTMLToBlocks(initialContent);
          if (blocks && blocks.length > 0) {
            editor.replaceBlocks(editor.topLevelBlocks, blocks);
          }
        } else {
          const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
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

  // Handle onChange: export to HTML
  const handleChange = async () => {
    if (!editor || !onChange) return;
    try {
      const html = await editor.blocksToHTMLLossy(editor.topLevelBlocks);
      onChange(html);
    } catch (e) {
      console.warn('Error converting blocks to HTML:', e);
    }
  };

  return (
    <div className="notion-editor-wrapper py-2 min-h-[300px]">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="light"
      />
    </div>
  );
}
