import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { DEFAULT_PORTAL_STRUCTURE } from '../config/portalStructure';

/**
 * WATVSubNav
 * Authentic horizontal sub-navigation bar as seen on watv.org (Image 1 & Image 5).
 * Features:
 * - All | Subpage 1 | Subpage 2 | Subpage 3 ...
 * - Active item indicator with subtle underline and bold text
 * - Clean, elegant typography with smooth horizontal scrolling
 */
export default function WATVSubNav({
  categorySlug = '',
  activePageSlug = '',
  className = '',
}) {
  const { isTelugu } = useLanguage();

  const category = DEFAULT_PORTAL_STRUCTURE.find(
    (c) => c.categorySlug === categorySlug
  );

  if (!category || !category.pages || category.pages.length === 0) {
    return null;
  }

  const isAllActive = !activePageSlug || activePageSlug === 'all';

  return (
    <div className={`bg-white border-b border-slate-200/90 sticky top-[64px] z-30 shadow-2xs ${className}`}>
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8">
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 scrollbar-none text-xs sm:text-[13px]">
          {/* "All" Link */}
          <Link
            to={`/category/${categorySlug}`}
            className={`px-3 py-1.5 whitespace-nowrap transition-all font-semibold rounded-md ${
              isAllActive
                ? 'text-[#071B3B] font-extrabold border-b-2 border-[#071B3B] bg-slate-100/60'
                : 'text-slate-600 hover:text-[#071B3B] hover:bg-slate-50'
            }`}
          >
            {isTelugu ? 'అన్ని' : 'All'}
          </Link>

          {/* Subpages Links */}
          {category.pages.map((sp) => {
            const isActive = activePageSlug === sp.pageSlug;
            const title = isTelugu ? sp.titleTe : sp.titleEn;

            return (
              <Link
                key={sp.pageSlug}
                to={`/page/${categorySlug}/${sp.pageSlug}`}
                className={`px-3 py-1.5 whitespace-nowrap transition-all font-medium rounded-md ${
                  isActive
                    ? 'text-[#071B3B] font-extrabold border-b-2 border-[#071B3B] bg-slate-100/60'
                    : 'text-slate-600 hover:text-[#071B3B] hover:bg-slate-50'
                }`}
              >
                {title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
