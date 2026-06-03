/** T-S5 — OTP verification (demo accepts any 6 digits). */
import { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, spacing, radius, fontFamily } from '@/theme';
import { Text, Button, ScreenHeader } from '@/components/ui';
import { haptic } from '@/lib/haptics';

export default function VerifyOtp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => { const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 350); return () => clearTimeout(t); }, []);

  const verify = () => {
    setLoading(true); haptic.success();
    setTimeout(() => { setLoading(false); router.replace('/(auth)/register'); }, 600);
  };

  const masked = phone ? `+91 ${String(phone).slice(0, 2)}••• ${String(phone).slice(7)}` : '+91 •••••';

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <ScreenHeader title="" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
        <Text variant="h1">Verify your number</Text>
        <Text variant="bodyMd" color={palette.inkSecondary} style={{ marginTop: 6 }}>Enter the 6-digit OTP sent to {masked}</Text>

        <Pressable onPress={() => inputRef.current?.focus()} style={{ marginTop: spacing['2xl'] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {Array.from({ length: 6 }).map((_, i) => {
              const char = code[i] ?? '';
              const active = i === code.length;
              return (
                <View key={i} style={{ width: 48, height: 56, borderRadius: radius.md, borderWidth: 1.5, borderColor: active ? palette.coral : char ? palette.borderStrong : palette.border, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fontFamily.bold, fontSize: 22, color: palette.ink }}>{char}</Text>
                </View>
              );
            })}
          </View>
          <TextInput ref={inputRef} value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} style={{ position: 'absolute', opacity: 0, height: 56, width: '100%' }} />
        </Pressable>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl }}>
          {seconds > 0 ? (
            <Text variant="bodySm" color={palette.inkTertiary}>Resend OTP in 0:{String(seconds).padStart(2, '0')}</Text>
          ) : (
            <Pressable onPress={() => setSeconds(60)}><Text variant="bodySm" weight="600" color={palette.coralDark}>Resend OTP</Text></Pressable>
          )}
        </View>

        <Button label="Verify & Continue" onPress={verify} loading={loading} disabled={code.length !== 6} full size="lg" style={{ marginTop: spacing.xl }} />
      </View>
    </View>
  );
}
