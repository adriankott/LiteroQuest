import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StarRating } from '../../components/common/StarRating';
import { useApp } from '../../context/AppContext';
import { useProgress } from '../../hooks/useProgress';
import { getAlphabet } from '../../constants/alphabet';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>;

interface Achievement {
  id: string;
  emoji: string;
  titleKey: string;
  descKey: string;
  unlocked: boolean;
}

export function ProgressScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { currentProfile, language } = useApp();
  const { learnedCount, isLearned, totalStars, fetchBestScore } = useProgress(currentProfile?.id);

  const [phonicsBest, setPhonicsBest] = useState(0);
  const [wordsBest, setWordsBest] = useState(0);

  const alphabet = getAlphabet(language);
  const alphabetTotal = alphabet.length;
  const lettersLearned = learnedCount('alphabet');

  useEffect(() => {
    (async () => {
      const [p, w] = await Promise.all([
        fetchBestScore('phonics'),
        fetchBestScore('words'),
      ]);
      setPhonicsBest(p);
      setWordsBest(w);
    })();
  }, [fetchBestScore]);

  const achievements: Achievement[] = [
    {
      id: 'firstLetter',
      emoji: '🎉',
      titleKey: 'achievements.firstLetter',
      descKey: 'achievements.firstLetterDesc',
      unlocked: lettersLearned >= 1,
    },
    {
      id: 'allVowels',
      emoji: '🎵',
      titleKey: 'achievements.allVowels',
      descKey: 'achievements.allVowelsDesc',
      unlocked: language === 'ro'
        ? ['A', 'Ă', 'Â', 'E', 'I', 'Î', 'O', 'U'].every((v) => isLearned(`letter_${v}`))
        : ['A', 'E', 'I', 'O', 'U'].every((v) => isLearned(`letter_${v}`)),
    },
    {
      id: 'halfAlphabet',
      emoji: '📖',
      titleKey: 'achievements.halfAlphabet',
      descKey: 'achievements.halfAlphabetDesc',
      unlocked: lettersLearned >= Math.floor(alphabetTotal / 2),
    },
    {
      id: 'fullAlphabet',
      emoji: '🏅',
      titleKey: 'achievements.fullAlphabet',
      descKey: 'achievements.fullAlphabetDesc',
      unlocked: lettersLearned >= alphabetTotal,
    },
    {
      id: 'phonicsPerfect',
      emoji: '🔊',
      titleKey: 'achievements.phonicsPerfect',
      descKey: 'achievements.phonicsPerfectDesc',
      unlocked: phonicsBest >= 3,
    },
    {
      id: 'wordsPerfect',
      emoji: '📚',
      titleKey: 'achievements.wordsPerfect',
      descKey: 'achievements.wordsPerfectDesc',
      unlocked: wordsBest >= 3,
    },
  ];

  const alphabetPct = alphabetTotal > 0 ? lettersLearned / alphabetTotal : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('progress.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, shadow.sm]}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{totalStars}</Text>
            <Text style={styles.statLabel}>{t('progress.totalStars')}</Text>
          </View>
          <View style={[styles.statCard, shadow.sm]}>
            <Text style={styles.statEmoji}>🔤</Text>
            <Text style={styles.statValue}>{lettersLearned}</Text>
            <Text style={styles.statLabel}>{t('progress.lettersLearned')}</Text>
          </View>
        </View>

        {/* Alphabet progress */}
        <View style={[styles.section, shadow.sm]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('progress.lettersLearned')}</Text>
            <Text style={styles.sectionCount}>
              {lettersLearned} {t('common.of')} {alphabetTotal}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${alphabetPct * 100}%`, backgroundColor: colors.primary }]}
            />
          </View>
        </View>

        {/* Game scores */}
        <View style={[styles.section, shadow.sm]}>
          <Text style={styles.sectionTitle}>{t('progress.phonicsBest')}</Text>
          <StarRating stars={phonicsBest} size="md" />
        </View>

        <View style={[styles.section, shadow.sm]}>
          <Text style={styles.sectionTitle}>{t('progress.wordsBest')}</Text>
          <StarRating stars={wordsBest} size="md" />
        </View>

        {/* Achievements */}
        <Text style={styles.achievementsTitle}>{t('progress.achievements')}</Text>
        {achievements.map((a) => (
          <View
            key={a.id}
            style={[
              styles.achievementRow,
              shadow.sm,
              !a.unlocked && styles.achievementLocked,
            ]}
          >
            <Text style={[styles.achievementEmoji, !a.unlocked && styles.lockedEmoji]}>
              {a.unlocked ? a.emoji : '🔒'}
            </Text>
            <View style={styles.achievementText}>
              <Text
                style={[
                  styles.achievementTitle,
                  !a.unlocked && { color: colors.textMuted },
                ]}
              >
                {t(a.titleKey)}
              </Text>
              <Text style={styles.achievementDesc}>{t(a.descKey)}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.keepGoing}>{t('progress.keepGoing')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: fontSize.xl, color: colors.primary },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statEmoji: { fontSize: 32 },
  statValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  sectionCount: { fontSize: fontSize.sm, color: colors.textLight, fontWeight: fontWeight.medium },
  progressBar: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  achievementsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    marginTop: spacing.sm,
  },
  achievementRow: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  achievementLocked: { opacity: 0.55 },
  achievementEmoji: { fontSize: 32 },
  lockedEmoji: { opacity: 0.5 },
  achievementText: { flex: 1 },
  achievementTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  achievementDesc: { fontSize: fontSize.sm, color: colors.textLight },
  keepGoing: {
    textAlign: 'center',
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
});
