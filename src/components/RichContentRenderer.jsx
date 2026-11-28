import { useEffect, useRef } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import { NotionLinkPreview, NotionEmbed, getEmbedInfo } from './notion';
import { cleanObjectReplacementChars, loadGoogleFont } from '../utils/fontManager';

/**
 * RichContentRenderer
 * Renders structured markdown-like rich text into responsive Tailwind styled HTML.
 * Supports:
 * - Headings (#, ##, ###)
 * - Blockquotes / Scripture passages (> text)
 * - Lists (- item, 1. item)
 * - Bold (**text**), Italic (*text*), Highlights (==text==)
 * - Links ([text](url))
 * - Images (![alt](url))
 * - Embedded Videos (YouTube / Vimeo / Video links)
 * - Notion Web Bookmarks & Live Embeds
 * - Raw HTML from Google Docs & BlockNote Rich Text Editor
 */
export default function RichContentRenderer({
  content = '',
  isTelugu = false,
  className = '',
  fontFamily = '',
  contentFontFamily = '',
}) {
  const activeFont = contentFontFamily || fontFamily || '';
  const rendererIdRef = useRef(`rich-renderer-${Math.random().toString(36).substr(2, 9)}`);
  const rendererId = rendererIdRef.current;

  useEffect(() => {
    if (activeFont) {
      loadGoogleFont(activeFont);
    }
  }, [activeFont]);

  if (!content) return null;

  // Clean [OBJ] (U+FFFC / U+FFFD) replacement characters completely
  let sanitizedContent = cleanObjectReplacementChars(content);
  if (!sanitizedContent) return null;

  // Remove all background highlights and <mark> tags completely (no background highlighter)
  sanitizedContent = sanitizedContent
    .replace(/(background-color|background)\s*:\s*[^;"]+;?/gi, '')
    .replace(/<mark\b[^>]*>([\s\S]*?)<\/mark>/gi, '$1');

  const fontStyle = activeFont ? { fontFamily: `'${activeFont}', sans-serif` } : undefined;

  // Check if content is HTML (from BlockNote or Google Docs)
  const isHtml = /<[a-z][\s\S]*>/i.test(sanitizedContent);
  if (isHtml) {
    return (
      <div
        id={rendererId}
        className={`rich-html-content text-[#050b14] font-medium text-base sm:text-lg leading-relaxed sm:leading-loose ${className}`}
        style={fontStyle}
      >
        <style>{`
          #${rendererId} {
            color: #050b14 !important;
            font-weight: 550;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          #${rendererId} p,
          #${rendererId} li,
          #${rendererId} td,
          #${rendererId} blockquote {
            color: #050b14 !important;
            font-weight: 550 !important;
            line-height: 1.9 !important;
            font-size: 1.125rem !important;
          }
          #${rendererId} span:not([style*="color: rgb(2"]):not([style*="color: #e"]):not([style*="color: #d"]):not([style*="color: #c"]):not([style*="color: red"]):not([style*="color: rgb(22"]):not([style*="color: rgb(23"]):not([style*="color: rgb(20"]) {
            color: #050b14 !important;
            font-weight: 550;
          }
          #${rendererId} [style*="color: rgb(2"],
          #${rendererId} [style*="color: #e"],
          #${rendererId} [style*="color: #d"],
          #${rendererId} [style*="color: #c"],
          #${rendererId} [style*="color: red"],
          #${rendererId} [style*="color: rgb(22"],
          #${rendererId} [style*="color: rgb(23"],
          #${rendererId} [style*="color: rgb(20"] {
            color: #b91c1c !important;
            font-weight: 700 !important;
          }
          #${rendererId} mark,
          #${rendererId} [style*="background"] {
            background-color: transparent !important;
            background: transparent !important;
          }
          #${rendererId} strong,
          #${rendererId} b {
            font-weight: 800 !important;
            color: #000000 !important;
          }
          ${activeFont ? `
            #${rendererId},
            #${rendererId} *,
            #${rendererId} p,
            #${rendererId} span,
            #${rendererId} div,
            #${rendererId} h1,
            #${rendererId} h2,
            #${rendererId} h3,
            #${rendererId} h4,
            #${rendererId} h5,
            #${rendererId} h6,
            #${rendererId} li,
            #${rendererId} blockquote,
            #${rendererId} table,
            #${rendererId} td,
            #${rendererId} th {
              font-family: '${activeFont}', sans-serif !important;
            }
          ` : ''}
        `}</style>
        <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
      </div>
    );
  }

  // Helper to extract YouTube video ID
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  // Helper to extract Vimeo video ID
  const getVimeoId = (url) => {
    if (!url) return null;
    const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    return match ? match[3] : null;
  };

  // Split into blocks by lines
  const lines = content.split('\n');

  const renderInline = (text) => {
    if (!text) return null;

    // Tokenize for links: [text](url)
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
            className="text-[#C59B27] hover:underline font-bold inline-flex items-center gap-1 mx-0.5 break-words"
          >
            <span>{part.label}</span>
            {isExternal && <ExternalLink className="w-3.5 h-3.5 inline shrink-0" />}
          </a>
        );
      }

      // Format bold, italic, highlight in text
      let subText = part.val;
      const splitTokens = subText.split(/(\*\*.*?\*\*|\*.*?\*|==.*?==)/g);

      return (
        <span key={pIdx}>
          {splitTokens.map((token, tIdx) => {
            if (!token) return null;
            if (token.startsWith('**') && token.endsWith('**')) {
              return (
                <strong key={tIdx} className="font-extrabold text-[#0F294A]">
                  {token.slice(2, -2)}
                </strong>
              );
            } else if (token.startsWith('==') && token.endsWith('==')) {
              return (
                <span
                  key={tIdx}
                  className="font-bold text-[#0F294A]"
                >
                  {token.slice(2, -2)}
                </span>
              );
            } else if (token.startsWith('*') && token.endsWith('*')) {
              return (
                <em key={tIdx} className="italic text-slate-700">
                  {token.slice(1, -1)}
                </em>
              );
            }
            return token;
          })}
        </span>
      );
    });
  };

  // Group lines into blocks
  const blocks = [];
  let currentList = null;

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      return;
    }

    // Standalone URL on a line: Automatic Notion Embed or Notion Web Bookmark
    if (line.startsWith('http://') || line.startsWith('https://')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      
      const ytId = getYouTubeId(line);
      if (ytId) {
        blocks.push({
          type: 'video',
          provider: 'youtube',
          embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
        });
        return;
      }

      const vimeoId = getVimeoId(line);
      if (vimeoId) {
        blocks.push({
          type: 'video',
          provider: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
        });
        return;
      }

      const embedInfo = getEmbedInfo(line);
      if (embedInfo.type === 'audio' || embedInfo.type === 'spotify' || embedInfo.type === 'pdf') {
        blocks.push({ type: 'embed', url: line, info: embedInfo });
        return;
      }

      // Default: Notion Web Bookmark preview card
      blocks.push({ type: 'bookmark', url: line });
      return;
    }

    // Explicit [embed](url)
    if (line.toLowerCase().startsWith('[embed](') && line.endsWith(')')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      const url = line.slice(8, -1).trim();
      blocks.push({ type: 'embed', url });
      return;
    }

    // Explicit [bookmark](url)
    if (line.toLowerCase().startsWith('[bookmark](') && line.endsWith(')')) {
      if (currentList) { blocks.push(currentList); currentList = null; }
      const url = line.slice(11, -1).trim();
      blocks.push({ type: 'bookmark', url });
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
    <div
      id={rendererId}
      className={`rich-content-container space-y-5 text-[#050b14] font-medium text-base sm:text-lg lg:text-xl leading-relaxed sm:leading-loose ${
        isTelugu && !activeFont ? 'font-telugu' : ''
      } ${className}`}
      style={fontStyle}
    >
      <style>{`
        #${rendererId} {
          color: #050b14 !important;
          font-weight: 550;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        #${rendererId} p,
        #${rendererId} li,
        #${rendererId} td,
        #${rendererId} blockquote {
          color: #050b14 !important;
          font-weight: 550 !important;
          line-height: 1.9 !important;
        }
        ${activeFont ? `
          #${rendererId},
          #${rendererId} *,
          #${rendererId} p,
          #${rendererId} span,
          #${rendererId} div,
          #${rendererId} h1,
          #${rendererId} h2,
          #${rendererId} h3,
          #${rendererId} h4,
          #${rendererId} h5,
          #${rendererId} h6,
          #${rendererId} li,
          #${rendererId} blockquote {
            font-family: '${activeFont}', sans-serif !important;
          }
        ` : ''}
      `}</style>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'video':
            return (
              <div
                key={idx}
                className="my-6 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 bg-black shadow-lg"
              >
                <div className="aspect-video w-full">
                  <iframe
                    src={block.embedUrl}
                    title="Embedded Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            );
          case 'bookmark':
            return <NotionLinkPreview key={idx} url={block.url} />;
          case 'embed':
            return <NotionEmbed key={idx} url={block.url} />;
          case 'h1':
            return (
              <h2
                key={idx}
                className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0F294A] pt-4 pb-2 border-b border-slate-200 leading-tight ${
                  isTelugu ? 'font-krishna' : 'font-serif'
                }`}
              >
                {renderInline(block.content)}
              </h2>
            );
          case 'h2':
            return (
              <h3
                key={idx}
                className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#C59B27] pt-3 pb-2 leading-tight ${
                  isTelugu ? 'font-krishna' : 'font-serif'
                }`}
              >
                {renderInline(block.content)}
              </h3>
            );
          case 'h3':
            return (
              <h4 key={idx} className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 pt-2 pb-1">
                {renderInline(block.content)}
              </h4>
            );
          case 'quote':
            return (
              <blockquote
                key={idx}
                className="my-4 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-amber-50/70 border-l-4 sm:border-l-6 border-[#C59B27] text-slate-800 font-medium italic shadow-xs text-base sm:text-lg lg:text-xl"
              >
                <div className="flex items-start gap-3">
                  <span className="text-[#C59B27] text-3xl sm:text-4xl font-serif leading-none select-none">“</span>
                  <div className="flex-1 not-italic font-normal">{renderInline(block.content)}</div>
                </div>
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={idx} className="list-disc list-outside pl-6 space-y-2 my-3 text-base sm:text-lg">
                {block.items.map((item, i) => (
                  <li key={i} className="pl-1">
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal list-outside pl-6 space-y-2 my-3 font-medium text-base sm:text-lg">
                {block.items.map((item, i) => (
                  <li key={i} className="pl-1 font-normal">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            );
          case 'image':
            return (
              <figure key={idx} className="my-6 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-md">
                <img
                  src={block.url}
                  alt={block.alt}
                  className="w-full max-h-[640px] lg:max-h-[800px] object-cover"
                />
                {block.alt && (
                  <figcaption className="text-center text-xs sm:text-sm text-slate-500 py-2.5 bg-slate-50 border-t border-slate-100">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );
          case 'hr':
            return <hr key={idx} className="my-8 border-slate-200" />;
          case 'p':
          default:
            return (
              <p key={idx} className="leading-relaxed sm:leading-loose">
                {renderInline(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
}
