import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import 'react-native-get-random-values'; // Import for crypto.randomUUID
import { v4 as uuidv4 } from 'uuid'; // Using uuid for nonce generation
import { supabase } from './supabaseClient';
// configureGoogleSignIn is called once from _layout.tsx, so not strictly needed here,
// but ensure it IS called before any login attempt.

// Helper to generate a random string for nonce
const generateNonce = () => {
  return uuidv4();
};

export const loginWithGoogle = async () => {
  console.log('authService: Attempting loginWithGoogle...');
  try {
    // Step 1: Check for Play Services (Android)
    // The configureGoogleSignIn in _layout.tsx should have already run.
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('authService: Google Play Services check passed.');

    const clientNonce = generateNonce();
    console.log('authService: Generated client nonce:', clientNonce);

    // Step 2: Sign in with Google, passing the nonce
    // Note: The `nonce` option for `signIn` is not standard in all versions or typings
    // of @react-native-google-signin/google-signin.
    // If it's not directly supported in the signIn options,
    // the library might handle it internally based on OIDC compliance,
    // or Google's SDK might add it. We will still pass it to Supabase.
    // Forcing a new sign-in flow to ensure nonce is used if possible:
    // await GoogleSignin.signOut(); // Optional: Force fresh sign-in for testing nonce
    const userInfo = await GoogleSignin.signIn({
      // Requesting an ID token with OIDC conformant clients usually includes nonce handling.
      // The library might not explicitly expose a 'nonce' option in signIn directly.
      // We rely on the ID token obtained to potentially contain the nonce if Google's flow includes it.
    });
    console.log('authService: Google Sign-In successful, user info obtained.');

    const tokens = await GoogleSignin.getTokens();
    
    if (!tokens.idToken) {
      console.error('authService: No ID token received from Google Sign-In.');
      throw new Error('Google Sign-In Error: No ID token received.');
    }
    console.log('authService: Google ID Token obtained.');

    // Step 4: Sign in to Supabase with the Google ID token AND the client-generated nonce
    const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: tokens.idToken,
      nonce: clientNonce, // Pass the same nonce to Supabase
    });

    if (supabaseError) {
      console.error('authService: Supabase signInWithIdToken error:', supabaseError);
      throw supabaseError;
    }

    console.log('authService: Supabase sign-in successful. User:', data.user?.id);
    return data; // Contains user and session from Supabase

  } catch (error: any) {
    console.error('authService: loginWithGoogle error:', error.code, error.message, error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-in was cancelled.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available or outdated. Please update.');
    } else if (error.message && error.message.includes("nonce")) {
      // Catching the specific nonce error to give a more tailored message
      throw new Error(`Nonce validation failed with Supabase: ${error.message}`);
    } else {
      // General error
      throw new Error(error.message || 'An unknown error occurred during Google Sign-In.');
    }
  }
};

export const signOut = async () => {
  console.log('authService: Attempting signOut...');
  try {
    // Sign out from Supabase
    const { error: supabaseSignOutError } = await supabase.auth.signOut();
    if (supabaseSignOutError) {
      // Log the error but proceed to sign out from Google as well
      console.error('authService: Supabase signOut error:', supabaseSignOutError);
    } else {
      console.log('authService: Supabase signOut successful.');
    }

    // Sign out from Google
    try {
      // @ts-ignore - isSignedIn method exists but may not be in TypeScript definitions
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.revokeAccess(); // Revoke token
        await GoogleSignin.signOut();     // Clear local Google session
        console.log('authService: Google revokeAccess and signOut successful.');
      } else {
        console.log('authService: Google Sign-In: No user was signed in with Google locally.');
      }
    } catch (googleError: any) {
      console.warn('authService: Error during Google signOut/revokeAccess:', googleError.message);
      // Attempt to sign out directly if revokeAccess or isSignedIn fails
      try {
        await GoogleSignin.signOut();
        console.log('authService: Google direct signOut successful after previous error.');
      } catch (directSignOutError: any) {
        console.warn('authService: Google direct signOut also failed:', directSignOutError.message);
      }
    }
  } catch (error: any) {
    console.error('authService: General signOut error:', error.message, error);
    // It's possible revokeAccess or signOut might fail if tokens are already invalid,
    // but the main goal is to clear the Supabase session.
    throw new Error(error.message || 'An error occurred during sign out.');
  }
}; 