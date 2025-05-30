import 'dotenv/config'; // Loads .env variables into process.env

export default ({ config }) => {
  // 'config' is the existing static config from app.json if it were still being used,
  // but since we are defining everything, we mainly use it to show the pattern.
  // You can spread it if you had other top-level keys outside 'expo'.
  // For this common setup, we are defining the 'expo' object fully.

  return {
    expo: {
      name: "Solace",
      slug: "solace",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/icon.png", // Ensure this path is correct
      scheme: "solaceapp",
      userInterfaceStyle: "light",
      newArchEnabled: true, // You have this enabled
      ios: {
        supportsTablet: false,
        isTabletOnly: false,
        requireFullScreen: false,
        bundleIdentifier: "com.dorghaamhaidar.solace",
        infoPlist: {
          UIDeviceFamily: [1], // 1 = iPhone only, 2 = iPad, [1,2] = Universal
          UISupportedInterfaceOrientations: [
            "UIInterfaceOrientationPortrait",
            "UIInterfaceOrientationPortraitUpsideDown"
          ]
          // Explicitly NOT including UISupportedInterfaceOrientations~ipad
        }
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/images/adaptive-icon.png", // Ensure this path is correct
          backgroundColor: "#FEF7F5"
        },
        package: "com.dorghaamhaidar.solace",
        edgeToEdgeEnabled: true // You have this enabled
      },
      web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/favicon.png" // Ensure this path is correct
      },
      plugins: [
        "expo-router",
        [
          "expo-splash-screen",
          {
            backgroundColor: "#FFF9FB", // Match your app's backgroundLight color
            resizeMode: "contain"
          }
        ],
        [
          "expo-notifications",
          {
            icon: "./assets/images/notification-icon.png", // Ensure this path is correct
            color: "#6096FD"
          }
        ]
      ],
      experiments: {
        typedRoutes: true
      },
      extra: {
        // Read from process.env (populated by dotenv from your .env file locally)
        // EAS Build will set these environment variables from secrets during its build process.
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        eas: {
          projectId: "e4df03cb-901d-4754-bb0e-e21f845c013b"
        }
      }
    }
  };
};
