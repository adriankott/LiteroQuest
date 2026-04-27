import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
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
import { useProgress } from '../../hooks/useProgress';
import { useSound } from '../../hooks/useSound';
import { getAlphabet } from '../../constants/alphabet';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LetterDetail'>;

export function LetterDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { language, currentProfile } = useApp();
  const { speak } = useSound();
  const { isLearned, saveProgress } = useProgress(currentProfile?.id);

  const alphabet = getAlphabet(language);
  const { letterIndex } = route.params;
  const letter = alphabet[letterIndex];

  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, damping: 10, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
    // Auto-speak the letter on arrival
    setTimeout(() => speak(letter.phonetic), 400);
  }, []);

  const learned = isLearned(`letter_${letter.letter}`);

  const handleLearnedIt = async () => {
    await saveProgress('alphabet', `letter_${letter.letter}`, 1);
    navigation.goBack();
  };

  const goToNext = () => {
    if (letterIndex < alphabet.length - 1) {
      navigation.replace('LetterDetail', { letterIndex: letterIndex + 1 });
    }
  };

  const goToPrev = () => {
    if (letterIndex > 0) {
      navigation.replace('LetterDetail', { letterIndex: letterIndex - 1 });
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: letter.color + '18' }]}>
      {/* Nav row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.navBtn}
        >
          <Text style={styles.navIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>
          {letterIndex + 1} / {alphabet.length}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Letter card */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: letter.color },
          shadow.lg,
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        ]}
      >
        <Text style={styles.bigLetter}>{letter.letter}</Text>
        <Text style={styles.bigEmoji}>{letter.emoji}</Text>
      </Animated.View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.label}>{t('letterDetail.exampleWord')}</Text>
        <Text style={styles.exampleWord}>{letter.example}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <View style={styles.soundRow}>
          <TouchableOpacity
            style={[styles.soundBtn, shadow.sm, { backgroundColor: letter.color }]}
            onPress={() => speak(letter.phonetic)}
          >
            <Text style={styles.soundIcon}>🔊</Text>
            <Text style={styles.soundLabel}>{t('letterDetail.hearLetter')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.soundBtn, shadow.sm, { backgroundColor: colors.secondary }]}
            onPress={() => speak(letter.example)}
          >
            <Text style={styles.soundIcon}>🗣️</Text>
            <Text style={styles.soundLabel}>{t('letterDetail.hearWord')}</Text>
          </TouchableOpacity>
        </View>

        <Button
          label={learned ? t('letterDetail.alreadyLearned') : t('letterDetail.learnedIt')}
          onPress={handleLearnedIt}
          style={[styles.learnBtn, learned && { backgroundColor: colors.successDark }]}
        />
      </View>

      {/* Prev / Next */}
      <View style={styles.arrowRow}>
        <TouchableOpacity
          onPress={goToPrev}
          disabled={letterIndex === 0}
          style={[styles.arrowBtn, letterIndex === 0 && styles.arrowDisabled]}
        >
          <Text style={styles.arrowText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goToNext}
          disabled={letterIndex === alphabet.length - 1}
          style={[styles.arrowBtn, letterIndex === alphabet.length - 1 && styles.arrowDisabled]}
        >
          <Text style={styles.arrowText}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: { fontSize: fontSize.lg, color: colors.textLight },
  counter: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textLight,
  },
  card: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    width: 220,
    height: 220,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bigLetter: {
    fontSize: 100,
    fontWeight: fontWeight.heavy,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bigEmoji: { fontSize: 40 },
  info: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  exampleWord: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  soundRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  soundBtn: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  soundIcon: { fontSize: fontSize.xl },
  soundLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#fff',
    textAlign: 'center',
  },
  learnBtn: { width: '100%' },
  arrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  arrowBtn: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  arrowDisabled: { opacity: 0.3 },
  arrowText: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
