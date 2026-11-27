/**
 * fontManager.js
 * Comprehensive Google Fonts manager & text sanitizer for SNI Portal & Notion Notes Editor.
 */

// 1. Text Sanitizer to completely eliminate [OBJ] (U+FFFC / U+FFFD) replacement characters
export function cleanObjectReplacementChars(str) {
  if (typeof str !== 'string') return str || '';
  return str
    // Remove Unicode Object Replacement Character (U+FFFC), Replacement Character (U+FFFD), and special invisible blocks
    .replace(/[\uFFFC\uFFFD\uFFF0-\uFFFF]/g, '')
    // Remove empty paragraphs that only contained the object replacement character or whitespace
    .replace(/<p>\s*(?:&nbsp;|<br\s*\/?>)?\s*<\/p>/gi, '')
    // Clean multiple consecutive blank paragraphs into a clean single paragraph spacing
    .replace(/(?:<p>\s*<\/p>){2,}/gi, '<p></p>');
}

// 2. Curated Google Fonts for Notes and Articles
export const CURATED_GOOGLE_FONTS = [
  // Modern Clean Sans-Serif
  { name: 'Inter', category: 'Sans-Serif', description: 'Clean modern digital sans', sample: 'Grace and Peace to you' },
  { name: 'Roboto', category: 'Sans-Serif', description: 'Crisp & highly readable', sample: 'The word of truth and life' },
  { name: 'Poppins', category: 'Sans-Serif', description: 'Geometric & modern', sample: 'Walk in love and faith' },
  { name: 'Plus Jakarta Sans', category: 'Sans-Serif', description: 'Contemporary elegance', sample: 'Sacred assembly and truth' },
  { name: 'Montserrat', category: 'Sans-Serif', description: 'Bold & punchy', sample: 'Preach the Gospel with power' },
  { name: 'Open Sans', category: 'Sans-Serif', description: 'Friendly & neutral', sample: 'Faith, Hope, and Love' },
  { name: 'Lato', category: 'Sans-Serif', description: 'Warm and transparent', sample: 'Blessed is the kingdom' },

  // Classical & Scripture Serif
  { name: 'Merriweather', category: 'Serif', description: 'Warm editorial serif', sample: 'Thy word is a lamp unto my feet' },
  { name: 'Playfair Display', category: 'Serif', description: 'Regal and classical title serif', sample: 'Glory to God in the highest' },
  { name: 'Lora', category: 'Serif', description: 'Calligraphic literary serif', sample: 'He leadeth me beside the still waters' },
  { name: 'Cinzel', category: 'Serif', description: 'Majestic sacred Roman inscriptions', sample: 'HOLY TO THE LORD' },
  { name: 'Cormorant Garamond', category: 'Serif', description: 'Traditional biblical serif', sample: 'In the beginning was the Word' },
  { name: 'PT Serif', category: 'Serif', description: 'Classic editorial serif', sample: 'The truth shall make you free' },

  // Handwriting, Calligraphy & Expressive
  { name: 'Caveat', category: 'Handwriting', description: 'Warm natural handwriting', sample: 'Remember His covenant forever' },
  { name: 'Dancing Script', category: 'Handwriting', description: 'Lively cursive script', sample: 'Sing praises unto His holy name' },
  { name: 'Pacifico', category: 'Handwriting', description: 'Bold friendly brush script', sample: 'Rejoice always in fellowship' },
  { name: 'Great Vibes', category: 'Handwriting', description: 'Formal flowing calligraphy', sample: 'Peace and grace be multiplied' },

  // Telugu Google Fonts
  { name: 'Mandali', category: 'Telugu', description: 'మాండలి - Elegant Telugu', sample: 'దేవుని పరిశుద్ధ వాక్యం' },
  { name: 'Ramabhadra', category: 'Telugu', description: 'రామభద్ర - Bold & Classic Telugu', sample: 'జీవ వాక్యపు వెలుగు' },
  { name: 'Suranna', category: 'Telugu', description: 'సూరన్న - Traditional Telugu', sample: 'సత్య సువార్త ప్రకటన' },
  { name: 'Gidugu', category: 'Telugu', description: 'గిడుగు - Modern readable Telugu', sample: 'ఆరాధన మరియు సమాజం' },
  { name: 'Noto Sans Telugu', category: 'Telugu', description: 'నోటో సాన్స్ - Clean Digital Telugu', sample: 'పరలోక తండ్రి ప్రేమ' },
  { name: 'Noto Serif Telugu', category: 'Telugu', description: 'నోటో సెరిఫ్ - Classic Telugu Serif', sample: 'విశ్వాసపు అడుగుజాడలు' },
  { name: 'Mallanna', category: 'Telugu', description: 'మల్లన్న - Headline Telugu', sample: 'విశ్రాంతి దిన పరిశుద్ధత' },
  { name: 'Dhurjati', category: 'Telugu', description: 'ధూర్జటి - Majestic Telugu', sample: 'శాశ్వతమైన నిబంధన' },
];

const LOCAL_STORAGE_KEY = 'sni_custom_google_fonts';

// 3. Load font dynamically via Google Fonts <link>
export function loadGoogleFont(fontName) {
  if (!fontName || typeof fontName !== 'string') return;
  const cleanName = fontName.trim().replace(/['"]/g, '');
  if (!cleanName || cleanName === 'Inter' || cleanName === 'sans-serif' || cleanName === 'inherit') {
    return;
  }

  const id = `google-font-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  if (document.getElementById(id)) return; // Already injected

  try {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    const encoded = encodeURIComponent(cleanName);
    // Request full weights for maximum crispness
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap`;
    document.head.appendChild(link);
  } catch (err) {
    console.warn(`Failed to dynamically inject Google Font "${cleanName}":`, err);
  }
}

// 4. Custom font persistence
export function getSavedCustomFonts() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomFont(fontName) {
  if (!fontName || typeof fontName !== 'string') return null;

  // If user pasted a Google Fonts URL like https://fonts.google.com/specimen/Cinzel or https://fonts.googleapis.com/css2?family=Cinzel:...
  let cleanName = fontName.trim();
  const urlMatch = cleanName.match(/family=([^&:]+)/i) || cleanName.match(/specimen\/([^/?#]+)/i);
  if (urlMatch && urlMatch[1]) {
    cleanName = decodeURIComponent(urlMatch[1]).replace(/\+/g, ' ');
  }
  cleanName = cleanName.replace(/['"]/g, '').trim();
  if (!cleanName) return null;

  // Format to Title Case e.g. "playfair display" -> "Playfair Display"
  const formatted = cleanName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  loadGoogleFont(formatted);

  const current = getSavedCustomFonts();
  if (!current.some((f) => f.name.toLowerCase() === formatted.toLowerCase())) {
    const newEntry = {
      name: formatted,
      category: 'Custom Added',
      description: 'Added from Google Fonts',
      sample: 'The Lord is my shepherd',
      isCustom: true,
    };
    const updated = [newEntry, ...current];
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return newEntry;
  }
  return current.find((f) => f.name.toLowerCase() === formatted.toLowerCase());
}

export function removeCustomFont(fontName) {
  try {
    const current = getSavedCustomFonts();
    const updated = current.filter((f) => f.name.toLowerCase() !== fontName.toLowerCase());
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// 5. Get all available fonts (Curated + User Added)
export function getAllAvailableFonts() {
  const custom = getSavedCustomFonts();
  // Ensure custom fonts are loaded in head
  custom.forEach((f) => loadGoogleFont(f.name));
  return [...custom, ...CURATED_GOOGLE_FONTS];
}
