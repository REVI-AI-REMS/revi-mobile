import { ScreenHeader } from "@/src/components";
import { Fonts } from "@/src/constants/theme";
import { Text } from "@react-navigation/elements";
import { StyleSheet, View } from "react-native";

export default function NewsScreen() {
  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Saved"
        showMenuButton={false}
        showBackButton={false}
      />
      <View style={styles.container}>
        <Text style={styles.text}>Saved Screen</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F10",
  },
  text: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
});
