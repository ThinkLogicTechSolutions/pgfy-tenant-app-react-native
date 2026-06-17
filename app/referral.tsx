/** T-S28 — Refer & earn. Share your invite link; you and your friend both get a discount. */
import { View, ScrollView, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, spacing, radius } from '@/theme';
import { Text, Card, Button, PressableScale } from '@/components/ui';
import { REFERRAL, REFERRAL_PROGRAM, formatBenefit } from '@/data';
import { inr } from '@/lib/format';
import { haptic } from '@/lib/haptics';

export default function Referral() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const referrer = formatBenefit(REFERRAL_PROGRAM.referrerReward);
  const referred = formatBenefit(REFERRAL_PROGRAM.referredReward);

  // Claim flow, mirroring the admin-configured rewards: the friend who joins via the
  // link saves at checkout (referred reward), and once their first booking succeeds the
  // referrer's discount is applied automatically on their next checkout — no account credit.
  const steps = [
    { icon: 'share-social', title: 'Share your link', text: 'Send your invite link to a friend looking for a PG — your referral code is built into the link.' },
    { icon: 'cart', title: 'They book & save', text: `Your friend installs PGfy via your link and gets ${referred} off at checkout on their first booking — no code to type.` },
    { icon: 'checkmark-circle', title: 'Their booking is confirmed', text: 'Once their first booking is paid and confirmed, the referral is complete.' },
    { icon: 'pricetag', title: 'You get a discount', text: `Your ${referrer} discount is applied automatically on your next checkout.` },
  ];

  const shareReferral = async () => {
    haptic.light();
    try {
      await Share.share({
        message: `Join me on PGfy and find your next stay! Tap my invite link to get ${referred} off your first booking. ${REFERRAL.link}`,
      });
    } catch {
      // user dismissed the share sheet
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={[palette.coral, palette.coralDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + spacing.sm, paddingBottom: spacing['2xl'], paddingHorizontal: spacing.base }}>
          <PressableScale onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} scaleTo={0.9} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={palette.white} />
          </PressableScale>
          <View style={{ alignItems: 'center', marginTop: spacing.md }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="gift" size={38} color={palette.white} />
            </View>
            <Text variant="h1" color={palette.white} align="center" style={{ marginTop: spacing.md }}>Refer & earn</Text>
            <Text variant="bodyMd" color="rgba(255,255,255,0.92)" align="center" style={{ marginTop: spacing.xs, maxWidth: 300 }}>
              Invite friends to PGfy. You get {referrer} and they get {referred} on their first booking.
            </Text>
          </View>
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.base, marginTop: -spacing.xl, gap: spacing.base }}>
          {/* Share invite link */}
          <Card style={{ gap: spacing.md }}>
            <Text variant="overline" color={palette.inkTertiary} align="center">YOUR INVITE LINK</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: palette.surfaceRaised, borderRadius: radius.md, borderWidth: 1.5, borderColor: palette.border, borderStyle: 'dashed', paddingHorizontal: spacing.base, paddingVertical: spacing.md }}>
              <Ionicons name="link-outline" size={18} color={palette.coralDark} />
              <Text variant="bodyMd" weight="600" color={palette.navy} numberOfLines={1} style={{ flex: 1 }}>{REFERRAL.link}</Text>
            </View>
            <Button label="Share invite link" icon="share-social-outline" full size="lg" onPress={shareReferral} />
          </Card>

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
              <Stat label="Saved" value={inr(REFERRAL.totalEarned)} />
              <StatDivider />
              <Stat label="Referred" value={String(REFERRAL.referredCount)} />
              <StatDivider />
              <Stat label="Pending" value={String(REFERRAL.pending)} />
            </View>
          </Card>

          <Text variant="caption" color={palette.inkTertiary} align="center" style={{ marginTop: spacing.xs }}>
            Your discount is applied at your next checkout after your friend completes their first booking. Terms & conditions apply.
          </Text>
        </View>
      </ScrollView>
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
