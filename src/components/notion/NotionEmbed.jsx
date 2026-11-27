import { useState } from 'react';
import {
  Play,
  Music,
  FileText,
  Globe,
  ExternalLink,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
} from 'lucide-react';

/**
 * Helper to identify embed type and clean URLs
 */
export function getEmbedInfo(url = '') {
  if (!url) return { type: 'unknown', url: '' };

  const trimmed = url.trim();

  // 1. YouTube
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
      id: ytMatch[1],
      thumbnail: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`,
    };
  }

  // 2. Vimeo
  const vimeoMatch = trimmed.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/
  );
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}`,
      id: vimeoMatch[3],
    };
  }

  // 3. Spotify
  if (trimmed.includes('open.spotify.com/')) {
    const spotifyPath = trimmed.split('open.spotify.com/')[1];
    return {
      type: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${spotifyPath}`,
    };
  }

  // 4. Google Drive / Docs / Sheets / Slides / Forms
  if (trimmed.includes('drive.google.com/file/d/')) {
    const fileId = trimmed.match(/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
    if (fileId) {
      return {
        type: 'pdf',
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        rawUrl: trimmed,
      };
    }
  }

  if (trimmed.includes('docs.google.com/')) {
    return {
      type: 'google-doc',
      embedUrl: trimmed.replace(/\/edit.*$/, '/preview'),
      rawUrl: trimmed,
    };
  }

  // 5. Direct Audio (mp3, wav, ogg, m4a)
  if (/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'audio',
      embedUrl: trimmed,
    };
  }

  // 6. Direct PDF
  if (/\.pdf(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'pdf',
      embedUrl: trimmed,
      rawUrl: trimmed,
    };
  }

  // 7. General Webpage / Form / Live App
  return {
    type: 'webpage',
    embedUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    rawUrl: trimmed,
  };
}

/**
 * NotionEmbed
 * Embeds Videos, Audio, PDFs, and Live Web applications in true Notion interactive frames.
 */
export default function NotionEmbed({
  url = '',
  title = 'Embedded Content',
  height = 450,
  allowFullscreen = true,
  className = '',
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (!url) return null;

  const info = getEmbedInfo(url);

  // 1. YouTube & Vimeo Video Embed
  if (info.type === 'youtube' || info.type === 'vimeo') {
    return (
      <div className={`my-4 rounded-2xl overflow-hidden border border-slate-200/90 bg-black shadow-md ${className}`}>
        <div className="aspect-video w-full">
          <iframe
            key={reloadKey}
            src={info.embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  // 2. Audio Embed
  if (info.type === 'audio') {
    return (
      <div className={`my-4 p-4 rounded-2xl bg-gradient-to-r from-[#071B3B] to-[#0F294A] text-white border border-[#1A3860] shadow-md space-y-2.5 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-[#F4B942] flex items-center justify-center">
              <Music className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold">{title || 'Audio Player'}</h4>
              <p className="text-[10px] text-slate-300">Attached audio playback</p>
            </div>
          </div>
          <a
            href={url}
            download
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Download Audio"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>
        <audio controls className="w-full h-9 rounded-lg outline-none" src={info.embedUrl} preload="metadata">
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // 3. Spotify Embed
  if (info.type === 'spotify') {
    return (
      <div className={`my-4 rounded-2xl overflow-hidden shadow-md border border-slate-200 ${className}`}>
        <iframe
          src={info.embedUrl}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="w-full"
        />
      </div>
    );
  }

  // 4. PDF or Google Doc Embed
  if (info.type === 'pdf' || info.type === 'google-doc') {
    return (
      <div className={`my-4 rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-md ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : ''} ${className}`}>
        {/* Frame Toolbar */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <FileText className="w-4 h-4 text-rose-500" />
            <span className="truncate max-w-xs sm:max-w-md">{title || 'Document Preview'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition"
              title="Reload frame"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            {allowFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <a
              href={info.rawUrl || url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-200/60 transition"
              title="Open document in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Embedded Viewer */}
        <div className={`w-full ${isFullscreen ? 'flex-1' : ''}`} style={{ height: isFullscreen ? '100%' : `${height}px` }}>
          <iframe
            key={reloadKey}
            src={info.embedUrl}
            title={title}
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // 5. Interactive Live Website / App / Form Embed
  return (
    <div className={`my-4 rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-md ${isFullscreen ? 'fixed inset-4 z-50 flex flex-col' : ''} ${className}`}>
      {/* Frame Toolbar */}
      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold truncate">
          <Globe className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="truncate max-w-xs sm:max-w-md">{title || url}</span>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 hidden sm:inline">
            Interactive Embed
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition"
            title="Reload frame"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          {allowFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-200/60 transition"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Iframe */}
      <div className={`w-full ${isFullscreen ? 'flex-1' : ''}`} style={{ height: isFullscreen ? '100%' : `${height}px` }}>
        <iframe
          key={reloadKey}
          src={info.embedUrl}
          title={title}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          allowFullScreen
        />
      </div>
    </div>
  );
}
