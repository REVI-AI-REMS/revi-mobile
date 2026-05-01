import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import OverlayModal from "@/components/common/OverlayModal";
import Button from "@/components/ui/Button";
import { Fonts } from "@/constants/theme";
import {
  useConfirmPasswordResetMutation,
  useRequestPasswordResetMutation,
  useVerifyPasswordResetOtpMutation,
} from "@/hooks/mutations/use-auth";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type Step = "confirm" | "code" | "newPassword" | "success";

const errMsg = (err: any, fallback: string): string => {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return d[0].msg;
  return err?.message ?? fallback;
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userEmail = (params.email as string) || "";

  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState<Step>("confirm");
  const [email, setEmail] = useState(userEmail);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    // keyboardWillShow only fires on iOS; Android needs keyboardDidShow
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0),
    );
    return () => { show.remove(); hide.remove(); };
  }, []);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const { mutate: requestReset, isPending: isRequesting } = useRequestPasswordResetMutation();
  const { mutate: verifyOtp, isPending: isVerifying } =
    useVerifyPasswordResetOtpMutation();
  const { mutate: confirmReset, isPending: isConfirming } =
    useConfirmPasswordResetMutation();

  const goBack = () => {
    setVisible(false);
    setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/login");
    }, 200);
  };

  const handleBack = () => {
    if (step === "confirm") {
      goBack();
    } else if (step === "code") {
      setStep("confirm");
      setOtp("");
    } else if (step === "newPassword") {
      setStep("code");
      setNewPassword("");
      setConfirmPassword("");
    }
    // no back from success
  };

  const handleContinue = () => {
    if (step === "confirm") {
      if (!email.trim()) {
        Alert.alert("Email required", "Please enter your email address.");
        return;
      }
      requestReset(email.trim().toLowerCase(), {
        onSuccess: () => setStep("code"),
        onError: (err: any) => {
          Alert.alert("Error", errMsg(err, "Could not send reset code. Please try again."));
        },
      });
    } else if (step === "code") {
      if (otp.trim().length < 6) return;
      verifyOtp(
        { email: email.trim().toLowerCase(), otp },
        {
          onSuccess: () => setStep("newPassword"),
          onError: (err: any) => {
            Alert.alert("Invalid code", errMsg(err, "Invalid or expired code."));
            setOtp("");
          },
        },
      );
    } else if (step === "newPassword") {
      if (newPassword !== confirmPassword) {
        Alert.alert("Password mismatch", "Passwords do not match.");
        return;
      }
      confirmReset(
        { email: email.trim().toLowerCase(), otp, new_password: newPassword },
        {
          onSuccess: () => setStep("success"),
          onError: (err: any) => {
            Alert.alert("Error", errMsg(err, "Failed to reset password."));
          },
        },
      );
    }
  };

  const isLoading = isRequesting || isVerifying || isConfirming;

  const isButtonEnabled = () => {
    if (step === "confirm") return email.trim().length > 0 && !isLoading;
    if (step === "code") return otp.length === 6 && !isLoading;
    if (step === "newPassword")
      return (
        newPassword.length >= 8 && newPassword === confirmPassword && !isLoading
      );
    return true;
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
        return "Enter the email address linked to your account.";
      case "code":
        return `Enter the 6-digit code sent to\n${email}`;
      case "newPassword":
        return "Choose a strong password to keep\nyour Revi account secure.";
      case "success":
        return "Your password has been successfully updated.\nYou can now log in with your new password.";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F10" }}>
      <View style={styles.backgroundTextContainer} pointerEvents="none">
        <Text style={styles.backgroundText}>REVI AI</Text>
        <Text style={styles.backgroundSubtext}>
          real answers for real estate decisions.
        </Text>
      </View>

      <OverlayModal
        visible={visible}
        onClose={goBack}
        height="auto"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{
              paddingBottom: Platform.OS === "ios" ? 34 : 50,
            }}
            bounces={false}
          >
            {step !== "success" && (
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <ReviaiLogo width={39} height={37} />
                </View>
                <Text style={styles.title}>{getTitle()}</Text>
                <Text style={styles.subtitle}>{getSubtitle()}</Text>
              </View>
            )}

            <View style={styles.formSection}>
              {step === "confirm" && (
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "email" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#999999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#999999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={!email}
                    onFocus={() => setFocusedInput("email")}
                    onBlur={() => setFocusedInput(null)}
                    underlineColorAndroid="transparent"
                  />
                </View>
              )}

              {step === "code" && (
                <View
                  style={[
                    styles.inputContainer,
                    focusedInput === "code" && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name="keypad-outline"
                    size={20}
                    color="#999999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    placeholderTextColor="#999999"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                    onFocus={() => setFocusedInput("code")}
                    onBlur={() => setFocusedInput(null)}
                    underlineColorAndroid="transparent"
                  />
                </View>
              )}

              {step === "newPassword" && (
                <>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === "new" && styles.inputFocused,
                    ]}
                  >
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
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput("new")}
                      onBlur={() => setFocusedInput(null)}
                      underlineColorAndroid="transparent"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showNewPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#999999"
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={[
                      styles.inputContainer,
                      focusedInput === "confirm" && styles.inputFocused,
                    ]}
                  >
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
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput("confirm")}
                      onBlur={() => setFocusedInput(null)}
                      underlineColorAndroid="transparent"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off" : "eye"}
                        size={20}
                        color="#999999"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.requirements}>
                    <Text style={styles.requirementText}>
                      • At least 8 characters
                    </Text>
                    <Text style={styles.requirementText}>
                      • Mix of letters and numbers
                    </Text>
                  </View>
                </>
              )}

              {step === "success" && (
                <View style={styles.successSection}>
                  <Ionicons
                    name="checkmark-circle"
                    size={64}
                    color="#ffffff"
                    style={{ marginBottom: 16 }}
                  />
                  <Text style={styles.successTitle}>Password updated</Text>
                  <Text style={styles.successMessage}>
                    Your password has been changed{"\n"}successfully.
                  </Text>
                  <Button
                    title="Back to Login"
                    variant="primary"
                    onPress={() => {
                      setVisible(false);
                      setTimeout(() => router.replace("/login"), 200);
                    }}
                    style={{ marginTop: 24, borderRadius: 30 }}
                  />
                </View>
              )}

              {step !== "success" && (
                <Button
                  title={
                    step === "confirm"
                      ? "Continue"
                      : step === "code"
                        ? "Verify Code"
                        : "Reset Password"
                  }
                  variant="primary"
                  onPress={handleContinue}
                  loading={isLoading}
                  disabled={!isButtonEnabled()}
                  style={{ marginTop: 16, borderRadius: 30 }}
                />
              )}

              {step === "code" && (
                <TouchableOpacity
                  style={styles.resendContainer}
                  onPress={() => {
                    requestReset(email.trim().toLowerCase(), {
                      onError: (err: any) => {
                        const message =
                          err?.response?.data?.detail ??
                          "Could not resend code.";
                        Alert.alert("Error", message);
                      },
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendText}>Resend code</Text>
                </TouchableOpacity>
              )}

              {/* Spacer: grows the BottomSheetView when keyboard is open so the
                  sheet auto-expands above the keyboard. Collapses when keyboard
                  closes so the sheet shrinks back to content height. */}
              {(step === "code" || step === "newPassword") && (
                <View style={{ height: Math.max(0, keyboardHeight - 120) }} />
              )}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </OverlayModal>
    </View>
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
  },
  backgroundText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#ffffff",
    opacity: 0.25,
    letterSpacing: 6,
    marginBottom: 8,
  },
  backgroundSubtext: {
    fontSize: 16,
    fontWeight: "400",
    color: "#A6A6A6",
    letterSpacing: 1,
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
    paddingTop: 20,
    marginBottom: 8,
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
    paddingBottom: 16,
  },
  formSection: {
    flex: 1,
  },
  confirmText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "android" ? 5 : 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3A3A3C",
    height: Platform.OS === "android" ? 48 : undefined,
  },
  inputFocused: {
    borderColor: "#FFFFFF",
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    textAlignVertical: "center",
    paddingVertical: 0,
    height: Platform.OS === "android" ? 48 : undefined,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  requirements: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  requirementText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#999999",
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
  successSection: {
    alignItems: "center",
    paddingVertical: 16,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 8,
  },
});
