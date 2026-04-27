import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { FeedbackOverlay } from '../../components/game/FeedbackOverlay';
import { StarRating } from '../../components/common/StarRating';
import { useApp } from '../../context/AppContext';
import { useProgress } from '../../hooks/useProgress';
import { useSound } from '../../hooks/useSound';
import { getWords, pickDistractors, shuffleArray } from '../../constants/words';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/types';
import { TOTAL_ROUNDS, Word } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Words'>;

interface Round {
  correct: Word;
  options: Word[];
}

function calcStars(score: number, total: number): number {
  const pct = score / total;
  if (pct === 1) return 3;
  if (pct >= 0.7) return 2;
  if (pct >= 0.4) return 1;
  return 0;
}

function buildRounds(language: string): Round[] {
  const words = getWords(language);
  return shuffleArray(words)
    .slice(0, TOTAL_ROUNDS)
    .map((w) => {
      const distractors = pickDistractors(words, w, 2);
      return {
        correct: w,
        options: shuffleArray([w, ...distractors]),
      };
    });
}

export function WordsGameScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { language, currentProfile } = useApp();
  const { speak } = useSound();
  const { saveProgress } = useProgress(currentProfile?.id);

  const [rounds] = useState<Round[]>(() => buildRounds(language));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [phase, setPhase] = useState<'playing' | 'result'>('playing');
  const [stars, setStars] = useState(0);

  const emojiScale = useRef(new Animated.Value(1)).current;
  const round = rounds[current];

  useEffect(() => {
    if (round) {
      setTimeout(() => speak(round.correct.word), 300);
    }
  }, [current]);

  const emojiStyle = { transform: [{ scale: emojiScale }] };

  const handleAnswer = useCallback(
    async (word: Word) => {
      if (selected) return;
      speak(word.word);
      const correct = word.word === round.correct.word;
      setSelected(word.word);
      setIsCorrect(correct);
      setShowFeedback(true);

      Animated.sequence([
        Animated.spring(emojiScale, { toValue: 1.25, damping: 6, useNativeDriver: true }),
        Animated.spring(emojiScale, { toValue: 1, damping: 10, useNativeDriver: true }),
      ]).start();

      if (correct) {
        setScore((s) => s + 1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      setTimeout(() => {
        setShowFeedback(false);
        setSelected(null);
        if (current + 1 >= TOTAL_ROUNDS) {
          const finalScore = correct ? score + 1 : score;
          const s = calcStars(finalScore, TOTAL_ROUNDS);
          setStars(s);
          setScore(finalScore);
          setPhase('result');
          saveProgress('words', 'session', s);
        } else {
          setCurrent((c) => c + 1);
        }
      }, 1300);
    },
    [selected, round, current, score],
  );

  if (phase === 'result') {
    const msg =
      stars === 3
        ? t('words.perfect')
        : stars === 2
          ? t('words.great')
          : stars >= 1
            ? t('words.good')
            : t('words.tryAgain');

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.result}>
          <Text style={styles.resultEmoji}>{stars >= 2 ? '📚' : stars === 1 ? '👍' : '💪'}</Text>
          <Text style={styles.resultTitle}>{t('words.resultTitle')}</Text>
          <StarRating stars={stars} size="lg" />
          <Text style={styles.resultScore}>
            {t('words.resultScore', { score, total: TOTAL_ROUNDS })}
          </Text>
          <Text style={styles.resultMsg}>{msg}</Text>
          <Button label={t('words.playAgain')} onPress={() => navigation.replace('Words')} />
          <Button
            label={t('words.goHome')}
            variant="ghost"
            onPress={() => navigation.navigate('Home')}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.roundText}>
          {t('words.round', { current: current + 1, total: TOTAL_ROUNDS })}
        </Text>
        <Text style={styles.scoreText}>⭐ {score}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${(current / TOTAL_ROUNDS) * 100}%` }]}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.instruction}>{t('words.instruction')}</Text>

        {/* Emoji — tap to hear word */}
        <TouchableOpacity onPress={() => speak(round.correct.word)} activeOpacity={0.8}>
          <Animated.Text style={[styles.emojiLarge, emojiStyle]}>
            {round.correct.emoji}
          </Animated.Text>
        </TouchableOpacity>

        <Text style={styles.tapHint}>{t('words.tap')}</Text>

        {/* Word options */}
        <View style={styles.options}>
          {round.options.map((opt) => {
            const isSelected = selected === opt.word;
            const isRight = isSelected && opt.word === round.correct.word;
            const isWrong = isSelected && opt.word !== round.correct.word;
            return (
              <TouchableOpacity
                key={opt.word}
                style={[
                  styles.wordBtn,
                  shadow.md,
                  isRight && styles.btnCorrect,
                  isWrong && styles.btnWrong,
                  !isSelected && styles.btnNeutral,
                ]}
                onPress={() => handleAnswer(opt)}
                activeOpacity={0.8}
                disabled={!!selected}
              >
                <Text style={styles.wordBtnText}>{opt.word}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FeedbackOverlay
        visible={showFeedback}
        isCorrect={isCorrect}
        correctAnswer={!isCorrect ? round.correct.word : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: fontSize.xl, color: colors.primary },
  roundText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textLight },
  scoreText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: radius.full,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  instruction: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  emojiLarge: { fontSize: 120 },
  tapHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  options: {
    width: '100%',
    gap: spacing.md,
  },
  wordBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  btnNeutral: { backgroundColor: colors.card },
  btnCorrect: { backgroundColor: colors.success },
  btnWrong: { backgroundColor: colors.danger },
  wordBtnText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    letterSpacing: 0.5,
  },
  // Result
  result: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  resultEmoji: { fontSize: 80 },
  resultTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, color: colors.text },
  resultScore: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textLight,
    textAlign: 'center',
  },
  resultMsg: {
    fontSize: fontSize.md,
    color: colors.purple,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
});
