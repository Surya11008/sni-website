import { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Play,
  Music,
  FileText,
  Globe,
  Sparkles,
  Check,
} from 'lucide-react';
import { getEmbedInfo } from './NotionEmbed';
import NotionLinkPreview from './NotionLinkPreview';
import NotionEmbed from './NotionEmbed';

export default function NotionEmbedDrawer({
  isOpen = false,
  onClose,
  onInsert,
}) {
  const [url, setUrl] = useState('');
  const [embedType, setEmbedType] = useState('auto'); // 'auto', 'bookmark', 'video', 'audio', 'pdf', 'webpage'
  const [previewMode, setPreviewMode] = useState(false);

  if (!isOpen) return null;

  const detectedInfo = getEmbedInfo(url);
  const activeType = embedType === 'auto' ? detectedInfo.type : embedType;

  const handleApply = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (onInsert) {
      onInsert({
        url: url.trim(),
        type: activeType,
        embedUrl: detectedInfo.embedUrl || url.trim(),
      });
    }

    setUrl('');
    setPreviewMode(false);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#C59B27] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#071B3B]">
                Embed or Link Preview
              </h3>
              <p className="text-xs text-slate-400">
                Paste any web link, video, audio, or document
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 block">
            URL / Web Address
          </label>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setPreviewMode(Boolean(e.target.value.trim()));
              }}
              placeholder="https://youtube.com/..., https://drive.google.com/..., or any link"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C59B27] focus:border-transparent"
              autoFocus
            />
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Type Selector Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Format as
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setEmbedType('auto')}
              className={`p-2 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                embedType === 'auto'
                  ? 'bg-amber-50 text-[#071B3B] border-[#C59B27] shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Auto Detect</span>
            </button>

            <button
              type="button"
              onClick={() => setEmbedType('bookmark')}
              className={`p-2 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                embedType === 'bookmark'
                  ? 'bg-amber-50 text-[#071B3B] border-[#C59B27] shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Bookmark</span>
            </button>

            <button
              type="button"
              onClick={() => setEmbedType('video')}
              className={`p-2 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                embedType === 'video'
                  ? 'bg-amber-50 text-[#071B3B] border-[#C59B27] shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>

            <button
              type="button"
              onClick={() => setEmbedType('audio')}
              className={`p-2 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                embedType === 'audio'
                  ? 'bg-amber-50 text-[#071B3B] border-[#C59B27] shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>

            <button
              type="button"
              onClick={() => setEmbedType('pdf')}
              className={`p-2 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                embedType === 'pdf'
                  ? 'bg-amber-50 text-[#071B3B] border-[#C59B27] shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF/Doc</span>
            </button>

            <button
              type="button"
              onClick={() => setEmbedType('webpage')}
              className={`p-2 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                embedType === 'webpage'
                  ? 'bg-amber-50 text-[#071B3B] border-[#C59B27] shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Live Embed</span>
            </button>
          </div>
        </div>

        {/* Live Preview Box */}
        {previewMode && url.trim() && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-2xl bg-slate-50 p-2.5 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Live Preview
            </span>
            {activeType === 'bookmark' ? (
              <NotionLinkPreview url={url} />
            ) : (
              <NotionEmbed url={url} height={180} />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!url.trim()}
            className="px-5 py-2 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Insert</span>
          </button>
        </div>
      </div>
    </div>
  );
}
