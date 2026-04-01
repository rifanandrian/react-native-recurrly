import '@/global.css';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

const hasPublishableKey = publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_');

export default function RootLayout() {
  const [ fontsLoaded ] = useFonts({
    "sans-regular": require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    "sans-medium": require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    "sans-semibold": require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    "sans-bold": require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    "sans-extrabold": require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    "sans-light": require('../assets/fonts/PlusJakartaSans-Light.ttf')
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  if (!hasPublishableKey) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-center text-2xl font-sans-bold text-primary">Clerk key missing</Text>
        <Text className="mt-3 text-center text-sm font-sans-medium leading-6 text-muted-foreground">
          Add a valid EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file, then reload the app.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <StatusBar style="dark" backgroundColor="#FFF9E3" />
      <Stack screenOptions={{headerShown: false}} />
    </ClerkProvider>
  );
}
