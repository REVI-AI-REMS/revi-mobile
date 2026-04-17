import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/src/utils/platform';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  padding?: boolean;
  backgroundColor?: string;
}

export default function Container({
  children,
  style,
  safeArea = true,
  padding = true,
  backgroundColor = '#000000',
}: ContainerProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [
    styles.container,
    { backgroundColor },
    safeArea && {
      paddingTop: Platform.OS === 'android' ? insets.top : 0,
      paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
    },
    padding && styles.padding,
    style,
  ];

  if (safeArea && Platform.OS === 'ios') {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor }, style]}>
        <View style={containerStyle}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: spacing.containerPadding,
  },
});