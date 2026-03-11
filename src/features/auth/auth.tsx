import Button from "@/src/components/common/button";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    StyleSheet,
    Text,
    View,
    Platform
} from "react-native";
import { StatusBar } from "expo-status-bar";

export default function AuthScreen() {
  const router = useRouter();
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
    router.push("/signup");
  };

  const handleLogIn = () => {
    console.log("Log In");
    router.push("/login");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <Text style={styles.logo}>REVI AI</Text>
          <Text style={styles.tagline}>
            Real answers for real estate decisions.
          </Text>
        </View>

        <View style={styles.buttonSection}>
          <Button
            title="Continue with Apple"
            variant="primary"
            onPress={handleAppleSignIn}
            icon={<Ionicons name="logo-apple" size={20} color="#000" />}
          />

          <Button
            title="Continue with Google"
            variant="secondary"
            onPress={handleGoogleSignIn}
            icon={<Ionicons name="logo-google" size={18} color="#FFF" />}
          />

          <Button title="Sign Up" variant="secondary" onPress={handleSignUp} />

          <Button title="Log In" variant="outline" onPress={handleLogIn} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 80 : 100,
  },
  logoSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 33,
  },
  logo: {
    fontSize: Platform.OS === "android" ? 34 : 42,
    fontWeight: "700",
    fontStyle: "normal",
    color: "#FFFFFF",
    letterSpacing: Platform.OS === "android" ? 3.5 : 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: Platform.OS === "android" ? 13 : 15,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: Platform.OS === "android" ? 18 : 20,
    color: "#A6A6A6",
    textAlign: "center",
  },
  buttonSection: {
    gap: Platform.OS === "android" ? 10 : 12,
    width: "100%",
    paddingHorizontal: 33,
    paddingVertical: Platform.OS === "android" ? 48 : 59,
    backgroundColor: "#1a1a1a",
    borderTopStartRadius: 40,
    borderTopEndRadius: 40,
  },
});
