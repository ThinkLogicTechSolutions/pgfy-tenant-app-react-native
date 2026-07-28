/** T-S22 — Visitor access management. Real `GET/POST/PATCH/DELETE
 *  /tenant-management/visitor-log`; property/floor/room/bed context comes from the tenant's
 *  active stay (`GET /tenant/beds`), same resolution My Stay uses. */
import { useEffect, useRef, useState } from 'react';
import { View, FlatList, ActivityIndicator, RefreshControl, Platform, Share } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Button, Sheet, Input, IconButton, EmptyState, Badge, Skeleton, AnimatedListItem, PressableScale } from '@/components/ui';
import { EmptyGeneric } from '@/components/illustrations';
import { stayApi, visitorLogApi, errorMessage, type ApiBedStay, type ApiVisitorLog, type VisitorLogStatus } from '@/lib/api';
import { formatDate, formatTime12h, titleCaseFromSnake } from '@/lib/format';
import { startOfToday } from '@/lib/calendar';
import { haptic } from '@/lib/haptics';
import { alert } from '@/lib/alertDialog';
import { session } from '@/lib/session';
import type { Tone } from '@/components/ui';

const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, Tone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'neutral',
};

function statusTone(status: VisitorLogStatus): Tone {
  return STATUS_TONE[status] ?? 'neutral';
}

