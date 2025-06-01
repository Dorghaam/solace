import { extendTheme } from 'native-base';

// Define our new core colors based on the "Miracle" app style
const miracleBlue = '#5850EC'; // A vibrant, modern blue/purple
const miracleBackground = '#FFF7F5'; // Very light, warm, creamy beige/pinkish
const miracleCardBackground = '#FFFFFF'; // Soft off-white for cards
const miracleOnboardingButtonText = '#FFFFFF'; // White text for primary buttons

export const solaceTheme = extendTheme({
  colors: {
    primary: { // Shades of miracleBlue
      50: '#EAE9FD',
      100: '#D0CFFB',
      200: '#B6B5F9',
      300: '#9C9AF7',
      400: '#827FF5',
      500: miracleBlue, // Main primary color
      600: '#4E47D4',
      700: '#443EB9',
      800: '#3A359F',
      900: '#302C85',
    },
    miracleBlue: miracleBlue, // Direct access if needed
    miracleBackground: miracleBackground,
    miracleCardBackground: miracleCardBackground,
    onboardingButtonText: miracleOnboardingButtonText,

    // Overriding existing theme colors
    backgroundLight: miracleBackground, // Main app background
    backgroundFocused: '#FEFBF9', // Slightly different for focused elements if needed, or use miracleCardBackground
    
    textPrimary: '#333333',    // Dark grey for primary text
    textSecondary: '#757575',  // Medium grey for secondary text
    textTertiary: '#AEAEAE',   // Light grey for tertiary text / borders

    accentWarm: '#FFDAB9', // Keep or update if image suggests otherwise
    accentCool: '#B2EBF2', // Keep or update
    greyButton: '#F0F0F0', // Keep or update

    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',

    quoteBackground: miracleCardBackground, // Background for affirmation cards
    quoteText: '#333333',                   // Text color for affirmations

    // Legacy colors - review if they are still needed or can be mapped to new system
    titleGrey: '#6C7A89', // Could be mapped to textSecondary or a shade of miracleBlue
  },
  fontConfig: {
    // Using system fonts primarily for broader compatibility and modern feel
    // SpaceMono is kept for specific 'mono' usage if any.
    System: {
      // React Native will attempt to use system defaults
      // For specific weights, you'd typically load font files.
    },
    SpaceMono: {
      400: {
        normal: 'SpaceMono-Regular',
      },
    },
  },
  fonts: {
    heading: 'System', // Using system default sans-serif
    body: 'System',    // Using system default sans-serif
    mono: 'SpaceMono',
  },
  components: {
    Button: {
      baseStyle: {
        rounded: 'full', // Pill-shaped buttons
        _text: {
          fontWeight: 'semibold',
          fontFamily: 'body',
        },
      },
      sizes: {
        lg: {
          px: 6,
          py: 3.5,
          _text: { fontSize: 'md' },
        },
      },
      variants: {
        solid: ({ colorScheme, theme }: any) => ({
          bg: colorScheme === 'primary' ? theme.colors.primary[500] : `${colorScheme}.500`,
          _pressed: { bg: colorScheme === 'primary' ? theme.colors.primary[600] : `${colorScheme}.600` },
          _text: { color: theme.colors.onboardingButtonText } // White text on primary buttons
        }),
        subtle: ({ colorScheme, theme }: any) => ({
          bg: colorScheme === 'primary' ? theme.colors.primary[100] : `${colorScheme}.100`,
          _text: { color: colorScheme === 'primary' ? theme.colors.primary[700] : `${colorScheme}.700`},
          _pressed: { bg: colorScheme === 'primary' ? theme.colors.primary[200] : `${colorScheme}.200` },
        }),
        outline: ({ colorScheme, theme }: any) => ({
           borderColor: colorScheme === 'primary' ? theme.colors.primary[500] : `${colorScheme}.500`,
           borderWidth: 2,
           _text: { color: colorScheme === 'primary' ? theme.colors.primary[500] : `${colorScheme}.500`, fontWeight: 'bold' },
           _pressed: { bg: colorScheme === 'primary' ? theme.colors.primary[50] : `${colorScheme}.50` },
        }),
        ghost: ({ colorScheme, theme }: any) => ({
          _text: { color: colorScheme === 'primary' ? theme.colors.primary[500] : `${colorScheme}.500` },
          _pressed: { bg: colorScheme === 'primary' ? theme.colors.primary[100] : `${colorScheme}.100` },
        }),
      },
      defaultProps: {
        colorScheme: 'primary',
        size: 'lg',
      }
    },
    Text: {
      baseStyle: {
        color: 'textPrimary',
        fontFamily: 'body',
      },
      variants: {
        title: {
          fontSize: '3xl', // e.g., 30-36px
          fontWeight: 'bold',
          fontFamily: 'heading',
          color: 'textPrimary', // Or primary.500 if titles are blue
          textAlign: 'center',
          lineHeight: '2xl', // Adjust as needed e.g. 36 or 40
        },
        subtitle: {
          fontSize: 'lg', // e.g. 18-20px
          color: 'textSecondary',
          textAlign: 'center',
          lineHeight: 'md', // Adjust as needed e.g. 28
          fontFamily: 'body',
        },
        body: {
          fontSize: 'md', // e.g. 16px
          lineHeight: 'lg', // Adjust as needed e.g. 24
          color: 'textPrimary',
        },
        quote: {
          fontSize: '2xl', // e.g. 24px, or larger if needed
          fontWeight: 'semibold', // or 'medium' depending on font
          textAlign: 'center',
          color: 'quoteText',
          fontFamily: 'heading', // Or a specific display font if available
          lineHeight: 'xl', // Adjust e.g. 32 or 36
        },
        small: {
          fontSize: 'sm', // e.g. 14px
          color: 'textSecondary',
        }
      }
    },
    Input: {
      baseStyle: {
        rounded: 'lg', // Rounded corners
        borderColor: 'textTertiary', // Subtle border
        backgroundColor: 'miracleCardBackground', // Light background for input
        paddingY: 3,
        paddingX: 4,
        fontFamily: 'body',
        fontSize: 'md',
        _focus: {
          borderColor: 'primary.500', // miracleBlue border on focus
          backgroundColor: 'miracleCardBackground', // Can add a subtle change like primary.50
          _hover: { // For web
            borderColor: 'primary.500',
          }
        },
      },
      defaultProps: {
        size: 'xl', 
        variant: 'outline',
      }
    },
    IconButton: {
      baseStyle: {
        rounded: 'full',
      },
      defaultProps: {
        variant: 'ghost',
        colorScheme: 'primary', // So icons use miracleBlue by default
      }
    },
    Switch: {
      defaultProps: {
        colorScheme: 'primary', // Will use miracleBlue
      },
    },
    Radio: {
      defaultProps: {
        colorScheme: 'primary', // Will use miracleBlue
      },
      baseStyle: {
        _icon: { // Color of the inner circle of the radio
          color: 'onboardingButtonText', // White inner circle when selected
        },
        borderColor: 'primary.500', // Border of the radio button itself
      },
    },
  },
  config: {
    initialColorMode: 'light',
  },
});

type CustomThemeType = typeof solaceTheme;
declare module 'native-base' {
  interface ICustomTheme extends CustomThemeType {}
} 