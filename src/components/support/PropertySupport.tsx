/** Property support — maintenance tickets for the tenant's current property. Real
 *  `GET/POST /maintenance-management/maintenance`; property/floor/room/bed context comes
 *  from the tenant's active stay (`GET /tenant/beds`), same resolution My Stay uses. */
import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Button, Sheet, Input, EmptyState, Dropdown, Badge, Skeleton, AnimatedListItem, PressableScale, Divider } from '@/components/ui';
import type { Tone } from '@/components/ui';
import { EmptyTickets } from '@/components/illustrations';
import { stayApi, maintenanceApi, errorMessage, type ApiBedStay, type ApiMaintenanceTicket, type MaintenanceStatus } from '@/lib/api';
import { formatDate, titleCaseFromSnake } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { alert } from '@/lib/alertDialog';
import { session } from '@/lib/session';
import { useMasterData } from '@/context/MasterDataContext';
import { OptionalImagePicker } from './shared';

const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, Tone> = {
  NEW: 'warning',
  ASSIGNED: 'info',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  DISMISSED: 'neutral',
  CANCELLED: 'danger',
};

function statusTone(status: MaintenanceStatus): Tone {
  return STATUS_TONE[status] ?? 'neutral';
}

const RESOLVED_STATUSES = ['RESOLVED', 'DISMISSED', 'CANCELLED'];

