import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface VoiceVisualizerProps {
  bars: number[];
  isSpeaking: boolean;
  rms: number;
  color?: string;
  height?: number;
}

export function VoiceVisualizer({
  bars,
  isSpeaking,
  rms,
  color = '#00ff88',
  height = 80,
}: VoiceVisualizerProps) {
  const animatedValues = useRef<Animated.Value[]>(
    bars.map(() => new Animated.Value(0))
  ).current;

  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate each bar to its target value
    const animations = animatedValues.map((anim, i) => {
      const target = bars[i] ?? 0;
      return Animated.timing(anim, {
        toValue: target,
        duration: 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      });
    });

    Animated.parallel(animations).start();
  }, [bars, animatedValues]);

  useEffect(() => {
    // Glow pulse when speaking
    if (isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  }, [isSpeaking, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <View style={[styles.container, { height }]}>
      {/* Glow background */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            backgroundColor: color,
          },
        ]}
      />

      {/* Bars */}
      <View style={styles.barsContainer}>
        {animatedValues.map((anim, i) => {
          const barHeight = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [2, height * 0.9],
          });

          const opacity = anim.interpolate({
            inputRange: [0, 0.05, 1],
            outputRange: [0.15, 0.4, 1],
          });

          // Mirror effect: bars get brighter towards center
          const centerDist = Math.abs(i - animatedValues.length / 2) / (animatedValues.length / 2);
          const saturation = 1 - centerDist * 0.3;

          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  height: barHeight,
                  opacity,
                  backgroundColor: color,
                  transform: [{ scaleX: saturation }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: 2,
  },
});
