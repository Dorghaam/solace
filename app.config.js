import 'dotenv/config';

export default ({ config }) => {
  return {
    expo: {
      name: "Solace",
      slug: "solace",
      version: "1.0.2",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "solaceapp",
      userInterfaceStyle: "light",
      newArchEnabled: true,
      ios: {
        supportsTablet: false,
        isTabletOnly: false,
        requireFullScreen: true,
        bundleIdentifier: "com.dorghaamhaidar.solace",
        buildNumber: "4",
        infoPlist: {
          UIDeviceFamily: [1], // ✅ iPhone-only
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
        ]
      ],
      experiments: {
        typedRoutes: true
      },
      extra: {
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        eas: {
          projectId: "e4df03cb-901d-4754-bb0e-e21f845c013b"
        }
      }
    }
  };
};
