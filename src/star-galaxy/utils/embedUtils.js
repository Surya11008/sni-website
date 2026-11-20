/**
 * Utility functions for detecting, transforming, and embedding
 * ALL kinds of links: Google Drive, Docs, Sheets, Slides, Forms,
 * YouTube (including Shorts, Live, Mobile), Vimeo, SoundCloud, Spotify, PDF,
 * audio, video, and ANY web link or embed URL without restrictions.
 */

/**
 * Robust Google Drive File ID extraction
 */
export function getGoogleDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const m =
    trimmed.match(/drive\.google\.com\/(?:file\/)?(?:u\/\d+\/)?file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  return m ? m[1] : null;
}

/**
 * Robust YouTube Video ID extraction (handles standard, shorts, live, youtu.be, embed, mobile)
 */
export function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const m = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|shorts\/|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

/**
 * Vimeo ID extraction
 */
export function getVimeoVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const m = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)/);
  return m ? m[1] : null;
}

/**
 * Convert base64 data URL to Blob for lightning-fast hardware-accelerated playback
 */
export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return null;
  try {
    const parts = dataUrl.split(';base64,');
    if (parts.length < 2) return null;
    const contentType = parts[0].split(':')[1] || 'application/octet-stream';
    const binary = window.atob(parts[1]);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: contentType });
  } catch (e) {
    console.warn('Failed to parse data URL to Blob:', e);
    return null;
  }
}

/**
 * Check if link is an audio URL
 */
export function isAudioUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith('data:audio/') ||
    trimmed.includes('spotify.com') ||
    trimmed.includes('soundcloud.com') ||
    trimmed.match(/\.(mp3|wav|m4a|aac|ogg|opus|flac|wma)($|\?)/) !== null
  );
}

/**
 * Check if link is a video URL
 */
export function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith('data:video/') ||
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('vimeo.com') ||
    trimmed.match(/\.(mp4|webm|mov|mkv|avi|3gp|flv)($|\?)/) !== null
  );
}

/**
 * Safely decode UTF-8 text from a base64 Data URL
 */
export function decodeBase64Text(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return '';
  try {
    const parts = dataUrl.split(';base64,');
    if (parts.length < 2) return '';
    const binary = window.atob(parts[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    return '';
  }
}

/**
 * Universal file metadata classifier for ANY file (uploaded or link)
 */
export function getFileMetadata(fileName = '', url = '') {
  const combined = (fileName || url || '').trim().toLowerCase();
  const ext = (combined.split('?')[0].split('.').pop() || '').toLowerCase();

  // 1. Audio
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'opus', 'flac', 'wma', 'amr', 'mid'].includes(ext) || combined.startsWith('data:audio/')) {
    return { ext, category: 'audio', label: 'Audio Track', color: 'from-purple-600 to-indigo-600', icon: '🎵', isTextual: false };
  }

  // 2. Video
  if (['mp4', 'webm', 'mov', 'mkv', 'avi', '3gp', 'flv', 'wmv', 'm4v'].includes(ext) || combined.startsWith('data:video/')) {
    return { ext, category: 'video', label: 'Video File', color: 'from-rose-600 to-pink-600', icon: '🎥', isTextual: false };
  }

  // 3. Images
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'tiff', 'heic'].includes(ext) || combined.startsWith('data:image/')) {
    return { ext, category: 'image', label: 'Image Photo', color: 'from-emerald-600 to-teal-600', icon: '🖼️', isTextual: false };
  }

  // 4. PDF
  if (ext === 'pdf' || combined.startsWith('data:application/pdf')) {
    return { ext: 'pdf', category: 'pdf', label: 'PDF Document', color: 'from-red-600 to-rose-700', icon: '📕', isTextual: false };
  }

  // 5. Microsoft Word
  if (['doc', 'docx', 'dot', 'dotx'].includes(ext)) {
    return { ext, category: 'doc', label: 'Word Document', color: 'from-blue-600 to-indigo-700', icon: '📄', isTextual: false };
  }

  // 6. Microsoft Excel & Spreadsheets
  if (['xls', 'xlsx', 'xlsm', 'ods', 'tsv'].includes(ext)) {
    return { ext, category: 'doc', label: 'Excel Spreadsheet', color: 'from-emerald-600 to-green-700', icon: '📊', isTextual: false };
  }

  // 7. Microsoft PowerPoint & Presentations
  if (['ppt', 'pptx', 'pps', 'ppsx', 'odp'].includes(ext)) {
    return { ext, category: 'doc', label: 'PowerPoint Presentation', color: 'from-amber-600 to-orange-700', icon: '📑', isTextual: false };
  }

  // 8. Text, Notes & Code
  if (['txt', 'csv', 'md', 'json', 'xml', 'log', 'sql', 'html', 'css', 'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp'].includes(ext) || combined.startsWith('data:text/')) {
    return { ext, category: 'doc', label: ext.toUpperCase() + ' Text File', color: 'from-slate-700 to-slate-900', icon: '📝', isTextual: true };
  }

  // 9. Archives / Compressed
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) {
    return { ext, category: 'file', label: 'Compressed Archive', color: 'from-amber-500 to-yellow-600', icon: '🗜️', isTextual: false };
  }

  // 10. Applications & APKs
  if (['apk', 'exe', 'dmg', 'ipa', 'msi', 'iso'].includes(ext)) {
    return { ext, category: 'file', label: 'Application Package', color: 'from-teal-600 to-cyan-700', icon: '📦', isTextual: false };
  }

  // Universal Default
  return { ext: ext || 'file', category: 'file', label: 'File Asset', color: 'from-indigo-600 to-purple-600', icon: '📁', isTextual: false };
}

