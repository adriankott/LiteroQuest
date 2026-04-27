import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useProgress } from '../../hooks/useProgress';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/types';
import type { SupportedLanguage } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface GameCard {
  key: keyof RootStackParamList;
  emoji: string;
  titleKey: string;
  descKey: string;
  color: string;
}

const GAME_CARDS: GameCard[] = [
  { key: 'Alphabet', emoji: '🔤', titleKey: 'home.alphabet', descKey: 'home.alphabetDesc', color: colors.primary },
  { key: 'Phonics', emoji: '🔊', titleKey: 'home.phonics', descKey: 'home.phonicsDesc', color: colors.secondary },
  { key: 'Words', emoji: '📖', titleKey: 'home.words', descKey: 'home.wordsDesc', color: colors.purple },
  { key: 'Progress', emoji: '📊', titleKey: 'home.progress', descKey: 'home.progressDesc', color: colors.accent },
];

const LANG_OPTIONS: { code: SupportedLanguage; flag: string }[] = [
  { code: 'ro', flag: '🇷🇴' },
  { code: 'en', flag: '🇬🇧' },
];

export function HomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { currentProfile, language, setLanguage } = useApp();
  const { totalStars, learnedCount } = useProgress(currentProfile?.id);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t('home.hello', { name: currentProfile?.name ?? '' })}
            </Text>
            <Text style={styles.stars}>⭐ {totalStars} {t('common.stars')}</Text>
          </View>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{currentProfile?.avatar}</Text>
          </View>
        </View>

        {/* Language switcher */}
        <View style={styles.langRow}>
          {LANG_OPTIONS.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, language === l.code && styles.langBtnActive]}
              onPress={() => setLanguage(l.code)}
            >
              <Text style={styles.langFlag}>{l.flag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Game cards */}
        <View style={styles.grid}>
          {GAME_CARDS.map((card) => (
            <TouchableOpacity
              key={card.key}
              style={[styles.card, { borderTopColor: card.color }, shadow.md]}
              onPress={() => navigation.navigate(card.key as any)}
              activeOpacity={0.82}
            >
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <Text style={[styles.cardTitle, { color: card.color }]}>{t(card.titleKey)}</Text>
              <Text style={styles.cardDesc}>{t(card.descKey)}</Text>
              {card.key === 'Alphabet' && (
                <Text style={styles.cardStat}>
                  {learnedCount('alphabet')} {t('common.of')} {language === 'ro' ? 31 : 26}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
  },
  stars: {
    fontSize: fontSize.md,
    color: colors.textLight,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  avatarText: { fontSize: 34 },
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'flex-end',
  },
  langBtn: {
    padding: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langBtnActive: { borderColor: colors.primary },
  langFlag: { fontSize: 26 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderTopWidth: 5,
    padding: spacing.lg,
    width: '47%',
    gap: spacing.xs,
    ...shadow.md,
  },
  cardEmoji: { fontSize: 36 },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
  },
  cardDesc: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    fontWeight: fontWeight.medium,
  },
  cardStat: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
