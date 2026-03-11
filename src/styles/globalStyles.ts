import { StyleSheet, Platform } from "react-native";
import { Fonts } from "@/src/constants/theme";

export const globalStyles = StyleSheet.create({
  text: {
    fontFamily: Fonts.regular,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  textMedium: {
    fontFamily: Fonts.medium,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  textSemiBold: {
    fontFamily: Fonts.semiBold,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  textBold: {
    fontFamily: Fonts.bold,
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  // Platform-specific container styles
  container: {
    flex: 1,
    ...Platform.select({
      android: {
        paddingTop: 0, // StatusBar padding handled by SafeAreaProvider
      },
    }),
  },
  // Safe area handling
  safeContainer: {
    flex: 1,
    ...Platform.select({
      android: {
        paddingTop: Platform.OS === 'android' ? 25 : 0, // Account for status bar
      },
    }),
  },
});
