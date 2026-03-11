import React from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  Text,
  Platform,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Fonts, Typography, BorderRadius } from '@/src/constants/theme';
import { spacing, platformTextStyles } from '@/src/utils/platform';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  errorStyle?: any;
}

export default function TextInput({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  ...props
}: TextInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      <RNTextInput
        style={[
          styles.input,
          error && styles.inputError,
          inputStyle,
        ]}
        placeholderTextColor="#666"
        {...props}
      />
      {error && (
        <Text style={[styles.error, errorStyle]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    fontFamily: Fonts.medium,
    color: '#333',
    marginBottom: spacing.xs,
    ...platformTextStyles.android,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: BorderRadius.button,
    paddingHorizontal: spacing.containerPadding,
    paddingVertical: spacing.inputPadding,
    fontSize: Typography.md,
    fontFamily: Fonts.regular,
    backgroundColor: '#fff',
    minHeight: Platform.select({
      android: 48,
      ios: 44,
      default: 44,
    }),
    ...platformTextStyles.android,
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  error: {
    fontSize: Typography.xs,
    fontFamily: Fonts.regular,
    color: '#e74c3c',
    marginTop: spacing.xs,
    ...platformTextStyles.android,
  },
});