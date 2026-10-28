import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, testConnection } from '../firebase';

export interface AppUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  isLocal?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginAsLocalAdmin: () => void;
  logout: () => Promise<void>;
}

const DEFAULT_LOCAL_USER: AppUser = {
  uid: 'kb-factory-admin',
  displayName: 'Farooq Gujjar KB',
  email: 'farooq.gujjar@kbfactory.com',
  isLocal: true,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  loginAsLocalAdmin: () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();

    // Check saved local user session first
    const savedUser = localStorage.getItem('KB_FACTORY_USER');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.uid) {
          setUser(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.warn('Could not parse stored session:', e);
      }
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          const appUser: AppUser = {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            isLocal: false,
          };
          setUser(appUser);
          localStorage.setItem('KB_FACTORY_USER', JSON.stringify(appUser));
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Auth state listener error:', error);
        // If no user set yet, default to local admin session if stored or auto-login
        if (!user && !localStorage.getItem('KB_FACTORY_USER')) {
          localStorage.setItem('KB_FACTORY_USER', JSON.stringify(DEFAULT_LOCAL_USER));
          setUser(DEFAULT_LOCAL_USER);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const appUser: AppUser = {
          uid: res.user.uid,
          displayName: res.user.displayName,
          email: res.user.email,
          photoURL: res.user.photoURL,
          isLocal: false,
        };
        setUser(appUser);
        localStorage.setItem('KB_FACTORY_USER', JSON.stringify(appUser));
      }
    } catch (error: any) {
      console.warn('Google Sign-In Error:', error);
      // If token service is disabled or blocked, automatically set local admin user session
      if (
        error?.message?.includes('token-service-api-has-not-been-used-in-project') ||
        error?.code === 'auth/operation-not-allowed' ||
        error?.code === 'auth/api-key-not-valid'
      ) {
        loginAsLocalAdmin();
        return;
      }
      throw error;
    }
  };

  const loginAsLocalAdmin = () => {
    setUser(DEFAULT_LOCAL_USER);
    localStorage.setItem('KB_FACTORY_USER', JSON.stringify(DEFAULT_LOCAL_USER));
  };

  const logout = async () => {
    try {
      await signOut(auth).catch(() => {});
    } catch (error: any) {
      console.warn('Sign-Out Error:', error);
    } finally {
      localStorage.removeItem('KB_FACTORY_USER');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, loginAsLocalAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