export function PropertySupport() {
  const insets = useSafeAreaInsets();
  const { maintenanceCategories } = useMasterData();

  const [activeBed, setActiveBed] = useState<ApiBedStay | null>(null);
  const [bedLoading, setBedLoading] = useState(true);

  const [tickets, setTickets] = useState<ApiMaintenanceTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [create, setCreate] = useState(false);
  const [catId, setCatId] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<ApiMaintenanceTicket | null>(null);

  useEffect(() => {
    setBedLoading(true);
    stayApi.listBeds()
      .then(async (list) => {
        const preferred = await session.getSelectedBed();
        setActiveBed(stayApi.pickPreferredBed(list, preferred));
      })
      .catch(() => setActiveBed(null))
      .finally(() => setBedLoading(false));
  }, []);

  const loadPage = (skip: number, isRefresh = false) => {
    const setBusy = isRefresh ? setRefreshing : skip === 0 ? setLoading : setLoadingMore;
    setBusy(true);
    if (!isRefresh) setError(null);
    maintenanceApi.listMaintenance({ limit: PAGE_SIZE, skip })
      .then((page) => {
        setTickets((prev) => (skip === 0 ? page.data : [...prev, ...page.data]));
        setTotal(page.total);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOptions = maintenanceCategories
    .filter((c) => c.status === 'ACTIVE')
    .sort((a, b) => a.priority - b.priority)
    .map((c) => ({ label: c.name, value: String(c.id) }));

  const openTickets = tickets.filter((t) => !RESOLVED_STATUSES.includes(t.status));
  const resolvedTickets = tickets.filter((t) => RESOLVED_STATUSES.includes(t.status));

  const submitComplaint = () => {
    if (!activeBed) {
      alert('No active stay', 'You need an active booking to raise a maintenance issue.');
      return;
    }
    if (!catId) {
      alert('Select an issue type', 'Choose the type of issue you want to report.');
      return;
    }
    setSubmitting(true);
    maintenanceApi.createMaintenance({
      category_id: Number(catId),
      description: desc.trim() || 'Issue reported for the property.',
      images,
      property_id: activeBed.property.id,
      floor_id: activeBed.floor.id,
      room_id: activeBed.room.id,
      bed_id: activeBed.bed.id,
    })
      .then((ticket) => {
        setTickets((prev) => [ticket, ...prev]);
        setTotal((t) => t + 1);
        haptic.success();
        setCreate(false);
        setCatId(null);
        setDesc('');
        setImages([]);
        alert('Complaint raised', 'Your issue has been logged. The property team will pick it up.');
      })
      .catch((e) => alert('Could not raise complaint', errorMessage(e)))
      .finally(() => setSubmitting(false));
  };

  const refreshDetail = (id: number) => {
    maintenanceApi.getMaintenance(id)
      .then((fresh) => {
        setSelected(fresh);
        setTickets((prev) => prev.map((t) => (t.id === fresh.id ? fresh : t)));
      })
      .catch(() => {});
  };

  const openTicket = (ticket: ApiMaintenanceTicket) => {
    setSelected(ticket);
    refreshDetail(ticket.id);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Property support" subtitle="Raise maintenance and stay-related issues for your current property" />
      {loading ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.base }}>
          <Skeleton width="100%" height={140} rounded={radius.lg} />
          {[0, 1].map((i) => <Skeleton key={i} width="100%" height={72} rounded={radius.lg} />)}
        </View>
      ) : (
        <FlatList
          data={openTickets}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.base, paddingTop: spacing.sm }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPage(0, true)} tintColor={palette.coral} colors={[palette.coral]} />}
          ListHeaderComponent={
            <View style={{ gap: spacing.base }}>
              <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="construct-outline" size={22} color={palette.coralDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMd" weight="700">Need help with your stay?</Text>
                    <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: 2 }}>
                      Report maintenance, facilities, food, security, or other stay-related issues for your current property.
                    </Text>
                    {activeBed ? (
                      <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 8 }}>
                        {activeBed.property.name} · Room {activeBed.room.room_number} · Bed {activeBed.bed.bed_number}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Button
                  label="Raise property issue"
                  icon="paper-plane-outline"
                  full
                  style={{ marginTop: spacing.base }}
                  onPress={() => setCreate(true)}
                  disabled={bedLoading || !activeBed}
                />
              </View>
              <Text variant="overline" color={palette.inkTertiary} style={{ marginLeft: 4 }}>OPEN PROPERTY TICKETS</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <MaintenanceRow ticket={item} onPress={() => openTicket(item)} />
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyTickets />}
              title={error ? "Couldn't load tickets" : 'No active property issues'}
              message={error ?? 'Raise an issue and the property team will pick it up.'}
              actionLabel={error ? 'Retry' : 'Raise property issue'}
              onAction={error ? () => loadPage(0) : () => setCreate(true)}
            />
          }
          ListFooterComponent={
            <View style={{ gap: spacing.base }}>
              {loadingMore ? (
                <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                  <ActivityIndicator color={palette.coral} />
                </View>
              ) : null}
              <View>
                <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>RESOLVED PROPERTY TICKETS</Text>
                {resolvedTickets.length ? (
                  <View style={{ gap: spacing.md }}>
                    {resolvedTickets.map((item) => <MaintenanceRow key={item.id} ticket={item} onPress={() => openTicket(item)} />)}
                  </View>
                ) : (
                  <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
                    <Text variant="bodySm" color={palette.inkSecondary}>No resolved property issues yet.</Text>
                  </View>
                )}
              </View>
            </View>
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && !error && tickets.length < total) loadPage(tickets.length);
          }}
        />
      )}

      <Sheet visible={create} onClose={() => setCreate(false)} title="Raise a property issue" scroll>
        <View style={{ gap: spacing.base }}>
          <Dropdown
            label="Issue type"
            placeholder="Select issue type"
            value={catId}
            options={categoryOptions}
            onChange={setCatId}
            pickerTitle="Select issue type"
          />
          {activeBed ? (
            <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base }}>
              <Text variant="bodySm" weight="600">{activeBed.property.name}</Text>
              <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 4 }}>
                {activeBed.property.locality} · Room {activeBed.room.room_number} · Bed {activeBed.bed.bed_number}
              </Text>
            </View>
          ) : null}
          <Input label="Description" placeholder="Describe the issue in your property (max 500 chars)" value={desc} onChangeText={setDesc} multiline maxLength={500} style={{ height: 100, textAlignVertical: 'top' }} />
          <OptionalImagePicker onChange={setImages} />
          <Button label="Submit" icon="paper-plane-outline" onPress={submitComplaint} full size="lg" loading={submitting} disabled={submitting} />
        </View>
      </Sheet>

      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.category_name} · ${selected.code ?? `#${selected.id}`}` : ''} scroll>
        {selected ? <MaintenanceDetail ticket={selected} /> : null}
      </Sheet>
    </View>
  );
}

function MaintenanceRow({ ticket: t, onPress }: { ticket: ApiMaintenanceTicket; onPress?: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
      <View style={{ width: 42, height: 42, borderRadius: radius.md, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="construct-outline" size={20} color={t.status === 'RESOLVED' ? palette.success : palette.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd" weight="600" numberOfLines={1}>{t.category_name}</Text>
        <Text variant="caption" color={palette.inkTertiary} numberOfLines={1}>{t.code ?? `#${t.id}`} · {formatDate(t.created_at)}</Text>
      </View>
      <Badge label={titleCaseFromSnake(t.status)} tone={statusTone(t.status)} small />
    </PressableScale>
  );
}

