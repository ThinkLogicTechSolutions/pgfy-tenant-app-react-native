/** T-S25 — Move-out / exit request with settlement estimate. Real `GET/POST
 *  /tenant/move-out`; property/floor/room/bed/booking context comes from the tenant's active
 *  stay (`GET /tenant/beds`), same resolution My Stay uses. On open, the screen checks whether
 *  a move-out request already exists for the current booking — if so it shows that request's
 *  details instead of the create form (a booking only ever has one move-out request). */
import { useEffect, useState } from 'react';
import { View, ScrollView, RefreshControl, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Divider, Sheet, Badge, Skeleton, PressableScale } from '@/components/ui';
import type { Tone } from '@/components/ui';
import { SuccessBurst } from '@/components/illustrations';
import { BankDetailsForm } from '@/components/profile/BankDetailsForm';
import { inr, formatDate, titleCaseFromSnake } from '@/lib/format';
import { toIso, startOfToday } from '@/lib/calendar';
import { haptic } from '@/lib/haptics';
import { isBankDetailsComplete, bankDetailsSummary } from '@/lib/bankDetails';
import { useAuth } from '@/context/AuthContext';
import {
  stayApi, moveOutApi, errorMessage,
  type ApiBedStay, type ApiMoveOutRequest, type ApiMoveOutEstimate, type MoveOutStatus, type MoveOutRefundStatus, type BankDetails,
} from '@/lib/api';
import { session } from '@/lib/session';
import { alert } from '@/lib/alertDialog';

const STATUS_TONE: Record<string, Tone> = {
  REQUESTED: 'warning',
  INSPECTING: 'info',
  AWAITING_PAYMENT: 'info',
  APPROVED: 'success',
  CHECKED_OUT: 'success',
  REJECTED: 'danger',
};

function statusTone(status: MoveOutStatus): Tone {
  return STATUS_TONE[status] ?? 'neutral';
}

/** Human-readable status copy — mirrors `MoveOutStatusEnum` on the backend. */
function statusMessage(r: ApiMoveOutRequest): string {
  switch (r.status) {
    case 'REQUESTED':
      return 'Your request is awaiting review by the property team.';
    case 'INSPECTING':
      return 'The property team is inspecting your room before finalising the settlement.';
    case 'AWAITING_PAYMENT':
      return 'Settlement finalised — your refund payment is being processed.';
    case 'APPROVED':
      return 'Approved. Complete your check-out on the scheduled move-out date.';
    case 'CHECKED_OUT':
      return 'You have checked out successfully.';
    case 'REJECTED':
      return r.rejection_reason ?? 'Your move-out request was rejected.';
    default:
      return titleCaseFromSnake(r.status);
  }
}

/** Mirrors `MoveOutRefundStatusEnum` on the backend. */
function refundStatusMessage(status: MoveOutRefundStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Refund is being processed.';
    case 'PAID':
      return 'Refund has been paid out.';
    case 'NOT_APPLICABLE':
      return 'No refund applicable.';
    default:
      return titleCaseFromSnake(status);
  }
}

function bannerColors(tone: Tone): { bg: string; fg: string } {
  if (tone === 'danger') return { bg: palette.dangerTint, fg: palette.danger };
  if (tone === 'success') return { bg: palette.successTint, fg: palette.success };
  if (tone === 'info') return { bg: palette.infoTint, fg: palette.info };
  return { bg: palette.warningTint, fg: palette.warning };
}

function defaultMoveOutDate(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + 30);
  return d;
}

