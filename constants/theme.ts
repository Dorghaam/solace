import { extendTheme } from 'native-base';

export const solaceTheme = extendTheme({
  colors: {
    primary: {
      50: '#EBF1FF',
      100: '#CEDFFF',
      200: '#ADCFFE',
      300: '#8AC0FE',
      400: '#67B0FD',
      500: '#44A1FC',
      600: '#3A88DE',
      700: '#3070BF',
      800: '#2658A0',
      900: '#1C4081',
    },
    backgroundLight: '#FEF7F5',
    backgroundFocused: '#FFFFFF',
    textPrimary: '#333333',
    textSecondary: '#757575',
    textTertiary: '#BDBDBD',
    accentWarm: '#FFDAB9',
    accentCool: '#B2EBF2',
    greyButton: '#F0F0F0',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    quoteBackground: '#FFFFFF',
    quoteText: '#3D3D3D',
    onboardingButtonText: '#FFFFFF',
  },
  fontConfig: {
    SystemDefault: { // Using SystemDefault as a placeholder name
      300: { normal: 'System' }, // Maps to system default light
      400: { normal: 'System' }, // Maps to system default regular
      500: { normal: 'System' }, // Maps to system default medium (approx)
      600: { normal: 'System' }, // Maps to system default semibold (approx)
      700: { normal: 'System' }, // Maps to system default bold
    },
    // TODO: Add actual custom font configurations here later
    // SpaceMono: { // Example if you were to use SpaceMono from your assets
    //   400: { normal: 'SpaceMono-Regular' },
    // },
  },
  fonts: {
    heading: 'SystemDefault', // Placeholder, will be updated
    body: 'SystemDefault',    // Placeholder, will be updated
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
        solid: ({ colorScheme }: any) => ({
          bg: `${colorScheme}.500`,
          _pressed: { bg: `${colorScheme}.600` },
          _text: { color: colorScheme === 'primary' ? 'onboardingButtonText' : 'textPrimary' }
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
          lineHeight: '36px', // Example explicit line height
        },
        subtitle: {
          fontSize: 'lg',
          color: 'textSecondary',
          textAlign: 'center',
          lineHeight: '28px',
          fontFamily: 'body',
        },
        body: {
          fontSize: 'md',
          lineHeight: '24px',
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
          lineHeight: '32px',
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
    }
  },
  config: {
    initialColorMode: 'light',
  },
});

type CustomThemeType = typeof solaceTheme;
declare module 'native-base' {
  interface ICustomTheme extends CustomThemeType {}
} 