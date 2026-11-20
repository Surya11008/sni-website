import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Square, Loader2 } from 'lucide-react';

/**
 * AudioSpeakerButton
 * Reads any given text aloud using the Web Speech Synthesis API.
 * Automatically detects whether content is Telugu or English and selects the matching language voice.
 * Allows playing, stopping, and visually indicates playback state.
 */
export default function AudioSpeakerButton({
  text = '',
  title = '',
  className = '',
  buttonStyle = 'pill', // 'pill' | 'icon'
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    return () => {
      // Clean up when component unmounts
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isSupported || (!text && !title)) return null;

  // Clean raw markdown and symbols for natural narration
  const cleanTextForSpeech = (raw) => {
    if (!raw) return '';
    return raw
      .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // keep link text only
      .replace(/#{1,6}\s+/g, '') // remove headings
      .replace(/[*_~`>#=+|-]/g, ' ') // remove markdown syntax
      .replace(/https?:\/\/\S+/g, '') // remove urls
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim();
  };

  // Detect whether text is primarily Telugu
  const isTeluguText = (str) => /[\u0C00-\u0C7F]/.test(str);

  const handleTogglePlay = (e) => {
    if (e) e.stopPropagation();

    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support Audio Narration (Speech Synthesis).');
      return;
    }

    // If currently speaking, stop
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel any ongoing speech elsewhere on page
    window.speechSynthesis.cancel();

    const fullContent = [cleanTextForSpeech(title), cleanTextForSpeech(text)]
      .filter(Boolean)
      .join('. ');

    if (!fullContent.trim()) return;

    const utterance = new SpeechSynthesisUtterance(fullContent);
    utteranceRef.current = utterance;

    const isTelugu = isTeluguText(fullContent);
    const targetLang = isTelugu ? 'te-IN' : 'en-US';
    utterance.lang = targetLang;
    utterance.rate = isTelugu ? 0.95 : 1.0; // slightly natural cadence
    utterance.pitch = 1.0;

    // Pick best matching system/browser voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (isTelugu) {
        const teVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes('te') ||
            v.name.toLowerCase().includes('telugu')
        );
        if (teVoice) utterance.voice = teVoice;
      } else {
        const enVoice = voices.find(
          (v) =>
            v.lang.startsWith('en') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Online'))
        );
        if (enVoice) utterance.voice = enVoice;
      }
    }

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (err) => {
      console.warn('SpeechSynthesis error:', err);
      setIsPlaying(false);
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Failed to trigger speech:', err);
      setIsPlaying(false);
    }
  };

  const isTeluguContent = isTeluguText((title || '') + (text || ''));

  if (buttonStyle === 'icon') {
    return (
      <button
        type="button"
        onClick={handleTogglePlay}
        className={`p-2 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
          isPlaying
            ? 'bg-rose-500 text-white animate-pulse shadow-md ring-2 ring-rose-300'
            : 'bg-amber-50 hover:bg-amber-100 text-[#0F294A] border border-[#C59B27]/40 hover:scale-105'
        } ${className}`}
        title={
          isPlaying
            ? isTeluguContent
              ? 'ఆడియో ఆపండి (Stop Audio)'
              : 'Stop Listening'
            : isTeluguContent
            ? 'ఈ కంటెంట్‌ను వినండి (Listen)'
            : 'Listen to Content'
        }
      >
        {isPlaying ? (
          <Square className="w-4 h-4 fill-current" />
        ) : (
          <Volume2 className="w-4 h-4 text-[#C59B27]" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleTogglePlay}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 ${
        isPlaying
          ? 'bg-rose-600 text-white animate-pulse shadow-md'
          : 'bg-amber-50 hover:bg-[#0F294A] hover:text-[#F4B942] text-[#0F294A] border border-[#C59B27]/40 shadow-xs'
      } ${className}`}
      title={isPlaying ? 'Click to Stop' : 'Click to Listen'}
    >
      {isPlaying ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current animate-bounce" />
          <span>{isTeluguContent ? 'ఆపండి (Stop)' : 'Stop Audio'}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-[#C59B27]" />
          <span>{isTeluguContent ? 'వినండి (Listen)' : 'Listen'}</span>
        </>
      )}
    </button>
  );
}
