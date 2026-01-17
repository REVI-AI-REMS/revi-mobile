import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Fonts } from "@/src/constants/theme";
import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import Button from "@/src/components/common/button";
import OverlayModal from "@/src/components/common/overlay-modal";

type Step = "details" | "code" | "success";

export default function SignUpScreen() {
  const router = useRouter();

  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState<Step>("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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
        console.log("Creating account for:", email);
        setStep("code");
      } else {
        console.log("Passwords don't match or fields empty");
      }
    } else if (step === "code") {
      if (code.trim()) {
        console.log("Verifying code:", code);
        setStep("success");
      }
    }
  };

  const handleResendCode = () => {
    console.log("Resending verification code to:", email);
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

  const getModalHeight = () => {
    if (step === "success") {
      return 450;
    }
    if (step === "details") {
      return isKeyboardVisible ? 830 : 800;
    }
    // Code step
    return isKeyboardVisible ? 770 : 550;
  };

  return (
    <>
      {/* Background branding text */}
      <View style={styles.backgroundTextContainer}>
        <Text style={styles.backgroundText}>REVI AI</Text>
        <Text style={styles.backgroundSubtext}>
          real answers for real estate decisions.
        </Text>
      </View>

      <OverlayModal
        visible={visible}
        onClose={handleClose}
        height={getModalHeight()}
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                step === "success"
                  ? { flexGrow: 1, justifyContent: "center" }
                  : { paddingBottom: 50 }
              }
              scrollEnabled={step !== "success"}
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
                      variant="primary"
                      onPress={() => console.log("Apple Sign Up")}
                      icon={<Ionicons name="logo-apple" size={20} color="#000" />}
                      style={{ marginBottom: 12 }}
                    />

                    <Button
                      title="Continue with Google"
                      variant="secondary"
                      onPress={() => console.log("Google Sign Up")}
                      icon={<Ionicons name="logo-google" size={18} color="#FFF" />}
                    />
                  </>
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
                    />
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
                        setTimeout(() => router.push("/(tabs)"), 100);
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
                    onPress={handleResendCode}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resendText}>Resend code</Text>
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
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
  passwordRequirements: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
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
    paddingTop: 87,
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
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
