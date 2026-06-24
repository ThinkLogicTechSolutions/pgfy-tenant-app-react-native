/** Trust badges, rating pill + status → tone mapping. */
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/theme';
import { Badge, Text } from '@/components/ui';
import type { Tone } from '@/components/ui';

export function VerifiedBadge({ verified, small }: { score?: number; verified: boolean; small?: boolean }) {
  if (!verified) return <Badge label="Unverified" tone="neutral" icon="alert-circle-outline" small={small} />;
  return <Badge label="Verified" tone="success" icon="shield-checkmark" small={small} />;
}

export function PgfyScore({ score, verified }: { score: number; verified: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: verified ? palette.successTint : palette.surfaceRaised,
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
      }}
    >
      <Ionicons name="shield-checkmark" size={15} color={verified ? palette.success : palette.inkTertiary} />
      <Text variant="caption" weight="700" color={verified ? palette.success : palette.inkSecondary}>
        {verified ? `${score.toFixed(1)}/5 PGfy Verified` : 'Not verified'}
      </Text>
    </View>
  );
}

export function RatingPill({ rating, count, dark }: { rating: number; count?: number; dark?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: dark ? 'rgba(1,38,78,0.72)' : palette.navy,
        paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7,
      }}
    >
      <Ionicons name="star" size={11} color={palette.star} />
      <Text variant="caption" weight="700" color={palette.white}>
        {rating ? rating.toFixed(1) : 'New'}
      </Text>
      {count !== undefined ? (
        <Text variant="caption" color="rgba(255,255,255,0.8)" style={{ fontSize: 10 }}>
          ({count})
        </Text>
      ) : null}
    </View>
  );
}

const TONE_MAP: Record<string, Tone> = {
  Active: 'success', Confirmed: 'success', Paid: 'success', Signed: 'success', Resolved: 'success',
  Approved: 'success', 'Refund Initiated': 'success', Verified: 'success', Visited: 'success',
  'Awaiting Approval': 'warning', 'Notice Period': 'warning', Partial: 'warning', Pending: 'warning',
  'Under Review': 'warning', 'Pending Tenant Signature': 'warning', Open: 'warning', Assigned: 'warning',
  'In Progress': 'warning',
  Suspended: 'danger', Unpaid: 'danger', Expired: 'danger', Denied: 'danger', Overdue: 'danger',
  'Not Submitted': 'danger', Cancelled: 'danger',
  New: 'info',
};

export function statusTone(status: string): Tone {
  return TONE_MAP[status] ?? 'neutral';
}

export function StatusPill({ status, small, dot }: { status: string; small?: boolean; dot?: boolean }) {
  return <Badge label={status} tone={statusTone(status)} small={small} dot={dot} />;
}
