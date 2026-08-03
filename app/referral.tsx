/** T-S28 — Refer & earn. Real `GET /tenant/refer-and-earn`. Also doubles as the landing route
 *  for `https://share.pgfy.in/referral?code=...`: a signed-out tenant lands here first and
 *  gets bounced to login with the code stashed, which rides along on `verifyPhoneOtp` once
 *  they sign in. `referral_code` is `null` until the tenant has booked and checked in to
 *  their first property — that's what gates the invite link. */
import { useEffect, useState } from 'react';
import { View, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, PressableScale, Badge, EmptyState, Skeleton, Avatar } from '@/components/ui';
import { referralApi, errorMessage, type ApiReferralSummary, type ApiReferralItem, type ApiReferralBenefit } from '@/lib/api';
import { inr, formatDate } from '@/lib/format';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/context/AuthContext';
import { savePendingReferralCode } from '@/lib/referral';

const REFERRAL_LINK_BASE = 'https://share.pgfy.in/referral';

function formatReferralBenefit(b: ApiReferralBenefit): string {
  return b.type === 'FLAT' ? inr(b.value) : `${b.value}%`;
}

export default function Referral() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, isGuest } = useAuth();
  const { code } = useLocalSearchParams<{ code?: string }>();

  const [data, setData] = useState<ApiReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const needsLogin = status === 'unauthenticated' || isGuest;

  // Deep-link landing: a code param means this was opened from a shared invite link. Signed
  // out (or browsing as a guest) → stash the code and send them to log in.
  useEffect(() => {
    if (status === 'loading' || !code || !needsLogin) return;
    savePendingReferralCode(code).then(() => {
      router.replace({ pathname: '/(auth)/login', params: { guestBlocked: '1' } });
    });
  }, [status, needsLogin, code, router]);

  const load = () => {
    setLoading(true);
    setError(null);
    referralApi.getReferralSummary()
      .then(setData)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'authenticated' && !isGuest) load();
    else if (status !== 'loading') setLoading(false);
  }, [status, isGuest]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'));

  const shareReferral = async () => {
    if (!data?.referral_code) return;
    haptic.light();
    const link = `${REFERRAL_LINK_BASE}?code=${data.referral_code}`;
    try {
      await Share.share({
        message: `Join me on PGfy and find your next stay! Tap my invite link to get ${formatReferralBenefit(data.benefits.friend_gets)} off your first booking. ${link}`,
      });
    } catch {
      // user dismissed the share sheet
    }
  };

  const Header = (
    <LinearGradient colors={[palette.coral, palette.coralDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing['2xl'], paddingHorizontal: spacing.base }}>
      <PressableScale onPress={back} scaleTo={0.9} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={22} color={palette.white} />
      </PressableScale>
      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="gift" size={38} color={palette.white} />
        </View>
        <Text variant="h1" color={palette.white} align="center" style={{ marginTop: spacing.md }}>Refer & earn</Text>
        <Text variant="bodyMd" color="rgba(255,255,255,0.92)" align="center" style={{ marginTop: spacing.xs, maxWidth: 300 }}>
          Invite friends to PGfy and you both save on your next booking.
        </Text>
      </View>
    </LinearGradient>
  );

  // Auth still resolving, or this render is about to be replaced by the login redirect above.
  if (status === 'loading' || (needsLogin && code)) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={palette.coral} />
      </View>
    );
  }

  if (needsLogin) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {Header}
        <View style={{ paddingHorizontal: spacing.base, marginTop: -spacing.xl }}>
          <Card style={{ gap: spacing.md, alignItems: 'center' }}>
            <Text variant="h3" align="center">Sign in to refer friends</Text>
            <Text variant="bodySm" color={palette.inkSecondary} align="center">
              Log in with your PGfy account to get your invite link and track your rewards.
            </Text>
            <Button label="Log in" icon="log-in-outline" full size="lg" onPress={() => router.push({ pathname: '/(auth)/login', params: { guestBlocked: '1' } })} />
          </Card>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {Header}
        <View style={{ paddingHorizontal: spacing.base, marginTop: -spacing.xl, gap: spacing.base }}>
          <Skeleton width="100%" height={160} rounded={radius.lg} />
          <Skeleton width="100%" height={120} rounded={radius.lg} />
          <Skeleton width="100%" height={220} rounded={radius.lg} />
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        {Header}
        <EmptyState
          title="Couldn't load your referrals"
          message={error ?? 'Something went wrong.'}
          actionLabel="Retry"
          onAction={load}
        />
      </View>
    );
  }

  const referrer = formatReferralBenefit(data.benefits.you_get);
  const referred = formatReferralBenefit(data.benefits.friend_gets);
  const unlocked = !!data.referral_code;
  const inviteLink = unlocked ? `${REFERRAL_LINK_BASE}?code=${data.referral_code}` : '';

  const steps = [
    { icon: 'home', title: 'Book a property & check in', text: 'Referrals unlock once you’ve booked your first property and checked in — that’s what makes you eligible to refer.' },
    { icon: 'share-social', title: 'Share your link', text: 'Send your invite link to a friend looking for a PG — your referral code is built into the link.' },
    { icon: 'cart', title: 'They book & save', text: `Your friend installs PGfy via your link and gets ${referred} off at checkout on their first booking — no code to type.` },
    { icon: 'checkmark-circle', title: 'They check in, you both win', text: `Once your friend checks in, their discount is confirmed and your ${referrer} applies automatically on your next checkout.` },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }} showsVerticalScrollIndicator={false}>
        {Header}

        <View style={{ paddingHorizontal: spacing.base, marginTop: -spacing.xl, gap: spacing.base }}>
          {/* Share invite link — unlocked once the tenant has booked & checked in */}
          {unlocked ? (
            <Card style={{ gap: spacing.md }}>
              <Text variant="overline" color={palette.inkTertiary} align="center">YOUR INVITE LINK</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surfaceRaised, borderRadius: radius.md, borderWidth: 1.5, borderColor: palette.border, borderStyle: 'dashed', paddingHorizontal: spacing.base, paddingVertical: spacing.md }}>
                <Ionicons name="link-outline" size={18} color={palette.coralDark} />
                <Text variant="bodyMd" weight="600" color={palette.navy} numberOfLines={1} style={{ flex: 1 }}>{inviteLink}</Text>
              </View>
              <Button label="Share invite link" icon="share-social-outline" full size="lg" onPress={shareReferral} />
            </Card>
          ) : (
            <Card style={{ gap: spacing.md, alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: palette.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="lock-closed" size={26} color={palette.inkTertiary} />
              </View>
              <Text variant="h3" align="center">Referrals locked</Text>
              <Text variant="bodySm" color={palette.inkSecondary} align="center">
                Book your first property and check in to unlock your invite link.
              </Text>
              <Button label="Book your first property" icon="search-outline" full size="lg" onPress={() => router.replace('/(tabs)')} />
            </Card>
          )}

          {/* Benefits */}
          <Card style={{ gap: spacing.md }}>
            <Text variant="h3">Referral benefits</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Benefit icon="person" tint={palette.navy} label="You get" value={referrer} sub="off your next checkout" />
              <Benefit icon="people" tint={palette.coral} label="Friend gets" value={referred} sub="on their first booking" />
            </View>
          </Card>

          {/* How it works */}
          <Card style={{ gap: spacing.base }}>
            <Text variant="h3">How it works</Text>
            {steps.map((s, i) => (
              <View key={s.title} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.coralTint, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={s.icon as any} size={20} color={palette.coralDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMd" weight="700">{i + 1}. {s.title}</Text>
                  <Text variant="bodySm" color={palette.inkSecondary} style={{ marginTop: 2 }}>{s.text}</Text>
                </View>
              </View>
            ))}
          </Card>

          {/* Stats */}
          <Card>
            <Text variant="h3" style={{ marginBottom: spacing.md }}>Your rewards</Text>
            <View style={{ flexDirection: 'row' }}>
              <Stat label="Saved" value={inr(data.stats.total_saved)} />
              <StatDivider />
              <Stat label="Referred" value={String(data.stats.referred_count)} />
              <StatDivider />
              <Stat label="Pending" value={String(data.stats.pending_count)} />
            </View>
          </Card>

          {/* Referral history */}
          {data.referrals.length > 0 ? (
            <Card style={{ gap: spacing.base }}>
              <Text variant="h3">Your referrals</Text>
              {data.referrals.map((r) => (
                <ReferralRow key={r.id} item={r} />
              ))}
            </Card>
          ) : null}

          <Text variant="caption" color={palette.inkTertiary} align="center" style={{ marginTop: spacing.xs }}>
            You can refer once you’ve booked a property and checked in; your friend’s discount applies to their first booking, and your discount is applied at your next checkout after they check in. Terms & conditions apply.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ReferralRow({ item }: { item: ApiReferralItem }) {
  const completed = item.status === 'COMPLETED';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <Avatar name={item.referred_name} uri={item.referred_avatar ?? undefined} size={40} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyMd" weight="700" numberOfLines={1}>{item.referred_name}</Text>
        <Text variant="caption" color={palette.inkTertiary}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Badge label={completed ? 'Completed' : 'Pending'} tone={completed ? 'success' : 'warning'} small />
        {item.referrer_reward_applied ? (
          <Text variant="bodySm" weight="700" color={palette.success} mono>+{inr(item.referrer_reward_amount)}</Text>
        ) : null}
      </View>
    </View>
  );
}

function Benefit({ icon, tint, label, value, sub }: { icon: any; tint: string; label: string; value: string; sub: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.surfaceRaised, borderRadius: radius.md, padding: spacing.base, gap: 4 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tint + '1A', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text variant="caption" color={palette.inkTertiary}>{label}</Text>
      <Text variant="h3" color={palette.ink}>{value}</Text>
      <Text variant="caption" color={palette.inkTertiary}>{sub}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text variant="numLg" mono numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ textAlign: 'center' }}>{value}</Text>
      <Text variant="caption" color={palette.inkTertiary} style={{ marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function StatDivider() {
  return <View style={{ width: 1, backgroundColor: palette.border, marginHorizontal: spacing.sm }} />;
}
