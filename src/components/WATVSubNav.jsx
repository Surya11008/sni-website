import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePortal } from '../context/PortalContext';

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
  const { isPagePermitted, userProfile, currentUser } = useAuth();
  const { portalStructure } = usePortal();

  const isAdmin =
    userProfile?.role === 'admin' ||
    userProfile?.role === 'ADMIN' ||
    currentUser?.email === 'surya11008@sni.org.in' ||
    currentUser?.email === 'admin@sni.org.in' ||
    currentUser?.email?.startsWith('surya');

  const category = (portalStructure || []).find(
    (c) => c.categorySlug === categorySlug
  );

  const allowedPages = (category?.pages || []).filter((sp) =>
    isPagePermitted(categorySlug, sp.pageSlug)
  );

  if (!category || allowedPages.length === 0) {
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
          {allowedPages.map((sp) => {
            const isActive = activePageSlug === sp.pageSlug;
            const title = sp.title || (isTelugu ? sp.titleTe : sp.titleEn);

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

          {/* Quick Add Subpage button for Admin */}
          {isAdmin && (
            <Link
              to={`/admin?tab=pages&category=${categorySlug}&new=true`}
              className="px-2.5 py-1 whitespace-nowrap text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition flex items-center gap-1 shrink-0 ml-1 shadow-2xs"
              title={`Add new subpage under this category`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] text-amber-600" />
              <span>+ Add Page</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
