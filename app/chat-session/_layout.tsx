import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#000000" },
        animation: "none",
      }}
    >
      <Stack.Screen name="conversation" />
    </Stack>
  );
}
