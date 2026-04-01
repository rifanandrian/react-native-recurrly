import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from "expo-router";

export default function RootLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Stack screenOptions={{headerShown: false}} />;
}
