import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  ExternalLink,
  Maximize2,
  Minimize2,
  Download,
  BookOpen,
  Share2,
  X,
  Copy,
  Check,
  FileSpreadsheet,
  FileCode,
  Archive,
  Package,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import {
  transformToEmbedUrl,
  getGoogleServiceInfo,
  isGoogleDoc,
  dataUrlToBlob,
  decodeBase64Text,
  getFileMetadata,
} from '../../utils/embedUtils';

export const isDummyTitle = (t) => {
  if (!t || typeof t !== 'string') return true;
  const lower = t.trim().toLowerCase();
  return (
    lower === 'media' ||
    lower === 'document' ||
    lower === 'document file' ||
    lower === 'google docs' ||
    lower === 'google doc' ||
    lower === 'google docs file' ||
    lower === 'google drive' ||
    lower === 'google drive file' ||
    lower === 'google drive media' ||
    lower === 'file' ||
    lower === 'all files' ||
    lower.includes('google doc') ||
    lower.includes('google drive')
  );
};

export default function DocumentViewer({
  fileUrl,
  originalUrl,
  title = '',
  category = 'doc',
  fileName,
  allowDownload = true,
  hideHeader = false,
  className = '',
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const rawUrl = originalUrl || fileUrl || '';
  const effectiveFileName = fileName || title || 'document';
  const meta = useMemo(() => getFileMetadata(effectiveFileName, rawUrl), [effectiveFileName, rawUrl]);

  const isLocalData = typeof rawUrl === 'string' && rawUrl.startsWith('data:');
  const isPdf = meta.category === 'pdf' || category === 'pdf' || rawUrl.endsWith('.pdf') || rawUrl.startsWith('data:application/pdf');

  // Convert base64 PDF to Blob URL so mobile Safari, Chrome, and desktop load reliably
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    if (isLocalData && isPdf) {
      const blob = dataUrlToBlob(rawUrl);
      if (blob) {
        const objUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objUrl);
        return () => {
          URL.revokeObjectURL(objUrl);
        };
      }
    }
    setPdfBlobUrl(null);
  }, [rawUrl, isLocalData, isPdf]);

  // Decode text for .txt, .csv, .md, .json, .log, etc.
  const decodedText = useMemo(() => {
    if (isLocalData && meta.isTextual) {
      return decodeBase64Text(rawUrl);
    }
    return '';
  }, [rawUrl, isLocalData, meta.isTextual]);

  // Copy text to clipboard
  const handleCopyText = async () => {
    if (!decodedText) return;
    try {
      await navigator.clipboard.writeText(decodedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  // Embed URL for iframe
  const embedUrl = useMemo(() => {
    if (pdfBlobUrl) return pdfBlobUrl;
    return transformToEmbedUrl(rawUrl);
  }, [pdfBlobUrl, rawUrl]);

  // Handle Share link
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: rawUrl,
        });
      } catch (e) {}
    } else {
      navigator.clipboard?.writeText(rawUrl);
      alert('Link copied to clipboard!');
    }
  };

  // Render specific icon based on file extension
  const renderFileIcon = () => {
    const ext = meta.ext;
    if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-10 h-10 text-emerald-600" />;
    }
    if (['txt', 'md', 'json', 'xml', 'log', 'sql', 'js', 'py'].includes(ext)) {
      return <FileCode className="w-10 h-10 text-indigo-600" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-10 h-10 text-amber-600" />;
    }
    if (['apk', 'ipa'].includes(ext)) {
      return <Smartphone className="w-10 h-10 text-teal-600" />;
    }
    if (['exe', 'dmg', 'msi'].includes(ext)) {
      return <Package className="w-10 h-10 text-purple-600" />;
    }
    return <FileText className="w-10 h-10 text-blue-600" />;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 📘 Top Action Header */}
      {!hideHeader && (
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.color} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs`}>
              <span>{meta.icon}</span>
            </div>
            <div className="min-w-0">
              {!isDummyTitle(title) && (
                <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  {title}
                </h4>
              )}
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {meta.label}
                </span>
                {meta.ext && (
                  <span className="uppercase text-slate-400">.{meta.ext}</span>
                )}
              </div>
            </div>
          </div>

          {/* Toolbar Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              title="Fullscreen Reader"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>

            {allowDownload && (
              <a
                href={rawUrl}
                download={fileName || title || 'file'}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Download File"
              >
                <Download className="w-4 h-4" />
              </a>
            )}

            {rawUrl && !isLocalData && (
              <a
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Open Original Link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Share Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 📄 Document Canvas Paper Container */}
      <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-300 shadow-inner p-1 sm:p-2">
        {/* CASE A: Uploaded Text / Code / Notes file (Inline Text Reader!) */}
        {isLocalData && decodedText ? (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{effectiveFileName}</h4>
                  <span className="text-[10px] text-slate-400">{decodedText.split('\n').length} lines • {decodedText.length} characters</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
                {allowDownload && (
                  <a
                    href={rawUrl}
                    download={effectiveFileName}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                )}
              </div>
            </div>
            <pre className="max-h-[500px] overflow-auto p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl whitespace-pre-wrap leading-relaxed select-text">
              {decodedText}
            </pre>
          </div>
        ) : isLocalData && !isPdf ? (
          /* CASE B: Uploaded Word, Excel, PPT, Zip, APK, or Any Binary File Card */
          <div className="p-8 sm:p-12 bg-white rounded-xl shadow-md border border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 shadow-inner">
              {renderFileIcon()}
            </div>
            <h4 className="text-base font-black text-slate-900 mb-1">{title || effectiveFileName}</h4>
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full text-white bg-gradient-to-r ${meta.color} shadow-xs`}>
                {meta.label}
              </span>
              {meta.ext && (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  .{meta.ext.toUpperCase()}
                </span>
              )}
            </div>
            {allowDownload && (
              <div className="flex items-center gap-3">
                <a
                  href={rawUrl}
                  download={effectiveFileName}
                  className={`inline-flex items-center gap-2 bg-gradient-to-r ${meta.color} text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md transition-transform active:scale-95`}
                >
                  <Download className="w-4 h-4" />
                  <span>Download / Open {meta.label}</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          /* CASE C: Google Docs / Drive / PDF / Web Embedded Reader */
          <div className="w-full bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden relative flex flex-col">
            {iframeLoading && (
              <div className="absolute inset-0 bg-slate-50/90 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
                <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-xs font-bold text-slate-700">Loading document...</p>
                <span className="text-[10px] text-slate-400">Opening view</span>
              </div>
            )}
            <iframe
              src={embedUrl}
              title={title}
              onLoad={() => setIframeLoading(false)}
              className="w-full h-[540px] sm:h-[680px] border-0 bg-white"
              allow="autoplay; encrypted-media; fullscreen; clipboard-write; clipboard-read"
              allowFullScreen
            />
            {/* Fallback bar for external links with X-Frame-Options */}
            {!isLocalData && rawUrl && (
              <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs px-4">
                <span className="text-[11px] text-slate-500 font-medium">
                  If the document doesn't display or is blocked by provider, open directly:
                </span>
                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  <span>Open in New Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ⛶ Fullscreen Document Reader Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white p-3 sm:px-6 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.color} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                <span>{meta.icon}</span>
              </div>
              <div className="min-w-0">
                {!isDummyTitle(title) && (
                  <h3 className="text-sm sm:text-base font-black truncate max-w-sm sm:max-w-md text-white">
                    {title}
                  </h3>
                )}
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
                  Fullscreen Reader • {meta.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {rawUrl && !isLocalData && (
                <a
                  href={rawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Open Link in New Tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {allowDownload && (
                <a
                  href={rawUrl}
                  download={effectiveFileName}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                title="Exit Fullscreen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full bg-slate-800 p-1 sm:p-3 overflow-hidden flex items-center justify-center">
            {isLocalData && decodedText ? (
              <div className="bg-slate-900 rounded-3xl p-6 max-w-4xl w-full h-[85vh] flex flex-col text-white">
                <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
                  <h4 className="font-bold text-sm">{effectiveFileName}</h4>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
                <pre className="flex-1 overflow-auto p-4 bg-black/50 text-emerald-400 font-mono text-xs rounded-2xl whitespace-pre-wrap select-text">
                  {decodedText}
                </pre>
              </div>
            ) : isLocalData && !isPdf ? (
              <div className="p-8 bg-white rounded-3xl shadow-2xl max-w-md w-full text-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
                  {renderFileIcon()}
                </div>
                <h4 className="text-base font-black text-slate-900 mb-1">{title || effectiveFileName}</h4>
                <p className="text-xs text-slate-500 mb-4">{meta.label}</p>
                {allowDownload && (
                  <a
                    href={rawUrl}
                    download={effectiveFileName}
                    className={`inline-flex items-center gap-2 bg-gradient-to-r ${meta.color} text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download {meta.label}</span>
                  </a>
                )}
              </div>
            ) : (
              <iframe
                src={embedUrl}
                title={title}
                className="w-full h-full border-0 rounded-2xl bg-white shadow-2xl"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
