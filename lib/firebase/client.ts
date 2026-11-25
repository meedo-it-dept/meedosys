import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut,
  Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    !firebaseConfig.apiKey.includes('your-firebase')
);

export const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseAuth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Provisions an Email/Password account in Firebase Auth using an isolated
 * ephemeral secondary app so the currently signed-in Administrator is not signed out.
 */
export async function provisionFirebaseEmailUser(
  email: string,
  password: string,
  displayName?: string
): Promise<{ uid: string }> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Authentication is not configured.');
  }
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    throw new Error('Email address is required.');
  }
  if (!password || password.length < 6) {
    throw new Error('Firebase password must be at least 6 characters long.');
  }

  const secondaryName = `admin-provision-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryName);
  const secondaryAuth = initializeAuth(secondaryApp, {
    persistence: inMemoryPersistence,
  });

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, cleanEmail, password);
    if (displayName?.trim()) {
      await updateProfile(cred.user, { displayName: displayName.trim() }).catch(() => {});
    }
    await sendEmailVerification(cred.user).catch(() => {});
    return { uid: cred.user.uid };
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}

export async function sendUserPasswordReset(email: string): Promise<void> {
  if (!firebaseAuth) {
    throw new Error('Firebase Authentication is not configured.');
  }
  const cleanEmail = email.trim();
  if (!cleanEmail) {
    throw new Error('A valid email address is required to send a password reset email.');
  }
  await sendPasswordResetEmail(firebaseAuth, cleanEmail);
}

export function mapFirebaseAuthError(err: any): string {
  const code = String(err?.code || '');
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email address or password.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists in Firebase Authentication.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google Sign-In was cancelled before completion.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase OAuth sign-in. Contact the Administrator.';
    case 'auth/user-disabled':
      return 'This Firebase user account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/network-request-failed':
      return 'Network error communicating with Firebase Authentication. Check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled for this Firebase project.';
    default:
      return err?.message || 'Authentication failed. Please try again.';
  }
}
