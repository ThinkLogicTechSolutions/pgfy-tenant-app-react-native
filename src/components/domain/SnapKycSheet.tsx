/**
 * SnapKYC Aadhaar verification dialog (tenant KYC).
 *
 * The flow is launch-and-listen: POST a SnapKYC session → open the returned `intent_url` (the
 * official Aadhaar app) → keep a progress dialog up while the user verifies there → resolve the
 * outcome from the realtime socket (`v1/profile-kyc created`) rather than any HTTP response.
 *
 * The socket is the app-wide `socketManager` (opened by AuthContext), so we only *subscribe*
 * here. A Cancel button is revealed 10s after the intent launches so the user is never trapped
 * if they abandon verification or the Aadhaar app never returns a result.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, View, ActivityIndicator, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, spacing, radius } from '@/theme';
import { Text, Button } from '@/components/ui';
import { snapKycApi, errorMessage } from '@/lib/api';
import { socketManager, SocketEvents } from '@/lib/socket';
import { launchIntentUrl } from '@/lib/androidIntent';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/context/AuthContext';

/** How long after launching the Aadhaar app before the Cancel button appears. */
const CANCEL_AFTER_MS = 10_000;

/**
 * The intent action SnapKYC targets (`in.gov.uidai.pehchaan.WEB_INTENT_REQUEST`) is UIDAI's
 * "Aadhaar" app, not the older "mAadhaar" app — different Play Store listing, same publisher.
 * If nothing on the device resolves that action, send the user straight to install it instead
 * of leaving them at a dead-end error.
 */
const AADHAAR_APP_PACKAGE = 'in.gov.uidai.pehchaan';

async function openAadhaarAppStore() {
  try {
    await Linking.openURL(`market://details?id=${AADHAAR_APP_PACKAGE}`);
  } catch {
    await Linking.openURL(`https://play.google.com/store/apps/details?id=${AADHAAR_APP_PACKAGE}`).catch(() => {});
  }
}

type Phase = 'starting' | 'waiting' | 'success' | 'error';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Fired once the socket reports a verified session — navigate to the next step here. */
  onVerified: () => void | Promise<void>;
}

/** The exact `kyc_status` enum the server emits on `v1/profile-kyc created`. */
type SocketKycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'DUPLICATE_AADHAAR';

interface ProfileKycRecord {
  kyc_status: SocketKycStatus;
  entity_id: string;
  entity_type: string;
}

function isProfileKycRecord(record: unknown): record is ProfileKycRecord {
  if (!record || typeof record !== 'object') return false;
  const r = record as Record<string, unknown>;
  return typeof r.kyc_status === 'string' && typeof r.entity_id === 'string' && typeof r.entity_type === 'string';
}

/** Terminal outcome from the record's `kyc_status` — VERIFIED wins, REJECTED/DUPLICATE_AADHAAR fail. */
function readOutcome(record: ProfileKycRecord): 'success' | 'failed' | 'pending' | 'duplicate' {
  if (record.kyc_status === 'VERIFIED') return 'success';
  if (record.kyc_status === 'REJECTED') return 'failed';
  if (record.kyc_status === 'DUPLICATE_AADHAAR') return 'duplicate';
  return 'pending'; // NOT_SUBMITTED | PENDING
}

/** True when the patched record is this signed-in tenant's own KYC entity. */
function matchesEntity(record: ProfileKycRecord, entityId: string | null): boolean {
  if (entityId && record.entity_id !== entityId) return false;
  if (record.entity_type !== 'TENANT') return false;
  return true;
}

