import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import Button from "@/src/components/common/button";
import OverlayModal from "@/src/components/common/overlay-modal";
import { Fonts } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState<"email" | "password">("email");

  useFocusEffect(
    useCallback(() => {
      setVisible(true);
    }, [])
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

        {/* Logo and Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <ReviaiLogo width={39} height={37} />
          </View>
          <Text style={styles.title}>
            {step === "email" ? "Welcome back to Revi" : "Enter your password"}
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
                autoComplete="email"
              />
            </View>
          ) : (
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
                autoComplete="password"
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
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
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
              icon={<Ionicons name="logo-apple" size={20} color="#FFFFFF" />}
            />

            <Button
              title="Continue with Google"
              variant="outline"
              onPress={handleGoogleSignIn}
              icon={<Ionicons name="logo-google" size={18} color="#FFFFFF" />}
            />
          </View>

          <Button title="Sign Up" variant="secondary" onPress={handleSignUp} />
        </View>
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
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 87,
  },
  title: {
    fontSize: 19,
    fontFamily: Fonts.semiBold,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#999999",
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
  },
  formSection: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
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
    color: "#E5E7EB",
  },
  forgotPasswordContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    fontWeight: "600",
    color: "#999999",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 30,
    paddingTop: 30,
  },
  dividerLine: {
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
  socialButtons: {
    gap: 12,
    marginBottom: 24,
  },
  signUpContainer: {
    alignItems: "center",
  },
  signUpText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
  },
});
