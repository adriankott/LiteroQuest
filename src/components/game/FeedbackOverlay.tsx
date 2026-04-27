import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight } from '../../constants/theme';

interface FeedbackOverlayProps {
  visible: boolean;
  isCorrect: boolean;
  correctAnswer?: string;
}

export function FeedbackOverlay({ visible, isCorrect, correctAnswer }: FeedbackOverlayProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scale, { toValue: 1.15, damping: 8, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, damping: 12, useNativeDriver: true }),
        ]),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.bubble,
          isCorrect ? styles.correct : styles.wrong,
          { transform: [{ scale }], opacity },
        ]}
      >
        <Text style={styles.icon}>{isCorrect ? '🎉' : '😅'}</Text>
        {!isCorrect && correctAnswer && (
          <Text style={styles.hint}>→ {correctAnswer}</Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bubble: {
    borderRadius: 999,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  correct: {
    backgroundColor: colors.success,
  },
  wrong: {
    backgroundColor: colors.danger,
  },
  icon: {
    fontSize: fontSize.xxl,
  },
  hint: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: '#fff',
    textAlign: 'center',
  },
});
