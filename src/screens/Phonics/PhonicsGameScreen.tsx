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
import { getAlphabet } from '../../constants/alphabet';
import { getWords, pickDistractors, shuffleArray } from '../../constants/words';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/types';
import { TOTAL_ROUNDS } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Phonics'>;

interface Round {
  word: string;
  emoji: string;
  correctLetter: string;
  options: string[];
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
  const alphabet = getAlphabet(language);
  const allLetters = alphabet.map((a) => a.letter);

  return shuffleArray(words)
    .slice(0, TOTAL_ROUNDS)
    .map((w) => {
      const correct = w.word[0].toUpperCase();
      const distractors = pickDistractors(
        allLetters.filter((l) => l !== correct && l.length === 1),
        correct,
        3,
      );
      return {
        word: w.word,
        emoji: w.emoji,
        correctLetter: correct,
        options: shuffleArray([correct, ...distractors]),
      };
    });
}

export function PhonicsGameScreen({ navigation }: Props) {
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
      setTimeout(() => speak(round.word), 300);
    }
  }, [current]);

  const animEmoji = () => {
    Animated.sequence([
      Animated.spring(emojiScale, { toValue: 1.3, damping: 6, useNativeDriver: true }),
      Animated.spring(emojiScale, { toValue: 1, damping: 10, useNativeDriver: true }),
    ]).start();
  };

  const emojiStyle = { transform: [{ scale: emojiScale }] };

  const handleAnswer = useCallback(
    async (letter: string) => {
      if (selected) return;
      const correct = letter === round.correctLetter;
      setSelected(letter);
      setIsCorrect(correct);
      setShowFeedback(true);
      animEmoji();

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
          saveProgress('phonics', 'session', s);
        } else {
          setCurrent((c) => c + 1);
        }
      }, 1200);
    },
    [selected, round, current, score],
  );

  if (phase === 'result') {
    const msg =
      stars === 3
        ? t('phonics.perfect')
        : stars === 2
          ? t('phonics.great')
          : stars >= 1
            ? t('phonics.good')
            : t('phonics.tryAgain');

    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.result}>
          <Text style={styles.resultEmoji}>{stars >= 2 ? '🏆' : stars === 1 ? '👍' : '💪'}</Text>
          <Text style={styles.resultTitle}>{t('phonics.resultTitle')}</Text>
          <StarRating stars={stars} size="lg" />
          <Text style={styles.resultScore}>
            {t('phonics.resultScore', { score, total: TOTAL_ROUNDS })}
          </Text>
          <Text style={styles.resultMsg}>{msg}</Text>
          <Button label={t('phonics.playAgain')} onPress={() => navigation.replace('Phonics')} />
          <Button
            label={t('phonics.goHome')}
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
          {t('phonics.round', { current: current + 1, total: TOTAL_ROUNDS })}
        </Text>
        <Text style={styles.scoreText}>⭐ {score}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${((current) / TOTAL_ROUNDS) * 100}%` }]}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.instruction}>{t('phonics.instruction')}</Text>

        {/* Emoji + speak button */}
        <TouchableOpacity onPress={() => speak(round.word)} activeOpacity={0.8}>
          <Animated.Text style={[styles.emojiLarge, emojiStyle]}>{round.emoji}</Animated.Text>
        </TouchableOpacity>

        {/* Letter options */}
        <View style={styles.optionsGrid}>
          {round.options.map((letter) => {
            const isSelected = selected === letter;
            const isRight = isSelected && letter === round.correctLetter;
            const isWrong = isSelected && letter !== round.correctLetter;
            return (
              <TouchableOpacity
                key={letter}
                style={[
                  styles.letterBtn,
                  shadow.md,
                  isRight && styles.btnCorrect,
                  isWrong && styles.btnWrong,
                  !isSelected && styles.btnNeutral,
                ]}
                onPress={() => handleAnswer(letter)}
                activeOpacity={0.8}
                disabled={!!selected}
              >
                <Text style={styles.letterBtnText}>{letter}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FeedbackOverlay
        visible={showFeedback}
        isCorrect={isCorrect}
        correctAnswer={!isCorrect ? round.correctLetter : undefined}
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
    backgroundColor: colors.secondary,
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    width: '100%',
  },
  letterBtn: {
    width: 130,
    height: 80,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNeutral: { backgroundColor: colors.card },
  btnCorrect: { backgroundColor: colors.success },
  btnWrong: { backgroundColor: colors.danger },
  letterBtnText: {
    fontSize: fontSize.xl + 4,
    fontWeight: fontWeight.heavy,
    color: colors.text,
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
  resultTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
  },
  resultScore: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textLight,
    textAlign: 'center',
  },
  resultMsg: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
});
