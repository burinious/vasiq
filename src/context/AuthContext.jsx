import { onAuthStateChanged, reload, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, firebaseReady } from '../firebase/config';
import { isAdminEmail, isAdminUser } from '../utils/admin';
import { ensurePredefinedGroups } from '../firebase/seed';
import { listenToUserProfile, updateUserProfile } from '../firebase/firestore';
import { getFallbackNameFromEmail } from '../utils/userIdentity';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState('');

  useEffect(() => {
    if (!firebaseReady || !auth) {
      setLoading(false);
      return undefined;
    }

    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      unsubscribeProfile();
      setCurrentUser(user);
      setBootstrapError('');

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const shouldSeedAnnouncements = isAdminEmail(user.email);

      // Do not block app startup on Firestore bootstrap writes.
      ensurePredefinedGroups({ includeAnnouncements: shouldSeedAnnouncements }).catch((error) => {
        console.error('Unable to seed predefined groups.', error);
        setBootstrapError(
          error?.message || 'Unable to reach Firestore. Check your Firebase setup.',
        );
      });

      const loadingTimeout = window.setTimeout(() => {
        setLoading(false);
      }, 7000);

      unsubscribeProfile = listenToUserProfile(
        user.uid,
        (nextProfile) => {
          window.clearTimeout(loadingTimeout);
          if (nextProfile?.accountDeleted) {
            firebaseSignOut(auth);
            setProfile(null);
            setLoading(false);
            return;
          }

          const fallbackName = getFallbackNameFromEmail(user.email);
          const profileUpdates = {};

          if (shouldSeedAnnouncements && nextProfile?.role !== 'admin') {
            profileUpdates.role = 'admin';
          }

          if (!nextProfile?.name?.trim()) {
            profileUpdates.name = fallbackName;
          }

          if (Object.keys(profileUpdates).length) {
            updateUserProfile(user.uid, profileUpdates).catch((error) => {
              console.error('Unable to sync auth profile state.', error);
            });
          }
          setProfile(nextProfile);
          setLoading(false);
        },
        (error) => {
          window.clearTimeout(loadingTimeout);
          console.error('Unable to load user profile.', error);
          setBootstrapError(
            error?.message || 'Unable to load your profile. Check Firestore setup.',
          );
          setProfile(null);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const refreshVerification = async () => {
    if (!auth?.currentUser) return;

    await reload(auth.currentUser);
    setCurrentUser({ ...auth.currentUser });
  };

  const value = useMemo(
    () => ({
      currentUser,
      firebaseReady,
      profile,
      isAdmin: isAdminUser({ email: currentUser?.email, profile }),
      loading,
      bootstrapError,
      signOut: () => (auth ? firebaseSignOut(auth) : Promise.resolve()),
      refreshVerification,
    }),
    [bootstrapError, currentUser, loading, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
