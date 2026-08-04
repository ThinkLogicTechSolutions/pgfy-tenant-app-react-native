/** Legacy route — superseded by the unified `/checkout`. Forwards any deep links here
 *  (with a precomputed `amount`) into the unified checkout. */
import { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getListing } from '@/data';
import type { CheckoutIntent } from '@/lib/billing';

export default function LegacyCheckoutRedirect() {
  const { id, amount, room, bed } = useLocalSearchParams<{ id: string; amount?: string; room?: string; bed?: string }>();
  const router = useRouter();

  useEffect(() => {
    const base = Number(amount ?? 0);
    const listing = getListing(String(id));
    const intent: CheckoutIntent = {
      kind: 'booking-monthly',
      title: `${listing?.name ?? 'Booking'} — Monthly booking`,
      subtitle: room ? `${room}${bed ? ` · Bed ${bed}` : ''}` : undefined,
      billingMode: 'monthly',
      baseAmount: base,
      unitRate: base,
      allowAutopay: true,
      // The legacy review screen already totalled fees/GST into `amount`.
      applyPlatformFee: false,
      applyGst: false,
      listingId: String(id),
    };
    router.replace({ pathname: '/checkout', params: { intent: JSON.stringify(intent) } });
  }, [id, amount, room, bed]); // eslint-disable-line react-hooks/exhaustive-deps

  return <View style={{ flex: 1 }} />;
}
