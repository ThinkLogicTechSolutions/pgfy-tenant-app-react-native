/**
 * Renders whatever `src/lib/alertDialog.ts` broadcasts. Mount exactly once, in the root layout,
 * as the LAST sibling so plain view-stacking paints it above everything else.
 *
 * Deliberately NOT a React Native `Modal`. A second native `Modal` presented while one is already
 * open (a bottom `Sheet`, or an Expo Router `presentation: 'modal'` screen) can silently fail to
 * appear on iPad — react-native-screens' scene-aware presentation doesn't always resolve the
 * correct host view controller for a nested modal there, even though the same code works on
 * iPhone. Since `alert()` is very often called from inside an already-open sheet/modal screen,
 * a plain full-screen overlay sidesteps native modal presentation entirely and isn't subject to
 * that failure mode.
 */
import { useEffect, useState } from 'react';
import { BackHandler, View, Pressable } from 'react-native';
import { palette, radius, spacing, shadows } from '@/theme';
import { Text } from './Text';
import { subscribeAlert, type AlertButton, type AlertState } from '@/lib/alertDialog';

function buttonColor(style: AlertButton['style']) {
  if (style === 'destructive') return palette.danger;
  if (style === 'cancel') return palette.inkSecondary;
  return palette.coral;
}

export function AlertDialogHost() {
  const [state, setState] = useState<AlertState | null>(null);

  useEffect(() => subscribeAlert(setState), []);

  // Native Modal used to swallow the Android back button via onRequestClose={() => {}};
  // replicate that (block back while an alert is up, same as before) now that it's a plain View.
  useEffect(() => {
    if (!state) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [state]);

  if (!state) return null;

  const press = (button: AlertButton) => {
    setState(null);
    button.onPress?.();
  };

  const stacked = state.buttons.length > 2;

  return (
    <View
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1000,
        elevation: 1000,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.overlay,
        padding: spacing.xl,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 340,
          backgroundColor: palette.surface,
          borderRadius: radius.lg,
          overflow: 'hidden',
          ...shadows.floating,
        }}
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.base, gap: 6 }}>
          <Text variant="h3" style={{ textAlign: 'center' }}>
            {state.title}
          </Text>
          {state.message ? (
            <Text variant="bodySm" color={palette.inkSecondary} style={{ textAlign: 'center', lineHeight: 20, marginTop: 2 }}>
              {state.message}
            </Text>
          ) : null}
        </View>

        <View style={{ height: 1, backgroundColor: palette.border }} />

        <View style={{ flexDirection: stacked ? 'column' : 'row' }}>
          {state.buttons.map((button, i) => (
            <View
              key={`${button.text}-${i}`}
              style={
                stacked
                  ? { borderTopWidth: i > 0 ? 1 : 0, borderTopColor: palette.border }
                  : { flex: 1, borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: palette.border }
              }
            >
              <Pressable
                onPress={() => press(button)}
                style={({ pressed }) => ({
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? palette.surfaceRaised : 'transparent',
                })}
              >
                <Text variant="bodyMd" weight={button.style === 'cancel' ? '500' : '700'} color={buttonColor(button.style)}>
                  {button.text}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
