import { Platform, Dimensions } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isWeb = Platform.OS === 'web';

export const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Platform-specific spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  // Android typically needs slightly more padding
  containerPadding: isAndroid ? 20 : 16,
  headerHeight: isAndroid ? 56 : 44,
  inputPadding: isAndroid ? 14 : 12,
  buttonPadding: isAndroid ? 14 : 16,
};

// Platform-specific shadows
export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
};

// Platform-specific text styles
export const platformTextStyles = {
  android: {
    includeFontPadding: false,
    textAlignVertical: 'center' as const,
  },
  ios: {},
  web: {},
};

// Get status bar height
export const getStatusBarHeight = () => {
  if (Platform.OS === 'android') {
    return 25; // Approximate height for Android
  }
  return 0; // iOS handles this automatically with SafeAreaView
};

// Platform-specific keyboard behavior
export const keyboardBehavior = Platform.select({
  ios: 'padding' as const,
  android: 'height' as const,
  default: 'height' as const,
});