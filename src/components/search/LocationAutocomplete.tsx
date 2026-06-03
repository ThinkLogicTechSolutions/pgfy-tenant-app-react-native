import { useMemo, useState } from 'react';
import { View, TextInput, ActivityIndicator, Keyboard, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, fontFamily, shadows } from '@/theme';
import { Text, PressableScale } from '@/components/ui';
import { filterLocations, LOCATION_SEARCH_PLACEHOLDER } from '@/data/locationSearch';
import { resolveNearMeLocation } from '@/lib/nearMe';
import { haptic } from '@/lib/haptics';

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
}

interface TriggerProps {
  value: string;
  onPress: () => void;
}

/** Read-only field on home — opens `/location` picker. */
export function LocationSearchTrigger({ value, onPress }: TriggerProps) {
  const empty = !value.trim();

  return (
    <View>
      <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: 6 }}>
        Location
      </Text>
      <PressableScale
        onPress={onPress}
        scaleTo={0.99}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 50,
          paddingHorizontal: spacing.base,
          backgroundColor: palette.surface,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: palette.border,
        }}
      >
        <Ionicons name="location-outline" size={18} color={palette.inkTertiary} />
        <Text
          variant="body"
          color={empty ? palette.inkTertiary : palette.ink}
          style={{ flex: 1, minWidth: 0 }}
          numberOfLines={1}
        >
          {empty ? LOCATION_SEARCH_PLACEHOLDER : value}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} />
      </PressableScale>
    </View>
  );
}

/** @deprecated Inline autocomplete — use LocationSearchTrigger + `/location` screen. */
export function LocationAutocomplete({ value, onChange, onSelect }: AutocompleteProps) {
  const [focused, setFocused] = useState(false);
  const [loadingNear, setLoadingNear] = useState(false);

  const suggestions = useMemo(() => filterLocations(value, 8), [value]);
  const showSuggestions = focused && suggestions.length > 0;

  const pick = (label: string) => {
    onChange(label);
    onSelect?.(label);
    setFocused(false);
    Keyboard.dismiss();
    haptic.select();
  };

  const nearMe = async () => {
    setLoadingNear(true);
    haptic.light();
    const result = await resolveNearMeLocation();
    setLoadingNear(false);
    if (result.ok) {
      pick(result.label);
      return;
    }
    Alert.alert('Near me', result.message);
  };

  return (
    <View style={{ zIndex: 20 }}>
      <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: 6 }}>
        Location
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 50,
          paddingLeft: spacing.base,
          paddingRight: spacing.sm,
          backgroundColor: palette.surface,
          borderRadius: radius.md,
          borderWidth: 1.5,
          borderColor: focused ? palette.coral : palette.border,
        }}
      >
        <Ionicons name="location-outline" size={18} color={focused ? palette.coral : palette.inkTertiary} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Search city or area"
          placeholderTextColor={palette.inkTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          style={{ flex: 1, fontFamily: fontFamily.medium, fontSize: 15, color: palette.ink, paddingVertical: 0 }}
          returnKeyType="search"
          autoCorrect={false}
        />
        {loadingNear ? (
          <ActivityIndicator size="small" color={palette.coral} style={{ marginRight: spacing.xs }} />
        ) : (
          <PressableScale
            onPress={nearMe}
            scaleTo={0.95}
            haptics={false}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: radius.pill,
              backgroundColor: palette.navyTint,
            }}
          >
            <Ionicons name="navigate-outline" size={14} color={palette.navy} />
            <Text variant="caption" weight="700" color={palette.navy}>
              Near me
            </Text>
          </PressableScale>
        )}
      </View>

      {showSuggestions ? (
        <View
          style={{
            marginTop: 4,
            backgroundColor: palette.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: palette.border,
            overflow: 'hidden',
            ...shadows.card,
          }}
        >
          {suggestions.map((item, i) => (
            <PressableScale
              key={`${item}-${i}`}
              onPress={() => pick(item)}
              scaleTo={0.99}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.base,
                borderBottomWidth: i < suggestions.length - 1 ? 1 : 0,
                borderBottomColor: palette.border,
              }}
            >
              <Ionicons name="search-outline" size={16} color={palette.inkTertiary} />
              <Text variant="bodySm" style={{ flex: 1 }} numberOfLines={1}>
                {item}
              </Text>
            </PressableScale>
          ))}
        </View>
      ) : null}
    </View>
  );
}
