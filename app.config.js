import 'dotenv/config';

// Ensure these are in your .env and EAS Secrets
const GOOGLE_IOS_REVERSED_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_REVERSED_CLIENT_ID; 
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID; // Used for web/server-side flow with Supabase

export default ({ config }) => {
  return {
    expo: {
      name: "Solace",
      slug: "solace",
      version: "1.0.3",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "solaceapp",
      userInterfaceStyle: "light",
      newArchEnabled: true,
      ios: {
        ...config?.expo?.ios,
        supportsTablet: false,
        isTabletOnly: false,
        requireFullScreen: true,
        bundleIdentifier: "com.dorghaamhaidar.solace.iphone",
        buildNumber: "5",
        googleServicesFile: "./GoogleService-Info.plist",
        appleTeamId: "G9JD362QTT",
        entitlements: {
          "com.apple.security.application-groups": [
            "group.com.dorghaamhaidar.solace.iphone.widget"
          ]
        },
        infoPlist: {
          ...(config?.expo?.ios?.infoPlist || {}),
          UIDeviceFamily: [1],
          CFBundleURLTypes: [
            ...(config?.expo?.ios?.infoPlist?.CFBundleURLTypes || []).filter(urlType => {
              return !(urlType.CFBundleURLSchemes || []).includes(GOOGLE_IOS_REVERSED_CLIENT_ID);
            }),
            {
              CFBundleURLSchemes: [GOOGLE_IOS_REVERSED_CLIENT_ID]
            }
          ],
        }
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/images/adaptive-icon.png",
          backgroundColor: "#FEF7F5"
        },
        package: "com.dorghaamhaidar.solace",
        edgeToEdgeEnabled: true
      },
      web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/favicon.png"
      },
      plugins: [
        [
          "expo-build-properties",
          {
            ios: {
              useFrameworks: "static"
            }
          }
        ],
        "expo-router",
        [
          "expo-splash-screen",
          {
            backgroundColor: "#FFF9FB",
            resizeMode: "contain"
          }
        ],
        [
          "expo-notifications",
          {
            icon: "./assets/images/notification-icon.png",
            color: "#6096FD"
          }
        ],
        "@react-native-google-signin/google-signin",
      ],
      experiments: {
        typedRoutes: true
      },
      extra: {
        ...config?.expo?.extra,
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        googleWebClientId: GOOGLE_WEB_CLIENT_ID,
        eas: {
          ...(config?.expo?.extra?.eas || {}),
          projectId: "3492a16b-5ccf-47a1-bbb5-e1ed0d2d1181"
        }
      }
    }
  };
};
