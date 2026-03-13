import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { WeekProvider } from '@/components/WeekContext';
import { initApp } from '@/packages/services/init';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/about` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      initApp()
        .then(() => setDbReady(true))
        .catch((err: Error) => setDbError(err));
    }
  }, [loaded]);

  useEffect(() => {
    if (dbError) {
      throw dbError;
    }
  }, [dbError]);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbReady]);

  if (!loaded || !dbReady) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WeekProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="lesson/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ presentation: 'modal', title: 'About' }} />
        </Stack>
      </WeekProvider>
    </ThemeProvider>
  );
}
