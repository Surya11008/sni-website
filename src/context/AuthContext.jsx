import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
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

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          
          // Listen to real-time updates for user profile & role
          unsubscribeFirestore = onSnapshot(
            userDocRef,
            async (snapshot) => {
              if (snapshot.exists()) {
                setUserProfile(snapshot.data());
              } else {
                // Initialize default profile in Firestore if not yet created
                const defaultProfile = {
                  uid: user.uid,
                  email: user.email || '',
                  displayName: user.displayName || user.email?.split('@')[0] || 'User',
                  role: 'member',
                  createdAt: new Date().toISOString(),
                };
                await setDoc(userDocRef, defaultProfile, { merge: true });
                setUserProfile(defaultProfile);
              }
              setLoading(false);
            },
            (error) => {
              console.error('Firestore user profile snapshot error:', error);
              // Fallback basic profile
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
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  // Login with Email & Password
  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Register new account with optional role and initial profile
  const signup = async (email, password, displayName, role = 'member') => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    const newProfile = {
      uid: user.uid,
      email: user.email || email,
      displayName: displayName || email.split('@')[0],
      role: role || 'member',
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

  // Sign out
  const logout = async () => {
    return signOut(auth);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
