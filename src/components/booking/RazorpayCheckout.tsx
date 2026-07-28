/**
 * Razorpay Standard Checkout, embedded via WebView.
 *
 * `react-native-razorpay` (the official native SDK) doesn't support the New Architecture,
 * which this app builds with (`newArchEnabled: true`) — using it would risk not linking or
 * crashing. Razorpay's hosted checkout.js widget has no such constraint, so it's loaded in
 * a WebView instead; the widget's callbacks bridge back to RN via `postMessage`.
 */
import { useState } from 'react';
import { Modal, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing } from '@/theme';
import { Text, IconButton } from '@/components/ui';

export interface RazorpayOrder {
  key: string;
  orderId: string;
  /** Amount in the smallest currency unit (paise for INR). */
  amountPaise: number;
  currency?: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
}

export interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Props {
  visible: boolean;
  order: RazorpayOrder | null;
  onSuccess: (result: RazorpaySuccess) => void;
  onDismiss: () => void;
  onError: (message: string) => void;
}

function buildCheckoutHtml(order: RazorpayOrder): string {
  const options = {
    key: order.key,
    amount: order.amountPaise,
    currency: order.currency ?? 'INR',
    name: order.name,
    description: order.description ?? '',
    order_id: order.orderId,
    prefill: order.prefill ?? {},
    theme: { color: '#FF4B3E' },
  };
  // Opens the widget immediately on load; every callback posts a message back to RN.
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </head>
  <body style="margin:0;background:#fff;">
    <script>
      function post(msg) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      }
      try {
        var options = ${JSON.stringify(options)};
        options.handler = function (response) { post({ event: 'success', response: response }); };
        options.modal = {
          ondismiss: function () { post({ event: 'dismiss' }); },
        };
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          post({ event: 'failed', error: resp && resp.error ? resp.error.description : 'Payment failed' });
        });
        rzp.open();
      } catch (e) {
        post({ event: 'error', error: String(e && e.message ? e.message : e) });
      }
    </script>
  </body>
</html>`;
}

/** Full-screen modal hosting the Razorpay checkout widget. */
export function RazorpayCheckout({ visible, order, onSuccess, onDismiss, onError }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  if (!order) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingBottom: spacing.sm, gap: spacing.sm }}>
          <IconButton icon="close" onPress={onDismiss} style={{ borderRadius: 21 }} />
          <Text variant="h3">Complete payment</Text>
        </View>
        <WebView
          source={{ html: buildCheckoutHtml(order) }}
          onLoadEnd={() => setLoading(false)}
          onMessage={(e) => {
            let data: { event?: string; response?: RazorpaySuccess; error?: string } = {};
            try { data = JSON.parse(e.nativeEvent.data); } catch { /* ignore malformed message */ }
            if (data.event === 'success' && data.response) onSuccess(data.response);
            else if (data.event === 'dismiss') onDismiss();
            else if (data.event === 'failed' || data.event === 'error') onError(data.error ?? 'Payment failed');
          }}
          style={{ flex: 1, opacity: loading ? 0 : 1 }}
        />
        {loading ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={palette.coral} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
