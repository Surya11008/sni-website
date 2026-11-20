import { useState, useEffect, useRef } from 'react';
import { Globe, Search, X, Check, RotateCcw, Sparkles } from 'lucide-react';

export const WORLD_LANGUAGES = [
  // Major Indian & Regional Languages
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', popular: true },
  { code: 'en', name: 'English', nativeName: 'English (Original)', popular: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', popular: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', popular: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', popular: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', popular: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', popular: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', popular: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', popular: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', popular: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', popular: true },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },

  // Major Global Languages
  { code: 'es', name: 'Spanish', nativeName: 'Español', popular: true },
  { code: 'fr', name: 'French', nativeName: 'Français', popular: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', popular: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', popular: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', popular: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', popular: true },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', popular: true },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', popular: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', popular: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Tagalog' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî' },
  { code: 'la', name: 'Latin', nativeName: 'Latina' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
];

export default function WorldLanguageTranslator({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef(null);

  // Initialize and check currently active translated language from cookie
  useEffect(() => {
    function detectCookieLang() {
      const match = document.cookie.match(/googtrans=\/auto\/([^;]+)/);
      if (match && match[1]) {
        setCurrentLang(match[1]);
      } else {
        setCurrentLang('en');
      }
    }

    detectCookieLang();

    // Ensure Google Translate Script is loaded dynamically once
    if (!document.getElementById('google-translate-script')) {
      window.googleTranslateElementInit = function () {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      };

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    }
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Apply language via Google Translate
  const handleSelectLanguage = (langCode) => {
    setIsOpen(false);
    setCurrentLang(langCode);

    if (!langCode || langCode === 'en' || langCode === 'original') {
      // Clear cookie to restore original
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      const selectEl = document.querySelector('.goog-te-combo');
      if (selectEl) {
        selectEl.value = 'en';
        selectEl.dispatchEvent(new Event('change'));
      }
      window.location.reload();
      return;
    }

    // Set translation cookie
    document.cookie = `googtrans=/auto/${langCode}; path=/;`;
    document.cookie = `googtrans=/auto/${langCode}; path=/; domain=${window.location.hostname}`;

    const selectEl = document.querySelector('.goog-te-combo');
    if (selectEl) {
      selectEl.value = langCode;
      selectEl.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  };

  const currentLangObj =
    WORLD_LANGUAGES.find((l) => l.code === currentLang) || {
      name: 'Translate',
      nativeName: 'Translate',
    };

  const filteredLanguages = WORLD_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Hidden placeholder for Google Translate widget */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      {/* Trigger Button in Header - ONLY Globe Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-white/10 hover:bg-[#F4B942] hover:text-[#071B3B] text-slate-200 transition shadow-xs cursor-pointer border border-white/15 flex items-center justify-center"
        title="Translate Website"
        aria-label="Translate Website"
      >
        <Globe className="w-4 h-4 text-[#F4B942]" />
      </button>

      {/* World Languages Modal / Dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F294A] text-[#F4B942] flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F294A]">
                    Select Language
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Translate all content and pages into your preferred language instantly
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search world languages (Telugu, Hindi, Spanish, French, etc.)..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
            </div>

            {/* Popular Languages Quick Access Pills */}
            {!searchTerm && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Popular Languages
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {WORLD_LANGUAGES.filter((l) => l.popular).map((lang) => {
                    const isActive = currentLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-[#0F294A] text-[#F4B942] shadow-sm'
                            : 'bg-slate-100 hover:bg-amber-50 text-slate-800 border border-slate-200'
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3 text-[#F4B942]" />}
                        <span>{lang.nativeName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complete Alphabetized Languages Grid */}
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1 border-t border-slate-100 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                All Available World Languages ({filteredLanguages.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {filteredLanguages.map((lang) => {
                  const isActive = currentLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`text-left p-2 rounded-xl transition text-xs flex items-center justify-between group cursor-pointer ${
                        isActive
                          ? 'bg-[#0F294A] text-[#F4B942] font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <div className="font-semibold text-xs leading-tight truncate">
                          {lang.nativeName}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-none truncate mt-0.5">
                          {lang.name}
                        </div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#F4B942] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset / Restore Original Option */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => handleSelectLanguage('en')}
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>Reset to Original (English)</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
