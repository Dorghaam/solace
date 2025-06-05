import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from './supabaseClient';
// configureGoogleSignIn is called once from _layout.tsx, so not strictly needed here,
// but ensure it IS called before any login attempt.

export const loginWithGoogle = async () => {
  console.log('authService: Attempting loginWithGoogle...');
  try {
    // Step 1: Check for Play Services (Android)
    // The configureGoogleSignIn in _layout.tsx should have already run.
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('authService: Google Play Services check passed.');

    // Step 2: Sign in with Google to get the user info
    const userInfo = await GoogleSignin.signIn();
    console.log('authService: Google Sign-In successful, user info obtained.');

    // Step 3: Get tokens to access the ID token
    const tokens = await GoogleSignin.getTokens();
    
    if (!tokens.idToken) {
      console.error('authService: No ID token received from Google Sign-In.');
      throw new Error('Google Sign-In Error: No ID token received.');
    }
    console.log('authService: Google ID Token obtained.');

    // Step 4: Sign in to Supabase with the Google ID token
    const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: tokens.idToken,
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
    } catch (googleError) {
      // If isSignedIn fails, try to sign out anyway
      console.log('authService: isSignedIn check failed, attempting direct sign out.');
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
        console.log('authService: Google direct signOut successful.');
      } catch (directSignOutError) {
        console.log('authService: Google direct signOut also failed, but Supabase signOut was successful.');
      }
    }
  } catch (error: any) {
    console.error('authService: signOut error:', error.code, error.message, error);
    // It's possible revokeAccess or signOut might fail if tokens are already invalid,
    // but the main goal is to clear the Supabase session.
    throw new Error(error.message || 'An error occurred during sign out.');
  }
}; 