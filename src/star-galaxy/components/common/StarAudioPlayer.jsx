import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Download,
  ExternalLink,
  Music,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  dataUrlToBlob,
  getGoogleDriveFileId,
  transformToEmbedUrl,
} from '../../utils/embedUtils';

function formatAudioTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export default function StarAudioPlayer({
  url,
  title = 'Audio Track',
  allowDownload = true,
  fileName = '',
  autoPlay = false,
  compact = false,
}) {
  const audioRef = useRef(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Google Drive toggle state
  const driveId = useMemo(() => getGoogleDriveFileId(url), [url]);
  const isGoogleDrive = Boolean(driveId);
  const [useDriveEmbed, setUseDriveEmbed] = useState(false);

  // Spotify / SoundCloud detection
  const isSpotify = typeof url === 'string' && url.includes('spotify.com');
  const isSoundCloud = typeof url === 'string' && url.includes('soundcloud.com');

  // Convert base64 data URLs to Blob URL for instant, hardware-accelerated playback
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

  // Determine effective stream source
  const effectiveSrc = useMemo(() => {
    if (blobUrl) return blobUrl;
    if (!url) return '';
    if (isGoogleDrive && driveId) {
      // Direct stream URL for Google Drive audio
      return `https://docs.google.com/uc?export=download&id=${driveId}`;
    }
    return url;
  }, [blobUrl, url, isGoogleDrive, driveId]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
      setHasError(false);
      audio.playbackRate = playbackSpeed;
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleError = () => {
      console.warn('Audio playback error on source:', effectiveSrc);
      setIsLoading(false);
      // If direct stream fails on Google Drive, switch seamlessly to Drive embed!
      if (isGoogleDrive) {
        setUseDriveEmbed(true);
      } else {
        setHasError(true);
      }
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [effectiveSrc, isGoogleDrive, playbackSpeed]);

  // Toggle Play / Pause
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (e) {
      console.warn('Play interrupted:', e);
      if (isGoogleDrive) {
        setUseDriveEmbed(true);
      }
    }
  };

  // Jump seek
  const handleSeekSkip = (deltaSeconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.max(0, Math.min(audio.currentTime + deltaSeconds, duration || 0));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Progress scrub
  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audio) {
      audio.currentTime = val;
    }
  };

  // Change Speed
  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Volume Change
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.muted = false;
      setIsMuted(false);
      audio.volume = volume || 1;
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  };

  // 1. Spotify Player Embed
  if (isSpotify) {
    return (
      <div className="w-full bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-xl border border-purple-500/20">
        <iframe
          src={transformToEmbedUrl(url)}
          title={title}
          className="w-full h-[152px] rounded-xl border-0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    );
  }

  // 2. SoundCloud Player Embed
  if (isSoundCloud) {
    return (
      <div className="w-full bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-xl border border-violet-500/20">
        <iframe
          src={transformToEmbedUrl(url)}
          title={title}
          className="w-full h-[166px] rounded-xl border-0"
          allow="autoplay"
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Google Drive Embed Mode (fallback or toggle)
  if (isGoogleDrive && useDriveEmbed) {
    return (
      <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-purple-500/20 shadow-xl flex flex-col">
        <div className="p-3 bg-purple-950/70 border-b border-purple-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-white truncate max-w-xs">{title}</span>
          </div>
          <button
            type="button"
            onClick={() => setUseDriveEmbed(false)}
            className="text-[11px] font-bold text-purple-300 hover:text-white flex items-center gap-1 px-2.5 py-1 bg-purple-900/50 hover:bg-purple-800 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Switch to Native Player</span>
          </button>
        </div>
        <div className="w-full h-80 bg-slate-900">
          <iframe
            src={`https://drive.google.com/file/d/${driveId}/preview`}
            title={title}
            className="w-full h-full border-0"
            allow="autoplay"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // 4. Native / Direct / Base64 High-Performance Audio Player
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full bg-gradient-to-br from-slate-950 via-purple-950/90 to-slate-950 rounded-2xl p-4 sm:p-5 text-white border border-purple-500/30 shadow-2xl relative overflow-hidden">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={effectiveSrc}
        preload="metadata"
        autoPlay={autoPlay}
      />

      {/* Background ambient decorative glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header: Track Info & Drive Toggle */}
      <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shrink-0 ${isPlaying ? 'animate-pulse ring-2 ring-purple-400/50' : ''}`}>
            <Music className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-white truncate">{title || 'Audio Recording'}</h4>
            <div className="flex items-center gap-2 text-[11px] text-purple-300 font-medium">
              <span>{isGoogleDrive ? 'Google Drive Audio' : blobUrl ? 'Device Audio' : 'Audio Track'}</span>
              <span>•</span>
              <span className="text-purple-200 font-bold">{formatAudioTime(currentTime)} / {formatAudioTime(duration)}</span>
            </div>
          </div>
        </div>

        {/* Speed Controls: User requested "speed ga play ayyela" */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
          {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => handleSpeedChange(spd)}
              className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                playbackSpeed === spd
                  ? 'bg-purple-600 text-white shadow-md scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Waveform Equalizer Animation */}
      <div className="h-7 flex items-end justify-between gap-1 mb-3 px-1 relative z-10 opacity-80">
        {[40, 75, 55, 90, 60, 85, 45, 100, 70, 95, 50, 80, 65, 90, 45, 75, 60, 85, 50, 70].map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-gradient-to-t from-purple-500 to-cyan-300'
                : 'bg-white/15'
            }`}
            style={{
              height: isPlaying ? `${Math.max(20, (h * (i % 3 === 0 ? 1.2 : 0.8)) % 100)}%` : '20%',
              animation: isPlaying ? `bounce 1s infinite ${i * 0.05}s ease-in-out` : 'none',
            }}
          />
        ))}
      </div>

      {/* Progress Timeline Scrubber */}
      <div className="relative z-10 mb-4">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleProgressChange}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400 focus:outline-none"
          style={{
            background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${progressPercent}%, #334155 ${progressPercent}%, #334155 100%)`,
          }}
        />
        <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>

      {/* Primary Playback Controls Bar */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        {/* Left: Skip & Play/Pause */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Skip -10s */}
          <button
            type="button"
            onClick={() => handleSeekSkip(-10)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Large Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={hasError}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95 cursor-pointer ${
              hasError
                ? 'bg-slate-700 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 shadow-purple-500/30'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          {/* Skip +10s */}
          <button
            type="button"
            onClick={() => handleSeekSkip(10)}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Volume & Download & Fallback */}
        <div className="flex items-center gap-3">
          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={toggleMute}
              className="text-purple-300 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>

          {/* Google Drive Preview Switch */}
          {isGoogleDrive && (
            <button
              type="button"
              onClick={() => setUseDriveEmbed(true)}
              className="text-[11px] font-bold text-purple-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Switch to Drive Player"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Drive Embed</span>
            </button>
          )}

          {/* Download Audio */}
          {allowDownload && (
            <a
              href={url}
              download={fileName || title || 'audio-track'}
              className="p-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5 text-xs font-bold"
              title="Download Audio"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Download</span>
            </a>
          )}

          {/* Open Original Link */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Error Fallback Banner */}
      {hasError && (
        <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Audio stream could not be loaded directly by the browser.</span>
          </div>
          {isGoogleDrive ? (
            <button
              type="button"
              onClick={() => setUseDriveEmbed(true)}
              className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
            >
              Open Drive Player
            </button>
          ) : (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
            >
              Listen in New Tab
            </a>
          )}
        </div>
      )}
    </div>
  );
}