export default function MoveOut() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const bankDetails = user?.bank_details ?? null;
  const bankComplete = isBankDetailsComplete(bankDetails);
  const bankSummary = bankDetailsSummary(bankDetails);

  const [activeBed, setActiveBed] = useState<ApiBedStay | null>(null);
  const [bedLoading, setBedLoading] = useState(true);

  const [existingRequest, setExistingRequest] = useState<ApiMoveOutRequest | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(defaultMoveOutDate);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [estimate, setEstimate] = useState<ApiMoveOutEstimate | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<ApiMoveOutRequest | null>(null);

  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const checkExisting = (bookingId: number, isRefresh = false) => {
    (isRefresh ? setRefreshing : setCheckingExisting)(true);
    setError(null);
    moveOutApi.listMoveOuts({ bookingId, limit: 1 })
      .then((page) => setExistingRequest(page.data[0] ?? null))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => (isRefresh ? setRefreshing : setCheckingExisting)(false));
  };

  useEffect(() => {
    setBedLoading(true);
    stayApi.listBeds()
      .then(async (list) => {
        const preferred = await session.getSelectedBed();
        const bed = stayApi.pickPreferredBed(list, preferred);
        setActiveBed(bed);
        if (bed) {
          checkExisting(bed.booking.id);
        } else {
          setCheckingExisting(false);
        }
      })
      .catch(() => {
        setActiveBed(null);
        setCheckingExisting(false);
      })
      .finally(() => setBedLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    if (activeBed) checkExisting(activeBed.booking.id, true);
  };

  // Live settlement preview for the chosen date — only relevant while there's no request
  // already raised for this booking.
  useEffect(() => {
    if (!activeBed || existingRequest) { setEstimate(null); return; }
    let active = true;
    setEstimateLoading(true);
    moveOutApi.getMoveOutEstimate({ bookingId: activeBed.booking.id, expectedMoveOut: toIso(selectedDate) })
      .then((data) => { if (active) setEstimate(data); })
      .catch(() => { if (active) setEstimate(null); })
      .finally(() => { if (active) setEstimateLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBed?.booking.id, !!existingRequest, selectedDate]);

  const submitExit = () => {
    if (!activeBed) return;
    setSubmitting(true);
    moveOutApi.createMoveOut({
      booking_id: activeBed.booking.id,
      expected_move_out: toIso(selectedDate),
      reason: reason.trim() || undefined,
    })
      .then((created) => {
        setExistingRequest(created);
        haptic.warning();
        setDone(created);
      })
      .catch((e) => alert('Could not submit request', errorMessage(e)))
      .finally(() => setSubmitting(false));
  };

  const onSubmitPress = () => {
    if (!bankComplete) {
      setBankSheetOpen(true);
      return;
    }
    submitExit();
  };

  const saveBankAndSubmit = async (details: BankDetails) => {
    setSavingBank(true);
    try {
      await updateProfile({ bank_details: details });
      haptic.success();
      setBankSheetOpen(false);
      submitExit();
    } catch (e) {
      haptic.error();
      alert("Couldn't save bank details", errorMessage(e));
    } finally {
      setSavingBank(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setDatePickerOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    setSelectedDate(selected);
  };

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Move out request submitted</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 300 }}>
          Property manager will review your request and proceed further.
        </Text>
        <Button label="Back to stay" onPress={() => router.replace('/(tabs)/stay')} style={{ marginTop: spacing.xl, alignSelf: 'center' }} />
      </View>
    );
  }

  if (bedLoading || checkingExisting) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
        <ScreenHeader title="Move out" subtitle="Submit your exit request" />
        <View style={{ paddingHorizontal: spacing.base, paddingTop: spacing.sm, gap: spacing.base }}>
          <Skeleton width="100%" height={90} rounded={radius.lg} />
          <Skeleton width="100%" height={110} rounded={radius.lg} />
          <Skeleton width="100%" height={140} rounded={radius.lg} />
          <Skeleton width="100%" height={72} rounded={radius.lg} />
        </View>
      </View>
    );
  }

  const notice = estimate?.notice;
  const settlement = estimate?.settlement;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Move out" subtitle="Submit your exit request" />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: existingRequest || !activeBed ? spacing['3xl'] : insets.bottom + 110, gap: spacing.base, paddingTop: spacing.sm }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.coral} colors={[palette.coral]} />}
      >
        {!activeBed ? (
          <Card>
            <Text variant="bodyMd" color={palette.inkSecondary}>
              {error ?? "You don't have an active stay to move out from."}
            </Text>
          </Card>
        ) : existingRequest ? (
          <MoveOutDetail request={existingRequest} />
        ) : (
          <>
            <Card onPress={() => setDatePickerOpen(true)}>
              <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>EXPECTED MOVE-OUT DATE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="calendar" size={20} color={palette.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMd" weight="600">{formatDate(toIso(selectedDate))}</Text>
                  {estimate ? (
                    <Text variant="caption" color={palette.inkTertiary}>
                      Notice-free from {formatDate(estimate.earliest_move_out)}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} />
              </View>
            </Card>

            {datePickerOpen ? (
              <View style={{ backgroundColor: palette.surface, borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={startOfToday()}
                  onChange={onDateChange}
                  themeVariant="light"
                  textColor={palette.ink}
                  accentColor={palette.coral}
                />
                {Platform.OS === 'ios' ? (
                  <PressableScale onPress={() => setDatePickerOpen(false)} scaleTo={0.98} style={{ alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
                    <Text variant="bodySm" weight="600" color={palette.coralDark}>Done</Text>
                  </PressableScale>
                ) : null}
              </View>
            ) : null}

            {estimateLoading && !estimate ? (
              <View style={{ gap: spacing.base }}>
                <Skeleton width="100%" height={90} rounded={radius.lg} />
                <Skeleton width="100%" height={140} rounded={radius.lg} />
              </View>
            ) : notice && settlement ? (
              <>
                <Card>
                  <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>NOTICE</Text>
                  <Row k="Required notice" v={`${notice.required_notice_days} days`} />
                  <Row k="Notice given" v={`${notice.notice_given_days} days`} />
                  <Row k="Within lock-in?" v={notice.within_lock_in ? 'Yes' : 'No'} last />
                </Card>

                <Card>
                  <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>SETTLEMENT ESTIMATE</Text>
                  <Row k="Security deposit" v={inr(settlement.security_deposit)} />
                  <Row k="Pending rent" v={`− ${inr(settlement.pending_rent)}`} neg={settlement.pending_rent > 0} />
                  <Row k="Damage estimate" v={`− ${inr(settlement.damage_estimate)}`} neg={settlement.damage_estimate > 0} />
                  <Row k="Short-notice penalty" v={`− ${inr(settlement.short_notice_penalty)}`} neg={settlement.short_notice_penalty > 0} />
                  <Divider style={{ marginVertical: spacing.sm }} />
                  <Row k="Estimated refund" v={inr(settlement.estimated_refund)} bold last />
                </Card>
              </>
            ) : null}

            <Card onPress={bankComplete ? () => router.push('/bank-details') : () => setBankSheetOpen(true)}>
              <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>REFUND BANK ACCOUNT</Text>
              {bankComplete ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.successTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark-circle" size={22} color={palette.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMd" weight="600">{bankDetails?.account_holder_name}</Text>
                    <Text variant="caption" color={palette.inkTertiary}>{bankSummary}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} />
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.warningTint, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="card-outline" size={20} color={palette.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMd" weight="600">Add bank details</Text>
                    <Text variant="caption" color={palette.inkSecondary}>Required before we can process your deposit refund</Text>
                  </View>
                </View>
              )}
            </Card>

            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Ionicons name="information-circle-outline" size={15} color={palette.inkTertiary} style={{ marginTop: 1 }} />
              <Text variant="caption" color={palette.inkTertiary} style={{ flex: 1 }}>Actual refund may vary based on final room inspection.</Text>
            </View>

            <Input label="Reason for moving out (optional)" placeholder="Help us improve" value={reason} onChangeText={setReason} multiline style={{ height: 80, textAlignVertical: 'top' }} />
          </>
        )}
      </ScrollView>

      {activeBed && !existingRequest ? (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
          <Button label="Submit exit request" variant="danger" icon="exit-outline" onPress={onSubmitPress} full size="lg" loading={submitting} disabled={submitting} />
        </View>
      ) : null}

      <Sheet visible={bankSheetOpen} onClose={() => setBankSheetOpen(false)} title="Bank details for refund" scroll>
        <Text variant="bodySm" color={palette.inkSecondary} style={{ marginBottom: spacing.base, lineHeight: 22 }}>
          Enter the account where your security deposit refund should be credited. You can update this later from Profile → Bank details.
        </Text>
        <BankDetailsForm
          initial={bankDetails ?? {}}
          onSubmit={saveBankAndSubmit}
          submitLabel="Save & submit exit request"
          loading={savingBank}
        />
      </Sheet>
    </View>
  );
}

function MoveOutDetail({ request: r }: { request: ApiMoveOutRequest }) {
  const tone = statusTone(r.status);
  const { bg, fg } = bannerColors(tone);
  return (
    <View style={{ gap: spacing.base }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="overline" color={palette.inkTertiary}>YOUR EXIT REQUEST</Text>
        <Badge label={titleCaseFromSnake(r.status)} tone={tone} small />
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: bg, borderRadius: radius.md, padding: spacing.base }}>
        <Ionicons name={r.status === 'REJECTED' ? 'alert-circle-outline' : 'information-circle-outline'} size={16} color={fg} />
        <Text variant="bodySm" color={fg} style={{ flex: 1 }}>{statusMessage(r)}</Text>
      </View>
      <Card>
        <Row k="Expected move-out" v={formatDate(r.expected_move_out)} />
        <Row k="Required notice" v={`${r.required_notice_days} days`} />
        <Row k="Notice given" v={`${r.notice_given_days} days`} last />
      </Card>
      <Card>
        <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>SETTLEMENT</Text>
        <Row k="Security deposit" v={inr(r.security_deposit)} />
        <Row k="Pending rent" v={`− ${inr(r.pending_rent_dues)}`} neg={r.pending_rent_dues > 0} />
        <Row k="Notice shortfall penalty" v={`− ${inr(r.notice_shortfall_penalty)}`} neg={r.notice_shortfall_penalty > 0} />
        <Row k="Damage deductions" v={`− ${inr(r.damage_deductions)}`} neg={r.damage_deductions > 0} />
        <Divider style={{ marginVertical: spacing.sm }} />
        <Row k="Settlement amount" v={inr(r.settlement_amount)} bold last={r.charges.length === 0} />
        {r.charges.map((c) => (
          <Row key={c.id} k={c.title} v={inr(c.amount)} neg />
        ))}
      </Card>
      {r.reason ? (
        <View style={{ backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base }}>
          <Text variant="caption" color={palette.inkTertiary} style={{ marginBottom: 4 }}>REASON</Text>
          <Text variant="bodySm" color={palette.inkSecondary}>{r.reason}</Text>
        </View>
      ) : null}
      {r.inspection_notes ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, backgroundColor: palette.infoTint, borderRadius: radius.md, padding: spacing.base }}>
          <Ionicons name="clipboard-outline" size={16} color={palette.info} />
          <Text variant="bodySm" color={palette.info} style={{ flex: 1 }}>{r.inspection_notes}</Text>
        </View>
      ) : null}
      {r.refund_status !== 'NOT_APPLICABLE' ? (
        <View>
          <Row k="Refund status" v={titleCaseFromSnake(r.refund_status)} bold last />
          <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: -spacing.xs }}>{refundStatusMessage(r.refund_status)}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Row({ k, v, bold, last, neg }: { k: string; v: string; bold?: boolean; last?: boolean; neg?: boolean }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm }}>
        <Text variant={bold ? 'bodyMd' : 'bodySm'} weight={bold ? '700' : '400'} color={bold ? palette.ink : palette.inkSecondary} style={{ flex: 1 }}>{k}</Text>
        <Text variant={bold ? 'bodyMd' : 'bodySm'} weight={bold ? '700' : '600'} mono color={bold ? palette.success : neg ? palette.danger : palette.ink}>{v}</Text>
      </View>
      {!last && !bold ? <Divider /> : null}
    </View>
  );
}
