import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ArrowLeft,
  PlusCircle,
  Pencil,
  Trash2,
  FileText,
  Video,
  Music,
  File,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  CheckCircle2,
  Lock,
  Upload,
  Link as LinkIcon,
  X,
  AlertCircle,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { transformToEmbedUrl, detectMediaType, isEmbeddable, isGoogleDoc, isAudioUrl, isVideoUrl, getGoogleDriveFileId } from '../../utils/embedUtils';
import { getLocalFileData, saveLocalFileData } from '../../utils/fileStorage';
import { loadChunkedFileData } from '../../firebase/firestoreService';
import DocumentViewer from '../common/DocumentViewer';
import StarAudioPlayer from '../common/StarAudioPlayer';
import StarVideoPlayer from '../common/StarVideoPlayer';
import LinkifiedText from '../common/LinkifiedText';

/**
 * Accurately resolve file category by inspect URL, extension & embed source
 * So YouTube/Vimeo -> 'video', Spotify/MP3 -> 'audio', PDF -> 'pdf', Photos -> 'image', etc.
 */
export function resolveFileCategory(file) {
  if (!file) return 'doc';
  const url = (file.originalUrl || file.fileUrl || '').trim().toLowerCase();
  const title = (file.title || file.fileName || '').trim().toLowerCase();

  // 1. Explicit user category override
  if (file.category && ['video', 'audio', 'pdf', 'image', 'file'].includes(file.category)) {
    return file.category;
  }

  // 2. Video links: YouTube, Shorts, Vimeo, direct video extensions, or title hints
  if (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.match(/\.(mp4|webm|mov|mkv|avi|3gp|flv)($|\?)/) ||
    url.startsWith('data:video/') ||
    title.match(/\b(video|movie|recording|shorts)\b/) ||
    title.match(/\.(mp4|webm|mov|mkv)$/)
  ) {
    return 'video';
  }

  // 3. Audio links: Spotify, SoundCloud, direct audio extensions, or title hints
  if (
    url.includes('spotify.com') ||
    url.includes('soundcloud.com') ||
    url.match(/\.(mp3|wav|m4a|aac|ogg|opus|flac|wma)($|\?)/) ||
    url.startsWith('data:audio/') ||
    title.match(/\b(audio|song|music|podcast|voice|track|mp3)\b/) ||
    title.match(/\.(mp3|wav|m4a|aac)$/)
  ) {
    return 'audio';
  }

  // 4. PDF files
  if (
    url.endsWith('.pdf') ||
    url.includes('.pdf?') ||
    url.startsWith('data:application/pdf') ||
    title.endsWith('.pdf') ||
    title.includes('pdf')
  ) {
    return 'pdf';
  }

  // 5. Photos & images
  if (
    url.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp)($|\?)/) ||
    url.startsWith('data:image/') ||
    title.match(/\.(jpg|jpeg|png|webp|gif)$/)
  ) {
    return 'image';
  }

  // 6. Google Docs, Sheets, Slides, Drive or documents
  if (
    url.includes('docs.google.com') ||
    url.includes('drive.google.com') ||
    url.match(/\.(doc|docx|xls|xlsx|ppt|pptx|txt|rtf|csv|odt)($|\?)/)
  ) {
    return 'doc';
  }

  return file.category || 'doc';
}

