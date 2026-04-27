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
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/types';
import type { Profile } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSelect'>;

export function ProfileSelectScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { profiles, setCurrentProfile } = useApp();

  const handleSelect = (profile: Profile) => {
    setCurrentProfile(profile);
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('profile.selectTitle')}</Text>

        <FlatList
          data={profiles}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, shadow.md]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.8}
            >
              <Text style={styles.avatar}>{item.avatar}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={() => (
            <TouchableOpacity
              style={[styles.card, styles.addCard, shadow.md]}
              onPress={() => navigation.navigate('CreateProfile')}
              activeOpacity={0.8}
            >
              <Text style={styles.addIcon}>＋</Text>
              <Text style={[styles.name, { color: colors.primary }]}>
                {t('profile.addNew')}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingTop: spacing.xxl },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  row: { gap: spacing.md, justifyContent: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    width: 150,
    gap: spacing.sm,
  },
  avatar: { fontSize: 56 },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  addCard: {
    borderWidth: 2.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  addIcon: {
    fontSize: 44,
    color: colors.primary,
    fontWeight: fontWeight.light,
  },
});
