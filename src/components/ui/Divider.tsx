import { View, ViewStyle } from 'react-native';
import { palette } from '@/theme';

export function Divider({ style, vertical }: { style?: ViewStyle; vertical?: boolean }) {
  return (
    <View
      style={[
        vertical
          ? { width: 1, alignSelf: 'stretch', backgroundColor: palette.border }
          : { height: 1, backgroundColor: palette.border },
        style,
      ]}
    />
  );
}