export function transformToEmbedUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Google Drive Files (Video, Audio, PDF, Image, Document, etc.)
  const driveId = getGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  // Matches: https://drive.google.com/drive/folders/{FOLDER_ID}
  const driveFolderMatch = trimmed.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (driveFolderMatch && driveFolderMatch[1]) {
    return `https://drive.google.com/embeddedfolderview?id=${driveFolderMatch[1]}#grid`;
  }

  // 2. Google Docs
  const docsMatch = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch && docsMatch[1]) {
    return `https://docs.google.com/document/d/${docsMatch[1]}/preview`;
  }

  // 3. Google Spreadsheets
  const sheetsMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetsMatch && sheetsMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/preview`;
  }

  // 4. Google Presentation / Slides
  const slidesMatch = trimmed.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slidesMatch && slidesMatch[1]) {
    return `https://docs.google.com/presentation/d/${slidesMatch[1]}/preview`;
  }

  // 5. Google Forms
  const formsMatch = trimmed.match(/docs\.google\.com\/forms\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/);
  if (formsMatch && formsMatch[1]) {
    if (!trimmed.includes('embedded=true')) {
      const glue = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${glue}embedded=true`;
    }
    return trimmed;
  }

  // 6. YouTube (standard watch, shortlinks, live, and Shorts)
  const ytId = getYouTubeVideoId(trimmed);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}`;
  }

  // 7. Vimeo
  const vimeoId = getVimeoVideoId(trimmed);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  // 8. Canva
  const canvaMatch = trimmed.match(/canva\.com\/design\/([a-zA-Z0-9_-]+)\/view/);
  if (canvaMatch && canvaMatch[1]) {
    return `https://www.canva.com/design/${canvaMatch[1]}/view?embed`;
  }

  // 9. Figma
  if (trimmed.includes('figma.com/file/') || trimmed.includes('figma.com/design/')) {
    return `https://www.figma.com/embed?embed_host=astra&url=${encodeURIComponent(trimmed)}`;
  }

  // 10. Spotify
  const spotifyMatch = trimmed.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch && spotifyMatch[1] && spotifyMatch[2]) {
    return `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}`;
  }

  // 11. SoundCloud
  if (trimmed.includes('soundcloud.com')) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trimmed)}&color=%238b5cf6&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
  }

  // 12. Dropbox
  if (trimmed.includes('dropbox.com')) {
    if (trimmed.includes('dl=0')) {
      return trimmed.replace('dl=0', 'raw=1');
    }
    const glue = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${glue}raw=1`;
  }

  // 13. Public Office Documents on the web (.docx, .doc, .xlsx, .xls, .pptx, .ppt)
  // Use Google Docs Web Viewer so users can view without downloading!
  if (trimmed.match(/\.(docx?|xlsx?|pptx?)($|\?)/i) && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(trimmed)}&embedded=true`;
  }

  // Return any other link as-is so it embeds in iframe
  return trimmed;
}

