/** Horizontal step indicator for multi-step wizards (e.g. Add Property, KYC). */
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing } from '@/theme';
import { Text } from './Text';

interface Props {
  steps: string[];
  current: number; // 0-based
}

export function Stepper({ steps, current }: Props) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.xs }}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const color = done ? palette.success : active ? palette.coral : palette.border;
        return (
          <View key={label} style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
              <View style={{ flex: 1, height: 2, backgroundColor: i === 0 ? 'transparent' : (i <= current ? palette.coral : palette.border) }} />
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: done ? palette.success : active ? palette.coral : palette.surface,
                  borderWidth: active || done ? 0 : 1.5,
                  borderColor: palette.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {done ? (
                  <Ionicons name="checkmark" size={15} color={palette.white} />
                ) : (
                  <Text variant="caption" weight="700" color={active ? palette.white : palette.inkTertiary}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <View style={{ flex: 1, height: 2, backgroundColor: i === steps.length - 1 ? 'transparent' : (i < current ? palette.coral : palette.border) }} />
            </View>
            <Text
              variant="caption"
              align="center"
              color={active ? palette.ink : palette.inkTertiary}
              style={{ marginTop: 6, fontSize: 10.5 }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
