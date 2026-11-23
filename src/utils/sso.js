/**
 * Preserves unified SSO state across SNI web applications
 * (Diary, Evaluation, Word Search, Videos, and eva.sni.org.in)
 */
export const syncSSOSession = (currentUser, userProfile) => {
  if (!currentUser) return;

  const sessionData = {
    userId: currentUser.uid,
    uid: currentUser.uid,
    email: currentUser.email || '',
    fullName: userProfile?.displayName || currentUser.email?.split('@')[0] || 'User',
    role: userProfile?.role || 'member',
    syncedAt: new Date().toISOString(),
  };

  try {
    const serialized = JSON.stringify(sessionData);
    localStorage.setItem('sni_user_session', serialized);
    localStorage.setItem('sni_current_user', serialized);
    localStorage.setItem('sni_unified_session', serialized);
    localStorage.setItem('live_counter_current_user', serialized);
    localStorage.setItem('word_search_current_user', serialized);

    if (userProfile?.role === 'admin') {
      localStorage.setItem('sni_admin_active', 'true');
      sessionStorage.setItem('sni_admin_active', 'true');
      localStorage.setItem('word_search_admin_auth', 'true');
    }
  } catch (err) {
    console.warn('Unable to write SSO local storage keys:', err);
  }
};

export const launchEcosystemApp = (url, currentUser, userProfile) => {
  syncSSOSession(currentUser, userProfile);

  // If external URL and logged in, can append parameters or open cleanly
  if (url.startsWith('http')) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    // Relative internal web app
    window.location.href = url;
  }
};

