import ReviaiLogo from "@/assets/svgs/reviaimobilelogo.svg";
import OverlayModal from "@/components/common/OverlayModal";
import Button from "@/components/ui/Button";
import { Fonts } from "@/constants/theme";
import {
  useConfirmPasswordResetMutation,
  useRequestPasswordResetMutation,
  useVerifyPasswordResetOtpMutation,
} from "@/hooks/mutations/use-auth";
import { parseApiError } from "@/utils/api-error";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Step = "email" | "code" | "newPassword" | "success";

// ─── OTP Input ────────────────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(6, " ").split("");

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={styles.otpRow}
    >
      {digits.map((d, i) => {
        const filled = d !== " ";
        const active = value.length === i;
        return (
          <View
            key={i}
            style={[
              styles.otpBox,
              active && styles.otpBoxActive,
              filled && styles.otpBoxFilled,
            ]}
          >
            <Text style={styles.otpDigit}>{filled ? d : ""}</Text>
            {active && <View style={styles.otpCursor} />}
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        style={styles.otpHiddenInput}
        caretHidden
      />
    </TouchableOpacity>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────

function passwordStrength(pw: string): {
  label: string;
  color: string;
  pct: number;
} {
  if (!pw.length) return { label: "", color: "#3A3A3C", pct: 0 };
  const s =
    (pw.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  if (s <= 1) return { label: "Weak", color: "#FF453A", pct: 25 };
  if (s === 2) return { label: "Fair", color: "#FF9F0A", pct: 50 };
  if (s === 3) return { label: "Good", color: "#30D158", pct: 75 };
  return { label: "Strong", color: "#30D158", pct: 100 };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState((params.email as string) || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const { mutate: requestReset, isPending: isRequesting } =
    useRequestPasswordResetMutation();
  const { mutate: verifyOtp, isPending: isVerifying } =
    useVerifyPasswordResetOtpMutation();
  const { mutate: confirmReset, isPending: isConfirming } =
    useConfirmPasswordResetMutation();

  const isLoading = isRequesting || isVerifying || isConfirming;
  const strength = passwordStrength(newPassword);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  const clearError = () => setInlineError(null);

  const goBack = () => {
    setVisible(false);
    setTimeout(() => {
      if (router.canGoBack()) router.back();
      else router.replace("/login");
    }, 200);
  };

  const handleBack = () => {
    clearError();
    if (step === "email") goBack();
    else if (step === "code") {
      setStep("email");
      setOtp("");
    } else if (step === "newPassword") {
      setStep("code");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const sendCode = (onDone?: () => void) => {
    requestReset(email.trim().toLowerCase(), {
      onSuccess: () => {
        setResendCountdown(60);
        onDone?.();
      },
      onError: (err) => setInlineError(parseApiError(err)),
    });
  };

  const handleContinue = () => {
    clearError();
    if (step === "email") {
      if (!email.trim()) {
        setInlineError("Please enter your email address.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setInlineError("Please enter a valid email address.");
        return;
      }
      sendCode(() => setStep("code"));
    } else if (step === "code") {
      if (otp.length < 6) {
        setInlineError("Enter the full 6-digit code.");
        return;
      }
      verifyOtp(
        { email: email.trim().toLowerCase(), otp },
        {
          onSuccess: () => setStep("newPassword"),
          onError: (err) => {
            setInlineError(parseApiError(err));
            setOtp("");
          },
        },
      );
    } else if (step === "newPassword") {
      if (newPassword.length < 8) {
        setInlineError("Password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setInlineError("Passwords do not match.");
        return;
      }
      confirmReset(
        { email: email.trim().toLowerCase(), otp, new_password: newPassword },
        {
          onSuccess: () => setStep("success"),
          onError: (err) => setInlineError(parseApiError(err)),
        },
      );
    }
  };

  const isButtonEnabled = () => {
    if (isLoading) return false;
    if (step === "email") return email.trim().length > 0;
    if (step === "code") return otp.length === 6;
    if (step === "newPassword")
      return newPassword.length >= 8 && newPassword === confirmPassword;
    return true;
  };

  const TITLE: Record<Step, string> = {
    email: "Reset your password",
    code: "Check your email",
    newPassword: "Create new password",
    success: "Password updated!",
  };

  const SUBTITLE: Record<Step, string> = {
    email: "Enter the email address linked\nto your account.",
    code: `We sent a 6-digit code to\n${email}`,
    newPassword: "Choose a strong password to keep\nyour Revi account secure.",
    success: "Your password has been changed\nsuccessfully.",
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F10" }}>
      <View style={styles.bgContainer} pointerEvents="none">
        <Text style={styles.bgText}>REVI AI</Text>
        <Text style={styles.bgSubtext}>
          real answers for real estate decisions.
        </Text>
      </View>

      <OverlayModal
        visible={visible}
        onClose={goBack}
        height="80%"
        showCloseButton={false}
        onBackPress={step !== "success" ? handleBack : undefined}
      >

        {/* ── Header (same structure as LoginScreen) ── */}
        {step !== "success" && (
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <ReviaiLogo width={39} height={37} />
            </View>
            <Text style={styles.title}>{TITLE[step]}</Text>
            <Text style={styles.subtitle}>{SUBTITLE[step]}</Text>
          </View>
        )}

        {/* ── Email input ── */}
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
              placeholder="Email address"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                clearError();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={!email}
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
              underlineColorAndroid="transparent"
              onSubmitEditing={handleContinue}
            />
          </View>
        )}

        {/* ── OTP boxes ── */}
        {step === "code" && (
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v);
              clearError();
            }}
          />
        )}

        {/* ── New password ── */}
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
                onChangeText={(t) => {
                  setNewPassword(t);
                  clearError();
                }}
                secureTextEntry={!showNewPw}
                autoCapitalize="none"
                autoFocus
                onFocus={() => setFocusedInput("new")}
                onBlur={() => setFocusedInput(null)}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                onPress={() => setShowNewPw(!showNewPw)}
                hitSlop={8}
              >
                <Ionicons
                  name={showNewPw ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>

            {newPassword.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthTrack}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: `${strength.pct}%` as any,
                        backgroundColor: strength.color,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}

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
                placeholder="Confirm password"
                placeholderTextColor="#999999"
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  clearError();
                }}
                secureTextEntry={!showConfirmPw}
                autoCapitalize="none"
                onFocus={() => setFocusedInput("confirm")}
                onBlur={() => setFocusedInput(null)}
                underlineColorAndroid="transparent"
                onSubmitEditing={handleContinue}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPw(!showConfirmPw)}
                hitSlop={8}
              >
                <Ionicons
                  name={showConfirmPw ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#666666"
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={40} color="#30D158" />
            </View>
            <Text style={styles.successTitle}>Password updated!</Text>
            <Text style={styles.successMsg}>
              Your password has been changed{"\n"}successfully.
            </Text>
            <Button
              title="Back to Login"
              variant="primary"
              onPress={() => {
                setVisible(false);
                setTimeout(() => router.replace("/login"), 200);
              }}
              style={{ marginTop: 32, borderRadius: 30 }}
            />
          </View>
        )}

        {/* ── Inline error ── */}
        {inlineError && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#FF453A" />
            <Text style={styles.errorText}>{inlineError}</Text>
          </View>
        )}

        {/* ── Primary action button ── */}
        {step !== "success" && (
          <Button
            title={
              step === "email"
                ? "Send Code"
                : step === "code"
                  ? "Verify Code"
                  : "Reset Password"
            }
            variant="primary"
            onPress={handleContinue}
            loading={isLoading}
            disabled={!isButtonEnabled()}
            style={{ marginBottom: 24, borderRadius: 30 }}
          />
        )}

        {/* ── Resend (code step only) ── */}
        {step === "code" && (
          <TouchableOpacity
            style={styles.resendContainer}
            disabled={resendCountdown > 0 || isRequesting}
            onPress={() => sendCode()}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.resendText,
                resendCountdown > 0 && styles.resendTextDisabled,
              ]}
            >
              {resendCountdown > 0
                ? `Resend code in ${resendCountdown}s`
                : "Resend code"}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Footer divider + back to login (mirrors LoginScreen's Sign Up footer) ── */}
        {step !== "success" && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Back to Login"
              variant="secondary"
              onPress={goBack}
            />
          </>
        )}
      </OverlayModal>
    </View>
  );
}

