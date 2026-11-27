import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { usePortal } from '../context/PortalContext';
import AddSubpageModal from './common/AddSubpageModal';

/**
 * WATVSubNav
 * Authentic horizontal sub-navigation bar as seen on watv.org.
 * Features:
 * - All | Subpage 1 | Subpage 2 | Subpage 3 ...
 * - Active item indicator with subtle underline and bold text
 * - Clean, elegant typography with smooth horizontal scrolling
 * - In-place + Add Page and + Add Subpage modals without navigating to admin panel
 */
export default function WATVSubNav({
  categorySlug = '',
  activePageSlug = '',
  className = '',
}) {
  const { isTelugu } = useLanguage();
  const { isPagePermitted, userProfile, currentUser } = useAuth();
  const { portalStructure } = usePortal();
  const navigate = useNavigate();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalParentSlug, setModalParentSlug] = useState('');
  const [modalParentTitle, setModalParentTitle] = useState('');

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

  // Find the currently active page object
  const currentPage = allowedPages.find(
    (p) => (p.pageSlug || '').toLowerCase() === (activePageSlug || '').toLowerCase()
  );

  // Compute root ancestor slug so parent tab remains highlighted when visiting a subpage
  const findRootSlug = (pSlug) => {
    const p = (category?.pages || []).find(
      (x) => (x.pageSlug || '').toLowerCase() === (pSlug || '').toLowerCase()
    );
    if (p?.parentPageSlug) return findRootSlug(p.parentPageSlug);
    return p?.pageSlug || pSlug;
  };
  const activeRootSlug = currentPage?.parentPageSlug
    ? findRootSlug(currentPage.parentPageSlug)
    : activePageSlug;

  // Root pages (pages without parentPageSlug) for primary category bar
  const rootPages = allowedPages.filter((sp) => !sp.parentPageSlug);

  // Determine if a secondary tier should be shown for subpages
  const tier2ParentSlug = currentPage?.parentPageSlug
    ? currentPage.parentPageSlug
    : (allowedPages.some(
        (p) => (p.parentPageSlug || '').toLowerCase() === (activePageSlug || '').toLowerCase()
      )
        ? activePageSlug
        : null);

  const tier2Subpages = tier2ParentSlug
    ? allowedPages.filter(
        (sp) => (sp.parentPageSlug || '').toLowerCase() === tier2ParentSlug.toLowerCase()
      )
    : [];

  const showSubpagesRow =
    tier2Subpages.length > 0 ||
    (activePageSlug && activePageSlug !== 'all' && isAdmin);

  return (
    <div className={`bg-white border-b border-slate-200/90 sticky top-[64px] z-30 shadow-2xs ${className}`}>
      {/* Primary Category Subnav Bar */}
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

          {/* Root Pages Links */}
          {rootPages.map((sp) => {
            const isActive =
              activePageSlug === sp.pageSlug ||
              (activeRootSlug && activeRootSlug === sp.pageSlug);
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

          {/* In-place Quick Add Page button for Admin */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setModalParentSlug('');
                setModalParentTitle('');
                setIsAddModalOpen(true);
              }}
              className="px-2.5 py-1 whitespace-nowrap text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 transition flex items-center gap-1 shrink-0 ml-1 shadow-2xs cursor-pointer"
              title={`Add new page under ${category.titleEn || categorySlug}`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] text-amber-600" />
              <span>+ Add Page</span>
            </button>
          )}
        </nav>
      </div>

      {/* Secondary Tier: Direct Subpages Bar right under headers */}
      {showSubpagesRow && (
        <div className="bg-slate-50/90 border-t border-slate-100 py-1.5 px-4 sm:px-8">
          <div className="w-full max-w-[1400px] mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[12px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
              Subpages:
            </span>
            <Link
              to={`/page/${categorySlug}/${tier2ParentSlug || activePageSlug}`}
              className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition ${
                activePageSlug === (tier2ParentSlug || activePageSlug)
                  ? 'bg-amber-100 text-amber-950 font-extrabold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              Overview
            </Link>
            {tier2Subpages.map((sp) => {
              const isActive = activePageSlug === sp.pageSlug;
              const title = sp.title || (isTelugu ? sp.titleTe : sp.titleEn);
              return (
                <Link
                  key={sp.pageSlug}
                  to={`/page/${categorySlug}/${sp.pageSlug}`}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap font-medium transition ${
                    isActive
                      ? 'bg-amber-100 text-amber-950 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {title}
                </Link>
              );
            })}

            {/* Quick + Add Subpage button directly beside subpages list */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  const targetParent = tier2ParentSlug || activePageSlug;
                  const pObj = allowedPages.find((p) => p.pageSlug === targetParent);
                  setModalParentSlug(targetParent);
                  setModalParentTitle(pObj?.title || pObj?.titleEn || targetParent);
                  setIsAddModalOpen(true);
                }}
                className="px-2 py-0.5 whitespace-nowrap text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-300 transition flex items-center gap-1 shrink-0 ml-1.5 cursor-pointer shadow-2xs"
                title={`Add new subpage under ${tier2ParentSlug || activePageSlug}`}
              >
                <Plus className="w-3 h-3 stroke-[3] text-amber-700" />
                <span>+ Add Subpage</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* In-place Add Page / Add Subpage Modal */}
      <AddSubpageModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categorySlug={categorySlug}
        categoryTitle={category.titleEn || categorySlug}
        parentPageSlug={modalParentSlug}
        parentPageTitle={modalParentTitle}
        onSuccess={(created) => {
          setIsAddModalOpen(false);
          navigate(`/page/${categorySlug}/${created.pageSlug}`);
        }}
      />
    </div>
  );
}
