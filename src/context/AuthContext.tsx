import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, googleProvider, db, testConnection } from '../lib/firebase';
import { UserProfile, WeightUnit } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOffline: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleWeightUnit: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Monitor network online/offline state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection test
    testConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Auth state and sync profile from Firestore
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);

        // Subscribe to real-time user profile updates
        unsubscribeProfile = onSnapshot(
          userDocRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              setProfile({ uid: currentUser.uid, ...snapshot.data() } as UserProfile);
            } else {
              // Create default profile for newly registered user
              const defaultProfile: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName: currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Athlete'),
                weightUnit: 'lbs',
                soundEnabled: true,
                vibrationEnabled: true,
                defaultRestDuration: 90,
                activeSplitId: null,
                streak: 0,
                lastWorkoutDate: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              try {
                await setDoc(userDocRef, {
                  ...defaultProfile,
                  serverCreatedAt: serverTimestamp(),
                });
                setProfile(defaultProfile);
              } catch (e) {
                console.error('Error creating user profile document:', e);
                setProfile(defaultProfile);
              }
            }
            setLoading(false);
          },
          (err) => {
            console.warn('Profile snapshot error (could be offline):', err);
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: unknown) {
      console.error('Email sign-in error:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err: unknown) {
      console.error('Email registration error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setProfile(null);
    } catch (err: unknown) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  };

  const toggleWeightUnit = async () => {
    if (!profile) return;
    const newUnit: WeightUnit = profile.weightUnit === 'lbs' ? 'kg' : 'lbs';
    await updateUserProfile({ weightUnit: newUnit });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isOffline,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateUserProfile,
        toggleWeightUnit,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
