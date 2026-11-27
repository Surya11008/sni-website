import { useState, useEffect, useRef, useMemo } from 'react';
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
  Folder,
  FolderPlus,
  FolderOpen,
  Calendar,
  Download,
  Layers,
} from 'lucide-react';

export default function PhotoGalleryManager({
  targetPage = 'home',
  sectionTitleEn = 'Featured Photos & Visual Gallery',
  sectionTitleTe = 'ముఖ్య ఛాయాచిత్రాలు & విశేషాలు',
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

  // Album & Filter States
  const [selectedAlbumId, setSelectedAlbumId] = useState('all');
  const [viewingAlbum, setViewingAlbum] = useState(null); // Interactive Album Showcase modal

  // View Mode: 'slider' or 'grid'
  const [viewMode, setViewMode] = useState('slider');

  // Slider state
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Upload Mode: 'single' (one photo) | 'album' (batch multi-photo event album)
  const [uploadMode, setUploadMode] = useState('single');

  // Single Photo form states
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

  // Album Batch Upload form states
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDate, setAlbumDate] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [batchPhotos, setBatchPhotos] = useState([]); // Array of { id, url, name }
  const [batchUrlsInput, setBatchUrlsInput] = useState('');
  const [batchUploadProgress, setBatchUploadProgress] = useState({ current: 0, total: 0, active: false });
  const batchFileInputRef = useRef(null);

  // Active enlarged photo view in Lightbox
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
          // Sort client-side by order or createdAt descending
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

  // Derive unique event albums from photos
  const albums = useMemo(() => {
    const map = {};
    photos.forEach((p) => {
      if (p.albumTitle) {
        const id = p.albumId || p.albumTitle;
        if (!map[id]) {
          map[id] = {
            id,
            title: p.albumTitle,
            desc: p.albumDesc || '',
            date: p.albumDate || '',
            coverPhoto: p.imageUrl,
            photos: [],
          };
        }
        map[id].photos.push(p);
      }
    });
    return Object.values(map);
  }, [photos]);

  // Active selected album object
  const activeAlbum = useMemo(() => {
    if (selectedAlbumId === 'all') return null;
    return albums.find((a) => a.id === selectedAlbumId) || null;
  }, [albums, selectedAlbumId]);

  // Filtered photos based on album selection
  const displayedPhotos = useMemo(() => {
    if (selectedAlbumId === 'all') return photos;
    return photos.filter((p) => (p.albumId || p.albumTitle) === selectedAlbumId);
  }, [photos, selectedAlbumId]);

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

  // Open Form for Adding New Photo or Album
  const handleOpenAdd = (mode = 'single', existingAlbum = null) => {
    setEditingPhoto(null);
    setImageUrl('');
    setLinkInput('');
    setTitle('');
    setCaption('');
    setLinkUrl('');
    setInputSourceTab('upload');
    setUploadMode(mode);

    if (existingAlbum) {
      setAlbumTitle(existingAlbum.title);
      setAlbumDate(existingAlbum.date || '');
      setAlbumDesc(existingAlbum.desc || '');
    } else {
      setAlbumTitle('');
      setAlbumDate('');
      setAlbumDesc('');
    }

    setBatchPhotos([]);
    setBatchUrlsInput('');
    setBatchUploadProgress({ current: 0, total: 0, active: false });
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Photo
  const handleOpenEdit = (photo, e) => {
    if (e) e.stopPropagation();
    setEditingPhoto(photo);
    const photoUrl = photo.imageUrl || '';
    setImageUrl(photoUrl);
    setLinkInput(photoUrl.startsWith('data:') ? '' : photoUrl);
    setTitle(photo.title || photo.titleEn || photo.titleTe || '');
    setCaption(photo.caption || photo.captionEn || photo.captionTe || '');
    setLinkUrl(photo.linkUrl || '');
    setAlbumTitle(photo.albumTitle || '');
    setAlbumDate(photo.albumDate || '');
    setAlbumDesc(photo.albumDesc || '');
    setInputSourceTab(photoUrl.startsWith('data:') ? 'upload' : 'link');
    setUploadMode('single');
    setIsFormOpen(true);
  };

  // Delete individual photo
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

  // Delete entire album
  const handleDeleteAlbum = async (album, e) => {
    if (e) e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete the entire album "${album.title}" and all its ${album.photos.length} photos? This cannot be undone.`
      )
    )
      return;

    try {
      for (const p of album.photos) {
        await deleteDoc(doc(db, 'site_photos', p.id));
      }
      setSelectedAlbumId('all');
      if (viewingAlbum?.id === album.id) {
        setViewingAlbum(null);
      }
      alert('Album deleted successfully.');
    } catch (err) {
      alert('Failed to delete album: ' + err.message);
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

  // Upload single photo from device
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

    // If user selected multiple files in single mode, switch to album mode automatically!
    if (files.length > 1) {
      setUploadMode('album');
      setIsProcessingFile(true);
      try {
        const newItems = [];
        for (let i = 0; i < files.length; i++) {
          const compressed = await compressImageFile(files[i]);
          const nameWithoutExt = files[i].name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
          newItems.push({
            id: `${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
            url: compressed,
            name: nameWithoutExt,
          });
        }
        setBatchPhotos(newItems);
      } catch (err) {
        alert('Failed to process some image files.');
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  // Multi-photo batch selection for Album upload
  const handleBatchFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFile(true);
    try {
      const newItems = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i]);
        const nameWithoutExt = files[i].name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
        newItems.push({
          id: `${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
          url: compressed,
          name: nameWithoutExt,
        });
      }
      setBatchPhotos((prev) => [...prev, ...newItems]);
    } catch (err) {
      alert('Failed to process some files: ' + err.message);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Add URL links to batch photos
  const handleApplyBatchUrls = () => {
    if (!batchUrlsInput.trim()) return;
    const lines = batchUrlsInput.split(/\r?\n|,/).map((u) => u.trim()).filter(Boolean);
    const validUrls = [];
    lines.forEach((url, i) => {
      const normalized = normalizeImageUrl(url);
      if (normalized) {
        validUrls.push({
          id: `${Date.now()}_url_${i}_${Math.random().toString(36).substring(2, 7)}`,
          url: normalized,
          name: `Photo ${batchPhotos.length + validUrls.length + 1}`,
        });
      }
    });
    if (validUrls.length > 0) {
      setBatchPhotos((prev) => [...prev, ...validUrls]);
      setBatchUrlsInput('');
    } else {
      alert('No valid image URLs found.');
    }
  };

  // Clipboard Paste (Ctrl + V) listener when the photo form is open
  useEffect(() => {
    if (!isFormOpen) return;

    const handleWindowPaste = async (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'TEXTAREA' || activeTag === 'INPUT') return;

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
                if (uploadMode === 'album') {
                  setBatchPhotos((prev) => [
                    ...prev,
                    {
                      id: `${Date.now()}_paste_${Math.random().toString(36).substring(2, 7)}`,
                      url: compressed,
                      name: `Pasted Photo ${prev.length + 1}`,
                    },
                  ]);
                } else {
                  setImageUrl(compressed);
                }
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

      const text = e.clipboardData?.getData('text');
      if (text && (text.startsWith('http') || text.includes('google.') || text.startsWith('data:image/'))) {
        const normalized = normalizeImageUrl(text);
        if (normalized) {
          e.preventDefault();
          setPasteNotice('Applying pasted photo URL...');
          if (uploadMode === 'album') {
            setBatchPhotos((prev) => [
              ...prev,
              {
                id: `${Date.now()}_paste_url`,
                url: normalized,
                name: `Web Photo ${prev.length + 1}`,
              },
            ]);
          } else {
            setImageUrl(normalized);
            setLinkInput(normalized);
          }
          setTimeout(() => setPasteNotice(''), 1000);
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [isFormOpen, uploadMode]);

  // Handle Submit (Single photo or Album Batch)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mode A: Album Multi-Photo Batch Upload
    if (uploadMode === 'album') {
      if (!albumTitle.trim()) {
        alert('Please enter an Album / Event Title (ఆల్బమ్ లేదా ఈవెంట్ శీర్షిక ఇవ్వండి).');
        return;
      }
      if (batchPhotos.length === 0) {
        alert('Please select or paste at least one photo for the album (కనీసం ఒక ఫోటో అయినా జోడించండి).');
        return;
      }

      setSubmitting(true);
      setBatchUploadProgress({ current: 0, total: batchPhotos.length, active: true });

      try {
        const cleanAlbumTitle = albumTitle.trim();
        const generatedAlbumId = editingPhoto?.albumId || `album_${Date.now()}`;

        for (let i = 0; i < batchPhotos.length; i++) {
          setBatchUploadProgress({ current: i + 1, total: batchPhotos.length, active: true });
          const item = batchPhotos[i];
          await addDoc(collection(db, 'site_photos'), {
            targetPage,
            imageUrl: item.url,
            title: item.name || cleanAlbumTitle,
            titleEn: item.name || cleanAlbumTitle,
            titleTe: item.name || cleanAlbumTitle,
            caption: albumDesc.trim() || null,
            captionEn: albumDesc.trim() || null,
            captionTe: albumDesc.trim() || null,
            albumId: generatedAlbumId,
            albumTitle: cleanAlbumTitle,
            albumDate: albumDate || null,
            albumDesc: albumDesc.trim() || null,
            order: photos.length + i,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        setIsFormOpen(false);
        setSelectedAlbumId(generatedAlbumId);
        setBatchPhotos([]);
        alert(`Successfully published album "${cleanAlbumTitle}" with ${batchPhotos.length} photos!`);
      } catch (err) {
        alert('Failed during album upload: ' + err.message);
      } finally {
        setSubmitting(false);
        setBatchUploadProgress({ current: 0, total: 0, active: false });
      }
      return;
    }

    // Mode B: Single Photo Upload
    if (!imageUrl || !imageUrl.trim()) {
      alert('Please select or paste a photo.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanTitle = title.trim() || (albumTitle ? albumTitle.trim() : 'Featured Photo');
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
        albumTitle: albumTitle.trim() || null,
        albumId: albumTitle.trim() ? (editingPhoto?.albumId || `album_${Date.now()}`) : null,
        albumDate: albumDate || null,
        albumDesc: albumDesc.trim() || null,
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
    setPreviewPhotoIndex((prev) => (prev === 0 ? displayedPhotos.length - 1 : prev - 1));
  };

  const handleLightboxNext = (e) => {
    if (e) e.stopPropagation();
    if (previewPhotoIndex === null) return;
    setPreviewPhotoIndex((prev) => (prev === displayedPhotos.length - 1 ? 0 : prev + 1));
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
  }, [previewPhotoIndex, displayedPhotos.length]);

  // Download high-resolution photo
  const handleDownloadPhoto = (photo, e) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    link.download = `${(photo.title || 'photo').replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!loading && photos.length === 0 && !isAdmin) {
    return null;
  }

  const currentPreviewPhoto =
    previewPhotoIndex !== null && displayedPhotos[previewPhotoIndex]
      ? displayedPhotos[previewPhotoIndex]
      : null;

  return (
    <section className={`py-10 px-3 sm:px-6 md:px-8 lg:px-12 w-full max-w-[1720px] mx-auto ${className}`}>
      {/* ============================================================== */}
      {/* 1. MAIN SECTION HEADER BAR                                     */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C59B27] text-xs font-bold uppercase tracking-widest mb-1">
            <ImageIcon className="w-4 h-4 text-[#C59B27]" />
            <span>{isTelugu ? 'ఫొటోలు & విశేషాలు' : 'Visual Gallery'}</span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#071B3B] tracking-tight ${
              isTelugu ? 'font-krishna' : 'font-serif'
            }`}
          >
            {isTelugu ? sectionTitleTe : sectionTitleEn}
          </h2>
        </div>

        {/* View Switcher & Admin Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Slider vs Grid Toggle */}
          {displayedPhotos.length > 0 && (
            <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  viewMode === 'slider'
                    ? 'bg-[#071B3B] text-[#F4B942] shadow-xs'
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#071B3B] text-[#F4B942] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isTelugu ? 'గ్రిడ్' : 'Grid'}</span>
              </button>
            </div>
          )}

          {/* Admin Multi-Photo Event Album Button */}
          {isAdmin && (
            <button
              onClick={() => handleOpenAdd('album')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0"
              title="Upload an entire event photo album at once"
            >
              <FolderPlus className="w-4 h-4 stroke-[2.5]" />
              <span>{isTelugu ? '+ ఈవెంట్ ఆల్బమ్' : '+ Event Album'}</span>
            </button>
          )}

          {/* Admin Add Single Photo Button */}
          {isAdmin && (
            <button
              onClick={() => handleOpenAdd('single')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isTelugu ? '+ ఫొటో' : '+ Add Photo'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. ALBUM HEADER & ALBUMS SELECTOR                               */}
      {/* Displays directly underneath "Featured Photos & Visual Gallery" */}
      {/* ============================================================== */}

      {/* A. DEDICATED ACTIVE ALBUM HEADER BANNER */}
      {activeAlbum && (
        <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#071B3B] via-[#0F294A] to-[#132A4A] text-white border border-[#C59B27]/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F4B942] text-[#071B3B] font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                <FolderOpen className="w-3 h-3" />
                <span>Event Album</span>
              </span>
              {activeAlbum.date && (
                <span className="text-xs text-amber-200 flex items-center gap-1 font-semibold">
                  <Calendar className="w-3 h-3 text-[#F4B942]" />
                  <span>{activeAlbum.date}</span>
                </span>
              )}
              <span className="text-xs text-slate-300 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full">
                📸 {activeAlbum.photos.length} {activeAlbum.photos.length === 1 ? 'Photo' : 'Photos'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight font-serif truncate">
              {activeAlbum.title}
            </h3>

            {activeAlbum.desc && (
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-3xl leading-relaxed">
                {activeAlbum.desc}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setViewingAlbum(activeAlbum)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isTelugu ? 'ఆల్బమ్ తెరవండి' : 'Open Album View'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedAlbumId('all')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isTelugu ? 'అన్ని ఫొటోలు' : 'View All Photos'}</span>
            </button>

            {isAdmin && (
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  type="button"
                  onClick={() => handleOpenAdd('album', activeAlbum)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 transition cursor-pointer"
                  title="Add more photos to this album"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteAlbum(activeAlbum, e)}
                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition cursor-pointer"
                  title="Delete Album"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* B. HORIZONTAL ALBUMS NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3 mb-6 border-b border-slate-100 text-xs">
        <button
          type="button"
          onClick={() => setSelectedAlbumId('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
            selectedAlbumId === 'all'
              ? 'bg-[#071B3B] text-[#F4B942] border-[#071B3B] shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isTelugu ? `అన్ని ఫొటోలు (${photos.length})` : `All Photos (${photos.length})`}</span>
        </button>

        {albums.map((album) => {
          const isSelected = selectedAlbumId === album.id;
          return (
            <button
              key={album.id}
              type="button"
              onClick={() => setSelectedAlbumId(isSelected ? 'all' : album.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#071B3B] text-[#F4B942] border-[#071B3B] shadow-xs ring-2 ring-[#F4B942]/40'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-slate-50'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>{album.title}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-extrabold text-slate-700">
                {album.photos.length}
              </span>
            </button>
          );
        })}

        {isAdmin && (
          <button
            type="button"
            onClick={() => handleOpenAdd('album')}
            className="px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer border border-dashed border-amber-400 bg-amber-50 hover:bg-amber-100 text-[#071B3B] flex items-center gap-1.5 ml-auto"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>{isTelugu ? '+ ఈవెంట్ ఆల్బమ్' : '+ Create Event Album'}</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. ADMIN ADD / EDIT FORM MODAL                                  */}
      {/* ============================================================== */}
      {isFormOpen && (
        <div className="mb-10 p-6 rounded-3xl bg-white border border-[#C59B27]/40 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-[#071B3B] flex items-center gap-2">
              {uploadMode === 'album' ? (
                <FolderPlus className="w-5 h-5 text-[#C59B27]" />
              ) : (
                <ImageIcon className="w-5 h-5 text-[#C59B27]" />
              )}
              <span>
                {uploadMode === 'album'
                  ? 'Create / Upload Event Photo Album (మొత్తం ఈవెంట్ ఫొటోలు ఒకేసారి)'
                  : editingPhoto
                  ? 'Edit Photo Details'
                  : 'Add Single Photo to Gallery'}
              </span>
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Mode Switcher: Single vs Album */}
            {!editingPhoto && (
              <div className="flex items-center gap-2 p-1.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 mb-2">
                <button
                  type="button"
                  onClick={() => setUploadMode('single')}
                  className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
                    uploadMode === 'single'
                      ? 'bg-[#071B3B] text-[#F4B942] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Single Photo Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('album')}
                  className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
                    uploadMode === 'album'
                      ? 'bg-[#071B3B] text-[#F4B942] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FolderPlus className="w-4 h-4 text-[#F4B942]" />
                  <span>📁 Event Album (Multi-Photo Batch Upload)</span>
                </button>
              </div>
            )}

            {/* Quick Paste Notification Badge */}
            {pasteNotice && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C59B27]" />
                <span className="font-semibold">{pasteNotice}</span>
              </div>
            )}

            {/* -------------------------------------------------------- */}
            {/* IF ALBUM BATCH UPLOAD MODE                               */}
            {/* -------------------------------------------------------- */}
            {uploadMode === 'album' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Event / Album Title (ఈవెంట్ / ఆల్బమ్ శీర్షిక) *
                    </label>
                    <input
                      type="text"
                      required
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      placeholder="e.g. 2026 Sacred Passover Celebration / New Song Festival..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Event Date (ఈవెంట్ తేదీ - Optional)
                    </label>
                    <input
                      type="date"
                      value={albumDate}
                      onChange={(e) => setAlbumDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Album Description / Summary (వివరణ - Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={albumDesc}
                    onChange={(e) => setAlbumDesc(e.target.value)}
                    placeholder="Brief description of the event or gathering..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs bg-white"
                  />
                </div>

                {/* Batch Multi-Photo Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-700">
                      Select Photos for this Album ({batchPhotos.length} chosen) *
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Select multiple photos, drag & drop, or paste URLs
                    </span>
                  </div>

                  <input
                    ref={batchFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBatchFilesSelected}
                    className="hidden"
                  />

                  <div
                    onClick={() => !isProcessingFile && batchFileInputRef.current?.click()}
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
                        handleBatchFilesSelected({ target: { files } });
                      }
                    }}
                    className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition ${
                      isDragging
                        ? 'border-amber-500 bg-amber-100/50 scale-[1.01]'
                        : isProcessingFile
                        ? 'border-amber-400 bg-amber-50/50'
                        : 'border-slate-300 hover:border-[#C59B27] bg-slate-50/70 hover:bg-amber-50/20'
                    }`}
                  >
                    {isProcessingFile ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-3 text-slate-600">
                        <Loader2 className="w-8 h-8 text-[#C59B27] animate-spin" />
                        <p className="font-bold text-slate-800">Compressing & preparing photos...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1.5 text-slate-600">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-[#C59B27] mb-1">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="font-black text-slate-800 text-sm">
                          Click to choose multiple photos from device or drag & drop here
                        </p>
                        <p className="text-xs text-slate-500">
                          Supports selecting 5, 10, 20+ photos all at once (JPG, PNG, WebP)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Or paste multiple links */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 block">Or Paste Photo URLs (Google Images / Drive):</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={batchUrlsInput}
                      onChange={(e) => setBatchUrlsInput(e.target.value)}
                      placeholder="Paste image link(s) separated by commas or new lines..."
                      className="flex-1 p-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBatchUrls}
                      className="px-3 py-1.5 rounded-xl bg-[#071B3B] text-[#F4B942] font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Batch Photo Thumbnails Preview Strip */}
                {batchPhotos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs">
                        Album Photos Preview ({batchPhotos.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => setBatchPhotos([])}
                        className="text-rose-600 hover:underline text-[11px] font-bold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-56 overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                      {batchPhotos.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-white shadow-2xs"
                        >
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setBatchPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 rounded-md bg-black/60 hover:bg-rose-600 text-white transition cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded bg-black/60 text-[9px] text-white truncate font-medium">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Batch Upload Progress Indicator */}
                {batchUploadProgress.active && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                      <span>Uploading Album Photos...</span>
                      <span>
                        {batchUploadProgress.current} / {batchUploadProgress.total} (
                        {Math.round((batchUploadProgress.current / batchUploadProgress.total) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-amber-200 overflow-hidden">
                      <div
                        className="h-full bg-[#071B3B] transition-all duration-200"
                        style={{
                          width: `${(batchUploadProgress.current / batchUploadProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* -------------------------------------------------------- */
              /* IF SINGLE PHOTO UPLOAD MODE                              */
              /* -------------------------------------------------------- */
              <div className="space-y-4">
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
                            <p className="font-bold text-slate-700">Processing photo...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 py-1 text-slate-600">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#C59B27] mb-1">
                              <Upload className="w-5 h-5" />
                            </div>
                            <p className="font-bold text-slate-800 text-xs">
                              Click to choose photo from device or drag & drop here
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Supports single photo or multiple photos (JPG, PNG, WebP)
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
                          className="px-4 py-2 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-bold text-xs shrink-0 cursor-pointer"
                        >
                          Apply Link
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PHOTO PREVIEW CARD */}
                  {imageUrl && (
                    <div className="mt-3 p-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-4 animate-in fade-in duration-150">
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs shrink-0">
                          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                            <span>Photo Ready to Save</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs sm:max-w-md">
                            {imageUrl.startsWith('data:') ? 'Uploaded from device' : imageUrl}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      Assign to Album (ఆల్బమ్ - Optional)
                    </label>
                    <input
                      type="text"
                      value={albumTitle}
                      onChange={(e) => setAlbumTitle(e.target.value)}
                      placeholder="e.g. 2026 Sacred Passover Assembly"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs bg-white"
                    />
                  </div>
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
              </div>
            )}

            {/* Form Footer Action Buttons */}
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
                className="px-6 py-2.5 rounded-xl bg-[#071B3B] hover:bg-[#0F294A] text-[#F4B942] font-black text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : isProcessingFile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Photos...</span>
                  </>
                ) : uploadMode === 'album' ? (
                  <span>Publish Event Album ({batchPhotos.length} Photos)</span>
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

      {/* ============================================================== */}
      {/* 4. GALLERY SHOWCASE (Slider View or Grid View)                  */}
      {/* ============================================================== */}
      {displayedPhotos.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-slate-50 border border-dashed border-slate-200">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">
            {selectedAlbumId !== 'all'
              ? 'No photos in this album yet.'
              : isAdmin
              ? 'No photos uploaded yet for this page. Click "+ Event Album" or "+ Add Photo" to showcase photos here.'
              : 'Visual highlights will appear here soon.'}
          </p>
        </div>
      ) : viewMode === 'slider' ? (
        /* SLIDER VIEW */
        <div className="relative group/slider">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScrollSlider(-1)}
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#071B3B] flex items-center justify-center shadow-xl border border-slate-200 transition hover:scale-110 active:scale-95 cursor-pointer"
              title="Slide Left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScrollSlider(1)}
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 hover:bg-white text-[#071B3B] flex items-center justify-center shadow-xl border border-slate-200 transition hover:scale-110 active:scale-95 cursor-pointer"
              title="Slide Right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div
            ref={sliderRef}
            onScroll={checkSliderScroll}
            className="flex items-stretch gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-4 px-1"
          >
            {displayedPhotos.map((photo, idx) => {
              const photoTitle = isTelugu ? photo.titleTe || photo.titleEn : photo.titleEn || photo.titleTe;
              const photoCaption = isTelugu ? photo.captionTe || photo.captionEn : photo.captionEn || photo.captionTe;

              return (
                <div
                  key={photo.id}
                  onClick={() => setPreviewPhotoIndex(idx)}
                  className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between shrink-0 w-[280px] sm:w-[320px] md:w-[360px]"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <img
                      src={photo.imageUrl}
                      alt={photoTitle || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-[#F4B942]" />
                        <span>{isTelugu ? 'పెద్దదిగా చూడండి' : 'Click to enlarge'}</span>
                      </span>
                    </div>

                    {photo.albumTitle && (
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[#F4B942] text-[10px] font-bold border border-white/20">
                        📁 {photo.albumTitle}
                      </span>
                    )}

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

                  {(photoTitle || photoCaption) && (
                    <div className="p-4 sm:p-5">
                      {photoTitle && (
                        <h4
                          className={`text-sm sm:text-base font-bold text-[#071B3B] group-hover:text-[#C59B27] transition-colors line-clamp-1 ${
                            isTelugu ? 'font-telugu' : 'font-sans'
                          }`}
                        >
                          {photoTitle}
                        </h4>
                      )}
                      {photoCaption && (
                        <p
                          className={`text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed ${
                            isTelugu ? 'font-telugu' : ''
                          }`}
                        >
                          {photoCaption}
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
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayedPhotos.map((photo, idx) => {
            const photoTitle = isTelugu ? photo.titleTe || photo.titleEn : photo.titleEn || photo.titleTe;
            const photoCaption = isTelugu ? photo.captionTe || photo.captionEn : photo.captionEn || photo.captionTe;

            return (
              <div
                key={photo.id}
                onClick={() => setPreviewPhotoIndex(idx)}
                className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                  <img
                    src={photo.imageUrl}
                    alt={photoTitle || 'Photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-[#F4B942]" />
                      <span>{isTelugu ? 'పెద్దదిగా చూడండి' : 'Click to enlarge'}</span>
                    </span>
                  </div>

                  {photo.albumTitle && (
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[#F4B942] text-[10px] font-bold border border-white/20">
                      📁 {photo.albumTitle}
                    </span>
                  )}

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

                {(photoTitle || photoCaption) && (
                  <div className="p-4 sm:p-5">
                    {photoTitle && (
                      <h4
                        className={`text-sm sm:text-base font-bold text-[#071B3B] group-hover:text-[#C59B27] transition-colors ${
                          isTelugu ? 'font-telugu' : 'font-sans'
                        }`}
                      >
                        {photoTitle}
                      </h4>
                    )}
                    {photoCaption && (
                      <p
                        className={`text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed ${
                          isTelugu ? 'font-telugu' : ''
                        }`}
                      >
                        {photoCaption}
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
      {/* 5. INTERACTIVE ALBUM SHOWCASE MODAL ("andaru album open chesi") */}
      {/* ============================================================== */}
      {viewingAlbum && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            {/* Modal Top Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#071B3B] via-[#0F294A] to-[#132A4A] text-white flex items-center justify-between gap-4 border-b border-amber-500/30">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F4B942] text-[#071B3B] font-black text-[10px] uppercase tracking-wider">
                    Event Photo Album
                  </span>
                  {viewingAlbum.date && (
                    <span className="text-xs text-amber-200 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#F4B942]" />
                      <span>{viewingAlbum.date}</span>
                    </span>
                  )}
                  <span className="text-xs text-slate-300 bg-white/10 px-2 py-0.5 rounded-full font-semibold">
                    {viewingAlbum.photos.length} Photos
                  </span>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-white font-serif truncate">
                  {viewingAlbum.title}
                </h3>
                {viewingAlbum.desc && (
                  <p className="text-xs sm:text-sm text-slate-300 max-w-3xl line-clamp-2">
                    {viewingAlbum.desc}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const firstIdx = displayedPhotos.findIndex(
                      (p) => (p.albumId || p.albumTitle) === viewingAlbum.id
                    );
                    setPreviewPhotoIndex(firstIdx >= 0 ? firstIdx : 0);
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#F4B942] hover:bg-[#e0a42e] text-[#071B3B] font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Start Slideshow</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingAlbum(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Close Album"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photos Grid inside Album */}
            <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] bg-slate-50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {viewingAlbum.photos.map((photo, pIdx) => (
                  <div
                    key={photo.id}
                    onClick={() => {
                      const idx = displayedPhotos.findIndex((item) => item.id === photo.id);
                      setPreviewPhotoIndex(idx >= 0 ? idx : 0);
                    }}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-xs hover:shadow-lg transition cursor-pointer hover:scale-[1.02]"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.title || 'Photo'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                      <span className="text-white text-xs font-bold truncate">
                        {photo.title || `Photo ${pIdx + 1}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. FULLSCREEN LIGHTBOX PREVIEW MODAL (With Next/Prev & Download)*/}
      {/* ============================================================== */}
      {currentPreviewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none"
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
          {displayedPhotos.length > 1 && (
            <button
              onClick={handleLightboxPrev}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition border border-white/20 shadow-xl cursor-pointer hover:scale-110 active:scale-95"
              title="Previous photo (←)"
            >
              <ChevronLeft className="w-7 h-7 -ml-0.5" />
            </button>
          )}

          {/* Lightbox Next Arrow */}
          {displayedPhotos.length > 1 && (
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

            {/* Footer Information & Actions */}
            <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#C59B27] uppercase">
                    Photo {previewPhotoIndex + 1} of {displayedPhotos.length}
                  </span>
                  {currentPreviewPhoto.albumTitle && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      • 📁 {currentPreviewPhoto.albumTitle}
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#071B3B]">
                  {isTelugu
                    ? currentPreviewPhoto.titleTe || currentPreviewPhoto.titleEn
                    : currentPreviewPhoto.titleEn || currentPreviewPhoto.titleTe}
                </h3>
                {currentPreviewPhoto.caption && (
                  <p className="text-xs text-slate-600 line-clamp-2 max-w-2xl">
                    {isTelugu
                      ? currentPreviewPhoto.captionTe || currentPreviewPhoto.captionEn
                      : currentPreviewPhoto.captionEn || currentPreviewPhoto.captionTe}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDownloadPhoto(currentPreviewPhoto, e)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  title="Download High-Resolution Photo"
                >
                  <Download className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Download</span>
                </button>

                {currentPreviewPhoto.linkUrl && (
                  <a
                    href={currentPreviewPhoto.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#071B3B] text-[#F4B942] text-xs font-bold hover:bg-[#0F294A] transition"
                  >
                    <span>Open Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
