import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, X, Upload, Link as LinkIcon, Sparkles, Loader2, Clipboard, Check } from 'lucide-react';

const PRESET_COVERS = [
  // Sunrises & Sunsets
  { name: 'Ocean Sunrise', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80' },
  { name: 'Mountain Sunset', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=80' },
  { name: 'Lake Sunset Glow', url: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=1600&q=80' },
  { name: 'Golden Hour Field', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=80' },
  { name: 'Purple Dusk Sky', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1600&q=80' },
  { name: 'Sunrise Over Hills', url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1600&q=80' },
  // Mountains
  { name: 'Mountain Dawn', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80' },
  { name: 'Snowy Alpine Peak', url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1600&q=80' },
  { name: 'Mountain Lake Reflection', url: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=1600&q=80' },
  { name: 'Foggy Mountain Valley', url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600&q=80' },
  { name: 'Rocky Summit View', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80' },
  { name: 'Green Mountain Range', url: 'https://images.unsplash.com/photo-1458668383970-8ddd3927deed?w=1600&q=80' },
  // Forests & Trees
  { name: 'Golden Forest Rays', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80' },
  { name: 'Autumn Forest Path', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&q=80' },
  { name: 'Misty Pine Forest', url: 'https://images.unsplash.com/photo-1448518340475-e3c680e9b4c5?w=1600&q=80' },
  { name: 'Bamboo Forest Green', url: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=1600&q=80' },
  { name: 'Redwood Canopy', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80' },
  { name: 'Forest Stream Light', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80' },
  // Oceans & Beaches
  { name: 'Calming Ocean Sunset', url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1600&q=80' },
  { name: 'Tropical Beach Blue', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80' },
  { name: 'Wild Ocean Waves', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80' },
  { name: 'Sandy Shoreline', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80' },
  { name: 'Turquoise Lagoon', url: 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=1600&q=80' },
  { name: 'Sea Cliffs & Waves', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=80' },
  // Waterfalls & Rivers
  { name: 'Waterfall Cascade', url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1600&q=80' },
  { name: 'Hidden Waterfall', url: 'https://images.unsplash.com/photo-1546538915-a9e2c8d7e8c5?w=1600&q=80' },
  { name: 'Mountain River Flow', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80' },
  { name: 'Calm River Bend', url: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=1600&q=80' },
  // Sky & Clouds
  { name: 'Peaceful Sky & Clouds', url: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1600&q=80' },
  { name: 'Dramatic Storm Clouds', url: 'https://images.unsplash.com/photo-1504608524841-42f8c3cf5e8e?w=1600&q=80' },
  { name: 'Milky Way Stars', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80' },
  { name: 'Northern Lights', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&q=80' },
  { name: 'Moonrise Night', url: 'https://images.unsplash.com/photo-1504608524841-42f8c3cf5e8e?w=1600&q=80' },
  { name: 'Rainbow After Rain', url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80' },
  // Flowers & Gardens
  { name: 'Cherry Blossom Pink', url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1600&q=80' },
  { name: 'Wildflower Meadow', url: 'https://images.unsplash.com/photo-1457269449834-928af64c684d?w=1600&q=80' },
  { name: 'Lavender Fields', url: 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=1600&q=80' },
  { name: 'Sunflower Field', url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1600&q=80' },
  { name: 'Rose Garden', url: 'https://images.unsplash.com/photo-1457269449834-928af64c684d?w=1600&q=80' },
  // Green Landscapes
  { name: 'Rolling Green Hills', url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=80' },
  { name: 'Lush Valley', url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600&q=80' },
  { name: 'Tea Plantation', url: 'https://images.unsplash.com/photo-1536768139911-e290a59011e4?w=1600&q=80' },
  { name: 'Countryside Path', url: 'https://images.unsplash.com/photo-1458668383970-8ddd3927deed?w=1600&q=80' },
  // Desert & Rocks
  { name: 'Sand Dunes Gold', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80' },
  { name: 'Red Rock Canyon', url: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1600&q=80' },
  { name: 'Desert Dusk', url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80' },
  // Snow & Winter
  { name: 'Snowy Forest', url: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1600&q=80' },
  { name: 'Winter Wonderland', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=80' },
  { name: 'Frozen Lake', url: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=1600&q=80' },
  // Aerial & Wide
  { name: 'Aerial Green Earth', url: 'https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?w=1600&q=80' },
  { name: 'Aerial Ocean Reef', url: 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=1600&q=80' },
];

/**
 * Smart URL normalizer:
 * Extracts real image links from Google search wrappers, Google Drive, Dropbox, or any web URL
 */
export function normalizeImageUrl(input) {
  if (!input) return '';
  let url = input.trim();

  // If already a Data URL or Blob, accept directly
  if (url.startsWith('data:image/') || url.startsWith('blob:')) {
    return url;
  }

  // Handle Google Search redirect or Google Images wrapper: google.com/imgres?imgurl=... or google.com/url?q=...
  if (url.includes('google.') && (url.includes('imgurl=') || url.includes('url?q=') || url.includes('url='))) {
    try {
      const parsed = new URL(url);
      const imgurl = parsed.searchParams.get('imgurl') || parsed.searchParams.get('url') || parsed.searchParams.get('q');
      if (imgurl) {
        url = decodeURIComponent(imgurl);
      }
    } catch {
      const match = url.match(/[?&](?:imgurl|url|q)=([^&]+)/);
      if (match && match[1]) {
        url = decodeURIComponent(match[1]);
      }
    }
  }

  // Handle Google Drive view/sharing links -> Direct high-res image view
  if (url.includes('drive.google.com')) {
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
  }

  // Handle Dropbox links
  if (url.includes('dropbox.com')) {
    url = url.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1');
    if (!url.includes('raw=1')) {
      url += (url.includes('?') ? '&' : '?') + 'raw=1';
    }
    return url;
  }

  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    url = 'https://' + url;
  }

  return url;
}

export function NotionCover({ url, onChange, onRemove, editable = true }) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'presets' | 'link'
  const [customUrl, setCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pasteNotice, setPasteNotice] = useState('');
  const fileInputRef = useRef(null);

  // Compress & convert device image to high-quality lightweight Data URL
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1920;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        onChange(compressed);
        setIsUploading(false);
        setShowPicker(false);
      };

      img.onerror = () => {
        alert('Failed to process image. Please try another image.');
        setIsUploading(false);
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      alert('Error reading file.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDeviceUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  // Global & popover Clipboard Paste (Ctrl + V) Handler:
  // Automatically catches copied image files, copied images from Google, or pasted image links!
  useEffect(() => {
    if (!showPicker) return;

    const handleWindowPaste = (e) => {
      // 1. If pasting an image directly from clipboard (e.g. Right click -> Copy Image in Google)
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              e.preventDefault();
              setPasteNotice('Pasting copied image from clipboard...');
              processImageFile(blob);
              return;
            }
          }
        }
      }

      // 2. If pasting an image link/URL as text
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && (pastedText.startsWith('http') || pastedText.includes('google.') || pastedText.includes('data:image/'))) {
        e.preventDefault();
        const cleanUrl = normalizeImageUrl(pastedText);
        setPasteNotice('Applying pasted image URL...');
        onChange(cleanUrl);
        setTimeout(() => {
          setShowPicker(false);
          setPasteNotice('');
        }, 300);
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [showPicker, onChange]);

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
        <div className="mx-6 md:mx-12 mt-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xl animate-in fade-in zoom-in-95 duration-150 relative z-30 max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#C59B27]" />
              <span className="text-xs font-bold text-slate-800">Choose Cover Photo</span>
              <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                (Upload, Copy-Paste, or Paste Google Image Link)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Paste Notification Badge */}
          {pasteNotice && (
            <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C59B27]" />
              <span className="font-semibold">{pasteNotice}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 my-3 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload / Copy-Paste</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'link'
                  ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Paste Any Link / Google Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preset Gallery</span>
            </button>
          </div>

          {/* TAB 1: DEVICE UPLOAD & COPY-PASTE */}
          {activeTab === 'upload' && (
            <div className="py-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleDeviceUpload}
                className="hidden"
              />
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer?.files?.[0];
                  if (file) processImageFile(file);
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-amber-500 bg-amber-100/50 scale-[1.01]'
                    : isUploading
                    ? 'border-amber-400 bg-amber-50/50'
                    : 'border-slate-300 hover:border-[#C59B27] bg-slate-50/80 hover:bg-amber-50/30'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-600">
                    <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
                    <p className="text-xs font-bold text-slate-700">Optimizing & setting cover photo...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-600">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#C59B27]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Click to upload photo from device or drag & drop here
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        💡 <strong className="text-slate-700">Tip:</strong> You can also copy any photo from Google/web and press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-slate-800 font-mono text-[10px]">Ctrl + V</kbd> to paste directly!
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="px-4 py-1.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LINK (URL) / GOOGLE PHOTO */}
          {activeTab === 'link' && (
            <div className="py-2 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Paste Any Photo Link (Google Image, Drive, Web, or Direct Link):
                </label>
                <p className="text-[11px] text-slate-400 mb-2">
                  Works with Google search images, Google Drive image links, Unsplash, or any image URL.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customUrl.trim()) {
                          const normalized = normalizeImageUrl(customUrl);
                          onChange(normalized);
                          setCustomUrl('');
                          setShowPicker(false);
                        }
                      }
                    }}
                    placeholder="https://... or paste link here"
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrl.trim()) {
                        const normalized = normalizeImageUrl(customUrl);
                        onChange(normalized);
                        setCustomUrl('');
                        setShowPicker(false);
                      }
                    }}
                    className="px-5 py-2 rounded-xl bg-[#071B3B] text-[#F4B942] text-xs font-bold cursor-pointer transition hover:bg-[#0F294A] shrink-0"
                  >
                    Set Cover
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRESET GALLERY */}
          {activeTab === 'presets' && (
            <div className="py-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-1">
                {PRESET_COVERS.map((cov) => (
                  <button
                    key={cov.name}
                    type="button"
                    onClick={() => {
                      onChange(cov.url);
                      setShowPicker(false);
                    }}
                    className="group relative h-22 rounded-xl overflow-hidden border border-slate-200 hover:border-[#C59B27] transition cursor-pointer focus:ring-2 focus:ring-amber-500/30"
                  >
                    <img
                      src={cov.url}
                      alt={cov.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold text-white truncate drop-shadow">
                        {cov.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

NotionCover.Skeleton = function CoverSkeleton() {
  return <div className="h-44 sm:h-56 w-full bg-slate-200 animate-pulse" />;
};
