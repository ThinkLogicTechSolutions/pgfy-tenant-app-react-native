/** Generic paged horizontal carousel with dot indicators — one full-width card per page.
 * Sizes itself off its own rendered width (`onLayout`) so it works inside any padded
 * container without the caller having to compute a page width. */
import { useCallback, useState } from 'react';
import { View, ScrollView, type NativeSyntheticEvent, type NativeScrollEvent, type LayoutChangeEvent } from 'react-native';
import { palette, spacing } from '@/theme';

interface Props<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
}

export function CardCarousel<T>({ data, renderItem, keyExtractor }: Props<T>) {
  const [pageWidth, setPageWidth] = useState(0);
  const [active, setActive] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setPageWidth(e.nativeEvent.layout.width);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!pageWidth) return;
    setActive(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
  }, [pageWidth]);

  if (data.length === 0) return null;

  return (
    <View onLayout={onLayout}>
      {pageWidth > 0 ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd}>
          {data.map((item, i) => (
            <View key={keyExtractor(item, i)} style={{ width: pageWidth }}>
              {renderItem(item, i)}
            </View>
          ))}
        </ScrollView>
      ) : null}
      {data.length > 1 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm }}>
          {data.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === active ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === active ? palette.coral : palette.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
