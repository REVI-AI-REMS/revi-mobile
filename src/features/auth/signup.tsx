import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import Button from "@/src/components/common/button";
import OverlayModal from "@/src/components/common/overlay-modal";
import { Fonts } from "@/src/constants/theme";
import {
  useLoginMutation,
  useRegisterMutation,
} from "@/src/hooks/mutations/use-auth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Step = "details" | "success";

export default function SignUpScreen() {
  const router = useRouter();

  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState<Step>("details");

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { mutate: register, isPending: isRegistering } = useRegisterMutation();
  const { mutate: login, isPending: isLoggingIn } = useLoginMutation();
  const isPending = isRegistering || isLoggingIn;

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => router.back(), 200);
  };

  const handleBack = () => {
    if (step === "details") {
      setVisible(false);
      setTimeout(() => router.back(), 200);
    }
    // no back from success
  };

  const handleContinue = () => {
    if (step !== "details") return;

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    register(
      {
        email: email.trim(),
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        type: "user",
      },
      {
        onSuccess: () => {
          // Auto-login after registration (backend doesn't return tokens on register)
          login(
            { email: email.trim(), password },
            {
              onSuccess: () => setStep("success"),
              onError: (err: any) => {
                const msg =
                  err?.response?.data?.detail ??
                  "Account created but auto-login failed. Please log in manually.";
                Alert.alert("Login error", msg);
                setVisible(false);
                setTimeout(() => router.replace("/login"), 200);
              },
            },
          );
        },
        onError: (err: any) => {
          const detail = err?.response?.data;
          const msg =
            typeof detail === "string"
              ? detail
              : (detail?.detail ??
                detail?.email?.[0] ??
                detail?.username?.[0] ??
                "Registration failed. Please try again.");
          Alert.alert("Sign up failed", msg);
        },
      },
    );
  };

  const getTitle = () =>
    step === "details" ? "Create your account" : "Account created!";

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F10" }}>
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
        height={Platform.OS === "ios" ? "82%" : "87%"}
        // height={Platform.OS === "ios" ? "80%" : "auto"}
      >
        {/* Back Button */}
        {step === "details" && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            step === "success"
              ? { flexGrow: 1, justifyContent: "center" }
              : {
                  flexGrow: 1,
                  paddingBottom: Platform.OS === "android" ? 50 : 20,
                }
          }
          scrollEnabled={step !== "success"}
          bounces={false}
        >
          {/* Logo and Header */}
          {step === "details" && (
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <ReviaiLogo width={39} height={37} />
              </View>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>
                Enter your details to get started
              </Text>
            </View>
          )}

          {/* ── Details Step ─────────────────────────────────────────── */}
          {step === "details" && (
            <View style={styles.formSection}>
              {/* First Name */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#999999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#999999"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  textAlignVertical="center"
                />
              </View>

              {/* Last Name */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#999999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="#999999"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  textAlignVertical="center"
                />
              </View>

              {/* Username */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="at-outline"
                  size={20}
                  color="#999999"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#999999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  textAlignVertical="center"
                />
              </View>

              {/* Email */}
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
                  textAlignVertical="center"
                />
              </View>

              {/* Password */}
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

              {/* Confirm Password */}
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
                loading={isPending}
                disabled={isPending}
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
                onPress={() => console.log("Apple Sign Up")}
                icon={<Ionicons name="logo-apple" size={20} color="#ffffff" />}
                style={{ marginBottom: 12 }}
              />

              <Button
                title="Continue with Google"
                variant="outline"
                onPress={() => console.log("Google Sign Up")}
                icon={<Ionicons name="logo-google" size={18} color="#FFF" />}
              />

              {/* Already have an account */}
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
            </View>
          )}

          {/* ── Success Step ─────────────────────────────────────────── */}
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
                  setTimeout(() => router.replace("/(tabs)/social"), 100);
                }}
                style={{ marginTop: 24, borderRadius: 30, width: 300 }}
              />
            </View>
          )}
        </ScrollView>
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
    zIndex: 0,
    backgroundColor: "#0F0F10",
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
    width: 35,
    height: 35,
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
    paddingTop: Platform.OS === "android" ? 20 : 15,
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
