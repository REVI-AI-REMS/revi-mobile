import { StyleSheet } from "react-native";
import { Fonts } from "@/src/constants/theme";

export const globalStyles = StyleSheet.create({
  text: {
    fontFamily: Fonts.regular,
  },
  textMedium: {
    fontFamily: Fonts.medium,
  },
  textSemiBold: {
    fontFamily: Fonts.semiBold,
  },
  textBold: {
    fontFamily: Fonts.bold,
  },
});
