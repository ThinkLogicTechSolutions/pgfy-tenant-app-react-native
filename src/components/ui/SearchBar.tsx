import { View, TextInput, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, fontFamily } from '@/theme';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filterCount?: number;
  style?: ViewStyle;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search', onFilterPress, filterCount, style }: Props) {
  return (
    <View style={[{ flexDirection: 'row', gap: spacing.sm }, style]}>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          height: 46,
          paddingHorizontal: spacing.base,
          backgroundColor: palette.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border,
        }}
      >
        <Ionicons name="search" size={18} color={palette.inkTertiary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.inkTertiary}
          style={{ flex: 1, fontFamily: fontFamily.medium, fontSize: 14, color: palette.ink, paddingVertical: 0 }}
        />
        {value.length > 0 ? (
          <Ionicons name="close-circle" size={18} color={palette.inkTertiary} onPress={() => onChangeText('')} />
        ) : null}
      </View>
      {onFilterPress ? (
        <PressableScale
          onPress={onFilterPress}
          scaleTo={0.92}
          style={{
            width: 46,
            height: 46,
            borderRadius: radius.md,
            backgroundColor: palette.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="options-outline" size={20} color={palette.white} />
          {filterCount ? (
            <View
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: palette.coral,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text variant="caption" color={palette.white} style={{ fontSize: 10 }}>
                {filterCount}
              </Text>
            </View>
          ) : null}
        </PressableScale>
      ) : null}
    </View>
  );
}
