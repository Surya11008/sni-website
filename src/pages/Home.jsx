import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PhotoGalleryManager from '../components/PhotoGalleryManager';
import { normalizeImageUrl } from '../components/notion/NotionCover';
import {
  Image as ImageIcon,
  Pencil,
  Trash2,
  X,
  Check,
  Upload,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
  Pause,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';

const HERO_CACHE_KEY = 'sni_hero_settings_cache_v3';

// Explicitly filter out the old church sanctuary photo so it NEVER displays again
export const isOldChurchPhoto = (url) => {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('1519491050282-cf00c82424b4') ||
    url.includes('photo-1519491050282') ||
    url.includes('church-pews-old')
  );
};

// Crystal-clear Ultra HD default wallpapers (No church pews)
const DEFAULT_HERO_PHOTOS = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=95',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2560&q=95',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=95',
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=2560&q=95',
];

const getCachedHeroSettings = () => {
  try {
    const raw = localStorage.getItem(HERO_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.bgImages) && parsed.bgImages.length > 0) {
        const clean = parsed.bgImages.filter((u) => Boolean(u) && !isOldChurchPhoto(u));
        if (clean.length > 0) {
          return {
            bgImages: clean,
            slideInterval: parsed.slideInterval || 4500,
            autoSlide: parsed.autoSlide !== false,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Hero cache read error:', err);
  }
  return null;
};

export default function Home() {
  const { currentUser, userProfile } = useAuth();
  const { isTelugu } = useLanguage();

  const isAdmin =
    currentUser?.email === 'surya11008@sni.org.in' ||
    currentUser?.email === 'admin@sni.org.in' ||
    currentUser?.email?.startsWith('surya') ||
    userProfile?.role === 'admin' ||
    localStorage.getItem('sni_admin_active') === 'true';

  // Load from local storage cache immediately (0ms delay) so no fallback photo ever flashes
  const [heroSettings, setHeroSettings] = useState(() => {
    const cached = getCachedHeroSettings();
    if (cached) return cached;
    return {
      bgImages: DEFAULT_HERO_PHOTOS,
      slideInterval: 4500,
      autoSlide: true,
    };
  });

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Modal State
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [heroForm, setHeroForm] = useState(() => ({
    bgImages: [...heroSettings.bgImages],
    slideInterval: heroSettings.slideInterval || 4500,
    autoSlide: heroSettings.autoSlide !== false,
  }));
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [savingHero, setSavingHero] = useState(false);

  // Touch Swipe Ref for Mobile
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // 1. Fetch Hero Settings from Firestore & sync cache
  useEffect(() => {
    let isMounted = true;
    async function loadHero() {
      try {
        const snap = await getDoc(doc(db, 'site_settings', 'home_hero'));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          let images = [];
          if (Array.isArray(data.bgImages) && data.bgImages.length > 0) {
            images = data.bgImages.filter(Boolean);
          } else if (data.bgImageUrl) {
            images = [data.bgImageUrl];
          }

          // Strict filter against old church photo
          images = images.filter((u) => !isOldChurchPhoto(u));

          if (images.length === 0) images = [...DEFAULT_HERO_PHOTOS];

          const loaded = {
            bgImages: images,
            slideInterval: data.slideInterval || 4500,
            autoSlide: data.autoSlide !== false,
          };
          setHeroSettings(loaded);
          setHeroForm(loaded);
          try {
            localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(loaded));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Could not load hero settings:', err);
      }
    }
    loadHero();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Global Paste Handler when Hero Modal is Open
  useEffect(() => {
    if (!isHeroModalOpen) return;
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              handleMultipleFilesSelect({ target: { files: [file] } });
              return;
            }
          }
        }
      }
      const text = e.clipboardData?.getData('text');
      if (text && /^https?:\/\//i.test(text.trim())) {
        const normalized = normalizeImageUrl(text.trim());
        if (!isOldChurchPhoto(normalized)) {
          setNewPhotoUrl(normalized);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isHeroModalOpen]);

  // 2. Auto-sliding timer
  useEffect(() => {
    if (!heroSettings.autoSlide || isPaused || heroSettings.bgImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSettings.bgImages.length);
    }, heroSettings.slideInterval || 4500);

    return () => clearInterval(timer);
  }, [heroSettings.autoSlide, isPaused, heroSettings.bgImages.length, heroSettings.slideInterval]);

  // Slide navigation
  const handlePrevSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentSlideIndex((prev) =>
      prev === 0 ? heroSettings.bgImages.length - 1 : prev - 1
    );
  };

  const handleNextSlide = (e) => {
    if (e) e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % heroSettings.bgImages.length);
  };

  // Touch swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) handleNextSlide();
    if (diff < -50) handlePrevSlide();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Save to Firestore & local cache
  const handleSaveHero = async (e) => {
    e.preventDefault();
    const cleanImages = heroForm.bgImages.filter((u) => Boolean(u) && !isOldChurchPhoto(u));
    if (cleanImages.length === 0) {
      alert('Please have at least one photo in the slideshow.');
      return;
    }
    setSavingHero(true);
    try {
      const payload = {
        bgImages: cleanImages,
        bgImageUrl: cleanImages[0] || '',
        slideInterval: Number(heroForm.slideInterval) || 4500,
        autoSlide: heroForm.autoSlide !== false,
        badge: '',
        title: '',
        subtitle: '',
      };
      await setDoc(doc(db, 'site_settings', 'home_hero'), payload);
      const updated = {
        bgImages: cleanImages,
        slideInterval: Number(heroForm.slideInterval) || 4500,
        autoSlide: heroForm.autoSlide !== false,
      };
      setHeroSettings(updated);
      try {
        localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(updated));
      } catch (e) {}
      setCurrentSlideIndex(0);
      setIsHeroModalOpen(false);
    } catch (err) {
      console.error('Failed to save hero settings:', err);
      alert('Failed to save: ' + err.message);
    } finally {
      setSavingHero(false);
    }
  };

  // Compress & upload multiple files with Ultra HD / 4K Clarity
  const handleMultipleFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 2560; // 2.5K/4K max dimension preserves ultra-sharp details
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
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // 0.94 high-fidelity quality prevents compression artifacts
          const compressed = canvas.toDataURL('image/jpeg', 0.94);

          setHeroForm((prev) => ({
            ...prev,
            bgImages: [...prev.bgImages.filter((u) => !isOldChurchPhoto(u)), compressed],
          }));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrl = () => {
    if (!newPhotoUrl.trim()) return;
    let url = normalizeImageUrl(newPhotoUrl.trim());
    if (isOldChurchPhoto(url)) {
      alert('This photo is deprecated and cannot be added.');
      setNewPhotoUrl('');
      return;
    }
    // Boost resolution if Unsplash link
    if (url.includes('images.unsplash.com') && !url.includes('w=')) {
      url += (url.includes('?') ? '&' : '?') + 'auto=format&fit=crop&w=2560&q=95';
    }
    setHeroForm((prev) => ({
      ...prev,
      bgImages: [...prev.bgImages.filter((u) => !isOldChurchPhoto(u)), url],
    }));
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (indexToRemove) => {
    setHeroForm((prev) => ({
      ...prev,
      bgImages: prev.bgImages.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleMovePhoto = (index, direction) => {
    const newImages = [...heroForm.bgImages];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setHeroForm((prev) => ({ ...prev, bgImages: newImages }));
  };

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900 selection:bg-[#C59B27] selection:text-[#0F294A] font-sans">
      {/* ============================================================== */}
      {/* 1. CINEMATIC HERO SLIDESHOW BANNER (Multiple Photos that Slide) */}
      {/* ============================================================== */}
      <section
        className="relative w-full min-h-[460px] sm:min-h-[520px] lg:h-[580px] overflow-hidden flex items-end bg-[#0F294A] select-none group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Layered Photos with Ultra HD Clarity, Hardware-Accelerated Rendering & Smooth Cross-fade */}
        {heroSettings.bgImages.map((imgUrl, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlideIndex
                ? 'opacity-100 z-0'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={imgUrl}
              alt={`Hero slide ${idx + 1}`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              fetchPriority={idx === 0 ? 'high' : 'low'}
              decoding="async"
              className="w-full h-full object-cover object-center select-none"
              style={{
                imageRendering: '-webkit-optimize-contrast',
                filter: 'contrast(1.02) saturate(1.04) brightness(0.99)',
              }}
            />
          </div>
        ))}

        {/* Ambient Vignette Overlay - refined to let background photo shine with full clarity & brightness */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F294A]/45 via-transparent to-black/15 pointer-events-none z-1"></div>

        {/* Previous Slide Arrow */}
        {heroSettings.bgImages.length > 1 && (
          <button
            type="button"
            onClick={handlePrevSlide}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/35 hover:bg-black/70 text-white flex items-center justify-center transition backdrop-blur-md border border-white/25 cursor-pointer shadow-xl hover:scale-110 active:scale-95"
            title="Previous Photo"
            aria-label="Previous Photo"
          >
            <ChevronLeft className="w-6 h-6 -ml-0.5" />
          </button>
        )}

        {/* Next Slide Arrow */}
        {heroSettings.bgImages.length > 1 && (
          <button
            type="button"
            onClick={handleNextSlide}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/35 hover:bg-black/70 text-white flex items-center justify-center transition backdrop-blur-md border border-white/25 cursor-pointer shadow-xl hover:scale-110 active:scale-95"
            title="Next Photo"
            aria-label="Next Photo"
          >
            <ChevronRight className="w-6 h-6 ml-0.5" />
          </button>
        )}

        {/* Admin Edit Slideshow Floating Button */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => {
                setHeroForm({
                  bgImages: [...heroSettings.bgImages.filter((u) => !isOldChurchPhoto(u))],
                  slideInterval: heroSettings.slideInterval || 4500,
                  autoSlide: heroSettings.autoSlide !== false,
                });
                setIsHeroModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Hero Photos & Slideshow ({heroSettings.bgImages.length})</span>
            </button>
          </div>
        )}

        {/* Hero Bottom Bar: Photo Gallery button + Slide Dots Indicators */}
        <div className="relative w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-10 z-10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
          {/* Photo Gallery Link Button */}
          <button
            onClick={() => handleScrollTo('photos-section')}
            className="inline-flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-[#0F294A]/60 hover:bg-[#0F294A]/90 backdrop-blur-md border border-white/40 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl cursor-pointer group"
          >
            <ImageIcon className="w-4 h-4 text-[#F4B942] group-hover:scale-110 transition-transform" />
            <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
              {isTelugu ? 'ఛాయాచిత్రాలు & విశేషాలు' : 'Photo Gallery'}
            </span>
          </button>

          {/* Slideshow Indicator Dots / Navigation Pills */}
          {heroSettings.bgImages.length > 1 && (
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/20 shadow-lg">
              {heroSettings.bgImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === currentSlideIndex
                      ? 'w-7 h-2.5 bg-[#F4B942] shadow-md'
                      : 'w-2.5 h-2.5 bg-white/50 hover:bg-white'
                  }`}
                  title={`Photo ${idx + 1}`}
                />
              ))}

              <span className="text-[11px] font-bold text-white/80 ml-1">
                {currentSlideIndex + 1}/{heroSettings.bgImages.length}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. DYNAMIC PHOTO SHOWCASE & VISUAL GALLERY                     */}
      {/* ============================================================== */}
      <div id="photos-section" className="bg-white border-b border-slate-200">
        <PhotoGalleryManager
          targetPage="home"
          sectionTitleEn="Featured Photos & Visual Gallery"
          sectionTitleTe="ముఖ్య ఛాయాచిత్రాలు & విశేషాలు"
        />
      </div>

      {/* ============================================================== */}
      {/* ADMIN HERO SLIDESHOW MODAL (Add more photos & set sliding)     */}
      {/* ============================================================== */}
      {isHeroModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#C59B27]" />
                <h3 className="text-base font-bold text-[#071B3B]">
                  Manage Hero Photos & Slideshow
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Ultra HD Clarity
                </span>
              </div>
              <button
                onClick={() => setIsHeroModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHero} className="flex-1 overflow-y-auto space-y-5 text-xs py-3 pr-1">
              {/* 1. Add Photos Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    + Add High Clarity Photos to Hero Slideshow
                  </label>
                  <span className="text-[11px] text-amber-700 font-medium">
                    Supports 4K/2K resolution & Copy-Paste (Ctrl+V)
                  </span>
                </div>

                {/* Option A: Upload Multiple from Device */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] text-xs font-bold cursor-pointer transition shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>Upload Multiple Full Clarity Photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleFilesSelect}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">
                    (Select one or many photos at once)
                  </span>
                </div>

                {/* Option B: Add by Image URL */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Or paste photo URL / Google link (https://...)"
                    className="flex-1 p-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-amber-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F4B942]" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* 2. Photo Gallery Grid of Active Slides */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800 text-xs">
                    Current Slides ({heroForm.bgImages.length} photos)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Use arrows to reorder or trash can to delete
                  </span>
                </div>

                {heroForm.bgImages.length === 0 ? (
                  <p className="text-center py-6 text-rose-500 font-semibold bg-rose-50 rounded-xl">
                    No photos added. Please add at least 1 photo.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {heroForm.bgImages.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video shadow-xs"
                      >
                        <img
                          src={url}
                          alt={`Slide ${idx + 1}`}
                          className="w-full h-full object-cover"
                          style={{ imageRendering: '-webkit-optimize-contrast' }}
                        />

                        {/* Slide Badge */}
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white font-bold text-[10px] shadow-sm">
                          #{idx + 1}
                        </div>

                        {/* Action buttons overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, -1)}
                              className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm transition"
                              title="Move Left"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition"
                            title="Delete this photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {idx < heroForm.bgImages.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMovePhoto(idx, 1)}
                              className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg shadow-sm transition"
                              title="Move Right"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Slideshow Transition Settings */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoSlideCheck"
                    checked={heroForm.autoSlide}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, autoSlide: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label
                    htmlFor="autoSlideCheck"
                    className="font-bold text-slate-700 cursor-pointer"
                  >
                    Auto-slide photos automatically
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-slate-600">Slide speed:</label>
                  <select
                    value={heroForm.slideInterval}
                    onChange={(e) =>
                      setHeroForm({
                        ...heroForm,
                        slideInterval: Number(e.target.value),
                      })
                    }
                    className="p-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                  >
                    <option value={3000}>3 seconds (Fast)</option>
                    <option value={4500}>4.5 seconds (Standard)</option>
                    <option value={6000}>6 seconds (Relaxed)</option>
                    <option value={8000}>8 seconds (Slow)</option>
                  </select>
                </div>
              </div>

              {/* Footer Save & Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHeroModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingHero || heroForm.bgImages.length === 0}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingHero ? 'Saving...' : 'Save Slideshow'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
