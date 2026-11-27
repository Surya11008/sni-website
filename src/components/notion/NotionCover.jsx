import { useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';

const PRESET_COVERS = [
  { name: 'Sacred Sunrise', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80' },
  { name: 'Mountain Dawn', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80' },
  { name: 'Holy Bible', url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1600&q=80' },
  { name: 'Golden Forest Rays', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80' },
  { name: 'Cathedral Stained Glass', url: 'https://images.unsplash.com/photo-1548625361-19597a732a39?w=1600&q=80' },
  { name: 'Calming Ocean Sunset', url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1600&q=80' },
];

export function NotionCover({ url, onChange, onRemove, editable = true }) {
  const [showPicker, setShowPicker] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  return (
    <div className="relative w-full">
      {url ? (
        <div className="relative h-52 sm:h-64 md:h-72 w-full group overflow-hidden bg-slate-100">
          <img
            src={url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          {editable && (
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4 gap-2">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Change cover</span>
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : editable ? (
        <div className="pt-4 px-6 md:px-12 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Add cover</span>
          </button>
        </div>
      ) : null}

      {/* Cover Picker Popover */}
      {showPicker && (
        <div className="mx-6 md:mx-12 mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-150 relative z-30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800">Select Cover Image</span>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
            {PRESET_COVERS.map((cov) => (
              <button
                key={cov.name}
                type="button"
                onClick={() => {
                  onChange(cov.url);
                  setShowPicker(false);
                }}
                className="group relative h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-[#C59B27] transition cursor-pointer"
              >
                <img src={cov.url} alt={cov.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/10 flex items-end p-2">
                  <span className="text-[10px] font-bold text-white truncate drop-shadow">{cov.name}</span>
                </div>
              </button>
            ))}
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Or paste custom image URL:</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <button
                type="button"
                onClick={() => {
                  if (customUrl.trim()) {
                    onChange(customUrl.trim());
                    setCustomUrl('');
                    setShowPicker(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#071B3B] text-[#F4B942] text-xs font-bold cursor-pointer transition hover:bg-[#0F294A]"
              >
                Set Cover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

NotionCover.Skeleton = function CoverSkeleton() {
  return <div className="h-44 sm:h-56 w-full bg-slate-200 animate-pulse" />;
};
