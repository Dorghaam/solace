import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

/**
 * Configure Google Sign-In SDK with the web client ID from app config
 * This should be called once when the app starts
 */
export const configureGoogleSignIn = () => {
  try {
    const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId as string;

    if (!googleWebClientId) {
      console.error('Google Web Client ID is missing from app config');
      return;
    }

    GoogleSignin.configure({
      webClientId: googleWebClientId, // From Firebase Console
      offlineAccess: true, // If you want to access Google API on behalf of the user FROM YOUR SERVER
      hostedDomain: '', // Restrict to a domain hosted by Google Workspace
      forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
      accountName: '', // [Android] specifies an account name on the device that should be used
      iosClientId: '', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
      googleServicePlistPath: '', // [iOS] if you renamed your GoogleService-Info.plist you'll need to set this parameter
      profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
    });

    console.log('Google Sign-In configured successfully');
  } catch (error) {
    console.error('Error configuring Google Sign-In:', error);
  }
};

/**
 * Sign in with Google
 * @returns Promise with user info or null if canceled/failed
 */
export const signInWithGoogle = async () => {
  try {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Get the users ID token
    const userInfo = await GoogleSignin.signIn();
    
    console.log('Google Sign-In successful:', userInfo);
    return userInfo;
  } catch (error: any) {
    console.error('Google Sign-In error:', error);
    
    if (error.code === 'SIGN_IN_CANCELLED') {
      console.log('User cancelled the login flow');
    } else if (error.code === 'IN_PROGRESS') {
      console.log('Sign in is in progress already');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      console.log('Play services not available');
    }
    
    return null;
  }
};

/**
 * Sign out from Google
 */
export const signOutFromGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    console.log('Google Sign-Out successful');
  } catch (error) {
    console.error('Google Sign-Out error:', error);
  }
};

/**
 * Get current user info if signed in
 */
export const getCurrentGoogleUser = async () => {
  try {
    const userInfo = await GoogleSignin.signInSilently();
    return userInfo;
  } catch (error) {
    console.log('No Google user currently signed in');
    return null;
  }
}; 