export function detectMediaType(url) {
  if (!url || typeof url !== 'string') return 'link';
  const trimmed = url.trim().toLowerCase();

  if (trimmed.includes('docs.google.com/document')) return 'doc';
  if (trimmed.includes('docs.google.com/spreadsheets')) return 'doc';
  if (trimmed.includes('docs.google.com/presentation')) return 'doc';
  if (trimmed.includes('docs.google.com/forms')) return 'doc';
  if (trimmed.includes('drive.google.com')) return 'drive';
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be') || trimmed.includes('vimeo.com')) return 'video';
  if (trimmed.includes('spotify.com') || trimmed.includes('soundcloud.com')) return 'audio';

  if (trimmed.endsWith('.pdf') || trimmed.includes('.pdf?')) return 'pdf';
  if (trimmed.match(/\.(mp4|webm|ogg|mov|mkv)($|\?)/)) return 'video';
  if (trimmed.match(/\.(mp3|wav|m4a|aac|ogg)($|\?)/)) return 'audio';
  if (trimmed.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/)) return 'image';

  // Base64 data URLs
  if (trimmed.startsWith('data:video/')) return 'video';
  if (trimmed.startsWith('data:audio/')) return 'audio';
  if (trimmed.startsWith('data:image/')) return 'image';
  if (trimmed.startsWith('data:application/pdf')) return 'pdf';

  return 'embed';
}

export function isEmbeddable(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();

  // Direct raw image extensions are not iframes, they are <img>
  if (trimmed.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/) || trimmed.startsWith('data:image/')) {
    return false;
  }

  // Direct video files with mp4/webm extensions can play via <video> or embed
  if (trimmed.match(/\.(mp4|webm|ogg|mov)($|\?)/) || trimmed.startsWith('data:video/')) {
    return false;
  }

  // Direct audio files
  if (trimmed.match(/\.(mp3|wav|m4a|aac|ogg|opus|flac|wma)($|\?)/) || trimmed.startsWith('data:audio/')) {
    return false;
  }

  // ANY other http/https URL can be embedded!
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }

  return false;
}

export function getGoogleDocDirectAppUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Google Docs: https://docs.google.com/document/d/{ID}
  const docsMatch = trimmed.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch && docsMatch[1]) {
    return `https://docs.google.com/document/d/${docsMatch[1]}/edit`;
  }

  // Google Spreadsheets: https://docs.google.com/spreadsheets/d/{ID}
  const sheetsMatch = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetsMatch && sheetsMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetsMatch[1]}/edit`;
  }

  // Google Slides: https://docs.google.com/presentation/d/{ID}
  const slidesMatch = trimmed.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slidesMatch && slidesMatch[1]) {
    return `https://docs.google.com/presentation/d/${slidesMatch[1]}/edit`;
  }

  // Google Forms: https://docs.google.com/forms/d/{ID}
  const formsMatch = trimmed.match(/docs\.google\.com\/forms\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/);
  if (formsMatch && formsMatch[1]) {
    return `https://docs.google.com/forms/d/${formsMatch[1]}/viewform`;
  }

  // Google Drive Files: https://drive.google.com/file/d/{ID}
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/view`;
  }

  // Google Drive Folders: https://drive.google.com/drive/folders/{ID}
  const driveFolderMatch = trimmed.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  if (driveFolderMatch && driveFolderMatch[1]) {
    return `https://drive.google.com/drive/folders/${driveFolderMatch[1]}`;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return '';
}

export function isGoogleDoc(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.includes('docs.google.com/document') ||
    trimmed.includes('docs.google.com/spreadsheets') ||
    trimmed.includes('docs.google.com/presentation') ||
    trimmed.includes('docs.google.com/forms')
  );
}

export function getGoogleServiceInfo(url) {
  if (!url || typeof url !== 'string') {
    return { type: 'doc', name: 'Document', color: 'from-blue-600 to-indigo-600', icon: '📄' };
  }
  const trimmed = url.trim().toLowerCase();

  if (trimmed.includes('docs.google.com/document')) {
    return { type: 'docs', name: 'Document', color: 'from-blue-600 to-indigo-700', icon: '📄' };
  }
  if (trimmed.includes('docs.google.com/spreadsheets')) {
    return { type: 'sheets', name: 'Spreadsheet', color: 'from-emerald-600 to-teal-700', icon: '📊' };
  }
  if (trimmed.includes('docs.google.com/presentation')) {
    return { type: 'slides', name: 'Presentation', color: 'from-amber-500 to-orange-600', icon: '📑' };
  }
  if (trimmed.includes('docs.google.com/forms')) {
    return { type: 'forms', name: 'Form', color: 'from-purple-600 to-violet-700', icon: '📝' };
  }
  if (trimmed.includes('drive.google.com')) {
    return { type: 'drive', name: 'Drive File', color: 'from-sky-600 to-blue-700', icon: '📁' };
  }
  if (trimmed.endsWith('.pdf') || trimmed.includes('.pdf?') || trimmed.startsWith('data:application/pdf')) {
    return { type: 'pdf', name: 'PDF', color: 'from-rose-600 to-red-700', icon: '📕' };
  }

  return { type: 'doc', name: 'Document', color: 'from-blue-600 to-indigo-600', icon: '📄' };
}
