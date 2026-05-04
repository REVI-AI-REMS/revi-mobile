import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import OverlayModal from "@/components/common/OverlayModal";
import TermsModal from "@/components/common/TermsModal";
import Button from "@/components/ui/Button";
import { Fonts } from "@/constants/theme";
import {
  useConfirmEmailVerificationMutation,
  useLoginMutation,
  useRegisterMutation,
  useRequestEmailVerificationMutation,
} from "@/hooks/mutations/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Step = "details" | "code" | "success";

const errMsg = (err: any, fallback: string): string => {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return d[0].msg;
  return err?.message ?? fallback;
};

export default function SignUpScreen() {
  const router = useRouter();

  const hasAcceptedTerms = useAuthStore((s) => s.hasAcceptedTerms);
  const acceptTerms = useAuthStore((s) => s.acceptTerms);
  const [visible, setVisible] = useState(true);

  const [step, setStep] = useState<Step>("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setVisible(true);
    }, []),
  );

  const { mutate: register, isPending: isRegistering } = useRegisterMutation();
  const { mutate: confirmVerification, isPending: isVerifying } =
    useConfirmEmailVerificationMutation();
  const { mutate: requestVerification, isPending: isResending } =
    useRequestEmailVerificationMutation();
  const { mutate: login } = useLoginMutation();

  // Resend countdown
  useEffect(() => {
    if (step !== "code") return;
    setResendTimer(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
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
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d !== "")) submitOtp(next.join(""));
  };

  const handleDigitKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = (otp: string) => {
    confirmVerification(
      { email, otp },
      {
        onSuccess: () => {
          login(
            { email, password },
            {
              onSuccess: () => setStep("success"),
              onError: () => setStep("success"),
            },
          );
        },
        onError: (error: any) => {
          Alert.alert(
            "Verification failed",
            errMsg(error, "Invalid or expired code. Please try again."),
          );
          setDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        },
      },
    );
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/auth");
    }, 200);
  };

  const handleBack = () => {
    if (step === "details") {
      setVisible(false);
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace("/auth");
      }, 200);
    } else if (step === "code") {
      setStep("details");
      setDigits(["", "", "", "", "", ""]);
    }
  };

  const handleContinue = () => {
    if (step === "details") {
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
          email: email.trim().toLowerCase(),
          username: username.trim().toLowerCase(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          password,
          type: "user",
        },
        {
          onSuccess: () => {
            requestVerification(email);
            setDigits(["", "", "", "", "", ""]);
            setStep("code");
          },
          onError: (error: any) => {
            const data = error?.response?.data;
            const message =
              (typeof data?.email?.[0] === "string" ? data.email[0] : null) ??
              (typeof data?.username?.[0] === "string"
                ? data.username[0]
                : null) ??
              errMsg(error, "Registration failed. Please try again.");
            Alert.alert("Sign up failed", message);
          },
        },
      );
    } else if (step === "code") {
      const code = digits.join("");
      if (code.length === 6) submitOtp(code);
    }
  };

  const handleResendCode = () => {
    requestVerification(email, {
      onSuccess: () => {
        setResendTimer(30);
        setCanResend(false);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.detail ?? "Could not resend code.";
        Alert.alert("Resend failed", message);
      },
    });
  };

  const isLoading = isRegistering || isVerifying;

  return (
    <>
      <TermsModal
        visible={!hasAcceptedTerms}
        onAccept={acceptTerms}
        onDecline={() => {
          setVisible(false);
          setTimeout(() => router.back(), 200);
        }}
      />

      <View style={styles.backgroundTextContainer}>
        <Text style={styles.backgroundText}>REVI AI</Text>
        <Text style={styles.backgroundSubtext}>
          real answers for real estate decisions.
        </Text>
      </View>

      <OverlayModal
        visible={hasAcceptedTerms && visible}
        onClose={handleClose}
        height={step === "details" ? "80%" : "auto"}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Header */}
        {step !== "success" && (
          <View style={[styles.header, step === "code" && { paddingTop: 12 }]}>
            {step === "details" && (
              <View style={styles.logoContainer}>
                <ReviaiLogo width={39} height={37} />
              </View>
            )}
            <Text style={styles.title}>
              {step === "details" ? "Create your account" : "Verify your email"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "details"
                ? "Enter your details to get started"
                : `Enter the 6-digit code we sent to\n${email}`}
            </Text>
          </View>
        )}

        {/* Details step */}
        {step === "details" && (
          <>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.rowInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor="#999999"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.inputContainer, styles.rowInput]}>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor="#999999"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

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
                autoCorrect={false}
              />
            </View>

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

            <Button
              title="Sign Up"
              variant="primary"
              onPress={handleContinue}
              loading={isRegistering}
              disabled={isLoading}
              style={{ marginTop: 8, borderRadius: 30 }}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <Button
              title="Continue with Apple"
              variant="outline"
              onPress={() =>
                Alert.alert(
                  "Coming soon",
                  "Apple Sign In will be available in a future update.",
                )
              }
              icon={<Ionicons name="logo-apple" size={20} color="#ffffff" />}
              style={{ marginBottom: 12 }}
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
              icon={<Ionicons name="logo-google" size={18} color="#FFF" />}
            />

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
          </>
        )}

        {/* OTP step */}
        {step === "code" && (
          <>
            <View style={styles.otpRow}>
              {digits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => {
                    inputRefs.current[i] = r;
                  }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(v, i)}
                  onKeyPress={(e) => handleDigitKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  autoFocus={i === 0}
                  selectTextOnFocus
                  textAlign="center"
                  editable={!isVerifying}
                />
              ))}
            </View>

            <Button
              title="Continue"
              variant="primary"
              onPress={handleContinue}
              loading={isVerifying}
              disabled={isVerifying || digits.join("").length < 6}
              style={{ marginTop: 16, borderRadius: 30 }}
            />

            <TouchableOpacity
              style={styles.resendContainer}
              onPress={canResend && !isResending ? handleResendCode : undefined}
              activeOpacity={canResend ? 0.7 : 1}
            >
              <Text
                style={[
                  styles.resendText,
                  (!canResend || isResending) && styles.resendTextDisabled,
                ]}
              >
                {isResending
                  ? "Sending..."
                  : canResend
                    ? "Resend code"
                    : `Resend in ${resendTimer}s`}
              </Text>
            </TouchableOpacity>

          </>
        )}

        {/* Success step */}
        {step === "success" && (
          <View style={styles.successSection}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color="#ffffff"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.successTitle}>Welcome to REVI!</Text>
            <Text style={styles.successMessage}>
              Your account has been created{"\n"}successfully.
            </Text>
            <Button
              title="Get Started"
              variant="primary"
              onPress={() => {
                setVisible(false);
                setTimeout(() => router.replace("/(tabs)/social"), 100);
              }}
              style={{ marginTop: 24, borderRadius: 30 }}
            />
          </View>
        )}
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
    paddingTop: 8,
    marginBottom: 4,
  },
  logoContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
    marginBottom: 16,
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
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
  loginPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
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
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
  otpBoxFilled: {
    borderColor: "#FFFFFF",
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
  successSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginTop: 16,
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
