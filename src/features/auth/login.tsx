import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import Button from "@/src/components/common/button";
import OverlayModal from "@/src/components/common/overlay-modal";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState<"email" | "password">("email");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setVisible(true);
    }, []),
  );

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => router.back(), 200);
  };

  const handleBack = () => {
    setStep("email");
    setPassword("");
  };

  const handleContinue = () => {
    if (step === "email") {
      if (email.trim()) {
        setStep("password");
      }
    } else {
      console.log("Login with:", email, password);
      // Implement login logic
      setVisible(false);
      setTimeout(() => router.push("/(tabs)/chat"), 100);
    }
  };

  const handleAppleSignIn = () => {
    console.log("Continue with Apple");
    // Implement Apple Sign-In logic
  };

  const handleGoogleSignIn = () => {
    console.log("Continue with Google");
    // Implement Google Sign-In logic
  };

  const handleSignUp = () => {
    console.log("Sign Up");
    // Navigate to sign up screen
  };

  const handleForgotPassword = () => {
    setVisible(false);
    setTimeout(() => {
      router.push({
        pathname: "/forgot-password",
        params: { email: email || "user@example.com" },
      });
    }, 100);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F10" }}>
      <OverlayModal visible={visible} onClose={handleClose}>
        {/* Back Button - only show on password step */}
        {step === "password" && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {Platform.OS === "ios" ? (
          <KeyboardAvoidingView
            behavior="padding"
            style={{ flex: 1 }}
            keyboardVerticalOffset={0}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <KeyboardAwareScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                enableAutomaticScroll={true}
                extraScrollHeight={0}
                keyboardOpeningTime={0}
                contentContainerStyle={{ paddingBottom: 50 }}
              >
                {/* Logo and Header */}
                <View style={styles.header}>
                  <View style={styles.logoContainer}>
                    <ReviaiLogo width={39} height={37} />
                  </View>
                  <Text style={styles.title}>
                    {step === "email"
                      ? "Welcome back to Revi"
                      : "Enter your password"}
                  </Text>
                  <Text style={styles.subtitle}>
                    {step === "email"
                      ? "Continue getting real answers about\nproperties, landlords, and rent."
                      : `Enter your password to continue`}
                  </Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                  {/* Email or Password Input */}
                  {step === "email" ? (
                    <View
                      style={[
                        styles.inputContainer,
                        focusedInput === "email" &&
                          styles.inputContainerFocused,
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
                        placeholder="Email"
                        placeholderTextColor="#999999"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.inputContainer,
                        focusedInput === "password" &&
                          styles.inputContainerFocused,
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
                        placeholder="Password"
                        placeholderTextColor="#999999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoComplete="password"
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                  )}

                  {/* Continue Button */}
                  <Button
                    title="Continue"
                    variant="primary"
                    onPress={handleContinue}
                    style={{ marginBottom: 24, borderRadius: 30 }}
                  />

                  {/* Forgot Password - only on password step */}
                  {step === "password" && (
                    <TouchableOpacity
                      style={styles.forgotPasswordContainer}
                      onPress={handleForgotPassword}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.forgotPasswordText}>
                        Forgot password?
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Divider */}
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Social Buttons */}
                  <View style={styles.socialButtons}>
                    <Button
                      title="Continue with Apple"
                      variant="outline"
                      onPress={handleAppleSignIn}
                      icon={
                        <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                      }
                    />

                    <Button
                      title="Continue with Google"
                      variant="outline"
                      onPress={handleGoogleSignIn}
                      icon={
                        <Ionicons
                          name="logo-google"
                          size={18}
                          color="#FFFFFF"
                        />
                      }
                    />
                  </View>

                  <Button
                    title="Sign Up"
                    variant="secondary"
                    onPress={handleSignUp}
                  />
                </View>
              </KeyboardAwareScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAwareScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              enableOnAndroid={true}
              enableAutomaticScroll={true}
              extraScrollHeight={100}
              keyboardOpeningTime={0}
              contentContainerStyle={{ paddingBottom: 50 }}
            >
              {/* Logo and Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <ReviaiLogo width={39} height={37} />
                </View>
                <Text style={styles.title}>
                  {step === "email"
                    ? "Welcome back to Revi"
                    : "Enter your password"}
                </Text>
                <Text style={styles.subtitle}>
                  {step === "email"
                    ? "Continue getting real answers about\nproperties, landlords, and rent."
                    : `Enter your password to continue`}
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                {/* Email Step */}
                {step === "email" && (
                  <View style={styles.inputGroup}>
                    <View
                      style={[
                        styles.inputContainer,
                        focusedInput === "email" &&
                          styles.inputContainerFocused,
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color="#666666"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Email address"
                        placeholderTextColor="#666666"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        underlineColorAndroid="transparent"
                      />
                    </View>
                    <Button
                      title="Continue"
                      variant="primary"
                      onPress={() => setStep("password")}
                      style={{ marginTop: 16, borderRadius: 30 }}
                    />
                  </View>
                )}

                {/* Password Step */}
                {step === "password" && (
                  <View style={styles.inputGroup}>
                    <View
                      style={[
                        styles.inputContainer,
                        focusedInput === "password" &&
                          styles.inputContainerFocused,
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#666666"
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#666666"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        underlineColorAndroid="transparent"
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                      >
                        <Ionicons
                          name={
                            showPassword ? "eye-outline" : "eye-off-outline"
                          }
                          size={20}
                          color="#666666"
                        />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.forgotPasswordContainer}
                      onPress={() => {
                        setVisible(false);
                        setTimeout(() => router.push("/forgot-password"), 200);
                      }}
                    >
                      <Text style={styles.forgotPasswordText}>
                        Forgot password?
                      </Text>
                    </TouchableOpacity>

                    <Button
                      title="Sign In"
                      variant="primary"
                      onPress={handleContinue}
                      style={{ marginTop: 16, borderRadius: 30 }}
                    />
                  </View>
                )}
              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialButtons}>
                <Button
                  title="Continue with Apple"
                  variant="outline"
                  onPress={handleAppleSignIn}
                  icon={
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  }
                />

                <Button
                  title="Continue with Google"
                  variant="outline"
                  onPress={handleGoogleSignIn}
                  icon={
                    <Ionicons name="logo-google" size={18} color="#FFFFFF" />
                  }
                />
              </View>

              <Button
                title="Sign Up"
                variant="secondary"
                onPress={handleSignUp}
              />
            </KeyboardAwareScrollView>
          </TouchableWithoutFeedback>
        )}
      </OverlayModal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: Platform.OS === "android" ? 32 : 40,
  },
  logoContainer: {
    marginBottom: Platform.OS === "android" ? 20 : 24,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "android" ? 70 : 87,
  },
  title: {
    fontSize: Platform.OS === "android" ? 18 : 19,
    fontFamily: Fonts.semiBold,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: Platform.OS === "android" ? 10 : 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Platform.OS === "android" ? 14 : 16,
    fontFamily: Fonts.regular,
    color: "#999999",
    fontWeight: "400",
    textAlign: "center",
    lineHeight: Platform.OS === "android" ? 18 : 20,
  },
  formSection: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingHorizontal: Platform.OS === "android" ? 14 : 16,
    paddingVertical: Platform.OS === "android" ? 8 : 16,
    marginBottom: Platform.OS === "android" ? 12 : 16,
    borderWidth: 1,
    borderColor: "#3A3A3C",
    height: Platform.OS === "android" ? 48 : "auto",
  },
  inputContainerFocused: {
    borderColor: "#FFFFFF",
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: Platform.OS === "android" ? 10 : 12,
  },
  input: {
    flex: 1,
    fontSize: Platform.OS === "android" ? 14 : 16,
    fontFamily: Fonts.regular,
    color: "#E5E7EB",
    includeFontPadding: false,
    textAlignVertical: Platform.OS === "android" ? "center" : "auto",
    paddingVertical: 0,
  },
  inputGroup: {
    width: "100%",
    marginBottom: Platform.OS === "android" ? 16 : 20,
  },
  forgotPasswordContainer: {
    alignItems: "center",
    marginBottom: Platform.OS === "android" ? 20 : 24,
  },
  forgotPasswordText: {
    fontSize: Platform.OS === "android" ? 13 : 14,
    fontFamily: Fonts.semiBold,
    fontWeight: "600",
    color: "#999999",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Platform.OS === "android" ? 24 : 24,
    paddingBottom: Platform.OS === "android" ? 30 : 30,
    paddingTop: Platform.OS === "android" ? 30 : 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#3A3A3C",
  },
  dividerText: {
    fontSize: Platform.OS === "android" ? 12 : 14,
    fontFamily: Fonts.regular,
    color: "#999999",
    marginHorizontal: Platform.OS === "android" ? 12 : 16,
  },
  socialButtons: {
    gap: Platform.OS === "android" ? 10 : 12,
    marginBottom: Platform.OS === "android" ? 20 : 24,
  },
  signUpContainer: {
    alignItems: "center",
  },
  signUpText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