function MaintenanceDetail({ ticket: t }: { ticket: ApiMaintenanceTicket }) {
  return (
    <View style={{ gap: spacing.base }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" color={palette.inkTertiary}>Raised {formatDate(t.created_at)}</Text>
        <Badge label={titleCaseFromSnake(t.status)} tone={statusTone(t.status)} small />
      </View>
      <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base }}>
        <Text variant="body" color={palette.inkSecondary}>{t.description}</Text>
      </View>
      {t.images.length ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {t.images.map((uri) => (
            <Image key={uri} source={{ uri }} style={{ width: 64, height: 64, borderRadius: radius.md }} contentFit="cover" />
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: 'row' }}>
        <DetailField label="Priority" value={titleCaseFromSnake(t.priority)} />
        <DetailField label="Room / Bed" value={`${t.room_number} · ${t.bed_number}`} />
      </View>
      {t.assigned_staff_name ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.infoTint, borderRadius: radius.md, padding: spacing.base }}>
          <Ionicons name="person-outline" size={18} color={palette.info} />
          <Text variant="bodySm" color={palette.info} style={{ flex: 1 }}>Assigned to {t.assigned_staff_name}</Text>
        </View>
      ) : null}
      {t.manager_notes ? (
        <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base, flexDirection: 'row', gap: spacing.sm }}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={palette.inkSecondary} />
          <Text variant="bodySm" color={palette.inkSecondary} style={{ flex: 1 }}>{t.manager_notes}</Text>
        </View>
      ) : null}
      {t.status === 'RESOLVED' && t.resolved_by_name ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.successTint, borderRadius: radius.md, padding: spacing.base }}>
          <Ionicons name="checkmark-circle-outline" size={18} color={palette.success} />
          <Text variant="bodySm" color={palette.success} style={{ flex: 1 }}>
            Resolved by {t.resolved_by_name}{t.resolved_on ? ` · ${formatDate(t.resolved_on)}` : ''}
          </Text>
        </View>
      ) : null}
      <Divider />
      <View>
        <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>TIMELINE</Text>
        <View style={{ gap: spacing.md }}>
          <TimelineRow label="Raised" at={t.created_at} />
          {t.assigned_on ? <TimelineRow label="Assigned" at={t.assigned_on} note={t.assigned_staff_name ?? undefined} /> : null}
          {t.started_on ? <TimelineRow label="Started" at={t.started_on} /> : null}
          {t.resolved_on ? <TimelineRow label="Resolved" at={t.resolved_on} note={t.resolved_by_name ?? undefined} /> : null}
          {t.dismissed_on ? <TimelineRow label="Dismissed" at={t.dismissed_on} note={t.dismissed_by_name ?? undefined} /> : null}
          {t.cancelled_on ? <TimelineRow label="Cancelled" at={t.cancelled_on} /> : null}
        </View>
      </View>
    </View>
  );
}

function TimelineRow({ label, at, note }: { label: string; at: string; note?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: palette.coral, marginTop: 3 }} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd" weight="600">{label}</Text>
        {note ? <Text variant="bodySm" color={palette.inkSecondary}>{note}</Text> : null}
        <Text variant="caption" color={palette.inkTertiary}>{formatDate(at)}</Text>
      </View>
    </View>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="caption" color={palette.inkTertiary}>{label}</Text>
      <Text variant="bodyMd" weight="700" style={{ marginTop: 2 }}>{value}</Text>
    </View>
  );
}
