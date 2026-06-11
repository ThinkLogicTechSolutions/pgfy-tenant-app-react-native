/** Swipeable property image carousel — listing cards & detail hero. */
import { useCallback, useRef, useState } from 'react';
import { View, ScrollView, Pressable, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { palette } from '@/theme';
import { Text } from '@/components/ui';
import { PROPERTY_IMAGE_ASPECT, propertyImageHeight } from '@/lib/media';

type Props = {
  images: string[];
  width?: number;
  /** width ÷ height — defaults to {@link PROPERTY_IMAGE_ASPECT} (4:3). */
  aspectRatio?: number;
  /** Optional fixed height; otherwise derived from width and aspect ratio. */
  height?: number;
  borderRadius?: number;
  showDots?: boolean;
  showCounter?: boolean;
  /** Cap how many images appear in the carousel (e.g. 5 on listing cards). */
  maxImages?: number;
  onIndexChange?: (index: number) => void;
  /** Tap on image (ignored while the user is swiping between photos). */
  onPress?: () => void;
};

export function PropertyImageCarousel({
  images,
  width: widthProp,
  aspectRatio = PROPERTY_IMAGE_ASPECT,
  height: heightProp,
  borderRadius = 0,
  showDots = false,
  showCounter = false,
  maxImages,
  onIndexChange,
  onPress,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const width = widthProp ?? screenWidth;
  const height = heightProp ?? propertyImageHeight(width, aspectRatio);
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const dragging = useRef(false);
  const visibleImages = maxImages ? images.slice(0, maxImages) : images;

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActive(idx);
    onIndexChange?.(idx);
  }, [onIndexChange, width]);

  if (visibleImages.length === 0) return null;

  return (
    <View style={{ width, height, borderRadius, overflow: 'hidden' }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => { dragging.current = true; }}
        onScrollEndDrag={() => { dragging.current = false; }}
        onMomentumScrollEnd={(e) => {
          onScrollEnd(e);
          dragging.current = false;
        }}
        scrollEventThrottle={16}
        nestedScrollEnabled
        directionalLockEnabled
        decelerationRate="fast"
      >
        {visibleImages.map((uri, i) => (
          <Pressable
            key={`${uri}-${i}`}
            onPress={() => {
              if (!dragging.current) onPress?.();
            }}
            style={{ width, height }}
          >
            <Image
              source={{ uri }}
              style={{ width, height }}
              contentFit="cover"
              transition={200}
            />
          </Pressable>
        ))}
      </ScrollView>

      {showCounter && images.length > 1 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            backgroundColor: 'rgba(1,38,78,0.72)',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
          }}
        >
          <Text variant="caption" color={palette.white}>{active + 1}/{visibleImages.length}</Text>
        </View>
      ) : null}

      {showDots && visibleImages.length > 1 ? (
        <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          {visibleImages.map((_, i) => (
            <View
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === active ? palette.white : 'rgba(255,255,255,0.5)',
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
