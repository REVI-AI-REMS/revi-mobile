import HomeAi from "@/assets/svgs/AI 1.svg";
import HomeIcon from "@/assets/svgs/HOME 1.svg";
import HomeSearch from "@/assets/svgs/SEARCH 1.svg";
import ProfileIcon from "@/assets/svgs/aProfile 1.svg";
import HomeBookmark from "@/assets/svgs/sSAVED 1.svg";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#666666",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0F0F10",
          borderTopColor: "#141414",
          borderTopWidth: 1,
          height: 84,
          paddingBottom: 15,
          paddingTop: 15,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="social"
        options={{
          title: "Socials",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? "#202020" : "transparent",
                borderRadius: 1000,
              }}
            >
              <HomeIcon width={24} height={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? "#202020" : "transparent",
                borderRadius: 1000,
              }}
            >
              <HomeSearch width={24} height={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? "#202020" : "transparent",
                borderRadius: 1000,
              }}
            >
              <HomeAi width={24} height={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="conversation"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? "#202020" : "transparent",
                borderRadius: 1000,
              }}
            >
              <HomeBookmark width={24} height={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: focused ? "#202020" : "transparent",
                borderRadius: 1000,
              }}
            >
              <ProfileIcon width={24} height={22} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
