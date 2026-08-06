/** Platform support — FAQs, account queries, and platform tickets. Real `GET /support/faq`
 *  (preview of 5, "View all" opens the full paginated list) and `GET/POST /support/support-query`. */
import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Button, Sheet, Input, EmptyState, Dropdown, Badge, Skeleton, AnimatedListItem, PressableScale, Divider } from '@/components/ui';
import type { Tone } from '@/components/ui';
import { EmptyTickets } from '@/components/illustrations';
import {
  supportApi,
  uploadApi,
  errorMessage,
  type ApiFaq,
  type ApiSupportQuery,
  type ApiSupportQueryAttachment,
  type SupportQueryStatus,
} from '@/lib/api';
import { formatDate, titleCaseFromSnake } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { alert } from '@/lib/alertDialog';
import { useMasterData } from '@/context/MasterDataContext';
import { FaqAccordion, OptionalImagePicker } from './shared';

const PAGE_SIZE = 20;
const FAQ_PREVIEW_COUNT = 5;

const STATUS_TONE: Record<string, Tone> = {
  PENDING: 'warning',
  RESOLVED: 'success',
};

function statusTone(status: SupportQueryStatus): Tone {
  return STATUS_TONE[status] ?? 'neutral';
}

export function PlatformSupport() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { supportCategories } = useMasterData();

  const [faqs, setFaqs] = useState<ApiFaq[] | null>(null);

  const [tickets, setTickets] = useState<ApiSupportQuery[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [create, setCreate] = useState(false);
  const [catId, setCatId] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [attachments, setAttachments] = useState<ApiSupportQueryAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<ApiSupportQuery | null>(null);

  useEffect(() => {
    supportApi.listFaqs({ panel: 'TENANT', limit: FAQ_PREVIEW_COUNT, skip: 0 })
      .then((page) => setFaqs(page.data))
      .catch(() => setFaqs([]));
  }, []);

  const loadPage = (skip: number, isRefresh = false) => {
    const setBusy = isRefresh ? setRefreshing : skip === 0 ? setLoading : setLoadingMore;
    setBusy(true);
    if (!isRefresh) setError(null);
    supportApi.listSupportQueries({ limit: PAGE_SIZE, skip })
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

  const categoryOptions = supportCategories
    .filter((c) => c.status === 'ACTIVE' && c.panel === 'TENANT')
    .sort((a, b) => a.priority - b.priority)
    .map((c) => ({ label: c.name, value: String(c.id) }));

  const openTickets = tickets.filter((t) => t.status !== 'RESOLVED');
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED');

  const submitQuery = () => {
    if (!catId) {
      alert('Select a category', 'Choose what your query is about.');
      return;
    }
    if (!desc.trim()) {
      alert('Add a description', 'Tell us more about the issue.');
      return;
    }
    setSubmitting(true);
    supportApi.createSupportQuery({
      category_id: Number(catId),
      description: desc.trim(),
      attachments,
    })
      .then((query) => {
        setTickets((prev) => [query, ...prev]);
        setTotal((t) => t + 1);
        haptic.success();
        setCreate(false);
        setCatId(null);
        setDesc('');
        setAttachments([]);
        alert('Query submitted', "We've received your query — our team will get back to you shortly.");
      })
      .catch((e) => alert("Couldn't submit query", errorMessage(e)))
      .finally(() => setSubmitting(false));
  };

  const openTicket = (ticket: ApiSupportQuery) => {
    setSelected(ticket);
    supportApi.getSupportQuery(ticket.id)
      .then((fresh) => {
        setSelected(fresh);
        setTickets((prev) => prev.map((t) => (t.id === fresh.id ? fresh : t)));
      })
      .catch(() => {});
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Support & FAQs" subtitle="Platform help, account queries, and FAQs" />
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
              {/* FAQs — preview of 5, "View all" opens the full paginated list */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, marginLeft: 4 }}>
                  <Text variant="overline" color={palette.inkTertiary}>FAQS</Text>
                  <PressableScale onPress={() => router.push('/faqs')} haptics={false}>
                    <Text variant="bodySm" weight="600" color={palette.coralDark}>View all</Text>
                  </PressableScale>
                </View>
                {faqs == null ? (
                  <View style={{ gap: spacing.sm }}>
                    {[0, 1, 2].map((i) => <Skeleton key={i} width="100%" height={52} rounded={radius.lg} />)}
                  </View>
                ) : faqs.length ? (
                  <FaqAccordion items={faqs.map((f) => ({ q: f.question, a: f.answer }))} showTitle={false} />
                ) : (
                  <Text variant="bodySm" color={palette.inkTertiary}>No FAQs published yet.</Text>
                )}
              </View>

              <View>
                <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>RAISE A QUERY</Text>
                <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="help-buoy-outline" size={22} color={palette.coralDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMd" weight="700">Need help with the platform?</Text>
                      <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: 2 }}>
                        Report account access problems, KYC issues, invoice issues, and other platform-related problems.
                      </Text>
                    </View>
                  </View>
                  <Button label="Raise query" icon="paper-plane-outline" full style={{ marginTop: spacing.base }} onPress={() => setCreate(true)} />
                </View>
              </View>

              <Text variant="overline" color={palette.inkTertiary} style={{ marginLeft: 4 }}>GENERATED SUPPORTS</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <SupportQueryRow query={item} onPress={() => openTicket(item)} />
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyTickets />}
              title={error ? "Couldn't load queries" : 'No active queries'}
              message={error ?? "Raise a query and we'll get on it."}
              actionLabel={error ? 'Retry' : 'Raise query'}
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
                <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>RESOLVED SUPPORTS</Text>
                {resolvedTickets.length ? (
                  <View style={{ gap: spacing.md }}>
                    {resolvedTickets.map((item) => <SupportQueryRow key={item.id} query={item} onPress={() => openTicket(item)} />)}
                  </View>
                ) : (
                  <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
                    <Text variant="bodySm" color={palette.inkSecondary}>No resolved supports yet.</Text>
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

      <Sheet visible={create} onClose={() => setCreate(false)} title="Raise a query" scroll>
        <View style={{ gap: spacing.base }}>
          <Dropdown
            label="Category"
            placeholder="Select category"
            value={catId}
            options={categoryOptions}
            onChange={setCatId}
            pickerTitle="Select category"
          />
          <Input label="Description" placeholder="Describe the platform issue (max 500 chars)" value={desc} onChangeText={setDesc} multiline maxLength={500} style={{ height: 100, textAlignVertical: 'top' }} />
          <OptionalImagePicker onUploaded={setAttachments} uploader={uploadApi.uploadSupportQueryImage} />
          <Button label="Submit" icon="paper-plane-outline" onPress={submitQuery} full size="lg" loading={submitting} disabled={submitting} />
        </View>
      </Sheet>

      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.category?.name ?? 'Query'} · #${selected.id}` : ''} scroll>
        {selected ? <SupportQueryDetail query={selected} /> : null}
      </Sheet>
    </View>
  );
}

