import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize } from '../../constants/theme';

interface StarRatingProps {
  stars: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ stars, max = 3, size = 'md' }: StarRatingProps) {
  const starSize = { sm: fontSize.sm, md: fontSize.lg, lg: fontSize.xl }[size];

  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, i) => (
        <Text
          key={i}
          style={[
            styles.star,
            { fontSize: starSize },
            i >= stars && styles.empty,
          ]}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    color: colors.accent,
  },
  empty: {
    color: colors.border,
  },
});
