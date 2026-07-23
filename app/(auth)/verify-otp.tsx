/** T-S5 — OTP verification. */
import { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { palette, spacing, radius, fontFamily } from '@/theme';
import { Text, Button, ScreenHeader } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/context/AuthContext';
import { errorMessage } from '@/lib/api';

export default function VerifyOtp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, sendOtp } = useAuth();
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<TextInput>(null);
  const shakeX = useSharedValue(0);

  useEffect(() => { const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 350); return () => clearTimeout(t); }, []);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const onChange = (t: string) => {
    setCode(t.replace(/\D/g, '').slice(0, 6));
    if (error) setError(false);
  };

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withRepeat(withTiming(10, { duration: 80 }), 4, true),
      withTiming(0, { duration: 45 }),
    );
  };

  const verify = async () => {
    setLoading(true);
    try {
      const { newLogin } = await verifyOtp(String(phone), code);
      haptic.success();
      router.replace(newLogin ? '/(auth)/register' : '/(tabs)');
    } catch (e) {
      setError(true);
      setErrorMsg(errorMessage(e, "That OTP didn't match. Please check and try again."));
      haptic.error();
      shake();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setSeconds(60);
    try {
      await sendOtp(String(phone));
    } catch (e) {
      Alert.alert('Could not resend OTP', errorMessage(e));
    }
  };

  const masked = phone ? `+91 ${String(phone).slice(0, 2)}••• ${String(phone).slice(7)}` : '+91 •••••';

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm }}>
      <ScreenHeader title="" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
        <Text variant="h1">Verify your number</Text>
        <Text variant="bodyMd" color={palette.inkSecondary} style={{ marginTop: 6 }}>Enter the 6-digit OTP sent to {masked}</Text>

        <Pressable onPress={() => inputRef.current?.focus()} style={{ marginTop: spacing['2xl'] }}>
          <Animated.View style={[{ flexDirection: 'row', justifyContent: 'space-between' }, rowStyle]}>
            {Array.from({ length: 6 }).map((_, i) => {
              const char = code[i] ?? '';
              const active = i === code.length;
              const borderColor = error ? palette.danger : active ? palette.coral : char ? palette.borderStrong : palette.border;
              return (
                <View key={i} style={{ width: 48, height: 56, borderRadius: radius.md, borderWidth: 1.5, borderColor, backgroundColor: error ? palette.dangerTint : palette.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fontFamily.bold, fontSize: 22, color: error ? palette.danger : palette.ink }}>{char}</Text>
                </View>
              );
            })}
          </Animated.View>
          <TextInput ref={inputRef} value={code} onChangeText={onChange} keyboardType="number-pad" maxLength={6} style={{ position: 'absolute', opacity: 0, height: 56, width: '100%' }} />
        </Pressable>

        {error ? (
          <Text variant="bodySm" color={palette.danger} style={{ marginTop: spacing.md }}>
            {errorMsg}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl }}>
          {seconds > 0 ? (
            <Text variant="bodySm" color={palette.inkTertiary}>Resend OTP in 0:{String(seconds).padStart(2, '0')}</Text>
          ) : (
            <Pressable onPress={resend}><Text variant="bodySm" weight="600" color={palette.coralDark}>Resend OTP</Text></Pressable>
          )}
        </View>

        <Button label="Verify & Continue" loadingLabel="Verifying…" onPress={verify} loading={loading} disabled={code.length !== 6} full size="lg" style={{ marginTop: spacing.xl }} />
      </View>
    </View>
  );
}
