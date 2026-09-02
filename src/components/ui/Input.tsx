/** Labelled text input with focus ring + optional leading icon / prefix. */
import { useState } from 'react';
import { TextInput, View, ViewStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, fontFamily } from '@/theme';
import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  prefix?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, icon, prefix, error, hint, containerStyle, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? palette.danger : focused ? palette.coral : palette.border;
  const multiline = !!rest.multiline;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          // Multiline textareas must top-align and grow, not sit in a fixed 50px row.
          alignItems: multiline ? 'flex-start' : 'center',
          gap: spacing.sm,
          minHeight: 50,
          paddingHorizontal: spacing.base,
          paddingVertical: multiline ? 12 : 0,
          backgroundColor: palette.surface,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor,
        }}
      >
        {icon ? <Ionicons name={icon} size={18} color={focused ? palette.coral : palette.inkTertiary} style={multiline ? { marginTop: 2 } : undefined} /> : null}
        {prefix ? (
          <Text variant="bodyMd" color={palette.inkSecondary}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={palette.inkTertiary}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[
            { flex: 1, fontFamily: fontFamily.medium, fontSize: 15, color: palette.ink, paddingVertical: 0 },
            style,
          ]}
        />
      </View>
      {error ? (
        <Text variant="caption" color={palette.danger} style={{ marginTop: 5 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 5 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
