import { onAuthStateChanged, reload, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, authPersistenceReady, firebaseReady } from '../firebase/config';
import { listenToUserProfile, updateUserProfile } from '../firebase/firestore';
import { isAdminEmail, isAdminUser } from '../utils/admin';
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
    let authRunId = 0;
    let unsubscribeAuth = () => {};
    let disposed = false;

    authPersistenceReady.finally(() => {
      if (disposed) return;

      unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        const currentRunId = ++authRunId;
        unsubscribeProfile();
        setCurrentUser(user);
        setBootstrapError('');

        if (!user) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const shouldPromoteAdmin = isAdminEmail(user.email);
        const loadingTimeout = window.setTimeout(() => {
          if (currentRunId === authRunId) {
            setLoading(false);
          }
        }, 7000);

        try {
          unsubscribeProfile = listenToUserProfile(
            user.uid,
            (nextProfile) => {
              if (currentRunId !== authRunId) {
                return;
              }

              window.clearTimeout(loadingTimeout);
              const fallbackName = getFallbackNameFromEmail(user.email);
              const profileUpdates = {};

              if (shouldPromoteAdmin && nextProfile?.role !== 'admin') {
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
              setProfile(
                nextProfile
                  ? { ...nextProfile, ...profileUpdates }
                  : {
                      id: user.uid,
                      email: user.email,
                      name: fallbackName,
                      role: shouldPromoteAdmin ? 'admin' : 'member',
                    },
              );
              setLoading(false);
            },
            (error) => {
              if (currentRunId !== authRunId) {
                return;
              }

              window.clearTimeout(loadingTimeout);
              console.error('Unable to load user profile.', error);
              setBootstrapError(
                error?.message || 'Unable to load your profile. Check Firestore setup.',
              );
              setProfile(null);
              setLoading(false);
            },
          );
        } catch (error) {
          if (currentRunId !== authRunId) {
            return;
          }

          window.clearTimeout(loadingTimeout);
          console.error('Unable to load auth bootstrap dependencies.', error);
          setBootstrapError(error?.message || 'Unable to load your profile. Check Firestore setup.');
          setProfile(null);
          setLoading(false);
        }
      });
    });

    return () => {
      disposed = true;
      authRunId += 1;
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
