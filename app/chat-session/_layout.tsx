import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F0F10" },
        animation: "none",
      }}
    >
      <Stack.Screen name="conversation" />
    </Stack>
  );
}
