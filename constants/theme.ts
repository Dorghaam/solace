import { extendTheme } from 'native-base';

export const solaceTheme = extendTheme({
  colors: {
    primary: {
      50: '#FFF0F5',
      100: '#FFE6EE',
      200: '#FFDDE8',
      300: '#FFD1E1',
      400: '#FFC4DA',
      500: '#FFB3D1',
      600: '#FFACCB',
      700: '#FF9CC2',
      800: '#FF8AB8',
      900: '#FF7AAF',
    },
    backgroundLight: '#FFF9FB',
    backgroundFocused: '#FFFFFF',
    textPrimary: '#424242',
    textSecondary: '#757575',
    textTertiary: '#BDBDBD',
    accentWarm: '#FFDAB9',
    accentCool: '#B2EBF2',
    greyButton: '#F0F0F0',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    quoteBackground: '#FFFFFF',
    quoteText: '#333333',
    onboardingButtonText: '#FFFFFF',
    titleGrey: '#6C7A89',
  },
  fontConfig: {
    // We are loading 'SpaceMono' in app/_layout.tsx
    // NativeBase will pick up fonts loaded via useFonts if the names match.
    // Let's try to rely on system defaults more directly for heading/body initially
    // to isolate the issue, and ensure SpaceMono is correctly named if used.
  },
  fonts: {
    heading: undefined, // Let NativeBase/system decide for now
    body: undefined,    // Let NativeBase/system decide for now
    mono: 'SpaceMono', // You have SpaceMono, can be used for mono text
  },
  components: {
    Button: {
      baseStyle: {
        rounded: 'full',
        _text: {
          fontWeight: 'semibold',
          fontFamily: 'body', // Use body font for buttons
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
          bg: `${colorScheme}.500`,
          _pressed: { bg: `${colorScheme}.600` },
          _text: { color: colorScheme === 'primary' ? theme.colors.textPrimary : theme.colors.white }
        }),
        subtle: ({ colorScheme }: any) => ({
          bg: `${colorScheme}.100`,
          _text: { color: `${colorScheme}.700`},
          _pressed: { bg: `${colorScheme}.200` },
        }),
        outline: ({ colorScheme }: any) => ({
           borderColor: `${colorScheme}.500`,
           borderWidth: 2,
           _text: { color: `${colorScheme}.500`, fontWeight: 'bold' },
           _pressed: { bg: `${colorScheme}.50` },
        }),
        ghost: ({ colorScheme }: any) => ({
          _text: { color: `${colorScheme}.500` },
          _pressed: { bg: `${colorScheme}.100` },
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
          fontSize: '3xl',
          fontWeight: 'bold',
          fontFamily: 'heading',
          color: 'textPrimary',
          textAlign: 'center',
          lineHeight: 36,
        },
        subtitle: {
          fontSize: 'lg',
          color: 'textSecondary',
          textAlign: 'center',
          lineHeight: 28,
          fontFamily: 'body',
        },
        body: {
          fontSize: 'md',
          lineHeight: 24,
          color: 'textPrimary',
        },
        quote: {
          fontSize: '2xl',
          fontWeight: 'semibold',
          textAlign: 'center',
          color: 'quoteText',
          paddingX: 6,
          paddingY: 10,
          fontFamily: 'heading',
          lineHeight: 32,
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
        backgroundColor: 'backgroundFocused',
        paddingY: 3, // Adjusted padding for NativeBase Input
        paddingX: 4,
        fontFamily: 'body',
        fontSize: 'md',
        _focus: {
          borderColor: 'primary.500',
          backgroundColor: 'primary.50',
          _hover: {
            borderColor: 'primary.500',
          }
        },
      },
      defaultProps: {
        size: 'xl', // This affects height and font size slightly in NB
        variant: 'outline',
      }
    },
    IconButton: {
      baseStyle: {
        rounded: 'full',
      },
      defaultProps: {
        variant: 'ghost',
      }
    },
    Switch: {
      defaultProps: {
        colorScheme: 'primary',
      },
    },
    Radio: {
      defaultProps: {
        colorScheme: 'primary',
      },
      baseStyle: {
        _icon: {
          color: 'white',
        },
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