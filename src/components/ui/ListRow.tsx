/** Generic tappable list row: leading icon tile + title/subtitle + right slot + chevron. */
import { View, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, radius, spacing } from '@/theme';
import { Text } from './Text';
import { PressableScale } from './PressableScale';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons';
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  rightText?: string;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  accent?: boolean;
  style?: ViewStyle;
}

export function ListRow({
  icon,
  iconFamily = 'Ionicons',
  iconColor = palette.ink,
  iconBg = palette.surfaceRaised,
  title,
  subtitle,
  right,
  rightText,
  onPress,
  chevron = true,
  danger,
  accent,
  style,
}: Props) {
  const titleColor = danger ? palette.danger : accent ? palette.coralDark : palette.ink;
  const chevronColor = accent ? palette.coral : palette.inkTertiary;
  const Container: any = onPress ? PressableScale : View;
  return (
    <Container
      onPress={onPress}
      scaleTo={0.98}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }, style]}
    >
      {icon ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: danger ? palette.dangerTint : iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {iconFamily === 'Ionicons' ? (
            <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={danger ? palette.danger : iconColor} />
          ) : (
            <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={danger ? palette.danger : iconColor} />
          )}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd" color={titleColor} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySm" color={palette.inkTertiary} numberOfLines={1} style={{ marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {rightText ? (
        <Text variant="bodySm" color={palette.inkSecondary}>
          {rightText}
        </Text>
      ) : null}
      {chevron && onPress ? <Ionicons name="chevron-forward" size={18} color={chevronColor} /> : null}
    </Container>
  );
}
