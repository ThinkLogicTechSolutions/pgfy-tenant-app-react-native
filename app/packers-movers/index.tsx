import { useEffect, useState, useRef } from 'react';
import { View, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Chip, PressableScale, EmptyState, Badge, Skeleton, AnimatedListItem, Sheet, Button } from '@/components/ui';
import { EmptyGeneric } from '@/components/illustrations';
import { packersMoversEnquiryApi, errorMessage, type CreatePackersMoversEnquiryResponse } from '@/lib/api';
import { formatDate } from '@/lib/format';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const DATE_FILTERS = [
  { key: 'ALL', label: 'All Time' },
  { key: 'TODAY', label: 'Today' },
  { key: 'THIS_MONTH', label: 'This Month' },
  { key: 'THIS_YEAR', label: 'This Year' },
];

const BANNER_SLIDES = [
  { icon: 'flash-outline', text: 'Get instant quotes from verified partners' },
  { icon: 'shield-checkmark-outline', text: 'Safe and secure packing of all belongings' },
  { icon: 'map-outline', text: 'Seamless door-to-door relocation service' },
];
const INFINITE_SLIDES = Array(100).fill(BANNER_SLIDES).flat();

const screenWidth = Dimensions.get('window').width;
const slideWidth = screenWidth - spacing.base * 2;

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getDateRange(filter: string): { from_date?: string; to_date?: string } {
  if (filter === 'ALL') return {};

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (filter === 'TODAY') {
    const today = toYMD(now);
    return { from_date: today, to_date: today };
  }
  if (filter === 'THIS_MONTH') {
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    return { from_date: toYMD(firstDay), to_date: toYMD(lastDay) };
  }
  if (filter === 'THIS_YEAR') {
    const firstDay = new Date(y, 0, 1);
    const lastDay = new Date(y, 11, 31);
    return { from_date: toYMD(firstDay), to_date: toYMD(lastDay) };
  }
  return {};
}

export default function PackersMoversHistory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  const [status, setStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState('ALL');
  const [draftDateFilter, setDraftDateFilter] = useState('ALL');

  const [enquiries, setEnquiries] = useState<CreatePackersMoversEnquiryResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % INFINITE_SLIDES.length;
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadPage = (skip: number) => {
    const setBusy = skip === 0 ? setLoading : setLoadingMore;
    setBusy(true);
    setError(null);
    
    const query: Record<string, any> = { limit: PAGE_SIZE, skip };
    if (status !== 'ALL') query.status = status;
    
    const { from_date, to_date } = getDateRange(dateFilter);
    if (from_date) query.from_date = from_date;
    if (to_date) query.to_date = to_date;

    packersMoversEnquiryApi.listPackersMoversEnquiries(query)
      .then((page) => {
        const data = Array.isArray(page) ? page : (page as any).data || [];
        const count = Array.isArray(page) ? data.length : (page as any).total || data.length;
        setEnquiries((prev) => (skip === 0 ? data : [...prev, ...data]));
        setTotal(count);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    loadPage(0);
  }, [status, dateFilter]);

  const filterActive = status !== 'ALL' || dateFilter !== 'ALL';

  const openFilter = () => {
    setDraftStatus(status);
    setDraftDateFilter(dateFilter);
    setFilterOpen(true);
  };

  const applyFilter = () => {
    setStatus(draftStatus);
    setDateFilter(draftDateFilter);
    setFilterOpen(false);
  };

  const clearFilter = () => {
    setDraftStatus('ALL');
    setDraftDateFilter('ALL');
    setStatus('ALL');
    setDateFilter('ALL');
    setFilterOpen(false);
  };

  const statusTone = (s: string) => {
    switch (s) {
      case 'SUBMITTED': return 'primary';
      case 'ASSIGNED': return 'success';
      case 'CANCELLED': return 'neutral';
      default: return 'neutral';
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs, backgroundColor: palette.background }}>
      <ScreenHeader
        title="Packers & Movers"
        right={
          <PressableScale onPress={openFilter} scaleTo={0.92}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: filterActive ? palette.navyTint : palette.surface,
                borderWidth: 1,
                borderColor: filterActive ? palette.navy : palette.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="options-outline" size={20} color={filterActive ? palette.navy : palette.ink} />
              {filterActive ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: palette.coral,
                  }}
                />
              ) : null}
            </View>
          </PressableScale>
        }
      />

      <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.xs, paddingBottom: spacing.sm }}>
        <LinearGradient
          colors={[palette.navy, palette.navyDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: radius.lg, overflow: 'hidden' }}
        >
          <FlatList
            ref={carouselRef}
            data={INFINITE_SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ width: slideWidth, padding: spacing.xl, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={item.icon as any} size={24} color={palette.white} />
                </View>
                <Text variant="h3" color={palette.white} align="center">
                  {item.text}
                </Text>
              </View>
            )}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: spacing.md }}>
            {BANNER_SLIDES.map((_, i) => (
              <View
                key={i}
                style={{
                  width: (activeSlide % BANNER_SLIDES.length) === i ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: (activeSlide % BANNER_SLIDES.length) === i ? palette.white : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </View>
        </LinearGradient>
        
        <Text variant="h3" style={{ marginTop: spacing.xl, marginBottom: spacing.xs }}>
          Your Enquiries
        </Text>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={104} rounded={radius.lg} />
          ))}
        </View>
      ) : (
        <FlatList
          data={enquiries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: spacing.base,
            paddingBottom: insets.bottom + 100, // Space for bottom button
            gap: spacing.md,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <PressableScale
                onPress={() => router.push({ pathname: '/packers-movers/[id]', params: { id: String(item.id) } })}
                scaleTo={0.99}
                style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name="truck-outline" size={18} color={palette.coral} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMd" weight="700">PCK-MV-{String(item.id).padStart(3, '0')}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Ionicons name="calendar-outline" size={12} color={palette.inkSecondary} />
                        <Text variant="caption" color={palette.inkSecondary}>
                          Submitted: {formatDate(item.created_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Badge label={item.status} tone={statusTone(item.status)} small />
                </View>
                
                {item.items && item.items.length > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, overflow: 'hidden' }}>
                    {item.items.map((chip, idx) => (
                      <View key={idx} style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: palette.surfaceRaised, borderRadius: radius.sm }}>
                        <Text variant="caption" numberOfLines={1}>{chip}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </PressableScale>
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyGeneric />}
              title={error ? "Couldn't load history" : 'No enquiries found'}
              message={error ?? (filterActive ? 'Try a different filter.' : "You haven't made any Packers & Movers enquiries yet.")}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && !error && enquiries.length < total) loadPage(enquiries.length);
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                <ActivityIndicator color={palette.coral} />
              </View>
            ) : null
          }
        />
      )}

      {/* Fixed Bottom Button */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Create new enquiry" onPress={() => router.push('/packers-movers/create-enquiry')} full size="lg" />
      </View>

      <Sheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filter">
        <View style={{ gap: spacing.lg }}>
          <View>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
              STATUS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {STATUS_FILTERS.map((f) => (
                <Chip key={f.key} label={f.label} active={draftStatus === f.key} onPress={() => setDraftStatus(f.key)} />
              ))}
            </View>
          </View>

          <View>
            <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>
              DATE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {DATE_FILTERS.map((f) => (
                <Chip key={f.key} label={f.label} active={draftDateFilter === f.key} onPress={() => setDraftDateFilter(f.key)} />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <Button label="Apply filter" full size="lg" onPress={applyFilter} />
            <Button label="Clear all" variant="ghost" full onPress={clearFilter} />
          </View>
        </View>
      </Sheet>
    </View>
  );
}
