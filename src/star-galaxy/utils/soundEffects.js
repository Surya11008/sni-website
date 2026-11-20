// Cute Sound Effects & Voice Synthesizer for Star Galaxy
// Powered by HTML5 Web Audio API & SpeechSynthesis

const SOUND_SETTINGS_KEY = 'star_galaxy_sound_settings';

export const CLICK_SOUND_THEMES = [
  { id: 'bubble', name: 'Cute Bubble Pop 🫧', desc: 'Soft playful bubble sweep' },
  { id: 'bell', name: 'Crystal Bell 🔔', desc: 'Delicate crystalline chime' },
  { id: 'sparkle', name: 'Star Sparkle ✨', desc: 'Airy celestial shimmer' },
  { id: 'drop', name: 'Water Drop 💧', desc: 'Gentle droplet pluck' },
  { id: 'wood', name: 'Warm Wooden Tap 🪵', desc: 'Subtle organic marimba tap' },
];

export const STAR_SOUND_THEMES = [
  { id: 'fanfare', name: 'Cosmic Fanfare 🌟', desc: 'Joyful arpeggio crescendo' },
  { id: 'magic', name: 'Magic Shimmer ✨', desc: 'Cascading stardust cascade' },
  { id: 'harp', name: 'Celestial Harp 🎶', desc: 'Warm harmonious chord' },
  { id: 'joy', name: 'Victory Joy 🎉', desc: 'Bright celebration bells' },
];

export const NOTIFICATION_THEMES = [
  { id: 'double-bell', name: 'Double Bell 🔔', desc: 'Bright double chime' },
  { id: 'harmony', name: 'Tri-Tone Harmony 🎵', desc: 'Harmonious chord chime' },
  { id: 'celestial', name: 'Galaxy Chime 🌌', desc: 'Soft echo swell' },
];

export const STAR_VOICE_TYPES = [
  {
    id: 'direct',
    name: 'Type 1: "You received {x} stars!"',
    label: '"You received stars!"',
    desc: 'Clear & direct celebration',
    sample: (cnt) => `You received ${cnt} ${cnt === 1 ? 'star' : 'stars'}!`,
  },
  {
    id: 'enthusiastic',
    name: 'Type 2: "Wow, great! You received {x} stars!"',
    label: '"Wow, great! You received stars!"',
    desc: 'Enthusiastic & joyful cheer',
    sample: (cnt) => `Wow, great! You received ${cnt} ${cnt === 1 ? 'star' : 'stars'}!`,
  },
  {
    id: 'uplifting',
    name: 'Type 3: "Wonderful! You earned {x} stars today!"',
    label: '"Wonderful! You earned stars today!"',
    desc: 'Uplifting & encouraging praise',
    sample: (cnt) => `Wonderful! You earned ${cnt} ${cnt === 1 ? 'star' : 'stars'} today!`,
  },
];

export const DEFAULT_SOUND_SETTINGS = {
  soundEnabled: true,               // Master Sound switch
  clickSoundEnabled: true,          // Cute soft click on buttons & tabs
  clickSoundTheme: 'bubble',        // 'bubble' | 'bell' | 'sparkle' | 'drop' | 'wood'
  starVoiceEnabled: true,           // Star voice announcement
  starVoiceType: 'direct',          // 'direct' | 'enthusiastic' | 'uplifting' (3 types requested)
  starSoundTheme: 'fanfare',        // 'fanfare' | 'magic' | 'harp' | 'joy'
  welcomeVoiceEnabled: true,        // "Welcome to the Star Galaxy" cute voice greeting
  notificationAlertsEnabled: true,  // Notification alerts for new posts & notices only
  notificationTheme: 'double-bell', // 'double-bell' | 'harmony' | 'celestial'
};

export function getSoundSettings() {
  try {
    const saved = localStorage.getItem(SOUND_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SOUND_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {}
  return DEFAULT_SOUND_SETTINGS;
}

export function saveSoundSettings(settings) {
  try {
    localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('star_galaxy_sound_settings_changed', { detail: settings }));
  } catch (e) {}
}

let audioCtx = null;

function getAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * 🎵 Play a cute, soft click sound based on selected theme
 */
export function playCuteClick(overrideTheme) {
  const settings = getSoundSettings();
  if (!settings.soundEnabled || !settings.clickSoundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const theme = overrideTheme || settings.clickSoundTheme || 'bubble';

  try {
    const now = ctx.currentTime;

    if (theme === 'bell') {
      // Crystal Bell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } else if (theme === 'sparkle') {
      // Star Sparkle double tone
      [1567.98, 2093.00].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.035;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.06, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.085);
      });
    } else if (theme === 'drop') {
      // Water Drop pluck
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1250, now + 0.04);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (theme === 'wood') {
      // Warm Wooden Tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.03);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    } else {
      // Default: Cute Bubble Pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(1350, now + 0.05);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.075);
    }
  } catch (e) {}
}

/**
 * 🌟 Play a celebratory Star Earned Sound
 */