function SupportQueryRow({ query: q, onPress }: { query: ApiSupportQuery; onPress?: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, padding: spacing.base }}>
      <View style={{ width: 42, height: 42, borderRadius: radius.md, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="help-buoy-outline" size={20} color={q.status === 'RESOLVED' ? palette.success : palette.navy} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd" weight="600" numberOfLines={1}>{q.category?.name ?? 'Query'}</Text>
        <Text variant="caption" color={palette.inkTertiary} numberOfLines={1}>#{q.id} · {formatDate(q.created_at)}</Text>
      </View>
      <Badge label={titleCaseFromSnake(q.status)} tone={statusTone(q.status)} small />
    </PressableScale>
  );
}

function SupportQueryDetail({ query: q }: { query: ApiSupportQuery }) {
  return (
    <View style={{ gap: spacing.base }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" color={palette.inkTertiary}>Raised {formatDate(q.created_at)}</Text>
        <Badge label={titleCaseFromSnake(q.status)} tone={statusTone(q.status)} small />
      </View>
      <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base }}>
        <Text variant="body" color={palette.inkSecondary}>{q.description}</Text>
      </View>
      {q.attachments?.length ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          {q.attachments.map((a, i) => (
            <Image key={a.link ?? i} source={{ uri: a.link }} style={{ width: 64, height: 64, borderRadius: radius.md }} contentFit="cover" />
          ))}
        </View>
      ) : null}
      {q.status === 'RESOLVED' && q.resolved_by_name ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.successTint, borderRadius: radius.md, padding: spacing.base }}>
          <Ionicons name="checkmark-circle-outline" size={18} color={palette.success} />
          <Text variant="bodySm" color={palette.success} style={{ flex: 1 }}>
            Resolved by {q.resolved_by_name}{q.resolved_on ? ` · ${formatDate(q.resolved_on)}` : ''}
          </Text>
        </View>
      ) : null}
      <Divider />
      <View>
        <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>TIMELINE</Text>
        <View style={{ gap: spacing.md }}>
          <TimelineRow label="Raised" at={q.created_at} />
          {q.resolved_on ? <TimelineRow label="Resolved" at={q.resolved_on} note={q.resolved_by_name ?? undefined} /> : null}
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
