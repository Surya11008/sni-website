import { useState } from 'react';
import { ExternalLink, Copy, Check, Globe } from 'lucide-react';

/**
 * NotionLinkPreview
 * Authentic Notion-style Web Bookmark Card with live favicon, hostname, title, and quick copy/open actions.
 */
export default function NotionLinkPreview({
  url = '',
  title = '',
  description = '',
  imageUrl = '',
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  // Extract hostname for display and favicon
  let hostname = '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    hostname = parsed.hostname.replace(/^www\./, '');
  } catch {
    hostname = url;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  const displayTitle = title || hostname;
  const displayDesc = description || url;

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <a
      href={url.startsWith('http') ? url : `https://${url}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group my-3 block rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/80 transition-all shadow-xs hover:shadow-md overflow-hidden text-left no-underline ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col sm:flex-row items-stretch justify-between">
        {/* Content Column */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-1.5">
            {/* Favicon & Hostname Badge */}
            <div className="flex items-center gap-2">
              <img
                src={faviconUrl}
                alt=""
                className="w-4 h-4 rounded-xs shrink-0 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                {hostname}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
              {displayTitle}
            </h4>

            {/* Description */}
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {displayDesc}
            </p>
          </div>

          {/* Footer Bar: URL & Copy/Open Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-slate-100 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 truncate min-w-0">
              <Globe className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-xs">{url}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Copy link"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="p-1 text-slate-400 group-hover:text-amber-600 transition">
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnail Preview (if image provided) */}
        {imageUrl && (
          <div className="sm:w-48 md:w-56 bg-slate-100 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 overflow-hidden relative">
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 min-h-[100px]"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </a>
  );
}
