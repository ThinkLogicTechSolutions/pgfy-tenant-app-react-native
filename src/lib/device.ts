/**
 * Stable per-install device identity for the auth endpoints.
 *
 * The API takes a `deviceId` (unique per install) and a `deviceType` enum on every
 * `/authenticate` call so it can bind the session to this device. We mint a random id on
 * first use and persist it, so the id survives restarts but resets on reinstall — which is
 * exactly the lifetime the backend expects for a device-bound session.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'pgfy.deviceId';

/** API enum: 1 = Web · 2 = Android · 3 = iOS. */
export const DeviceType = {
  Web: 1,
  Android: 2,
  Ios: 3,
} as const;

export type DeviceTypeValue = (typeof DeviceType)[keyof typeof DeviceType];

/** This build's device type — the app ships on Android + iOS; web is the fallback. */
export const DEVICE_TYPE: DeviceTypeValue =
  Platform.OS === 'ios' ? DeviceType.Ios : Platform.OS === 'android' ? DeviceType.Android : DeviceType.Web;

/** 32 hex chars. `crypto.randomUUID` isn't guaranteed in RN's JS runtime, so build it by hand. */
function randomDeviceId(): string {
  let out = '';
  for (let i = 0; i < 32; i += 1) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

let cached: string | null = null;
let inflight: Promise<string> | null = null;

/** Read (or mint + persist) this install's device id. Concurrent callers share one read. */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (stored) {
        cached = stored;
        return stored;
      }
      const fresh = randomDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, fresh);
      cached = fresh;
      return fresh;
    } catch {
      // Storage unavailable — fall back to an in-memory id so auth still works this session.
      cached = cached ?? randomDeviceId();
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
