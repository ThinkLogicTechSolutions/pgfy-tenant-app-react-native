/** T-S27 — Tenant profile & settings. */
import { useEffect, useState } from 'react';
import { View, ScrollView, Switch, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Avatar, Divider, ListRow, PressableScale, EmptyState, Sheet, Input, Button } from '@/components/ui';
import { VerifiedBadge } from '@/components/domain';
import { EmptyAuth } from '@/components/illustrations';
import { REFERRAL_PROGRAM, formatBenefit } from '@/data';
import { useAuth } from '@/context/AuthContext';
import { alert } from '@/lib/alertDialog';
import { LOGIN_ROUTE } from '@/lib/guestGuard';
import { haptic } from '@/lib/haptics';
import { isBankDetailsComplete, bankDetailsSummary } from '@/lib/bankDetails';
import { rewardsApi, favoritesApi, profileApi, errorMessage, type RoommatePreferences } from '@/lib/api';

const TERMS_URL = 'https://pgfy.in/pages/terms-conditions.html';
const PRIVACY_URL = 'https://pgfy.in/pages/privacy-policy.html';

const SLEEP_LABEL: Record<string, string> = { EARLY_BIRD: 'Early sleeper', NIGHT_OWL: 'Night owl' };
const DIET_LABEL: Record<string, string> = { VEGETARIAN: 'Vegetarian', VEGAN: 'Vegan', NON_VEGETARIAN: 'Non-vegetarian' };

/** Short "sleep · diet" style summary for the room-preference row — falls back to a nudge to
 * fill them in, or a generic "saved" note if the only things set are smoking/alcohol/about. */
function roommatePrefsSummary(prefs: RoommatePreferences | null | undefined): string {
  if (!prefs) return 'Add your preferences for room matching';
  const parts = [
    prefs.sleep_schedule ? SLEEP_LABEL[prefs.sleep_schedule] ?? prefs.sleep_schedule : null,
    prefs.diet_preference ? DIET_LABEL[prefs.diet_preference] ?? prefs.diet_preference : null,
  ].filter((p): p is string => !!p);
  if (parts.length) return parts.join(' · ');
  return 'Preferences saved';
}

function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [savedCount, setSavedCount] = useState(0);
  const [rewardCounts, setRewardCounts] = useState({ locked: 0, scratched: 0 });
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
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (isGuest) return;
    rewardsApi.listRewards({ limit: 100 })
      .then((page) => {
        const locked = page.data.filter((r) => r.status === 'LOCKED').length;
        const scratched = page.data.filter((r) => r.status === 'SCRATCHED').length;
        setRewardCounts({ locked, scratched });
      })
      .catch(() => {});
  }, [isGuest]);

  useEffect(() => {
    if (isGuest) return;
    // Just need the total count — a 1-row page is the cheapest way to read it.
    favoritesApi.listFavoriteProperties({ limit: 1 })
      .then((page) => setSavedCount(page.total))
      .catch(() => {});
  }, [isGuest]);

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

  // Shared by a plain logout and the post-delete-request logout — clears the whole
  // navigation stack (not just `replace`s the current screen) so nothing in the authenticated
  // app is left behind in history for the back button/gesture to walk into.
  const performLogout = async () => {
    haptic.warning();
    // signOut invalidates the token server-side and clears local session state.
    await auth.signOut();
    router.dismissAll();
    router.replace('/(auth)/login');
  };

  const logout = () => {
    alert('Log out?', 'You will need to sign in again to manage your bookings.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: performLogout },
    ]);
  };

  const deleteAccount = () => {
    setDeleteReason('');
    setDeleteSheetOpen(true);
  };

  const submitDeleteRequest = async () => {
    if (!deleteReason.trim() || deletingAccount) return;
    setDeletingAccount(true);
    try {
      await profileApi.requestAccountDeletion(deleteReason.trim());
      setDeleteSheetOpen(false);
      haptic.success();
      alert(
        "We've received your request",
        "We'll verify your pending bookings and dues, then delete your data. You'll be logged out now.",
        [{ text: 'OK', onPress: performLogout }],
      );
    } catch (e) {
      haptic.error();
      alert("Couldn't submit your request", errorMessage(e));
    } finally {
      setDeletingAccount(false);
    }
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
    <>
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
        <ListRow
          icon="people-circle-outline"
          iconColor={palette.navy}
          iconBg={palette.navyTint}
          title="Update room preference"
          subtitle={roommatePrefsSummary(user?.roommate_preferences)}
          onPress={() => router.push('/roommate-preferences')}
        />
        <Divider />
        <ListRow icon="heart-outline" iconColor={palette.coral} iconBg={palette.coralTint} title="Saved properties" subtitle={`${savedCount} shortlisted`} onPress={() => router.push('/saved')} />
      </Section>

      <Section title="REWARDS">
        <ListRow
          icon="gift-outline"
          iconColor={palette.coral}
          iconBg={palette.coralTint}
          title="Rewards"
          subtitle={
            rewardCounts.locked > 0
              ? `${rewardCounts.locked} scratch card${rewardCounts.locked === 1 ? '' : 's'} to reveal`
              : rewardCounts.scratched > 0
                ? `${rewardCounts.scratched} partner coupon${rewardCounts.scratched === 1 ? '' : 's'}`
                : 'Earn coupons after booking'
          }
          right={
            rewardCounts.locked > 0 ? (
              <View style={{ backgroundColor: palette.coral, minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                <Text variant="caption" weight="700" color={palette.white}>{rewardCounts.locked}</Text>
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
        <ListRow icon="document-text-outline" title="Lease agreements" onPress={() => router.push('/lease-agreements')} />
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

      <Section title="OTHER SERVICES">
        <ListRow icon="train" title="Metro Ticket" subtitle="Coming soon" iconBg='#E8F0FE' iconColor='#3B82F6' 
          onPress={
            () => router.push({ 
              pathname: '/coming-soon',
              params: { title: 'Metro Tickets', subtitle: 'Book metro tickets right inside PGfy. We’re working on it — stay tuned!', icon: 'train-outline' },
            })
          } 
        />
        <Divider />
        <ListRow icon="warehouse" iconFamily="MaterialCommunityIcons" title="Storage Solutions" subtitle="Store with ease" iconBg='#EEF2FF' iconColor='#6366F1' onPress={() => router.push('/storage-solutions')} />
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

    <Sheet visible={deleteSheetOpen} onClose={() => (deletingAccount ? null : setDeleteSheetOpen(false))} title="Delete account">
      <View style={{ gap: spacing.base }}>
        <Text variant="bodySm" color={palette.inkSecondary}>
          This submits a request to delete your PGfy account. We&apos;ll first verify you have no pending bookings or dues before removing your data — this doesn&apos;t happen instantly.
        </Text>
        <Input
          label="Reason for leaving"
          placeholder="e.g. Moving abroad, no longer need this service"
          multiline
          maxLength={300}
          value={deleteReason}
          onChangeText={setDeleteReason}
          style={{ height: 90 }}
        />
        <Button
          label="Submit delete request"
          variant="danger"
          full
          size="lg"
          disabled={!deleteReason.trim()}
          loading={deletingAccount}
          onPress={submitDeleteRequest}
        />
        <Button label="Cancel" variant="ghost" full disabled={deletingAccount} onPress={() => setDeleteSheetOpen(false)} />
      </View>
    </Sheet>
    </>
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
