/**
 * Centered modal alert — mount once at the root, as the LAST sibling; driven imperatively via
 * `showAlert`.
 *
 * Deliberately NOT a React Native `Modal` — see the comment in `AlertDialogHost.tsx` for why a
 * second native modal presented over an already-open one (a `Sheet`, or an Expo Router
 * `presentation: 'modal'` screen) can silently fail to appear on iPad. A plain full-screen
 * overlay sidesteps that entirely.
 */
import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { palette, radius, spacing } from '@/theme';
import { alertStore, type AlertOptions, type AlertButton } from '@/lib/alert';
import { Text } from './Text';
import { Button } from './Button';

export function AlertDialog() {
  const [options, setOptions] = useState<AlertOptions | null>(null);

  useEffect(() => alertStore.subscribe(setOptions), []);

  // Native Modal used to dismiss on the Android back button via onRequestClose; replicate that
  // now that it's a plain View.
  useEffect(() => {
    if (!options) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOptions(null);
      return true;
    });
    return () => sub.remove();
  }, [options]);

  if (!options) return null;

  const buttons: AlertButton[] = options.buttons?.length ? options.buttons : [{ label: 'OK' }];

  const dismiss = (button: AlertButton) => {
    setOptions(null);
    button.onPress?.();
  };

  return (
    <View style={{ position: 'absolute', inset: 0, zIndex: 1000, elevation: 1000, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(140)}
        style={{ position: 'absolute', inset: 0, backgroundColor: palette.overlay }}
        onTouchEnd={() => setOptions(null)}
      />
      <Animated.View
        entering={ZoomIn.duration(180)}
        exiting={ZoomOut.duration(140)}
        style={{
          width: '100%',
          maxWidth: 340,
          borderRadius: radius.xl,
          backgroundColor: palette.surface,
          padding: spacing.lg,
        }}
      >
        <Text variant="h3" align="center">
          {options.title}
        </Text>
        {options.message ? (
          <Text variant="body" color={palette.inkSecondary} align="center" style={{ marginTop: spacing.xs }}>
            {options.message}
          </Text>
        ) : null}
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {buttons.map((button, i) => (
            <Button
              key={`${button.label}-${i}`}
              label={button.label}
              full
              variant={button.variant ?? (i === 0 && buttons.length > 1 ? 'outline' : 'primary')}
              onPress={() => dismiss(button)}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
