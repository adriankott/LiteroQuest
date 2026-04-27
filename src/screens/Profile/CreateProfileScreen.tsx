import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/common/Button';
import { useApp } from '../../context/AppContext';
import { createProfile } from '../../database/queries';
import { colors, fontSize, fontWeight, radius, shadow, spacing } from '../../constants/theme';
import type { RootStackParamList } from '../../navigation/types';
import { AVATARS } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateProfile'>;

export function CreateProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { language, setCurrentProfile, refreshProfiles } = useApp();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('', t('profile.nameRequired'));
      return;
    }
    setLoading(true);
    try {
      const id = await createProfile(name.trim(), selectedAvatar, language);
      await refreshProfiles();
      setCurrentProfile({ id, name: name.trim(), avatar: selectedAvatar, language, created_at: Date.now() });
      navigation.replace('Home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('profile.createTitle')}</Text>

          <View style={[styles.inputWrapper, shadow.sm]}>
            <TextInput
              style={styles.input}
              placeholder={t('profile.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={20}
              autoFocus
            />
          </View>

          <Text style={styles.sectionLabel}>{t('profile.chooseAvatar')}</Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map((av) => (
              <TouchableOpacity
                key={av}
                style={[
                  styles.avatarBtn,
                  selectedAvatar === av && styles.avatarBtnActive,
                  shadow.sm,
                ]}
                onPress={() => setSelectedAvatar(av)}
                activeOpacity={0.8}
              >
                <Text style={styles.avatarEmoji}>{av}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label={t('profile.create')}
            size="lg"
            loading={loading}
            onPress={handleCreate}
            style={styles.btn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    gap: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
  },
  inputWrapper: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  input: {
    fontSize: fontSize.lg,
    color: colors.text,
    paddingVertical: spacing.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textLight,
    alignSelf: 'flex-start',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  avatarBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  avatarEmoji: { fontSize: 36 },
  btn: { width: '80%' },
});
