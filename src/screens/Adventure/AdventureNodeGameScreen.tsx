import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedbackOverlay } from '../../components/game/FeedbackOverlay';
import { StarRating } from '../../components/common/StarRating';
import { NODE_COLORS, NODE_EMOJIS, NODE_ROUND_COUNTS } from '../../constants/adventure';
import { getAlphabet } from '../../constants/alphabet';
import { getWords, pickDistractors, shuffleArray } from '../../constants/words';
import { completeAdventureNode } from '../../database/adventureQueries';
import { useApp } from '../../context/AppContext';
import { useSound } from '../../hooks/useSound';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { AlphabetLetter, Word } from '../../types';
import type { NodeType } from '../../types/adventure';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdventureNode'>;

// ─── Round types ──────────────────────────────────────────────────────────────

type PhonicsRound = {
  kind: 'phonics';
  word: string;
  emoji: string;
  correctLetter: string;
  options: string[];
};

type WordsRound = {
  kind: 'words';
  word: string;
  emoji: string;
  wordOptions: string[];
};

type AlphabetRound = {
  kind: 'alphabet';
  letter: string;
  phonetic: string;
  color: string;
  correctWord: string;
  correctEmoji: string;
  options: { word: string; emoji: string }[];
};

type GameRound = PhonicsRound | WordsRound | AlphabetRound;

// ─── Round builders ───────────────────────────────────────────────────────────

function buildPhonicsRound(word: Word, allLetters: AlphabetLetter[]): PhonicsRound {
  const correct = word.word[0].toUpperCase();
  const letterPool = allLetters.map((l) => l.letter).filter((l) => l !== correct && l.length === 1);
  const distractors = pickDistractors(letterPool, correct, 3);
  return {
    kind: 'phonics',
    word: word.word,
    emoji: word.emoji,
    correctLetter: correct,
    options: shuffleArray([correct, ...distractors]),
  };
}

function buildWordsRound(word: Word, pool: Word[]): WordsRound {
  const distractors = pickDistractors(
    pool.filter((w) => w.word !== word.word).map((w) => w.word),
    word.word,
    2,
  );
  return {
    kind: 'words',
    word: word.word,
    emoji: word.emoji,
    wordOptions: shuffleArray([word.word, ...distractors]),
  };
}

function buildAlphabetRound(letter: AlphabetLetter, pool: Word[]): AlphabetRound {
  const startingWords = pool.filter((w) => w.word[0].toUpperCase() === letter.letter);
  const correct = startingWords.length > 0
    ? shuffleArray(startingWords)[0]
    : pool.find((w) => w.word[0].toUpperCase() === letter.example[0].toUpperCase()) ?? pool[0];

  const distractors = shuffleArray(
    pool.filter((w) => w.word[0].toUpperCase() !== letter.letter),
  ).slice(0, 2);

  const options = shuffleArray([
    { word: correct.word, emoji: correct.emoji },
    ...distractors.map((w) => ({ word: w.word, emoji: w.emoji })),
  ]);

  return {
    kind: 'alphabet',
    letter: letter.letter,
    phonetic: letter.phonetic,
    color: letter.color,
    correctWord: correct.word,
    correctEmoji: correct.emoji,
    options,
  };
}

function buildRounds(nodeType: NodeType, difficulty: 1 | 2 | 3, language: string): GameRound[] {
  const allWords = getWords(language);
  const filtered = allWords.filter((w) => w.difficulty <= difficulty);
  const pool = filtered.length >= 6 ? filtered : allWords;
  const alphabet = getAlphabet(language);
  const count = NODE_ROUND_COUNTS[nodeType];

  const shuffledWords = shuffleArray(pool);
  const shuffledLetters = shuffleArray(alphabet);

  switch (nodeType) {
    case 'phonics':
      return shuffledWords.slice(0, count).map((w) => buildPhonicsRound(w, alphabet));

    case 'words':
      return shuffledWords.slice(0, count).map((w) => buildWordsRound(w, pool));

    case 'alphabet':
      return shuffledLetters.slice(0, count).map((l) => buildAlphabetRound(l, pool));

    case 'elite':
      // Elite: harder words-only rounds (ignore difficulty filter, use full pool)
      return shuffleArray(allWords).slice(0, count).map((w) => buildWordsRound(w, allWords));

    case 'boss': {
      const half = count / 2;
      const phonicsRounds = shuffledWords.slice(0, half).map((w) => buildPhonicsRound(w, alphabet));
      const wordsRounds = shuffledWords.slice(half, count).map((w) => buildWordsRound(w, pool));
      return shuffleArray([...phonicsRounds, ...wordsRounds]);
    }

    default:
      return [];
  }
}

