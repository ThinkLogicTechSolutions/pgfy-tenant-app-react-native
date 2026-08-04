/** T-S27 — Tenant profile & settings. */
import { useState } from 'react';
import { View, ScrollView, Switch, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Avatar, Divider, ListRow, PressableScale, EmptyState } from '@/components/ui';
import { VerifiedBadge } from '@/components/domain';
import { EmptyAuth } from '@/components/illustrations';
import { REFERRAL_PROGRAM, formatBenefit } from '@/data';
import { useAuth } from '@/context/AuthContext';
import { alert } from '@/lib/alertDialog';
import { LOGIN_ROUTE } from '@/lib/guestGuard';
import { haptic } from '@/lib/haptics';
import { isBankDetailsComplete, bankDetailsSummary } from '@/lib/bankDetails';
import { useSaved } from '@/store/saved';
import { useRewards } from '@/store/rewards';

const PRIVACY_URL = 'https://pgfy.in/privacyPolicy.html';
const TERMS_URL = 'https://pgfy.in/termsCondtions.html';

function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saved = useSaved();
  const { lockedCount, revealed } = useRewards();
  const auth = useAuth();
  const { user, isGuest } = auth;
  const bankComplete = isBankDetailsComplete(user?.bank_details);
  const bankSummary = bankDetailsSummary(user?.bank_details);
  const guardianName = user?.personal_details?.guardian_name;
  const guardianRelation = user?.personal_details?.guardian_relation;
  const occupation = user?.occupation_details?.occupation;
  const kycVerified = user?.kyc_status === 'VERIFIED';
  const hasOccupationDetails = !!occupation;
  const profileVerified = kycVerified && hasOccupationDetails;
  const [push, setPush] = useState(true);

  /** "Complete your KYC" — KYC first, then occupation details, whichever is missing. */
  const completeVerification = () => {
    if (!kycVerified) {
      router.push('/(auth)/kyc-intro');
      return;
    }
    if (!hasOccupationDetails) {
      router.push('/occupation-edit');
    }
  };

  const logout = () => {
    alert('Log out?', 'You will need to sign in again to manage your bookings.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          haptic.warning();
          // signOut invalidates the token server-side and clears local session state.
          await auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently remove your PGfy account and booking history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => haptic.error() },
      ],
    );
  };

  if (isGuest) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'] }} showsVerticalScrollIndicator={false}>
        <Text variant="h1" style={{ marginBottom: spacing.base }}>Profile</Text>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            illustration={<EmptyAuth />}
            title="You haven't logged in"
            message="Login to continue and manage your profile."
            actionLabel="Log in"
            onAction={() => router.push(LOGIN_ROUTE)}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'] }} showsVerticalScrollIndicator={false}>
      <Text variant="h1" style={{ marginBottom: spacing.base }}>Profile</Text>

      {/* Identity */}
      <Card onPress={() => router.push('/profile-edit')} style={{ marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={user?.name ?? ''} uri={user?.avatar?.thumbnail ?? user?.avatar?.link} size={64} ring />
          <View style={{ flex: 1 }}>
            <Text variant="h3">{user?.name}</Text>
            <Text variant="bodySm" color={palette.inkSecondary}>{user?.phone}</Text>
            <View style={{ marginTop: 6, flexDirection: 'row' }}>
              <VerifiedBadge verified={profileVerified} small />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="create-outline" size={18} color={palette.navy} />
            <Text variant="bodySm" weight="600" color={palette.navy}>Edit</Text>
          </View>
        </View>
      </Card>

      {/* KYC + occupation banner when not fully verified */}
      {!profileVerified ? (
        <PressableScale onPress={completeVerification} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.coralTint, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.xl }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: palette.coral, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="shield-half-outline" size={22} color={palette.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyMd" weight="700" color={palette.coralDark}>Complete your KYC</Text>
            <Text variant="caption" color={palette.coralDark}>Verify your profile to unlock booking</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.coralDark} />
        </PressableScale>
      ) : null}

      <Section title="ACCOUNT">
        <ListRow
          icon="shield-checkmark-outline"
          iconColor={kycVerified ? palette.success : palette.warning}
          iconBg={kycVerified ? palette.successTint : palette.warningTint}
          title="KYC status"
          subtitle={kycVerified ? 'SnapKYC verified' : 'Verification required'}
          right={<Text variant="bodySm" weight="600" color={kycVerified ? palette.success : palette.coralDark}>{kycVerified ? 'Verified' : 'Complete now'}</Text>}
          chevron={!kycVerified}
          onPress={kycVerified ? undefined : () => router.push('/(auth)/kyc-intro')}
        />
        <Divider />
        <ListRow
          icon="card-outline"
          iconColor={palette.navy}
          iconBg={palette.navyTint}
          title="Bank details"
          subtitle={bankComplete ? (bankSummary ?? 'Saved for refund') : 'Required for deposit refund'}
          right={bankComplete ? <Ionicons name="checkmark-circle" size={20} color={palette.success} /> : undefined}
          onPress={() => router.push('/bank-details')}
        />
        <Divider />
        <ListRow
          icon="briefcase-outline"
          iconColor={palette.navy}
          iconBg={palette.navyTint}
          title="Occupation details"
          subtitle={occupation === 'STUDENT' ? 'Student' : occupation === 'WORKING_PROFESSIONAL' ? 'Working professional' : 'Add occupation details'}
          onPress={() => router.push('/occupation-edit')}
        />
        <Divider />
        <ListRow
          icon="people-outline"
          title="Guardian & emergency"
          subtitle={guardianName ? `${guardianName}${guardianRelation ? ` (${guardianRelation})` : ''}` : 'Add guardian details'}
          onPress={() => router.push('/profile-edit')}
        />
        <Divider />
        <ListRow icon="heart-outline" iconColor={palette.coral} iconBg={palette.coralTint} title="Saved properties" subtitle={`${saved.count} shortlisted`} onPress={() => router.push('/saved')} />
      </Section>

      <Section title="REWARDS">
        <ListRow
          icon="gift-outline"
          iconColor={palette.coral}
          iconBg={palette.coralTint}
          title="Rewards"
          subtitle={
            lockedCount > 0
              ? `${lockedCount} scratch card${lockedCount === 1 ? '' : 's'} to reveal`
              : revealed.length > 0
                ? `${revealed.length} partner coupon${revealed.length === 1 ? '' : 's'}`
                : 'Earn coupons after booking'
          }
          right={
            lockedCount > 0 ? (
              <View style={{ backgroundColor: palette.coral, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                <Text variant="caption" weight="700" color={palette.white}>{lockedCount}</Text>
              </View>
            ) : undefined
          }
          onPress={() => router.push('/rewards')}
        />
        <Divider />
        <ListRow
          icon="share-social-outline"
          iconColor={palette.coral}
          iconBg={palette.coralTint}
          title="Refer app"
          subtitle={`Invite friends, you get ${formatBenefit(REFERRAL_PROGRAM.referrerReward)} off`}
          onPress={() => router.push('/referral')}
        />
      </Section>

      <Section title="MY STAY">
        <ListRow icon="time-outline" title="Booking history" subtitle="All your bookings" onPress={() => router.push('/bookings')} />
        <Divider />
        <ListRow icon="document-text-outline" title="Lease agreement" onPress={() => router.push('/lease')} />
        <Divider />
        <ListRow icon="receipt-outline" title="Billing & invoices" onPress={() => router.push('/billing')} />
        <Divider />
        <ListRow
          icon="people-outline"
          iconColor={palette.navy}
          iconBg={palette.navyTint}
          title="Group booking"
          subtitle="Enquire for a team, college or event"
          onPress={() => router.push('/group-booking')}
        />
      </Section>

      <Section title="PREFERENCES">
        <Toggle icon="notifications-outline" label="Push notifications" value={push} onChange={setPush} />
      </Section>

      <Section title="SUPPORT">
        <ListRow icon="help-circle-outline" title="Support & FAQs" onPress={() => router.push({ pathname: '/support', params: { kind: 'platform' } })} />
        <Divider />
        <ListRow icon="lock-closed-outline" title="Privacy policy" onPress={() => openLink(PRIVACY_URL)} />
        <Divider />
        <ListRow icon="document-text-outline" title="Terms & conditions" onPress={() => openLink(TERMS_URL)} />
        <Divider />
        <ListRow
          icon="log-out-outline"
          iconColor={palette.white}
          iconBg={palette.coral}
          title="Log out"
          accent
          onPress={logout}
        />
      </Section>

      <Text variant="caption" color={palette.inkTertiary} align="center" style={{ marginTop: spacing.lg }}>
        PGfy · v1.0.0
      </Text>

      <PressableScale onPress={deleteAccount} haptics={false} scaleTo={0.98} style={{ alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.sm }}>
        <Text variant="bodySm" weight="600" color={palette.danger}>
          Delete account
        </Text>
      </PressableScale>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text variant="overline" color={palette.inkTertiary} style={{ marginBottom: spacing.sm, marginLeft: 4 }}>{title}</Text>
      <Card padded={false} style={{ paddingHorizontal: spacing.base }}>{children}</Card>
    </View>
  );
}
function Toggle({ icon, label, sub, value, onChange, disabled }: { icon: any; label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={palette.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd">{label}</Text>
        {sub ? <Text variant="caption" color={palette.inkTertiary}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: palette.coral, false: palette.borderStrong }} thumbColor={palette.white} />
    </View>
  );
}
