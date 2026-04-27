import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const bg = {
    primary: colors.primary,
    secondary: colors.secondary,
    ghost: 'transparent',
    danger: colors.danger,
  }[variant];

  const textColor = variant === 'ghost' ? colors.primary : '#fff';

  const paddingV = { sm: spacing.sm, md: spacing.md, lg: spacing.lg }[size];
  const textSize = { sm: fontSize.sm, md: fontSize.md, lg: fontSize.lg }[size];

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: bg, paddingVertical: paddingV },
        variant === 'ghost' && styles.ghost,
        (disabled || loading) && styles.disabled,
        shadow.md,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor, fontSize: textSize }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: fontWeight.bold,
    letterSpacing: 0.3,
  },
  ghost: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
