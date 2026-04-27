import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { useApp } from '../../context/AppContext';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/types';
import type { SupportedLanguage } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const LANGUAGES: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function WelcomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { language, setLanguage } = useApp();
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const pulseLogo = () => {
    Animated.sequence([
      Animated.spring(bounceAnim, { toValue: 1.12, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.top}>
          <TouchableOpacity onPress={pulseLogo} activeOpacity={0.9}>
            <Animated.Text
              style={[styles.logo, { transform: [{ scale: bounceAnim }] }]}
            >
              📖
            </Animated.Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('welcome.title')}</Text>
          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        </View>

        <View style={styles.langSection}>
          <Text style={styles.langLabel}>{t('welcome.chooseLang')}</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[
                  styles.langCard,
                  language === l.code && styles.langCardActive,
                  shadow.md,
                ]}
                onPress={() => setLanguage(l.code)}
                activeOpacity={0.8}
              >
                <Text style={styles.flag}>{l.flag}</Text>
                <Text
                  style={[
                    styles.langName,
                    language === l.code && styles.langNameActive,
                  ]}
                >
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          label={t('welcome.start')}
          size="lg"
          style={styles.btn}
          onPress={() => navigation.replace('CreateProfile')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  top: { alignItems: 'center', gap: spacing.sm },
  logo: { fontSize: 96 },
  title: {
    fontSize: fontSize.xxl + 8,
    fontWeight: fontWeight.heavy,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textLight,
    fontWeight: fontWeight.medium,
  },
  langSection: { alignItems: 'center', gap: spacing.md, width: '100%' },
  langLabel: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  langRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  langCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 120,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  langCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '30',
  },
  flag: { fontSize: 40 },
  langName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textLight,
  },
  langNameActive: { color: colors.primary },
  btn: { width: '80%' },
});