export default function FilesManager({ onBack }) {
  const {
    currentUser,
    data,
    addSharedFile,
    updateSharedFile,
    deleteSharedFile,
    t,
  } = useApp();

  // Accordion state: only one file expanded at any time!
  const [expandedFileId, setExpandedFileId] = useState(null);

  // File reading & submitting states for Device Upload
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [fileReadSuccess, setFileReadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loaded full data URLs for chunked files
  const [loadedDataUrls, setLoadedDataUrls] = useState({});
  const [loadingChunkId, setLoadingChunkId] = useState(null);

  // Modal state for Admin Add / Edit File
  const [showModal, setShowModal] = useState(false);
  const [editingFileId, setEditingFileId] = useState(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('doc'); // 'doc' | 'pdf' | 'video' | 'audio' | 'link'
  const [formSourceTab, setFormSourceTab] = useState('link'); // 'link' | 'upload'
  const [formUrl, setFormUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [formAssignMode, setFormAssignMode] = useState('all'); // 'all' | 'specific'
  const [formSelectedMemberIds, setFormSelectedMemberIds] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [formAllowDownload, setFormAllowDownload] = useState(true);

  // Approved users list for assignment
  const approvedUsers = useMemo(() => {
    return (data.users || []).filter(u => u.status === 'approved');
  }, [data.users]);

  // Filter approved users for the assignment modal search
  const filteredUsersForAssign = useMemo(() => {
    if (!memberSearchQuery.trim()) return approvedUsers;
    const q = memberSearchQuery.toLowerCase();
    return approvedUsers.filter(u =>
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.nickname && u.nickname.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  }, [approvedUsers, memberSearchQuery]);

  // Visible files: Admin sees ALL; regular members see ONLY files assigned to them or "all"
  const visibleFiles = useMemo(() => {
    const allFiles = data.sharedFiles || [];
    if (currentUser?.role === 'admin') {
      return allFiles;
    }
    return allFiles.filter(f => {
      if (!f.assignedTo || f.assignedTo === 'all') return true;
      if (Array.isArray(f.assignedTo)) {
        return f.assignedTo.includes('all') || f.assignedTo.includes(currentUser?.id);
      }
      return false;
    });
  }, [data.sharedFiles, currentUser]);

  // Active Category Filter for list
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  // Filtered files according to category filter
  const filteredVisibleFiles = useMemo(() => {
    if (activeCategoryFilter === 'all') return visibleFiles;
    return visibleFiles.filter(f => resolveFileCategory(f) === activeCategoryFilter);
  }, [visibleFiles, activeCategoryFilter]);

  // Toggle accordion item with lazy loading for chunked / local files
  const toggleAccordion = async (fileId) => {
    if (expandedFileId === fileId) {
      setExpandedFileId(null);
      return;
    }
    setExpandedFileId(fileId);

    const file = visibleFiles.find(f => f.id === fileId);
    if (!file) return;

    // If dataUrl not present in file object and not loaded in memory yet
    const hasActiveUrl = Boolean(file.fileUrl || file.originalUrl || loadedDataUrls[fileId]);
    if (!hasActiveUrl) {
      setLoadingChunkId(fileId);
      try {
        // 1. Try local IndexedDB first
        const localData = await getLocalFileData(fileId);
        if (localData) {
          setLoadedDataUrls(prev => ({ ...prev, [fileId]: localData }));
          setLoadingChunkId(null);
          return;
        }

        // 2. Fetch chunks from Firestore if chunked
        if (file.isChunked && file.totalChunks > 0) {
          const fullData = await loadChunkedFileData(fileId, file.totalChunks);
          if (fullData) {
            await saveLocalFileData(fileId, fullData);
            setLoadedDataUrls(prev => ({ ...prev, [fileId]: fullData }));
          }
        }
      } catch (err) {
        console.error('Error loading file content:', err);
      } finally {
        setLoadingChunkId(null);
      }
    }
  };

  // Open modal for new file
  const handleOpenAddModal = () => {
    setEditingFileId(null);
    setFormTitle('');
    setFormDesc('');
    setFormCategory('doc');
    setFormSourceTab('link');
    setFormUrl('');
    setUploadedFileName('');
    setIsReadingFile(false);
    setFileReadSuccess(false);
    setIsSubmitting(false);
    setFormAssignMode('all');
    setFormSelectedMemberIds([]);
    setMemberSearchQuery('');
    setFormAllowDownload(true);
    setShowModal(true);
  };

  // Open modal for editing existing file
  const handleOpenEditModal = (file, e) => {
    e.stopPropagation();
    setEditingFileId(file.id);
    setFormTitle(file.title || '');
    setFormDesc(file.description || '');
    setFormCategory(file.category || 'doc');
    setFormSourceTab('link');
    setFormUrl(file.originalUrl || file.fileUrl || '');
    setUploadedFileName('');
    setIsReadingFile(false);
    setFileReadSuccess(false);
    setIsSubmitting(false);
    setFormAllowDownload(file.allowDownload !== false);
    if (Array.isArray(file.assignedTo) && !file.assignedTo.includes('all')) {
      setFormAssignMode('specific');
      setFormSelectedMemberIds(file.assignedTo);
    } else {
      setFormAssignMode('all');
      setFormSelectedMemberIds([]);
    }
    setMemberSearchQuery('');
    setShowModal(true);
  };

  // Quick toggle download permission (Admin)
  const handleToggleDownload = async (file, e) => {
    e.stopPropagation();
    const nextVal = !(file.allowDownload !== false);
    await updateSharedFile({
      id: file.id,
      allowDownload: nextVal,
    });
  };

  // Handle local file upload (Supports Audio, Video, Image, PDF, Docs & Any Files)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setFileReadSuccess(false);
    setIsReadingFile(true);

    if (!formTitle.trim()) {
      setFormTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isAudio = file.type.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma', 'opus'].includes(ext);
    const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'mkv', 'avi', '3gp', 'flv'].includes(ext);
    const isPdf = file.type === 'application/pdf' || ext === 'pdf';
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext);
    const isDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv', 'odt', 'ods', 'odp'].includes(ext);

    if (isAudio) setFormCategory('audio');
    else if (isVideo) setFormCategory('video');
    else if (isPdf) setFormCategory('pdf');
    else if (isImage) setFormCategory('image');
    else if (isDoc) setFormCategory('doc');
    else setFormCategory('file');

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setFormUrl(uploadEvent.target.result);
      setIsReadingFile(false);
      setFileReadSuccess(true);
    };
    reader.onerror = () => {
      alert('Failed to read the file from device.');
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle embed link input with automatic category detection (Audio, Video, PDF, Image, Doc)
  const handleUrlChange = (newUrl) => {
    setFormUrl(newUrl);
    const trimmed = newUrl.trim();
    if (!trimmed) return;

    const detected = resolveFileCategory({
      originalUrl: trimmed,
      fileUrl: trimmed,
      title: formTitle,
      category: '',
    });
    if (detected) {
      setFormCategory(detected);
    }
  };

  const handleTitleChange = (newTitle) => {
    setFormTitle(newTitle);
    if (formUrl.trim()) {
      const detected = resolveFileCategory({
        originalUrl: formUrl,
        fileUrl: formUrl,
        title: newTitle,
        category: formCategory,
      });
      if (detected && detected !== formCategory) {
        setFormCategory(detected);
      }
    }
  };

  // Toggle member in specific assignment list
  const toggleMemberAssign = (userId) => {
    setFormSelectedMemberIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllMembers = () => {
    setFormSelectedMemberIds(approvedUsers.map(u => u.id));
  };

  const handleClearAllMembers = () => {
    setFormSelectedMemberIds([]);
  };

  // Save form (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Please enter a title for the file.');
      return;
    }
    if (isReadingFile) {
      alert('The file is still being processed from your device. Please wait a moment.');
      return;
    }
    if (!formUrl.trim()) {
      alert('Please provide a Google Drive / Docs link or choose a file from device.');
      return;
    }

    const rawUrl = formUrl.trim();
    const embedUrl = transformToEmbedUrl(rawUrl);

    let assignedTo = ['all'];
    let assignedNames = ['All Members'];

    if (formAssignMode === 'specific') {
      if (formSelectedMemberIds.length === 0) {
        alert('Please select at least one member to assign this file, or select "All Members".');
        return;
      }
      assignedTo = formSelectedMemberIds;
      assignedNames = approvedUsers
        .filter(u => formSelectedMemberIds.includes(u.id))
        .map(u => u.name || u.nickname || u.id);
    }

    let finalCategory = formCategory;
    const detected = resolveFileCategory({
      originalUrl: rawUrl,
      fileUrl: embedUrl,
      title: formTitle,
      fileName: uploadedFileName,
      category: formCategory,
    });
    if (detected) {
      finalCategory = detected;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDesc.trim(),
      category: finalCategory,
      fileUrl: embedUrl,
      originalUrl: rawUrl,
      fileName: uploadedFileName || formTitle.trim(),
      allowDownload: formAllowDownload,
      assignedTo,
      assignedNames,
    };

    setIsSubmitting(true);
    try {
      if (editingFileId) {
        await updateSharedFile({
          id: editingFileId,
          ...payload,
        });
      } else {
        await addSharedFile(payload);
      }

      // Reset category filter so the newly uploaded file is immediately visible!
      setActiveCategoryFilter('all');
      setShowModal(false);
      setEditingFileId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to save file: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get icon by category
  const renderCategoryIcon = (category) => {
    switch (category) {
      case 'audio':
        return <Music className="w-4 h-4 text-purple-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-rose-600" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-pink-600" />;
      case 'file':
        return <File className="w-4 h-4 text-sky-600" />;
      case 'doc':
      default:
        return <File className="w-4 h-4 text-teal-600" />;
    }
  };

  // Get category badge style
  const getCategoryBadge = (category) => {
    switch (category) {
      case 'audio':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black shadow-2xs';
      case 'video':
        return 'bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black shadow-2xs';
      case 'pdf':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black shadow-2xs';
      case 'image':
        return 'bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black shadow-2xs';
      case 'file':
        return 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black shadow-2xs';
      case 'doc':
      default:
        return 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-2xs';
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
              📁
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Files
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                {visibleFiles.length} {visibleFiles.length === 1 ? 'file available' : 'files available'}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Add File Button */}
        {currentUser?.role === 'admin' && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add File</span>
          </button>
        )}
      </div>

      {/* Category Filter Tabs with Dynamic File Type Counts */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All' },
          { id: 'doc', label: '📄 Docs' },
          { id: 'audio', label: '🎵 Audio' },
          { id: 'video', label: '🎥 Video' },
          { id: 'pdf', label: '📕 PDF' },
          { id: 'image', label: '🖼️ Photos' },
          { id: 'file', label: '📁 Files' },
        ].map(cat => {
          const count = cat.id === 'all'
            ? visibleFiles.length
            : visibleFiles.filter(f => resolveFileCategory(f) === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeCategoryFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeCategoryFilter === cat.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Accordion Files List */}
      {filteredVisibleFiles.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white rounded-3xl border border-dashed border-emerald-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 text-2xl">
            📂
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800">
            {currentUser?.role === 'admin'
              ? 'No files added yet in this category.'
              : 'No files currently assigned to you in this category.'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            {currentUser?.role === 'admin'
              ? 'Click "+ Add File" above to embed documents, videos, audios, or PDFs and assign them to members.'
              : 'Files assigned to you by the Admin will appear here.'}
          </p>
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add First File</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredVisibleFiles.map((file) => {
            const isExpanded = expandedFileId === file.id;
            const isAssignedToAll = !file.assignedTo || file.assignedTo.includes('all');
            const assignedCount = Array.isArray(file.assignedTo) ? file.assignedTo.length : 0;

            return (
              <div
                key={file.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                  isExpanded ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* 🏷️ Title Only Bar (Clicking expands downwards, and closes other open files) */}
                <div
                  onClick={() => toggleAccordion(file.id)}
                  className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                      {renderCategoryIcon(resolveFileCategory(file))}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                          {file.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryBadge(resolveFileCategory(file))}`}>
                          {resolveFileCategory(file)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Download Permission Toggle (ON / OFF) */}
                    {currentUser?.role === 'admin' ? (
                      <button
                        type="button"
                        onClick={(e) => handleToggleDownload(file, e)}
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                          file.allowDownload !== false
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                        title="Click to toggle Download ON / OFF for this file"
                      >
                        {file.allowDownload !== false ? (
                          <>
                            <Download className="w-3 h-3 text-emerald-600" />
                            <span>Download: ON</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>Download: OFF</span>
                          </>
                        )}
                      </button>
                    ) : (
                      file.allowDownload === false && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                          <span>View Only</span>
                        </span>
                      )
                    )}

                    {/* Admin Assignment Badge */}
                    {currentUser?.role === 'admin' && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>{isAssignedToAll ? 'All Members' : `${assignedCount} Members`}</span>
                      </span>
                    )}

                    {/* Admin Actions: Edit & Delete */}
                    {currentUser?.role === 'admin' && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(file, e)}
                          title="Edit File"
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${file.title}"?`)) {
                              deleteSharedFile(file.id);
                            }
                          }}
                          title="Delete File"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Accordion Chevron Indicator */}
                    <div className="p-1 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 📂 Expanded Content (Revealed ONLY when clicked) */}
                {isExpanded && (
                  <div className="px-3.5 pb-4 sm:px-4 sm:pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 animate-in fade-in duration-200">
                    {/* File Description if any */}
                    {file.description && (
                      <LinkifiedText
                        as="p"
                        text={file.description}
                        className="text-xs text-slate-600 font-medium mb-3 leading-relaxed whitespace-pre-wrap"
                      />
                    )}

                    {/* Embed Player / Viewer */}
                    {(() => {
                      const activeFileUrl = file.fileUrl || file.originalUrl || loadedDataUrls[file.id] || '';
                      const isFileLoading = loadingChunkId === file.id;
                      const effectiveCategory = resolveFileCategory(file);

                      return (
                        <>
                          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 mb-3 shadow-inner">
                            {isFileLoading ? (
                              <div className="p-10 bg-slate-900 flex flex-col items-center justify-center text-white text-center">
                                <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-xs font-bold text-slate-300">Loading file content from cloud...</p>
                              </div>
                            ) : (effectiveCategory === 'audio' || isAudioUrl(activeFileUrl)) ? (
                              <StarAudioPlayer
                                url={activeFileUrl}
                                title={file.title}
                                fileName={file.fileName}
                                allowDownload={file.allowDownload !== false || currentUser?.role === 'admin'}
                              />
                            ) : (effectiveCategory === 'video' || isVideoUrl(activeFileUrl)) ? (
                              <StarVideoPlayer
                                url={activeFileUrl}
                                title={file.title}
                                fileName={file.fileName}
                                allowDownload={file.allowDownload !== false || currentUser?.role === 'admin'}
                              />
                            ) : (effectiveCategory === 'image' || activeFileUrl.startsWith('data:image/')) ? (
                              <div className="p-2 bg-slate-950 flex items-center justify-center">
                                <img
                                  src={activeFileUrl}
                                  alt={file.title}
                                  className="max-h-[460px] max-w-full object-contain rounded-xl"
                                />
                              </div>
                            ) : (effectiveCategory === 'doc' || effectiveCategory === 'pdf' || effectiveCategory === 'file' || isGoogleDoc(activeFileUrl) || isGoogleDoc(file.originalUrl) || activeFileUrl.startsWith('data:')) ? (
                              <DocumentViewer
                                fileUrl={activeFileUrl}
                                originalUrl={file.originalUrl}
                                title={file.title}
                                category={effectiveCategory}
                                fileName={file.fileName}
                                hideHeader={true}
                                allowDownload={file.allowDownload !== false || currentUser?.role === 'admin'}
                              />
                            ) : (
                              <div className="relative w-full h-80 sm:h-[520px] bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col">
                                <iframe
                                  src={transformToEmbedUrl(activeFileUrl)}
                                  title={file.title}
                                  className="w-full flex-1 border-0 bg-white"
                                  allow="autoplay; encrypted-media; fullscreen; clipboard-write; clipboard-read"
                                  allowFullScreen
                                />
                                <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs px-4">
                                  <span className="text-[11px] text-slate-500 font-medium truncate mr-2">
                                    Web Link / Cloud Preview • If provider blocks embedding, open directly:
                                  </span>
                                  <a
                                    href={file.originalUrl || activeFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 shrink-0"
                                  >
                                    <span>Open Link</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bottom Action Bar */}
                          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>Created: {file.createdAt || 'Recent'}</span>
                              {currentUser?.role === 'admin' && !isAssignedToAll && (
                                <span className="text-emerald-700 font-semibold">
                                  • Assigned: {(file.assignedNames || []).join(', ') || `${assignedCount} members`}
                                </span>
                              )}
                            </div>

                            {(() => {
                              const rawDownloadUrl = activeFileUrl || file.originalUrl;
                              const gDriveId = getGoogleDriveFileId(rawDownloadUrl);
                              const downloadHref = gDriveId ? `https://drive.google.com/uc?export=download&id=${gDriveId}` : rawDownloadUrl;

                              return (
                                <div className="flex items-center gap-2">
                                  {/* Direct Download Button (Respects Download ON / OFF) */}
                                  {(file.allowDownload !== false || currentUser?.role === 'admin') ? (
                                    <a
                                      href={downloadHref}
                                      download={file.fileName || file.title || 'file'}
                                      target={gDriveId ? "_blank" : undefined}
                                      rel={gDriveId ? "noopener noreferrer" : undefined}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 shadow-2xs transition-colors"
                                    >
                                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Download</span>
                                    </a>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-[11px] border border-slate-200 cursor-not-allowed">
                                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Download Disabled</span>
                                    </span>
                                  )}

                                  {/* Open in New Tab / External Link */}
                                  <a
                                    href={file.originalUrl || activeFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shadow-2xs transition-colors"
                                  >
                                    <span>Open Link</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              );
                            })()}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 👑 ADMIN MODAL: ADD / EDIT FILE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-emerald-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  📁
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {editingFileId ? 'Edit File' : 'Add New File'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  File Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Weekly Fellowship Study Guide"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  File Type / Category
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[
                    { id: 'doc', label: 'Doc / Drive', icon: '📄' },
                    { id: 'audio', label: 'Audio', icon: '🎵' },
                    { id: 'video', label: 'Video', icon: '🎥' },
                    { id: 'pdf', label: 'PDF Book', icon: '📕' },
                    { id: 'image', label: 'Photo', icon: '🖼️' },
                    { id: 'file', label: 'All Files', icon: '📁' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormCategory(cat.id)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        formCategory === cat.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-[10px]">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Link URL vs File Upload Tabs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    File Source *
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setFormSourceTab('link')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        formSourceTab === 'link' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Drive / Web Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSourceTab('upload')}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        formSourceTab === 'upload' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Device Upload
                    </button>
                  </div>
                </div>

                {formSourceTab === 'link' ? (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      required={formSourceTab === 'link'}
                      value={formUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="Paste Drive link, YouTube/Vimeo, Spotify/audio, PDF, or document link..."
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                    />
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-[10px] text-amber-800 leading-relaxed font-medium">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Google Drive / Docs Access:</strong> Ensure link sharing in Google Drive is set to <u>"Anyone with the link can view"</u> so assigned members can view the embedded preview without permission blocks.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                      <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-xs font-bold text-slate-800">
                        {isReadingFile ? 'Reading file from device...' : (uploadedFileName || 'Choose File from Device')}
                      </span>
                      {isReadingFile && (
                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin my-1" />
                      )}
                      {fileReadSuccess && (
                        <span className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          ✓ File ready to upload
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        Supports Audio (MP3, WAV, M4A), Video, PDF, Docs (Word, Excel, PPT), Photos & All Files
                      </span>
                      <input
                        type="file"
                        accept="*/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Additional notes for assigned members..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                />
              </div>

              {/* ⬇️ Download Option Toggle (ON / OFF) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shadow-2xs ${
                      formAllowDownload ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-800">
                        Download Option ({formAllowDownload ? 'ON' : 'OFF'})
                      </h5>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {formAllowDownload
                          ? 'ON - Members can download and save this file'
                          : 'OFF - Members can only view, download is disabled'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormAllowDownload(!formAllowDownload)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shadow-inner ${
                      formAllowDownload ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                        formAllowDownload ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 👥 STRICT MEMBER ASSIGNMENT */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-extrabold text-slate-800 block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Who Can View This File? (Strict Privacy)</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {formAssignMode === 'all' ? 'All Approved Members' : `${formSelectedMemberIds.length} Members Selected`}
                  </span>
                </label>

                {/* Mode Selector: All vs Specific */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormAssignMode('all')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      formAssignMode === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>All Members</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAssignMode('specific')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      formAssignMode === 'specific'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>Assigned Members Only</span>
                  </button>
                </div>

                {/* Specific Members Checklist */}
                {formAssignMode === 'specific' && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          placeholder="Search member name..."
                          className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-lg font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleSelectAllMembers}
                          className="text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 px-2 py-1 rounded-md border border-slate-200"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllMembers}
                          className="text-[10px] font-bold text-slate-600 bg-white hover:bg-slate-100 px-2 py-1 rounded-md border border-slate-200"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Member checklist */}
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {filteredUsersForAssign.map((user) => {
                        const isSelected = formSelectedMemberIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => toggleMemberAssign(user.id)}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-100/70'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                {user.name ? user.name[0].toUpperCase() : 'M'}
                              </div>
                              <span className="text-xs truncate">{user.name}</span>
                              <span className="text-[10px] text-slate-400">({user.role})</span>
                            </div>

                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Controlled by container div
                              className="rounded-md text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isReadingFile}
                  className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving & Uploading...</span>
                    </>
                  ) : (
                    <span>{editingFileId ? 'Save Changes' : 'Add File'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
