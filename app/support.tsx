/** T-S23 — Routes to platform or property support screens. */
import { useLocalSearchParams } from 'expo-router';
import { PlatformSupport, PropertySupport } from '@/components/support';
import type { SupportKind } from '@/data';

export default function Support() {
  const { kind } = useLocalSearchParams<{ kind?: SupportKind }>();

  if (kind === 'property') {
    return <PropertySupport />;
  }

  return <PlatformSupport />;
}