export function SnapKycSheet({ visible, onClose, onVerified }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('starting');
  const [showCancel, setShowCancel] = useState(false);
  const [message, setMessage] = useState('');
  /** Specifically "no app on this device resolves the Aadhaar intent" — offers the Play Store CTA. */
  const [appNotInstalled, setAppNotInstalled] = useState(false);

  const txnRef = useRef<string | null>(null);
  const intentUrlRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settledRef = useRef(false);

  const cleanup = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    if (cancelTimerRef.current) clearTimeout(cancelTimerRef.current);
    cancelTimerRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  const handleSuccess = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    cleanup();
    haptic.success();
    setPhase('success');
    void onVerified();
  }, [cleanup, onVerified]);

  const handleFailure = useCallback(
    (msg: string) => {
      if (settledRef.current) return;
      settledRef.current = true;
      cleanup();
      haptic.error();
      setPhase('error');
      setMessage(msg);
      setShowCancel(true);
    },
    [cleanup],
  );

  useEffect(() => {
    if (!visible) return;

    let active = true;
    settledRef.current = false;
    setPhase('starting');
    setShowCancel(false);
    setMessage('');
    setAppNotInstalled(false);

    (async () => {
      // Subscribe *before* launching so we never miss an early result.
      unsubscribeRef.current = socketManager.on(SocketEvents.snapKycPatched, (record: unknown) => {
        if (settledRef.current || !isProfileKycRecord(record)) return;
        if (!matchesEntity(record, user ? String(user.id) : null)) return;

        const outcome = readOutcome(record);
        if (outcome === 'success') {
          handleSuccess();
        } else if (outcome === 'failed') {
          handleFailure('Aadhaar verification failed or was cancelled. Please try again.');
        } else if (outcome === 'duplicate') {
          handleFailure('This Aadhaar is already used in another account.');
        }
      });

      try {
        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        const created = await snapKycApi.createSession({ platform, flow: 'INTENT', type: 'TENANT' });
        if (!active) return;
        txnRef.current = created.txn_id;
        intentUrlRef.current = created.intent_url;

        // Launch the Aadhaar app. A failure here is almost always "app not installed" — Android
        // throws ActivityNotFoundException when nothing on the device resolves the intent.
        try {
          await launchIntentUrl(created.intent_url);
        } catch {
          if (active) setAppNotInstalled(true);
          throw new Error("We couldn't open the Aadhaar verification app. It may not be installed on this device.");
        }
        if (!active) return;
        setPhase('waiting');

        // Reveal the escape hatch a few seconds after the Aadhaar app takes over.
        cancelTimerRef.current = setTimeout(() => {
          if (active && !settledRef.current) setShowCancel(true);
        }, CANCEL_AFTER_MS);
      } catch (e) {
        if (!active) return;
        settledRef.current = true;
        cleanup();
        setPhase('error');
        setMessage(errorMessage(e, "We couldn't start Aadhaar verification. Please try again."));
        setShowCancel(true);
      }
    })();

    return () => {
      active = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const reopenAadhaar = () => {
    if (intentUrlRef.current) launchIntentUrl(intentUrlRef.current).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: palette.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <View style={{ width: '100%', maxWidth: 360, backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.md }}>
          {phase === 'success' ? (
            <>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.successTint, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-done" size={32} color={palette.success} />
              </View>
              <Text variant="h3" align="center">Identity Verified</Text>
              <Text variant="bodySm" color={palette.inkSecondary} align="center" style={{ lineHeight: 20 }}>
                Your Aadhaar KYC is complete. Taking you to the next step…
              </Text>
            </>
          ) : phase === 'error' ? (
            <>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: palette.dangerTint, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="alert-circle-outline" size={32} color={palette.danger} />
              </View>
              <Text variant="h3" align="center">Verification Incomplete</Text>
              <Text variant="bodySm" color={palette.inkSecondary} align="center" style={{ lineHeight: 20 }}>
                {message}
              </Text>
              {appNotInstalled && Platform.OS === 'android' ? (
                <Button label="Get the Aadhaar app" icon="download-outline" onPress={openAadhaarAppStore} full size="lg" style={{ marginTop: spacing.sm }} />
              ) : null}
              <Button
                label="Close"
                variant="outline"
                onPress={handleClose}
                full
                size="lg"
                style={{ marginTop: appNotInstalled && Platform.OS === 'android' ? spacing.xs : spacing.sm }}
              />
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={palette.coral} style={{ marginTop: spacing.sm }} />
              <Text variant="h3" align="center" style={{ marginTop: spacing.sm }}>
                {phase === 'starting' ? 'Starting verification…' : 'Verifying your identity'}
              </Text>
              <Text variant="bodyMd" weight="600" color={palette.ink} align="center">
                Continue your KYC in the official Aadhaar app
              </Text>
              <Text variant="bodySm" color={palette.inkSecondary} align="center" style={{ lineHeight: 20 }}>
                Keep this screen open — we'll update automatically once the Aadhaar app confirms your identity.
              </Text>

              {phase === 'waiting' ? (
                <Pressable onPress={reopenAadhaar} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs }}>
                  <Ionicons name="open-outline" size={15} color={palette.coral} />
                  <Text variant="bodySm" weight="700" color={palette.coral}>Reopen Aadhaar app</Text>
                </Pressable>
              ) : null}

              {showCancel ? (
                <Button label="Cancel verification" variant="ghost" onPress={handleClose} full size="md" style={{ marginTop: spacing.xs }} />
              ) : null}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