function calcStars(score: number, total: number): number {
  if (total === 0) return 3;
  const pct = score / total;
  if (pct === 1) return 3;
  if (pct >= 0.7) return 2;
  if (pct >= 0.4) return 1;
  return 0;
}

// ─── Special screens ──────────────────────────────────────────────────────────

function TreasureScreen({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, damping: 6, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={specialStyles.safe}>
      <View style={specialStyles.body}>
        <Animated.Text style={[specialStyles.hero, { transform: [{ scale: scaleAnim }] }]}>⭐</Animated.Text>
        <Text style={specialStyles.title}>{t('adventure.treasureTitle')}</Text>
        <Text style={specialStyles.msg}>{t('adventure.treasureMsg')}</Text>
        <StarRating stars={3} size="lg" />
        <TouchableOpacity style={specialStyles.btn} onPress={onContinue} activeOpacity={0.85}>
          <Text style={specialStyles.btnText}>{t('adventure.goMap')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function RestScreen({ onContinue }: { onContinue: () => void }) {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={specialStyles.safe}>
      <View style={specialStyles.body}>
        <Text style={specialStyles.hero}>💤</Text>
        <Text style={specialStyles.title}>{t('adventure.restTitle')}</Text>
        <Text style={specialStyles.msg}>{t('adventure.restMsg')}</Text>
        <TouchableOpacity style={specialStyles.btn} onPress={onContinue} activeOpacity={0.85}>
          <Text style={specialStyles.btnText}>{t('adventure.goMap')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const specialStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A1A2E' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  hero: { fontSize: 100 },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, color: '#fff', textAlign: 'center' },
  msg: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 22 },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    marginTop: spacing.md,
    ...shadow.lg,
  },
  btnText: { fontSize: fontSize.lg, fontWeight: fontWeight.heavy, color: colors.text },
});

// ─── Result screen ─────────────────────────────────────────────────────────────

interface ResultProps {
  stars: number;
  score: number;
  total: number;
  floor: number;
  nodeType: NodeType;
  onContinue: () => void;
}

function ResultScreen({ stars, score, total, floor, nodeType, onContinue }: ResultProps) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, damping: 7, useNativeDriver: true }).start();
  }, []);

  const emoji = stars === 3 ? '🏆' : stars === 2 ? '🌟' : stars === 1 ? '👍' : '💪';
  const msg =
    stars === 3
      ? t('adventure.perfect')
      : stars === 2
        ? t('adventure.great')
        : stars >= 1
          ? t('adventure.good')
          : t('adventure.tryAgain');

  return (
    <SafeAreaView style={resultStyles.safe}>
      <View style={resultStyles.body}>
        <Animated.Text style={[resultStyles.emoji, { transform: [{ scale: scaleAnim }] }]}>
          {emoji}
        </Animated.Text>
        <Text style={resultStyles.floorText}>
          {t('adventure.floorComplete', { floor: floor + 1 })}
        </Text>
        <Text style={resultStyles.nodeType}>
          {NODE_EMOJIS[nodeType]} {t(`adventure.node_${nodeType}`)}
        </Text>
        <StarRating stars={stars} size="lg" />
        <Text style={resultStyles.scoreText}>
          {t('adventure.score', { score, total })}
        </Text>
        <Text style={resultStyles.msg}>{msg}</Text>
        <TouchableOpacity style={resultStyles.btn} onPress={onContinue} activeOpacity={0.85}>
          <Text style={resultStyles.btnText}>{t('adventure.goMap')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const resultStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1A1A2E' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  emoji: { fontSize: 90 },
  floorText: { fontSize: fontSize.xl, fontWeight: fontWeight.heavy, color: '#fff', textAlign: 'center' },
  nodeType: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.6)', fontWeight: fontWeight.semibold },
  scoreText: { fontSize: fontSize.lg, color: 'rgba(255,255,255,0.75)', fontWeight: fontWeight.semibold },
  msg: { fontSize: fontSize.md, color: colors.accent, fontWeight: fontWeight.bold, textAlign: 'center' },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
    ...shadow.lg,
  },
  btnText: { fontSize: fontSize.lg, fontWeight: fontWeight.heavy, color: colors.text },
});

