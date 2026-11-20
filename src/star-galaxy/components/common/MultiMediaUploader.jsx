import React, { useState } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Trash2,
  Image,
  Video,
  Plus,
  Globe,
  FileText,
  Music,
  File,
  Loader2,
} from 'lucide-react';
import { transformToEmbedUrl, detectMediaType, isEmbeddable, isAudioUrl, isVideoUrl } from '../../utils/embedUtils';

export default function MultiMediaUploader({ mediaItems = [], setMediaItems, onChange }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'link'
  const [linkInput, setLinkInput] = useState('');
  const [linkType, setLinkType] = useState('auto');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  // Support both setMediaItems and onChange props gracefully
  const updateItems = (updater) => {
    if (typeof setMediaItems === 'function') {
      setMediaItems(updater);
    }
    if (typeof onChange === 'function') {
      if (typeof updater === 'function') {
        onChange(updater(mediaItems));
      } else {
        onChange(updater);
      }
    }
  };

  // Compress images to max 960px and 68% quality: light, crystal-clear & lightning fast even for 50+ photos!
  const processImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 960;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.68));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Handle ANY file upload: Audio, Video, Image, PDF, Word, Excel, Docs without limits!
  // Uses sequential batch processing so 20+ photos never crash browser RAM or drop items!
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsProcessing(true);
    setProcessingStatus(`Preparing ${files.length} items...`);

    const newItems = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProcessingStatus(`Uploading & optimizing ${i + 1} of ${files.length}...`);

      const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|avi|3gp|flv|wmv|m4v)$/i);
      const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|aac|ogg|flac|wma|opus|amr|mid)$/i);
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const isDoc = file.name.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv|odt|ods|odp|md|json|xml|log|sql|js|py)$/i);
      const isImage = file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp|ico|tiff|heic)$/i);

      if (isImage) {
        try {
          const compressedUrl = await processImageFile(file);
          if (compressedUrl) {
            newItems.push({
              url: compressedUrl,
              type: 'image',
              name: file.name,
              size: file.size,
            });
          }
        } catch (err) {
          console.error('Image compression error for', file.name, err);
        }
      } else {
        const rawDataUrl = await new Promise((res) => {
          const r = new FileReader();
          r.onload = (ev) => res(ev.target.result);
          r.onerror = () => res(null);
          r.readAsDataURL(file);
        });

        if (rawDataUrl) {
          let fileType = 'file';
          if (isAudio) fileType = 'audio';
          else if (isVideo) fileType = 'video';
          else if (isPdf) fileType = 'pdf';
          else if (isDoc) fileType = 'doc';

          newItems.push({
            url: rawDataUrl,
            type: fileType,
            name: file.name,
            size: file.size,
          });
        }
      }
    }

    if (newItems.length > 0) {
      updateItems(prev => [...(prev || []), ...newItems]);
    }

    setIsProcessing(false);
    setProcessingStatus('');
    e.target.value = ''; // Reset input
  };

  // Handle Add ANY Link without limits!
  const handleAddLink = (e) => {
    e.preventDefault();
    const raw = linkInput.trim();
    if (!raw) return;

    let resolvedType = 'embed';
    let finalUrl = transformToEmbedUrl(raw);

    if (linkType === 'audio') {
      resolvedType = 'audio';
      finalUrl = raw;
    } else if (linkType === 'video') {
      resolvedType = 'video';
      finalUrl = raw;
    } else if (linkType === 'image') {
      resolvedType = 'image';
      finalUrl = raw;
    } else if (linkType === 'doc' || linkType === 'pdf') {
      resolvedType = 'doc';
      finalUrl = transformToEmbedUrl(raw);
    } else {
      // Auto-detect
      if (isAudioUrl(raw)) {
        resolvedType = 'audio';
        finalUrl = raw;
      } else if (isVideoUrl(raw)) {
        resolvedType = 'video';
        finalUrl = transformToEmbedUrl(raw);
      } else if (isEmbeddable(raw)) {
        resolvedType = 'embed';
        finalUrl = transformToEmbedUrl(raw);
      } else {
        const detected = detectMediaType(raw);
        resolvedType = detected === 'audio' ? 'audio' : detected === 'video' ? 'video' : detected === 'doc' || detected === 'pdf' ? 'doc' : detected === 'image' ? 'image' : 'embed';
      }
    }

    updateItems(prev => [
      ...(prev || []),
      {
        url: finalUrl,
        type: resolvedType,
        name: '',
      },
    ]);
    setLinkInput('');
  };

  const handleRemoveItem = (indexToRemove) => {
    updateItems(prev => (prev || []).filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/30 p-4 rounded-3xl border-2 border-indigo-200/80 shadow-xs">
      {/* Header with Unlimited Counter */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-slate-800 flex items-center gap-2">
          <span>Files, Audios & Embeds:</span>
          <span className="text-[11px] font-black text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-0.5 rounded-full shadow-2xs">
            {mediaItems.length} Added (No Limit)
          </span>
        </label>

        {/* Tab switch: Upload vs Link */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-indigo-200 text-[11px] font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'upload' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Upload Any File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
              activeTab === 'link' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Link / Embed
          </button>
        </div>
      </div>

      {/* Upload Box (UNLIMITED: Audio, Video, Image, PDF, Docs) */}
      {activeTab === 'upload' && (
        <div className="space-y-2">
          <label className={`border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-white/90 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-indigo-50/50 shadow-xs text-center ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mb-2 shadow-sm">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-slate-900">
              Choose Audios, Videos, Photos, PDFs, or Documents
            </span>
            <span className="text-[10px] text-indigo-700 font-bold mt-1">
              Supports MP3, WAV, M4A, MP4, PDF, Word, Excel, Images & any files • No Limit 🚀
            </span>
            <input
              type="file"
              multiple
              accept="*/*"
              disabled={isProcessing}
              onChange={handleFiles}
              className="hidden"
            />
          </label>

          {isProcessing && (
            <div className="flex items-center gap-3 p-3 bg-indigo-100/90 border border-indigo-300 rounded-2xl text-indigo-900 shadow-sm animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-700 shrink-0" />
              <div className="text-xs font-bold">
                <p>{processingStatus || 'Optimizing & uploading items...'}</p>
                <p className="text-[10px] text-indigo-700 font-medium">Please wait while files are processed safely</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Link / Embed Form (ANY LINK) */}
      {activeTab === 'link' && (
        <div className="space-y-2 bg-white/90 p-3 rounded-2xl border border-indigo-200">
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={linkType}
              onChange={(e) => setLinkType(e.target.value)}
              className="px-2.5 py-2 text-xs bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-900"
            >
              <option value="auto">Auto-Detect (Any Link)</option>
              <option value="audio">Audio / Podcast Link (MP3/Spotify)</option>
              <option value="drive">Google Drive / Docs / Sheets</option>
              <option value="doc">Document / PDF Link</option>
              <option value="video">Video (YouTube/Shorts/MP4)</option>
              <option value="embed">Web Page / Article Embed</option>
              <option value="image">Image URL</option>
            </select>
            <input
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="Paste ANY link: Audio, Drive, Docs, YouTube, PDF, Canva, Web link..."
              className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
            />
            <button
              type="button"
              onClick={handleAddLink}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              + Add Link
            </button>
          </div>
          <p className="text-[10px] text-indigo-800 font-semibold pl-1 flex items-center gap-1">
            <span>✨</span>
            <span>Any link can be embedded: Audio songs, podcasts, Google Drive, Docs, YouTube, PDF, Canva, or web pages!</span>
          </p>
        </div>
      )}

      {/* Previews Grid for Added Items (UNLIMITED) */}
      {mediaItems.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
          {mediaItems.map((item, idx) => (
            <div key={idx} className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-indigo-200 group h-24 shadow-xs transition-transform hover:scale-102">
              {item.type === 'audio' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-purple-950 text-white p-1 text-center">
                  <Music className="w-5 h-5 text-purple-300 mb-0.5 animate-pulse" />
                  <span className="text-[9px] font-black text-purple-200 truncate max-w-full px-1">
                    {item.name || 'Audio'}
                  </span>
                </div>
              ) : item.type === 'pdf' || item.type === 'doc' || item.type === 'file' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-amber-950 text-white p-1 text-center">
                  <FileText className="w-5 h-5 text-amber-300 mb-0.5" />
                  <span className="text-[9px] font-black text-amber-200 truncate max-w-full px-1">
                    {item.name || 'Document'}
                  </span>
                </div>
              ) : item.type === 'video' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white p-1 text-center">
                  <Video className="w-5 h-5 text-rose-400 mb-0.5" />
                  <span className="text-[9px] font-black text-rose-300 truncate max-w-full px-1">
                    {item.name || 'Video'}
                  </span>
                </div>
              ) : item.type === 'embed' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950 text-white p-1 text-center">
                  <Globe className="w-5 h-5 text-emerald-400 mb-0.5" />
                  <span className="text-[9px] font-black text-emerald-300 truncate max-w-full px-1">
                    {item.name || 'Embed'}
                  </span>
                </div>
              ) : (
                <img src={item.url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />
              )}

              {/* Number Badge */}
              <span className="absolute top-1.5 left-1.5 bg-black/75 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                #{idx + 1}
              </span>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Remove item"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
