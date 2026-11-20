import { ExternalLink, Play } from 'lucide-react';

/**
 * RichContentRenderer
 * Renders structured markdown-like rich text into Tailwind styled HTML.
 * Supports:
 * - Headings (#, ##, ###)
 * - Blockquotes / Verse boxes (> text)
 * - Lists (- item, 1. item)
 * - Bold (**text**), Italic (*text*), Highlights (==text==)
 * - Links ([text](url))
 * - Images (![alt](url))
 * - YouTube Video embed helper
 */
export default function RichContentRenderer({ content = '', isTelugu = false, className = '' }) {
  if (!content) return null;

  // Check if content is HTML (from Google Docs copy-paste or Rich WYSIWYG Editor)
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  if (isHtml) {
    return (
      <div
        className={`rich-html-content text-slate-800 text-sm sm:text-base leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Split into blocks by double newlines or single newlines
  const lines = content.split('\n');

  const renderInline = (text) => {
    if (!text) return null;

    // Tokenize for bold, italic, highlights, links
    // 1. Links: [text](url)
    // 2. Bold: **text**
    // 3. Highlight: ==text==
    // 4. Italic: *text*
    
    // Quick regex replacer or parser
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', val: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'link', label: match[1], url: match[2] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push({ type: 'text', val: text.substring(lastIndex) });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'link') {
        const isExternal = part.url.startsWith('http');
        return (
          <a
            key={pIdx}
            href={part.url}
            target={isExternal ? '_blank' : '_self'}
            rel={isExternal ? 'noreferrer' : ''}
            className="text-[#C59B27] hover:underline font-semibold inline-flex items-center gap-1 mx-0.5"
          >
            <span>{part.label}</span>
            {isExternal && <ExternalLink className="w-3 h-3 inline" />}
          </a>
        );
      }

      // Format bold, italic, highlight in text
      let subText = part.val;
      // Replace highlights ==text== with custom markup
      const formattedParts = [];
      const splitTokens = subText.split(/(\*\*.*?\*\*|\*.*?\*|==.*?==)/g);

      splitTokens.forEach((token, tIdx) => {
        if (!token) return;
        if (token.startsWith('**') && token.endsWith('**')) {
          formattedParts.push(
            <strong key={tIdx} className="font-extrabold text-[#0F294A]">
              {token.slice(2, -2)}
            </strong>
          );
        } else if (token.startsWith('==') && token.endsWith('==')) {
          formattedParts.push(
            <mark key={tIdx} className="bg-amber-100/90 text-[#0F294A] px-1.5 py-0.5 rounded font-semibold border-b border-[#C59B27]">
              {token.slice(2, -2)}
            </mark>
          );
        } else if (token.startsWith('*') && token.endsWith('*')) {
          formattedParts.push(
            <em key={tIdx} className="italic text-slate-700">
              {token.slice(1, -1)}
            </em>
          );
        } else {
          formattedParts.push(token);
        }
      });

      return <span key={pIdx}>{formattedParts}</span>;
    });
  };

  // Group lines into blocks
  const blocks = [];
  let currentList = null;

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      return;
    }

    // Heading 1
    if (line.startsWith('# ')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'h1', content: line.slice(2) });
    }
    // Heading 2
    else if (line.startsWith('## ')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'h2', content: line.slice(3) });
    }
    // Heading 3
    else if (line.startsWith('### ')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'h3', content: line.slice(4) });
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'quote', content: line.slice(2) });
    }
    // Horizontal divider
    else if (line === '---' || line === '***') {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'hr' });
    }
    // Image: ![alt](url)
    else if (line.startsWith('![') && line.includes('](')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      const match = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (match) {
        blocks.push({ type: 'image', alt: match[1], url: match[2] });
      }
    }
    // Bullet list
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!currentList || currentList.type !== 'ul') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(line.slice(2));
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      if (!currentList || currentList.type !== 'ol') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(line.replace(/^\d+\.\s/, ''));
    }
    // Standard paragraph
    else {
      if (currentList) { blocks.push(currentList); currentList = null; }
      blocks.push({ type: 'p', content: line });
    }
  });

  if (currentList) {
    blocks.push(currentList);
  }

  return (
    <div className={`space-y-4 text-slate-800 text-sm sm:text-base leading-relaxed ${isTelugu ? 'font-telugu leading-loose' : ''} ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h2
                key={idx}
                className={`text-2xl sm:text-3xl font-extrabold text-[#0F294A] pt-4 pb-1 border-b border-slate-200 ${
                  isTelugu ? 'font-krishna text-3xl sm:text-4xl' : 'font-serif'
                }`}
              >
                {renderInline(block.content)}
              </h2>
            );
          case 'h2':
            return (
              <h3
                key={idx}
                className={`text-xl sm:text-2xl font-bold text-[#0F294A] pt-3 pb-1 text-[#C59B27] ${
                  isTelugu ? 'font-krishna text-2xl sm:text-3xl' : 'font-serif'
                }`}
              >
                {renderInline(block.content)}
              </h3>
            );
          case 'h3':
            return (
              <h4 key={idx} className="text-lg sm:text-xl font-bold text-slate-900 pt-2">
                {renderInline(block.content)}
              </h4>
            );
          case 'quote':
            return (
              <blockquote
                key={idx}
                className="my-3 p-4 sm:p-5 rounded-2xl bg-amber-50/70 border-l-4 border-[#C59B27] text-slate-800 font-medium italic shadow-xs"
              >
                <div className="flex items-start gap-2">
                  <span className="text-[#C59B27] text-2xl font-serif leading-none">“</span>
                  <div className="flex-1 not-italic font-normal">{renderInline(block.content)}</div>
                </div>
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={idx} className="list-disc list-outside pl-5 space-y-1.5 my-2">
                {block.items.map((item, i) => (
                  <li key={i} className="pl-1">
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal list-outside pl-5 space-y-1.5 my-2 font-medium">
                {block.items.map((item, i) => (
                  <li key={i} className="pl-1 font-normal">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );
          case 'image':
            return (
              <figure key={idx} className="my-5 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <img src={block.url} alt={block.alt} className="w-full max-h-[480px] object-cover" />
                {block.alt && (
                  <figcaption className="text-center text-xs text-slate-500 py-2 bg-slate-50">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );
          case 'hr':
            return <hr key={idx} className="my-6 border-slate-200" />;
          case 'p':
          default:
            return (
              <p key={idx} className="leading-relaxed">
                {renderInline(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
}
