/** T-S13 — Full property media gallery with section filters. */
import { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, IconButton } from '@/components/ui';
import { MediaSectionGrid } from '@/components/domain/MediaSectionGrid';
import { getListing } from '@/data';
import { listingMediaSections } from '@/lib/media';
import type { MediaSection } from '@/data/types';

export default function PropertyMedia() {
  const { id, section: sectionParam, sections: sectionsParam } = useLocalSearchParams<{ id: string; section?: string; sections?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // The caller (listing detail) already has the media sections in hand — it passes them
  // straight through so this screen doesn't need a listing lookup that may not resolve
  // (e.g. an API-backed property id, which isn't in the mock catalogue `getListing` reads).
  const passedSections = useMemo<MediaSection[] | null>(() => {
    if (!sectionsParam) return null;
    try {
      const parsed = JSON.parse(sectionsParam);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [sectionsParam]);

  const mockListing = passedSections ? null : getListing(String(id));
  const sections = passedSections ?? (mockListing ? listingMediaSections(mockListing) : []);
  const [activeSection, setActiveSection] = useState(
    () => sectionParam ?? sections[0]?.id ?? '',
  );
  const active = sections.find((s) => s.id === activeSection) ?? sections[0];

  if (!passedSections && !mockListing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="bodyMd" color={palette.inkSecondary}>Property not found</Text>
      </View>
    );
  }

  const photoCount = sections.reduce((n, s) => n + s.images.length, 0);
  const contentWidth = width - spacing.base * 2;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View
        style={{
          paddingTop: insets.top + spacing.xs,
          paddingHorizontal: spacing.base,
          paddingBottom: spacing.sm,
          backgroundColor: palette.surface,
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <IconButton
            icon="chevron-back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace(`/listing/${id}`))}
          />
          <Text variant="h3" style={{ flex: 1 }}>Photos & Videos</Text>
          <Text variant="caption" color={palette.inkTertiary}>{photoCount} photos</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.xs }}
        >
          {sections.map((s) => {
            const selected = activeSection === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => setActiveSection(s.id)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: selected ? palette.navy : palette.border,
                  backgroundColor: selected ? palette.navyTint : palette.surface,
                }}
              >
                <Text variant="bodySm" weight={selected ? '700' : '500'} color={selected ? palette.navy : palette.ink}>
                  {s.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.base,
          paddingTop: spacing.base,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {active ? (
          <>
            <Text variant="h2" style={{ marginBottom: spacing.md }}>{active.name}</Text>
            <MediaSectionGrid images={active.images} width={contentWidth} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
