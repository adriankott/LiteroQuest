import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../../context/AppContext';
import { useProgress } from '../../hooks/useProgress';
import { getAlphabet } from '../../constants/alphabet';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Alphabet'>;

const NUM_COLS = 4;

export function AlphabetScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { language, currentProfile } = useApp();
  const { isLearned, learnedCount } = useProgress(currentProfile?.id);
  const alphabet = getAlphabet(language);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{t('alphabet.title')}</Text>
          <Text style={styles.subtitle}>
            {t('alphabet.learned')} {learnedCount('alphabet')}/{alphabet.length}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.hint}>{t('alphabet.subtitle')}</Text>

      <FlatList
        data={alphabet}
        keyExtractor={(item) => item.letter}
        numColumns={NUM_COLS}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => {
          const learned = isLearned(`letter_${item.letter}`);
          return (
            <TouchableOpacity
              style={[styles.cell, { backgroundColor: item.color }, shadow.sm]}
              onPress={() => navigation.navigate('LetterDetail', { letterIndex: index })}
              activeOpacity={0.8}
            >
              <Text style={styles.letter}>{item.letter}</Text>
              <Text style={styles.emoji}>{item.emoji}</Text>
              {learned && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: fontSize.xl, color: colors.primary },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textLight,
    fontWeight: fontWeight.medium,
  },
  hint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  row: { gap: spacing.sm, justifyContent: 'space-between' },
  cell: {
    borderRadius: radius.md,
    flex: 1,
    aspectRatio: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    gap: 2,
  },
  letter: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emoji: { fontSize: fontSize.md },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.success,
    borderRadius: radius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: fontWeight.heavy,
  },
});
