import { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Upload,
  LayoutGrid,
  SlidersHorizontal,
} from 'lucide-react';

export default function PhotoGalleryManager({
  targetPage = 'home',
  sectionTitleEn = 'Photo Gallery & Highlights',
  sectionTitleTe = 'చిత్రమాలిక & విశేషాలు',
  className = '',
}) {
  const { userProfile, currentUser } = useAuth();
  const { isTelugu } = useLanguage();
  const isAdmin =
    userProfile?.role === 'admin' ||
    currentUser?.email === 'surya11008@sni.org.in' ||
    currentUser?.email === 'admin@sni.org.in' ||
    localStorage.getItem('sni_admin_active') === 'true';

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // View Mode: 'slider' or 'grid'
  const [viewMode, setViewMode] = useState('slider');

  // Slider state
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Form states - Unified Single Language Input
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Active enlarged photo view
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(null);

  // Real-time listener for photos for this targetPage
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'site_photos'),
        where('targetPage', '==', targetPage)
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const items = [];
          snapshot.forEach((d) => {
            items.push({ id: d.id, ...d.data() });
          });
          // Sort client-side by order or createdAt
          items.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
          });
          setPhotos(items);
          setLoading(false);
        },
        (err) => {
          console.warn('Error fetching site_photos:', err);
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn('Error setting up site_photos listener:', err);
      setLoading(false);
    }
  }, [targetPage]);

  // Check slider scroll position
  const checkSliderScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScrollSlider = (direction) => {
    if (!sliderRef.current) return;
    const scrollAmount = sliderRef.current.clientWidth * 0.75;
    sliderRef.current.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkSliderScroll, 350);
  };

  const handleOpenAdd = () => {
    setEditingPhoto(null);
    setImageUrl('');
    setTitle('');
    setCaption('');
    setLinkUrl('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (photo, e) => {
    if (e) e.stopPropagation();
    setEditingPhoto(photo);
    setImageUrl(photo.imageUrl || '');
    setTitle(photo.title || photo.titleEn || photo.titleTe || '');
    setCaption(photo.caption || photo.captionEn || photo.captionTe || '');
    setLinkUrl(photo.linkUrl || '');
    setIsFormOpen(true);
  };

  const handleDelete = async (photoId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this photo?')) return;
    try {
      await deleteDoc(doc(db, 'site_photos', photoId));
      if (previewPhotoIndex !== null) setPreviewPhotoIndex(null);
    } catch (err) {
      alert('Failed to delete photo: ' + err.message);
    }
  };

  // Upload photo from device
  const handleDeviceUpload = (e) => {
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
        setImageUrl(compressed);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert('Please enter a valid image URL or upload a photo.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanTitle = title.trim() || 'Featured Photo';
      const cleanCaption = caption.trim();
      const payload = {
        targetPage,
        imageUrl: imageUrl.trim(),
        title: cleanTitle,
        titleEn: cleanTitle,
        titleTe: cleanTitle,
        caption: cleanCaption,
        captionEn: cleanCaption,
        captionTe: cleanCaption,
        linkUrl: linkUrl.trim() || null,
        updatedAt: serverTimestamp(),
      };

      if (editingPhoto?.id) {
        await updateDoc(doc(db, 'site_photos', editingPhoto.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'site_photos'), payload);
      }

      setIsFormOpen(false);
      setEditingPhoto(null);
    } catch (err) {
      console.error('Failed to save photo:', err);
      alert('Failed to save photo: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Lightbox Slide navigation
  const handleLightboxPrev = (e) => {
    if (e) e.stopPropagation();
    if (previewPhotoIndex === null) return;
    setPreviewPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleLightboxNext = (e) => {
    if (e) e.stopPropagation();
    if (previewPhotoIndex === null) return;
    setPreviewPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (previewPhotoIndex === null) return;
      if (e.key === 'ArrowLeft') handleLightboxPrev();
      if (e.key === 'ArrowRight') handleLightboxNext();
      if (e.key === 'Escape') setPreviewPhotoIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPhotoIndex, photos.length]);

  if (!loading && photos.length === 0 && !isAdmin) {
    return null;
  }

  const currentPreviewPhoto =
    previewPhotoIndex !== null ? photos[previewPhotoIndex] : null;

  return (
    <section className={`py-12 px-3 sm:px-6 md:px-8 lg:px-12 w-full max-w-[1720px] mx-auto ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C59B27] text-xs font-bold uppercase tracking-widest mb-1.5">
            <ImageIcon className="w-4 h-4 text-[#C59B27]" />
            <span>{isTelugu ? 'ఫొటోలు & విశేషాలు' : 'Visual Gallery'}</span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl font-bold text-[#0F294A] tracking-tight ${
              isTelugu ? 'font-krishna text-3xl' : 'font-serif'
            }`}
          >
            {isTelugu ? sectionTitleTe : sectionTitleEn}
          </h2>
        </div>

        {/* View Switcher & Admin Add Photo Button */}
        <div className="flex items-center gap-3">
          {/* Slider vs Grid Toggle */}
          {photos.length > 0 && (
            <div className="inline-flex items-center rounded-full bg-slate-100 p-0.5 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
                  viewMode === 'slider'
                    ? 'bg-[#0F294A] text-[#F4B942] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Sliding Carousel View"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isTelugu ? 'స్లైడర్' : 'Slider'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#0F294A] text-[#F4B942] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isTelugu ? 'గ్రిడ్' : 'Grid'}</span>
              </button>
            </div>
          )}

          {/* Admin Add Photo Button */}
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isTelugu ? '+ ఫొటో జోడించండి' : '+ Add Photo'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Add / Edit Form Modal */}
      {isFormOpen && (
        <div className="mb-10 p-6 rounded-3xl bg-white border border-[#C59B27]/40 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-[#0F294A] flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#C59B27]" />
              <span>{editingPhoto ? 'Edit Photo Details' : 'Add New Photo to Gallery'}</span>
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Photo (Upload from Device or Paste URL) *
              </label>
              
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition border border-slate-200">
                  <Upload className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Choose Photo from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDeviceUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-slate-400 text-[11px]">or enter URL below:</span>
              </div>

              <input
                type="url"
                required
                value={imageUrl && !imageUrl.startsWith('data:') ? imageUrl : ''}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or direct image link"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
              />

              {imageUrl && (
                <div className="mt-2.5 relative w-40 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Title / శీర్షిక
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Photo title / శీర్షిక..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Caption / Description (వివరణ)
              </label>
              <textarea
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Photo caption or description..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Optional Link / URL
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/page/... or https://..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Saving...' : editingPhoto ? 'Update Photo' : 'Save Photo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Photos Empty State */}
      {photos.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-slate-50 border border-dashed border-slate-200">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">
            {isAdmin
              ? 'No photos uploaded yet for this page. Click "+ Add Photo" to showcase photos here.'
              : 'Visual highlights will appear here soon.'}
          </p>
        </div>
      ) : viewMode === 'slider' ? (
        /* ============================================================== */
        /* A. SLIDER VIEW (Horizontal Smooth Sliding Carousel)             */
        /* ============================================================== */
        <div className="relative group/slider">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScrollSlider(-1)}
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#0F294A] flex items-center justify-center shadow-xl border border-slate-200 transition hover:scale-110 active:scale-95 cursor-pointer"
              title="Slide Left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScrollSlider(1)}
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#0F294A] flex items-center justify-center shadow-xl border border-slate-200 transition hover:scale-110 active:scale-95 cursor-pointer"
              title="Slide Right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Horizontal Sliding Track */}
          <div
            ref={sliderRef}
            onScroll={checkSliderScroll}
            className="flex items-stretch gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-1"
          >
            {photos.map((photo, idx) => {
              const title = isTelugu ? photo.titleTe || photo.titleEn : photo.titleEn || photo.titleTe;
              const caption = isTelugu ? photo.captionTe || photo.captionEn : photo.captionEn || photo.captionTe;

              return (
                <div
                  key={photo.id}
                  onClick={() => setPreviewPhotoIndex(idx)}
                  className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between shrink-0 w-[280px] sm:w-[320px] md:w-[360px]"
                >
                  {/* Image Container with 16:10 aspect ratio */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <img
                      src={photo.imageUrl}
                      alt={title || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-[#F4B942]" />
                        <span>{isTelugu ? 'పెద్దదిగా చూడండి' : 'Click to enlarge'}</span>
                      </span>
                    </div>

                    {/* Admin Edit / Delete Floating Badges */}
                    {isAdmin && (
                      <div
                        className="absolute top-3 right-3 flex items-center gap-1.5 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleOpenEdit(photo, e)}
                          className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-amber-700 shadow-md backdrop-blur-xs transition hover:scale-110 cursor-pointer"
                          title="Edit Photo"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(photo.id, e)}
                          className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-rose-600 shadow-md backdrop-blur-xs transition hover:scale-110 cursor-pointer"
                          title="Delete Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Caption / Details */}
                  {(title || caption) && (
                    <div className="p-4 sm:p-5">
                      {title && (
                        <h4
                          className={`text-sm sm:text-base font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors line-clamp-1 ${
                            isTelugu ? 'font-telugu' : 'font-sans'
                          }`}
                        >
                          {title}
                        </h4>
                      )}
                      {caption && (
                        <p
                          className={`text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed ${
                            isTelugu ? 'font-telugu' : ''
                          }`}
                        >
                          {caption}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* B. GRID VIEW                                                    */
        /* ============================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {photos.map((photo, idx) => {
            const title = isTelugu ? photo.titleTe || photo.titleEn : photo.titleEn || photo.titleTe;
            const caption = isTelugu ? photo.captionTe || photo.captionEn : photo.captionEn || photo.captionTe;

            return (
              <div
                key={photo.id}
                onClick={() => setPreviewPhotoIndex(idx)}
                className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                {/* Image Container with 16:10 aspect ratio */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <img
                    src={photo.imageUrl}
                    alt={title || 'Photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-[#F4B942]" />
                      <span>{isTelugu ? 'పెద్దదిగా చూడండి' : 'Click to enlarge'}</span>
                    </span>
                  </div>

                  {/* Admin Edit / Delete Floating Badges */}
                  {isAdmin && (
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1.5 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleOpenEdit(photo, e)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-amber-700 shadow-md backdrop-blur-xs transition hover:scale-110 cursor-pointer"
                        title="Edit Photo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(photo.id, e)}
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-rose-600 shadow-md backdrop-blur-xs transition hover:scale-110 cursor-pointer"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Caption / Details */}
                {(title || caption) && (
                  <div className="p-4 sm:p-5">
                    {title && (
                      <h4
                        className={`text-sm sm:text-base font-bold text-[#0F294A] group-hover:text-[#C59B27] transition-colors ${
                          isTelugu ? 'font-telugu' : 'font-sans'
                        }`}
                      >
                        {title}
                      </h4>
                    )}
                    {caption && (
                      <p
                        className={`text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed ${
                          isTelugu ? 'font-telugu' : ''
                        }`}
                      >
                        {caption}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. LIGHTBOX PREVIEW MODAL WITH SLIDING ARROWS (< and >)         */}
      {/* ============================================================== */}
      {currentPreviewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none"
          onClick={() => setPreviewPhotoIndex(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setPreviewPhotoIndex(null)}
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lightbox Previous Arrow */}
          {photos.length > 1 && (
            <button
              onClick={handleLightboxPrev}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition border border-white/20 shadow-xl cursor-pointer hover:scale-110 active:scale-95"
              title="Previous photo (←)"
            >
              <ChevronLeft className="w-7 h-7 -ml-0.5" />
            </button>
          )}

          {/* Lightbox Next Arrow */}
          {photos.length > 1 && (
            <button
              onClick={handleLightboxNext}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition border border-white/20 shadow-xl cursor-pointer hover:scale-110 active:scale-95"
              title="Next photo (→)"
            >
              <ChevronRight className="w-7 h-7 ml-0.5" />
            </button>
          )}

          {/* Content Box */}
          <div
            className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enlarged Photo */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] max-h-[72vh]">
              <img
                src={currentPreviewPhoto.imageUrl}
                alt="Enlarged"
                className="max-h-[72vh] w-auto max-w-full object-contain"
              />
            </div>

            {/* Footer Information & Photo Index */}
            <div className="p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#C59B27] uppercase">
                    Photo {previewPhotoIndex + 1} of {photos.length}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#0F294A] mt-0.5">
                  {isTelugu
                    ? currentPreviewPhoto.titleTe || currentPreviewPhoto.titleEn
                    : currentPreviewPhoto.titleEn || currentPreviewPhoto.titleTe}
                </h3>
                {currentPreviewPhoto.caption && (
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                    {isTelugu
                      ? currentPreviewPhoto.captionTe || currentPreviewPhoto.captionEn
                      : currentPreviewPhoto.captionEn || currentPreviewPhoto.captionTe}
                  </p>
                )}
              </div>

              {currentPreviewPhoto.linkUrl && (
                <a
                  href={currentPreviewPhoto.linkUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F294A] text-[#F4B942] text-xs font-bold hover:bg-[#071B3B] transition shrink-0"
                >
                  <span>Open Link</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
