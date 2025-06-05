import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

export const configureGoogleSignIn = () => {
  try {
    const webClientId = Constants.expoConfig?.extra?.googleWebClientId as string | undefined;

    if (!webClientId) {
      console.error(
        "Google Sign-In configure ERROR: webClientId is missing from app.config.js extras. " +
        "Ensure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is in your .env file and included in app.config.js's 'extra' object."
      );
      return;
    }

    GoogleSignin.configure({
      webClientId: webClientId, // This is crucial for Supabase signInWithIdToken
      offlineAccess: true,      // Required to get an idToken for Supabase
      // iosClientId: 'YOUR_IOS_SPECIFIC_OAUTH_CLIENT_ID', // Only needed if you are NOT using the webClientId for idToken flow on iOS,
                                                            // or if you need separate iOS OAuth flows. For Supabase ID token, webClientId is usually sufficient.
                                                            // The REVERSED_CLIENT_ID is handled by Info.plist for URL schemes.
    });
    console.log("services/googleAuthService.ts: Google Sign-In configured successfully with Web Client ID:", webClientId);
  } catch (error) {
    console.error("services/googleAuthService.ts: Error configuring Google Sign-In:", error);
  }
}; 