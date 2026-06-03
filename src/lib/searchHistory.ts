/** Persisted location / area search history for the tenant app. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RECENT_SEARCHES } from '@/data';

const KEY = 'pgfy.tenant.searchHistory';
const MAX = 8;

export async function getSearchHistory(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fall through */
  }
  return [...RECENT_SEARCHES];
}

export async function addSearchHistory(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) return getSearchHistory();
  const prev = await getSearchHistory();
  const next = [trimmed, ...prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