export function playStarEarnSound(overrideTheme) {
  const settings = getSoundSettings();
  if (!settings.soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const theme = overrideTheme || settings.starSoundTheme || 'fanfare';

  try {
    const now = ctx.currentTime;

    if (theme === 'magic') {
      // Magic Shimmer dust cascade (5 high notes)
      const notes = [783.99, 1046.50, 1318.51, 1567.98, 2093.00];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.05;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.09, noteTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.3);
      });
    } else if (theme === 'harp') {
      // Celestial Harp (lush chord with sustain)
      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.04;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.6);
      });
    } else if (theme === 'joy') {
      // Victory Joy (two bright chords)
      const chord1 = [587.33, 739.99, 880.00]; // D major
      const chord2 = [739.99, 880.00, 1174.66]; // High D
      chord1.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      });
      chord2.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + 0.16;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.46);
      });
    } else {
      // Default: Cosmic Fanfare (C5 -> E5 -> G5 -> C6)
      const arpeggio = [523.25, 659.25, 783.99, 1046.50];
      arpeggio.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.075;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.1, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(noteTime);
        osc.stop(noteTime + 0.4);
      });
    }
  } catch (e) {}
}

/**
 * 🗣️ Voice Announcement: "You received {x} stars!" (3 customizable types)
 */
export function speakStarEarned(starCount, overrideType) {
  const settings = getSoundSettings();
  if (!settings.soundEnabled) return;

  // Play celebratory star sound chime first
  playStarEarnSound();

  if (!settings.starVoiceEnabled) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const count = Math.max(1, Math.round(starCount || 1));
    const voiceType = overrideType || settings.starVoiceType || 'direct';

    let phrase = `You received ${count} ${count === 1 ? 'star' : 'stars'}!`;
    if (voiceType === 'enthusiastic') {
      phrase = `Wow, great! You received ${count} ${count === 1 ? 'star' : 'stars'}!`;
    } else if (voiceType === 'uplifting') {
      phrase = `Wonderful! You earned ${count} ${count === 1 ? 'star' : 'stars'} today!`;
    }

    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.pitch = voiceType === 'direct' ? 1.2 : 1.3;  // Bright, cute, and clear
    utterance.rate = 1.0;   // Clear natural pace
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferred = voices.find(v => 
        (v.lang.startsWith('en') && (
          v.name.includes('Samantha') ||
          v.name.includes('Victoria') ||
          v.name.includes('Google US English') ||
          v.name.includes('Natural') ||
          v.name.includes('Female') ||
          v.name.includes('Karen') ||
          v.name.includes('Zira')
        ))
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferred) utterance.voice = preferred;
    }

    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }, 200);
  } catch (e) {}
}

/**
 * ✨ Play a soft melodic chime
 */
export function playSoftChime() {
  const settings = getSoundSettings();
  if (!settings.soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [659.25, 880]; // E5, A5 chords
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.07;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.08, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.36);
    });
  } catch (e) {}
}

/**
 * 🔔 Play notification chime for New Notice / New Post based on selected theme
 */
export function playNotificationSound(overrideTheme) {
  const settings = getSoundSettings();
  if (!settings.soundEnabled || !settings.notificationAlertsEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const theme = overrideTheme || settings.notificationTheme || 'double-bell';

  try {
    const now = ctx.currentTime;

    if (theme === 'harmony') {
      // Tri-tone harmony chord
      [659.25, 830.61, 987.77].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.42);
      });
    } else if (theme === 'celestial') {
      // Celestial echo swell
      [523.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + i * 0.1;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.52);
      });
    } else {
      // Default: Double Bell
      const chimeFrequencies = [587.33, 880.00]; // D5, A5 bright harmonic bells
      chimeFrequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + i * 0.12;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.46);
      });
    }
  } catch (e) {}
}

/**
 * 🗣️ Speak "Welcome to the Star Galaxy" with a cute, pleasant voice
 */
export function speakWelcomeVoice() {
  const settings = getSoundSettings();
  if (!settings.soundEnabled || !settings.welcomeVoiceEnabled) return;

  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // Play sweet opening chime first
    playSoftChime();

    window.speechSynthesis.cancel(); // Stop any pending utterances
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const phrase = 'Welcome to the Star Galaxy!';
    const utterance = new SpeechSynthesisUtterance(phrase);

    // Cute pitch and gentle tempo tuning
    utterance.pitch = 1.25;  // Bright, cute, and friendly pitch
    utterance.rate = 0.95;   // Gentle, clear pace
    utterance.volume = 1.0;

    // Pick a natural, pleasant female or default English voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferred = voices.find(v => 
        (v.lang.startsWith('en') && (
          v.name.includes('Samantha') ||
          v.name.includes('Victoria') ||
          v.name.includes('Google US English') ||
          v.name.includes('Natural') ||
          v.name.includes('Female') ||
          v.name.includes('Karen') ||
          v.name.includes('Zira')
        ))
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
      }
    }

    setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }, 180);
  } catch (e) {}
}