function defaultEntryTime(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function defaultExitTime(): Date {
  const d = defaultEntryTime();
  d.setHours(d.getHours() + 8);
  return d;
}

/** Same wall-clock day as `date`, but at `time`'s hour/minute. */
function combineDateAndTime(date: Date, time: Date): Date {
  const d = new Date(date);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d;
}

interface VisitorForm {
  name: string;
  phone: string;
  date: Date;
  entryTime: Date;
  exitTime: Date;
  purpose: string;
}

function emptyForm(): VisitorForm {
  return { name: '', phone: '', date: startOfToday(), entryTime: defaultEntryTime(), exitTime: defaultExitTime(), purpose: '' };
}

export default function Visitors() {
  const insets = useSafeAreaInsets();

  const [activeBed, setActiveBed] = useState<ApiBedStay | null>(null);
  const [bedLoading, setBedLoading] = useState(true);

  const [logs, setLogs] = useState<ApiVisitorLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<VisitorForm>(emptyForm);
  const [picker, setPicker] = useState<'date' | 'entry' | 'exit' | null>(null);

  // Which row just regenerated its OTP — drives that tile's transient toast, auto-dismissed.
  const [regeneratedId, setRegeneratedId] = useState<number | null>(null);
  const regeneratedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (regeneratedTimer.current) clearTimeout(regeneratedTimer.current);
  }, []);

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
    visitorLogApi.listVisitorLogs({ limit: PAGE_SIZE, skip })
      .then((page) => {
        setLogs((prev) => (skip === 0 ? page.data : [...prev, ...page.data]));
        setTotal(page.total);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = () => {
    setForm(emptyForm());
    setSubmitted(false);
    setOpen(true);
  };

  const closeSheet = () => {
    setOpen(false);
    setSubmitted(false);
  };

  const set = <K extends keyof VisitorForm>(key: K) => (value: VisitorForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!activeBed) {
      alert('No active stay', 'You need an active booking to register a visitor.');
      return;
    }
    if (!form.name.trim() || !form.phone.trim()) {
      alert('Missing details', 'Enter the visitor’s name and phone number.');
      return;
    }
    setSubmitting(true);
    visitorLogApi.createVisitorLog({
      name: form.name.trim(),
      phone: form.phone.trim(),
      visit_date: combineDateAndTime(form.date, form.entryTime).toISOString(),
      visit_purpose: form.purpose.trim() || 'Visit',
      expected_exit_time: combineDateAndTime(form.date, form.exitTime).toISOString(),
      property_id: activeBed.property.id,
      floor_id: activeBed.floor.id,
      room_id: activeBed.room.id,
      bed_id: activeBed.bed.id,
    })
      .then((created) => {
        setLogs((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
        haptic.success();
        setSubmitted(true);
      })
      .catch((e) => alert('Could not register visitor', errorMessage(e)))
      .finally(() => setSubmitting(false));
  };

  const regenerateOtp = (log: ApiVisitorLog) => {
    visitorLogApi.regenerateVisitorOtp(log.id)
      .then((updated) => {
        setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        haptic.success();
        if (regeneratedTimer.current) clearTimeout(regeneratedTimer.current);
        setRegeneratedId(updated.id);
        regeneratedTimer.current = setTimeout(() => setRegeneratedId(null), 2200);
      })
      .catch((e) => alert('Could not regenerate OTP', errorMessage(e)));
  };

  const shareOtp = (log: ApiVisitorLog) => {
    haptic.light();
    Share.share({ message: `Visitor OTP for ${log.name}: ${log.otp_code}. Valid for the scheduled visit on ${formatDate(log.visit_date)}.` }).catch(() => {});
  };

  const deleteLog = (log: ApiVisitorLog) => {
    alert('Remove visitor', `Remove ${log.name} from your visitor log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          visitorLogApi.deleteVisitorLog(log.id)
            .then(() => {
              setLogs((prev) => prev.filter((l) => l.id !== log.id));
              setTotal((t) => Math.max(0, t - 1));
            })
            .catch((e) => alert('Could not remove visitor', errorMessage(e)));
        },
      },
    ]);
  };

  const onPickerChange = (field: 'date' | 'entry' | 'exit') => (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type === 'dismissed' || !selected) {
      if (Platform.OS === 'android') return;
      setPicker(null);
      return;
    }
    if (field === 'date') set('date')(selected);
    else if (field === 'entry') set('entryTime')(selected);
    else set('exitTime')(selected);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Visitor access" subtitle="Register and manage visitors" right={<IconButton icon="add" color={palette.white} bg={palette.coral} onPress={openNew} />} />

      {loading ? (
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.md }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={104} rounded={radius.lg} />
          ))}
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.md, paddingTop: spacing.sm }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPage(0, true)} tintColor={palette.coral} colors={[palette.coral]} />}
          ListHeaderComponent={<Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: 4 }}>VISITOR LOG</Text>}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index}>
              <VisitorRow
                visitor={item}
                onShare={() => shareOtp(item)}
                onRegenerate={() => regenerateOtp(item)}
                onDelete={() => deleteLog(item)}
                showRegeneratedToast={regeneratedId === item.id}
              />
            </AnimatedListItem>
          )}
          ListEmptyComponent={
            <EmptyState
              illustration={<EmptyGeneric />}
              title={error ? "Couldn't load visitors" : 'No visitors yet'}
              message={error ?? 'Register a visitor to let them in.'}
              actionLabel={error ? 'Retry' : undefined}
              onAction={error ? () => loadPage(0) : undefined}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && !error && logs.length < total) loadPage(logs.length);
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

      <Sheet visible={open} onClose={closeSheet} title={submitted ? 'Visitor created successfully' : 'New visitor'} scroll>
        {submitted ? (
          <View style={{ gap: spacing.lg, alignItems: 'center', paddingVertical: spacing.md }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.successTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark-circle" size={40} color={palette.success} />
            </View>
            <Text variant="body" color={palette.inkSecondary} align="center">
              {form.name.trim() ? `${form.name.trim()} has been registered.` : 'Your visitor has been registered.'} Property staff will be notified.
            </Text>
            <Button label="Done" onPress={closeSheet} full size="lg" />
          </View>
        ) : (
          <View style={{ gap: spacing.base }}>
            {!bedLoading && !activeBed ? (
              <View style={{ backgroundColor: palette.warningTint, borderRadius: radius.md, padding: spacing.base }}>
                <Text variant="bodySm" color={palette.warning}>You need an active booking to register a visitor.</Text>
              </View>
            ) : null}
            <Input label="Visitor name" icon="person-outline" placeholder="Full name" value={form.name} onChangeText={set('name')} />
            <Input label="Phone number" icon="call-outline" keyboardType="number-pad" placeholder="10-digit mobile" value={form.phone} onChangeText={set('phone')} />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <PickerField label="Visit date" icon="calendar-outline" value={formatDate(form.date.toISOString())} onPress={() => setPicker(picker === 'date' ? null : 'date')} />
              <PickerField label="Entry time" icon="time-outline" value={formatTime12h(form.entryTime)} onPress={() => setPicker(picker === 'entry' ? null : 'entry')} />
            </View>
            <PickerField label="Expected exit time" icon="time-outline" value={formatTime12h(form.exitTime)} onPress={() => setPicker(picker === 'exit' ? null : 'exit')} />

            {picker === 'date' ? (
              <View style={pickerWrapStyle}>
                <DateTimePicker value={form.date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={startOfToday()} onChange={onPickerChange('date')} themeVariant="light" textColor={palette.ink} accentColor={palette.coral} />
                {Platform.OS === 'ios' ? <DoneButton onPress={() => setPicker(null)} /> : null}
              </View>
            ) : null}
            {picker === 'entry' ? (
              <View style={pickerWrapStyle}>
                <DateTimePicker value={form.entryTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} is24Hour={false} onChange={onPickerChange('entry')} themeVariant="light" textColor={palette.ink} accentColor={palette.coral} />
                {Platform.OS === 'ios' ? <DoneButton onPress={() => setPicker(null)} /> : null}
              </View>
            ) : null}
            {picker === 'exit' ? (
              <View style={pickerWrapStyle}>
                <DateTimePicker value={form.exitTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} is24Hour={false} onChange={onPickerChange('exit')} themeVariant="light" textColor={palette.ink} accentColor={palette.coral} />
                {Platform.OS === 'ios' ? <DoneButton onPress={() => setPicker(null)} /> : null}
              </View>
            ) : null}

            <Input label="Purpose" icon="flag-outline" placeholder="e.g. Meeting, delivery, family visit" value={form.purpose} onChangeText={set('purpose')} />
            <Button label="Submit" icon="checkmark" onPress={submit} full size="lg" loading={submitting} disabled={submitting} />
          </View>
        )}
      </Sheet>
    </View>
  );
}

function VisitorRow({
  visitor: v,
  onShare,
  onRegenerate,
  onDelete,
  showRegeneratedToast,
}: {
  visitor: ApiVisitorLog;
  onShare: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  showRegeneratedToast: boolean;
}) {
  const pending = v.status === 'PENDING';
  return (
    <View style={{ backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: pending ? palette.coral : palette.border, padding: spacing.base, gap: spacing.sm }}>
      {showRegeneratedToast ? (
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(200)}
          style={{
            position: 'absolute',
            top: -12,
            right: spacing.base,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: palette.navy,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: radius.pill,
            zIndex: 10,
            elevation: 4,
          }}
        >
          <Ionicons name="checkmark-circle" size={14} color={palette.success} />
          <Text variant="caption" weight="600" color={palette.white}>OTP regenerated</Text>
        </Animated.View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyMd" weight="600">{v.name}</Text>
          <Text variant="caption" color={palette.inkTertiary}>{v.phone} · {formatDate(v.visit_date)} {formatTime12h(new Date(v.visit_date))}</Text>
          {v.visit_purpose ? <Text variant="caption" color={palette.inkTertiary}>{v.visit_purpose}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Badge label={titleCaseFromSnake(v.status)} tone={statusTone(v.status)} small />
          <PressableScale onPress={onDelete} scaleTo={0.85} style={{ padding: 2 }}>
            <Ionicons name="trash-outline" size={17} color={palette.inkTertiary} />
          </PressableScale>
        </View>
      </View>
      {pending ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: palette.coralTint, borderRadius: radius.md, padding: spacing.md }}>
          <View>
            <Text variant="caption" color={palette.coralDark}>VISITOR OTP</Text>
            <Text variant="h2" mono color={palette.coralDark} style={{ letterSpacing: 4 }}>{v.otp_code}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <PressableScale onPress={onRegenerate} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: palette.surface, paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1, borderColor: palette.coral }}>
              <Ionicons name="refresh-outline" size={15} color={palette.coralDark} />
            </PressableScale>
            <PressableScale onPress={onShare} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: palette.coral, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md }}>
              <Ionicons name="share-social-outline" size={15} color={palette.white} />
              <Text variant="bodySm" weight="600" color={palette.white}>Share</Text>
            </PressableScale>
          </View>
        </View>
      ) : (
        <Text variant="caption" color={palette.inkTertiary}>
          In {v.actual_in_time ? formatTime12h(new Date(v.actual_in_time)) : '—'} · Out {v.actual_out_time ? formatTime12h(new Date(v.actual_out_time)) : '—'}
        </Text>
      )}
    </View>
  );
}

const pickerWrapStyle = {
  backgroundColor: palette.surface,
  borderRadius: radius.md,
  borderWidth: 1,
  borderColor: palette.border,
  overflow: 'hidden' as const,
};

function DoneButton({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} style={{ alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
      <Text variant="bodySm" weight="600" color={palette.coralDark}>Done</Text>
    </PressableScale>
  );
}

function PickerField({
  label,
  icon,
  value,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onPress: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="caption" color={palette.inkSecondary} style={{ marginBottom: 6 }}>{label}</Text>
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
        <Ionicons name={icon} size={18} color={palette.inkTertiary} />
        <Text variant="body" color={palette.ink} style={{ flex: 1 }} numberOfLines={1}>{value}</Text>
        <Ionicons name="chevron-down" size={18} color={palette.inkTertiary} />
      </PressableScale>
    </View>
  );
}
