import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Fonts } from "@/src/constants/theme";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  onPress,
  title,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    variant === "primary" && styles.primaryButton,
    variant === "secondary" && styles.secondaryButton,
    variant === "outline" && styles.outlineButton,
    variant === "ghost" && styles.ghostButton,
    disabled && styles.disabledButton,
    style,
  ];

  const textStyleCombined = [
    styles.buttonText,
    variant === "primary" && styles.primaryText,
    variant === "secondary" && styles.secondaryText,
    variant === "outline" && styles.outlineText,
    variant === "ghost" && styles.ghostText,
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#000000" : "#FFFFFF"}
        />
      ) : (
        <>
          {icon}
          <Text
            style={textStyleCombined}
            {...(Platform.OS === 'android' && {
              includeFontPadding: false,
              textAlignVertical: 'center' as const,
            })}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Platform.OS === 'android' ? 14 : 16,
    paddingHorizontal: Platform.OS === 'android' ? 20 : 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: Platform.OS === 'android' ? 48 : 44,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 4 : 0,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
  // Primary (white background)
  primaryButton: {
    backgroundColor: "#FFFFFF",
  },
  primaryText: {
    color: "#000000",
  },
  // Secondary (dark with border)
  secondaryButton: {
    backgroundColor: "#2C2C2E",
    borderWidth: 1,
    borderColor: "transparent",
  },
  secondaryText: {
    color: "#FFFFFF",
  },
  // Outline (transparent with border)
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  outlineText: {
    color: "#FFFFFF",
  },
  // Ghost (transparent no border)
  ghostButton: {
    backgroundColor: "transparent",
  },
  ghostText: {
    color: "#FFFFFF",
  },
  // Disabled
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.5,
  },
});
