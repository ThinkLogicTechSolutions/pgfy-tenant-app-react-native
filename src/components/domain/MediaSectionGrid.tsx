/** Section image grid — full-width hero, then pairs (reference: OTA property media). */
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { palette, radius, spacing } from '@/theme';

const FULL_H = 220;
const PAIR_H = 168;
const GAP = spacing.sm;

function GridImage({ uri, width, height }: { uri: string; width: number; height: number }) {
  return (
    <Image
      source={{ uri }}
      style={{ width, height, borderRadius: radius.md, backgroundColor: palette.surfaceSunken }}
      contentFit="cover"
      transition={200}
    />
  );
}

export function MediaSectionGrid({ images, width }: { images: string[]; width: number }) {
  const halfW = (width - GAP) / 2;
  const rows: ReactNode[] = [];
  let i = 0;

  while (i < images.length) {
    rows.push(<GridImage key={`f-${i}`} uri={images[i]} width={width} height={FULL_H} />);
    i += 1;
    if (i >= images.length) break;

    if (i + 1 < images.length) {
      rows.push(
        <View key={`p-${i}`} style={{ flexDirection: 'row', gap: GAP }}>
          <GridImage uri={images[i]} width={halfW} height={PAIR_H} />
          <GridImage uri={images[i + 1]} width={halfW} height={PAIR_H} />
        </View>,
      );
      i += 2;
    } else {
      rows.push(<GridImage key={`f-${i}`} uri={images[i]} width={width} height={PAIR_H} />);
      i += 1;
    }
  }

  return <View style={{ gap: GAP }}>{rows}</View>;
}
