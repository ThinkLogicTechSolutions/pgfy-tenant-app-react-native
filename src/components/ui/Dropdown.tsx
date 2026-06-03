/** Labelled dropdown — opens a picker sheet to choose one option. */
import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text } from './Text';
import { Sheet } from './Sheet';
import { PressableScale } from './PressableScale';
import { haptic } from '@/lib/haptics';

export interface DropdownOption<T extends string = string> {
  label: string;
  value: T;
}

interface Props<T extends string = string> {
  label?: string;
  placeholder?: string;
  value: T | null;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  error?: string;
  hint?: string;
  pickerTitle?: string;
  disabled?: boolean;
}

export function Dropdown<T extends string = string>({
  label,
  placeholder = 'Select an option',
  value,
  options,
  onChange,
  error,
  hint,
  pickerTitle,
  disabled,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const borderColor = error ? palette.danger : palette.border;

  const select = (v: T) => {
    onChange(v);
    setOpen(false);
    haptic.select();
  };

  return (
    <View>
      {label ? (
        <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: 6 }}>
          {label}
        </Text>
      ) : null}
      <PressableScale
        onPress={() => !disabled && setOpen(true)}
        scaleTo={0.99}
        haptics={false}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 50,
          paddingHorizontal: spacing.base,
          backgroundColor: disabled ? palette.surfaceRaised : palette.surface,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text
          variant="bodyMd"
          weight={selected ? '500' : '400'}
          color={selected ? palette.ink : palette.inkTertiary}
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={palette.inkTertiary} />
      </PressableScale>
      {error ? (
        <Text variant="caption" color={palette.danger} style={{ marginTop: 5 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 5 }}>
          {hint}
        </Text>
      ) : null}

      <Sheet visible={open} onClose={() => setOpen(false)} title={pickerTitle ?? label ?? 'Select'} scroll>
        <View style={{ gap: spacing.xs }}>
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => select(opt.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.base,
                  borderRadius: radius.md,
                  backgroundColor: active ? palette.coralTint : palette.surfaceRaised,
                  borderWidth: 1,
                  borderColor: active ? palette.coral : palette.border,
                }}
              >
                <Text variant="bodyMd" weight={active ? '600' : '500'} color={active ? palette.coralDark : palette.ink}>
                  {opt.label}
                </Text>
                {active ? <Ionicons name="checkmark-circle" size={20} color={palette.coral} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </View>
  );
}
