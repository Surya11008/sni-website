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
import { normalizeImageUrl } from './notion/NotionCover';
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
  Link as LinkIcon,
  Loader2,
  Check,
  Sparkles,
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
  const [inputSourceTab, setInputSourceTab] = useState('upload'); // 'upload' | 'link'
  const [linkInput, setLinkInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [pasteNotice, setPasteNotice] = useState('');
  const fileInputRef = useRef(null);

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
    setLinkInput('');
    setTitle('');
    setCaption('');
    setLinkUrl('');
    setInputSourceTab('upload');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (photo, e) => {
    if (e) e.stopPropagation();
    setEditingPhoto(photo);
    const photoUrl = photo.imageUrl || '';
    setImageUrl(photoUrl);
    setLinkInput(photoUrl.startsWith('data:') ? '' : photoUrl);
    setTitle(photo.title || photo.titleEn || photo.titleTe || '');
    setCaption(photo.caption || photo.captionEn || photo.captionTe || '');
    setLinkUrl(photo.linkUrl || '');
    setInputSourceTab(photoUrl.startsWith('data:') ? 'upload' : 'link');
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

  // High-res canvas image compressor (fast & lightweight)
  const compressImageFile = (file) => {
    return new Promise((resolve, reject) => {
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
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Upload photo(s) from device: supports single photo or batch upload
  const handleDeviceUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length === 1) {
      setIsProcessingFile(true);
      try {
        const compressed = await compressImageFile(files[0]);
        setImageUrl(compressed);
        if (!title.trim()) {
          const nameWithoutExt = files[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
          setTitle(nameWithoutExt);
        }
      } catch (err) {
        alert('Failed to process image file.');
      } finally {
        setIsProcessingFile(false);
      }
      return;
    }

    // Batch upload: multiple photos selected
    if (files.length > 1) {
      if (!window.confirm(`Upload all ${files.length} photos to the gallery at once?`)) return;
      setIsProcessingFile(true);
      try {
        for (let i = 0; i < files.length; i++) {
          const compressed = await compressImageFile(files[i]);
          const nameWithoutExt = files[i].name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
          await addDoc(collection(db, 'site_photos'), {
            targetPage,
            imageUrl: compressed,
            title: nameWithoutExt,
            titleEn: nameWithoutExt,
            titleTe: nameWithoutExt,
            caption: '',
            captionEn: '',
            captionTe: '',
            linkUrl: null,
            order: photos.length + i,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        setIsFormOpen(false);
        alert(`Successfully added ${files.length} photos!`);
      } catch (err) {
        alert('Failed during batch upload: ' + err.message);
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  // Clipboard Paste (Ctrl + V) listener when the photo form is open
  useEffect(() => {
    if (!isFormOpen) return;

    const handleWindowPaste = async (e) => {
      // Don't intercept if user is typing text in title or caption inputs
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'TEXTAREA') return;
      if (document.activeElement?.id === 'gallery-title-input' || document.activeElement?.id === 'gallery-caption-input') return;

      // Check if image blob is in clipboard (e.g. Right click -> Copy Image in Google)
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              e.preventDefault();
              setPasteNotice('Pasting copied photo from clipboard...');
              setIsProcessingFile(true);
              try {
                const compressed = await compressImageFile(blob);
                setImageUrl(compressed);
                setPasteNotice('');
              } catch (err) {
                alert('Failed to paste copied photo.');
              } finally {
                setIsProcessingFile(false);
              }
              return;
            }
          }
        }
      }

      // Check if image URL is pasted as text
      const text = e.clipboardData?.getData('text');
      if (text && (text.startsWith('http') || text.includes('google.') || text.startsWith('data:image/'))) {
        const normalized = normalizeImageUrl(text);
        if (normalized) {
          e.preventDefault();
          setPasteNotice('Applying pasted photo URL...');
          setImageUrl(normalized);
          setLinkInput(normalized);
          setTimeout(() => setPasteNotice(''), 1000);
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [isFormOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl || !imageUrl.trim()) {
      alert('Please select or paste a photo.');
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
      setImageUrl('');
      setLinkInput('');
      setTitle('');
      setCaption('');
      setLinkUrl('');
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
            {/* Quick Paste Notification Badge */}
            {pasteNotice && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C59B27]" />
                <span className="font-semibold">{pasteNotice}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block font-bold text-slate-800 text-xs">
                  Photo (Upload, Copy-Paste, or Paste Any Link) *
                </label>
                <span className="text-[11px] text-slate-400">
                  Accepts Google Images, Drive, Device Upload, or Ctrl+V
                </span>
              </div>

              {/* Source Tabs */}
              <div className="flex items-center gap-1 mb-3 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInputSourceTab('upload')}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    inputSourceTab === 'upload'
                      ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Upload from Device / Copy-Paste</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputSourceTab('link')}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    inputSourceTab === 'link'
                      ? 'bg-white text-[#071B3B] shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Paste Any Link / Google Photo</span>
                </button>
              </div>

              {/* TAB 1: DEVICE UPLOAD & DRAG & DROP & CTRL+V */}
              {inputSourceTab === 'upload' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDeviceUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => !isProcessingFile && fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const files = e.dataTransfer?.files;
                      if (files && files.length > 0) {
                        handleDeviceUpload({ target: { files } });
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition ${
                      isDragging
                        ? 'border-amber-500 bg-amber-100/50 scale-[1.01]'
                        : isProcessingFile
                        ? 'border-amber-400 bg-amber-50/50'
                        : 'border-slate-300 hover:border-[#C59B27] bg-slate-50/70 hover:bg-amber-50/20'
                    }`}
                  >
                    {isProcessingFile ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-2 text-slate-600">
                        <Loader2 className="w-7 h-7 text-[#C59B27] animate-spin" />
                        <p className="font-bold text-slate-700">Processing & compressing photo...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 py-1 text-slate-600">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#C59B27] mb-1">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="font-bold text-slate-800 text-xs">
                          Click to choose photo(s) from device or drag & drop here
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Supports single or multiple photos (JPG, PNG, WebP)
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          💡 Tip: You can also copy any photo from Google/web and press <kbd className="px-1.5 py-0.5 bg-slate-200 rounded font-mono text-slate-800 text-[10px]">Ctrl + V</kbd> to paste!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: LINK / GOOGLE PHOTO */}
              {inputSourceTab === 'link' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="photo-gallery-url-input"
                      type="text"
                      value={linkInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLinkInput(val);
                        if (val.trim()) {
                          const normalized = normalizeImageUrl(val);
                          setImageUrl(normalized);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (linkInput.trim()) {
                            const normalized = normalizeImageUrl(linkInput);
                            setImageUrl(normalized);
                            setLinkInput(normalized);
                          }
                        }
                      }}
                      placeholder="Paste image link, Google search photo link, or Google Drive URL..."
                      className="flex-1 p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs bg-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (linkInput.trim()) {
                          const normalized = normalizeImageUrl(linkInput);
                          setImageUrl(normalized);
                          setLinkInput(normalized);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Apply Link
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Works seamlessly with Google search images, Google Drive photo links, Unsplash, or any web image URL.
                  </p>
                </div>
              )}

              {/* PHOTO PREVIEW CARD */}
              {imageUrl && (
                <div className="mt-3 p-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-4 animate-in fade-in duration-150">
                  <div className="flex items-center gap-3">
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs shrink-0">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                        <span>Photo Ready to Save</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs sm:max-w-md">
                        {imageUrl.startsWith('data:') ? 'Uploaded from device (Optimized JPEG)' : imageUrl}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setLinkInput('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition shrink-0"
                    title="Remove Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Title (Optional / శీర్షిక)
              </label>
              <input
                id="gallery-title-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Photo title / శీర్షిక (optional)..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Caption / Description (Optional / వివరణ)
              </label>
              <textarea
                id="gallery-caption-input"
                rows={2}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Photo caption or description (optional)..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Optional Redirect Link / URL
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/page/... or https://..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs bg-white"
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
                disabled={submitting || isProcessingFile}
                className="px-5 py-2 rounded-xl bg-[#0F294A] hover:bg-[#071B3B] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : isProcessingFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Photo...</span>
                  </>
                ) : editingPhoto ? (
                  <span>Update Photo</span>
                ) : (
                  <span>Save Photo</span>
                )}
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
