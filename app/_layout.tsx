import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { palette } from '@/theme';
import { useMessaging } from '@/lib/messaging';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { MasterDataProvider } from '@/context/MasterDataContext';
import { AlertDialog, AlertDialogHost, ToastHost } from '@/components/ui';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(palette.bg).catch(() => {});

/** Bounces to login only on an authenticated → unauthenticated transition (session died mid-app). */
function SessionRedirect() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (status === 'authenticated') wasAuthenticated.current = true;
    if (status === 'unauthenticated' && wasAuthenticated.current && segments[0] !== '(auth)') {
      wasAuthenticated.current = false;
      router.replace('/(auth)/login');
    }
  }, [status, segments, router]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useMessaging();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <MasterDataProvider>
            <StatusBar style="dark" />
            <SessionRedirect />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: palette.bg },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" options={{ animation: 'fade' }} />
              <Stack.Screen name="intro" options={{ animation: 'fade' }} />
              <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
              <Stack.Screen name="landing" options={{ animation: 'fade' }} />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
              <Stack.Screen name="search" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="location" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
              <Stack.Screen name="pass" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack>
            <AlertDialog />
            <AlertDialogHost />
            <ToastHost />
          </MasterDataProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
