import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import Button from "@/src/components/common/button";
import OverlayModal from "@/src/components/common/overlay-modal";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Step = "confirm" | "code" | "newPassword" | "success";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userEmail = (params.email as string) || "user@example.com";

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("confirm");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHide = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/login");
      }
    }, 200);
  };

  const handleBack = () => {
    if (step === "confirm") {
      // Go back to login
      setVisible(false);
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/login");
        }
      }, 200);
    } else if (step === "code") {
      setStep("confirm");
      setCode("");
    } else if (step === "newPassword") {
      setStep("code");
      setNewPassword("");
      setConfirmPassword("");
    } else if (step === "success") {
      // Don't allow back from success screen
      return;
    }
  };

  const handleContinue = () => {
    if (step === "confirm") {
      console.log("Sending reset code to:", userEmail);
      setStep("code");
    } else if (step === "code") {
      if (code.trim()) {
        console.log("Verifying code:", code);
        setStep("newPassword");
      }
    } else if (step === "newPassword") {
      if (newPassword === confirmPassword) {
        console.log("Password reset successful");
        setStep("success");
      } else {
        console.log("Passwords don't match");
      }
    }
  };

  const handleResendCode = () => {
    console.log("Resending code to:", userEmail);
    // Implement resend logic
  };

  const getTitle = () => {
    switch (step) {
      case "confirm":
        return "Reset your password";
      case "code":
        return "Enter verification code";
      case "newPassword":
        return "Create new password";
      case "success":
        return "Password updated!";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case "confirm":
        return `We'll send a verification code to\n${userEmail}`;
      case "code":
        return `Enter the verification code we just \n sent to${userEmail}`;
      case "newPassword":
        return "Choose a strong password to keep \nyour Revi account secure.";
      case "success":
        return "Your password has been successfully updated.\nYou can now log in with your new password.";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F10" }}>
      {/* Background branding text */}
      <View style={styles.backgroundTextContainer} pointerEvents="none">
        <Text style={styles.backgroundText}>REVI AI</Text>
        <Text style={styles.backgroundSubtext}>
          real answers for real estate decisions.
        </Text>
      </View>

      <OverlayModal
        visible={visible}
        onClose={handleClose}
        height={Platform.OS === "ios" ? "80%" : "90%"}
      >
        {/* Back Button - Fixed at top left, outside scroll */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior="padding"
          style={{ flexShrink: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 100}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              step === "success"
                ? { flexGrow: 1, justifyContent: "center" }
                : { flexGrow: 1, paddingBottom: Platform.OS === "android" ? 50 : 20 }
            }
            scrollEnabled={step !== "success"}
            bounces={false}
          >
            {/* Logo and Header */}
            <View
              style={[
                styles.header,
                step === "success" && { paddingTop: 0, marginBottom: 0 },
              ]}
            >
              {step !== "success" && (
                <View style={styles.logoContainer}>
                  <ReviaiLogo width={39} height={37} />
                </View>
              )}
              {step !== "success" && (
                <Text style={styles.title}>{getTitle()}</Text>
              )}
              {step !== "success" && (
                <Text style={styles.subtitle}>{getSubtitle()}</Text>
              )}
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Confirm Step - No input, just text */}
              {step === "confirm" && (
                <View style={styles.confirmSection}>
                  <Text style={styles.confirmText}>
                    Click continue to reset your password
                  </Text>
                </View>
              )}

              {/* Code Input Step */}
              {step === "code" && (
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="keypad-outline"
                    size={20}
                    color="#999999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#999999"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    includeFontPadding={false}
                    textAlignVertical="center"
                  />
                </View>
              )}

              {/* New Password Step */}
              {step === "newPassword" && (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#999999"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="New password"
                      placeholderTextColor="#999999"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      includeFontPadding={false}
                      textAlignVertical="center"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#999999"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      placeholderTextColor="#999999"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      includeFontPadding={false}
                      textAlignVertical="center"
                    />
                  </View>
                  <View style={styles.passwordRequirements}>
                    <Text style={styles.passwordRequirement}>
                      Password must be at least 8 characters long
                    </Text>
                    <Text style={styles.passwordRequirement}>
                      Password must contain combination of letters and numbers
                    </Text>
                  </View>
                </>
              )}

              {/* Success Step - Show success message */}
              {step === "success" && (
                <View style={styles.successSection}>
                  <Ionicons
                    name="checkmark-circle"
                    size={44}
                    color="#ffffff"
                    style={styles.successIcon}
                  />
                  <View
                    style={{
                      alignItems: "center",
                      paddingBottom: 16,
                      paddingTop: 16,
                    }}
                  >
                    <Text style={styles.successTitle}>Password updated</Text>
                    <Text style={styles.successMessage}>
                      Your password has been changed {"\n"} successfully.
                    </Text>
                  </View>

                  <Button
                    title="Back to Login"
                    variant="primary"
                    onPress={() => {
                      setVisible(false);
                      setTimeout(() => router.push("/login"), 200);
                    }}
                    style={{ marginBottom: 16, borderRadius: 30, width: 300 }}
                  />
                </View>
              )}

              {/* Continue Button */}
              {step !== "success" && (
                <Button
                  title="Continue"
                  variant="primary"
                  onPress={handleContinue}
                  style={{ marginTop: 16, borderRadius: 30 }}
                />
              )}

              {/* Resend Code - only on code step */}
              {step === "code" && (
                <TouchableOpacity
                  style={styles.resendContainer}
                  onPress={handleResendCode}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </OverlayModal>
    </View >
  );
}

const styles = StyleSheet.create({
  backgroundTextContainer: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "transparent",
  },
  backgroundText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#ffffff",
    opacity: 0.25,
    letterSpacing: 6,
    marginBottom: 8,
    zIndex: 1,
  },
  backgroundSubtext: {
    fontSize: 16,
    fontWeight: "400",
    color: "#A6A6A6",
    letterSpacing: 1,
  },
  passwordRequirements: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
  },
  passwordRequirement: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#999999",
    marginBottom: 4,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 27,
  },
  logoContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 20,
  },
  formSection: {
    flex: 1,
  },
  confirmSection: {
    marginBottom: 24,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 24,
  },
  successSection: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  successTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    // marginBottom: 16,
    textAlign: "center",
  },
  successIcon: {
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 24,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "android" ? 5 : 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3A3A3C",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  resendText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
});


