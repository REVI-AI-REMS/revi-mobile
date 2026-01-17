import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Button from "@/src/components/common/button";

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
      <StatusBar barStyle="light-content" />

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
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 100,
  },
  logoSection: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 33,
  },
  logo: {
    fontSize: 42,
    fontWeight: "700",
    fontStyle: "normal",
    color: "#FFFFFF",
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: 20,
    color: "#A6A6A6",
    textAlign: "center",
  },
  buttonSection: {
    gap: 12,
    width: "100%",
    paddingHorizontal: 33,
    paddingVertical: 59,
    backgroundColor: "#1a1a1a",
    borderTopStartRadius: 40,
    borderTopEndRadius: 40,
  },
});
