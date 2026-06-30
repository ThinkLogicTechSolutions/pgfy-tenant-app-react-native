/**
 * Firebase Cloud Messaging (FCM) wiring.
 *
 * Android is fully configured (google-services.json + @react-native-firebase plugins).
 * iOS Firebase is pending its GoogleService-Info.plist — every call here is guarded so
 * the app never crashes when the native Firebase app isn't configured yet.
 *
 * Usage: call `useMessaging()` once from the root layout. The background handler is
 * registered as a module side-effect (imported early via the root layout).
 */
import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import messaging, { type FirebaseMessagingTypes } from '@react-native-firebase/messaging';

/** True until iOS gets its GoogleService-Info.plist; keeps FCM no-op on iOS for now. */
const FCM_SUPPORTED = Platform.OS === 'android';

// Background / quit-state message handler. Registered at import time, before the app
// tree mounts. Guarded so a missing native Firebase app doesn't throw on startup.
if (FCM_SUPPORTED) {
  try {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[FCM] background message', remoteMessage?.messageId);
    });
  } catch (e) {
    console.warn('[FCM] background handler not registered', e);
  }
}

/** Ask the OS for notification permission (iOS prompt / Android 13+ runtime permission). */
async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      return res === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }
  const status = await messaging().requestPermission();
  return (
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL
  );
}

/** Request permission and return the device FCM token (or null if unavailable). */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!FCM_SUPPORTED) return null;
  try {
    const granted = await requestPermission();
    if (!granted) return null;
    const token = await messaging().getToken();
    console.log('[FCM] device token', token);
    // TODO: POST the token to the backend so it can target this device.
    return token;
  } catch (e) {
    console.warn('[FCM] registration failed', e);
    return null;
  }
}

/** Root-level hook: registers the device and subscribes to foreground + token-refresh events. */
export function useMessaging() {
  useEffect(() => {
    if (!FCM_SUPPORTED) return;

    registerForPushNotifications();

    let unsubscribeMessage: (() => void) | undefined;
    let unsubscribeRefresh: (() => void) | undefined;
    try {
      unsubscribeMessage = messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        // Foreground push: the OS won't show a tray notification, so handle it in-app here.
        console.log('[FCM] foreground message', remoteMessage?.notification?.title);
      });
      unsubscribeRefresh = messaging().onTokenRefresh((token) => {
        console.log('[FCM] token refreshed', token);
        // TODO: sync the refreshed token to the backend.
      });
    } catch (e) {
      console.warn('[FCM] listeners not attached', e);
    }

    return () => {
      unsubscribeMessage?.();
      unsubscribeRefresh?.();
    };
  }, []);
}
