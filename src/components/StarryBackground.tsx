import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

interface Star {
  left: number;
  top: number;
  size: number;
  opacity: number;
}

const createStars = (count: number, width: number, height: number, size: number): Star[] => {
  const stars: Star[] = [];

  if (!width || !height) {
    return stars;
  }

  for (let i = 0; i < count; i += 1) {
    stars.push({
      left: Math.random() * width,
      top: Math.random() * height * 2,
      size,
      opacity: 0.4 + Math.random() * 0.6,
    });
  }

  return stars;
};

const StarryBackground: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const effectiveHeight = height || 800;

  const smallLayerOffset = useRef(new Animated.Value(0)).current;
  const mediumLayerOffset = useRef(new Animated.Value(0)).current;
  const bigLayerOffset = useRef(new Animated.Value(0)).current;

  const smallStars = useMemo(
    () => createStars(140, width, effectiveHeight, 1),
    [width, effectiveHeight],
  );

  const mediumStars = useMemo(
    () => createStars(90, width, effectiveHeight, 2),
    [width, effectiveHeight],
  );

  const bigStars = useMemo(
    () => createStars(50, width, effectiveHeight, 3),
    [width, effectiveHeight],
  );

  useEffect(() => {
    const createLoop = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: -effectiveHeight,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      );

    const smallAnimation = createLoop(smallLayerOffset, 50000);
    const mediumAnimation = createLoop(mediumLayerOffset, 90000);
    const bigAnimation = createLoop(bigLayerOffset, 140000);

    smallAnimation.start();
    mediumAnimation.start();
    bigAnimation.start();

    return () => {
      smallAnimation.stop();
      mediumAnimation.stop();
      bigAnimation.stop();
    };
  }, [effectiveHeight, smallLayerOffset, mediumLayerOffset, bigLayerOffset]);

  if (!width || !effectiveHeight) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View
        style={[
          styles.starsLayer,
          {
            height: effectiveHeight * 2,
            transform: [{ translateY: smallLayerOffset }],
          },
        ]}
      >
        {smallStars.map((star, index) => (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={`small-star-${index}`}
            style={[
              styles.star,
              {
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                left: star.left,
                top: star.top,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View
        style={[
          styles.starsLayer,
          {
            height: effectiveHeight * 2,
            transform: [{ translateY: mediumLayerOffset }],
          },
        ]}
      >
        {mediumStars.map((star, index) => (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={`medium-star-${index}`}
            style={[
              styles.star,
              {
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                left: star.left,
                top: star.top,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View
        style={[
          styles.starsLayer,
          {
            height: effectiveHeight * 2,
            transform: [{ translateY: bigLayerOffset }],
          },
        ]}
      >
        {bigStars.map((star, index) => (
          <View
            // eslint-disable-next-line react/no-array-index-key
            key={`big-star-${index}`}
            style={[
              styles.star,
              {
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                left: star.left,
                top: star.top,
                opacity: star.opacity,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  starsLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});

export default StarryBackground;
