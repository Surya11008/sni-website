import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PhotoGalleryManager from '../components/PhotoGalleryManager';
import {
  Image as ImageIcon,
  Pencil,
  Trash2,
  X,
  Check,
  Upload,
} from 'lucide-react';

export default function Home() {
  const { currentUser, userProfile } = useAuth();
  const { isTelugu } = useLanguage();

  const isAdmin =
    currentUser?.email === 'surya11008@sni.org.in' ||
    currentUser?.email === 'admin@sni.org.in' ||
    currentUser?.email?.startsWith('surya') ||
    userProfile?.role === 'admin' ||
    localStorage.getItem('sni_admin_active') === 'true';

  const [heroSettings, setHeroSettings] = useState({
    bgImageUrl: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&w=2000&q=85',
  });

  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [heroForm, setHeroForm] = useState({ ...heroSettings });
  const [savingHero, setSavingHero] = useState(false);

  // Fetch Hero Settings from Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadHero() {
      try {
        const snap = await getDoc(doc(db, 'site_settings', 'home_hero'));
        if (snap.exists() && isMounted) {
          const data = snap.data();
          setHeroSettings((prev) => ({ ...prev, bgImageUrl: data.bgImageUrl || prev.bgImageUrl }));
          setHeroForm((prev) => ({ ...prev, bgImageUrl: data.bgImageUrl || prev.bgImageUrl }));
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

  const handleSaveHero = async (e) => {
    e.preventDefault();
    setSavingHero(true);
    try {
      const payload = {
        bgImageUrl: heroForm.bgImageUrl || '',
        badge: '',
        title: '',
        subtitle: '',
      };
      await setDoc(doc(db, 'site_settings', 'home_hero'), payload);
      setHeroSettings({ bgImageUrl: heroForm.bgImageUrl || '' });
      setIsHeroModalOpen(false);
    } catch (err) {
      console.error('Failed to save hero settings:', err);
      alert('Failed to save: ' + err.message);
    } finally {
      setSavingHero(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        setHeroForm((prev) => ({ ...prev, bgImageUrl: compressed }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900 selection:bg-[#C59B27] selection:text-[#0F294A] font-sans">
      {/* 1. FULL-WIDTH CINEMATIC HERO BANNER (Clean photo view without text overlay) */}
      <section className="relative w-full min-h-[460px] sm:min-h-[520px] lg:h-[580px] overflow-hidden flex items-end bg-[#0F294A]">
        {/* Background Image (if set) */}
        {heroSettings.bgImageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100 hover:scale-105"
            style={{
              backgroundImage: `url('${heroSettings.bgImageUrl}')`,
            }}
          ></div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#071B3B] via-[#0F294A] to-[#122847]"></div>
        )}

        {/* Subtle Ambient Vignette (Soft top and bottom shadow to keep background photo clear & bright) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F294A]/70 via-transparent to-black/25 pointer-events-none"></div>

        {/* Admin Edit Hero Floating Button */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => {
                setHeroForm({ bgImageUrl: heroSettings.bgImageUrl });
                setIsHeroModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Hero & Background</span>
            </button>
          </div>
        )}

        {/* Hero Bottom Bar / Actions */}
        <div className="relative w-full max-w-[1720px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pb-8 sm:pb-10 z-10">
          <button
            onClick={() => handleScrollTo('photos-section')}
            className="inline-flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-[#0F294A]/60 hover:bg-[#0F294A]/90 backdrop-blur-md border border-white/40 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-xl cursor-pointer group"
          >
            <ImageIcon className="w-4 h-4 text-[#F4B942] group-hover:scale-110 transition-transform" />
            <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
              {isTelugu ? 'ఛాయాచిత్రాలు & విశేషాలు' : 'Photo Gallery'}
            </span>
          </button>
        </div>
      </section>

      {/* 2. DYNAMIC PHOTO SHOWCASE & VISUAL GALLERY (Admin editable) */}
      <div id="photos-section" className="bg-white border-b border-slate-200">
        <PhotoGalleryManager
          targetPage="home"
          sectionTitleEn="Featured Photos & Visual Gallery"
          sectionTitleTe="ముఖ్య ఛాయాచిత్రాలు & విశేషాలు"
        />
      </div>

      {/* ADMIN HERO SETTINGS MODAL (Pure Photo Manager - Text options removed) */}
      {isHeroModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#071B3B] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#C59B27]" />
                <span>Edit Hero Background Photo</span>
              </h3>
              <button
                onClick={() => setIsHeroModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHero} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Background Photo (Add / Change / Remove)
                </label>
                
                {/* Options: File Upload from Device or Paste URL */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition border border-slate-200">
                      <Upload className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>Upload Photo from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>

                    {heroForm.bgImageUrl && (
                      <button
                        type="button"
                        onClick={() => setHeroForm({ ...heroForm, bgImageUrl: '' })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition border border-rose-200 cursor-pointer"
                        title="Remove background photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={heroForm.bgImageUrl && !heroForm.bgImageUrl.startsWith('data:') ? heroForm.bgImageUrl : ''}
                      onChange={(e) => setHeroForm({ ...heroForm, bgImageUrl: e.target.value })}
                      placeholder="Or paste image URL (https://...)"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                {heroForm.bgImageUrl ? (
                  <div className="mt-2.5 relative h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-xs">
                    <img
                      src={heroForm.bgImageUrl}
                      alt="Hero Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="px-3 py-1.5 rounded-lg bg-white/95 text-[#0F294A] font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-white shadow-sm">
                        <Upload className="w-3 h-3 text-[#C59B27]" />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    No photo selected (sleek dark blue gradient will be displayed).
                  </p>
                )}
              </div>

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
                  disabled={savingHero}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingHero ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
