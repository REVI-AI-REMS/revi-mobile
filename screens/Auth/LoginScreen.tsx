import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import OverlayModal from "@/components/common/OverlayModal";
import Button from "@/components/ui/Button";
import { Fonts } from "@/constants/theme";
import { useLoginMutation } from "@/hooks/mutations/use-auth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login, isPending } = useLoginMutation();

  useFocusEffect(
    useCallback(() => {
      setVisible(true);
    }, []),
  );

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/auth");
    }, 200);
  };

  const handleBack = () => {
    setStep("email");
    setPassword("");
  };

  const handleContinue = () => {
    if (step === "email") {
      if (email.trim()) setStep("password");
      return;
    }
    if (!password.trim()) return;
    login(
      { email, password },
      {
        onError: (error: any) => {
          const d = error?.response?.data?.detail;
          const message =
            typeof d === "string"
              ? d
              : "Invalid email or password. Please try again.";
          Alert.alert("Login failed", message);
        },
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F10" }}>
      <OverlayModal
        visible={visible}
        onClose={handleClose}
        height="80%"
        onBackPress={step === "password" ? handleBack : undefined}
      >

        {/* Header */}
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
              : "Enter your password to continue"}
          </Text>
        </View>

        {/* Email input */}
        {step === "email" && (
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
        )}

        {/* Password input */}
        {step === "password" && (
          <>
            <View
              style={[
                styles.inputContainer,
                focusedInput === "password" && styles.inputFocused,
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
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={() => {
                setVisible(false);
                setTimeout(
                  () =>
                    router.push({
                      pathname: "/forgot-password",
                      params: { email: email || "" },
                    }),
                  100,
                );
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </>
        )}

        <Button
          title={step === "email" ? "Continue" : "Sign In"}
          variant="primary"
          onPress={handleContinue}
          loading={isPending && step === "password"}
          disabled={isPending}
          style={{ marginBottom: 24, borderRadius: 30 }}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <Button
            title="Continue with Apple"
            variant="outline"
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Apple Sign In will be available in a future update.",
              )
            }
            icon={<Ionicons name="logo-apple" size={20} color="#FFFFFF" />}
          />
          <Button
            title="Continue with Google"
            variant="outline"
            onPress={() =>
              Alert.alert(
                "Coming soon",
                "Google Sign In will be available in a future update.",
              )
            }
            icon={<Ionicons name="logo-google" size={18} color="#FFFFFF" />}
          />
        </View>

        <Button
          title="Sign Up"
          variant="secondary"
          onPress={() => {
            setVisible(false);
            setTimeout(() => router.push("/signup"), 200);
          }}
        />
      </OverlayModal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 28,
    paddingTop: 8,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 19,
    fontFamily: Fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "android" ? 8 : 16,
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
    color: "#E5E7EB",
    textAlignVertical: "center",
    paddingVertical: 0,
    height: Platform.OS === "android" ? 48 : undefined,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  forgotContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#999999",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
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
    marginBottom: 12,
  },
});
