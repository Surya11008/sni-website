import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Download,
  ExternalLink,
  Video,
  RotateCcw,
  RotateCw,
  PictureInPicture,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  dataUrlToBlob,
  getGoogleDriveFileId,
  getYouTubeVideoId,
  getVimeoVideoId,
  transformToEmbedUrl,
} from '../../utils/embedUtils';

export default function StarVideoPlayer({
  url,
  title = 'Video Player',
  allowDownload = true,
  fileName = '',
  autoPlay = false,
  poster = '',
}) {
  const videoRef = useRef(null);

  // States
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [isPipSupported, setIsPipSupported] = useState(false);

  // Source detection
  const ytId = useMemo(() => getYouTubeVideoId(url), [url]);
  const vimeoId = useMemo(() => getVimeoVideoId(url), [url]);
  const driveId = useMemo(() => getGoogleDriveFileId(url), [url]);

  const isYouTube = Boolean(ytId);
  const isVimeo = Boolean(vimeoId);
  const isGoogleDrive = Boolean(driveId) && !isYouTube && !isVimeo;

  // Convert base64 data URLs to Blob URL for instant, smooth playback
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!url || typeof url !== 'string') {
      setBlobUrl(null);
      return;
    }

    if (url.startsWith('data:')) {
      const blob = dataUrlToBlob(url);
      if (blob) {
        const objUrl = URL.createObjectURL(blob);
        setBlobUrl(objUrl);
        return () => {
          URL.revokeObjectURL(objUrl);
        };
      }
    }
    setBlobUrl(null);
  }, [url]);

  // Check Picture-in-Picture support
  useEffect(() => {
    if (typeof document !== 'undefined' && document.pictureInPictureEnabled) {
      setIsPipSupported(true);
    }
  }, []);

  // Update playback speed on video ref
  const handleSpeedChange = (spd) => {
    setPlaybackSpeed(spd);
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
  };

  // Picture in picture toggle
  const togglePip = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    }
  };

  // Effective video source
  const effectiveSrc = blobUrl || url;

  // 1. YouTube Video
  if (isYouTube) {
    return (
      <div className="w-full bg-black rounded-2xl overflow-hidden border border-rose-500/30 shadow-2xl flex flex-col">
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="p-2.5 sm:p-3 bg-slate-950 flex items-center justify-between gap-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="font-bold text-white truncate">{title || 'YouTube Video'}</span>
          </div>
          <a
            href={`https://www.youtube.com/watch?v=${ytId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shrink-0"
          >
            <span>Open in YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 2. Vimeo Video
  if (isVimeo) {
    return (
      <div className="w-full bg-black rounded-2xl overflow-hidden border border-sky-500/30 shadow-2xl flex flex-col">
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?dnt=1`}
            title={title}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="p-2.5 sm:p-3 bg-slate-950 flex items-center justify-between gap-2 border-t border-white/10 text-xs">
          <span className="font-bold text-white truncate">{title || 'Vimeo Video'}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md shrink-0"
          >
            <span>Open in Vimeo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 3. Google Drive Video
  if (isGoogleDrive) {
    return (
      <div className="w-full bg-black rounded-2xl overflow-hidden border border-indigo-500/30 shadow-2xl flex flex-col">
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={`https://drive.google.com/file/d/${driveId}/preview`}
            title={title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="p-2.5 sm:p-3 bg-slate-950 flex items-center justify-between gap-2 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Video className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-bold text-white truncate">{title || 'Google Drive Video'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {allowDownload && (
              <a
                href={`https://drive.google.com/uc?export=download&id=${driveId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
            <a
              href={`https://drive.google.com/file/d/${driveId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
            >
              <span>Watch in Drive HD</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 4. Native / Direct / Base64 Video Player (Instant, 60fps hardware accelerated)
  return (
    <div className="w-full bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Video Container */}
      <div className="relative w-full bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={effectiveSrc}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          onError={() => setHasError(true)}
          className="w-full max-h-[520px] object-contain bg-black"
        />
      </div>

      {/* Control Bar: Speed Selector & Quick Actions */}
      <div className="p-2.5 sm:p-3 bg-slate-950 border-t border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Speed Selector: User requested "speed ga play ayyela" */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Speed:</span>
          <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-xl border border-white/10">
            {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => handleSpeedChange(spd)}
                className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  playbackSpeed === spd
                    ? 'bg-rose-600 text-white shadow-md scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Right Tools: PiP, Fullscreen, Download, Open */}
        <div className="flex items-center gap-2">
          {isPipSupported && (
            <button
              type="button"
              onClick={togglePip}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Picture in Picture"
            >
              <PictureInPicture className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {allowDownload && (
            <a
              href={url}
              download={fileName || title || 'video-file'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-md"
              title="Download Video"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
          )}

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Error Fallback */}
      {hasError && (
        <div className="p-3 bg-rose-950 text-rose-200 text-xs flex items-center justify-between gap-2 border-t border-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Browser could not decode video directly. Try downloading or opening externally.</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs shrink-0"
          >
            Open in Browser
          </a>
        </div>
      )}
    </div>
  );
}
