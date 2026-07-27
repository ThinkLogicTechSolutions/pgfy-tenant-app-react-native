/** Renders whatever `src/lib/alertDialog.ts` broadcasts. Mount exactly once, in the root layout. */
import { useEffect, useState } from 'react';
import { Modal, View, Pressable } from 'react-native';
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

  if (!state) return null;

  const press = (button: AlertButton) => {
    setState(null);
    button.onPress?.();
  };

  const stacked = state.buttons.length > 2;

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={() => {}}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.overlay, padding: spacing.xl }}>
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
    </Modal>
  );
}
