import { extendTheme } from 'native-base';

// Define our new core pink color
const solacePink = '#F06B93'; // A pleasant, noticeable pink
const solaceBackground = '#FFF7F5'; // Very light, warm, creamy beige/pinkish (kept from miracle)
const solaceCardBackground = '#FFFFFF'; // Soft off-white for cards (kept from miracle)
const solacePrimaryButtonText = '#FFFFFF'; // White text for primary buttons

export const solaceTheme = extendTheme({
  colors: {
    primary: { // Shades of solacePink
      50: '#FFE3EC',  // Lighter
      100: '#FFC1D7',
      200: '#FFA0C2',
      300: '#FF7EAD',
      400: '#FA5C98',
      500: solacePink,   // Main primary pink
      600: '#D95A80', // Darker
      700: '#C24F70',
      800: '#AA4460',
      900: '#933950',
    },
    solacePink: solacePink, // Direct access
    solaceBackground: solaceBackground,
    solaceCardBackground: solaceCardBackground,
    primaryButtonText: solacePrimaryButtonText, // Renamed for clarity

    // Keeping existing semantic names, but they'll use the new background
    backgroundLight: solaceBackground,
    backgroundFocused: '#FEFBF9', // Slightly different for focused elements
    
    textPrimary: '#333333',
    textSecondary: '#757575',
    textTertiary: '#AEAEAE',

    accentWarm: '#FFDAB9', // Peach - should still complement pink
    accentCool: '#B2EBF2', // Light Blue - can work with pink
    greyButton: '#F0F0F0',

    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',

    quoteBackground: solaceCardBackground,
    quoteText: '#333333',

    // Deprecated old names, but map to new ones just in case
    miracleBlue: solacePink, // Mapped to new pink
    miracleBackground: solaceBackground,
    miracleCardBackground: solaceCardBackground,
    onboardingButtonText: solacePrimaryButtonText,
    titleGrey: '#757575', // Mapped to textSecondary
  },
  fontConfig: {
    System: {},
    SpaceMono: {
      400: {
        normal: 'SpaceMono-Regular',
      },
    },
  },
  fonts: {
    heading: 'System',
    body: 'System',
    mono: 'SpaceMono',
  },
  components: {
    Button: {
      baseStyle: {
        rounded: 'full',
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
          _text: { color: theme.colors.primaryButtonText } // Uses the new white text variable
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
        colorScheme: 'primary', // All default buttons will now use the pink scheme
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
          fontSize: '3xl',
          fontWeight: 'bold',
          fontFamily: 'heading',
          color: 'textPrimary', // Primary titles can be dark
          textAlign: 'center',
          lineHeight: '2xl',
        },
        subtitle: {
          fontSize: 'lg',
          color: 'textSecondary',
          textAlign: 'center',
          lineHeight: 'md',
          fontFamily: 'body',
        },
        body: {
          fontSize: 'md',
          lineHeight: 'lg',
          color: 'textPrimary',
        },
        quote: {
          fontSize: '2xl',
          fontWeight: 'semibold',
          textAlign: 'center',
          color: 'quoteText',
          fontFamily: 'heading',
          lineHeight: 'xl',
        },
        small: {
          fontSize: 'sm',
          color: 'textSecondary',
        }
      }
    },
    Input: {
      baseStyle: {
        rounded: 'lg',
        borderColor: 'textTertiary',
        backgroundColor: 'solaceCardBackground', // Use new variable
        paddingY: 3,
        paddingX: 4,
        fontFamily: 'body',
        fontSize: 'md',
        _focus: {
          borderColor: 'primary.500', // Pink border on focus
          backgroundColor: 'solaceCardBackground',
          _hover: { 
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
        colorScheme: 'primary', // Icons will use pink by default
      }
    },
    Switch: {
      defaultProps: {
        colorScheme: 'primary', // Will use pink
      },
    },
    Radio: {
      defaultProps: {
        colorScheme: 'primary', // Will use pink
      },
      baseStyle: ({ colorScheme, theme }: any) => ({ // Added function to access theme
        _icon: { 
          color: colorScheme === 'primary' ? theme.colors.primaryButtonText : undefined, // White inner circle for pink radio
        },
        borderColor: 'primary.500', // Pink border
      }),
    },
  },
  config: {
    initialColorMode: 'light',
  },
});

// This is necessary for TypeScript to recognize your custom theme.
type CustomThemeType = typeof solaceTheme;
declare module 'native-base' {
  interface ICustomTheme extends CustomThemeType {}
} 