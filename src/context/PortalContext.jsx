import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  DEFAULT_PORTAL_STRUCTURE,
  mergePortalStructure,
  findPageInfo,
  formatSlugToTitle,
} from '../config/portalStructure';

const PortalContext = createContext(null);

export function PortalProvider({ children }) {
  const [portalStructure, setPortalStructure] = useState(DEFAULT_PORTAL_STRUCTURE);
  const [customPages, setCustomPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const unsub = onSnapshot(
        collection(db, 'portal_pages'),
        (snapshot) => {
          const pages = [];
          snapshot.forEach((doc) => {
            pages.push({ id: doc.id, ...doc.data() });
          });
          setCustomPages(pages);
          setPortalStructure(mergePortalStructure(pages));
          setLoading(false);
        },
        (error) => {
          console.warn('PortalProvider: Firestore offline or error, using default structure:', error);
          setPortalStructure(DEFAULT_PORTAL_STRUCTURE);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('PortalProvider listener setup error:', err);
      setPortalStructure(DEFAULT_PORTAL_STRUCTURE);
      setLoading(false);
    }
  }, []);

  // Helper to find category and page info
  const getPageInfo = (categorySlug, pageSlug) => {
    return findPageInfo(portalStructure, categorySlug, pageSlug);
  };

  // Helper to get formatted or typed page title
  const getPageTitle = (categorySlug, pageSlug, isTelugu = false) => {
    const { page } = findPageInfo(portalStructure, categorySlug, pageSlug);
    if (page) {
      return page.title || (isTelugu ? page.titleTe : page.titleEn) || page.titleEn || page.titleTe || '';
    }
    return formatSlugToTitle(pageSlug);
  };

  // Flattened list of all available pages across all categories
  const allAvailablePages = portalStructure.flatMap((cat) =>
    (cat.pages || []).map((p) => ({
      pageSlug: p.pageSlug,
      title: p.title || p.titleEn || formatSlugToTitle(p.pageSlug),
      categorySlug: cat.categorySlug,
      categoryTitle: cat.titleEn,
    }))
  );

  return (
    <PortalContext.Provider
      value={{
        portalStructure,
        customPages,
        loading,
        getPageInfo,
        getPageTitle,
        allAvailablePages,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
}
