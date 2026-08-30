import { requireOptionalNativeModule } from 'expo-modules-core';

/** Android-only local module — `null` on iOS / Expo Go, where the native side isn't built. */
const PgfyWallet = requireOptionalNativeModule<{
  shareImageToPackage(filePath: string, packageName: string): Promise<boolean>;
  openWalletChooser(filePath: string, dialogTitle?: string): Promise<boolean>;
}>('PgfyWallet');

/**
 * Sends a captured image straight to a specific Android app (bypassing the share chooser).
 * Resolves `true` when the target app was launched, `false` when it isn't installed, and
 * `null` when the native module is unavailable (iOS) so the caller can pick another path.
 */
export async function shareImageToPackage(filePath: string, packageName: string): Promise<boolean | null> {
  if (!PgfyWallet) return null;
  return PgfyWallet.shareImageToPackage(filePath, packageName);
}

/**
 * Opens a tailored chooser for installed wallet apps (Google Wallet, Samsung Wallet, etc.)
 * populated with targeted intents for pass image import.
 * Resolves `true` when the chooser was displayed, `false` when no supported wallet app is installed,
 * and `null` on iOS / Expo Go.
 */
export async function openWalletChooser(filePath: string, dialogTitle?: string): Promise<boolean | null> {
  if (!PgfyWallet) return null;
  return PgfyWallet.openWalletChooser(filePath, dialogTitle);
}

export default PgfyWallet;
