import { View, Text, StyleSheet } from "react-native";
import { Fonts } from "@/src/constants/theme";

export default function NewsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>News Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 24,
    fontFamily: Fonts.bold,
    color: "#FFFFFF",
  },
});
