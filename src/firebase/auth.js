import {
  applyActionCode,
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, authPersistenceReady } from './config';
import { assertEmailNotDeleted, createUserProfile, markAccountDeleted } from './firestore';
import { isAdminEmail, isSeededDemoEmail } from '../utils/admin';
import { getFallbackNameFromEmail } from '../utils/userIdentity';

export function getReadableAuthError(error) {
  switch (error?.code) {
    case 'auth/email-already-in-use':
      return 'This email is already in use.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
      return 'Invalid login credentials.';
    case 'auth/user-not-found':
      return 'No account was found for this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a bit and try again.';
    case 'auth/configuration-not-found':
      return 'Firebase email/password sign-in is not enabled yet.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/account-permanently-deleted':
      return 'This login has been permanently deleted and cannot be used again on VASIQ.';
    case 'auth/requires-recent-login':
      return 'For security, sign in again before deleting your account.';
    case 'auth/invalid-action-code':
      return 'This verification link is invalid or has already been used.';
    case 'auth/expired-action-code':
      return 'This verification link has expired. Request a new one.';
    default:
      return error?.message || 'Something went wrong. Please try again.';
  }
}

function getEmailActionSettings() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  return {
    url: `${origin}/email-action`,
    handleCodeInApp: true,
  };
}

export async function registerWithEmail({ email, password }) {
  await authPersistenceReady;
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  const fallbackName = getFallbackNameFromEmail(normalizedEmail);

  try {
    await assertEmailNotDeleted(normalizedEmail);
    await createUserProfile(credential.user.uid, {
      name: fallbackName,
      displayName: '',
      fullName: '',
      email: normalizedEmail,
      department: '',
      level: '',
      residence: '',
      statusText: '',
      about: '',
      avatarUrl: '',
      role: isAdminEmail(normalizedEmail) ? 'admin' : 'member',
      showDepartment: true,
      showLevel: true,
    });
  } catch (error) {
    if (error?.code === 'auth/account-permanently-deleted') {
      await deleteUser(credential.user).catch(() => {});
    }
    throw error;
  }

  await sendEmailVerification(credential.user, getEmailActionSettings());
  return credential.user;
}

export async function loginWithEmail({ email, password }) {
  await authPersistenceReady;
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);

  if (!isSeededDemoEmail(normalizedEmail)) {
    try {
      await assertEmailNotDeleted(normalizedEmail);
    } catch (error) {
      await signOut(auth).catch(() => {});
      throw error;
    }
  }

  return credential.user;
}

export async function deleteCurrentAccount({ password } = {}) {
  const user = auth.currentUser;

  if (!user?.email) {
    throw new Error('No authenticated user found.');
  }

  const normalizedEmail = user.email.trim().toLowerCase();
  const providerIds = user.providerData.map((provider) => provider.providerId);

  if (providerIds.includes('password')) {
    if (!password) {
      throw new Error('Enter your current password to delete this account.');
    }

    const credential = EmailAuthProvider.credential(normalizedEmail, password);
    await reauthenticateWithCredential(user, credential);
  } else if (providerIds.includes('google.com')) {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
  }

  await markAccountDeleted(user.uid, normalizedEmail);
  await deleteUser(user);
}

export async function resendVerificationEmail() {
  if (!auth.currentUser) {
    throw new Error('No authenticated user found.');
  }

  await sendEmailVerification(auth.currentUser, getEmailActionSettings());
}

export async function verifyEmailWithCode(actionCode) {
  await applyActionCode(auth, actionCode);
}
