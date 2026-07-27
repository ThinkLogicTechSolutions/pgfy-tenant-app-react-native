/** Location picker — Google Places autocomplete, near me, search history, top cities. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, fontFamily } from '@/theme';
import { Text, Button, IconButton, PressableScale } from '@/components/ui';
import { LOCATION_SEARCH_PLACEHOLDER } from '@/data/locationSearch';
import { resolveNearMeLocation } from '@/lib/nearMe';
import { autocompletePlaces, geocodePlaceId, newPlacesSessionToken, type PlaceAutocompletePrediction } from '@/lib/googleMaps';
import { matchOperationalLocation } from '@/lib/operationalLocation';
import { getSearchHistory, addSearchHistory } from '@/lib/searchHistory';
import { showAlert } from '@/lib/alert';
import { locationPicker } from '@/store/locationPicker';
import { useMasterData } from '@/context/MasterDataContext';
import { haptic } from '@/lib/haptics';

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const pickedRef = useRef(false);
  const sessionToken = useRef(newPlacesSessionToken());
  const { states, cities, localities } = useMasterData();

  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [loadingNear, setLoadingNear] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceAutocompletePrediction[]>([]);

  const showSuggestions = query.trim().length > 0 && suggestions.length > 0;

  const topCities = useMemo(
    () =>
      cities
        .filter((c) => c.status === 'ACTIVE')
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 8),
    [cities],
  );
  const stateName = (stateId: number) => states.find((s) => s.id === stateId)?.name;

  const loadHistory = useCallback(async () => {
    setHistory(await getSearchHistory());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }, [loadHistory]),
  );

  useEffect(
    () => () => {
      if (!pickedRef.current) locationPicker.cancel();
    },
    [],
  );

  // Debounced Places Autocomplete as the tenant types.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const t = setTimeout(async () => {
      const results = await autocompletePlaces(q, sessionToken.current);
      if (active) setSuggestions(results);
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const finishPick = async (
    label: string,
    ids?: { stateId?: number; cityId?: number; localityId?: number | null },
    operational = true,
  ) => {
    pickedRef.current = true;
    haptic.select();
    Keyboard.dismiss();
    const next = await addSearchHistory(label);
    setHistory(next);
    locationPicker.pick(label, ids, operational);
    router.back();
  };

  const selectPrediction = async (prediction: PlaceAutocompletePrediction) => {
    haptic.light();
    const address = await geocodePlaceId(prediction.placeId);
    if (!address) {
      showAlert('Could not resolve location', 'Please try a different search.');
      return;
    }
    sessionToken.current = newPlacesSessionToken();
    const match = matchOperationalLocation(address, { states, cities, localities });
    if (!match) {
      await finishPick(address.locality ?? address.city ?? address.formattedAddress, undefined, false);
      return;
    }
    await finishPick(match.localityName ?? match.cityName, match);
  };

  const selectHistoryOrCity = async (label: string) => {
    // Legacy string entries (recent searches / top cities) aren't place-resolved — re-run
    // autocomplete-free matching by name only against master data.
    haptic.select();
    const match = matchOperationalLocation({ city: label }, { states, cities, localities });
    if (!match) {
      await finishPick(label, undefined, false);
      return;
    }
    await finishPick(match.localityName ?? match.cityName, match);
  };

  const nearMe = async () => {
    setLoadingNear(true);
    haptic.light();
    const result = await resolveNearMeLocation({ states, cities, localities });
    setLoadingNear(false);
    if (result.ok) {
      await finishPick(result.label, result);
      return;
    }
    if (result.reason === 'not-operational') {
      await finishPick(result.label, undefined, false);
      return;
    }
    showAlert('Near me', result.message);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm, backgroundColor: palette.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.md }}>
        <IconButton icon="close" onPress={() => router.back()} style={{ borderRadius: 21 }} />
        <Text variant="h3" style={{ flex: 1 }}>
          Search your location to stay
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            minHeight: 52,
            paddingHorizontal: spacing.base,
            backgroundColor: palette.surface,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: palette.coral,
          }}
        >
          <Ionicons name="search-outline" size={20} color={palette.coral} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder={LOCATION_SEARCH_PLACEHOLDER}
            placeholderTextColor={palette.inkTertiary}
            style={{ flex: 1, fontFamily: fontFamily.medium, fontSize: 16, color: palette.ink, paddingVertical: 0 }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <PressableScale onPress={() => setQuery('')} haptics={false} style={{ padding: 4 }} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color={palette.inkTertiary} />
            </PressableScale>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['2xl'] }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showSuggestions ? (
          <View style={{ marginBottom: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, overflow: 'hidden', backgroundColor: palette.surface }}>
            {suggestions.map((item, i) => (
              <SuggestionRow
                key={item.placeId}
                icon="search-outline"
                label={item.description}
                onPress={() => selectPrediction(item)}
                divider={i < suggestions.length - 1}
              />
            ))}
          </View>
        ) : null}

        <Button
          label="Search nearby PGs"
          icon="navigate-outline"
          variant="outline"
          full
          size="lg"
          loading={loadingNear}
          onPress={nearMe}
          style={{ marginBottom: spacing.xl }}
        />

        {history.length > 0 && !showSuggestions ? (
          <View style={{ marginBottom: spacing.xl }}>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
              CONTINUE YOUR SEARCH
            </Text>
            {history.map((item, i) => (
              <SuggestionRow key={`${item}-${i}`} icon="time-outline" label={item} onPress={() => selectHistoryOrCity(item)} />
            ))}
          </View>
        ) : null}

        {!showSuggestions && topCities.length > 0 ? (
          <View>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
              TOP CITIES
            </Text>
            {topCities.map((city, i) => (
              <SuggestionRow
                key={city.id}
                icon="business-outline"
                label={city.name}
                subtitle={stateName(city.state_id)}
                onPress={() => finishPick(city.name, { stateId: city.state_id, cityId: city.id })}
                divider={i < topCities.length - 1}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function SuggestionRow({
  icon,
  label,
  subtitle,
  onPress,
  divider,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress: () => void;
  divider?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.base,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: palette.border,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: palette.surfaceRaised,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={palette.inkSecondary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyMd" weight="600" numberOfLines={1}>
          {label}
        </Text>
        {subtitle ? (
          <Text variant="caption" color={palette.inkTertiary} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} />
    </PressableScale>
  );
}
