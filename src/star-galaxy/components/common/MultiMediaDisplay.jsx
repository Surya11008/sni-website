import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  ExternalLink,
  Globe,
  Music,
  FileText,
  Download,
} from 'lucide-react';
import { transformToEmbedUrl, isEmbeddable, isGoogleDoc, getGoogleServiceInfo, isAudioUrl, isVideoUrl, getFileMetadata } from '../../utils/embedUtils';
import DocumentViewer, { isDummyTitle } from './DocumentViewer';
import StarAudioPlayer from './StarAudioPlayer';
import StarVideoPlayer from './StarVideoPlayer';

export default function MultiMediaDisplay({
  mediaItems = [],
  singleUrl = null,
  singleType = 'image',
  title = '',
  showWatermark = false,
}) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Normalize media items: UNLIMITED ITEMS! NO SLICING!
  let items = [];
  if (Array.isArray(mediaItems) && mediaItems.length > 0) {
    items = mediaItems;
  } else if (singleUrl) {
    items = [{ url: singleUrl, type: singleType || 'image' }];
  }

  if (items.length === 0) return null;

  const totalCount = items.length;

  const isEmbedItem = (item) => {
    return item?.type === 'embed' || item?.type === 'drive' || isEmbeddable(item?.url);
  };

  const isDocumentItem = (item) => {
    return item?.type === 'pdf' || item?.type === 'doc' || item?.type === 'file';
  };

  const renderThumbnailContent = (item, idx, customClass = '') => {
    if (item.type === 'audio') {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950 to-slate-950 text-white p-2 ${customClass}`}>
          <div className="w-10 h-10 rounded-full bg-purple-600/90 flex items-center justify-center mb-1 shadow-md">
            <Music className="w-5 h-5 text-purple-100" />
          </div>
          <span className="text-[10px] font-black text-purple-200 tracking-wide uppercase truncate max-w-full px-1">
            {item.name || 'Audio Track'}
          </span>
        </div>
      );
    }
    if (isGoogleDoc(item.url)) {
      const gInfo = getGoogleServiceInfo(item.url);
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gInfo.color} text-white p-2 ${customClass}`}>
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1 shadow-md text-xl">
            {gInfo.icon}
          </div>
          <span className="text-[10px] font-black text-white tracking-wide uppercase truncate max-w-full px-1">
            {item.name || 'Document'}
          </span>
        </div>
      );
    }
    if (isDocumentItem(item)) {
      const meta = getFileMetadata(item.name, item.url);
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${meta.color} text-white p-2 ${customClass}`}>
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-1 shadow-md text-xl">
            {meta.icon}
          </div>
          <span className="text-[10px] font-black text-white tracking-wide uppercase truncate max-w-full px-1">
            {item.name || meta.label}
          </span>
          {meta.ext && (
            <span className="text-[9px] font-bold text-white/80 uppercase">
              .{meta.ext}
            </span>
          )}
        </div>
      );
    }
    if (isEmbedItem(item)) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-950 text-white p-2 ${customClass}`}>
          <div className="w-10 h-10 rounded-full bg-indigo-600/90 flex items-center justify-center mb-1 shadow-md">
            <Globe className="w-5 h-5 text-indigo-100" />
          </div>
          <span className="text-[10px] font-black text-indigo-200 tracking-wide uppercase truncate max-w-full px-1">
            {item.name || 'Embed Link'}
          </span>
        </div>
      );
    }
    if (item.type === 'video') {
      return (
        <div className={`w-full h-full flex items-center justify-center bg-slate-950 ${customClass}`}>
          <video src={item.url} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="w-10 h-10 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </span>
          </div>
        </div>
      );
    }
    return (
      <img
        src={item.url}
        alt={`${title} ${idx + 1}`}
        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${customClass}`}
      />
    );
  };

  return (
    <div className="relative overflow-hidden bg-slate-900 rounded-3xl border-2 border-indigo-200/50 shadow-md">
      {/* 1. Single Item Display */}
      {totalCount === 1 && (
        (items[0].type === 'audio' || isAudioUrl(items[0].url)) ? (
          <div className="p-3 w-full bg-slate-950 flex flex-col items-center justify-center text-white rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <StarAudioPlayer
              url={items[0].url}
              title={items[0].name || title || 'Audio Track'}
              fileName={items[0].name}
              allowDownload={true}
            />
          </div>
        ) : (items[0].type === 'video' || isVideoUrl(items[0].url)) ? (
          <div className="w-full bg-slate-950 flex flex-col items-center justify-center text-white rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <StarVideoPlayer
              url={items[0].url}
              title={items[0].name || title || 'Video'}
              fileName={items[0].name}
              allowDownload={true}
            />
          </div>
        ) : (isGoogleDoc(items[0].url) || isDocumentItem(items[0])) ? (
          <div className="p-2 sm:p-3 bg-slate-950 rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <DocumentViewer
              fileUrl={items[0].url}
              title={(items[0].name && !isDummyTitle(items[0].name) ? items[0].name : '') || (!isDummyTitle(title) ? title : '')}
              category={items[0].type || 'doc'}
              fileName={items[0].name && !isDummyTitle(items[0].name) ? items[0].name : ''}
            />
          </div>
        ) : (
          <div
            onClick={() => setLightboxIndex(0)}
            className="relative max-h-96 w-full flex items-center justify-center cursor-pointer group"
          >
            {isEmbedItem(items[0]) ? (
              <div className="relative w-full h-72 sm:h-96 bg-slate-950">
                <iframe
                  src={transformToEmbedUrl(items[0].url)}
                  title={title}
                  className="w-full h-full border-0 rounded-2xl bg-white"
                  allow="autoplay; encrypted-media; fullscreen; clipboard-write; clipboard-read"
                  allowFullScreen
                />
                <a
                  href={items[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2.5 right-2.5 bg-black/80 hover:bg-black text-white text-[11px] font-black px-3 py-1.5 rounded-xl backdrop-blur-xs flex items-center gap-1.5 z-10 shadow-md transition-all hover:scale-105"
                  title="Open in New Tab"
                >
                  <span>Open Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <img
                src={items[0].url}
                alt={title}
                className="w-full max-h-96 object-cover group-hover:scale-102 transition-transform duration-300"
              />
            )}

            {showWatermark && !isEmbedItem(items[0]) && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="text-white/20 font-black text-xl rotate-[-25deg] uppercase tracking-widest select-none">
                  STAR GALAXY • PROTECTED
                </span>
              </div>
            )}
          </div>
        )
      )}

      {/* 2. Two Items Display (50 / 50 Grid) */}
      {totalCount === 2 && (
        <div className="grid grid-cols-2 gap-1.5 max-h-72">
          {items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setLightboxIndex(idx)}
              className="relative h-60 w-full overflow-hidden bg-slate-800 cursor-pointer group"
            >
              {renderThumbnailContent(item, idx)}
            </div>
          ))}
        </div>
      )}

      {/* 3. Three Items Display (1 large, 2 smaller) */}
      {totalCount === 3 && (
        <div className="grid grid-cols-2 gap-1.5 max-h-72">
          <div
            onClick={() => setLightboxIndex(0)}
            className="row-span-2 relative h-64 overflow-hidden bg-slate-800 cursor-pointer group"
          >
            {renderThumbnailContent(items[0], 0)}
          </div>

          {items.slice(1, 3).map((item, idx) => (
            <div
              key={idx + 1}
              onClick={() => setLightboxIndex(idx + 1)}
              className="relative h-31.5 overflow-hidden bg-slate-800 cursor-pointer group"
            >
              {renderThumbnailContent(item, idx + 1)}
            </div>
          ))}
        </div>
      )}

      {/* 4. Four or More Items Display (with Unlimited "+X more" overlay) */}
      {totalCount >= 4 && (
        <div className="grid grid-cols-2 gap-1.5 max-h-72">
          {items.slice(0, 4).map((item, idx) => {
            const isLastOfFour = idx === 3;
            const remaining = totalCount - 4;

            return (
              <div
                key={idx}
                onClick={() => setLightboxIndex(idx)}
                className="relative h-32 sm:h-36 overflow-hidden bg-slate-800 cursor-pointer group"
              >
                {renderThumbnailContent(item, idx)}

                {/* +X More Overlay (No Limit!) */}
                {isLastOfFour && remaining > 0 && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-2xs flex items-center justify-center text-white font-black text-base sm:text-lg">
                    +{remaining} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-item Badge (Top Left) */}
      {totalCount > 1 && (
        <div className="absolute top-2.5 left-2.5 bg-black/75 text-white text-[10px] font-black px-2.5 py-1 rounded-xl backdrop-blur-xs flex items-center gap-1.5 z-10 pointer-events-none shadow-md">
          <span>{totalCount} Items</span>
        </div>
      )}

      {/* 🔍 Full-Screen Lightbox Modal for UNLIMITED Media, Audios, Docs & Embeds */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200">
          {/* Top Bar with Counter & Close */}
          <div className="flex items-center justify-between text-white z-10">
            <span className="text-xs font-black bg-white/20 px-3.5 py-1.5 rounded-full shadow-xs">
              {lightboxIndex + 1} / {totalCount}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Active Item in Full Center */}
          <div className="flex-1 flex items-center justify-center relative my-2 overflow-hidden">
            {(items[lightboxIndex].type === 'audio' || isAudioUrl(items[lightboxIndex].url)) ? (
              <div className="w-full max-w-lg p-2">
                <StarAudioPlayer
                  url={items[lightboxIndex].url}
                  title={items[lightboxIndex].name || title || 'Audio Track'}
                  fileName={items[lightboxIndex].name}
                  autoPlay={true}
                />
              </div>
            ) : (isGoogleDoc(items[lightboxIndex].url) || isDocumentItem(items[lightboxIndex])) ? (
              <div className="w-full max-w-4xl max-h-[82vh] overflow-y-auto p-2 bg-slate-900 rounded-3xl border border-white/20">
                <DocumentViewer
                  fileUrl={items[lightboxIndex].url}
                  title={(items[lightboxIndex].name !== 'Google Drive File' && items[lightboxIndex].name !== 'Google Drive Media' && items[lightboxIndex].name !== 'Media' ? items[lightboxIndex].name : '') || (title !== 'Media' ? title : '')}
                  fileName={items[lightboxIndex].name !== 'Google Drive File' ? items[lightboxIndex].name : ''}
                  category={items[lightboxIndex].type || 'doc'}
                />
              </div>
            ) : isEmbedItem(items[lightboxIndex]) ? (
              <div className="w-full max-w-4xl h-[70vh] flex flex-col items-center justify-center relative p-2">
                <iframe
                  src={transformToEmbedUrl(items[lightboxIndex].url)}
                  title={title}
                  className="w-full h-full rounded-2xl border-2 border-white/20 shadow-2xl bg-white"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                />
                <a
                  href={items[lightboxIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs font-black text-sky-300 hover:text-white flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl border border-white/25 transition-all hover:bg-white/25 shadow-md"
                >
                  <span>Open in New Tab / Original Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (items[lightboxIndex].type === 'video' || isVideoUrl(items[lightboxIndex].url)) ? (
              <div className="w-full max-w-4xl p-2">
                <StarVideoPlayer
                  url={items[lightboxIndex].url}
                  title={items[lightboxIndex].name || title || 'Video'}
                  fileName={items[lightboxIndex].name}
                  autoPlay={true}
                />
              </div>
            ) : (
              <img
                src={items[lightboxIndex].url}
                alt={`${title} full`}
                className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl select-none"
              />
            )}

            {/* Left / Right Nav Arrows */}
            {totalCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev - 1 + totalCount) % totalCount)}
                  className="absolute left-2 p-3 rounded-full bg-black/70 hover:bg-black text-white transition-all active:scale-95 cursor-pointer shadow-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev + 1) % totalCount)}
                  className="absolute right-2 p-3 rounded-full bg-black/70 hover:bg-black text-white transition-all active:scale-95 cursor-pointer shadow-lg"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip (Scrollable for unlimited items) */}
          {totalCount > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-full">
              {items.map((it, tIdx) => (
                <button
                  key={tIdx}
                  type="button"
                  onClick={() => setLightboxIndex(tIdx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    lightboxIndex === tIdx ? 'border-amber-400 scale-110 shadow-lg' : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  {it.type === 'audio' ? (
                    <div className="w-full h-full bg-purple-950 flex items-center justify-center text-purple-300">
                      <Music className="w-5 h-5" />
                    </div>
                  ) : isDocumentItem(it) ? (
                    <div className="w-full h-full bg-amber-950 flex items-center justify-center text-amber-300">
                      <FileText className="w-5 h-5" />
                    </div>
                  ) : isEmbedItem(it) ? (
                    <div className="w-full h-full bg-indigo-950 flex items-center justify-center text-indigo-300">
                      <Globe className="w-5 h-5" />
                    </div>
                  ) : it.type === 'video' ? (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white">
                      <Play className="w-4 h-4 fill-white" />
                    </div>
                  ) : (
                    <img src={it.url} alt={`Thumb ${tIdx + 1}`} className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
