/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  en: {
    // Nav & Brand
    brandName: 'Super Natural Intelligence',
    brandTag: 'SNI Official',
    navHome: 'Home',
    navNewsEvents: 'News & Events',
    navMediaVideos: 'Media & Videos',
    navEcosystemApps: 'Ecosystem Apps',
    navMemberPortal: 'Members',
    navDashboard: 'Dashboard',
    navAdmin: 'Admin Panel',
    navSignIn: 'Sign In',
    navLogout: 'Logout',
    roleAdmin: 'ADMIN',
    roleMember: 'MEMBER',

    // Hero
    heroBadge: 'Super Natural Intelligence • Official Hub',
    heroTitle: 'Welcome to Super Natural Intelligence',
    heroSubtitle: 'A centralized sanctuary of fellowship, broadcast archives, and ministerial applications.',
    heroBtnExplore: 'Explore More',
    heroBtnMedia: 'Watch Media & Sermons',
    heroBtnPortal: 'Member Area',
    heroBtnApps: 'Ecosystem Apps Hub',

    // Announcements
    announcementsTitle: 'Latest News & Announcements',
    announcementsSubtitle: 'Official pastoral updates, notices, and communications.',
    readMore: 'Read Full Story',
    closeModal: 'Close',
    noAnnouncements: 'No announcements posted yet. Check back soon.',

    // Media
    mediaTitle: 'Media & Sermon Broadcasts',
    mediaSubtitle: 'Watch inspiring sermon messages, hymns, conferences, and sacred assemblies.',
    watchVideo: 'Watch Video',
    noMedia: 'No media items available at this time.',

    // Apps Hub
    appsTitle: 'Ecosystem Applications',
    appsSubtitle: 'Access our suite of integrated organization web applications with seamless Single Sign-On (SSO).',
    launchApp: 'Launch App',
    ssoPreserved: 'SSO Session Synced',

    // Dashboard
    dashboardTitle: 'Member Workspace',
    dashboardSubtitle: 'Your centralized repository of internal guidelines, study circulars, and official organizational assets.',
    memberDocsHeading: 'Member Documents & Resources',
    memberDocsSubtitle: 'Confidential and members-only materials available for study and reference.',
    searchPlaceholder: 'Search by document title or category...',
    allCategories: 'All Categories',
    openDoc: 'Open Document',
    noDocsFound: 'No documents match your query.',
    accountInfo: 'Account Information',
    joinedDate: 'Joined Date',
    docCategory: 'Category',

    // Admin
    adminTitle: 'Organization Content & User Management',
    adminSubtitle: 'Publish announcements, add sermon media, upload member documents, and manage personnel access privileges.',
    tabAnnouncements: 'Announcements',
    tabMedia: 'Media & Videos',
    tabDocs: 'Member Documents',
    tabUsers: 'User Management',
    addNew: 'Publish New Item',
    titleEn: 'Title (English)',
    titleTe: 'Title (Telugu)',
    descEn: 'Description (English)',
    descTe: 'Description (Telugu)',
    imageUrl: 'Image URL (optional)',
    videoUrl: 'Video URL (YouTube or Direct Link)',
    thumbnailUrl: 'Thumbnail URL (optional)',
    fileUrl: 'Document / File URL (PDF, Drive, or Web Link)',
    docTitle: 'Document Title',
    category: 'Category',
    dateLabel: 'Date',
    publishBtn: 'Publish to Firestore',
    deleteBtn: 'Delete',
    promoteBtn: 'Promote to Admin',
    demoteBtn: 'Demote to Member',
    confirmDelete: 'Are you sure you want to delete this item? This action cannot be undone.',

    // Footer
    footerMotto: '',
    footerRights: 'All rights reserved. Official Organization.',
    footerDesc: '',
  },
  te: {
    // Nav & Brand
    brandName: 'సూపర్ నేచురల్ ఇంటెలిజెన్స్',
    brandTag: 'SNI అధికారికం',
    navHome: 'ముఖ్యాంశాలు',
    navNewsEvents: 'వార్తలు & విశేషాలు',
    navMediaVideos: 'మీడియా & ప్రసంగాలు',
    navEcosystemApps: 'సంస్థ వెబ్ యాప్స్',
    navMemberPortal: 'సభ్యుల విభాగం',
    navDashboard: 'సభ్యుల డాష్‌బోర్డ్',
    navAdmin: 'అడ్మిన్ ప్యానెల్',
    navSignIn: 'లాగిన్',
    navLogout: 'లాగౌట్',
    roleAdmin: 'అడ్మిన్',
    roleMember: 'సభ్యుడు',

    // Hero
    heroBadge: 'సూపర్ నేచురల్ ఇంటెలిజెన్స్ (SNI)',
    heroTitle: 'సూపర్ నేచురల్ ఇంటెలిజెన్స్ స్వాగతం',
    heroSubtitle: 'సమస్త సమాజాల సభ్యులకు అవసరమైన సువార్త సత్యాలు, ఆత్మీయ ప్రసంగాలు, పండుగల వివరాలు మరియు అనుసంధానిత వెబ్ అప్లికేషన్ల కేంద్ర వేదిక.',
    heroBtnExplore: 'మరిన్ని వివరాలు',
    heroBtnMedia: 'మీడియా & ప్రసంగాలు',
    heroBtnPortal: 'సభ్యుల విభాగం',
    heroBtnApps: 'సంస్థ వెబ్ యాప్స్',

    // Announcements
    announcementsTitle: 'తాజా వార్తలు & ముఖ్య ప్రకటనలు',
    announcementsSubtitle: 'సర్వసభ్య సమావేశ నిర్ణయాలు, పవిత్ర పండుగల కూటముల తేదీలు, మరియు ఆత్మీయ మార్గదర్శకాలు.',
    readMore: 'పూర్తి కథనం చదవండి',
    closeModal: 'మూసివేయండి',
    noAnnouncements: 'ప్రస్తుతం ఎటువంటి తాజా ప్రకటనలు లేవు.',

    // Media
    mediaTitle: 'మీడియా & వీడియో సందేశాలు',
    mediaSubtitle: 'ఆత్మీయ సందేశాలు, సత్య వాక్య విశ్లేషణలు, స్తుతి గీతాలు మరియు ప్రత్యేక కూటముల వీడియోలు.',
    watchVideo: 'వీడియో వీక్షించండి',
    noMedia: 'వీడియోలు ప్రస్తుతం అందుబాటులో లేవు.',

    // Apps Hub
    appsTitle: 'సంస్థ అనుసంధాన వెబ్ యాప్స్ (Ecosystem)',
    appsSubtitle: 'ఏకీకృత సింగిల్ సైన్-ఆన్ (SSO) ద్వారా మా అన్ని వెబ్ అప్లికేషన్లను నేరుగా ఉపయోగించుకోండి.',
    launchApp: 'యాప్ ఓపెన్ చేయండి',
    ssoPreserved: 'SSO సెషన్ కనెక్ట్ అయ్యింది',

    // Dashboard
    dashboardTitle: 'సభ్యుల వ్యక్తిగత డాష్‌బోర్డ్',
    dashboardSubtitle: 'అధికారిక మార్గదర్శకాలు, అధ్యయన పత్రాలు, సర్క్యులర్లు మరియు సభ్యుల సమాచారాల కేంద్రం.',
    memberDocsHeading: 'సభ్యుల డాక్యుమెంట్లు & ఆత్మీయ పత్రాలు',
    memberDocsSubtitle: 'లాగిన్ అయిన సభ్యుల కోసం మాత్రమే కేటాయించబడిన అంతర్గత మార్గదర్శకాలు మరియు అధ్యయన పత్రాలు.',
    searchPlaceholder: 'డాక్యుమెంట్ పేరు లేదా విభాగం ద్వారా వెతకండి...',
    allCategories: 'అన్ని విభాగాలు',
    openDoc: 'పత్రం తెరవండి',
    noDocsFound: 'ఎటువంటి డాక్యుమెంట్లు కనుగొనబడలేదు.',
    accountInfo: 'ఖాతా వివరాలు',
    joinedDate: 'చేరిన తేదీ',
    docCategory: 'విభాగం',

    // Admin
    adminTitle: 'కంటెంట్ & యూజర్ల నిర్వహణ కేంద్రం',
    adminSubtitle: 'ప్రకటనలు, వీడియో మీడియా, సభ్యుల డాక్యుమెంట్లు మరియు యూజర్ రోల్స్‌ను నేరుగా నిర్వహించండి.',
    tabAnnouncements: 'ప్రకటనలు',
    tabMedia: 'మీడియా & వీడియోలు',
    tabDocs: 'సభ్యుల డాక్యుమెంట్లు',
    tabUsers: 'యూజర్ల నిర్వహణ',
    addNew: 'కొత్త అంశాన్ని ప్రచురించండి',
    titleEn: 'శీర్షిక (English)',
    titleTe: 'శీర్షిక (తెలుగు)',
    descEn: 'వివరణ (English)',
    descTe: 'వివరణ (తెలుగు)',
    imageUrl: 'చిత్రం URL (ఐచ్ఛికం)',
    videoUrl: 'వీడియో URL (YouTube లేదా డైరెక్ట్ లింక్)',
    thumbnailUrl: 'థంబ్‌నెయిల్ URL (ఐచ్ఛికం)',
    fileUrl: 'ఫైల్ / డాక్యుమెంట్ URL (PDF, Drive లింక్)',
    docTitle: 'డాక్యుమెంట్ శీర్షిక',
    category: 'విభాగం',
    dateLabel: 'తేదీ',
    publishBtn: 'ఫైర్‌స్టోర్‌లో ప్రచురించండి',
    deleteBtn: 'తొలగించండి',
    promoteBtn: 'అడ్మిన్‌గా మార్చండి',
    demoteBtn: 'సభ్యుడిగా మార్చండి',
    confirmDelete: 'మీరు నిజంగా ఈ ఐటమ్‌ను తొలగించాలనుకుంటున్నారా? దీనిని తిరిగి పొందలేరు.',

    // Footer
    footerMotto: '',
    footerRights: 'అన్ని హక్కులూ ప్రత్యేకించబడ్డాయి. అధికారిక సంస్థ.',
    footerDesc: '',
  },
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('sni_portal_language') || 'te';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('sni_portal_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'te' : 'en');
  };

  const t = (key, fallback = '') => {
    return translations[language]?.[key] || translations.en[key] || fallback || key;
  };

  const getText = (docItem, fieldPrefix = 'title') => {
    if (!docItem) return '';
    if (language === 'te') {
      const teKey = `${fieldPrefix}Te`;
      if (docItem[teKey]) return docItem[teKey];
    }
    const enKey = `${fieldPrefix}En`;
    return docItem[enKey] || docItem[fieldPrefix] || '';
  };

  const getDesc = (docItem) => {
    if (!docItem) return '';
    if (language === 'te' && docItem.descTe) return docItem.descTe;
    return docItem.descEn || docItem.desc || docItem.description || '';
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getText,
        getDesc,
        isTelugu: language === 'te',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
