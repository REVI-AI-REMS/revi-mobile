import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { Fonts } from "@/src/constants/theme";

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
          <Text style={textStyleCombined}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
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
