/** T-S27 — Tenant profile & settings. */
import { useState } from 'react';
import { View, ScrollView, Switch, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Avatar, Divider, ListRow, PressableScale } from '@/components/ui';
import { VerifiedBadge } from '@/components/domain';
import { USER } from '@/data';
import { session } from '@/lib/session';
import { haptic } from '@/lib/haptics';
import { useSaved } from '@/store/saved';
import { useKyc } from '@/store/kyc';
import { useBank } from '@/store/bank';
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
  const kyc = useKyc();
  const bank = useBank();
  const { lockedCount, revealed } = useRewards();
  const [push, setPush] = useState(true);

  const logout = async () => { haptic.warning(); await session.logout(); router.replace('/landing'); };

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

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.base, paddingBottom: insets.bottom + spacing['3xl'] }} showsVerticalScrollIndicator={false}>
      <Text variant="h1" style={{ marginBottom: spacing.base }}>Profile</Text>

      {/* Identity */}
      <Card onPress={() => router.push('/profile-edit')} style={{ marginBottom: spacing.xl }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={USER.name} uri={USER.avatar} size={64} ring />
          <View style={{ flex: 1 }}>
            <Text variant="h3">{USER.name}</Text>
            <Text variant="bodySm" color={palette.inkSecondary}>{USER.phone}</Text>
            <View style={{ marginTop: 6, flexDirection: 'row' }}>
              <VerifiedBadge verified={kyc.verified} small />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="create-outline" size={18} color={palette.navy} />
            <Text variant="bodySm" weight="600" color={palette.navy}>Edit</Text>
          </View>
        </View>
      </Card>

      {/* KYC banner when not verified */}
      {!kyc.verified ? (
        <PressableScale onPress={() => router.push('/(auth)/kyc-intro')} scaleTo={0.99} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: palette.coralTint, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.xl }}>
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
          iconColor={kyc.verified ? palette.success : palette.warning}
          iconBg={kyc.verified ? palette.successTint : palette.warningTint}
          title="KYC status"
          subtitle={kyc.verified ? 'SnapKYC verified' : 'Verification required'}
          right={<Text variant="bodySm" weight="600" color={kyc.verified ? palette.success : palette.coralDark}>{kyc.verified ? 'Verified' : 'Complete now'}</Text>}
          chevron={!kyc.verified}
          onPress={kyc.verified ? undefined : () => router.push('/(auth)/kyc-intro')}
        />
        <Divider />
        <ListRow icon="heart-outline" iconColor={palette.coral} iconBg={palette.coralTint} title="Saved properties" subtitle={`${saved.count} shortlisted`} onPress={() => router.push('/saved')} />
        <Divider />
        <ListRow
          icon="card-outline"
          iconColor={palette.navy}
          iconBg={palette.navyTint}
          title="Bank details"
          subtitle={bank.isComplete ? (bank.summary ?? 'Saved for refund') : 'Required for deposit refund'}
          right={bank.isComplete ? <Ionicons name="checkmark-circle" size={20} color={palette.success} /> : undefined}
          onPress={() => router.push('/bank-details')}
        />
        <Divider />
        <ListRow icon="people-outline" title="Guardian & emergency" subtitle={`${USER.guardianName} (${USER.guardianRelation})`} onPress={() => router.push('/profile-edit')} />
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
        PGfy · v1.0.0 (mockup)
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
