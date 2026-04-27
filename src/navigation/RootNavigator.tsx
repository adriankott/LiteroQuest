import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { AlphabetScreen } from '../screens/Alphabet/AlphabetScreen';
import { LetterDetailScreen } from '../screens/Alphabet/LetterDetailScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { PhonicsGameScreen } from '../screens/Phonics/PhonicsGameScreen';
import { CreateProfileScreen } from '../screens/Profile/CreateProfileScreen';
import { ProfileSelectScreen } from '../screens/Profile/ProfileSelectScreen';
import { ProgressScreen } from '../screens/Progress/ProgressScreen';
import { WelcomeScreen } from '../screens/Welcome/WelcomeScreen';
import { WordsGameScreen } from '../screens/Words/WordsGameScreen';
import { colors } from '../constants/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isLoading, profiles, currentProfile } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initialRoute = (): keyof RootStackParamList => {
    if (profiles.length === 0) return 'Welcome';
    if (!currentProfile) return 'ProfileSelect';
    return 'Home';
  };

  return (
    <Stack.Navigator
      initialRouteName={initialRoute()}
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="ProfileSelect" component={ProfileSelectScreen} />
      <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Alphabet" component={AlphabetScreen} />
      <Stack.Screen name="LetterDetail" component={LetterDetailScreen} />
      <Stack.Screen name="Phonics" component={PhonicsGameScreen} />
      <Stack.Screen name="Words" component={WordsGameScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
    </Stack.Navigator>
  );
}