// ─── Game screen ──────────────────────────────────────────────────────────────

export function AdventureNodeGameScreen({ navigation, route }: Props) {
  const { runId, nodeId, nodeType, difficulty, floor } = route.params;
  const { t } = useTranslation();
  const { language } = useApp();
  const { speak } = useSound();

  const [rounds] = useState<GameRound[]>(() =>
    nodeType === 'treasure' || nodeType === 'rest' ? [] : buildRounds(nodeType, difficulty, language),
  );
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [phase, setPhase] = useState<'playing' | 'result'>('playing');
  const [finalStars, setFinalStars] = useState(0);
  const [saving, setSaving] = useState(false);

  const emojiScale = useRef(new Animated.Value(1)).current;
  const total = rounds.length;
  const round = rounds[current];

  useEffect(() => {
    if (round?.kind === 'phonics') setTimeout(() => speak(round.word), 300);
    if (round?.kind === 'words') setTimeout(() => speak(round.word), 300);
    if (round?.kind === 'alphabet') setTimeout(() => speak(round.letter), 300);
  }, [current]);

  const animEmoji = () => {
    Animated.sequence([
      Animated.spring(emojiScale, { toValue: 1.35, damping: 5, useNativeDriver: true }),
      Animated.spring(emojiScale, { toValue: 1, damping: 10, useNativeDriver: true }),
    ]).start();
  };

  const finishRound = useCallback(
    async (correct: boolean) => {
      const finalScore = correct ? score + 1 : score;
      if (current + 1 >= total) {
        const stars = calcStars(finalScore, total);
        setFinalStars(stars);
        setScore(finalScore);
        setSaving(true);
        await completeAdventureNode(runId, nodeId, stars);
        setSaving(false);
        setPhase('result');
      } else {
        setCurrent((c) => c + 1);
      }
    },
    [current, score, total, runId, nodeId],
  );

  const handleAnswer = useCallback(
    async (answer: string, correctAnswer: string) => {
      if (selected || saving) return;
      const correct = answer === correctAnswer;
      setSelected(answer);
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
        finishRound(correct);
      }, 1200);
    },
    [selected, saving, finishRound],
  );

  const handleSpecialComplete = async (stars: number) => {
    setSaving(true);
    await completeAdventureNode(runId, nodeId, stars);
    setSaving(false);
    navigation.goBack();
  };

  // Special nodes
  if (nodeType === 'treasure') {
    return <TreasureScreen onContinue={() => handleSpecialComplete(3)} />;
  }
  if (nodeType === 'rest') {
    return <RestScreen onContinue={() => handleSpecialComplete(1)} />;
  }

  // Result phase
  if (phase === 'result') {
    return (
      <ResultScreen
        stars={finalStars}
        score={score}
        total={total}
        floor={floor}
        nodeType={nodeType}
        onContinue={() => navigation.goBack()}
      />
    );
  }

  if (!round) return null;

  const nodeColor = NODE_COLORS[nodeType];
  const progressPct = (current / total) * 100;

  return (
    <SafeAreaView style={[gameStyles.safe, { backgroundColor: '#1A1A2E' }]}>
      {/* Header */}
      <View style={gameStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={gameStyles.backBtn}>
          <Text style={gameStyles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={gameStyles.headerCenter}>
          <Text style={[gameStyles.nodeLabel, { color: nodeColor }]}>
            {NODE_EMOJIS[nodeType]} {t(`adventure.node_${nodeType}`)}
          </Text>
          <Text style={gameStyles.roundLabel}>
            {t('adventure.round', { current: current + 1, total })}
          </Text>
        </View>
        <Text style={gameStyles.scoreLabel}>⭐ {score}</Text>
      </View>

      {/* Progress bar */}
      <View style={gameStyles.progressBar}>
        <View style={[gameStyles.progressFill, { width: `${progressPct}%`, backgroundColor: nodeColor }]} />
      </View>

      {/* Body */}
      <ScrollView
        contentContainerStyle={gameStyles.body}
        scrollEnabled={false}
        keyboardShouldPersistTaps="handled"
      >
        {round.kind === 'phonics' && (
          <PhonicsRoundView round={round} selected={selected} onAnswer={handleAnswer} emojiScale={emojiScale} speak={speak} t={t} />
        )}
        {round.kind === 'words' && (
          <WordsRoundView round={round} selected={selected} onAnswer={handleAnswer} emojiScale={emojiScale} speak={speak} t={t} />
        )}
        {round.kind === 'alphabet' && (
          <AlphabetRoundView round={round} selected={selected} onAnswer={handleAnswer} emojiScale={emojiScale} speak={speak} t={t} />
        )}
      </ScrollView>

      <FeedbackOverlay
        visible={showFeedback}
        isCorrect={isCorrect}
        correctAnswer={
          !isCorrect
            ? round.kind === 'phonics'
              ? round.correctLetter
              : round.kind === 'words'
                ? round.word
                : round.correctWord
            : undefined
        }
      />
    </SafeAreaView>
  );
}

// ─── Round view components ─────────────────────────────────────────────────────

interface PhonicsRoundViewProps {
  round: PhonicsRound;
  selected: string | null;
  onAnswer: (answer: string, correct: string) => void;
  emojiScale: Animated.Value;
  speak: (text: string) => void;
  t: (key: string) => string;
}

function PhonicsRoundView({ round, selected, onAnswer, emojiScale, speak, t }: PhonicsRoundViewProps) {
  return (
    <>
      <Text style={gameStyles.instruction}>{t('adventure.phonicsInstruction')}</Text>
      <TouchableOpacity onPress={() => speak(round.word)} activeOpacity={0.8}>
        <Animated.Text style={[gameStyles.emojiLarge, { transform: [{ scale: emojiScale }] }]}>
          {round.emoji}
        </Animated.Text>
      </TouchableOpacity>
      <View style={gameStyles.optionsGrid}>
        {round.options.map((letter) => {
          const isSel = selected === letter;
          const isRight = isSel && letter === round.correctLetter;
          const isWrong = isSel && letter !== round.correctLetter;
          return (
            <TouchableOpacity
              key={letter}
              style={[gameStyles.letterBtn, shadow.md, isRight && gameStyles.btnCorrect, isWrong && gameStyles.btnWrong, !isSel && gameStyles.btnNeutral]}
              onPress={() => onAnswer(letter, round.correctLetter)}
              disabled={!!selected}
              activeOpacity={0.8}
            >
              <Text style={gameStyles.letterBtnText}>{letter}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

interface WordsRoundViewProps {
  round: WordsRound;
  selected: string | null;
  onAnswer: (answer: string, correct: string) => void;
  emojiScale: Animated.Value;
  speak: (text: string) => void;
  t: (key: string) => string;
}

function WordsRoundView({ round, selected, onAnswer, emojiScale, speak, t }: WordsRoundViewProps) {
  return (
    <>
      <Text style={gameStyles.instruction}>{t('adventure.wordsInstruction')}</Text>
      <TouchableOpacity onPress={() => speak(round.word)} activeOpacity={0.8}>
        <Animated.Text style={[gameStyles.emojiLarge, { transform: [{ scale: emojiScale }] }]}>
          {round.emoji}
        </Animated.Text>
      </TouchableOpacity>
      <View style={gameStyles.wordOptionsCol}>
        {round.wordOptions.map((word) => {
          const isSel = selected === word;
          const isRight = isSel && word === round.word;
          const isWrong = isSel && word !== round.word;
          return (
            <TouchableOpacity
              key={word}
              style={[gameStyles.wordBtn, shadow.md, isRight && gameStyles.btnCorrect, isWrong && gameStyles.btnWrong, !isSel && gameStyles.btnNeutral]}
              onPress={() => onAnswer(word, round.word)}
              disabled={!!selected}
              activeOpacity={0.8}
            >
              <Text style={gameStyles.wordBtnText}>{word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

interface AlphabetRoundViewProps {
  round: AlphabetRound;
  selected: string | null;
  onAnswer: (answer: string, correct: string) => void;
  emojiScale: Animated.Value;
  speak: (text: string) => void;
  t: (key: string) => string;
}

function AlphabetRoundView({ round, selected, onAnswer, emojiScale, speak, t }: AlphabetRoundViewProps) {
  return (
    <>
      <Text style={gameStyles.instruction}>{t('adventure.alphabetInstruction')}</Text>
      <TouchableOpacity onPress={() => speak(round.letter)} activeOpacity={0.8}>
        <Animated.View style={[gameStyles.bigLetterWrap, { borderColor: round.color, transform: [{ scale: emojiScale }] }]}>
          <Text style={[gameStyles.bigLetter, { color: round.color }]}>{round.letter}</Text>
          <Text style={gameStyles.phonetic}>{round.phonetic}</Text>
        </Animated.View>
      </TouchableOpacity>
      <View style={gameStyles.wordOptionsCol}>
        {round.options.map(({ word, emoji }) => {
          const isSel = selected === word;
          const isRight = isSel && word === round.correctWord;
          const isWrong = isSel && word !== round.correctWord;
          return (
            <TouchableOpacity
              key={word}
              style={[gameStyles.wordBtn, shadow.md, isRight && gameStyles.btnCorrect, isWrong && gameStyles.btnWrong, !isSel && gameStyles.btnNeutral]}
              onPress={() => onAnswer(word, round.correctWord)}
              disabled={!!selected}
              activeOpacity={0.8}
            >
              <Text style={gameStyles.wordBtnEmoji}>{emoji}</Text>
              <Text style={gameStyles.wordBtnText}>{word}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

const gameStyles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: fontSize.xl, color: 'rgba(255,255,255,0.7)' },
  headerCenter: { flex: 1, alignItems: 'center' },
  nodeLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  roundLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  scoreLabel: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.accent },

  progressBar: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: spacing.lg,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },

  body: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: '90%',
  },

  instruction: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#fff',
    textAlign: 'center',
  },
  emojiLarge: { fontSize: 110 },

  // Phonics letter options (2x2 grid)
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    width: '100%',
  },
  letterBtn: {
    width: 130,
    height: 76,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterBtnText: { fontSize: fontSize.xl + 4, fontWeight: fontWeight.heavy, color: colors.text },

  // Word options (vertical stack)
  wordOptionsCol: { width: '100%', gap: spacing.md },
  wordBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  wordBtnEmoji: { fontSize: 28 },
  wordBtnText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },

  // Alphabet big letter
  bigLetterWrap: {
    width: 130,
    height: 130,
    borderRadius: radius.xl,
    borderWidth: 3,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  bigLetter: { fontSize: 72, fontWeight: fontWeight.heavy },
  phonetic: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.6)', fontWeight: fontWeight.semibold },

  btnNeutral: { backgroundColor: colors.card },
  btnCorrect: { backgroundColor: colors.success },
  btnWrong: { backgroundColor: colors.danger },
});
