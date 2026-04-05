import HomeAi from "@/assets/svgs/AI 1.svg";
import HomeIcon from "@/assets/svgs/HOME 1.svg";
import HomeSearch from "@/assets/svgs/SEARCH 1.svg";
import ProfileIcon from "@/assets/svgs/aProfile 1.svg";
import HomeBookmark from "@/assets/svgs/sSAVED 1.svg";
import { Tabs } from "expo-router";
import type { SvgProps } from "react-native-svg";
import { memo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Tab Icon ────────────────────────────────────────────────────────────────

const ICON_SIZE = 24;

const TabIcon = memo(function TabIcon({
  Icon,
  focused,
}: {
  Icon: React.FC<SvgProps>;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Icon width={ICON_SIZE} height={ICON_SIZE - 2} />
    </View>
  );
});

// ─── Tab Config ──────────────────────────────────────────────────────────────

const TABS = [
  { name: "social", title: "Home", Icon: HomeIcon },
  { name: "explore", title: "Search", Icon: HomeSearch },
  { name: "chat", title: "Chat", Icon: HomeAi },
  { name: "news", title: "News", Icon: HomeBookmark },
  { name: "profile", title: "Profile", Icon: ProfileIcon },
] as const;

// ─── Layout ──────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = (Platform.OS === "ios" ? 50 : 60) + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#666666",
        tabBarStyle: {
          backgroundColor: "#0F0F10",
          borderTopColor: "#141414",
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: 12 + insets.bottom,
          paddingTop: 15,
        },
      }}
    >
      {TABS.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused }) => <TabIcon Icon={Icon} focused={focused} />,
          }}
        />
      ))}

      {/* Hidden tab — accessible via navigation but not shown in tab bar */}
      <Tabs.Screen name="conversation" options={{ href: null }} />
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
  },
  iconWrapFocused: {
    backgroundColor: "#202020",
  },
});
