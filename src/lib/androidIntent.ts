/**
 * Launch an Android `intent:` URI (e.g. SnapKYC's Aadhaar deep link).
 *
 * `Linking.openURL('intent:…')` does NOT work: the `intent:` scheme is an *encoding* of an
 * Intent (action + typed extras), not a real URL the OS can route with ACTION_VIEW. We parse it
 * and hand the action + extras to `Linking.sendIntent`, which builds a proper Intent and
 * `startActivity`s it — no extra native module needed. On iOS (and for any non-intent URL) we
 * just `openURL`, since the backend returns an iOS-appropriate link for `platform:'ios'`.
 *
 * Format handled: `intent:[data]#Intent;action=…;S.key=val;i.key=1;B.key=true;…;end`
 * (`S.`=string, `i.`=int, `l.`=long, `f.`/`d.`=float/double, `B.`=boolean extras).
 */
import { Platform, Linking } from 'react-native';

type IntentExtra = { key: string; value: string | number | boolean };

interface ParsedIntent {
  action?: string;
  extras: IntentExtra[];
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Pull the action and typed extras out of an Android `intent:` URI. */
export function parseAndroidIntentUri(uri: string): ParsedIntent {
  const parsed: ParsedIntent = { extras: [] };
  const marker = uri.indexOf('#Intent;');
  if (marker === -1) return parsed;

  const fragment = uri.slice(marker + '#Intent;'.length).replace(/;?end;?$/i, '');
  for (const token of fragment.split(';')) {
    if (!token) continue;
    const eq = token.indexOf('='); // split on the FIRST '=' — extra values may contain '='
    if (eq === -1) continue;
    const key = token.slice(0, eq);
    const raw = safeDecode(token.slice(eq + 1));

    if (key === 'action') parsed.action = raw;
    else if (key.startsWith('S.')) parsed.extras.push({ key: key.slice(2), value: raw });
    else if (key.startsWith('i.') || key.startsWith('l.')) parsed.extras.push({ key: key.slice(2), value: parseInt(raw, 10) });
    else if (key.startsWith('f.') || key.startsWith('d.')) parsed.extras.push({ key: key.slice(2), value: parseFloat(raw) });
    else if (key.startsWith('B.')) parsed.extras.push({ key: key.slice(2), value: raw === 'true' });
    // package/component/flags/category are intentionally ignored: the action resolves the app.
  }
  return parsed;
}

/**
 * Open a launch URL, turning an Android `intent:` URI into a real Intent via `sendIntent`.
 * Rejects (ActivityNotFoundException) if the target app — e.g. the Aadhaar app — isn't installed;
 * callers should surface that. Falls back to `openURL` when there's no action to send.
 */
export async function launchIntentUrl(url: string): Promise<void> {
  if (Platform.OS === 'android' && url.startsWith('intent:')) {
    const { action, extras } = parseAndroidIntentUri(url);
    if (action) {
      await Linking.sendIntent(action, extras.length ? extras : undefined);
      return;
    }
  }
  await Linking.openURL(url);
}
