import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function getInitialSession() {
  if (typeof window === 'undefined') return { user: null, profile: null };
  try {
    const stored =
      localStorage.getItem('sni_user_session') ||
      localStorage.getItem('sni_current_user') ||
      localStorage.getItem('sni_unified_session');
    if (stored) {
      const u = JSON.parse(stored);
      if (u && (u.userId || u.uid)) {
        const id = u.userId || u.uid;
        const email = u.email || `${id}@sni.org.in`;
        const isAdmin = String(id).toLowerCase() === 'surya11008' || u.role === 'admin';
        return {
          user: {
            uid: id,
            email: email,
            displayName: u.fullName || u.displayName || id,
          },
          profile: {
            uid: id,
            email: email,
            displayName: u.fullName || u.displayName || id,
            role: isAdmin ? 'admin' : (u.role || 'member'),
            status: u.status || 'approved',
          },
        };
      }
    }
  } catch (e) {}
  return { user: null, profile: null };
}

export const AuthProvider = ({ children }) => {
  const initial = getInitialSession();
  const [currentUser, setCurrentUser] = useState(initial.user);
  const [userProfile, setUserProfile] = useState(initial.profile);
  const [loading, setLoading] = useState(!initial.user);

  // Auto-expire timer for 3-hour temporary password sessions & unified session sync
  useEffect(() => {
    let logoutTimer = null;

    // 1. Check if there is an active unified session from auth.html
    const storedUnifiedSession =
      localStorage.getItem('sni_user_session') ||
      localStorage.getItem('sni_current_user') ||
      localStorage.getItem('sni_unified_session');

    if (storedUnifiedSession) {
      try {
        const u = JSON.parse(storedUnifiedSession);
        if (u && (u.userId || u.uid)) {
          const id = u.userId || u.uid;
          const email = u.email || `${id}@sni.org.in`;
          const isAdmin = String(id).toLowerCase() === 'surya11008' || u.role === 'admin';
          const unifiedUser = {
            uid: id,
            email: email,
            displayName: u.fullName || u.displayName || id,
          };
          setCurrentUser((prev) => prev || unifiedUser);
          setUserProfile((prev) => prev || {
            uid: id,
            email: email,
            displayName: u.fullName || u.displayName || id,
            role: isAdmin ? 'admin' : (u.role || 'member'),
            status: u.status || 'approved',
          });
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to parse unified session:', err);
      }
    }

    // 2. Check if there is an active temporary password session in storage
    const storedTempSession = localStorage.getItem('sni_temp_session');
    if (storedTempSession) {
      try {
        const session = JSON.parse(storedTempSession);
        const expiresAt = new Date(session.expiresAt).getTime();
        const remainingMs = expiresAt - Date.now();

        if (remainingMs > 0) {
          // Valid temp session
          const tempUser = {
            uid: session.uid,
            email: session.email,
            displayName: session.displayName || session.email?.split('@')[0],
            isTempSession: true,
            expiresAt: session.expiresAt,
          };
          setCurrentUser((prev) => prev || tempUser);

          // Listen to user profile
          const userDocRef = doc(db, 'users', session.uid);
          const unsubProfile = onSnapshot(userDocRef, (snap) => {
            if (snap.exists()) {
              setUserProfile({ uid: snap.id, ...snap.data() });
            }
          });

          // Set timer to automatically log out when 3 hours elapse
          logoutTimer = setTimeout(() => {
            alert('Your 3-hour temporary password session has expired. Please sign in again or request a new reset from the Administrator.');
            logout();
          }, remainingMs);

          setLoading(false);
          return () => {
            if (logoutTimer) clearTimeout(logoutTimer);
            unsubProfile();
          };
        } else {
          // Expired
          localStorage.removeItem('sni_temp_session');
        }
      } catch (err) {
        console.warn('Failed to parse temporary session:', err);
        localStorage.removeItem('sni_temp_session');
      }
    }

    let unsubscribeFirestore = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          
          // Listen to real-time updates for user profile & role
          unsubscribeFirestore = onSnapshot(
            userDocRef,
            async (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                // Ensure known admins are always marked approved
                const isAdmin =
                  user.email === 'surya11008@sni.org.in' ||
                  user.email === 'admin@sni.org.in' ||
                  user.email?.startsWith('surya') ||
                  data.role === 'admin';

                setUserProfile({
                  ...data,
                  status: isAdmin ? 'approved' : data.status || 'pending',
                });
              } else {
                // Initialize default profile in Firestore if not yet created
                const isAdmin =
                  user.email === 'surya11008@sni.org.in' ||
                  user.email === 'admin@sni.org.in' ||
                  user.email?.startsWith('surya');

                const defaultProfile = {
                  uid: user.uid,
                  email: user.email || '',
                  displayName: user.displayName || user.email?.split('@')[0] || 'User',
                  role: isAdmin ? 'admin' : 'member',
                  status: isAdmin ? 'approved' : 'pending',
                  createdAt: new Date().toISOString(),
                };
                await setDoc(userDocRef, defaultProfile, { merge: true });
                setUserProfile(defaultProfile);
              }
              setLoading(false);
            },
            (error) => {
              console.error('Firestore user profile snapshot error:', error);
              setUserProfile({
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || user.email?.split('@')[0] || 'User',
                role: 'member',
              });
              setLoading(false);
            }
          );
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'member',
          });
          setLoading(false);
        }
      } else {
        const hasSession =
          localStorage.getItem('sni_temp_session') ||
          localStorage.getItem('sni_user_session') ||
          localStorage.getItem('sni_current_user') ||
          localStorage.getItem('sni_unified_session');

        if (!hasSession) {
          if (unsubscribeFirestore) {
            unsubscribeFirestore();
            unsubscribeFirestore = null;
          }
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
      if (logoutTimer) {
        clearTimeout(logoutTimer);
      }
    };
  }, []);

  // Login with Email & Password
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Login with Temporary 3-Hour Password
  const loginWithTempPassword = async (userDoc) => {
    const session = {
      uid: userDoc.uid || userDoc.id,
      email: userDoc.email,
      displayName: userDoc.displayName || userDoc.fullName || userDoc.email?.split('@')[0],
      role: userDoc.role || 'member',
      expiresAt: userDoc.tempPasswordExpiresAt,
    };
    localStorage.setItem('sni_temp_session', JSON.stringify(session));

    const tempUser = {
      uid: session.uid,
      email: session.email,
      displayName: session.displayName,
      isTempSession: true,
      expiresAt: session.expiresAt,
    };
    setCurrentUser(tempUser);
    setUserProfile({ ...userDoc, uid: session.uid });
    return { user: tempUser };
  };

  // Register new account with optional role and initial profile
  const signup = async (email, password, displayName, role = 'member', phone = '') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    const isAdmin =
      email === 'surya11008@sni.org.in' ||
      email === 'admin@sni.org.in' ||
      email.startsWith('surya') ||
      role === 'admin';

    const newProfile = {
      uid: user.uid,
      id: user.uid,
      email: user.email || email,
      displayName: displayName || email.split('@')[0],
      phone: phone || '',
      role: isAdmin ? 'admin' : role || 'member',
      status: isAdmin ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
    } catch (err) {
      console.warn('Could not write initial Firestore user doc:', err);
    }

    setUserProfile(newProfile);
    return cred;
  };

  // Update Password
  const updateUserPassword = async (newPassword) => {
    if (auth.currentUser) {
      await updatePassword(auth.currentUser, newPassword);
    }
    // Also clear temporary password in Firestore if it existed
    if (currentUser?.uid) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          tempPassword: null,
          tempPasswordExpiresAt: null,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not clear temp password on password update:', e);
      }
    }
    // If it was a temp session, remove temp session flag
    if (localStorage.getItem('sni_temp_session')) {
      localStorage.removeItem('sni_temp_session');
    }
  };

  // Sign out
  const logout = async () => {
    localStorage.removeItem('sni_temp_session');
    localStorage.removeItem('sni_user_session');
    localStorage.removeItem('sni_current_user');
    localStorage.removeItem('sni_unified_session');
    localStorage.removeItem('sni_admin_active');
    sessionStorage.removeItem('sni_admin_active');
    localStorage.removeItem('star_galaxy_active_user_id');
    localStorage.removeItem('star_galaxy_pin_unlocked');
    sessionStorage.removeItem('star_galaxy_pin_unlocked');
    localStorage.removeItem('star_galaxy_active_tab');
    localStorage.removeItem('star_galaxy_selected_activity');
    try {
      document.cookie = 'sni_unified_user=; Path=/; Max-Age=0';
      document.cookie = 'sni_session_active=; Path=/; Max-Age=0';
      document.cookie = 'sni_unified_user=; Domain=.sni.org.in; Path=/; Max-Age=0; SameSite=Lax; Secure';
      document.cookie = 'sni_session_active=; Domain=.sni.org.in; Path=/; Max-Age=0; SameSite=Lax; Secure';
    } catch (e) {}
    setCurrentUser(null);
    setUserProfile(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('SignOut error:', e);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    loginWithTempPassword,
    signup,
    updateUserPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
