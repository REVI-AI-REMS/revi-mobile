import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import Button from "@/src/components/common/button";
import OverlayModal from "@/src/components/common/overlay-modal";
import TermsModal from "@/src/components/common/terms-modal";
import { Fonts } from "@/src/constants/theme";
import { useAuthStore } from "@/src/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Step = "details" | "code" | "success";

export default function SignUpScreen() {
  const router = useRouter();

  const hasAcceptedTerms = useAuthStore((s) => s.hasAcceptedTerms);
  const acceptTerms = useAuthStore((s) => s.acceptTerms);
  const [visible, setVisible] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener("keyboardWillHide", () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Resend countdown
  useEffect(() => {
    if (step !== "code") return;
    setResendTimer(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const handleDigitChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setCode(next.join(""));
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      const full = next.join("");
      setCode(full);
      if (full.length === 6) handleContinue();
    }
  };

  const handleDigitKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => router.back(), 200);
  };

  const handleBack = () => {
    if (step === "details") {
      setVisible(false);
      setTimeout(() => router.back(), 200);
    } else if (step === "code") {
      setStep("details");
      setCode("");
    } else if (step === "success") {
      // Don't allow back from success screen
      return;
    }
  };

  const handleContinue = () => {
    if (step === "details") {
      if (password === confirmPassword && email.trim() && password.trim()) {
        setDigits(["", "", "", "", "", ""]);
        setCode("");
        setStep("code");
      }
    } else if (step === "code") {
      const fullCode = digits.join("");
      if (fullCode.length === 6) {
        setStep("success");
      }
    }
  };

  const handleResendCode = () => {
    // Implement resend logic
  };

  const getTitle = () => {
    switch (step) {
      case "details":
        return "Create your account";
      case "code":
        return "Verify your email";
      case "success":
        return "Account created!";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case "details":
        return "Enter your details to get started";
      case "code":
        return `Enter the verification code we just \n sent to ${email}`;
      case "success":
        return "";
    }
  };

  return (
    <>
      {/* Terms & Conditions — shown before sign-up form */}
      <TermsModal
        visible={!hasAcceptedTerms}
        onAccept={acceptTerms}
        onDecline={() => {
          setVisible(false);
          setTimeout(() => router.back(), 200);
        }}
      />

      {/* Background branding text */}
      <View style={styles.backgroundTextContainer}>
        <Text style={styles.backgroundText}>REVI AI</Text>
        <Text style={styles.backgroundSubtext}>
          real answers for real estate decisions.
        </Text>
      </View>

      <OverlayModal
        visible={hasAcceptedTerms && visible}
        onClose={handleClose}
        avoidKeyboard={false}
        height={
          step === "success" || (step === "code" && keyboardHeight === 0)
            ? "auto"
            : keyboardHeight > 0
            ? Math.round(SCREEN_HEIGHT - keyboardHeight + 80)
            : Math.round(SCREEN_HEIGHT * (Platform.OS === "ios" ? 0.8 : 0.9))
        }
      >
        {/* Back Button - Fixed at top left, outside scroll */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={
            step === "code"
              ? { flexGrow: 1, justifyContent: "center", paddingBottom: 50 }
              : { paddingBottom: 50 }
          }
          bounces={false}
        >
          {/* Logo and Header */}
          <View
            style={[
              styles.header,
              step === "success" && { paddingTop: 0, marginBottom: 0 },
              step === "code" && { paddingTop: 12 },
            ]}
          >
            {step === "details" && (
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
            {/* Details Step - Email and passwords */}
            {step === "details" && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color="#999999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#999999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus
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
                    placeholder="Password"
                    placeholderTextColor="#999999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
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
                    textAlignVertical="center"
                  />
                </View>

                {/* Sign Up Button */}
                <Button
                  title="Sign Up"
                  variant="primary"
                  onPress={handleContinue}
                  style={{ marginTop: 16, borderRadius: 30 }}
                />

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.divider} />
                </View>

                {/* Social Login Buttons */}
                <Button
                  title="Continue with Apple"
                  variant="outline"
                  onPress={() => {}}
                  icon={
                    <Ionicons name="logo-apple" size={20} color="#ffffff" />
                  }
                  style={{ marginBottom: 12 }}
                />

                <Button
                  title="Continue with Google"
                  variant="outline"
                  onPress={() => {}}
                  icon={<Ionicons name="logo-google" size={18} color="#FFF" />}
                />
              </>
            )}

            {/* Code Input Step */}
            {step === "code" && (
              <View style={styles.otpRow}>
                {digits.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { inputRefs.current[i] = r; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(v) => handleDigitChange(v, i)}
                    onKeyPress={(e) => handleDigitKeyPress(e, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    autoFocus={i === 0}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>
            )}

            {/* Success Step - Show success message */}
            {step === "success" && (
              <View style={styles.successSection}>
                <Ionicons
                  name="checkmark-circle"
                  size={64}
                  color="#ffffff"
                  style={styles.successIcon}
                />
                <Text style={styles.successTitle}>Welcome to REVI!</Text>
                <Text style={styles.successMessage}>
                  Your account has been created {"\n"} successfully.
                </Text>
                <Button
                  title="Get Started"
                  variant="primary"
                  onPress={() => {
                    setVisible(false);
                    setTimeout(() => router.push("/login"), 100);
                  }}
                  style={{ marginTop: 24, borderRadius: 30, width: 300 }}
                />
              </View>
            )}

            {/* Continue Button - only on code step */}
            {step === "code" && (
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
                onPress={canResend ? handleResendCode : undefined}
                activeOpacity={canResend ? 0.7 : 1}
              >
                <Text style={[styles.resendText, !canResend && styles.resendTextDisabled]}>
                  {canResend ? "Resend code" : `Resend in ${resendTimer}s`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Already have account - only on details step */}
            {step === "details" && (
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setVisible(false);
                    setTimeout(() => router.push("/login"), 200);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </OverlayModal>
    </>
  );
}

const styles = StyleSheet.create({
  backgroundTextContainer: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 0,
  },
  backgroundText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#ffffff",
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
    paddingBottom: 20,
  },
  formSection: {
    flex: 1,
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
    marginTop: 16,
    textAlign: "center",
  },
  successIcon: {
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 8,
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
  resendTextDisabled: {
    color: "#666666",
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#3A3A3C",
    backgroundColor: "transparent",
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
  otpBoxFilled: {
    borderColor: "#FFFFFF",
  },
  loginPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  loginPromptText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999999",
  },
  loginLink: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#3A3A3C",
  },
  dividerText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999999",
    marginHorizontal: 16,
  },
});
