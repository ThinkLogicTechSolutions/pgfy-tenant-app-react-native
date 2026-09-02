/** Voice search sheet — listens through the mic via `expo-speech-recognition`, shows a live
 *  animated waveform + transcript, and hands the recognized text back on submit/stop, the same
 *  way a typed query is submitted from the search field. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { palette, spacing, radius } from '@/theme';
import { Text } from './Text';
import { Sheet } from './Sheet';
import { PressableScale } from './PressableScale';
import { VoiceWaveIcon } from './VoiceWaveIcon';
import { haptic } from '@/lib/haptics';

type Status = 'requesting' | 'listening' | 'processing' | 'error';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called with the final recognized text — the caller submits it exactly like a typed query. */
  onResult: (text: string) => void;
}

export function VoiceSearchSheet({ visible, onClose, onResult }: Props) {
  const [status, setStatus] = useState<Status>('requesting');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const volume = useSharedValue(0);
  const finishedRef = useRef(false);

  const finish = useCallback(
    (text: string) => {
      if (finishedRef.current) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      finishedRef.current = true;
      ExpoSpeechRecognitionModule.stop();
      onResult(trimmed);
    },
    [onResult],
  );

  useSpeechRecognitionEvent('start', () => setStatus('listening'));

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    setTranscript(text);
    if (event.isFinal) finish(text);
  });

  useSpeechRecognitionEvent('volumechange', (event) => {
    const normalized = Math.min(1, Math.max(0, event.value / 10));
    volume.value = withTiming(normalized, { duration: 120 });
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (finishedRef.current) return;
    setStatus('error');
    setErrorMessage(
      event.error === 'not-allowed'
        ? 'Microphone and speech recognition permission is needed for voice search.'
        : event.error === 'no-speech'
          ? "Didn't catch that — try again."
          : 'Voice search failed. Please try again.',
    );
  });

  useEffect(() => {
    if (!visible) return;
    finishedRef.current = false;
    setTranscript('');
    setErrorMessage(null);
    setStatus('requesting');
    volume.value = 0;

    let cancelled = false;
    (async () => {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (cancelled) return;
      if (!perm.granted) {
        setStatus('error');
        setErrorMessage('Microphone and speech recognition permission is needed for voice search.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-IN',
        interimResults: true,
        continuous: false,
        volumeChangeEventOptions: { enabled: true, intervalMillis: 100 },
      });
    })();

    return () => {
      cancelled = true;
      ExpoSpeechRecognitionModule.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleClose = () => {
    ExpoSpeechRecognitionModule.abort();
    onClose();
  };

  const handleStop = () => {
    haptic.light();
    if (status === 'error') {
      handleClose();
      return;
    }
    if (transcript.trim()) {
      finish(transcript);
      onClose();
    } else {
      ExpoSpeechRecognitionModule.stop();
    }
  };

  const helperText =
    status === 'error'
      ? errorMessage
      : transcript
        ? transcript
        : status === 'listening'
          ? 'Listening… say a locality or PG name'
          : 'Starting…';

  return (
    <Sheet visible={visible} onClose={handleClose} title="Voice search">
      <View style={{ alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.base, gap: spacing.lg }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: status === 'error' ? palette.dangerTint : palette.navyTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {status === 'error' ? (
            <Ionicons name="mic-off" size={30} color={palette.danger} />
          ) : (
            <VoiceWaveIcon size="lg" active={status === 'listening'} volume={volume} color={palette.navy} />
          )}
        </View>

        <Text
          variant="bodyMd"
          color={status === 'error' ? palette.danger : palette.inkSecondary}
          align="center"
          style={{ minHeight: 42 }}
        >
          {helperText}
        </Text>

        <PressableScale
          onPress={handleStop}
          scaleTo={0.94}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: status === 'error' ? palette.surface : palette.navy,
            borderWidth: status === 'error' ? 1 : 0,
            borderColor: palette.border,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: radius.pill,
          }}
        >
          <Ionicons
            name={status === 'error' ? 'close' : 'stop'}
            size={16}
            color={status === 'error' ? palette.ink : palette.white}
          />
          <Text variant="bodySm" weight="700" color={status === 'error' ? palette.ink : palette.white}>
            {status === 'error' ? 'Close' : 'Stop & search'}
          </Text>
        </PressableScale>
      </View>
    </Sheet>
  );
}
