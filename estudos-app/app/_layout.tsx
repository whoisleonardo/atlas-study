import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../src/constants/design';
import { initDb } from '../src/services/db';
import { sync } from '../src/services/sync';
import { requestPermissions, rescheduleAll } from '../src/services/notifications';
import { getUser, isOnboarded, isLoggedIn, applyRememberPolicy } from '../src/hooks/useUser';
import { loadLanguage } from '../src/hooks/useLanguage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function bootstrap() {
      await loadLanguage();
      await initDb();
      await applyRememberPolicy();

      const user = await getUser();
      const loggedIn = await isLoggedIn();
      if (!user || !loggedIn) {
        await SplashScreen.hideAsync();
        setReady(true);
        router.replace('/auth/login');
        return;
      }

      const onboarded = await isOnboarded();
      if (!onboarded) {
        await SplashScreen.hideAsync();
        setReady(true);
        router.replace('/onboarding');
        return;
      }

      if (Platform.OS !== 'web') await requestPermissions();
      try {
        await sync();
        if (Platform.OS !== 'web') await rescheduleAll();
      } catch {
      }

      await SplashScreen.hideAsync();
      setReady(true);
    }
    bootstrap();
  }, []);

  if (!fontsLoaded || !ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="topico/[id]"
        options={{
          headerShown: true,
          title: '',
          headerBackTitle: 'Topics',
          headerTintColor: Colors.clay,
          headerStyle: { backgroundColor: Colors.bone },
        }}
      />
      <Stack.Screen
        name="item/[id]"
        options={{
          headerShown: true,
          title: '',
          headerTintColor: Colors.clay,
          headerStyle: { backgroundColor: Colors.bone },
        }}
      />
    </Stack>
  );
}
