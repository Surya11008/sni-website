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
    badge: 'SUPER NATURAL INTELLIGENCE - OFFICIAL HUB',
    title: 'Welcome to Super Natural Intelligence',
    subtitle: 'A centralized sanctuary of fellowship, broadcast archives, and ministerial applications.',
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
          setHeroSettings((prev) => ({ ...prev, ...data }));
          setHeroForm((prev) => ({ ...prev, ...data }));
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
      await setDoc(doc(db, 'site_settings', 'home_hero'), heroForm);
      setHeroSettings({ ...heroForm });
      setIsHeroModalOpen(false);
    } catch (err) {
      console.error('Failed to save hero settings:', err);
      alert('Failed to save: ' + err.message);
    } finally {
      setSavingHero(false);
    }
  };

  const handleScrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-slate-900 selection:bg-[#C59B27] selection:text-[#0F294A] font-sans">
      {/* 1. FULL-WIDTH CINEMATIC HERO BANNER (Admin background photo add/change/remove & content edit) */}
      <section className="relative w-full min-h-[500px] sm:h-[520px] overflow-hidden flex items-center bg-[#0F294A]">
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

        {/* Sophisticated Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F294A]/95 via-[#0F294A]/75 to-[#0F294A]/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F294A]/90 via-transparent to-black/30"></div>

        {/* Admin Edit Hero Floating Button */}
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => {
                setHeroForm({ ...heroSettings });
                setIsHeroModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Hero & Background</span>
            </button>
          </div>
        )}

        {/* Hero Content Container */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
          <div className="max-w-2xl text-left text-white space-y-5">
            {/* Sub-Badge */}
            {heroSettings.badge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-[#C59B27]/50 text-[#C59B27] text-xs font-semibold uppercase tracking-widest shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C59B27] animate-ping"></span>
                <span>{heroSettings.badge}</span>
              </div>
            )}

            {/* Inspirational Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] font-serif">
              <span className="text-white drop-shadow-sm">{heroSettings.title}</span>
            </h1>

            {/* Subtitle */}
            {heroSettings.subtitle && (
              <p className="text-slate-200 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl font-normal">
                {heroSettings.subtitle}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handleScrollTo('photos-section')}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-white/40 text-white hover:bg-white/10 font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-sm cursor-pointer group"
              >
                <ImageIcon className="w-4 h-4 text-[#F4B942]" />
                <span className={isTelugu ? 'font-telugu tracking-normal normal-case' : ''}>
                  {isTelugu ? 'ఛాయాచిత్రాలు & విశేషాలు' : 'Photo Gallery'}
                </span>
              </button>
            </div>
          </div>
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

      {/* ADMIN HERO SETTINGS MODAL */}
      {isHeroModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#071B3B] flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#C59B27]" />
                <span>Edit Hero Banner & Background</span>
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
                  Background Photo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={heroForm.bgImageUrl || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, bgImageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/... or any photo link"
                    className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20"
                  />
                  {heroForm.bgImageUrl && (
                    <button
                      type="button"
                      onClick={() => setHeroForm({ ...heroForm, bgImageUrl: '' })}
                      className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      title="Remove background photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                {heroForm.bgImageUrl ? (
                  <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={heroForm.bgImageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    No photo selected (sleek dark blue gradient will be displayed).
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Top Badge Text</label>
                <input
                  type="text"
                  value={heroForm.badge || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value })}
                  placeholder="SUPER NATURAL INTELLIGENCE - OFFICIAL HUB"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Headline Title *</label>
                <input
                  type="text"
                  value={heroForm.title || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                  placeholder="Welcome to Super Natural Intelligence"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle Description</label>
                <textarea
                  rows={3}
                  value={heroForm.subtitle || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                  placeholder="A centralized sanctuary of fellowship, broadcast archives, and ministerial applications."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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