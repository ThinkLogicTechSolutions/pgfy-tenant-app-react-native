/** T-S25 — Move-out / exit request with settlement estimate. */
import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, ScreenHeader, Card, Button, Input, Divider, Sheet } from '@/components/ui';
import { SuccessBurst } from '@/components/illustrations';
import { BankDetailsForm } from '@/components/profile/BankDetailsForm';
import { ACTIVE_BOOKING, LEASE } from '@/data';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { isBankDetailsComplete, bankDetailsSummary } from '@/lib/bankDetails';
import { useAuth } from '@/context/AuthContext';
import { errorMessage, type BankDetails } from '@/lib/api';
import { alert } from '@/lib/alertDialog';

export default function MoveOut() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const bankDetails = user?.bank_details ?? null;
  const bankComplete = isBankDetailsComplete(bankDetails);
  const bankSummary = bankDetailsSummary(bankDetails);
  const [done, setDone] = useState(false);
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  const deposit = ACTIVE_BOOKING.deposit;
  const pendingRent = 0;
  const damageEstimate = 0;
  const shortNoticePenalty = 0;
  const estRefund = deposit - pendingRent - damageEstimate - shortNoticePenalty;

  const submitExit = () => {
    haptic.warning();
    setDone(true);
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

  if (done) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <SuccessBurst size={170} />
        <Text variant="h1" align="center" style={{ marginTop: spacing.lg }}>Exit request submitted</Text>
        <Text variant="bodyLg" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.sm, maxWidth: 300 }}>
          Status: Under Review → Approved → Refund Initiated. Your manager has been notified.
        </Text>
        {bankSummary ? (
          <Text variant="caption" color={palette.inkTertiary} align="center" style={{ marginTop: spacing.md }}>
            Refund will be sent to {bankSummary}
          </Text>
        ) : null}
        <Button label="Back to stay" onPress={() => router.replace('/(tabs)/stay')} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.xs }}>
      <ScreenHeader title="Move out" subtitle="Submit your exit request" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: insets.bottom + 110, gap: spacing.base }} showsVerticalScrollIndicator={false}>
        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>EXPECTED MOVE-OUT DATE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: palette.navyTint, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="calendar" size={20} color={palette.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMd" weight="600">28 June 2026</Text>
              <Text variant="caption" color={palette.inkTertiary}>Earliest after {LEASE.noticeDays}-day notice</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.inkTertiary} />
          </View>
        </Card>

        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>NOTICE</Text>
          <Row k="Required notice" v={`${LEASE.noticeDays} days`} />
          <Row k="Notice given" v={`${LEASE.noticeDays} days`} />
          <Row k="Within lock-in?" v="No" last />
        </Card>

        <Card>
          <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm }}>SETTLEMENT ESTIMATE</Text>
          <Row k="Security deposit" v={inr(deposit)} />
          <Row k="Pending rent" v={`− ${inr(pendingRent)}`} neg />
          <Row k="Damage estimate" v={`− ${inr(damageEstimate)}`} neg />
          <Row k="Short-notice penalty" v={`− ${inr(shortNoticePenalty)}`} neg />
          <Divider style={{ marginVertical: spacing.sm }} />
          <Row k="Estimated refund" v={inr(estRefund)} bold last />
        </Card>

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

        <Input label="Reason for moving out (optional)" placeholder="Help us improve" multiline style={{ height: 80, textAlignVertical: 'top' }} />
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.md, backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border }}>
        <Button label="Submit exit request" variant="danger" icon="exit-outline" onPress={onSubmitPress} full size="lg" />
      </View>

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