// ─── Styles (matching LoginScreen exactly) ────────────────────────────────────

const styles = StyleSheet.create({
  bgContainer: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  bgText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#ffffff",
    opacity: 0.25,
    letterSpacing: 6,
    marginBottom: 8,
  },
  bgSubtext: {
    fontSize: 16,
    fontWeight: "400",
    color: "#A6A6A6",
    letterSpacing: 1,
  },

  backButton: {
    position: "absolute",
    top: -0,
    left: 0,
    zIndex: 10,
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Header — identical to LoginScreen
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

  // Inputs — identical to LoginScreen
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
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: "#E5E7EB",
    textAlignVertical: "center",
    paddingVertical: 0,
    height: Platform.OS === "android" ? 48 : undefined,
  },

  // OTP
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
    paddingVertical: 4,
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#3A3A3C",
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxActive: { borderColor: "#FFFFFF" },
  otpBoxFilled: { backgroundColor: "#2A2A2D", borderColor: "#555" },
  otpDigit: { fontSize: 20, fontFamily: Fonts.bold, color: "#FFFFFF" },
  otpCursor: {
    position: "absolute",
    width: 2,
    height: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 1,
  },
  otpHiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },

  // Password strength
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    marginTop: -8,
    paddingHorizontal: 2,
  },
  strengthTrack: {
    flex: 1,
    height: 3,
    backgroundColor: "#2A2A2A",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: { height: "100%" as any, borderRadius: 2 },
  strengthLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    width: 48,
    textAlign: "right",
  },

  // Inline error
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: "#FF453A",
    flex: 1,
  },

  // Resend — identical to LoginScreen's forgotContainer
  resendContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: "#999999",
  },
  resendTextDisabled: { color: "#555" },

  // Divider — identical to LoginScreen
  divider: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#3A3A3C" },
  dividerText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: "#999999",
    marginHorizontal: 16,
  },

  // Success
  successBox: { alignItems: "center", paddingTop: 48, paddingBottom: 8 },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(48,209,88,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  successMsg: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: "#999999",
    textAlign: "center",
    lineHeight: 22,
  },
});
